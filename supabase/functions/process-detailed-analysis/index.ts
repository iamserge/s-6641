
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDetailedDupeAnalysis } from "../services/perplexity.ts";
import { fetchProductDataFromExternalDb } from "../services/external-db.ts";
import { processAndUploadImage } from "../services/images.ts";
import { supabase } from "../shared/db-client.ts";

serve(async (req) => {
  try {
    const {
      originalProductId,
      dupeProductIds,
      originalName,
      originalBrand,
      dupeInfo
    } = await req.json();

    console.log(`Processing detailed analysis for product ${originalProductId}`);

    // Fetch extended information from external DBs
    const originalProductData = await fetchProductDataFromExternalDb(originalName, originalBrand);

    const enrichedDupes = await Promise.all(
      dupeInfo.map(async (dupe) => {
        const dupeData = await fetchProductDataFromExternalDb(dupe.name, dupe.brand);
        return {
          name: dupe.name,
          brand: dupe.brand,
          ...(dupeData.verified ? dupeData : {})
        };
      })
    );

    // Get detailed analysis from Perplexity
    const enrichedOriginal = {
      name: originalName,
      brand: originalBrand,
      ...(originalProductData.verified ? originalProductData : {})
    };

    const detailedAnalysis = await getDetailedDupeAnalysis(
      enrichedOriginal,
      enrichedDupes
    );

    // Process and upload images
    const { data: originalProduct } = await supabase
      .from('products')
      .select('slug')
      .eq('id', originalProductId)
      .single();
    
    const productSlug = originalProduct.slug;
    
    // Process original product image
    let originalImageUrl = null;
    if (detailedAnalysis.original.imageUrl || (detailedAnalysis.original.images && detailedAnalysis.original.images.length > 0)) {
      const imageSource = detailedAnalysis.original.images?.[0] || detailedAnalysis.original.imageUrl;
      originalImageUrl = await processAndUploadImage(imageSource, `${productSlug}-original`);
    }
    
    // Update original product with detailed info
    await supabase
      .from('products')
      .update({
        price: detailedAnalysis.original.price || 0,
        category: detailedAnalysis.original.category,
        attributes: detailedAnalysis.original.attributes || [],
        image_url: originalImageUrl,
        images: detailedAnalysis.original.images || [],
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
      })
      .eq('id', originalProductId);

    // Process and update dupes with detailed info
    await Promise.all(
      dupeProductIds.map(async (dupeId, index) => {
        const dupe = detailedAnalysis.dupes[index];
        if (!dupe) return;

        // Process dupe image
        let dupeImageUrl = null;
        if (dupe.imageUrl || (dupe.images && dupe.images.length > 0)) {
          const imageSource = dupe.images?.[0] || dupe.imageUrl;
          dupeImageUrl = await processAndUploadImage(imageSource, `${productSlug}-dupe-${index + 1}`);
        }

        // Update dupe product
        await supabase
          .from('products')
          .update({
            price: dupe.price || 0,
            category: dupe.category || detailedAnalysis.original.category,
            attributes: dupe.attributes || [],
            image_url: dupeImageUrl,
            images: dupe.images || [],
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
          })
          .eq('id', dupeId);

        // Update dupe relationship
        await supabase
          .from('product_dupes')
          .update({
            match_score: dupe.matchScore,
            savings_percentage: dupe.savingsPercentage
          })
          .eq('original_product_id', originalProductId)
          .eq('dupe_product_id', dupeId);
      })
    );

    console.log('Successfully processed detailed analysis');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in process-detailed-analysis:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
