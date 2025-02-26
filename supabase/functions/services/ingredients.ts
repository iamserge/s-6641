import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { 
  getIngredientByName, 
  insertIngredient, 
  linkIngredientToProduct, 
  linkIngredientToDupe 
} from "../shared/db-client.ts";
import { getIngredientInfo } from "./openai.ts";

/**
 * Process an ingredient and return its ID
 */
export async function processIngredient(ingredientName: string): Promise<string> {
  const trimmedName = ingredientName.trim();
  logInfo(`Processing ingredient: ${trimmedName}`);
  
  try {
    // Check if ingredient already exists
    const { data: existingIngredient, error: findError } = await getIngredientByName(trimmedName);
    
    if (findError && findError.code !== "PGRST116") {
      logError(`Error checking for ingredient ${trimmedName}:`, findError);
      throw findError;
    }
    
    if (existingIngredient) {
      logInfo(`Ingredient "${trimmedName}" already exists with ID: ${existingIngredient.id}`);
      return existingIngredient.id;
    }
    
    // Ingredient doesn't exist, get information from OpenAI using structured format
    const ingredientInfo = await getIngredientInfo(trimmedName);
    const slug = slugify(trimmedName, { lower: true });
    
    // Insert the new ingredient
    const { data: newIngredient, error: insertError } = await insertIngredient({
      name: trimmedName,
      slug: slug,
      description: ingredientInfo.description,
      benefits: ingredientInfo.benefits || [],
      concerns: ingredientInfo.concerns || [],
      skin_types: ingredientInfo.skin_types || [],
      comedogenic_rating: ingredientInfo.comedogenic_rating,
      vegan: ingredientInfo.vegan,
      inci_name: ingredientInfo.inci_name,
      ethically_sourced: ingredientInfo.ethically_sourced,
      is_controversial: ingredientInfo.is_controversial,
      restricted_in: ingredientInfo.restricted_in
    });
    
    if (insertError) {
      logError(`Failed to insert ingredient ${trimmedName}:`, insertError);
      throw insertError;
    }
    
    logInfo(`Created new ingredient: ${trimmedName} with ID: ${newIngredient.id}`);
    return newIngredient.id;
  } catch (error) {
    logError(`Error processing ingredient ${trimmedName}:`, error);
    throw error;
  }
}

/**
 * Process all ingredients for a product and its dupes
 */
export async function processProductIngredients(
  productId: string, 
  ingredientNames: string[]
): Promise<void> {
  // Use object to track unique ingredients 
  const uniqueIngredients: Record<string, boolean> = {};
  
  // Build unique list
  for (let i = 0; i < ingredientNames.length; i++) {
    uniqueIngredients[ingredientNames[i].trim()] = true;
  }
  
  // Process each unique ingredient
  for (const ingredient in uniqueIngredients) {
    try {
      const ingredientId = await processIngredient(ingredient);
      await linkIngredientToProduct(productId, ingredientId);
      logInfo(`Linked ingredient ${ingredient} to product ${productId}`);
    } catch (error) {
      logError(`Failed to process ingredient ${ingredient} for product:`, error);
      // Continue with other ingredients even if one fails
    }
  }
}

/**
 * Process ingredients for a dupe
 */
export async function processDupeIngredients(
  dupeId: string, 
  ingredientNames: string[]
): Promise<void> {
  if (!ingredientNames || !Array.isArray(ingredientNames) || ingredientNames.length === 0) {
    return;
  }
  
  for (let i = 0; i < ingredientNames.length; i++) {
    const ingredient = ingredientNames[i].trim();
    try {
      const ingredientId = await processIngredient(ingredient);
      await linkIngredientToDupe(dupeId, ingredientId);
      logInfo(`Linked ingredient ${ingredient} to dupe ${dupeId}`);
    } catch (error) {
      logError(`Failed to process ingredient ${ingredient} for dupe:`, error);
      // Continue with other ingredients even if one fails
    }
  }
}