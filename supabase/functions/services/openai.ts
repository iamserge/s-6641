/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="es2015" />

import { logInfo, logError } from "../shared/utils.ts";
import { BrandInfo, IngredientInfo, DupeResponse } from "../shared/types.ts";
import { OPENAI_API_KEY, OPENAI_API_ENDPOINT, SCHEMA_DEFINITION, INITIAL_DUPES_SCHEMA } from "../shared/constants.ts";

/**
 * Generic function to get structured data from OpenAI
 * Enhanced with stronger JSON-only output requirements and error handling
 */
async function getStructuredData<T>(
  prompt: string, 
  systemRole: string,
  schema: Record<string, any>
): Promise<T> {
  try {
    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "o3-mini", // Verify this is a valid model (e.g., "gpt-4o-mini" might be intended)
        messages: [
          { 
            role: "system", 
            content: systemRole + "\n\nIMPORTANT: You MUST return VALID JSON ONLY. Do not include any additional text, explanations, markdown formatting, or code block markers. The response should be pure JSON."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" }, // Enforce JSON format
      }),
    });
    
    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
        const errorMessage = `OpenAI API error: ${response.status} - ${errorBody.error?.message || JSON.stringify(errorBody)}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      } catch (parseError) {
        const rawBody = await response.text();
        const errorMessage = `OpenAI API error: ${response.status} - ${rawBody}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content) as T;
    } catch (parseError) {
      logError(`Failed to parse JSON:`, parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }
  } catch (error) {
    logError("Error fetching structured data from OpenAI:", error);
    throw error;
  }
}

/**
 * Gets brand information using OpenAI's structured format
 */
export async function getBrandInfo(brandName: string): Promise<BrandInfo> {
  logInfo(`Getting structured brand info for: ${brandName}`);
  
  const prompt = `
  Provide information about the beauty/cosmetics brand "${brandName}" with the following details:
  - description: A brief 2-3 sentence description of the brand and what it's known for
  - price_range: String with one of these values: "budget", "mid-range", or "luxury"
  - cruelty_free: Boolean indicating if the brand is cruelty-free (null if unknown)
  - vegan: Boolean indicating if the brand offers exclusively vegan products (null if unknown)
  - country_of_origin: Country where the brand is based (null if unknown)
  - sustainable_packaging: Boolean indicating if the brand uses sustainable packaging (null if unknown)
  - parent_company: Name of the parent company if the brand is owned by a larger corporation (null if independent or unknown)
  
  Return ONLY the JSON object.
  `;
  
  try {
    return await getStructuredData<BrandInfo>(
      prompt, 
      "You are a beauty industry expert. Provide accurate information about cosmetic brands in JSON format.",
      {
        description: "string",
        price_range: "string",
        cruelty_free: "boolean?",
        vegan: "boolean?",
        country_of_origin: "string?",
        sustainable_packaging: "boolean?",
        parent_company: "string?"
      }
    );
  } catch (error) {
    logError(`Failed to get brand info for ${brandName}:`, error);
    
    // Return default values if API call fails
    return {
      description: `${brandName} is a beauty brand that offers cosmetic products.`,
      price_range: "mid-range",
      cruelty_free: null,
      vegan: null,
      country_of_origin: undefined,
      sustainable_packaging: undefined,
      parent_company: undefined
    };
  }
}

/**
 * Gets ingredient information using OpenAI's structured format
 */
export async function getIngredientInfo(ingredientName: string): Promise<IngredientInfo> {
  logInfo(`Getting structured ingredient info for: ${ingredientName}`);
  
  const prompt = `
  Provide information about the cosmetic/skincare ingredient "${ingredientName}" with the following details:
  - description: A brief 1-2 sentence description of what it is and its main function
  - benefits: Array of 2-4 primary benefits of this ingredient
  - concerns: Array of any potential concerns or side effects (empty array if none)
  - skin_types: Array of skin types this is good for (e.g., "dry", "oily", "all", "sensitive")
  - comedogenic_rating: Number from 0-5 indicating how likely it is to clog pores (0 = not at all, 5 = highly likely)
  - vegan: Boolean indicating if this ingredient is typically vegan-friendly
  - inci_name: The INCI name if different from common name (null if same)
  - ethically_sourced: Boolean indicating if there are ethical sourcing concerns (null if unknown)
  - is_controversial: Boolean indicating if this ingredient is considered controversial
  - restricted_in: Array of regions where this ingredient is restricted or banned (empty if none)
  
  Return ONLY the JSON object.
  `;
  
  try {
    return await getStructuredData<IngredientInfo>(
      prompt,
      "You are a cosmetic chemist and skincare expert. Provide accurate information about cosmetic ingredients in JSON format.",
      {
        description: "string",
        benefits: "string[]",
        concerns: "string[]",
        skin_types: "string[]",
        comedogenic_rating: "number",
        vegan: "boolean",
        inci_name: "string?",
        ethically_sourced: "boolean?",
        is_controversial: "boolean?",
        restricted_in: "string[]"
      }
    );
  } catch (error) {
    logError(`Failed to get ingredient info for ${ingredientName}:`, error);
    
    // Return default values if API call fails
    return {
      description: `${ingredientName} is a common ingredient used in skincare and cosmetic products.`,
      benefits: ["Unknown benefits"],
      concerns: [],
      skin_types: ["all"],
      comedogenic_rating: 0,
      vegan: true,
      inci_name: undefined,
      ethically_sourced: undefined,
      is_controversial: undefined,
      restricted_in: []
    };
  }
}

/**
 * Gets product enrichment data using OpenAI's structured format
 */
export async function getProductEnrichmentData(productName: string, brand: string): Promise<any> {
  logInfo(`Getting structured enrichment data for: ${brand} ${productName}`);
  
  const prompt = `
  For the makeup product "${brand} ${productName}", provide the following details:
  - longevity_rating: A number from 1-10 indicating how long this product typically lasts
  - oxidation_tendency: One of: "None", "Minor", or "Significant" based on whether the product oxidizes
  - best_for: Array of conditions this product works well with (e.g., "oily skin", "humid climate")
  - country_of_origin: Country where the product is manufactured
  - free_of: Array of ingredients this product claims to be free from
  
  Return ONLY the JSON object.
  `;
  
  try {
    return await getStructuredData<any>(
      prompt,
      "You are a beauty product expert with extensive knowledge of cosmetics. Provide accurate information in JSON format.",
      {
        longevity_rating: "number?",
        oxidation_tendency: "string?",
        best_for: "string[]",
        country_of_origin: "string?",
        free_of: "string[]"
      }
    );
  } catch (error) {
    logError(`Failed to get enrichment data for ${brand} ${productName}:`, error);
    
    // Return default values if API call fails
    return {
      longevity_rating: null,
      oxidation_tendency: null,
      best_for: [],
      country_of_origin: null,
      free_of: []
    };
  }
}

/**
 * Repairs invalid JSON from Perplexity API using OpenAI's structured format
 * Enhanced with stronger error handling and validation
 */
export async function repairPerplexityResponse(perplexityContent: string, schemaDefinition: string): Promise<any> {
  logInfo("Repairing invalid JSON from Perplexity using OpenAI structured format");
  
  // First, try to clean up common JSON formatting issues
  const cleanedContent = perplexityContent
    .replace(/^```json\s*|\s*```$/g, '') // Remove Markdown code blocks
    .replace(/\/\/.*$/gm, '') // Remove JavaScript-style comments
    .replace(/[""]/g, '"') // Replace fancy quotes with regular quotes
    .replace(/\\n/g, ' ') // Replace newlines in strings with spaces
    .trim();
  
  // Try parsing the cleaned content directly first
  try {
    const parsedData = JSON.parse(cleanedContent);
    logInfo("Successfully parsed JSON after basic cleaning");
    return parsedData;
  } catch (parseError) {
    logInfo(`Basic cleaning insufficient, using OpenAI to repair: ${parseError.message}`);
  }
  
  const prompt = `
  The following text is supposed to be a JSON object but has formatting issues.
  Please convert it to a valid JSON object that follows this schema:
  
  ${schemaDefinition}
  
  Here is the text to fix:
  
  ${perplexityContent}
  
  Return ONLY the fixed JSON object with no explanations or additional text.
  `;
  
  try {
    const repairedJson = await getStructuredData<DupeResponse>(
      prompt,
      "You are a JSON repair service. Convert the provided text to valid JSON that matches the specified schema.",
      // We don't need to specify the schema here as it's included in the prompt
      {}
    );
    
    // Validate the repaired JSON has the required structure
    if (!repairedJson || 
        !repairedJson.original || 
        !repairedJson.dupes || 
        !Array.isArray(repairedJson.dupes)) {
      throw new Error("Repaired JSON is missing required fields");
    }
    
    return repairedJson;
  } catch (error) {
    logError("Failed to repair Perplexity response with OpenAI:", error);
    throw new Error("Could not repair the JSON response from Perplexity");
  }
}

/**
 * Cleans up and structures the dupe analysis data
 */
export async function cleanupAndStructureData(dupeAnalysis: any): Promise<DupeResponse> {
  logInfo("Cleaning up and structuring dupe analysis data");
  
  const prompt = `
  Please clean up and structure the following dupe analysis data to ensure it conforms to our schema:
  
  ${JSON.stringify(dupeAnalysis, null, 2)}
  
  The data should follow this schema:
  
  ${SCHEMA_DEFINITION}
  
  Ensure:
  1. All required fields are present
  2. Data types match what's expected in the schema
  3. Calculations like savings_percentage and match_score are accurate
  4. Any missing information is set to null or empty arrays
  5. All URLs are properly formatted
  
  Return ONLY the cleaned JSON object with no explanations or additional text.
  `;
  
  try {
    return await getStructuredData<DupeResponse>(
      prompt,
      "You are a data structure expert. Clean and format the provided data according to the specified schema.",
      // We don't need to specify the schema here as it's included in the prompt
      {}
    );
  } catch (error) {
    logError("Failed to clean up and structure dupe analysis:", error);
    
    // If OpenAI fails, return the original data as is
    return dupeAnalysis;
  }
}



export async function extractProductInfoFromImage(imageData: string): Promise<{
  name?: string;
  brand?: string;
  category?: string;
  barcode?: string;
}> {
  const logPrefix = `[OPENAI-VISION]`;
  logInfo(`${logPrefix} Analyzing image with OpenAI Vision API`);
  
  try {
    // Use OpenAI Vision to analyze the image
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You analyze images of products and return structured information. 
If the image shows a barcode or QR code, extract ONLY the numeric barcode number.
If the image shows a product, extract the product name, brand, and category if visible.

Return ONLY a valid JSON object with one of these two exact formats:

For barcodes:
{
  "barcode": "numeric code only"
}

For products:
{
  "name": "product name",
  "brand": "brand name if visible",
  "category": "product category if identifiable"
}

Do not include any additional fields or explanatory text.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image and extract either product details or barcode.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`${logPrefix} OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`Vision API error: ${response.status}`);
    }
    
    const result = await response.json();
    const content = result.choices[0].message.content;
    logInfo(`${logPrefix} OpenAI Vision API response received`);
    
    try {
      const parsedResult = JSON.parse(content);
      
      if (parsedResult.barcode) {
        logInfo(`${logPrefix} Barcode detected: ${parsedResult.barcode}`);
        return { barcode: parsedResult.barcode };
      } else {
        logInfo(`${logPrefix} Product detected: ${parsedResult.name}`);
        return {
          name: parsedResult.name,
          brand: parsedResult.brand,
          category: parsedResult.category
        };
      }
    } catch (parseError) {
      logError(`${logPrefix} Failed to parse OpenAI response: ${parseError.message}`);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    logError(`${logPrefix} Error processing image: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
/**
 * Cleans up and structures the initial dupes response from Perplexity using OpenAI
 * Enhanced with better error handling and validation
 */
export async function cleanupInitialDupes(perplexityContent: string): Promise<{
  originalName: string;
  originalBrand: string;
  originalCategory: string;
  dupes: Array<{ name: string; brand: string; matchScore: number}>;
}> {
  logInfo("Cleaning up initial dupes response with OpenAI");

  // First, try to clean up common JSON formatting issues
  const cleanedContent = perplexityContent
    .replace(/^```json\s*|\s*```$/g, '') // Remove Markdown code blocks
    .replace(/\/\/.*$/gm, '') // Remove JavaScript-style comments
    .replace(/[""]/g, '"') // Replace fancy quotes with regular quotes
    .replace(/\\n/g, ' ') // Replace newlines in strings with spaces
    .trim();
  
  // Try parsing the cleaned content directly first
  try {
    const parsedData = JSON.parse(cleanedContent);
    // Verify it has the required structure
    if (parsedData.originalName && parsedData.originalBrand && Array.isArray(parsedData.dupes)) {
      logInfo("Successfully parsed initial dupes JSON after basic cleaning");
      return parsedData;
    }
  } catch (parseError) {
    logInfo(`Basic cleaning insufficient for initial dupes, using OpenAI to repair: ${parseError.message}`);
  }

  const prompt = `
  The following text is supposed to be a JSON object but may have formatting issues.
  Please convert it to a valid JSON object that follows this schema:

  {
    "originalName": "string",
    "originalBrand": "string",
    "originalCategory": "string",
    "dupes": [
      {
        "name": "string",
        "brand": "string",
        "matchScore": "number"
      }
    ]
  }

  Here is the text to fix:

  ${perplexityContent}
  
  Return ONLY the valid JSON with no explanations or additional text.
  `;

  try {
    const result = await getStructuredData<{
      originalName: string;
      originalBrand: string;
      originalCategory: string;
      dupes: Array<{ name: string; brand: string; matchScore: number }>;
    }>(
      prompt,
      "You are a JSON repair service. Convert the provided text to valid JSON that matches the specified schema.",
      INITIAL_DUPES_SCHEMA // Pass the schema for validation
    );
    
    // Validate the result has the required structure
    if (!result || !result.originalName || !result.originalBrand || !Array.isArray(result.dupes)) {
      throw new Error("Repaired initial dupes JSON is missing required fields");
    }
    
    // Validate dupes array structure
    if (result.dupes.length > 0) {
      for (const dupe of result.dupes) {
        if (!dupe.name || !dupe.brand || typeof dupe.matchScore !== 'number') {
          throw new Error("Repaired initial dupes JSON has invalid dupe entries");
        }
      }
    }
    
    return result;
  } catch (error) {
    logError("Failed to clean up initial dupes response with OpenAI:", error);
    throw new Error("Could not clean up the initial dupes response from Perplexity");
  }
}