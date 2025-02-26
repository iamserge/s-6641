import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../shared/db-client.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { processProductImage, uploadProcessedImageToSupabase } from "../services/images.ts";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients.ts";

/**
 * Background edge function to populate product images and ingredients
 */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const {
      originalProductId,
      dupeProductIds,
      originalImageUrl,
      dupeImageUrls,
      originalKeyIngredients,
      dupeKeyIngredients
    } = await req.json();

    logInfo(`Starting background processing for product ${originalProductId}`);

    // 1. Process original product image
    if (originalImageUrl) {
      const processedOriginalImage = await processProductImage(originalImageUrl);
      if (processedOriginalImage) {
        const uploadedOriginalImageUrl = await uploadProcessedImageToSupabase(
          processedOriginalImage,
          `${originalProductId}-original`
        );
        const { error } = await supabase
          .from('products')
          .update({ image_url: uploadedOriginalImageUrl })
          .eq('id', originalProductId);

        if (error) {
          logError(`Error updating original image for product ${originalProductId}:`, error);
        } else {
          logInfo(`Processed image for original product ${originalProductId}`);
        }
      }
    }

    // 2. Process dupe images in parallel
    if (dupeProductIds && dupeImageUrls) {
      await Promise.all(
        dupeProductIds.map(async (dupeId, index) => {
          const dupeImageUrl = dupeImageUrls[index];
          if (dupeImageUrl) {
            const processedDupeImage = await processProductImage(dupeImageUrl);
            if (processedDupeImage) {
              const uploadedDupeImageUrl = await uploadProcessedImageToSupabase(
                processedDupeImage,
                `${originalProductId}-dupe-${index + 1}`
              );
              const { error } = await supabase
                .from('products')
                .update({ image_url: uploadedDupeImageUrl })
                .eq('id', dupeId);

              if (error) {
                logError(`Error updating image for dupe ${dupeId}:`, error);
              }
            }
          }
        })
      );
      logInfo(`Processed images for ${dupeProductIds.length} dupes`);
    }

    // 3. Process original product ingredients
    if (originalKeyIngredients && originalKeyIngredients.length > 0) {
      await processProductIngredients(originalProductId, originalKeyIngredients);
      logInfo(`Processed ingredients for original product ${originalProductId}`);
    }

    // 4. Process dupe ingredients in parallel
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

    return new Response(
      JSON.stringify({ success: true, message: "Background processing completed" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError('Error in populate-product-data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});