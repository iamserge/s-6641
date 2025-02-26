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
     - Product category (e.g., Foundation, Lipstick, Eyeshadow, etc.) - be specific
     - Price (in USD)
     - Complete list of key ingredients (identify active ingredients)
     - Key attributes (texture, finish, coverage, etc.)
     - Country of origin if known
     - Free-from claims (e.g., paraben-free, fragrance-free)
     - Longevity rating on a scale of 1-10
     - Oxidation tendency (None/Minor/Significant)
     - Best suited skin types and conditions

  2. Dupe Recommendations - as many as possible:
     For each recommended dupe, provide:
     - Product name and brand
     - Product category (especially if different from original)
     - Price and savings percentage compared to original
     - Key ingredients
     - Texture description
     - Finish type
     - Coverage level (if applicable)
     - SPF rating (if applicable)
     - Skin types compatible with the product
     - Match score on a scale of 0-100 (overall similarity)
     - Color match score (0-100) if applicable
     - Formula match score (0-100) if applicable
     - Dupe type classification (e.g., "Shade Match", "Formula Match", "Exact Dupe", "Cross-Category Dupe")
     - Validation source (e.g., "Verified by Temptalia", "Reddit consensus")
     - Confidence level (High/Medium/Low) based on validation quality
     - Longevity comparison with original
     - Additional notes on performance or application differences
     - Purchase link if available
     - Image URL if available
     - Best for (skin types or conditions product works well with)
     - Country of origin if known
     - Cruelty-free status (boolean)
     - Vegan status (boolean)
     - Free-from claims (e.g., paraben-free, fragrance-free)

  3. Comparison Summary:
     - Brief but comprehensive summary comparing the original and dupes
     - Highlight which dupe is closest to the original and why
     - Note any significant differences in performance or value proposition

  4. Resource Library:
     Include at least 5 resources with focus on credible sources:
     - Resource title or description
     - URL to the resource
     - Resource type (Video, YouTube, Instagram, TikTok, Article, or Reddit)

  Below is the schema for your response. Pay close attention to each field:

  ${SCHEMA_DEFINITION}

  Focus on finding dupes with high accuracy and validation from multiple sources like Temptalia, Reddit, and beauty experts. Prioritize sources that include side-by-side comparisons, ingredient analysis, and performance testing. If information is limited, clearly note the confidence level.`;

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