import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDetailedDupeAnalysis } from "../services/perplexity.ts";
import { fetchProductDataFromExternalDb } from "../services/external-db.ts";
import { processProductImagesWithPriority } from "../services/images.ts";
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
    id: product.id,
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
  };
}


/**
 * Maps the detailed analysis results from Perplexity to the original dupe product IDs
 * Uses direct ID matching and removes missing dupes from the database
 * @param detailedAnalysis The detailed analysis response from Perplexity
 * @param dupeProductIds Array of dupe product IDs in our database
 * @param originalProductId The ID of the original product
 * @param dupeInfo Array of dupe info objects with name and brand
 * @returns Map of dupeProductId to detailedAnalysis dupe object
 */
async function mapDetailedAnalysisResultsToDupes(
  detailedAnalysis: any, 
  dupeProductIds: string[],
  originalProductId: string,
  dupeInfo: Array<{ id: string; name: string; brand: string }>
): Promise<Map<string, any>> {
  const dupeMap = new Map<string, any>();
  const detailedDupes = detailedAnalysis.dupes || [];
  const requestId = crypto.randomUUID(); // For logging
  
  logInfo(`[${requestId}] Mapping ${detailedDupes.length} detailed dupes using direct ID matching`);
  
  // Create a map using the ID field from the detailed analysis
  for (const dupe of detailedDupes) {
    if (dupe.id && dupeProductIds.includes(dupe.id)) {
      dupeMap.set(dupe.id, dupe);
      logInfo(`[${requestId}] Mapped dupe ID ${dupe.id} to detailed analysis dupe: ${dupe.brand} ${dupe.name}`);
    } else if (!dupe.id) {
      logError(`[${requestId}] Dupe is missing ID field: ${dupe.brand} ${dupe.name}`);
    } else if (!dupeProductIds.includes(dupe.id)) {
      logError(`[${requestId}] Dupe ID ${dupe.id} from response not found in dupeProductIds array`);
    }
  }
  
  // Check for missing dupes (dupes that were in our DB but not in the response)
  const missingIds = dupeProductIds.filter(id => !dupeMap.has(id));
  if (missingIds.length > 0) {
    logInfo(`[${requestId}] Found ${missingIds.length} dupes missing from Perplexity response: ${missingIds.join(', ')}`);
    
    try {
      // Get the details of the missing dupes before deletion (for logging)
      const { data: missingDupes } = await supabase
        .from('products')
        .select('id, name, brand')
        .in('id', missingIds);
      
      if (missingDupes && missingDupes.length > 0) {
        logInfo(`[${requestId}] About to remove these dupes: ${missingDupes.map(d => `${d.brand} ${d.name} (${d.id})`).join(', ')}`);
      }
      
      // First, delete the product_dupes relationships
      const { error: relationshipError } = await supabase
        .from('product_dupes')
        .delete()
        .eq('original_product_id', originalProductId)
        .in('dupe_product_id', missingIds);
      
      if (relationshipError) {
        logError(`[${requestId}] Error deleting dupe relationships: ${safeStringify(relationshipError)}`);
      } else {
        logInfo(`[${requestId}] Successfully deleted dupe relationships for ${missingIds.length} missing dupes`);
        
        // Now that relationships are removed, delete product ingredients associations
        const { error: ingredientsError } = await supabase
          .from('product_ingredients')
          .delete()
          .in('product_id', missingIds);
        
        if (ingredientsError) {
          logError(`[${requestId}] Error deleting dupe ingredients: ${safeStringify(ingredientsError)}`);
        }
        
        // Delete product_resources associations
        const { error: resourcesError } = await supabase
          .from('product_resources')
          .delete()
          .in('product_id', missingIds);
        
        if (resourcesError) {
          logError(`[${requestId}] Error deleting dupe resources: ${safeStringify(resourcesError)}`);
        }
        
        // Finally delete the product entries themselves
        const { error: productsError } = await supabase
          .from('products')
          .delete()
          .in('id', missingIds);
        
        if (productsError) {
          logError(`[${requestId}] Error deleting dupe products: ${safeStringify(productsError)}`);
        } else {
          logInfo(`[${requestId}] Successfully deleted ${missingIds.length} dupe products from database`);
        }
      }
    } catch (error) {
      logError(`[${requestId}] Error removing missing dupes from database: ${safeStringify(error)}`);
    }
  }
  
  logInfo(`[${requestId}] Successfully mapped ${dupeMap.size} out of ${dupeProductIds.length} dupes after removing missing ones`);
  return dupeMap;
}

/**
 * Store product offers and handle merchant relationships
 * @param productId The product ID to associate offers with
 * @param offers Array of offer objects
 * @returns Object with success status and counts
 */

async function storeProductOffers(productId, offers) {
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
            id: dupe.id,
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
        id: originalProductId,
        name: originalName,
        brand: originalBrand,
        ...originalProductData
      };

      // Clean up data before sending to Perplexity to reduce payload size
      const cleanedOriginal = cleanProductDataForAnalysis(enrichedOriginal);
      const cleanedDupes = enrichedDupes.map(dupe => cleanProductDataForAnalysis(dupe));

      logInfo(`[${requestId}] Sending cleaned data to Perplexity for detailed analysis`);
  
      
      const detailedAnalysis = await getDetailedDupeAnalysis(
        cleanedOriginal,
        cleanedDupes
      );
      
      logInfo(`[${requestId}] Received detailed analysis from Perplexity`);
      logInfo(`[${requestId}] Original analysis: ${safeStringify(detailedAnalysis.original)}`);
      logInfo(`[${requestId}] Summary: ${detailedAnalysis.summary}`);
      logInfo(`[${requestId}] Received analysis for ${detailedAnalysis.dupes.length} dupes`);

      // Process and upload images
      
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

      // Process original product image with the refactored approach
      logInfo(`[${requestId}] Processing image for original product ${originalProductId}`);
      let originalImageUrl = null;
      try {
        // Get images array from external data
        const externalDbImages = originalProductData.images || [];
        
        // Call the centralized function for image processing
        originalImageUrl = await processProductImagesWithPriority(
          externalDbImages,
          {
            imageUrl: detailedAnalysis.original.imageUrl,
            images: detailedAnalysis.original.images
          },
          `${productSlug}-original`
        );
        
        if (originalImageUrl) {
          logInfo(`[${requestId}] Successfully processed original product image: ${originalImageUrl}`);
        } else {
          logInfo(`[${requestId}] No successful image processing for original product`);
        }
      } catch (imageError) {
        logError(`[${requestId}] Error in image processing for original product: ${safeStringify(imageError)}`);
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
      // With this correct one:
      const dupeMap = await mapDetailedAnalysisResultsToDupes(
        detailedAnalysis, 
        dupeProductIds, 
        originalProductId,
        dupeInfo
      );
      
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
      
        // Process dupe image with the refactored approach
        let dupeImageUrl = null;
        try {
          // Get images array from external data for this specific dupe
          const dupeExternalData = enrichedDupes[index];
          const dupeExternalImages = dupeExternalData?.images || [];
          
          // Call the centralized function for image processing
          dupeImageUrl = await processProductImagesWithPriority(
            dupeExternalImages,
            {
              imageUrl: dupe.imageUrl,
              images: dupe.images
            },
            `${productSlug}-dupe-${index + 1}`
          );
          
          if (dupeImageUrl) {
            logInfo(`[${requestId}][DUPE-${dupeIndex}] Successfully processed dupe image: ${dupeImageUrl}`);
          } else {
            logInfo(`[${requestId}][DUPE-${dupeIndex}] No successful image processing for dupe`);
          }
        } catch (imageError) {
          logError(`[${requestId}][DUPE-${dupeIndex}] Error in image processing for dupe: ${safeStringify(imageError)}`);
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
          
          // ... rest of the dupe processing remains the same ...
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