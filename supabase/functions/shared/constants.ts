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
  
  // Check required environment variables
  if (!PERPLEXITY_API_KEY || !OPENAI_API_KEY || !GOOGLE_API_KEY || !GOOGLE_CSE_ID || !supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required environment variables. Please check your configuration.");
  }
  
  // Schema Definition for API Responses
export const SCHEMA_DEFINITION = `{
    "original": {
      "name": string,                  // Full product name including shade if applicable
      "brand": string,                 // Brand name only
      "price": number,                 // Current retail price in USD
      "category": string,              // Product category (Foundation, Lipstick, Eyeshadow, etc.)
      "attributes": string[],          // Array of key characteristics (e.g., "matte finish", "full coverage")
      "keyIngredients": string[],      // Array of main ingredients, especially actives
      "imageUrl": string (optional),   // URL to high-quality product image
      "countryOfOrigin": string (optional), // Manufacturing country (useful for regulatory standards)
      "freeOf": string[] (optional),   // Claims about excluded ingredients
      "longevityRating": number (optional), // 1-10 scale
      "oxidationTendency": string (optional), // "None", "Minor", or "Significant"
      "bestFor": string[] (optional)   // Skin types or conditions product works well with
    },
    "dupes": [{
      "name": string,                  // Full product name including shade
      "brand": string,                 // Brand name only
      "price": number,                 // Current retail price in USD
      "category": string (optional),   // Product category (can differ from original)
      "savingsPercentage": number,     // Calculated savings vs original
      "keyIngredients": string[],      // Main ingredients
      "texture": string,               // Texture description (e.g., "creamy", "lightweight")
      "finish": string,                // Finish type (e.g., "matte", "dewy", "satin")
      "coverage": string (optional),   // Coverage level if applicable
      "spf": number (optional),        // SPF rating if present
      "skinTypes": string[],           // Array of compatible skin types
      "matchScore": number,            // Overall similarity score (0-100)
      "colorMatchScore": number (optional), // Color similarity (0-100)
      "formulaMatchScore": number (optional), // Formula similarity (0-100)
      "dupeType": string (optional),   // Categorization of the dupe
      "validationSource": string (optional), // Where this dupe was validated
      "confidenceLevel": string (optional), // "High", "Medium", or "Low"
      "longevityComparison": string (optional), // How it compares to original
      "notes": string,                 // Additional observations, differences
      "purchaseLink": string (optional), // Where to buy the dupe
      "imageUrl": string (optional),   // URL to high-quality product image
      "bestFor": string[] (optional),  // Best conditions/skin types
      "countryOfOrigin": string (optional), // Manufacturing country
      "crueltyFree": boolean (optional), // Cruelty-free status
      "vegan": boolean (optional)      // Vegan status
    }],
    "summary": string,                 // Concise overview comparing original and dupes
    "resources": [{
      "title": string,                 // Resource title or description 
      "url": string,                   // Link to resource
      "type": "Video" | "YouTube" | "Instagram" | "TikTok" | "Article" | "Reddit" // Resource type
    }]
  }`;
  
  // API Endpoints
  export const PERPLEXITY_API_ENDPOINT = "https://api.perplexity.ai/chat/completions";
  export const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
  export const HF_API_ENDPOINT = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";
  export const BACKGROUND_REMOVAL_API = "https://api.easyimg.io/v1/remove-background";