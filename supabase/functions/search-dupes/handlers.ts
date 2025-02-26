import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { supabase } from "../shared/db-client.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { getInitialDupes, getDetailedDupeAnalysis } from "../services/perplexity.ts";
import { processBrand } from "../services/brands.ts";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients.ts";
import { processProductImage } from "./image-enhancement.ts";
import { uploadProcessedImageToSupabase } from "./images.ts";
import { cleanupAndStructureData } from "../services/openai.ts";
import { DupeResponse } from "../shared/types.ts";
import { fetchProductDataFromExternalDb } from "../services/external-db.ts";

/**
 * Main handler for searching and processing dupes
 */
export async function searchAndProcessDupes(searchText: string) {
  try {
    // Step 1: Check if we already have this product in our database
    const { data: existingProducts, error: searchError } = await supabase
      .from('products')
      .select('id, name, brand, slug')
      .or(`name.ilike.%${searchText}%,brand.ilike.%${searchText}%`)
      .limit(1);

    if (searchError) {
      logError('Error searching existing products:', searchError);
      throw searchError;
    }

    // If we found an existing product, return its data
    if (existingProducts && existingProducts.length > 0) {
      logInfo(`Found existing product: ${existingProducts[0].name}`);
      return {
        success: true,
        data: {
          name: existingProducts[0].name,
          brand: existingProducts[0].brand,
          slug: existingProducts[0].slug
        }
      };
    }

    // Step 2: Initial product search with Perplexity - just get names and brands
    logInfo('No existing product found. Getting initial dupes from Perplexity...');
    const initialDupes = await getInitialDupes(searchText);
    
    if (!initialDupes.originalName || !initialDupes.originalBrand) {
      throw new Error('Could not identify original product from search text');
    }
    
    // Step 3: Enrich product data from external databases (UPC Item DB)
    logInfo('Enriching product data from UPC Item DB...');
    const originalProductData = await fetchProductDataFromExternalDb(
      initialDupes.originalName, 
      initialDupes.originalBrand
    );
    
    const enrichedDupes = await Promise.all(
      initialDupes.dupes.map(async (dupe) => {
        const dupeData = await fetchProductDataFromExternalDb(dupe.name, dupe.brand);
        return { 
          name: dupe.name, 
          brand: dupe.brand, 
          ...dupeData 
        };
      })
    );
    
    // Step 4: Detailed dupe analysis with a second Perplexity request
    logInfo('Getting detailed dupe analysis with enriched data...');
    const enrichedOriginal = { 
      name: initialDupes.originalName, 
      brand: initialDupes.originalBrand,
      ...originalProductData 
    };
    
    const detailedAnalysis = await getDetailedDupeAnalysis(
      enrichedOriginal, 
      enrichedDupes
    );
    
    // Step 5: Data cleanup and structuring with OpenAI
    logInfo('Cleaning up and structuring data...');
    const structuredData = await cleanupAndStructureData(detailedAnalysis);
    
    // Step 6: Store in database
    logInfo('Storing data in database...');
    const result = await storeDataInDatabase(structuredData);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logError('Error in searchAndProcessDupes:', error);
    throw error;
  }
}

// Helper function to process and upload an image
async function processAndUploadImage(imageUrl: string | undefined, fileName: string): Promise<string | undefined> {
  if (!imageUrl) return undefined;
  try {
    const processedImageBase64 = await processProductImage(imageUrl);
    if (processedImageBase64) {
      return await uploadProcessedImageToSupabase(processedImageBase64, fileName);
    }
    return imageUrl; // Return original URL if processing fails
  } catch (error) {
    logError(`Error processing image for ${fileName}:`, error);
    return imageUrl; // Return original URL on error
  }
}

/**
 * Store structured data in the database
 */
async function storeDataInDatabase(data: DupeResponse) {
  try {
    // 1. Process and store brand information
    const originalBrand = await processBrand(data.original.brand);

    // 2. Create slug for the original product
    const productSlug = slugify(`${data.original.brand}-${data.original.name}`, { lower: true });

    // 3. Process original product image (use first image from external DB)
    const originalImageUrl = await processAndUploadImage(
      data.original.imageUrl, // Already fetched from external DB
      `${productSlug}-original`
    );

    // 4. Process dupe images concurrently (use first image from external DB)
    const dupeImageUrls = await Promise.all(
      data.dupes.map((dupe, index) =>
        processAndUploadImage(
          dupe.imageUrl, // Already fetched from external DB
          `${productSlug}-dupe-${index + 1}`
        )
      )
    );

    // 5. Store original product with processed image URL
    const { data: originalProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: data.original.name,
        brand: data.original.brand,
        brand_id: originalBrand,
        slug: productSlug,
        price: data.original.price,
        category: data.original.category,
        attributes: data.original.attributes || [],
        image_url: originalImageUrl, // Use processed image URL or fallback to original
        summary: data.summary,
        country_of_origin: data.original.countryOfOrigin,
        longevity_rating: data.original.longevityRating,
        oxidation_tendency: data.original.oxidationTendency,
        free_of: data.original.freeOf || [],
        best_for: data.original.bestFor || []
      })
      .select()
      .single();

    if (productError) {
      logError('Error storing original product:', productError);
      throw productError;
    }

    // 6. Process product ingredients
    if (data.original.keyIngredients && data.original.keyIngredients.length > 0) {
      await processProductIngredients(originalProduct.id, data.original.keyIngredients);
    }

    // 7. Process and store dupes with processed image URLs
    const dupeIds = await Promise.all(
      data.dupes.map(async (dupe, index) => {
        // Process dupe brand
        const dupeBrandId = await processBrand(dupe.brand);

        // Create dupe slug
        const dupeSlug = slugify(`${dupe.brand}-${dupe.name}`, { lower: true });

        // Store dupe product with processed image URL
        const { data: dupeProduct, error: dupeError } = await supabase
          .from('products')
          .insert({
            name: dupe.name,
            brand: dupe.brand,
            brand_id: dupeBrandId,
            slug: dupeSlug,
            price: dupe.price,
            category: dupe.category || data.original.category,
            texture: dupe.texture,
            finish: dupe.finish,
            coverage: dupe.coverage,
            spf: dupe.spf,
            skin_types: dupe.skinTypes,
            notes: dupe.notes,
            purchase_link: dupe.purchaseLink,
            image_url: dupeImageUrls[index], // Use processed image URL or fallback to original
            cruelty_free: dupe.crueltyFree,
            vegan: dupe.vegan,
            best_for: dupe.bestFor || []
          })
          .select()
          .single();

        if (dupeError) {
          logError(`Error storing dupe ${dupe.name}:`, dupeError);
          throw dupeError;
        }

        // Create product_dupes relationship
        const { error: relationError } = await supabase
          .from('product_dupes')
          .insert({
            original_product_id: originalProduct.id,
            dupe_product_id: dupeProduct.id,
            match_score: dupe.matchScore,
            savings_percentage: dupe.savingsPercentage
          });

        if (relationError) {
          logError(`Error creating dupe relationship for ${dupe.name}:`, relationError);
          throw relationError;
        }

        // Process dupe ingredients
        if (dupe.keyIngredients && dupe.keyIngredients.length > 0) {
          await processDupeIngredients(dupeProduct.id, dupe.keyIngredients);
        }

        return dupeProduct.id;
      })
    );

    // 8. Store resources
    if (data.resources && data.resources.length > 0) {
      const resourcesData = data.resources.map(resource => ({
        title: resource.title,
        url: resource.url,
        type: resource.type,
        product_id: originalProduct.id
      }));

      const { error: resourcesError } = await supabase
        .from('resources')
        .insert(resourcesData);

      if (resourcesError) {
        logError('Error storing resources:', resourcesError);
        // Non-critical error, continue without throwing
      }
    }

    // Return data for the frontend
    return {
      slug: productSlug,
      name: originalProduct.name,
      brand: originalProduct.brand
    };
  } catch (error) {
    logError('Error in storeDataInDatabase:', error);
    throw error;
  }
}