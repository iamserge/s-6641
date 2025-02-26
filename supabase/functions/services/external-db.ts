/// <reference lib="es2015" />

import { logInfo, logError } from "../shared/utils.ts";

// UPCItemDB API configuration
const UPCITEMDB_API_BASE_URL = "https://api.upcitemdb.com/prod/v1";
const UPCDB_API_KEY = Deno.env.get("UPCDB_API_KEY") || "23bc948d2588e5ea98fb4e0c5b47e6b9";
const MIN_REQUEST_INTERVAL_MS = 10500; // 10.5 seconds between requests

// Cache configuration
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const THROTTLE_KEY = "upcitemdb_last_request";

// Simple key-value store implementation using Supabase Function KV store
// This ensures throttling works even in serverless environments
class KVStore {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  private getFullKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get(key: string): Promise<any> {
    try {
      const fullKey = this.getFullKey(key);
      const value = await Deno.kv.get([fullKey]);
      return value?.value;
    } catch (error) {
      logError(`KV Store get error for ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const options = ttl ? { expireIn: ttl } : undefined;
      await Deno.kv.set([fullKey], value, options);
    } catch (error) {
      logError(`KV Store set error for ${key}:`, error);
    }
  }
}

// Initialize KV store instances
const throttleStore = new KVStore("throttle");
const productCache = new KVStore("products");

/**
 * Throttles API requests to ensure they don't exceed the rate limit
 * Uses KV store to work properly in serverless environments
 */
async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const lastRequestTime = await throttleStore.get(THROTTLE_KEY) || 0;
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    const delay = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    logInfo(`Throttling UPCItemDB request: waiting ${delay}ms to avoid rate limit`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // Set the new timestamp after any necessary delay
  await throttleStore.set(THROTTLE_KEY, Date.now());
}

/**
 * Generates a cache key for a product search
 */
function generateCacheKey(brand: string, productName: string): string {
  return `search:${brand.toLowerCase()}:${productName.toLowerCase()}`;
}

/**
 * Checks if we have a cached result for this search
 */
async function getCachedProductData(brand: string, productName: string): Promise<any | null> {
  const cacheKey = generateCacheKey(brand, productName);
  return await productCache.get(cacheKey);
}

/**
 * Caches product data for future use
 */
async function cacheProductData(brand: string, productName: string, data: any): Promise<void> {
  const cacheKey = generateCacheKey(brand, productName);
  await productCache.set(cacheKey, data, CACHE_TTL_MS);
}

/**
 * Fetches product data from external databases or cache
 */
export async function fetchProductDataFromExternalDb(productName: string, brand: string): Promise<any> {
  // Check cache first
  const cachedData = await getCachedProductData(brand, productName);
  if (cachedData) {
    logInfo(`Using cached data for: ${brand} ${productName}`);
    return cachedData;
  }
  
  logInfo(`Fetching fresh data from external DB for: ${brand} ${productName}`);
  
  try {
    // Respect rate limits
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
        const result = {
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
        
        // Cache the result for future use
        await cacheProductData(brand, productName, result);
        return result;
      }
    }
    
    logInfo(`No detailed external data found for: ${brand} ${productName}`);
    const basicResult = {
      name: productName,
      brand: brand,
      verified: false
    };
    
    // Also cache negative results to avoid repeated lookups
    await cacheProductData(brand, productName, basicResult);
    return basicResult;
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
 * Generates a cache key for a UPC lookup
 */
function generateUpcCacheKey(upc: string): string {
  return `upc:${upc}`;
}

/**
 * Checks if we have a cached result for this UPC
 */
async function getCachedUpcData(upc: string): Promise<any | null> {
  const cacheKey = generateUpcCacheKey(upc);
  return await productCache.get(cacheKey);
}

/**
 * Caches UPC data for future use
 */
async function cacheUpcData(upc: string, data: any): Promise<void> {
  const cacheKey = generateUpcCacheKey(upc);
  await productCache.set(cacheKey, data, CACHE_TTL_MS);
}

/**
 * Fetches product data from external databases by UPC number
 * This function uses the UPCitemdb API /v1/lookup endpoint for precise product matching
 */
export async function fetchProductDataByUpc(upc: string): Promise<any> {
  // Check cache first
  const cachedData = await getCachedUpcData(upc);
  if (cachedData) {
    logInfo(`Using cached data for UPC: ${upc}`);
    return cachedData;
  }
  
  logInfo(`Fetching fresh data by UPC: ${upc}`);

  if (!UPCDB_API_KEY) {
    logError("UPCDB_API_KEY is not set");
    throw new Error("Missing UPCitemdb API key");
  }

  try {
    // Respect rate limits
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
      const result = {
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
      
      // Cache the result for future use
      await cacheUpcData(upc, result);
      return result;
    }

    logInfo(`No data found for UPC: ${upc}`);
    const basicResult = { upc, verified: false };
    
    // Also cache negative results to avoid repeated lookups
    await cacheUpcData(upc, basicResult);
    return basicResult;
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