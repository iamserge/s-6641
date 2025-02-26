/// <reference lib="es2015" />

import { logInfo, logError } from "../shared/utils.ts";

// UPCitemdb API base URL
const UPCITEMDB_API_BASE_URL = "https://api.upcitemdb.com/prod/v1";
// API key from environment variables
const UPCDB_API_KEY = Deno.env.get("UPCDB_API_KEY") || "23bc948d2588e5ea98fb4e0c5b47e6b9";

// Throttle settings
const REQUEST_INTERVAL_MS = 10500; // 1050 ms between requests
let lastRequestTime = 0;

/**
 * Throttles API requests to ensure they don't exceed the rate limit
 */
async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_INTERVAL_MS) {
    const delay = REQUEST_INTERVAL_MS - timeSinceLastRequest;
    logInfo(`Throttling request: waiting ${delay}ms to avoid rate limit`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
}

/**
 * Fetches product data from external databases by keyword search
 * This function attempts to retrieve verified product data from UPC databases using /v1/search
 */
export async function fetchProductDataFromExternalDb(productName: string, brand: string): Promise<any> {
  logInfo(`Fetching data from external DB for: ${brand} ${productName}`);
  
  try {
    // Throttle the request
    await throttleRequest();

    const response = await fetch(
      `${UPCITEMDB_API_BASE_URL}/search?s=${encodeURIComponent(brand + " " + productName)}&match_mode=0&type=product`,
      {
        headers: {
          "user_key": UPCDB_API_KEY,
          "key_type": "3scale"
        }
      }
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
          gtin: item.gtin,
          asin: item.asin,
          elid: item.elid,
          model: item.model,
          description: item.description,
          brand: item.brand,
          price: item.lowest_recorded_price,
          lowest_recorded_price: item.lowest_recorded_price,
          highest_recorded_price: item.highest_recorded_price,
          images: item.images,
          offers: item.offers,
          category: item.category,
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
 * Fetches product data from external databases by UPC number
 * This function uses the UPCitemdb API /v1/lookup endpoint for precise product matching
 */
export async function fetchProductDataByUpc(upc: string): Promise<any> {
  logInfo(`Fetching data by UPC: ${upc}`);

  if (!UPCDB_API_KEY) {
    logError("UPCDB_API_KEY is not set");
    throw new Error("Missing UPCitemdb API key");
  }

  try {
    // Throttle the request
    await throttleRequest();

    const response = await fetch(
      `${UPCITEMDB_API_BASE_URL}/lookup?upc=${encodeURIComponent(upc)}`,
      {
        headers: {
          "user_key": UPCDB_API_KEY,
          "key_type": "3scale"
        }
      }
    );

    if (!response.ok) {
      const status = response.status;
      let errorMessage = `UPC Item DB API error: ${status}`;
      switch (status) {
        case 400:
          errorMessage = "Invalid query: missing required parameters or invalid UPC";
          break;
        case 401:
          errorMessage = "Authorization failed: invalid API key";
          break;
        case 404:
          errorMessage = "No match found for UPC";
          break;
        case 429:
          errorMessage = "Exceeded request limit";
          break;
        case 500:
          errorMessage = "Internal server error";
          break;
        default:
          errorMessage = `Unexpected error: ${await response.text()}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0]; // Take the first match as UPC lookup is precise
      logInfo(`Found external data for UPC: ${upc}`);
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

    logInfo(`No data found for UPC: ${upc}`);
    return { upc, verified: false };
  } catch (error) {
    logError(`Error fetching data by UPC ${upc}:`, error);
    return { upc, verified: false };
  }
}

/**
 * Finds the closest match from a list of potential products (used for keyword search)
 */
function findClosestMatch(items: any[], brand: string, productName: string): any | null {
  if (!items || items.length === 0) return null;
  
  if (items.length === 1) return items[0];
  
  const searchTerm = (brand + " " + productName).toLowerCase();
  
  const scoredItems = items.map(item => {
    const itemTitle = item.title.toLowerCase();
    let score = 0;
    
    if (itemTitle.includes(brand.toLowerCase())) {
      score += 2;
    }
    
    const productNameWords = productName.toLowerCase().split(' ');
    for (const word of productNameWords) {
      if (word.length > 2 && itemTitle.includes(word)) {
        score += 1;
      }
    }
    
    if (item.category && 
        (item.category.toLowerCase().includes('makeup') || 
         item.category.toLowerCase().includes('cosmetic') ||
         item.category.toLowerCase().includes('beauty'))) {
      score += 2;
    }
    
    return { item, score };
  });
  
  scoredItems.sort((a, b) => b.score - a.score);
  
  if (scoredItems.length > 0 && scoredItems[0].score > 1) {
    return scoredItems[0].item;
  }
  
  return null;
}

