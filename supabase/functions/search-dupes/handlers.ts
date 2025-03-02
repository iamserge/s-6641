import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { storeProductOffers, supabase } from "../shared/db-client.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { getInitialDupes, getDetailedDupeAnalysis } from "../services/perplexity.ts";
import { processProductImage } from "../services/image-enhancement.ts";
import { uploadProcessedImageToSupabase, processAndUploadImage } from "../services/images.ts"
import { cleanupAndStructureData } from "../services/openai.ts";
import { DupeResponse } from "../shared/types.ts";
import { fetchProductDataFromExternalDb } from "../services/external-db.ts";

/**
 * Main handler for searching and processing dupes
 */
export async function searchAndProcessDupes(searchText: string, onProgress: (message: string) => void) {
  try {
    onProgress("Heyyy! We're on the hunt for the perfect dupes for you! 🎨");

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

    if (existingProducts && existingProducts.length > 0) {
      logInfo(`Found existing product: ${existingProducts[0].name}`);
      onProgress("Oh, we already know this one! Let's show you the dupes... 🌟");
      return {
        success: true,
        data: {
          name: existingProducts[0].name,
          brand: existingProducts[0].brand,
          slug: existingProducts[0].slug
        }
      };
    }

    onProgress("Scouring the beauty universe for your perfect match... 💄");
    logInfo('No existing product found. Getting initial dupes from Perplexity...');
    const initialDupes = await getInitialDupes(searchText);

    if (!initialDupes.originalName || !initialDupes.originalBrand) {
      throw new Error('Could not identify original product from search text');
    }

    onProgress("Found some gems! Let's doll them up with more details... 💎");
    logInfo('Enriching product data from UPC Item DB...');

    // Prioritize UPC lookup if available, otherwise use keyword search
    const originalProductData = await fetchProductDataFromExternalDb(initialDupes.originalName, initialDupes.originalBrand);

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

    onProgress("Putting together your beauty dossier... 📋");
    logInfo('Getting detailed dupe analysis with enriched data...');
    const enrichedOriginal = {
      name: initialDupes.originalName,
      brand: initialDupes.originalBrand,
      ...(originalProductData.verified ? originalProductData : {})
    };

    const enrichedDupesForContext = enrichedDupes.map(dupe => ({
      name: dupe.name,
      brand: dupe.brand,
      ...(dupe.verified ? dupe : {})
    }));

    const detailedAnalysis = await getDetailedDupeAnalysis(
      enrichedOriginal,
      enrichedDupesForContext
    );
    
    // Preserve original product images
    if (originalProductData.images && originalProductData.images.length > 0) {
      // Ensure the images array exists and add any images from external data
      detailedAnalysis.original.images = [
        ...(detailedAnalysis.original.images || []),
        ...originalProductData.images
      ];
    }
    
    // Preserve dupe product images
    detailedAnalysis.dupes.forEach((dupe, index) => {
      const enrichedDupe = enrichedDupes[index];
      if (enrichedDupe.images && enrichedDupe.images.length > 0) {
        // Ensure the images array exists and add any images from external data
        dupe.images = [
          ...(dupe.images || []),
          ...enrichedDupe.images
        ];
      }
    });
    
    // Now store the enhanced analysis with the preserved images
    const result = await storeDataInDatabase(detailedAnalysis);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logError('Error in searchAndProcessDupes:', error);
    throw error;
  }
}



/**
 * Attempts to find the first valid image URL from an array of candidates
 * Tests each URL sequentially until it finds one that successfully loads
 * @param imageUrls Array of image URLs to try
 * @param fallbackUrl Optional fallback URL to use if all others fail
 * @returns The first valid image URL or fallback/undefined if all fail
 */
export async function findFirstValidImage(
  imageUrls: string[] | undefined, 
  fallbackUrl?: string
): Promise<string | undefined> {
  if (!imageUrls || imageUrls.length === 0) {
    logInfo("No image URLs provided, returning fallback");
    return fallbackUrl;
  }

  logInfo(`Testing ${imageUrls.length} image URLs for validity`);

  // Try each image URL in sequence
  for (const url of imageUrls) {
    try {
      // Skip empty URLs
      if (!url || url.trim() === '') continue;
      
      logInfo(`Testing image URL: ${url}`);
      
      // Attempt to fetch the image with a HEAD request to check if it exists
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          // Some servers require a user agent
          'User-Agent': 'Dupe.academy Image Validator (+https://dupe.academy)'
        }
      });
      
      // Check if the response is successful and is an image
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        logInfo(`Found valid image URL: ${url}`);
        return url;
      }
      
      logInfo(`Image URL invalid or not an image: ${url}`);
    } catch (error) {
      logError(`Error checking image URL ${url}:`, error);
      // Continue to the next URL on error
    }
  }

  // If we get here, none of the URLs worked
  logInfo("No valid image URLs found, using fallback");
  return fallbackUrl;
}

/**
 * Store structured data in the database
 */

export async function storeDataInDatabase(data: DupeResponse) {
  try {
    // 1. Create slug for the original product
    const productSlug = slugify(`${data.original.brand}-${data.original.name}`, { lower: true });

    // 2. Process original product image in main call
    // Find first valid image from the array or fall back to Perplexity-provided URL
    const originalImageUrl = await findFirstValidImage(
      data.original.images, 
      data.original.imageUrl
    );
    const processedOriginalImageUrl = originalImageUrl 
      ? await processAndUploadImage(originalImageUrl, `${productSlug}-original`)
      : undefined;

    // 3. Store original product with processed image and identification data
    const { data: originalProduct, error: productError } = await supabase
    .from('products')
    .insert({
      name: data.original.name,
      brand: data.original.brand,
      // Brand ID will be populated in background
      slug: productSlug,
      price: data.original.price,
      category: data.original.category,
      attributes: data.original.attributes || [],
      image_url: processedOriginalImageUrl, // Use processed image URL
      images: data.original.images || [],
      summary: data.summary,
      texture: data.original.texture,
      finish: data.original.finish,
      coverage: data.original.coverage,
      spf: data.original.spf,
      skin_types: data.original.skinTypes,
      country_of_origin: data.original.countryOfOrigin,
      longevity_rating: data.original.longevityRating,
      oxidation_tendency: data.original.oxidationTendency,
      free_of: data.original.freeOf || [],
      best_for: data.original.bestFor || [],
      cruelty_free: data.original.crueltyFree,
      vegan: data.original.vegan,
      notes: data.original.notes,
      // New fields for external data
      ean: data.original.ean,
      upc: data.original.upc,
      gtin: data.original.gtin,
      asin: data.original.asin,
      model: data.original.model,
      description: data.original.description,
      lowest_recorded_price: data.original.lowest_recorded_price,
      highest_recorded_price: data.original.highest_recorded_price
    })
    .select()
    .single();

    if (productError) {
      logError('Error storing original product:', productError);
      throw productError;
    }

    // Store offers for original product if available
    if (data.original.offers && data.original.offers.length > 0) {
      await storeProductOffers(originalProduct.id, data.original.offers);
    }

    // 4. Process and store dupes with images in main call
    const dupeIds = await Promise.all(
      data.dupes.map(async (dupe, index) => {
        const dupeSlug = slugify(`${dupe.brand}-${dupe.name}`, { lower: true });
        
        // Find first valid image from the array or fall back to Perplexity-provided URL
        const dupeImageUrl = await findFirstValidImage(
          dupe.images, 
          dupe.imageUrl
        );
        const processedDupeImageUrl = dupeImageUrl
          ? await processAndUploadImage(dupeImageUrl, `${productSlug}-dupe-${index + 1}`)
          : undefined;

        const { data: dupeProduct, error: dupeError } = await supabase
        .from('products')
        .insert({
          name: dupe.name,
          brand: dupe.brand,
          // Brand ID will be populated in background
          slug: dupeSlug,
          price: dupe.price,
          category: dupe.category || data.original.category,
          attributes: dupe.attributes || [],
          image_url: processedDupeImageUrl, // Use processed image URL
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
          purchase_link: dupe.purchaseLink,
          // New fields for external data
          ean: dupe.ean,
          upc: dupe.upc,
          gtin: dupe.gtin,
          asin: dupe.asin,
          model: dupe.model,
          description: dupe.description,
          lowest_recorded_price: dupe.lowest_recorded_price,
          highest_recorded_price: dupe.highest_recorded_price
        })
        .select()
        .single();

        if (dupeError) {
          logError(`Error storing dupe ${dupe.name}:`, dupeError);
          throw dupeError;
        }

        // Store offers for dupe product if available
        if (dupe.offers && dupe.offers.length > 0) {
          await storeProductOffers(dupeProduct.id, dupe.offers);
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

        return dupeProduct.id;
      })
    );

    // 6. Prepare result for frontend
    const result = {
      slug: productSlug,
      name: originalProduct.name,
      brand: originalProduct.brand,
      originalProductId: originalProduct.id,
      dupeProductIds: dupeIds
    };

    // 7. Trigger background task for brands and ingredients
    const backgroundTaskData = {
      originalProductId: originalProduct.id,
      dupeProductIds: dupeIds,
      originalBrand: data.original.brand,
      dupeBrands: data.dupes.map(dupe => dupe.brand),
      originalKeyIngredients: data.original.keyIngredients,
      dupeKeyIngredients: data.dupes.map(dupe => dupe.keyIngredients)
    };

    // Trigger Supabase Edge Function for background processing
    const supabaseUrl = Deno.env.get('SUPABASE_URL') // Replace with your actual Supabase URL
    fetch(`${supabaseUrl}/functions/v1/populate-brands-and-ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` // Use service role key if required
      },
      body: JSON.stringify(backgroundTaskData)
    }).catch(error => logError('Error triggering background task:', error));

    logInfo('Main request completed, background task triggered for brands and ingredients');
    return result;
  } catch (error) {
    logError('Error in storeDataInDatabase:', error);
    throw error;
  }
}
