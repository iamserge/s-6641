import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDetailedDupeAnalysis } from "../services/perplexity.ts";
import { fetchProductDataFromExternalDb } from "../services/external-db.ts";
import { processAndUploadImage } from "../services/images.ts";
import { supabase } from "../shared/db-client.ts";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients.ts";
import { logInfo, logError, safeStringify } from "../shared/utils.ts";

/**
 * Store product offers and handle merchant relationships
 * @param productId The product ID to associate offers with
 * @param offers Array of offer objects
 * @returns Object with success status and counts
 */
async function storeProductOffers(productId, offers) {
  const results = {
    success: false,
    totalOffers: 0,
    processedOffers: 0,
    errors: []
  };

  if (!productId) {
    logError(`Cannot store offers: Invalid product ID: ${productId}`);
    results.errors.push('Invalid product ID');
    return results;
  }

  if (!offers || !Array.isArray(offers) || offers.length === 0) {
    logError(`Cannot store offers: Invalid or empty offers array for product ${productId}`);
    results.errors.push('Invalid or empty offers array');
    return results;
  }

  logInfo(`Storing ${offers.length} offers for product ${productId}`);
  results.totalOffers = offers.length;

  // Log first offer to help debugging
  if (offers.length > 0) {
    logInfo(`First offer sample: ${safeStringify(offers[0])}`);
  }

  // Process each offer
  for (const offer of offers) {
    try {
      if (!offer) {
        logError(`Null or undefined offer found in array for product ${productId}`);
        results.errors.push('Null offer in array');
        continue;
      }

      if (!offer.link) {
        logError(`Offer missing required 'link' field for product ${productId}: ${safeStringify(offer)}`);
        results.errors.push('Offer missing link field');
        continue;
      }

      if (!offer.price && offer.price !== 0) {
        logError(`Offer missing required 'price' field for product ${productId}: ${safeStringify(offer)}`);
        results.errors.push('Offer missing price field');
        continue;
      }

      // Store or update merchant
      let merchantId = null;

      if (offer.merchant) {
        // Validate that merchant is a non-empty string
        if (typeof offer.merchant !== 'string' || offer.merchant.trim() === '') {
          logError(`Invalid merchant name for product ${productId}: ${safeStringify(offer.merchant)}`);
          results.errors.push('Invalid merchant name');
          continue;
        }

        const merchantName = offer.merchant.trim();
        logInfo(`Processing merchant: ${merchantName} for product ${productId}`);

        try {
          // Check if merchant already exists
          const { data: existingMerchant, error: merchantQueryError } = await supabase
            .from('merchants')
            .select('id')
            .eq('name', merchantName)
            .single();

          if (merchantQueryError && merchantQueryError.code !== 'PGRST116') { // Not found error is OK
            logError(`Error fetching merchant ${merchantName}: ${safeStringify(merchantQueryError)}`);
            results.errors.push(`Error fetching merchant: ${merchantQueryError.message}`);
            continue;
          }

          if (existingMerchant) {
            merchantId = existingMerchant.id;
            logInfo(`Found existing merchant ${merchantName} with ID ${merchantId}`);

            // Update domain if provided
            if (offer.domain) {
              try {
                const { error: merchantUpdateError } = await supabase
                  .from('merchants')
                  .update({ domain: offer.domain })
                  .eq('id', merchantId);

                if (merchantUpdateError) {
                  logError(`Error updating merchant ${merchantName}: ${safeStringify(merchantUpdateError)}`);
                  results.errors.push(`Error updating merchant: ${merchantUpdateError.message}`);
                  // Proceed with existing merchantId despite update error
                } else {
                  logInfo(`Updated merchant ${merchantName} with domain ${offer.domain}`);
                }
              } catch (merchantUpdateException) {
                logError(`Exception updating merchant ${merchantName}: ${safeStringify(merchantUpdateException)}`);
                results.errors.push(`Exception updating merchant: ${merchantUpdateException.message}`);
                // Proceed with existing merchantId
              }
            }
          } else {
            // Create new merchant
            try {
              const { data: newMerchant, error: merchantInsertError } = await supabase
                .from('merchants')
                .insert({
                  name: merchantName,
                  domain: offer.domain || null,
                  logo_url: null // No logo information available
                })
                .select('id')
                .single();

              if (merchantInsertError) {
                logError(`Error creating merchant ${merchantName}: ${safeStringify(merchantInsertError)}`);
                results.errors.push(`Error creating merchant: ${merchantInsertError.message}`);
                continue;
              }

              if (!newMerchant || !newMerchant.id) {
                logError(`Failed to get ID for newly created merchant ${merchantName}`);
                results.errors.push('Failed to get new merchant ID');
                continue;
              }

              merchantId = newMerchant.id;
              logInfo(`Created new merchant ${merchantName} with ID ${merchantId}`);
            } catch (merchantInsertException) {
              logError(`Exception creating merchant ${merchantName}: ${safeStringify(merchantInsertException)}`);
              results.errors.push(`Exception creating merchant: ${merchantInsertException.message}`);
              continue;
            }
          }
        } catch (merchantException) {
          logError(`Exception processing merchant ${merchantName}: ${safeStringify(merchantException)}`);
          results.errors.push(`Exception processing merchant: ${merchantException.message}`);
          continue;
        }
      } else {
        logInfo(`No merchant information provided for offer on product ${productId}`);
      }

      // Store the offer
      try {
        const offerData = {
          merchant_id: merchantId, // Null if no merchant
          title: offer.title || null,
          price: offer.price,
          list_price: offer.list_price || null,
          currency: offer.currency || 'USD',
          condition: offer.condition || 'New',
          availability: offer.availability || null,
          shipping: offer.shipping || null,
          link: offer.link,
          updated_t: offer.updated_t || Math.floor(Date.now() / 1000)
        };

        logInfo(`Inserting offer with data: ${safeStringify(offerData)}`);

        const { data: newOffer, error: offerInsertError } = await supabase
          .from('offers')
          .insert(offerData)
          .select('id')
          .single();

        if (offerInsertError) {
          logError(`Error creating offer for product ${productId}: ${safeStringify(offerInsertError)}`);
          results.errors.push(`Error creating offer: ${offerInsertError.message}`);
          continue;
        }

        if (!newOffer || !newOffer.id) {
          logError(`Failed to get ID for newly created offer for product ${productId}`);
          results.errors.push('Failed to get new offer ID');
          continue;
        }

        logInfo(`Created new offer with ID ${newOffer.id} for product ${productId}`);

        // Link offer to product
        try {
          const { error: linkError } = await supabase
            .from('product_offers')
            .insert({
              product_id: productId,
              offer_id: newOffer.id,
              is_best_price: true // Placeholder; adjust logic as needed
            });

          if (linkError) {
            logError(`Error linking offer ${newOffer.id} to product ${productId}: ${safeStringify(linkError)}`);
            results.errors.push(`Error linking offer to product: ${linkError.message}`);
            continue;
          }

          logInfo(`Successfully linked offer ${newOffer.id} to product ${productId}`);
          results.processedOffers++;
        } catch (linkException) {
          logError(`Exception linking offer ${newOffer.id} to product ${productId}: ${safeStringify(linkException)}`);
          results.errors.push(`Exception linking offer to product: ${linkException.message}`);
          continue;
        }
      } catch (offerException) {
        logError(`Exception creating offer for product ${productId}: ${safeStringify(offerException)}`);
        results.errors.push(`Exception creating offer: ${offerException.message}`);
        continue;
      }
    } catch (offerProcessingException) {
      logError(`Unexpected exception processing offer for product ${productId}: ${safeStringify(offerProcessingException)}`);
      results.errors.push(`Unexpected exception: ${offerProcessingException.message}`);
      continue;
    }
  }

  results.success = results.processedOffers > 0;
  logInfo(`Completed storing offers for product ${productId}. Processed ${results.processedOffers}/${results.totalOffers} offers with ${results.errors.length} errors.`);
  return results;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  logInfo(`[${requestId}] Starting process-detailed-analysis request`);
  
  try {
    const requestBody = await req.json();
    logInfo(`[${requestId}] Request body received: ${safeStringify(requestBody)}`);
    
    const {
      originalProductId,
      dupeProductIds,
      originalName,
      originalBrand,
      dupeInfo
    } = requestBody;
    
    // Validate required parameters
    if (!originalProductId) {
      throw new Error("Missing required parameter: originalProductId");
    }
    
    if (!originalName) {
      throw new Error("Missing required parameter: originalName");
    }
    
    if (!originalBrand) {
      throw new Error("Missing required parameter: originalBrand");
    }
    
    if (!dupeProductIds || !Array.isArray(dupeProductIds)) {
      throw new Error("Missing or invalid parameter: dupeProductIds must be an array");
    }
    
    if (!dupeInfo || !Array.isArray(dupeInfo)) {
      throw new Error("Missing or invalid parameter: dupeInfo must be an array");
    }
    
    if (dupeProductIds.length !== dupeInfo.length) {
      throw new Error(`Mismatch between dupeProductIds (${dupeProductIds.length}) and dupeInfo (${dupeInfo.length}) array lengths`);
    }

    logInfo(`[${requestId}] Processing detailed analysis for product ${originalProductId} with ${dupeProductIds.length} dupes`);

    // Set loading_ingredients flag to true for the products
    logInfo(`[${requestId}] Setting loading_ingredients=true for original product ${originalProductId}`);
    try {
      const { error: updateOriginalError } = await supabase
        .from('products')
        .update({ loading_ingredients: true })
        .eq('id', originalProductId);
        
      if (updateOriginalError) {
        logError(`[${requestId}] Error setting loading state for original product: ${safeStringify(updateOriginalError)}`);
      }
    } catch (updateOriginalException) {
      logError(`[${requestId}] Exception setting loading state for original product: ${safeStringify(updateOriginalException)}`);
    }

    if (dupeProductIds.length > 0) {
      logInfo(`[${requestId}] Setting loading_ingredients=true for ${dupeProductIds.length} dupe products`);
      try {
        const { error: updateDupesError } = await supabase
          .from('products')
          .update({ loading_ingredients: true })
          .in('id', dupeProductIds);
          
        if (updateDupesError) {
          logError(`[${requestId}] Error setting loading state for dupe products: ${safeStringify(updateDupesError)}`);
        }
      } catch (updateDupesException) {
        logError(`[${requestId}] Exception setting loading state for dupe products: ${safeStringify(updateDupesException)}`);
      }
    }

    try {
      // Fetch extended information from external DBs
      logInfo(`[${requestId}] Fetching external data for original product: ${originalBrand} ${originalName}`);
      const originalProductData = await fetchProductDataFromExternalDb(originalName, originalBrand);
      logInfo(`[${requestId}] External data received for original product: ${safeStringify(originalProductData)}`);
      
      // Check if offers data exists and is properly structured
      if (originalProductData.offers) {
        if (Array.isArray(originalProductData.offers)) {
          logInfo(`[${requestId}] Original product has ${originalProductData.offers.length} offers`);
        } else {
          logError(`[${requestId}] Original product offers is not an array: ${typeof originalProductData.offers}`);
        }
      } else {
        logInfo(`[${requestId}] No offers data for original product`);
      }
      
      const enrichedDupes = [];
      for (let i = 0; i < dupeInfo.length; i++) {
        const dupe = dupeInfo[i];
        logInfo(`[${requestId}] Fetching external data for dupe #${i+1}: ${dupe.brand} ${dupe.name}`);
        
        try {
          const dupeData = await fetchProductDataFromExternalDb(dupe.name, dupe.brand);
          logInfo(`[${requestId}] External data received for dupe #${i+1}: ${safeStringify(dupeData)}`);
          
          // Check if offers data exists and is properly structured
          if (dupeData.offers) {
            if (Array.isArray(dupeData.offers)) {
              logInfo(`[${requestId}] Dupe #${i+1} has ${dupeData.offers.length} offers`);
            } else {
              logError(`[${requestId}] Dupe #${i+1} offers is not an array: ${typeof dupeData.offers}`);
            }
          } else {
            logInfo(`[${requestId}] No offers data for dupe #${i+1}`);
          }
          
          const enrichedDupe = {
            name: dupe.name,
            brand: dupe.brand,
            ...dupeData
          };
          
          enrichedDupes.push(enrichedDupe);
        } catch (dupeDataException) {
          logError(`[${requestId}] Exception fetching external data for dupe #${i+1}: ${safeStringify(dupeDataException)}`);
          // Still include the dupe with basic info even if external data fails
          enrichedDupes.push({
            name: dupe.name,
            brand: dupe.brand,
            error: dupeDataException.message
          });
        }
      }
      
      logInfo(`[${requestId}] Enriched ${enrichedDupes.length} dupes with external data`);

      // Get detailed analysis from Perplexity
      const enrichedOriginal = {
        name: originalName,
        brand: originalBrand,
        ...originalProductData
      };

      logInfo(`[${requestId}] Sending data to Perplexity for detailed analysis`);
      logInfo(`[${requestId}] Original data: ${safeStringify(enrichedOriginal)}`);
      logInfo(`[${requestId}] Dupes data: ${safeStringify(enrichedDupes)}`);
      
      const detailedAnalysis = await getDetailedDupeAnalysis(
        enrichedOriginal,
        enrichedDupes
      );
      
      logInfo(`[${requestId}] Received detailed analysis from Perplexity`);
      logInfo(`[${requestId}] Original analysis: ${safeStringify(detailedAnalysis.original)}`);
      logInfo(`[${requestId}] Summary: ${detailedAnalysis.summary}`);
      logInfo(`[${requestId}] Received analysis for ${detailedAnalysis.dupes.length} dupes`);

      // Process and upload images
      logInfo(`[${requestId}] Fetching product slug for ID ${originalProductId}`);
      const { data: originalProduct, error: slugError } = await supabase
        .from('products')
        .select('slug')
        .eq('id', originalProductId)
        .single();
      
      if (slugError) {
        logError(`[${requestId}] Error fetching product slug: ${safeStringify(slugError)}`);
        throw new Error(`Failed to fetch product slug: ${slugError.message}`);
      }
      
      if (!originalProduct || !originalProduct.slug) {
        logError(`[${requestId}] Product slug not found for ID ${originalProductId}`);
        throw new Error("Product slug not found");
      }
      
      const productSlug = originalProduct.slug;
      logInfo(`[${requestId}] Using product slug: ${productSlug}`);
      
      // Process original product image
      let originalImageUrl = null;
      if (detailedAnalysis.original.imageUrl || (detailedAnalysis.original.images && detailedAnalysis.original.images.length > 0)) {
        const imageSource = detailedAnalysis.original.images?.[0] || detailedAnalysis.original.imageUrl;
        logInfo(`[${requestId}] Processing image for original product: ${imageSource}`);
        
        try {
          originalImageUrl = await processAndUploadImage(imageSource, `${productSlug}-original`);
          logInfo(`[${requestId}] Processed original product image. Result: ${originalImageUrl}`);
        } catch (imageProcessingError) {
          logError(`[${requestId}] Error processing original product image: ${safeStringify(imageProcessingError)}`);
          // Continue without image if processing fails
        }
      } else {
        logInfo(`[${requestId}] No image URL found for original product`);
      }
      
      // Update original product with detailed info
      logInfo(`[${requestId}] Updating original product ${originalProductId} with detailed info`);
      try {
        const updateData = {
          price: detailedAnalysis.original.price || 0,
          category: detailedAnalysis.original.category,
          attributes: detailedAnalysis.original.attributes || [],
          summary: detailedAnalysis.summary,
          texture: detailedAnalysis.original.texture,
          finish: detailedAnalysis.original.finish,
          coverage: detailedAnalysis.original.coverage,
          spf: detailedAnalysis.original.spf,
          skin_types: detailedAnalysis.original.skinTypes,
          country_of_origin: detailedAnalysis.original.countryOfOrigin,
          longevity_rating: detailedAnalysis.original.longevityRating,
          oxidation_tendency: detailedAnalysis.original.oxidationTendency,
          free_of: detailedAnalysis.original.freeOf || [],
          best_for: detailedAnalysis.original.bestFor || [],
          cruelty_free: detailedAnalysis.original.crueltyFree,
          vegan: detailedAnalysis.original.vegan,
          notes: detailedAnalysis.original.notes,
          ean: detailedAnalysis.original.ean,
          upc: detailedAnalysis.original.upc,
          gtin: detailedAnalysis.original.gtin,
          asin: detailedAnalysis.original.asin,
          model: detailedAnalysis.original.model,
          description: detailedAnalysis.original.description,
          lowest_recorded_price: detailedAnalysis.original.lowest_recorded_price,
          highest_recorded_price: detailedAnalysis.original.highest_recorded_price
        };
        
        // Only update image_url if we successfully processed an image
        if (originalImageUrl) {
          updateData.image_url = originalImageUrl;
        }
        
        // Only update images array if it exists in the analysis
        if (detailedAnalysis.original.images) {
          updateData.images = detailedAnalysis.original.images;
        }
        
        logInfo(`[${requestId}] Original product update data: ${safeStringify(updateData)}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', originalProductId);
        
        if (updateError) {
          logError(`[${requestId}] Error updating original product: ${safeStringify(updateError)}`);
          throw new Error(`Failed to update original product: ${updateError.message}`);
        }
        
        logInfo(`[${requestId}] Successfully updated original product ${originalProductId}`);
      } catch (updateException) {
        logError(`[${requestId}] Exception updating original product: ${safeStringify(updateException)}`);
        throw updateException;
      }

      // Store offers for original product if available
      if (originalProductData.offers && Array.isArray(originalProductData.offers) && originalProductData.offers.length > 0) {
        logInfo(`[${requestId}] Processing ${originalProductData.offers.length} offers for original product ${originalProductId}`);
        
        try {
          const offerResults = await storeProductOffers(originalProductId, originalProductData.offers);
          logInfo(`[${requestId}] Completed processing offers for original product. Results: ${safeStringify(offerResults)}`);
        } catch (offerException) {
          logError(`[${requestId}] Exception processing offers for original product: ${safeStringify(offerException)}`);
          // Continue despite offer processing errors
        }
      } else {
        logInfo(`[${requestId}] No offers to process for original product ${originalProductId}`);
      }

      // Process and update dupes with detailed info
      const dupeUpdatePromises = dupeProductIds.map(async (dupeId, index) => {
        const dupeIndex = index.toString().padStart(2, '0');
        logInfo(`[${requestId}][DUPE-${dupeIndex}] Processing dupe ${dupeId}`);
        
        const dupe = detailedAnalysis.dupes[index];
        if (!dupe) {
          logError(`[${requestId}][DUPE-${dupeIndex}] No detailed analysis data for dupe at index ${index}`);
          return { success: false, error: 'No analysis data available' };
        }

        // Process dupe image
        let dupeImageUrl = null;
        if (dupe.imageUrl || (dupe.images && dupe.images.length > 0)) {
          const imageSource = dupe.images?.[0] || dupe.imageUrl;
          logInfo(`[${requestId}][DUPE-${dupeIndex}] Processing image for dupe: ${imageSource}`);
          
          try {
            dupeImageUrl = await processAndUploadImage(imageSource, `${productSlug}-dupe-${index + 1}`);
            logInfo(`[${requestId}][DUPE-${dupeIndex}] Processed dupe image. Result: ${dupeImageUrl}`);
          } catch (imageProcessingError) {
            logError(`[${requestId}][DUPE-${dupeIndex}] Error processing dupe image: ${safeStringify(imageProcessingError)}`);
            // Continue without image if processing fails
          }
        } else {
          logInfo(`[${requestId}][DUPE-${dupeIndex}] No image URL found for dupe`);
        }

        // Update dupe product
        try {
          const updateData = {
            price: dupe.price || 0,
            category: dupe.category || detailedAnalysis.original.category,
            attributes: dupe.attributes || [],
            texture: dupe.texture,
            finish: dupe.finish,
            coverage: dupe.coverage,
            spf: dupe.spf,
            skin_types: dupe.skinTypes,
            country_of_origin: dupe.countryOfOrigin,
            longevity_rating: dupe.longevityRating,
            free_of: dupe.freeOf || [],
            best_for: dupe.bestFor || [],
            cruelty_free: dupe.crueltyFree,
            vegan: dupe.vegan,
            notes: dupe.notes,
            ean: dupe.ean,
            upc: dupe.upc,
            gtin: dupe.gtin,
            asin: dupe.asin,
            model: dupe.model,
            description: dupe.description,
            lowest_recorded_price: dupe.lowest_recorded_price,
            highest_recorded_price: dupe.highest_recorded_price
          };
          
          // Only update image_url if we successfully processed an image
          if (dupeImageUrl) {
            updateData.image_url = dupeImageUrl;
          }
          
          // Only update images array if it exists in the analysis
          if (dupe.images) {
            updateData.images = dupe.images;
          }
          
          logInfo(`[${requestId}][DUPE-${dupeIndex}] Dupe product update data: ${safeStringify(updateData)}`);
          
          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', dupeId);
          
          if (updateError) {
            logError(`[${requestId}][DUPE-${dupeIndex}] Error updating dupe product: ${safeStringify(updateError)}`);
            return { success: false, error: updateError.message };
          }
          
          logInfo(`[${requestId}][DUPE-${dupeIndex}] Successfully updated dupe product ${dupeId}`);
          
          // Store offers for dupe product if available
          const enrichedDupe = enrichedDupes[index];
          if (enrichedDupe && enrichedDupe.offers && Array.isArray(enrichedDupe.offers) && enrichedDupe.offers.length > 0) {
            logInfo(`[${requestId}][DUPE-${dupeIndex}] Processing ${enrichedDupe.offers.length} offers for dupe ${dupeId}`);
            
            try {
              const offerResults = await storeProductOffers(dupeId, enrichedDupe.offers);
              logInfo(`[${requestId}][DUPE-${dupeIndex}] Completed processing offers for dupe. Results: ${safeStringify(offerResults)}`);
            } catch (offerException) {
              logError(`[${requestId}][DUPE-${dupeIndex}] Exception processing offers for dupe: ${safeStringify(offerException)}`);
              // Continue despite offer processing errors
            }
          } else {
            logInfo(`[${requestId}][DUPE-${dupeIndex}] No offers to process for dupe ${dupeId}`);
          }
          
          // Update dupe relationship with match score and savings percentage
          try {
            const relationshipData = {
              match_score: dupe.matchScore,
              savings_percentage: dupe.savingsPercentage
            };
            
            logInfo(`[${requestId}][DUPE-${dupeIndex}] Updating relationship with data: ${safeStringify(relationshipData)}`);
            
            const { error: relationshipError } = await supabase
              .from('product_dupes')
              .update(relationshipData)
              .eq('original_product_id', originalProductId)
              .eq('dupe_product_id', dupeId);
            
            if (relationshipError) {
              logError(`[${requestId}][DUPE-${dupeIndex}] Error updating dupe relationship: ${safeStringify(relationshipError)}`);
              return { success: true, relationshipError: relationshipError.message };
            }
            
            logInfo(`[${requestId}][DUPE-${dupeIndex}] Successfully updated dupe relationship between ${originalProductId} and ${dupeId}`);
            return { success: true };
          } catch (relationshipException) {
            logError(`[${requestId}][DUPE-${dupeIndex}] Exception updating dupe relationship: ${safeStringify(relationshipException)}`);
            return { success: true, relationshipError: relationshipException.message };
          }
        } catch (updateException) {
          logError(`[${requestId}][DUPE-${dupeIndex}] Exception updating dupe product: ${safeStringify(updateException)}`);
          return { success: false, error: updateException.message };
        }
      });
      
      // Wait for all dupe updates to complete
      const dupeResults = await Promise.all(dupeUpdatePromises);
      logInfo(`[${requestId}] Completed updating ${dupeResults.length} dupes. Results: ${safeStringify(dupeResults)}`);

      // Process ingredients for original product from detailed analysis data
      if (detailedAnalysis.original.keyIngredients && detailedAnalysis.original.keyIngredients.length > 0) {
        logInfo(`[${requestId}] Processing ${detailedAnalysis.original.keyIngredients.length} ingredients for original product ${originalProductId}`);
        
        try {
          await processProductIngredients(originalProductId, detailedAnalysis.original.keyIngredients);
          logInfo(`[${requestId}] Successfully processed ingredients for original product ${originalProductId}`);
        } catch (ingredientsError) {
          logError(`[${requestId}] Error processing ingredients for original product: ${safeStringify(ingredientsError)}`);
          // Continue despite ingredient processing errors
        }
      } else {
        logInfo(`[${requestId}] No key ingredients to process for original product ${originalProductId}`);
      }

      // Process ingredients for dupes from detailed analysis data
      const dupeIngredientsPromises = dupeProductIds.map(async (dupeId, index) => {
        const dupeIndex = index.toString().padStart(2, '0');
        const dupe = detailedAnalysis.dupes[index];
        
        if (dupe && dupe.keyIngredients && dupe.keyIngredients.length > 0) {
          logInfo(`[${requestId}][DUPE-${dupeIndex}] Processing ${dupe.keyIngredients.length} ingredients for dupe ${dupeId}`);
          
          try {
            await processDupeIngredients(dupeId, dupe.keyIngredients);
            logInfo(`[${requestId}][DUPE-${dupeIndex}] Successfully processed ingredients for dupe ${dupeId}`);
            return { success: true };
          } catch (ingredientsError) {
            logError(`[${requestId}][DUPE-${dupeIndex}] Error processing ingredients for dupe: ${safeStringify(ingredientsError)}`);
            return { success: false, error: ingredientsError.message };
          }
        } else {
          logInfo(`[${requestId}][DUPE-${dupeIndex}] No key ingredients to process for dupe ${dupeId}`);
          return { success: true, message: 'No ingredients to process' };
        }
      });
      
      // Wait for all dupe ingredient processing to complete
      const ingredientsResults = await Promise.all(dupeIngredientsPromises);
      logInfo(`[${requestId}] Completed processing ingredients for ${ingredientsResults.length} dupes. Results: ${safeStringify(ingredientsResults)}`);

      logInfo(`[${requestId}] Successfully completed detailed analysis processing`);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Successfully processed detailed analysis',
          originalProduct: originalProductId,
          dupeCount: dupeProductIds.length
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (processingError) {
      logError(`[${requestId}] Error during detailed analysis processing: ${safeStringify(processingError)}`);
      throw processingError;
    } finally {
      // Always update loading_ingredients flag to false when done, even on error
      logInfo(`[${requestId}] Setting loading_ingredients=false for original product ${originalProductId}`);
      try {
        const { error: updateOriginalError } = await supabase
          .from('products')
          .update({ loading_ingredients: false })
          .eq('id', originalProductId);
          
        if (updateOriginalError) {
          logError(`[${requestId}] Error clearing loading state for original product: ${safeStringify(updateOriginalError)}`);
        }
      } catch (updateOriginalException) {
        logError(`[${requestId}] Exception clearing loading state for original product: ${safeStringify(updateOriginalException)}`);
      }

      if (dupeProductIds.length > 0) {
        logInfo(`[${requestId}] Setting loading_ingredients=false for ${dupeProductIds.length} dupe products`);
        try {
          const { error: updateDupesError } = await supabase
            .from('products')
            .update({ loading_ingredients: false })
            .in('id', dupeProductIds);
            
          if (updateDupesError) {
            logError(`[${requestId}] Error clearing loading state for dupe products: ${safeStringify(updateDupesError)}`);
          }
        } catch (updateDupesException) {
          logError(`[${requestId}] Exception clearing loading state for dupe products: ${safeStringify(updateDupesException)}`);
        }
      }
      
      logInfo(`[${requestId}] Finished cleaning up loading states`);
    }
  } catch (error) {
    logError(`[${requestId}] Fatal error in process-detailed-analysis: ${safeStringify(error)}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});