import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDetailedDupeAnalysis } from "../services/perplexity.ts";
import { fetchProductDataFromExternalDb } from "../services/external-db.ts";
import { processAndUploadImage } from "../services/images.ts";
import { supabase } from "../shared/db-client.ts";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients.ts";
import { logInfo, logError, safeStringify } from "../shared/utils.ts";

/**
 * Clean up product data to only include essential fields for Perplexity analysis
 * This reduces payload size and prevents hitting API limits
 */
function cleanProductDataForAnalysis(product: any): any {
  if (!product) return null;
  
  // Keep only fields needed for the detailed analysis
  return {
    name: product.name,
    brand: product.brand,
    price: product.price || 0,
    category: product.category,
    description: product.description,
    ean: product.ean,
    upc: product.upc,
    gtin: product.gtin,
    asin: product.asin,
    model: product.model,
    image_url: product.image_url,
    images: Array.isArray(product.images) ? product.images.slice(0, 2) : undefined, // Limit to 2 images
    keyIngredients: product.keyIngredients || [],
    texture: product.texture,
    finish: product.finish,
    coverage: product.coverage,
    spf: product.spf,
    skinTypes: product.skinTypes,
    attributes: product.attributes,
    countryOfOrigin: product.countryOfOrigin,
    longevityRating: product.longevityRating,
    oxidationTendency: product.oxidationTendency,
    bestFor: product.bestFor,
    freeOf: product.freeOf,
    crueltyFree: product.crueltyFree,
    vegan: product.vegan,
  };
}

/**
 * Maps the detailed analysis results from Perplexity to the original dupe product IDs
 * Uses intelligent name/brand matching to handle ordering differences
 * @param detailedAnalysis The detailed analysis response from Perplexity
 * @param dupeProductIds Array of dupe product IDs in our database
 * @param dupeInfo Array of dupe info objects with name/brand that were sent to Perplexity
 * @returns Map of dupeProductId to detailedAnalysis dupe object
 */
function mapDetailedAnalysisResultsToDupes(
  detailedAnalysis: any, 
  dupeProductIds: string[], 
  dupeInfo: Array<{ name: string, brand: string }>
): Map<string, any> {
  const dupeMap = new Map<string, any>();
  const detailedDupes = detailedAnalysis.dupes || [];
  
  logInfo(`Mapping ${detailedDupes.length} detailed dupes to ${dupeProductIds.length} product IDs`);
  
  // For each of our original dupes that we sent to Perplexity
  dupeProductIds.forEach((dupeId, index) => {
    const originalDupeInfo = dupeInfo[index];
    
    // Skip if we don't have the basic info
    if (!originalDupeInfo || !originalDupeInfo.name || !originalDupeInfo.brand) {
      logError(`Missing original dupe info for index ${index}, dupeId: ${dupeId}`);
      return;
    }
    
    // Normalize original dupe name/brand for comparison
    const originalName = originalDupeInfo.name.toLowerCase().trim();
    const originalBrand = originalDupeInfo.brand.toLowerCase().trim();
    
    // Try to find a matching dupe in the detailed analysis results
    let matchedDupe = null;
    
    // First try for exact match on both name and brand
    matchedDupe = detailedDupes.find(dupe => 
      dupe.name.toLowerCase().trim() === originalName && 
      dupe.brand.toLowerCase().trim() === originalBrand
    );
    
    // If no exact match, try partial name matching with exact brand match
    if (!matchedDupe) {
      matchedDupe = detailedDupes.find(dupe => 
        dupe.brand.toLowerCase().trim() === originalBrand &&
        (dupe.name.toLowerCase().trim().includes(originalName) || 
         originalName.includes(dupe.name.toLowerCase().trim()))
      );
    }
    
    // If still no match, try exact name matching with any brand
    if (!matchedDupe) {
      matchedDupe = detailedDupes.find(dupe => 
        dupe.name.toLowerCase().trim() === originalName
      );
    }
    
    // Last resort - fuzzy match based on name similarity
    if (!matchedDupe && detailedDupes.length > 0) {
      // Find the best match based on name similarity
      let bestMatchScore = 0;
      let bestMatchIndex = -1;
      
      detailedDupes.forEach((dupe, dupeIndex) => {
        // Skip dupes that have already been matched and mapped
        if (Array.from(dupeMap.values()).includes(dupe)) {
          return;
        }
        
        const detailedName = dupe.name.toLowerCase().trim();
        const detailedBrand = dupe.brand.toLowerCase().trim();
        
        // Calculate a match score based on name and brand similarity
        let similarityScore = 0;
        
        // Check for brand similarity
        if (detailedBrand === originalBrand) {
          similarityScore += 50; // High weight for brand match
        } else if (detailedBrand.includes(originalBrand) || originalBrand.includes(detailedBrand)) {
          similarityScore += 30; // Partial brand match
        }
        
        // Check for name similarity
        if (detailedName === originalName) {
          similarityScore += 50; // High weight for exact name match
        } else if (detailedName.includes(originalName) || originalName.includes(detailedName)) {
          similarityScore += 30; // Partial name match
        }
        
        // If this is the best match so far, store it
        if (similarityScore > bestMatchScore) {
          bestMatchScore = similarityScore;
          bestMatchIndex = dupeIndex;
        }
      });
      
      // If we found a decent match, use it
      if (bestMatchScore >= 30 && bestMatchIndex >= 0) {
        matchedDupe = detailedDupes[bestMatchIndex];
        logInfo(`Using fuzzy match for ${originalBrand} ${originalName} with score ${bestMatchScore}`);
      }
    }
    
    if (matchedDupe) {
      // We found a matching dupe in the detailed analysis
      dupeMap.set(dupeId, matchedDupe);
      logInfo(`Mapped dupe ID ${dupeId} to detailed analysis dupe: ${matchedDupe.brand} ${matchedDupe.name}`);
    } else {
      // No matching dupe found in the detailed analysis
      logError(`No detailed analysis match found for dupe ID ${dupeId}: ${originalBrand} ${originalName}`);
      
      // We'll use default values with very low match score to indicate it's not a good dupe
      const defaultDupe = {
        name: originalDupeInfo.name,
        brand: originalDupeInfo.brand,
        price: 0,
        category: detailedAnalysis.original.category || "Other",
        keyIngredients: [],
        imageUrl: "",
        texture: "",
        finish: "",
        coverage: "",
        spf: 0,
        skinTypes: [],
        attributes: [],
        countryOfOrigin: "",
        longevityRating: 0,
        bestFor: [],
        freeOf: [],
        crueltyFree: false,
        vegan: false,
        notes: "Insufficient data available for detailed comparison",
        savingsPercentage: 0,
        matchScore: 0,
        colorMatchScore: 0,
        formulaMatchScore: 0,
        dupeType: "Not a Dupe",
        validationSource: "N/A",
        confidenceLevel: "Low",
        longevityComparison: "N/A"
      };
      
      dupeMap.set(dupeId, defaultDupe);
    }
  });
  
  // Log statistics about the mapping
  logInfo(`Successfully mapped ${dupeMap.size} out of ${dupeProductIds.length} dupes`);
  
  return dupeMap;
}

/**
 * Store product offers and handle merchant relationships
 * @param productId The product ID to associate offers with
 * @param offers Array of offer objects
 * @returns Object with success status and counts
 */
async function storeProductOffers(productId, offers) {
  // [Your existing storeProductOffers implementation]
  // Keeping this unchanged as it's not related to the mapping issue
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
      
      // Enrich dupes with external data
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

      // Clean up data before sending to Perplexity to reduce payload size
      const cleanedOriginal = cleanProductDataForAnalysis(enrichedOriginal);
      const cleanedDupes = enrichedDupes.map(dupe => cleanProductDataForAnalysis(dupe));

      logInfo(`[${requestId}] Sending cleaned data to Perplexity for detailed analysis`);
      logInfo(`[${requestId}] Cleaned original data size: ${JSON.stringify(cleanedOriginal).length} bytes`);
      logInfo(`[${requestId}] Cleaned dupes data size: ${JSON.stringify(cleanedDupes).length} bytes`);
      
      const detailedAnalysis = await getDetailedDupeAnalysis(
        cleanedOriginal,
        cleanedDupes
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
      const imageSourcesToTry = [];
      
      // Add imageUrl if available
      if (detailedAnalysis.original.imageUrl) {
        imageSourcesToTry.push(detailedAnalysis.original.imageUrl);
      }
      
      // Add all images from the array if available
      if (detailedAnalysis.original.images && Array.isArray(detailedAnalysis.original.images)) {
        imageSourcesToTry.push(...detailedAnalysis.original.images);
      }
      
      // Try each image source until one works
      if (imageSourcesToTry.length > 0) {
        for (const imageSource of imageSourcesToTry) {
          logInfo(`[${requestId}] Trying image source for original product: ${imageSource}`);
          try {
            originalImageUrl = await processAndUploadImage(imageSource, `${productSlug}-original`);
            logInfo(`[${requestId}] Successfully processed original product image: ${originalImageUrl}`);
            break; // Exit the loop once we have a successful image
          } catch (imageProcessingError) {
            logError(`[${requestId}] Failed to process image source: ${safeStringify(imageProcessingError)}`);
            // Continue to the next image source
          }
        }
        
        if (!originalImageUrl) {
          logError(`[${requestId}] All image sources failed for original product`);
        }
      } else {
        logInfo(`[${requestId}] No image sources available for original product`);
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

      // Map detailed analysis dupes to product IDs
      const dupeMap = mapDetailedAnalysisResultsToDupes(detailedAnalysis, dupeProductIds, dupeInfo);
      
      // Optional: Filter out dupes with very low match scores
      const validDupeIds = Array.from(dupeMap.entries())
        .filter(([_, dupe]) => dupe.matchScore > 5) // Keep only dupes with match score > 5
        .map(([dupeId, _]) => dupeId);

      if (validDupeIds.length < dupeProductIds.length) {
        logInfo(`[${requestId}] Filtered out ${dupeProductIds.length - validDupeIds.length} low-quality dupes`);
        
        // Option: Delete the relationships for very poor dupes
        const poorDupeIds = dupeProductIds.filter(id => !validDupeIds.includes(id));
        if (poorDupeIds.length > 0) {
          try {
            const { error: deleteError } = await supabase
              .from('product_dupes')
              .delete()
              .eq('original_product_id', originalProductId)
              .in('dupe_product_id', poorDupeIds);
              
            if (deleteError) {
              logError(`[${requestId}] Error deleting poor dupe relationships: ${safeStringify(deleteError)}`);
            } else {
              logInfo(`[${requestId}] Successfully deleted ${poorDupeIds.length} poor dupe relationships`);
            }
          } catch (deleteException) {
            logError(`[${requestId}] Exception deleting poor dupe relationships: ${safeStringify(deleteException)}`);
          }
        }
      }

      // Process and update dupes with detailed info
      const dupeUpdatePromises = dupeProductIds.map(async (dupeId, index) => {
        const dupeIndex = index.toString().padStart(2, '0');
        logInfo(`[${requestId}][DUPE-${dupeIndex}] Processing dupe ${dupeId}`);
        
        // Get the mapped dupe data from our map
        const dupe = dupeMap.get(dupeId);
        
        if (!dupe) {
          logError(`[${requestId}][DUPE-${dupeIndex}] No mapped dupe data for ID ${dupeId}`);
          return { success: false, error: 'No mapped dupe data available' };
        }

        // Process dupe image using the same approach as for original product
        let dupeImageUrl = null;
        const dupeImageSourcesToTry = [];
        
        // Add imageUrl if available
        if (dupe.imageUrl) {
          dupeImageSourcesToTry.push(dupe.imageUrl);
        }
        
        // Add all images from the array if available
        if (dupe.images && Array.isArray(dupe.images)) {
          dupeImageSourcesToTry.push(...dupe.images);
        }
        
        // Try each image source until one works
        if (dupeImageSourcesToTry.length > 0) {
          for (const imageSource of dupeImageSourcesToTry) {
            logInfo(`[${requestId}][DUPE-${dupeIndex}] Trying image source for dupe: ${imageSource}`);
            try {
              dupeImageUrl = await processAndUploadImage(imageSource, `${productSlug}-dupe-${index + 1}`);
              logInfo(`[${requestId}][DUPE-${dupeIndex}] Successfully processed dupe image: ${dupeImageUrl}`);
              break; // Exit the loop once we have a successful image
            } catch (imageProcessingError) {
              logError(`[${requestId}][DUPE-${dupeIndex}] Failed to process image source: ${safeStringify(imageProcessingError)}`);
              // Continue to the next image source
            }
          }
          
          if (!dupeImageUrl) {
            logError(`[${requestId}][DUPE-${dupeIndex}] All image sources failed for dupe`);
          }
        } else {
          logInfo(`[${requestId}][DUPE-${dupeIndex}] No image sources available for dupe`);
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
        const dupe = dupeMap.get(dupeId);
        
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