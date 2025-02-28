import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDetailedDupeAnalysis } from "../services/perplexity.ts";
import { fetchProductDataFromExternalDb } from "../services/external-db.ts";
import { processAndUploadImage } from "../services/images.ts";
import { supabase } from "../shared/db-client.ts";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients.ts";
import { logInfo, logError } from "../shared/utils.ts";

// Function to store product offers
async function storeProductOffers(productId, offers) {
  // Store merchant information and offers
  for (const offer of offers) {
    // First, store or update merchant
    let merchantId;
    
    if (offer.merchant) {
      const { data: existingMerchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('name', offer.merchant.name)
        .single();
      
      if (existingMerchant) {
        merchantId = existingMerchant.id;
        
        // Update merchant if needed
        await supabase
          .from('merchants')
          .update({
            domain: offer.merchant.domain || null,
            logo_url: offer.merchant.logo_url || null
          })
          .eq('id', merchantId);
      } else {
        // Create new merchant
        const { data: newMerchant } = await supabase
          .from('merchants')
          .insert({
            name: offer.merchant.name,
            domain: offer.merchant.domain || null,
            logo_url: offer.merchant.logo_url || null
          })
          .select('id')
          .single();
        
        merchantId = newMerchant.id;
      }
    }
    
    // Store offer
    const { data: newOffer } = await supabase
      .from('offers')
      .insert({
        merchant_id: merchantId,
        title: offer.title || null,
        price: offer.price,
        list_price: offer.list_price || null,
        currency: offer.currency || 'USD',
        condition: offer.condition || 'New',
        availability: offer.availability || null,
        shipping: offer.shipping || null,
        link: offer.link,
        updated_t: offer.updated_t || Math.floor(Date.now() / 1000)
      })
      .select('id')
      .single();
    
    // Link offer to product
    await supabase
      .from('product_offers')
      .insert({
        product_id: productId,
        offer_id: newOffer.id,
        is_best_price: true // Mark as best price (can be updated later with proper logic)
      });
  }
}

serve(async (req) => {
  try {
    const {
      originalProductId,
      dupeProductIds,
      originalName,
      originalBrand,
      dupeInfo
    } = await req.json();

    logInfo(`Processing detailed analysis for product ${originalProductId}`);

    // Set loading_ingredients flag to true for the products
    await supabase
      .from('products')
      .update({ loading_ingredients: true })
      .eq('id', originalProductId);

    if (dupeProductIds.length > 0) {
      await supabase
        .from('products')
        .update({ loading_ingredients: true })
        .in('id', dupeProductIds);
    }

    try {
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

      // Store offers for original product if available
      if (detailedAnalysis.original.offers && detailedAnalysis.original.offers.length > 0) {
        await storeProductOffers(originalProductId, detailedAnalysis.original.offers);
      }

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

          // Store offers for dupe product if available
          if (dupe.offers && dupe.offers.length > 0) {
            await storeProductOffers(dupeId, dupe.offers);
          }

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

      // Process ingredients for original product from detailed analysis data
      if (detailedAnalysis.original.keyIngredients && detailedAnalysis.original.keyIngredients.length > 0) {
        await processProductIngredients(originalProductId, detailedAnalysis.original.keyIngredients);
        logInfo(`Processed ingredients for original product ${originalProductId}`);
      }

      // Process ingredients for dupes from detailed analysis data
      await Promise.all(
        dupeProductIds.map(async (dupeId, index) => {
          const dupe = detailedAnalysis.dupes[index];
          if (dupe && dupe.keyIngredients && dupe.keyIngredients.length > 0) {
            await processDupeIngredients(dupeId, dupe.keyIngredients);
            logInfo(`Processed ingredients for dupe product ${dupeId}`);
          }
        })
      );

      logInfo('Successfully processed detailed analysis');
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      logError('Error in detailed analysis processing:', error);
      throw error;
    } finally {
      // Always update loading_ingredients flag to false when done, even on error
      await supabase
        .from('products')
        .update({ loading_ingredients: false })
        .eq('id', originalProductId);

      if (dupeProductIds.length > 0) {
        await supabase
          .from('products')
          .update({ loading_ingredients: false })
          .in('id', dupeProductIds);
      }
    }
  } catch (error) {
    logError('Error in process-detailed-analysis:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});