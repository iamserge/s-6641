import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { logInfo, logError } from "../shared/utils";
import { corsHeaders } from "../shared/constants";
import { DupeResponse, ProductCategory } from "../shared/types";
import { 
  getProductByNameAndSlug, 
  insertProduct, 
  insertDupe,
  insertResources
} from "../shared/db-client";
import { processBrand } from "../services/brands";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients";
import { processProductImages } from "../services/images";
import { getPerplexityResponse, enrichProductData } from "../services/perplexity";

/**
 * Validates that a string is a valid ProductCategory
 */
function validateProductCategory(category: string): ProductCategory | undefined {
  const validCategories: ProductCategory[] = [
    'Foundation', 'Concealer', 'Powder', 'Blush', 'Bronzer', 
    'Highlighter', 'Eyeshadow', 'Eyeliner', 'Mascara', 
    'Lipstick', 'Lip Gloss', 'Lip Liner', 'Setting Spray', 
    'Primer', 'Skincare', 'Haircare', 'Other'
  ];
  
  const normalized = category.trim();
  const match = validCategories.find(c => c.toLowerCase() === normalized.toLowerCase());
  
  return match;
}

/**
 * Handler for dupe search requests
 */
export async function handleDupeSearch(req: Request): Promise<Response> {
  try {
    // Validate request payload
    const { searchText } = await req.json();
    if (!searchText) throw new Error("No search query provided");
    logInfo(`Searching for dupes for: ${searchText}`);

    // Fetch dupe data from Perplexity
    const data = await getPerplexityResponse(searchText);
    const { original, dupes, summary, resources } = data;

    // Generate unique slug with brand for better uniqueness
    const slug = slugify(`${original.brand}-${original.name}`, { lower: true });

    // Process images for original product and dupes
    const imageResults = await processProductImages(original.name, original.brand, slug, dupes);
    original.imageUrl = imageResults.originalImageUrl;
    
    for (let i = 0; i < dupes.length; i++) {
      dupes[i].imageUrl = imageResults.dupeImageUrls[i];
    }

    // Check if product already exists
    const { data: existingProduct, error: checkError } = await getProductByNameAndSlug(original.name, slug);

    if (checkError && checkError.code !== "PGRST116") throw checkError; // PGRST116 means no rows found

    if (existingProduct) {
      logInfo(`Product ${original.name} already exists with ID: ${existingProduct.id}`);
      return new Response(
        JSON.stringify({ success: true, data: { id: existingProduct.id, slug } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process brand for original product
    const originalBrandId = await processBrand(original.brand);

    // Enrich product data with additional details from OpenAI
    const enrichedProductData = await enrichProductData(original.name, original.brand);

    // Validate and normalize product category
    const validatedCategory = original.category ? validateProductCategory(original.category) : undefined;

    // Insert original product into database
    logInfo(`Inserting product into database: ${original.name}`);
    const { data: productData, error: productError } = await insertProduct({
      name: original.name,
      brand_id: originalBrandId,
      price: original.price,
      category: validatedCategory,
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
    
    // Process and link ingredients for original product
    const allIngredientsList: string[] = [];
    
    // Add key ingredients from original product if available
    if (original.keyIngredients && Array.isArray(original.keyIngredients)) {
      for (let i = 0; i < original.keyIngredients.length; i++) {
        allIngredientsList.push(original.keyIngredients[i].trim());
      }
    }
    
    // Collect all ingredients from dupes to associate with original product
    for (let i = 0; i < dupes.length; i++) {
      const dupe = dupes[i];
      if (dupe.keyIngredients && Array.isArray(dupe.keyIngredients)) {
        for (let j = 0; j < dupe.keyIngredients.length; j++) {
          allIngredientsList.push(dupe.keyIngredients[j].trim());
        }
      }
    }
    
    // Process ingredients for original product
    await processProductIngredients(productData.id, allIngredientsList);

    // Insert dupes into database
    logInfo(`Inserting dupes into database for product ID: ${productData.id}`);
    const dupeIds: string[] = [];
    
    for (let i = 0; i < dupes.length; i++) {
      const dupe = dupes[i];
      try {
        // Process brand for this dupe
        const dupeBrandId = await processBrand(dupe.brand);
        
        // Validate and normalize dupe category
        const validatedDupeCategory = dupe.category ? validateProductCategory(dupe.category) : undefined;
        
        // Insert the dupe with brand relation
        const { data: dupeData, error: dupeInsertError } = await insertDupe({
          product_id: productData.id,
          brand_id: dupeBrandId,
          name: dupe.name,
          category: validatedDupeCategory,
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
          verified: false, // Default to false, can be updated later after manual verification
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
        
        // Process and link ingredients for this dupe
        if (dupe.keyIngredients && Array.isArray(dupe.keyIngredients)) {
          await processDupeIngredients(dupeData.id, dupe.keyIngredients);
        }
      } catch (error) {
        logError(`Failed to insert dupe ${dupe.name}:`, error);
        // Continue with other dupes
      }
    }

    // Insert resources into database
    logInfo(`Inserting resources into database for product ID: ${productData.id}`);
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

    // Return success response
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