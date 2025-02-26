/// <reference lib="es2015" />

import { logInfo, logError, safeStringify } from "../shared/utils.ts";
import { DupeResponse } from "../shared/types.ts";
import { 
  PERPLEXITY_API_KEY, 
  PERPLEXITY_API_ENDPOINT,
  SCHEMA_DEFINITION 
} from "../shared/constants.ts";
import { repairPerplexityResponse, getProductEnrichmentData } from "./openai.ts";

/**
 * Gets dupe recommendations from Perplexity API
 */
export async function getPerplexityResponse(searchText: string): Promise<DupeResponse> {
  logInfo(`Sending request to Perplexity API for: ${searchText}`);
  
  // Enhanced prompt based on research report recommendations with product category
  const prompt = `I'm building a makeup dupe-finding tool for Dupe.academy. Please write a detailed analysis report for the product '${searchText}' that follows all of these specific requirements:

  1. Original Product Description:
     - Exact product name and brand
     - Product category (e.g., Foundation, Lipstick, Eyeshadow, etc.) - be specific about this
     - Price (in USD)
     - Complete list of key ingredients (identify active ingredients and controversial ingredients)
     - Texture, finish, and coverage details
     - Country of origin if known (important for regulatory compliance)
     - Cruelty-free and vegan status of the brand (with certification if known)
     - Sustainable packaging information if available
     - Any "free-from" claims (e.g., paraben-free, fragrance-free)
     - Longevity rating on a scale of 1-10
     - Oxidation tendency (None/Minor/Significant)
     - Best suited skin types and conditions (e.g., humid climate, dry skin)

  2. Dupe Recommendations - as meny as possible:
     For each recommended dupe, provide:
     - Product name and brand
     - Product category (especially important if different from original)
     - Price and savings percentage compared to original
     - Complete list of key ingredients, highlighting similarities with original
     - Texture and finish details with specific comparison to original
     - Coverage level (sheer, medium, full) if applicable
     - SPF rating if applicable
     - Match score on a scale of 0-100 (overall similarity)
     - Color match score (0-100)
     - Formula match score (0-100)
     - Dupe type classification: "Shade Match", "Formula Match", "Exact Dupe", "Cross-Category Dupe" (if different category)
     - Longevity comparison with original
     - Oxidation tendency comparison
     - Transfer-resistance comparison
     - Notes on application differences (e.g., blendability, dry-down time)
     - Suitable skin types
     - Purchase link if available
     - Ethical information (cruelty-free, vegan status)
     - Country of origin if known

  3. Comparison Summary:
     - Which dupe is closest to the original and why
     - Sustainability or ethical advantages of any dupes over the original
     - Performance differences between dupes and original
     - Value proposition of each dupe (why someone might choose it)
     - Notable ingredient differences and their implications
     - Mention if any dupes are from a different product category but achieve similar results

  4. Resource Library:
     Include at least 5 resources with focus on credible sources:
     - Temptalia's dupe lists if available
     - Reddit discussions (r/MakeupAddiction, r/BeautyGuruChatter)
     - YouTube comparison videos
     - Beauty blog reviews with side-by-side comparisons
     - Instagram or TikTok content from reputable beauty influencers

  5. Validation Information:
     For each dupe, specify:
     - Validation source (e.g., "Verified by Temptalia", "Reddit consensus", "Expert beauty blogger")
     - Confidence level (High/Medium/Low) based on number and quality of validations
     - Whether comparisons included side-by-side swatches or wear tests

  Below is the schema for your response. Pay close attention to the comments that explain each field's purpose and importance:

  ${SCHEMA_DEFINITION}

  Focus on finding dupes with high accuracy and validation from multiple sources like Temptalia, Reddit, and beauty experts. Prioritize sources that include side-by-side comparisons, ingredient analysis, and performance testing. If information is limited, clearly note the confidence level.
  
  Pay special attention to the product category and be aware that sometimes dupes can be from different categories (e.g., a liquid lipstick might be a dupe for a traditional lipstick, or a BB cream might be a dupe for a foundation). When this occurs, categorize it as a "Cross-Category Dupe" in the dupeType field.`;

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
            content: `You are a makeup expert specializing in finding dupes for high-end products. Return ONLY a valid JSON object following the schema provided in the prompt. Focus on accuracy, sourcing information from credible beauty resources, and providing detailed comparisons beyond just color matching. Be precise about product categories and note when dupes come from different product categories.`,
          },
          { role: "user", content: prompt },
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
    const jsonContent = data.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
    logInfo(`Perplexity response received: ${safeStringify(data)}`);

    try {
      const parsedData = JSON.parse(jsonContent) as DupeResponse;
      logInfo(`Perplexity JSON parsed successfully: ${safeStringify(parsedData)}`);
      return parsedData;
    } catch (error) {
      logError("Perplexity response is not valid JSON. Attempting repair with OpenAI structured format.", error);
      return await repairPerplexityResponse(jsonContent, SCHEMA_DEFINITION);
    }
  } catch (error) {
    logError(`Error fetching data from Perplexity:`, error);
    throw error;
  }
}

/**
 * Enriches product data with additional details
 */
export async function enrichProductData(productName: string, brand: string): Promise<any> {
  return await getProductEnrichmentData(productName, brand);
}