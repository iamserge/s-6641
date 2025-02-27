import { logInfo, logError } from "../shared/utils.ts";
import { PERPLEXITY_API_ENDPOINT, PERPLEXITY_API_KEY, REVIEWS_RESOURCES_SCHEMA } from "../shared/constants.ts";

/**
 * Fetches reviews, ratings, and social media content for a product
 * @param productName The name of the product
 * @param brand The brand of the product
 * @returns Structured data with reviews and resources
 */
export async function getProductReviewsAndResources(productName: string, brand: string): Promise<any> {
  logInfo(`Fetching reviews and social media for: ${brand} ${productName}`);

  try {
    const prompt = `
    I need comprehensive information about the makeup product "${brand} ${productName}" including:

    1. Overall product rating (out of 5 stars) from a reputable source 
    2. 3-5 detailed user reviews with ratings from different platforms
    3. Links to popular Instagram posts/reels featuring this product
    4. Links to TikTok videos showcasing this product
    5. Links to YouTube reviews or tutorials
    6. Links to blog articles or reviews

    Please find REAL content that actually exists online (not fabricated examples) and return the information in JSON format according to this exact schema:

    ${REVIEWS_RESOURCES_SCHEMA}

    For social media links, prioritize content from beauty influencers or makeup artists with good engagement.
    For reviews, include a mix of positive and critical opinions for balance.
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
            content: "You are a beauty research assistant who provides real, accurate data about makeup products including reviews and social media content. Your responses are thorough, factual, and structured in JSON format."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.1,
        search_recency_filter: "month",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${await response.text()}`);
    }

    const data = await response.json();
    const jsonContent = data.choices[0].message.content;

    try {
      // Clean the response and parse JSON
      const cleanedContent = jsonContent.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanedContent);
      
      logInfo(`Successfully retrieved reviews and resources data for ${brand} ${productName}`);
      return parsedData;
    } catch (parseError) {
      logError(`Error parsing reviews JSON:`, parseError);
      try {
        // Second attempt - try to extract JSON from markdown format
        const jsonMatch = jsonContent.match(/```(?:json)?([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          const extractedJson = jsonMatch[1].trim();
          return JSON.parse(extractedJson);
        }
        
        // Third attempt - use regex to find anything that looks like JSON
        const possibleJson = jsonContent.match(/{[\s\S]*}/);
        if (possibleJson) {
          return JSON.parse(possibleJson[0]);
        }
      } catch (secondError) {
        logError(`Second parsing attempt failed:`, secondError);
      }
      
      // Return empty structure if all parsing fails
      return {
        productRating: { averageRating: null, totalReviews: 0, source: null },
        userReviews: [],
        socialMedia: { instagram: [], tiktok: [], youtube: [] },
        articles: []
      };
    }
  } catch (error) {
    logError(`Error fetching reviews and resources:`, error);
    return {
      productRating: { averageRating: null, totalReviews: 0, source: null },
      userReviews: [],
      socialMedia: { instagram: [], tiktok: [], youtube: [] },
      articles: []
    };
  }
}