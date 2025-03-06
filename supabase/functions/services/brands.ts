/// <reference lib="es2015" />

import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { getBrandByName, insertBrand } from "../shared/db-client.ts";
import { getBrandInfo } from "./openai.ts";

/**
 * Process a brand and return its ID
 */
export async function processBrand(brandName: string): Promise<string> {
  logInfo(`Processing brand: ${brandName}`);
  
  try {
    // Check if brand already exists
    const { data: existingBrand, error: findError } = await getBrandByName(brandName);
    
    if (findError && findError.code !== "PGRST116") {
      logError(`Error checking for brand ${brandName}:`, findError);
      throw findError;
    }
    
    if (existingBrand) {
      logInfo(`Brand "${brandName}" already exists with ID: ${existingBrand?.id}`);
      return existingBrand?.id;
    }
    
    // Brand doesn't exist, get information from OpenAI using structured format
    const brandInfo = await getBrandInfo(brandName);
    const slug = slugify(brandName, { lower: true });
    
    // Insert the new brand
    const { data: newBrand, error: insertError } = await insertBrand({
      name: brandName,
      slug: slug,
      description: brandInfo.description,
      price_range: brandInfo.price_range,
      cruelty_free: brandInfo.cruelty_free,
      vegan: brandInfo.vegan,
      country_of_origin: brandInfo.country_of_origin,
      sustainable_packaging: brandInfo.sustainable_packaging,
      parent_company: brandInfo.parent_company
    });
    
    if (insertError) {
      logError(`Failed to insert brand ${brandName}:`, insertError);
      throw insertError;
    }
    
    logInfo(`Created new brand: ${brandName} with ID: ${newBrand?.id}`);
    return newBrand?.id;
  } catch (error) {
    logError(`Error processing brand ${brandName}:`, error);
    throw error;
  }
}