
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processBrand } from "../services/brands.ts";
import { supabase } from "../shared/db-client.ts";

serve(async (req) => {
  try {
    const {
      originalProductId,
      dupeProductIds,
      originalBrand,
      dupeInfo
    } = await req.json();

    console.log(`Processing brands for product ${originalProductId}`);
    
    // Process original brand
    const originalBrandId = await processBrand(originalBrand);
    
    // Update original product with brand ID
    await supabase
      .from('products')
      .update({ brand_id: originalBrandId })
      .eq('id', originalProductId);
    
    // Process dupe brands in parallel
    const dupeBrands = dupeInfo.map(dupe => dupe.brand);
    const uniqueBrands = [...new Set(dupeBrands)];
    
    const brandPromises = uniqueBrands.map(brand => processBrand(brand));
    const brandIds = await Promise.all(brandPromises);
    
    // Create a map of brand to ID
    const brandMap = new Map();
    uniqueBrands.forEach((brand, index) => {
      brandMap.set(brand, brandIds[index]);
    });
    
    // Update dupes with brand IDs
    await Promise.all(
      dupeProductIds.map(async (dupeId, index) => {
        const brand = dupeInfo[index].brand;
        await supabase
          .from('products')
          .update({ brand_id: brandMap.get(brand) })
          .eq('id', dupeId);
      })
    );

    console.log('Successfully processed brands');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in process-brands:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
