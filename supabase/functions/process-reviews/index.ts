
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getProductReviewsAndResources, storeProductReviewsAndResources, supabase } from "../shared/db-client.ts";

serve(async (req) => {
  try {
    const {
      originalProductId,
      dupeProductIds,
      originalName,
      originalBrand,
      dupeInfo
    } = await req.json();

    console.log(`Processing reviews for product ${originalProductId}`);

    // Get reviews for original product
    const reviewsAndResources = await getProductReviewsAndResources(originalName, originalBrand);
    
    if (reviewsAndResources) {
      await storeProductReviewsAndResources(
        originalProductId,
        reviewsAndResources.userReviews || [],
        reviewsAndResources.productRating || { averageRating: null, totalReviews: 0, source: null },
        {}, // Empty social media object - will be handled by resources function
        [] // Empty articles - will be handled by resources function
      );
    }

    // Mark reviews as loaded
    await supabase
      .from('products')
      .update({ loading_reviews: false })
      .eq('id', originalProductId);

    // Process top dupe review only (to save API costs)
    if (dupeProductIds.length > 0) {
      const topDupeId = dupeProductIds[0];
      const topDupeInfo = dupeInfo[0];
      
      const dupeReviewsAndResources = await getProductReviewsAndResources(
        topDupeInfo.name, 
        topDupeInfo.brand
      );
      
      if (dupeReviewsAndResources) {
        await storeProductReviewsAndResources(
          topDupeId,
          dupeReviewsAndResources.userReviews || [],
          dupeReviewsAndResources.productRating || { averageRating: null, totalReviews: 0, source: null },
          {}, // Empty social media object
          [] // Empty articles
        );
      }
    }

    // Mark all dupes as reviews loaded (even if we only processed the top one)
    if (dupeProductIds.length > 0) {
      await supabase
        .from('products')
        .update({ loading_reviews: false })
        .in('id', dupeProductIds);
    }

    console.log('Successfully processed reviews');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
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
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
