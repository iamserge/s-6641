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



// Schema for reviews and resources request
export const REVIEWS_RESOURCES_SCHEMA = `{
  "productRating": {
    "averageRating": number,       // Overall average rating out of 5 stars
    "totalReviews": number,        // Total number of reviews found
    "ratingDistribution": {        // Distribution of ratings (optional)
      "5star": number,
      "4star": number,
      "3star": number,
      "2star": number,
      "1star": number
    },
    "source": string              // Where this aggregated rating was found
  },
  "userReviews": [                // Array of 3-5 user reviews
    {
      "author": string,           // Username or name of reviewer
      "avatar": string,           // URL to author avatar (if available, else null)
      "rating": number,           // Individual rating out of 5
      "text": string,             // Full review text (trim to reasonable length)
      "source": string,           // Platform/website the review is from
      "sourceUrl": string,        // Direct URL to the review (if available)
      "verifiedPurchase": boolean // Whether it's a verified purchase
    }
  ],
  "socialMedia": {
    "instagram": [                // Array of Instagram posts/reels
      {
        "url": string,            // Direct URL to the post/reel
        "author": string,         // Username of the creator
        "authorHandle": string,   // @-handle 
        "thumbnail": string,      // URL to thumbnail image
        "views": number,          // View count if available (null if not)
        "likes": number,          // Like count if available (null if not)
        "type": string            // "post", "reel", "story"
      }
    ],
    "tiktok": [                  // Array of TikTok videos
      {
        "url": string,           // Direct URL to the TikTok
        "author": string,        // Username of the creator
        "authorHandle": string,  // @-handle
        "thumbnail": string,     // URL to thumbnail image
        "views": number,         // View count if available
        "likes": number,         // Like count if available
        "embed": string          // Embed code if available (null if not)
      }
    ],
    "youtube": [                 // Array of YouTube videos
      {
        "url": string,           // Direct URL to the video
        "title": string,         // Video title
        "author": string,        // Channel name
        "thumbnail": string,     // URL to thumbnail
        "duration": string,      // Duration string (e.g. "10:30")
        "views": number,         // View count if available
        "embed": string          // Embed code if available
      }
    ]
  },
  "articles": [                 // Array of blog articles/reviews
    {
      "url": string,            // Direct URL to the article
      "title": string,          // Article title
      "source": string,         // Website/blog name
      "excerpt": string,        // Short excerpt from the article
      "thumbnail": string       // URL to thumbnail/featured image (if available)
    }
  ]
}`;

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
    "notes": string,                 // A one liner, summarising what this dupe is about in relation to main product
    
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
  "summary": string,                 // A short, one two lines about main product and dupes we found.very simple, gen z fiendly, not cringe, add emojis. MAKE SURE ONLY TO MENTION DUPES THAT WE FOUND.
  
}`;