
// Updated process-resources/index.ts
// Re-deployed to fix the error with missing exports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getBatchProductResources } from "../services/perplexity.ts";
import { processBatchResources } from "../services/db-client.ts";
import { supabase } from "../shared/db-client.ts";
import { corsHeaders } from "../shared/utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      originalProductId,
      dupeProductIds,
      originalName,
      originalBrand,
      dupeInfo
    } = await req.json();

    console.log(`Processing resources for product ${originalProductId} and ${dupeProductIds.length} dupes`);

    // Mark all products as loading resources
    await supabase
      .from('products')
      .update({ loading_resources: true })
      .eq('id', originalProductId);
      
    if (dupeProductIds.length > 0) {
      await supabase
        .from('products')
        .update({ loading_resources: true })
        .in('id', dupeProductIds);
    }

    // Prepare products array for batch processing
    const products = [
      { id: originalProductId, name: originalName, brand: originalBrand },
      ...dupeInfo.map((dupe, index) => ({
        id: dupeProductIds[index],
        name: dupe.name,
        brand: dupe.brand
      }))
    ];

    // Get resources for all products in a single call
    const batchResourcesData = await getBatchProductResources(products);
    
    // Process and store all the resources
    await processBatchResources(batchResourcesData);

    console.log('Successfully processed resources for all products');
    return new Response(
      JSON.stringify({ 
        success: true,
        processed: Object.keys(batchResourcesData.products).length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in process-resources:', error);
    
    // Mark resources as loaded even on error
    try {
      const { originalProductId, dupeProductIds } = await req.json();
      await supabase
        .from('products')
        .update({ loading_resources: false })
        .eq('id', originalProductId);
        
      if (dupeProductIds?.length) {
        await supabase
          .from('products')
          .update({ loading_resources: false })
          .in('id', dupeProductIds);
      }
    } catch (e) {
      console.error('Error updating loading state:', e);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
