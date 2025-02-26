/// <reference lib="es2015" />

import { logInfo, logError } from "../shared/utils.ts";

// UPCItemDB API configuration
const UPCITEMDB_API_BASE_URL = "https://api.upcitemdb.com/prod/v1";
const UPCDB_API_KEY = Deno.env.get("UPCDB_API_KEY") || "23bc948d2588e5ea98fb4e0c5b47e6b9";
const MIN_REQUEST_INTERVAL_MS = 10500; // 10.5 seconds between requests

// Simple in-memory key value storage
// This is the simplest approach but won't persist between function invocations
const memoryStore = {
  data: new Map<string, any>(),
  lastRequests: new Map<string, number>(),
  
  // Get a value from the store
  get(key: string): any {
    return this.data.get(key);
  },
  
  // Set a value in the store
  set(key: string, value: any): void {
    this.data.set(key, value);
  },
  
  // Track the last request time for rate limiting
  setLastRequest(key: string): void {
    this.lastRequests.set(key, Date.now());
  },
  
  // Get the last request time
  getLastRequest(key: string): number {
    return this.lastRequests.get(key) || 0;
  }
};

/**
 * Simple throttle implementation that uses in-memory state
 * Works for sequential calls within same function invocation
 */
async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const lastTime = memoryStore.getLastRequest('UPCItemDB') || 0;
  const timeSinceLastRequest = now - lastTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    const delay = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    logInfo(`Throttling UPCItemDB request: waiting ${delay}ms to avoid rate limit`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // Update last request time
  memoryStore.setLastRequest('UPCItemDB');
}

/**
 * Fetches product data from external databases
 * Simple implementation with basic in-memory throttling
 */
export async function fetchProductDataFromExternalDb(productName: string, brand: string): Promise<any> {
  logInfo(`Fetching data from external DB for: ${brand} ${productName}`);
  
  try {
    // Simple throttling
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
      const item = data.items[0]
      
      if (item) {
        logInfo(`Found external data for: ${brand} ${productName} ${item.images}`);
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
      verified: false,
      error: true
    };
  }
}

/**
 * Fetches product data from external databases by UPC number
 * Simple implementation with basic in-memory throttling
 */
export async function fetchProductDataByUpc(upc: string): Promise<any> {
  logInfo(`Fetching data by UPC: ${upc}`);

  if (!UPCDB_API_KEY) {
    logError("UPCDB_API_KEY is not set");
    throw new Error("Missing UPCitemdb API key");
  }

  try {
    // Simple throttling
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

    logInfo(`No data found for UPC: ${upc}`);
    return { upc, verified: false };
  } catch (error) {
    logError(`Error fetching data by UPC ${upc}:`, error);
    return { upc, verified: false, error: true };
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
    const itemTitle = item.title?.toLowerCase() || "";
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