
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getBatchProductReviews } from "../services/perplexity.ts";
import { processBatchReviews } from "../services/db-client.ts";
import { supabase } from "../shared/db-client.ts";
import { corsHeaders } from "../shared/utils.ts";

// Adding this comment to trigger redeployment of the process-reviews function (timestamp: 2025-02-28 16:30:45)

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

    console.log(`Processing reviews for product ${originalProductId} and ${dupeProductIds.length} dupes`);

    // Mark all products as loading reviews
    await supabase
      .from('products')
      .update({ loading_reviews: true })
      .eq('id', originalProductId);
      
    if (dupeProductIds.length > 0) {
      await supabase
        .from('products')
        .update({ loading_reviews: true })
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

    // Get reviews for all products in a single call
    const batchReviewsData = await getBatchProductReviews(products);
    
    // Process and store all the reviews
    await processBatchReviews(batchReviewsData);

    console.log('Successfully processed reviews for all products');
    return new Response(
      JSON.stringify({ 
        success: true,
        processed: Object.keys(batchReviewsData.products).length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in process-reviews:', error);
    
    // Mark reviews as loaded even on error
    try {
      const { originalProductId, dupeProductIds } = await req.json();
      await supabase
        .from('products')
        .update({ loading_reviews: false })
        .eq('id', originalProductId);
        
      if (dupeProductIds?.length) {
        await supabase
          .from('products')
          .update({ loading_reviews: false })
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
