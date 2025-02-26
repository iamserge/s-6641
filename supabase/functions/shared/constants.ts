/// <reference lib="es2015" />

// CORS Headers for Cross-Origin Requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Environment Variables
export const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
export const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
export const GOOGLE_CSE_ID = Deno.env.get("GOOGLE_CSE_ID");
export const HF_API_KEY = Deno.env.get("HF_API_KEY");
export const supabaseUrl = Deno.env.get("SUPABASE_URL");
export const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
export const UPC_ITEMDB_API_KEY = Deno.env.get("UPC_ITEMDB_API_KEY");
export const GETIMG_API_KEY = Deno.env.get("GETIMG_API_KEY");

// Check required environment variables
if (!PERPLEXITY_API_KEY || !OPENAI_API_KEY || !supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required environment variables. Please check your configuration.");
}

// API Endpoints
export const PERPLEXITY_API_ENDPOINT = "https://api.perplexity.ai/chat/completions";
export const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
export const UPC_ITEMDB_API_ENDPOINT = "https://api.upcitemdb.com/prod/trial/lookup";
export const HF_API_ENDPOINT = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";
export const BACKGROUND_REMOVAL_API = "https://api.easyimg.io/v1/remove-background";
export const GETIMG_BASE_URL = "https://api.getimg.ai/v1/enhancements";

export const INITIAL_DUPES_SCHEMA = {
  originalName: "string",
  originalBrand: "string",
  originalCategory: "string",
  dupes: [
    {
      name: "string",
      brand: "string",
      matchScore: "number"
    }
  ]
};

// Schema Definition for API Responses
export const SCHEMA_DEFINITION = `{
  "original": {
    "name": string,                  // Full product name including shade if applicable
    "brand": string,                 // Brand name only
    "price": number,                 // Current retail price in USD
    "category": string,              // Product category (Foundation, Lipstick, Eyeshadow, etc.)
    "keyIngredients": string[],      // Array of main ingredients, especially actives
    "imageUrl": string,              // URL to high-quality product image
    "texture": string,               // Texture description (e.g., "creamy", "lightweight")
    "finish": string,                // Finish type (e.g., "matte", "dewy", "satin")
    "coverage": string,              // Coverage level if applicable
    "spf": number,                   // SPF rating if present
    "skinTypes": string[],           // Array of compatible skin types
    "attributes": string[],          // Array of key characteristics
    "countryOfOrigin": string,       // Manufacturing country
    "longevityRating": number,       // 1-10 scale
    "oxidationTendency": string,     // "None", "Minor", or "Significant"
    "bestFor": string[],             // Skin types or conditions product works well with
    "freeOf": string[],              // Claims about excluded ingredients
    "crueltyFree": boolean,          // Cruelty-free status
    "vegan": boolean,                // Vegan status
    "notes": string                  // Additional product information
  },
  "dupes": [{
    "name": string,                  // Full product name including shade
    "brand": string,                 // Brand name only
    "price": number,                 // Current retail price in USD
    "category": string,              // Product category (can differ from original)
    "keyIngredients": string[],      // Main ingredients
    "imageUrl": string,              // URL to high-quality product image
    "texture": string,               // Texture description (e.g., "creamy", "lightweight")
    "finish": string,                // Finish type (e.g., "matte", "dewy", "satin")
    "coverage": string,              // Coverage level if applicable
    "spf": number,                   // SPF rating if present
    "skinTypes": string[],           // Array of compatible skin types
    "attributes": string[],          // Array of key characteristics
    "countryOfOrigin": string,       // Manufacturing country
    "longevityRating": number,       // 1-10 scale
    "bestFor": string[],             // Best conditions/skin types
    "freeOf": string[],              // Claims about excluded ingredients
    "crueltyFree": boolean,          // Cruelty-free status
    "vegan": boolean,                // Vegan status
    "notes": string,                 // Additional observations, differences
    
    // Dupe-specific comparison fields
    "savingsPercentage": number,     // Calculated savings vs original
    "matchScore": number,            // Overall similarity score (0-100)
    "colorMatchScore": number,       // Color similarity (0-100)
    "formulaMatchScore": number,     // Formula similarity (0-100)
    "dupeType": string,              // Categorization of the dupe
    "validationSource": string,      // Where this dupe was validated
    "confidenceLevel": string,       // "High", "Medium", or "Low"
    "longevityComparison": string,   // How it compares to original
    "purchaseLink": string           // Where to buy the dupe
  }],
  "summary": string,                 // Concise overview comparing original and dupes
  "resources": [{
    "title": string,                 // Resource title or description 
    "url": string,                   // Link to resource
    "type": "Video" | "YouTube" | "Instagram" | "TikTok" | "Article" | "Reddit" // Resource type
  }]
}`