/// <reference lib="es2015" />

import { logInfo, logError } from "../shared/utils.ts";

/**
 * Fetches product data from external databases
 * This function attempts to retrieve verified product data from UPC databases
 */
export async function fetchProductDataFromExternalDb(productName: string, brand: string): Promise<any> {
  logInfo(`Fetching data from external DB for: ${brand} ${productName}`);
  
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(brand + " " + productName)}&match_mode=0&type=product`
    );
    
    if (!response.ok) {
      throw new Error(`UPC Item DB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const item = findClosestMatch(data.items, brand, productName);
      
      if (item) {
        logInfo(`Found external data for: ${brand} ${productName}`);
        return {
          name: item.title,
          upc: item.upc,
          ean: item.ean,
          description: item.description,
          brand: item.brand,
          price: item.lowest_recorded_price,
          highest_price: item.highest_recorded_price,
          images: item.images,
          offers: item.offers,
          verified: true
        };
      }
    }
    
    logInfo(`No detailed external data found for: ${brand} ${productName}`);
    return {
      name: productName,
      brand: brand,
      verified: false
    };
  } catch (error) {
    logError(`Error fetching external data for ${brand} ${productName}:`, error);
    return {
      name: productName,
      brand: brand,
      verified: false
    };
  }
}

/**
 * Finds the closest match from a list of potential products
 */
function findClosestMatch(items: any[], brand: string, productName: string): any | null {
  if (!items || items.length === 0) return null;
  
  // If only one item, return it
  if (items.length === 1) return items[0];
  
  // Create a combined search term for comparison
  const searchTerm = (brand + " " + productName).toLowerCase();
  
  // Calculate similarity scores
  const scoredItems = items.map(item => {
    const itemTitle = item.title.toLowerCase();
    let score = 0;
    
    // Check if brand name appears in title
    if (itemTitle.includes(brand.toLowerCase())) {
      score += 2;
    }
    
    // Check for product name in title
    const productNameWords = productName.toLowerCase().split(' ');
    for (const word of productNameWords) {
      if (word.length > 2 && itemTitle.includes(word)) {
        score += 1;
      }
    }
    
    // Check category matches (cosmetics/makeup)
    if (item.category && 
        (item.category.toLowerCase().includes('makeup') || 
         item.category.toLowerCase().includes('cosmetic') ||
         item.category.toLowerCase().includes('beauty'))) {
      score += 2;
    }
    
    return { item, score };
  });
  
  // Sort by score descending
  scoredItems.sort((a, b) => b.score - a.score);
  
  // Return the highest scored item if its score is above threshold
  if (scoredItems.length > 0 && scoredItems[0].score > 1) {
    return scoredItems[0].item;
  }
  
  // No good match found
  return null;
}