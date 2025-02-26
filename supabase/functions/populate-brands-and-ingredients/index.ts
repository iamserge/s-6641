import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../shared/db-client.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { processBrand } from "../services/brands.ts";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients.ts";

serve(async (req) => {
  try {
    const {
      originalProductId,
      dupeProductIds,
      originalBrand,
      dupeBrands,
      originalKeyIngredients,
      dupeKeyIngredients
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