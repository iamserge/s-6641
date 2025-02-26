/// <reference lib="es2015" />

import { logInfo, logError, safeStringify, cleanMarkdownCodeBlock } from "../shared/utils.ts";
import { DupeResponse, PRODUCT_CATEGORIES  } from "../shared/types.ts";
import { 
  PERPLEXITY_API_KEY, 
  PERPLEXITY_API_ENDPOINT,
  SCHEMA_DEFINITION 
} from "../shared/constants.ts";
import { cleanupInitialDupes, repairPerplexityResponse } from "./openai.ts";

/**
 * System prompt for initial product and dupe search
 */
const INITIAL_SEARCH_SYSTEM_PROMPT = `
You are a professional makeup dupe finder and beauty expert with expertise in cosmetics formulations and beauty trends.
Your task is to identify original makeup products and their most accurate affordable dupes.
As a beauty expert, you are resourceful in finding makeup dupes and always make an effort to suggest relevant alternatives, even if they are not perfect matches.
Focus on finding verified dupes mentioned by credible sources like Temptalia, Dupeshop, r/MakeupAddiction, and respected beauty blogs, but also search the whole internet if necessary.
Use sources with side-by-side comparisons, ingredient analysis, and performance testing as well as social media.
Return ONLY a JSON object in the exact format requested - no explanations or other text.


{
  "originalName": "full product name",
  "originalBrand": "brand name", 
  "originalCategory": "product category",
  "dupes": [
    { "name": "dupe product name", "brand": "dupe brand name", "matchScore": number between 20-100 },
    { "name": "dupe product name", "brand": "dupe brand name", "matchScore": number between 20-100 }
    // include up to 5 dupes, ordered by match score (highest first)
  ]
}
`;

/**
 * Initial search prompt template for identifying basic product and dupes
 */
const INITIAL_SEARCH_PROMPT = (searchText: string) => `
Find makeup dupes for "${searchText}".
Prioritize verified dupes from credible beauty sources (Temptalia's dupe list, Dupeshop, beauty blogs, and Reddit discussions), but if no obvious dupes are found, search the broader internet for relevant alternatives.
Always make an effort to return at least one dupe, even if it's not a perfect match.
Assign a match score based on how closely the dupe matches the original in terms of color, texture, finish, and other relevant attributes.


Each dupe should be from a different brand and not the original product.
Be precise with product names and include the exact shade/color if relevant.



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

For the resources section, include at least 5 credible references:
1. Resource title/description
2. Direct URL to the source
3. Resource type (Video, YouTube, Instagram, TikTok, Article, Reddit)
4. Focus on sources with direct comparisons or ingredient analysis

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
  dupes: Array<{ name: string; brand: string; matchScore: number }>;
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
        max_tokens: 1000,
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
    logInfo(`Initial dupes recieved: ${jsonContent}`);

    return await cleanupInitialDupes(jsonContent);
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
        model: "sonar-reasoning-pro", // Using the more powerful model for detailed analysis
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

    return await repairPerplexityResponse(jsonContent, SCHEMA_DEFINITION);

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
    
    try {
      return JSON.parse(jsonContent);
    } catch (error) {
      logError(`Failed to parse enrichment data for ${brand} ${productName}:`, error);
      
      // Return default values if API call fails
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