
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { logInfo, logError } from "../shared/utils";
import { corsHeaders } from "../shared/constants";
import { DupeResponse, ProductCategory } from "../shared/types";
import { 
  getProductByNameAndSlug, 
  insertProduct, 
  insertDupe,
  insertResources,
  processIngredients,
  linkIngredientToDupe
} from "../shared/db-client";
import { processBrand } from "../services/brands";
import { getPerplexityResponse, enrichProductData } from "../services/perplexity";
import { processProductImages } from "../services/images";

export async function handleDupeSearch(req: Request): Promise<Response> {
  try {
    const { searchText } = await req.json();
    if (!searchText) throw new Error("No search query provided");
    logInfo(`Searching for dupes for: ${searchText}`);

    const data = await getPerplexityResponse(searchText);
    const { original, dupes, summary, resources } = data;

    const slug = slugify(`${original.brand}-${original.name}`, { lower: true });
    const imageResults = await processProductImages(original.name, original.brand, slug, dupes);
    
    original.imageUrl = imageResults.originalImageUrl;
    for (let i = 0; i < dupes.length; i++) {
      dupes[i].imageUrl = imageResults.dupeImageUrls[i];
    }

    const { data: existingProduct, error: checkError } = await getProductByNameAndSlug(original.name, slug);
    if (checkError && checkError.code !== "PGRST116") throw checkError;

    if (existingProduct) {
      logInfo(`Product ${original.name} already exists with ID: ${existingProduct.id}`);
      return new Response(
        JSON.stringify({ success: true, data: { id: existingProduct.id, slug } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const originalBrandId = await processBrand(original.brand);
    const enrichedProductData = await enrichProductData(original.name, original.brand);

    const { data: productData, error: productError } = await insertProduct({
      name: original.name,
      brand_id: originalBrandId,
      price: original.price,
      category: original.category,
      attributes: original.attributes,
      image_url: original.imageUrl,
      summary,
      slug,
      country_of_origin: original.countryOfOrigin || enrichedProductData.country_of_origin,
      longevity_rating: original.longevityRating || enrichedProductData.longevity_rating,
      oxidation_tendency: original.oxidationTendency || enrichedProductData.oxidation_tendency,
      free_of: original.freeOf || enrichedProductData.free_of,
      best_for: enrichedProductData.best_for
    });

    if (productError) throw productError;
    logInfo(`Product inserted successfully with ID: ${productData.id}`);

    const dupeIds: string[] = [];
    
    for (const dupe of dupes) {
      try {
        const dupeBrandId = await processBrand(dupe.brand);
        
        const { data: dupeData, error: dupeInsertError } = await insertDupe({
          product_id: productData.id,
          brand_id: dupeBrandId,
          name: dupe.name,
          category: dupe.category,
          price: dupe.price,
          savings_percentage: dupe.savingsPercentage,
          texture: dupe.texture,
          finish: dupe.finish,
          coverage: dupe.coverage,
          spf: dupe.spf || null,
          match_score: dupe.matchScore,
          color_match_score: dupe.colorMatchScore,
          formula_match_score: dupe.formulaMatchScore,
          dupe_type: dupe.dupeType,
          validation_source: dupe.validationSource,
          confidence_level: dupe.confidenceLevel,
          longevity_comparison: dupe.longevityComparison,
          verified: false,
          notes: dupe.notes,
          purchase_link: dupe.purchaseLink || null,
          image_url: dupe.imageUrl,
          skin_types: dupe.skinTypes || [],
          best_for: dupe.bestFor || [],
          cruelty_free: dupe.crueltyFree,
          vegan: dupe.vegan,
          country_of_origin: dupe.countryOfOrigin
        });

        if (dupeInsertError) throw dupeInsertError;
        
        dupeIds.push(dupeData.id);
        logInfo(`Inserted dupe ${dupe.name} with ID: ${dupeData.id}`);
        
        if (dupe.keyIngredients && Array.isArray(dupe.keyIngredients)) {
          const processedIngredients = await processIngredients(dupe.keyIngredients);
          for (const ingredientId of processedIngredients) {
            await linkIngredientToDupe(dupeData.id, ingredientId, true);
          }
        }
      } catch (error) {
        logError(`Failed to insert dupe ${dupe.name}:`, error);
      }
    }

    const resourcesData = resources.map(resource => ({
      product_id: productData.id,
      title: resource.title,
      url: resource.url,
      type: resource.type,
    }));

    const { error: resourcesError } = await insertResources(resourcesData);
    if (resourcesError) {
      logError(`Failed to insert resources:`, resourcesError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          id: productData.id,  
          slug,
          brandId: originalBrandId,
          dupeIds
        } 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("Error in search-dupes function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
