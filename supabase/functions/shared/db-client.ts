/// <reference lib="es2015" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo, logError } from "./utils.ts";
import { supabaseUrl, supabaseServiceKey } from "./constants.ts";
import { 
  Brand, 
  Ingredient, 
  Product, 
  ProductDupe,
  Resource,
  Database
} from "./types.ts";

// Initialize Supabase Client
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

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
export async function getProductByNameAndBrand(name: string, brand: string) {
  return await supabase
    .from("products")
    .select("*")
    .eq("name", name)
    .eq("brand", brand)
    .maybeSingle();
}

export async function getProductBySlug(slug: string) {
  return await supabase
    .from("products")
    .select("*")
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
 * Product Dupes related database operations
 */
export async function getProductDupesByOriginalId(originalProductId: string) {
  return await supabase
    .from("product_dupes")
    .select(`
      *,
      dupe_product:products!product_dupes_dupe_product_id_fkey (*)
    `)
    .eq("original_product_id", originalProductId);
}

export async function insertProductDupe(dupeData: ProductDupe) {
  return await supabase
    .from("product_dupes")
    .insert(dupeData)
    .select()
    .single();
}

/**
 * Product Ingredients junction table operations
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

/**
 * Link ingredient to dupe product
 */
export async function linkIngredientToDupe(dupeId: string, ingredientId: string, isKey: boolean = true) {
  try {
    const { error } = await supabase
      .from("product_ingredients")
      .insert({
        product_id: dupeId, // Note: dupes are stored in the products table, so we use the same table
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

/**
 * Merchants and Offers operations
 */
export async function getMerchantByDomain(domain: string) {
  return await supabase
    .from("merchants")
    .select("*")
    .eq("domain", domain)
    .maybeSingle();
}

export async function insertMerchant(merchantData: {
  name: string;
  domain?: string;
  logo_url?: string;
}) {
  return await supabase
    .from("merchants")
    .insert(merchantData)
    .select()
    .single();
}

export async function insertOffer(offerData: {
  merchant_id: string;
  title?: string;
  price: number;
  list_price?: number;
  currency?: string;
  shipping?: string;
  condition?: string;
  availability?: string;
  link: string;
}) {
  return await supabase
    .from("offers")
    .insert(offerData)
    .select()
    .single();
}

export async function linkOfferToProduct(productId: string, offerId: string, isBestPrice: boolean = false) {
  return await supabase
    .from("product_offers")
    .insert({
      product_id: productId,
      offer_id: offerId,
      is_best_price: isBestPrice
    });
}