
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

    console.log(`Processing resources for product ${originalProductId}`);

    // Get social media resources for original product
    const reviewsAndResources = await getProductReviewsAndResources(originalName, originalBrand);
    
    if (reviewsAndResources) {
      await storeProductReviewsAndResources(
        originalProductId,
        [], // Empty reviews array - handled by reviews function
        { averageRating: null, totalReviews: 0, source: null },
        {
          instagram: reviewsAndResources.socialMedia?.instagram || [],
          tiktok: reviewsAndResources.socialMedia?.tiktok || [],
          youtube: reviewsAndResources.socialMedia?.youtube || []
        },
        reviewsAndResources.articles || []
      );
    }

    // Mark resources as loaded
    await supabase
      .from('products')
      .update({ loading_resources: false })
      .eq('id', originalProductId);

    // Process top dupe resources only (to save API costs)
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
          [], // Empty reviews array
          { averageRating: null, totalReviews: 0, source: null },
          {
            instagram: dupeReviewsAndResources.socialMedia?.instagram || [],
            tiktok: dupeReviewsAndResources.socialMedia?.tiktok || [],
            youtube: dupeReviewsAndResources.socialMedia?.youtube || []
          },
          dupeReviewsAndResources.articles || []
        );
      }
    }

    // Mark all dupes as resources loaded
    if (dupeProductIds.length > 0) {
      await supabase
        .from('products')
        .update({ loading_resources: false })
        .in('id', dupeProductIds);
    }

    console.log('Successfully processed resources');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
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
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
