import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../shared/db-client.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { processBrand } from "../services/brands.ts";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients.ts";
import { storeProductReviewsAndResources, getProductReviewsAndResources } from "../shared/db-client.ts";

serve(async (req) => {
  try {
    const {
      originalProductId,
      dupeProductIds,
      originalBrand,
      dupeBrands,
      originalKeyIngredients,
      dupeKeyIngredients,
      originalName // Add the original product name
    } = await req.json();

    logInfo(`Starting background processing for product ${originalProductId}`);

    // Process all unique brands in parallel
    const allBrands = new Set([originalBrand, ...dupeBrands]);
    const brandPromises = Array.from(allBrands).map(brand => processBrand(brand));
    const brandIds = await Promise.all(brandPromises);
    const brandMap = new Map(Array.from(allBrands).map((brand, index) => [brand, brandIds[index]]));
    logInfo(`Processed ${allBrands.size} unique brands`);

    // Update original product with brand ID
    await supabase
      .from('products')
      .update({ brand_id: brandMap.get(originalBrand) })
      .eq('id', originalProductId);

    // Update dupes with brand IDs
    await Promise.all(
      dupeProductIds.map(async (dupeId, index) => {
        await supabase
          .from('products')
          .update({ brand_id: brandMap.get(dupeBrands[index]) })
          .eq('id', dupeId);
      })
    );

    // Process ingredients for original product
    if (originalKeyIngredients && originalKeyIngredients.length > 0) {
      await processProductIngredients(originalProductId, originalKeyIngredients);
      logInfo(`Processed ingredients for original product ${originalProductId}`);
    }

    // Process ingredients for dupes
    if (dupeProductIds && dupeKeyIngredients) {
      await Promise.all(
        dupeProductIds.map(async (dupeId, index) => {
          const keyIngredients = dupeKeyIngredients[index];
          if (keyIngredients && keyIngredients.length > 0) {
            await processDupeIngredients(dupeId, keyIngredients);
          }
        })
      );
      logInfo(`Processed ingredients for ${dupeProductIds.length} dupes`);
    }

    // NEW: Fetch and process reviews and social media content for the original product
    if (originalName && originalBrand) {
      try {
        logInfo(`Fetching reviews and resources for ${originalBrand} ${originalName}`);
        const reviewsAndResources = await getProductReviewsAndResources(originalName, originalBrand);
        
        if (reviewsAndResources) {
          await storeProductReviewsAndResources(
            originalProductId,
            reviewsAndResources.userReviews || [],
            reviewsAndResources.productRating || { averageRating: null, totalReviews: 0, source: null },
            {
              instagram: reviewsAndResources.socialMedia?.instagram || [],
              tiktok: reviewsAndResources.socialMedia?.tiktok || [],
              youtube: reviewsAndResources.socialMedia?.youtube || []
            },
            reviewsAndResources.articles || []
          );
          logInfo(`Successfully stored reviews and resources for ${originalProductId}`);
        }
      } catch (reviewsError) {
        logError(`Error processing reviews and resources:`, reviewsError);
        // Continue with other processing even if reviews fail
      }
    }

    // Optionally process reviews for top dupes as well (limited to save API costs)
    if (dupeProductIds && dupeProductIds.length > 0 && dupeBrands) {
      // Just process top dupe for now
      try {
        const topDupeId = dupeProductIds[0];
        const topDupeBrand = dupeBrands[0];
        
        // Get the name of the top dupe
        const { data: dupeData } = await supabase
          .from('products')
          .select('name')
          .eq('id', topDupeId)
          .single();
        
        if (dupeData && dupeData.name) {
          logInfo(`Fetching reviews and resources for top dupe: ${topDupeBrand} ${dupeData.name}`);
          const dupeReviewsAndResources = await getProductReviewsAndResources(dupeData.name, topDupeBrand);
          
          if (dupeReviewsAndResources) {
            await storeProductReviewsAndResources(
              topDupeId,
              dupeReviewsAndResources.userReviews || [],
              dupeReviewsAndResources.productRating || { averageRating: null, totalReviews: 0, source: null },
              {
                instagram: dupeReviewsAndResources.socialMedia?.instagram || [],
                tiktok: dupeReviewsAndResources.socialMedia?.tiktok || [],
                youtube: dupeReviewsAndResources.socialMedia?.youtube || []
              },
              dupeReviewsAndResources.articles || []
            );
            logInfo(`Successfully stored reviews and resources for top dupe ${topDupeId}`);
          }
        }
      } catch (dupeReviewsError) {
        logError(`Error processing reviews for top dupe:`, dupeReviewsError);
        // Continue with processing
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    logError('Error in populate-brands-and-ingredients:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});