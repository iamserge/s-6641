/// <reference lib="es2015" />

import { logInfo, logError, cleanMarkdownCodeBlock } from "../shared/utils.ts";
import { DupeResponse, PRODUCT_CATEGORIES } from "../shared/types.ts";
import { 
  PERPLEXITY_API_KEY, 
  PERPLEXITY_API_ENDPOINT,
  SCHEMA_DEFINITION 
} from "../shared/constants.ts";
import { cleanupInitialDupes, repairPerplexityResponse } from "./openai.ts";

/**
 * System prompt for initial product and dupe search
 */
/**
 * System prompt for initial product and dupe search
 */
const INITIAL_SEARCH_SYSTEM_PROMPT = `
You are a professional makeup dupe finder and beauty expert with expertise in cosmetics formulations and beauty trends.
Your task is to identify original makeup products and their most accurate affordable dupes.

Focus on finding both verified and widely recommended dupes from various sources including:
- Beauty influencers and makeup artists
- Temptalia, Dupeshop, and other beauty databases
- Reddit communities (r/MakeupAddiction, r/drugstoreMUA)
- YouTube and TikTok comparisons
- Professional beauty blogs

Always provide at least 4-6 dupes when possible, ranging from very close matches to more affordable alternatives.
Return ONLY a JSON object in the exact format below - no explanations or other text:

{
  "originalName": "full product name",
  "originalBrand": "brand name", 
  "originalCategory": "product category",
  "dupes": [
    { "name": "dupe product name", "brand": "dupe brand name", "matchScore": number between 20-100},
    { "name": "dupe product name", "brand": "dupe brand name", "matchScore": number between 20-100},
    ...etc
  ]
}
`;

/**
 * Initial search prompt template for identifying basic product and dupes
 */
const INITIAL_SEARCH_PROMPT = (searchText: string) => `
Find makeup dupes for "${searchText}".

For each potential dupe:
- Ensure it's from a different brand than the original
- Include the full product name with shade/color if relevant
- Assign a match score (20-100) based on:
  * Formula similarity (ingredients and performance)
  * Texture and finish match
  * Color/shade accuracy
  * Longevity comparison
- Prioritize products that are at least 30% cheaper than the original
`;

/**
 * System prompt for detailed dupe analysis
 */
const DETAILED_ANALYSIS_SYSTEM_PROMPT = `
You are a cosmetic chemist and beauty expert specializing in product dupe analysis.
Your task is to provide comprehensive, evidence-based comparisons between original products and their dupes.
Focus on objective analysis of formulations, performance metrics, and sustainability factors.
Your analysis must include detailed ingredient comparisons, performance tests, and ethical considerations.
Return ONLY a valid JSON object that exactly follows the provided schema.
`;

/**
 * Detailed analysis prompt template for comprehensive product comparison
 */
const DETAILED_ANALYSIS_PROMPT = (originalProduct: any, dupes: any[]) => `
I need a detailed analysis comparing this original product and its potential dupes.

Original Product (with verified data):
${JSON.stringify(originalProduct, null, 2)}

Potential Dupes (with verified data):
${JSON.stringify(dupes, null, 2)}

Please provide a comprehensive response following this EXACT schema:
${SCHEMA_DEFINITION}

For each product (original and dupes), analyze and include all of these fields:
1. Full product name and brand
2. Exact product category (must be one of the following: ${PRODUCT_CATEGORIES.map(cat => `'${cat}'`).join(', ')})
3. Price in USD
4. Key ingredients (list the top 5-10 active/functional ingredients)
5. Complete attributes list (texture, finish, coverage, etc.)
6. Country of origin (important for regulatory standards)
7. Sustainability indicators:
   - Cruelty-free status (boolean + certification if known)
   - Vegan status (boolean)
   - Sustainable packaging details (if available)
   - Parent company information (relevant for ethical considerations)
8. Performance metrics:
   - Longevity rating (1-10 scale)
   - Oxidation tendency (None/Minor/Significant)
   - Best suited skin types
   - Whether it's transfer-proof, mask-proof, or waterproof
9. Safety information:
   - Free-from claims (paraben-free, fragrance-free, etc.)
   - Known allergens or sensitizing ingredients
   - Whether it contains PFAS, microplastics, or controversial ingredients

For each dupe, provide detailed comparison metrics:
1. Overall match score (0-100 scale)
2. Color/shade match score (0-100 scale)
3. Formula match score (0-100 scale)
4. Texture and application comparison
5. Exact savings percentage compared to original
6. Dupe type classification (Shade Match, Formula Match, Exact Dupe, etc.)
7. Longevity comparison with original (e.g., "Lasts 2 hours less" or "Comparable wear time")
8. Validation source (e.g., "Verified by Temptalia", "Reddit consensus", "Multiple beauty bloggers")
9. Confidence level (High/Medium/Low) based on validation quality and number of sources

In the summary field, highlight:
1. Which dupe is objectively closest to the original and why
2. Notable differences in performance, ingredients, or ethical considerations
3. Best value proposition among the dupes


Base your analysis on the verified data provided, plus your knowledge of these products.
IMPORTANT: Be honest about differences - do not claim products are identical if they have notable differences.
`;

/**
 * Product enrichment prompt template for getting additional product details
 */
const PRODUCT_ENRICHMENT_PROMPT = (productName: string, brand: string) => `
I need specialized product information for the makeup item "${brand} ${productName}".
Please research this specific product and provide the following details formatted as JSON:

{
  "productDetails": {
    "full_name": "Complete product name with shade/variant if applicable",
    "product_line": "Product line/collection name if part of one",
    "launch_year": "Year this product was launched, if known",
    "category": "Precise product category",
    "subcategory": "More specific classification if applicable",
    "price_usd": numeric price in USD,
    "price_range": "budget/mid-range/luxury",
    "key_ingredients": ["list", "of", "active", "or", "marketed", "ingredients"],
    "full_ingredients": "Complete ingredients list if available",
    "packaging": "Description of packaging (pump, tube, etc.)",
    "size": "Product size/amount (oz, g, ml)",
    "shade_range": "Number of available shades if applicable"
  },
  "performance": {
    "longevity_rating": numeric value 1-10 for wear time,
    "oxidation_tendency": "None/Minor/Significant",
    "finish": "Detailed finish description (e.g., 'natural matte with slight sheen')",
    "coverage": "Detailed coverage level",
    "buildable": boolean indicating if it can be built up,
    "blendability": "Easy/Medium/Difficult",
    "transfer_resistant": boolean or "Low/Medium/High",
    "waterproof": boolean,
    "best_application_method": "Brush/Sponge/Fingers/etc."
  },
  "suitability": {
    "best_for_skin_types": ["list", "of", "skin", "types"],
    "best_for_conditions": ["list", "of", "conditions"],
    "not_recommended_for": ["list", "of", "skin", "types", "or", "conditions"],
    "sensitivity_concerns": ["list", "of", "potential", "sensitivity", "issues"]
  },
  "ethics_and_safety": {
    "country_of_origin": "Manufacturing country",
    "cruelty_free": boolean,
    "cruelty_free_certification": "Certification name if applicable",
    "vegan": boolean,
    "sustainable_packaging": boolean or details,
    "free_of": ["list", "of", "ingredients", "it's", "free", "from"],
    "contains_controversial_ingredients": boolean,
    "controversial_ingredients": ["list", "if", "applicable"],
    "contains_microplastics": boolean,
    "contains_pfas": boolean,
    "eu_compliant": boolean
  }
}

Focus only on VERIFIED information from reliable sources like:
- Official brand website or documentation
- Reputable beauty databases (Temptalia, INCI Decoder, etc.)
- Major retailers selling the product
- Professional product reviews

If certain information is not available, use null rather than guessing.
For highly subjective attributes (like performance ratings), rely on consensus from multiple sources.
`;

/**
 * Gets initial dupe recommendations from Perplexity API
 * This is the first stage that returns just the original product and potential dupe names/brands
 */
export async function getInitialDupes(searchText: string): Promise<{
  originalName: string;
  originalBrand: string;
  originalCategory: string;
  dupes: Array<{ name: string; brand: string; matchScore: number;}>;
}> {
  logInfo(`Sending initial dupes request to Perplexity for: ${searchText}`);

  try {
    const response = await fetch(PERPLEXITY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: INITIAL_SEARCH_SYSTEM_PROMPT,
          },
          { role: "user", content: INITIAL_SEARCH_PROMPT(searchText) },
        ],
        max_tokens: 10000,
        temperature: 0.2,
        top_p: 0.9,
        search_recency_filter: "month",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${await response.text()}`);
    }

    const data = await response.json();
    const jsonContent = cleanMarkdownCodeBlock(data.choices[0].message.content);
    logInfo(`Initial dupes received: ${jsonContent}`);

    try {
      // Attempt to parse directly as JSON first
      return JSON.parse(jsonContent);
    } catch (parseError) {
      logInfo(`Direct JSON parsing failed for initial dupes, attempting cleanup: ${parseError.message}`);
      return await cleanupInitialDupes(jsonContent);
    }
  } catch (error) {
    logError(`Error fetching initial dupes:`, error);
    throw error;
  }
}

/**
 * Gets detailed dupe analysis from Perplexity API
 * This is the second stage that uses the enriched data from external sources
 */
export async function getDetailedDupeAnalysis(
  originalProduct: any,
  dupes: any[]
): Promise<DupeResponse> {
  logInfo(`Sending detailed analysis request to Perplexity for: ${originalProduct.name}`);

  try {
    const response = await fetch(PERPLEXITY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: DETAILED_ANALYSIS_SYSTEM_PROMPT,
          },
          { role: "user", content: DETAILED_ANALYSIS_PROMPT(originalProduct, dupes) },
        ],
        max_tokens: 20000,
        temperature: 0.2,
        top_p: 0.9,
        search_recency_filter: "month",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${await response.text()}`);
    }
    
    const data = await response.json();
    const jsonContent = cleanMarkdownCodeBlock(data.choices[0].message.content);
    logInfo(`Detailed dupe analysis received: ${jsonContent}`);

    try {
      // Attempt to parse directly as JSON first
      return JSON.parse(jsonContent);
    } catch (parseError) {
      logInfo(`Direct JSON parsing failed for detailed analysis, attempting repair: ${parseError.message}`);
      return await repairPerplexityResponse(jsonContent, SCHEMA_DEFINITION);
    }
  } catch (error) {
    logError(`Error fetching detailed dupe analysis:`, error);
    throw error;
  }
}

/**
 * Enriches product data with additional details using the enhanced prompt
 * This provides comprehensive information about a specific product
 */
export async function enrichProductData(productName: string, brand: string): Promise<any> {
  logInfo(`Enriching product data for: ${brand} ${productName}`);
  
  try {
    const response = await fetch(PERPLEXITY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-reasoning-pro",
        messages: [
          {
            role: "system",
            content: "You are a beauty product researcher with extensive knowledge of cosmetics. Provide accurate, detailed information in JSON format.",
          },
          { role: "user", content: PRODUCT_ENRICHMENT_PROMPT(productName, brand) },
        ],
        max_tokens: 4000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${await response.text()}`);
    }
    
    const data = await response.json();
    const jsonContent = cleanMarkdownCodeBlock(data.choices[0].message.content);
    logInfo(`Product enrichment data received: ${jsonContent}`);
    
    try {
      // Attempt to parse directly as JSON first
      return JSON.parse(jsonContent);
    } catch (error) {
      logError(`Failed to parse enrichment data for ${brand} ${productName}:`, error);
      
      // Return default values if parsing fails
      return {
        productDetails: {
          full_name: `${brand} ${productName}`,
          category: null,
          price_usd: null,
          key_ingredients: []
        },
        performance: {
          longevity_rating: null,
          oxidation_tendency: null,
          best_application_method: null
        },
        suitability: {
          best_for_skin_types: [],
          best_for_conditions: []
        },
        ethics_and_safety: {
          country_of_origin: null,
          cruelty_free: null,
          vegan: null,
          free_of: []
        }
      };
    }
  } catch (error) {
    logError(`Failed to get enrichment data for ${brand} ${productName}:`, error);
    
    // Return basic structure with null values if API call fails
    return {
      productDetails: {
        full_name: `${brand} ${productName}`,
        category: null,
        price_usd: null,
        key_ingredients: []
      },
      performance: {
        longevity_rating: null,
        oxidation_tendency: null,
        best_application_method: null
      },
      suitability: {
        best_for_skin_types: [],
        best_for_conditions: []
      },
      ethics_and_safety: {
        country_of_origin: null,
        cruelty_free: null,
        vegan: null,
        free_of: []
      }
    };
  }
}





/**
 * Schema for batch reviews response
 */
export const BATCH_REVIEWS_SCHEMA = `{
  "products": {
    // Key is the productId - original product and dupes use the same structure
    "[productId]": {
      "name": string,              // Product name for reference
      "brand": string,             // Brand name for reference
      "rating": {
        "averageRating": number,   // Overall average rating out of 5 stars
        "totalReviews": number,    // Total number of reviews found
        "source": string           // Where this aggregated rating was found
      },
      "reviews": [                 // Array of user reviews
        {
          "author": string,        // Username or name of reviewer
          "avatar": string,        // URL to author avatar (if available, else null)
          "rating": number,        // Individual rating out of 5
          "text": string,          // Full review text (trim to reasonable length)
          "source": string,        // Platform/website the review is from
          "sourceUrl": string,     // Direct URL to the review (if available)
          "verifiedPurchase": boolean, // Whether it's a verified purchase
          "date": string,          // Date of review (if available)
          "pros": string[],        // Array of pros mentioned (if available)
          "cons": string[]         // Array of cons mentioned (if available)
        }
      ]
    }
  }
}`;

/**
 * Interface for product info
 */
interface ProductInfo {
  id: string;
  name: string;
  brand: string;
}

/**
 * Fetches reviews for multiple products in a single API call
 * @param products Array of products (original + dupes) to fetch reviews for
 * @returns Structured data with reviews for all products
 */
export async function getBatchProductReviews(products: ProductInfo[]): Promise<any> {
  if (!products || products.length === 0) {
    logError("No products provided for batch reviews");
    return { products: {} };
  }

  logInfo(`Fetching batch reviews for ${products.length} products`);
  
  // Format product list for the prompt
  const productListFormatted = products.map((product, index) => 
    `${index + 1}. ${product.brand} ${product.name} (ID: ${product.id})`
  ).join('\n');

  try {
    const prompt = `
    I need to efficiently gather authentic user reviews for multiple makeup products in a single request.
    Please find reviews for each of these products:
    
    ${productListFormatted}
    
    For EACH product, provide:
    1. The overall product rating (out of 5 stars) from a reputable source
    2. Total number of reviews that contributed to this rating
    3. 2-3 detailed, authentic user reviews with different perspectives and ratings
    
    IMPORTANT REQUIREMENTS:
    - Find REAL reviews that actually exist online (not fabricated)
    - Include the source of each review (e.g., Sephora, Ulta, brand websites, etc.)
    - Ensure a mix of positive and critical opinions for balance when possible
    - Prioritize verified purchase reviews when available
    
    Return the information in JSON format according to this exact schema:
    ${BATCH_REVIEWS_SCHEMA}
    
    CRUCIAL: Make sure each product's reviews are assigned to the correct product ID in the response structure.
    `;

    const response = await fetch(PERPLEXITY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a beauty research assistant specializing in finding authentic product reviews for multiple products at once. You structure data efficiently and accurately in the exact JSON format requested."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.2,
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${await response.text()}`);
    }

    const data = await response.json();
    const jsonContent = data.choices[0].message.content;
    
    // Parse the response
    try {
      const cleanedContent = cleanMarkdownCodeBlock(jsonContent);
      const parsedData = JSON.parse(cleanedContent);
      
      // Validate that we have products data
      if (!parsedData.products) {
        throw new Error("Invalid response format - missing 'products' object");
      }
      
      // Count processed products
      const processedProductIds = Object.keys(parsedData.products);
      logInfo(`Successfully retrieved reviews for ${processedProductIds.length}/${products.length} products`);
      
      // Add missing products with empty data
      products.forEach(product => {
        if (!parsedData.products[product.id]) {
          logInfo(`Adding empty review data for missing product: ${product.brand} ${product.name}`);
          parsedData.products[product.id] = {
            name: product.name,
            brand: product.brand,
            rating: {
              averageRating: null,
              totalReviews: 0,
              source: null
            },
            reviews: []
          };
        }
      });
      
      return parsedData;
    } catch (parseError) {
      logError(`Error parsing batch reviews JSON:`, parseError);
      
      // Last resort: try to extract JSON using regex
      try {
        const jsonMatch = jsonContent.match(/```(?:json)?([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1].trim());
        }
        
        const possibleJson = jsonContent.match(/{[\s\S]*}/);
        if (possibleJson) {
          return JSON.parse(possibleJson[0]);
        }
      } catch (secondError) {
        logError(`Second parsing attempt failed:`, secondError);
      }
      
      // Create default structure with empty data for all products
      const defaultResponse = { products: {} };
      products.forEach(product => {
        defaultResponse.products[product.id] = {
          name: product.name,
          brand: product.brand,
          rating: {
            averageRating: null,
            totalReviews: 0,
            source: null
          },
          reviews: []
        };
      });
      
      return defaultResponse;
    }
  } catch (error) {
    logError(`Error fetching batch reviews:`, error);
    
    // Create default structure with empty data for all products
    const defaultResponse = { products: {} };
    products.forEach(product => {
      defaultResponse.products[product.id] = {
        name: product.name,
        brand: product.brand,
        rating: {
          averageRating: null,
          totalReviews: 0,
          source: null
        },
        reviews: []
      };
    });
    
    return defaultResponse;
  }
}




/**
 * Schema for batch resources response
 */
export const BATCH_RESOURCES_SCHEMA = `{
  "products": {
    // Key is the productId - original product and dupes use the same structure
    "[productId]": {
      "name": string,              // Product name for reference
      "brand": string,             // Brand name for reference
      "socialMedia": {
        "instagram": [             // Array of Instagram posts/reels
          {
            "url": string,         // Direct URL to the post/reel
            "author": string,      // Username of the creator
            "authorHandle": string, // @-handle 
            "thumbnail": string,    // URL to thumbnail image
            "views": number,        // View count if available (null if not)
            "likes": number,        // Like count if available (null if not)
            "type": string,         // "post", "reel", "story"
            "caption": string       // Short excerpt from the caption
          }
        ],
        "tiktok": [                // Array of TikTok videos
          {
            "url": string,         // Direct URL to the TikTok
            "author": string,      // Username of the creator
            "authorHandle": string, // @-handle
            "thumbnail": string,    // URL to thumbnail image
            "views": number,        // View count if available
            "likes": number,        // Like count if available
            "embed": string,        // Embed code if available (null if not)
            "caption": string       // Short description or caption
          }
        ],
        "youtube": [               // Array of YouTube videos
          {
            "url": string,         // Direct URL to the video
            "title": string,       // Video title
            "author": string,      // Channel name
            "thumbnail": string,   // URL to thumbnail
            "duration": string,    // Duration string (e.g. "10:30")
            "views": number,       // View count if available
            "embed": string,       // Embed code if available
            "publishDate": string, // Publication date if available
            "description": string  // Short description or excerpt
          }
        ]
      },
      "articles": [                // Array of blog articles/reviews
        {
          "url": string,           // Direct URL to the article
          "title": string,         // Article title
          "source": string,        // Website/blog name
          "excerpt": string,       // Short excerpt from the article
          "thumbnail": string,     // URL to thumbnail/featured image (if available)
          "publishDate": string,   // Publication date if available
          "author": string         // Author name if available
        }
      ]
    }
  }
}`;

/**
 * Interface for product info
 */
interface ProductInfo {
  id: string;
  name: string;
  brand: string;
}

/**
 * Fetches social media resources for multiple products in a single API call
 * @param products Array of products (original + dupes) to fetch resources for
 * @returns Structured data with resources for all products
 */
export async function getBatchProductResources(products: ProductInfo[]): Promise<any> {
  if (!products || products.length === 0) {
    logError("No products provided for batch resources");
    return { products: {} };
  }

  logInfo(`Fetching batch resources for ${products.length} products`);
  
  // Format product list for the prompt
  const productListFormatted = products.map((product, index) => 
    `${index + 1}. ${product.brand} ${product.name} (ID: ${product.id})`
  ).join('\n');

  try {
    const prompt = `
    I need to efficiently gather social media content and articles for multiple makeup products in a single request.
    Please find resources for each of these products:
    
    ${productListFormatted}
    
    For EACH product aim to provide, but make sure only real and relevant:
    1. 1-2 Instagram posts/reels showcasing or reviewing the product
    2. 1-2 TikTok videos demonstrating or reviewing the product 
    3. 1-2 YouTube reviews, tutorials or demonstrations
    4. 1-2 Blog articles or written reviews
    
    IMPORTANT REQUIREMENTS:
    - Find REAL content that actually exists online (not fabricated)
    - Prioritize content from verified beauty influencers when available
    - Prefer content with higher engagement (views, likes)
    - Focus on recent content (within the last year if possible)
    - For each piece of content, provide available metadata (creator names, view counts, etc.)
    
    Return the information in JSON format according to this exact schema:
    ${BATCH_RESOURCES_SCHEMA}
    
    CRUCIAL: Make sure each product's resources are assigned to the correct product ID in the response structure.
    `;

    const response = await fetch(PERPLEXITY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a social media curator specializing in finding beauty content across platforms. You can efficiently gather content for multiple products at once, structuring data accurately in the exact JSON format requested."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.2,
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${await response.text()}`);
    }

    const data = await response.json();
    const jsonContent = data.choices[0].message.content;
    
    // Parse the response
    try {
      const cleanedContent = cleanMarkdownCodeBlock(jsonContent);
      const parsedData = JSON.parse(cleanedContent);
      
      // Validate that we have products data
      if (!parsedData.products) {
        throw new Error("Invalid response format - missing 'products' object");
      }
      
      // Count processed products
      const processedProductIds = Object.keys(parsedData.products);
      logInfo(`Successfully retrieved resources for ${processedProductIds.length}/${products.length} products`);
      
      // Add missing products with empty data
      products.forEach(product => {
        if (!parsedData.products[product.id]) {
          logInfo(`Adding empty resource data for missing product: ${product.brand} ${product.name}`);
          parsedData.products[product.id] = {
            name: product.name,
            brand: product.brand,
            socialMedia: {
              instagram: [],
              tiktok: [],
              youtube: []
            },
            articles: []
          };
        }
      });
      
      return parsedData;
    } catch (parseError) {
      logError(`Error parsing batch resources JSON:`, parseError);
      
      // Last resort: try to extract JSON using regex
      try {
        const jsonMatch = jsonContent.match(/```(?:json)?([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1].trim());
        }
        
        const possibleJson = jsonContent.match(/{[\s\S]*}/);
        if (possibleJson) {
          return JSON.parse(possibleJson[0]);
        }
      } catch (secondError) {
        logError(`Second parsing attempt failed:`, secondError);
      }
      
      // Create default structure with empty data for all products
      const defaultResponse = { products: {} };
      products.forEach(product => {
        defaultResponse.products[product.id] = {
          name: product.name,
          brand: product.brand,
          socialMedia: {
            instagram: [],
            tiktok: [],
            youtube: []
          },
          articles: []
        };
      });
      
      return defaultResponse;
    }
  } catch (error) {
    logError(`Error fetching batch resources:`, error);
    
    // Create default structure with empty data for all products
    const defaultResponse = { products: {} };
    products.forEach(product => {
      defaultResponse.products[product.id] = {
        name: product.name,
        brand: product.brand,
        socialMedia: {
          instagram: [],
          tiktok: [],
          youtube: []
        },
        articles: []
      };
    });
    
    return defaultResponse;
  }
}