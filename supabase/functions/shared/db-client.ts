/// <reference lib="es2015" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";

import { logError, logInfo } from "./utils.ts";
import { supabaseUrl, supabaseServiceKey, OPENAI_API_KEY } from "./constants.ts";
import { 
  Brand, 
  Ingredient, 
  Product, 
  Dupe,
  Resource
} from "./types.ts";

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Brand-related database operations
 */
export async function getBrandByName(brandName: string) {
  return await supabase
    .from("brands")
    .select("id, name, slug, price_range, cruelty_free, vegan, country_of_origin, sustainable_packaging, parent_company")
    .eq("name", brandName)
    .maybeSingle();
}

export async function getBrandById(brandId: string) {
  return await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single();
}

export async function insertBrand(brandData: Partial<Brand>) {
  return await supabase
    .from("brands")
    .insert(brandData)
    .select()
    .single();
}

export async function updateBrand(brandId: string, brandData: Partial<Brand>) {
  return await supabase
    .from("brands")
    .update(brandData)
    .eq("id", brandId)
    .select()
    .single();
}

/**
 * Ingredient-related database operations
 */
export async function getIngredientByName(ingredientName: string) {
  return await supabase
    .from("ingredients")
    .select("*")
    .eq("name", ingredientName.trim())
    .maybeSingle();
}

export async function getIngredientById(ingredientId: string) {
  return await supabase
    .from("ingredients")
    .select("*")
    .eq("id", ingredientId)
    .single();
}

export async function insertIngredient(ingredientData: Partial<Ingredient>) {
  return await supabase
    .from("ingredients")
    .insert(ingredientData)
    .select()
    .single();
}

export async function updateIngredient(ingredientId: string, ingredientData: Partial<Ingredient>) {
  return await supabase
    .from("ingredients")
    .update(ingredientData)
    .eq("id", ingredientId)
    .select()
    .single();
}

/**
 * Product-related database operations
 */
export async function getProductByNameAndSlug(name: string, slug: string) {
  return await supabase
    .from("products")
    .select("*")
    .eq("name", name)
    .eq("slug", slug)
    .single();
}

export async function getProductById(productId: string) {
  return await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
}

export async function insertProduct(productData: Partial<Product>) {
  return await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();
}

export async function updateProduct(productId: string, productData: Partial<Product>) {
  return await supabase
    .from("products")
    .update(productData)
    .eq("id", productId)
    .select()
    .single();
}

/**
 * Dupe-related database operations
 */
export async function getDupesByProductId(productId: string) {
  return await supabase
    .from("dupes")
    .select("*")
    .eq("product_id", productId);
}

export async function insertDupe(dupeData: Partial<Dupe>) {
  return await supabase
    .from("dupes")
    .insert(dupeData)
    .select()
    .single();
}

export async function updateDupe(dupeId: string, dupeData: Partial<Dupe>) {
  return await supabase
    .from("dupes")
    .update(dupeData)
    .eq("id", dupeId)
    .select()
    .single();
}

/**
 * Resource-related database operations
 */
export async function insertResource(resourceData: Partial<Resource>) {
  return await supabase
    .from("resources")
    .insert(resourceData);
}

export async function insertResources(resourcesData: Partial<Resource>[]) {
  return await supabase
    .from("resources")
    .insert(resourcesData);
}

/**
 * Junction table operations
 */
export async function linkIngredientToProduct(productId: string, ingredientId: string, isKey: boolean = true) {
  try {
    const { error } = await supabase
      .from("product_ingredients")
      .insert({
        product_id: productId,
        ingredient_id: ingredientId,
        is_key_ingredient: isKey
      });
    
    if (error && error.code !== "23505") { // Ignore unique constraint violations
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    logError(`Failed to link ingredient to product:`, error);
    throw error;
  }
}

export async function linkIngredientToDupe(dupeId: string, ingredientId: string, isKey: boolean = true) {
  try {
    const { error } = await supabase
      .from("dupe_ingredients")
      .insert({
        dupe_id: dupeId,
        ingredient_id: ingredientId,
        is_key_ingredient: isKey
      });
    
    if (error && error.code !== "23505") { // Ignore unique constraint violations
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    logError(`Failed to link ingredient to dupe:`, error);
    throw error;
  }
}

/**
 * Image storage operations
 */
export async function uploadImage(bucket: string, path: string, file: Blob, contentType: string) {
  return await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType });
}

export async function getPublicUrl(bucket: string, path: string) {
  return supabase.storage
    .from(bucket)
    .getPublicUrl(path);
}



// Add this function to your search-dupes.ts file to extract and process ingredients

/**
 * Extracts ingredients from product data and stores them in the ingredients table
 * If ingredient already exists, it will be reused
 */
export async function processIngredients(productId: string, dupeIds: string[], dupeData: any): Promise<void> {
  logInfo("Processing ingredients for educational database");
  
  // 1. Extract unique ingredients from original product
  const originalIngredients = new Set<string>();
  
  // Original product's key ingredients are in dupe data
  if (dupeData && dupeData.dupes && dupeData.dupes.length > 0) {
    dupeData.dupes.forEach((dupe: any) => {
      if (dupe.keyIngredients && Array.isArray(dupe.keyIngredients)) {
        dupe.keyIngredients.forEach((ingredient: string) => {
          originalIngredients.add(ingredient.trim());
        });
      }
    });
  }
  
  // 2. Process and store each ingredient (only ones we don't already have)
  for (const ingredientName of originalIngredients) {
    // Check if ingredient already exists
    const { data: existingIngredient, error: ingredientError } = await supabase
      .from("ingredients")
      .select("id")
      .eq("name", ingredientName)
      .maybeSingle();
      
    if (ingredientError && ingredientError.code !== "PGRST116") {
      logError(`Error checking ingredient ${ingredientName}:`, ingredientError);
      continue;  // Skip this ingredient if there's an error
    }
    
    let ingredientId: string;
    
    if (!existingIngredient) {
      // Ingredient doesn't exist yet, get information about it from OpenAI
      try {
        const ingredientData = await getIngredientData(ingredientName);
        const slug = slugify(ingredientName, { lower: true });
        
        // Insert the new ingredient
        const { data: newIngredient, error: insertError } = await supabase
          .from("ingredients")
          .insert({
            name: ingredientName,
            slug: slug,
            description: ingredientData.description,
            purpose: ingredientData.purpose,
            benefits: ingredientData.benefits,
            concerns: ingredientData.concerns,
            skin_type_suitability: ingredientData.skinTypeSuitability,
            inci_name: ingredientData.inciName,
            is_comedogenic: ingredientData.isComedogenic,
            comedogenic_rating: ingredientData.comedogenicRating,
            vegan: ingredientData.vegan,
          })
          .select()
          .single();
          
        if (insertError) {
          logError(`Failed to insert ingredient ${ingredientName}:`, insertError);
          continue;  // Skip to next ingredient
        }
        
        ingredientId = newIngredient.id;
        logInfo(`Created new ingredient: ${ingredientName}`);
      } catch (error) {
        logError(`Failed to get data for ingredient ${ingredientName}:`, error);
        continue;  // Skip to next ingredient
      }
    } else {
      ingredientId = existingIngredient.id;
      logInfo(`Using existing ingredient: ${ingredientName}`);
    }
    
    // 3. Link ingredient to the original product
    try {
      await supabase
        .from("product_ingredients")
        .insert({
          product_id: productId,
          ingredient_id: ingredientId,
          is_key_ingredient: true,
        });
      
      logInfo(`Linked ingredient ${ingredientName} to original product`);
    } catch (error) {
      logError(`Failed to link ingredient ${ingredientName} to product:`, error);
    }
  }
  
  // 4. Process ingredients for each dupe
  for (let i = 0; i < dupeData.dupes.length; i++) {
    const dupe = dupeData.dupes[i];
    if (!dupe.keyIngredients || !Array.isArray(dupe.keyIngredients)) continue;
    
    for (const ingredientName of dupe.keyIngredients) {
      // Check if ingredient already exists
      const { data: existingIngredient, error: ingredientError } = await supabase
        .from("ingredients")
        .select("id")
        .eq("name", ingredientName.trim())
        .maybeSingle();
        
      if (ingredientError && ingredientError.code !== "PGRST116") {
        logError(`Error checking ingredient ${ingredientName}:`, ingredientError);
        continue;
      }
      
      let ingredientId: string;
      
      if (!existingIngredient) {
        // New ingredient, get data for it
        try {
          const ingredientData = await getIngredientData(ingredientName);
          const slug = slugify(ingredientName, { lower: true });
          
          // Insert the new ingredient
          const { data: newIngredient, error: insertError } = await supabase
            .from("ingredients")
            .insert({
              name: ingredientName,
              slug: slug,
              description: ingredientData.description,
              purpose: ingredientData.purpose,
              benefits: ingredientData.benefits,
              concerns: ingredientData.concerns,
              skin_type_suitability: ingredientData.skinTypeSuitability,
              inci_name: ingredientData.inciName,
              is_comedogenic: ingredientData.isComedogenic,
              comedogenic_rating: ingredientData.comedogenicRating,
              vegan: ingredientData.vegan,
            })
            .select()
            .single();
            
          if (insertError) {
            logError(`Failed to insert dupe ingredient ${ingredientName}:`, insertError);
            continue;
          }
          
          ingredientId = newIngredient.id;
          logInfo(`Created new ingredient from dupe: ${ingredientName}`);
        } catch (error) {
          logError(`Failed to get data for dupe ingredient ${ingredientName}:`, error);
          continue;
        }
      } else {
        ingredientId = existingIngredient.id;
        logInfo(`Using existing ingredient for dupe: ${ingredientName}`);
      }
      
      // Link ingredient to this dupe
      try {
        await supabase
          .from("product_ingredients")
          .insert({
            dupe_id: dupeIds[i],
            ingredient_id: ingredientId,
            is_key_ingredient: true,
          });
        
        logInfo(`Linked ingredient ${ingredientName} to dupe ${dupe.name}`);
      } catch (error) {
        logError(`Failed to link ingredient ${ingredientName} to dupe:`, error);
      }
    }
  }
  
  logInfo("Ingredient processing completed");
}

/**
 * Gets detailed information about an ingredient using OpenAI
 */
async function getIngredientData(ingredientName: string): Promise<any> {
  logInfo(`Getting information about ingredient: ${ingredientName}`);
  
  const prompt = `
  I need detailed information about the cosmetic ingredient "${ingredientName}".
  Provide the following details in a structured format:
  
  - Brief description (1-2 sentences)
  - Primary purposes in skincare/makeup products (as an array of terms)
  - Key benefits (as an array)
  - Potential concerns or side effects (as an array)
  - Skin types it's suitable for (as an array)
  - INCI name if different from common name
  - Whether it's typically comedogenic (true/false)
  - Comedogenic rating on a scale of 0-5 (where 0 is non-comedogenic)
  - Whether it's vegan (true/false)
  
  Format your response as a valid JSON object with these fields:
  {
    "description": string,
    "purpose": string[],
    "benefits": string[],
    "concerns": string[],
    "skinTypeSuitability": string[],
    "inciName": string or null,
    "isComedogenic": boolean,
    "comedogenicRating": number (0-5),
    "vegan": boolean
  }`;
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "o3-mini",
        messages: [
          { role: "system", content: "You are a cosmetic ingredient expert and formulator." },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 1000,
      }),
    });
    
    if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
    
    const data = await response.json();
    const jsonContent = data.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
    
    try {
      return JSON.parse(jsonContent);
    } catch (parseError) {
      logError(`Failed to parse ingredient data for ${ingredientName}:`, parseError);
      
      // Provide default values if parsing fails
      return {
        description: `${ingredientName} is a cosmetic ingredient commonly used in skincare and makeup products.`,
        purpose: ["unknown"],
        benefits: ["unspecified"],
        concerns: [],
        skinTypeSuitability: ["all"],
        inciName: null,
        isComedogenic: false,
        comedogenicRating: 0,
        vegan: true
      };
    }
  } catch (error) {
    logError(`API error while getting ingredient data for ${ingredientName}:`, error);
    throw error;
  }
}

/**
 * Processes brand information and stores it in the brands table
 */
async function processBrandInfo(brandName: string): Promise<string | null> {
  logInfo(`Processing information for brand: ${brandName}`);
  
  // Check if we already have this brand
  const { data: existingBrand, error: brandError } = await supabase
    .from("brands")
    .select("id")
    .eq("name", brandName)
    .maybeSingle();
    
  if (brandError && brandError.code !== "PGRST116") {
    logError(`Error checking for existing brand ${brandName}:`, brandError);
    return null;
  }
  
  // Return existing brand ID if found
  if (existingBrand) {
    logInfo(`Using existing brand record for: ${brandName}`);
    return existingBrand.id;
  }
  
  // Brand doesn't exist, get information about it from OpenAI
  try {
    const brandData = await getBrandData(brandName);
    const slug = slugify(brandName, { lower: true });
    
    // Insert the new brand
    const { data: newBrand, error: insertError } = await supabase
      .from("brands")
      .insert({
        name: brandName,
        slug: slug,
        description: brandData.description,
        founded_year: brandData.foundedYear,
        headquarters: brandData.headquarters,
        website_url: brandData.websiteUrl,
        price_range: brandData.priceRange,
        cruelty_free: brandData.crueltyFree,
        vegan: brandData.vegan,
        clean_beauty: brandData.cleanBeauty,
        sustainable_packaging: brandData.sustainablePackaging,
        key_values: brandData.keyValues,
        parent_company: brandData.parentCompany,
        product_categories: brandData.productCategories
      })
      .select()
      .single();
      
    if (insertError) {
      logError(`Failed to insert brand ${brandName}:`, insertError);
      return null;
    }
    
    logInfo(`Created new brand record: ${brandName}`);
    return newBrand.id;
  } catch (error) {
    logError(`Failed to get data for brand ${brandName}:`, error);
    return null;
  }
}

/**
 * Gets detailed information about a brand using OpenAI
 */
async function getBrandData(brandName: string): Promise<any> {
  logInfo(`Getting information about brand: ${brandName}`);
  
  const prompt = `
  I need detailed information about the beauty/cosmetics brand "${brandName}".
  Provide the following details in a structured format:
  
  - Brief description (2-3 sentences about their focus and reputation)
  - Year founded (if known, approximate if necessary)
  - Headquarters location (if known)
  - Website URL (if you know it)
  - Price range category (one of: 'budget', 'mid-range', 'luxury')
  - Whether they're cruelty-free (true/false/unknown)
  - Whether they offer vegan products (true/false/unknown)
  - Whether they market as "clean beauty" (true/false/unknown)
  - Whether they focus on sustainable packaging (true/false/unknown)
  - Key brand values (as an array of terms)
  - Parent company if owned by a conglomerate (or null)
  - Product categories they're known for (array, e.g. ['skincare', 'makeup'])
  
  Format your response as a valid JSON object.`;
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "o3-mini",
        messages: [
          { role: "system", content: "You are a beauty industry expert with extensive knowledge of cosmetic brands." },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 1000,
      }),
    });
    
    if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
    
    const data = await response.json();
    const jsonContent = data.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
    
    try {
      return JSON.parse(jsonContent);
    } catch (parseError) {
      logError(`Failed to parse brand data for ${brandName}:`, parseError);
      
      // Provide default values if parsing fails
      return {
        description: `${brandName} is a beauty brand known for its cosmetic products.`,
        foundedYear: null,
        headquarters: null,
        websiteUrl: null,
        priceRange: "mid-range",
        crueltyFree: null,
        vegan: null,
        cleanBeauty: null,
        sustainablePackaging: null,
        keyValues: [],
        parentCompany: null,
        productCategories: ["makeup", "skincare"]
      };
    }
  } catch (error) {
    logError(`API error while getting brand data for ${brandName}:`, error);
    throw error;
  }
}