/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getInitialDupes, identifyProductWithPerplexity } from "../services/perplexity.ts";
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { supabase } from "../shared/db-client.ts";
import { corsHeaders, logInfo, logError, safeStringify } from "../shared/utils.ts";
import { extractProductInfoFromImage } from "../services/openai.ts";

// Define interface for product info to fix TypeScript errors
interface ProductInfo {
  name?: string;
  brand?: string | null;
  category?: string;
  isRelevant?: boolean;
}

// In-memory storage for SSE connections
const requestDataStore = new Map<string, any>();

/**
 * Processes text input to identify product and check relevance
 * @param textData Text input from user
 * @returns Object with product name, brand, category and relevance status
 */
async function processTextInput(textData: string): Promise<ProductInfo> {
  const logPrefix = `[TEXT-PROCESSING]`;
  logInfo(`${logPrefix} Processing text input: "${textData}"`);
  
  try {
    // Call Perplexity to identify product and determine if it's relevant
    return await identifyProductWithPerplexity(textData);
  } catch (error) {
    logError(`${logPrefix} Error processing text: ${safeStringify(error)}`);
    return {
      name: textData,
      brand: undefined,
      isRelevant: false
    };
  }
}

/**
 * Processes image input to extract product information or barcode
 * @param imageData Base64 encoded image data
 * @returns Object with product name, brand, category and relevance status
 */
async function processImageInput(imageData: string): Promise<ProductInfo> {
  const logPrefix = `[IMAGE-PROCESSING]`;
  logInfo(`${logPrefix} Starting image analysis`);
  
  try {
    // Use OpenAI Vision to analyze the image via the dedicated function
    const extractedInfo = await extractProductInfoFromImage(imageData);
    
    // Check if it's a barcode
    if (extractedInfo.barcode) {
      logInfo(`${logPrefix} Barcode detected: ${extractedInfo.barcode}`);
      
      // Use regex to validate barcode format
      const barcodeRegex = /^[0-9]{8,14}$/;
      if (barcodeRegex.test(extractedInfo.barcode)) {
        // Process the barcode with external database
        return await processBarcodeInput(extractedInfo.barcode);
      } else {
        logError(`${logPrefix} Invalid barcode format: ${extractedInfo.barcode}`);
        return {
          name: "Unknown product",
          brand: undefined,
          isRelevant: false
        };
      }
    }
    
    // If it's a product image, process it through Perplexity
    if (extractedInfo.name) {
      logInfo(`${logPrefix} Product image detected: ${extractedInfo.name}`);
      const searchText = `${extractedInfo.brand || ''} ${extractedInfo.name || ''}`.trim();
      
      if (searchText) {
        // Use product identification function
        return await identifyProductWithPerplexity(searchText);
      }
    }
    
    // If we couldn't extract useful information
    logInfo(`${logPrefix} Could not extract clear product information from image`);
    return {
      name: extractedInfo.name || "Unknown product",
      brand: extractedInfo.brand,
      category: extractedInfo.category,
      isRelevant: false // Default to false when we can't determine
    };
  } catch (error) {
    logError(`${logPrefix} Error processing image: ${safeStringify(error)}`);
    return {
      name: "Unknown product",
      brand: undefined,
      isRelevant: false
    };
  }
}

/**
 * Processes barcode input to get product information
 * @param barcodeData Barcode number
 * @returns Object with product name, brand, category and relevance status
 */
async function processBarcodeInput(barcodeData: string): Promise<ProductInfo> {
  const logPrefix = `[BARCODE-PROCESSING]`;
  logInfo(`${logPrefix} Starting barcode lookup: ${barcodeData}`);
  
  try {
    // Handle barcode/EAN/UPC lookup
    const UPCITEMDB_API_ENDPOINT = "https://api.upcitemdb.com/prod/trial/lookup";
    const apiKey = Deno.env.get('UPCDB_API_KEY');
    
    if (!apiKey) {
      logError(`${logPrefix} UPCDB_API_KEY is not set in environment variables`);
    }
    
    logInfo(`${logPrefix} Calling UPC Item DB API: ${UPCITEMDB_API_ENDPOINT}?upc=${barcodeData}`);
    
    const response = await fetch(`${UPCITEMDB_API_ENDPOINT}?upc=${barcodeData}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`${logPrefix} UPC Item DB API error: ${response.status} - ${errorText}`);
      throw new Error(`Barcode lookup API error: ${response.status}`);
    }
    
    const result = await response.json();
    logInfo(`${logPrefix} UPC Item DB response received: ${safeStringify(result)}`);
    
    if (result.items && result.items.length > 0) {
      logInfo(`${logPrefix} Barcode lookup found ${result.items.length} items`);
      const item = result.items[0];
      
      // After getting product info from UPC database, verify if it's a beauty product
      // using Perplexity for consistency with other flows
      const searchQuery = `${item.brand || ''} ${item.title || ''}`.trim();
      if (searchQuery) {
        return await identifyProductWithPerplexity(searchQuery);
      }
      
      // If we couldn't get a search query, return basic info
      return {
        name: item.title,
        brand: item.brand || undefined, // Use undefined instead of null
        category: item.category,
        isRelevant: false // We couldn't verify with Perplexity, so default to false
      };
    }
    
    logError(`${logPrefix} No items found for barcode: ${barcodeData}`);
    throw new Error('Barcode not found');
  } catch (error) {
    logError(`${logPrefix} Error processing barcode: ${safeStringify(error)}`);
    // If barcode lookup fails, return just the barcode as the name
    return {
      name: `Product #${barcodeData}`,
      brand: undefined, // Use undefined instead of null
      isRelevant: false
    };
  }
}

/**
 * Runs background processing tasks for product and dupes
 * @param backgroundData Object containing product and dupe information
 * @param requestId Unique ID for the request
 * @returns Array of results from background tasks
 */
async function runBackgroundTasks(backgroundData: any, requestId: string): Promise<any[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const authKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !authKey) {
    logError(`[${requestId}] Missing Supabase URL or service role key for background tasks`);
    return [];
  }
  
  // Execute all background functions in parallel
  logInfo(`[${requestId}] Executing background processing tasks in parallel`);
  const startTime = Date.now();
  
  try {
    const results = await Promise.all([
      // Process brands
      (async () => {
        logInfo(`[${requestId}] Starting process-brands task`);
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/process-brands`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          });
          const result = await response.json();
          logInfo(`[${requestId}] process-brands task completed: ${safeStringify(result)}`);
          return result;
        } catch (e) {
          logError(`[${requestId}] process-brands task failed: ${safeStringify(e)}`);
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      })(),
    
      // Process reviews
      (async () => {
        logInfo(`[${requestId}] Starting process-reviews task`);
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/process-reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          });
          const result = await response.json();
          logInfo(`[${requestId}] process-reviews task completed: ${safeStringify(result)}`);
          return result;
        } catch (e) {
          logError(`[${requestId}] process-reviews task failed: ${safeStringify(e)}`);
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      })(),
      
      // Process resources
      (async () => {
        logInfo(`[${requestId}] Starting process-resources task`);
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/process-resources`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          });
          const result = await response.json();
          logInfo(`[${requestId}] process-resources task completed: ${safeStringify(result)}`);
          return result;
        } catch (e) {
          logError(`[${requestId}] process-resources task failed: ${safeStringify(e)}`);
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      })(),
      
      // Process detailed analysis (images, prices, etc.)
      (async () => {
        logInfo(`[${requestId}] Starting process-detailed-analysis task`);
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/process-detailed-analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          });
          const result = await response.json();
          logInfo(`[${requestId}] process-detailed-analysis task completed: ${safeStringify(result)}`);
          return result;
        } catch (e) {
          logError(`[${requestId}] process-detailed-analysis task failed: ${safeStringify(e)}`);
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      })()
    ]);
    
    const endTime = Date.now();
    logInfo(`[${requestId}] All background tasks completed in ${endTime - startTime}ms`);
    
    return results;
  } catch (error) {
    logError(`[${requestId}] Error running background tasks: ${safeStringify(error)}`);
    return [];
  }
}

/**
 * Improved function to check if product exists in database
 * Uses multiple search strategies to find products more reliably
 * @param searchText Search text to check against product names and brands
 * @param productInfo Additional product info that can help with search
 * @param requestId Request ID for logging
 * @returns Object with found status and product data if found
 */
async function checkExistingProduct(
  searchText: string, 
  productInfo: ProductInfo, 
  requestId: string
): Promise<{ found: boolean; product?: any; error?: any }> {
  logInfo(`[${requestId}] Searching database for existing product: ${searchText}`);
  
  try {
    // Define search strategies in order of precision
    
    // 1. Try exact match on name
    const { data: exactNameMatch, error: exactNameError } = await supabase
      .from('products')
      .select('id, name, brand, slug')
      .eq('name', searchText)
      .limit(1);
      
    if (exactNameError) {
      logError(`[${requestId}] Error in exact name search: ${safeStringify(exactNameError)}`);
    } else if (exactNameMatch && exactNameMatch.length > 0) {
      logInfo(`[${requestId}] Found product with exact name match: ${exactNameMatch[0].name}`);
      return { found: true, product: exactNameMatch[0] };
    }
    
    // 2. If productInfo has brand and name, try that combination
    if (productInfo.brand && productInfo.name) {
      const { data: brandNameMatch, error: brandNameError } = await supabase
        .from('products')
        .select('id, name, brand, slug')
        .eq('brand', productInfo.brand)
        .ilike('name', `%${productInfo.name}%`)
        .limit(1);
        
      if (brandNameError) {
        logError(`[${requestId}] Error in brand+name search: ${safeStringify(brandNameError)}`);
      } else if (brandNameMatch && brandNameMatch.length > 0) {
        logInfo(`[${requestId}] Found product with brand+name match: ${brandNameMatch[0].brand} ${brandNameMatch[0].name}`);
        return { found: true, product: brandNameMatch[0] };
      }
    }
    
    // 3. Try searching for parts of the text in either name or brand
    const searchTerms = searchText.split(' ').filter(term => term.length > 3);
    
    if (searchTerms.length > 0) {
      // Build a query that will match any of the significant words
      const query = supabase
        .from('products')
        .select('id, name, brand, slug');
      
      const orConditions = searchTerms.map(term => `name.ilike.%${term}%`);
      const fullOrCondition = orConditions.join(',');
      
      const { data: partialMatches, error: partialError } = await query
        .or(fullOrCondition)
        .limit(5);
        
      if (partialError) {
        logError(`[${requestId}] Error in partial search: ${safeStringify(partialError)}`);
      } else if (partialMatches && partialMatches.length > 0) {
        // Find the best match using a scoring system
        const bestMatch = findBestMatch(partialMatches, searchText);
        logInfo(`[${requestId}] Found product with partial match: ${bestMatch.brand} ${bestMatch.name}`);
        return { found: true, product: bestMatch };
      }
    }
    
    // 4. Try by slug variation
    const slugifiedSearch = slugify(searchText, { lower: true });
    const { data: slugMatches, error: slugError } = await supabase
      .from('products')
      .select('id, name, brand, slug')
      .ilike('slug', `%${slugifiedSearch}%`)
      .limit(5);
      
    if (slugError) {
      logError(`[${requestId}] Error in slug search: ${safeStringify(slugError)}`);
    } else if (slugMatches && slugMatches.length > 0) {
      const bestMatch = findBestMatch(slugMatches, searchText);
      logInfo(`[${requestId}] Found product with slug match: ${bestMatch.brand} ${bestMatch.name}`);
      return { found: true, product: bestMatch };
    }
    
    // No matches found
    logInfo(`[${requestId}] No existing product found for: ${searchText}`);
    return { found: false };
  } catch (error) {
    logError(`[${requestId}] Error checking for existing product: ${safeStringify(error)}`);
    return { found: false, error };
  }
}

/**
 * Helper function to find the best match from multiple potential matches
 * @param products Array of potential matching products
 * @param searchText Original search text
 * @returns Best matching product
 */
function findBestMatch(products: any[], searchText: string): any {
  // No products case
  if (!products || products.length === 0) {
    return null;
  }
  
  // Single product case
  if (products.length === 1) {
    return products[0];
  }
  
  // Convert to lowercase for case-insensitive comparison
  const searchLower = searchText.toLowerCase();
  const searchParts = searchLower.split(' ').filter(part => part.length > 2);
  
  // Score each product based on how well it matches
  const scoredProducts = products.map(product => {
    const nameLower = product.name.toLowerCase();
    const brandLower = product.brand.toLowerCase();
    const fullText = `${brandLower} ${nameLower}`;
    
    let score = 0;
    
    // Exact matches give most points
    if (nameLower === searchLower) score += 100;
    if (fullText === searchLower) score += 100;
    
    // Contains entire search string
    if (nameLower.includes(searchLower)) score += 50;
    if (fullText.includes(searchLower)) score += 40;
    
    // Contains brand
    if (searchLower.includes(brandLower)) score += 30;
    
    // Count how many search terms match
    for (const part of searchParts) {
      if (nameLower.includes(part)) score += 5;
      if (brandLower.includes(part)) score += 5;
    }
    
    return { product, score };
  });
  
  // Sort by score descending and take highest
  scoredProducts.sort((a, b) => b.score - a.score);
  return scoredProducts[0].product;
}

/**
 * Insert original product and its dupes into database
 * @param initialDupes Object with original product and dupes info from Perplexity
 * @param requestId Request ID for logging
 * @returns Object with product data and dupe IDs
 */
async function insertProductAndDupes(initialDupes: any, requestId: string): Promise<{
  originalProduct: any;
  dupeIds: string[];
  productSlug: string;
}> {
  try {
    // Create slug for original product - fix duplicated brand issue
    const cleanProductName = initialDupes.originalName
      .replace(initialDupes.originalBrand, '')
      .trim()
      .replace(/^[-\s]+/, ''); // Remove leading dashes or spaces
      
    const productSlug = slugify(`${initialDupes.originalBrand}-${cleanProductName}`, { lower: true });
    logInfo(`[${requestId}] Generated slug for original product: ${productSlug}`);
    
    // Insert original product with minimal data
    logInfo(`[${requestId}] Inserting original product into database: ${initialDupes.originalBrand} ${initialDupes.originalName}`);
    const { data: originalProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: initialDupes.originalName,
        brand: initialDupes.originalBrand,
        slug: productSlug,
        price: 0, // Will be updated later
        loading_ingredients: false,
        loading_reviews: false,
        loading_resources: false
      })
      .select()
      .single();

    if (productError) {
      logError(`[${requestId}] Error inserting original product: ${safeStringify(productError)}`);
      throw productError;
    }
    
    logInfo(`[${requestId}] Original product inserted successfully with ID: ${originalProduct?.id}`);

    // Insert dupes with minimal data
    logInfo(`[${requestId}] Inserting ${initialDupes.dupes.length} dupes into database`);
    const dupeIds = await Promise.all(
      initialDupes.dupes.map(async (dupe: any, index: number) => {
        // Clean dupe name to avoid duplicated brand
        const cleanDupeName = dupe.name
          .replace(dupe.brand, '')
          .trim()
          .replace(/^[-\s]+/, '');
          
        const dupeSlug = slugify(`${dupe.brand}-${cleanDupeName}`, { lower: true });
        logInfo(`[${requestId}] Processing dupe #${index + 1}: ${dupe.brand} ${dupe.name} (slug: ${dupeSlug})`);
        
        try {
          const { data: dupeProduct, error: dupeError } = await supabase
            .from('products')
            .insert({
              name: dupe.name,
              brand: dupe.brand,
              slug: dupeSlug,
              price: 0, // Will be updated later
              loading_ingredients: false,
              loading_reviews: false,
              loading_resources: false
            })
            .select()
            .single();

          if (dupeError) {
            logError(`[${requestId}] Error inserting dupe #${index + 1}: ${safeStringify(dupeError)}`);
            throw dupeError;
          }
          
          logInfo(`[${requestId}] Dupe #${index + 1} inserted with ID: ${dupeProduct?.id}`);

          // Create dupe relationship
          logInfo(`[${requestId}] Creating relationship between ${originalProduct?.id} and ${dupeProduct?.id}`);
          const { error: relationError } = await supabase
            .from('product_dupes')
            .insert({
              original_product_id: originalProduct?.id,
              dupe_product_id: dupeProduct?.id,
              match_score: dupe.matchScore,
              savings_percentage: 0 // Will be updated later
            });
            
          if (relationError) {
            logError(`[${requestId}] Error creating dupe relationship: ${safeStringify(relationError)}`);
            throw relationError;
          }

          return dupeProduct?.id;
        } catch (dupeInsertError) {
          logError(`[${requestId}] Failed to insert dupe #${index + 1}: ${safeStringify(dupeInsertError)}`);
          throw dupeInsertError;
        }
      })
    );
    
    logInfo(`[${requestId}] Successfully inserted all ${dupeIds.length} dupes`);
    
    return {
      originalProduct,
      dupeIds,
      productSlug
    };
  } catch (error) {
    logError(`[${requestId}] Error inserting product and dupes: ${safeStringify(error)}`);
    throw error;
  }
}

/**
 * Process a search request and handle the full workflow
 * @param searchData Search data (searchText or imageData)
 * @param requestId Unique request ID for tracking
 * @param sendEvent Function to send SSE events to client
 */
async function processSearchRequest(
  searchData: any, 
  requestId: string,
  sendEvent: (type: string, data: any) => void
) {
  try {
    sendEvent("progress", "Analyzing your input...");
    
    // 1. Identify product from input (text or image)
    let productInfo: ProductInfo = { name: undefined, brand: undefined, category: undefined, isRelevant: undefined };
    let inputType = searchData.searchText ? "text" : "image";
    
    if (searchData.imageData) {
      // Process image to extract product info or barcode
      logInfo(`[${requestId}] Processing image input`);
      productInfo = await processImageInput(searchData.imageData);
      logInfo(`[${requestId}] Image analysis complete, product identified: ${safeStringify(productInfo)}`);
    } else if (searchData.searchText) {
      // Process text input directly
      logInfo(`[${requestId}] Processing text input: ${searchData.searchText}`);
      inputType = "text";
      productInfo = await processTextInput(searchData.searchText);
      logInfo(`[${requestId}] Text analysis complete, product identified: ${safeStringify(productInfo)}`);
    }
    
    // Send identified product info
    if (productInfo && (productInfo.name || productInfo.brand)) {
      const productName = [productInfo.brand, productInfo.name].filter(Boolean).join(' ');
      logInfo(`[${requestId}] Product identified: ${productName}, isRelevant: ${productInfo.isRelevant}`);
      
      sendEvent("productIdentified", {
        name: productInfo.name || '',
        brand: productInfo.brand || '',
        category: productInfo.category || '',
        isRelevant: productInfo.isRelevant === false ? false : true,
        inputType: inputType
      });
      
      sendEvent("progress", `We detected: ${productName}`);
      
      // If product is not relevant for beauty dupes, end processing
      if (productInfo.isRelevant === false) {
        logInfo(`[${requestId}] Product not relevant for dupes, ending processing`);
        sendEvent("notRelevant", "This doesn't appear to be a beauty product we can find dupes for.");
        return;
      }
      
      // Use the identified product name for further processing
      const productQuery = productName;

      // 2. Check if product exists in database - using improved search
      sendEvent("progress", "Checking our database for existing dupes...");
      const existingProductResult = await checkExistingProduct(productQuery, productInfo, requestId);
      
      if (existingProductResult.found && existingProductResult.product) {
        const existingProduct = existingProductResult.product;
        sendEvent("progress", "Oh, we already know this one! Let's show you the dupes... 🌟");
        sendEvent("result", {
          success: true,
          data: {
            name: existingProduct.name,
            brand: existingProduct.brand,
            slug: existingProduct.slug
          }
        });
        logInfo(`[${requestId}] Request completed successfully with existing product`);
        return;
      }
      
      logInfo(`[${requestId}] No existing product found, proceeding to fetch dupes`);

      // 3. Get initial dupes from Perplexity
      sendEvent("progress", "Scouring the beauty universe for your perfect match... 💄");
      logInfo(`[${requestId}] Calling Perplexity API to get initial dupes for: ${productQuery}`);
      const initialDupes = await getInitialDupes(productQuery);
      
      if (!initialDupes.originalName || !initialDupes.originalBrand) {
        const errorMsg = 'Could not identify original product from search';
        logError(`[${requestId}] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      logInfo(`[${requestId}] Initial dupes received from Perplexity:
        - Original: ${initialDupes.originalBrand} ${initialDupes.originalName}
        - Found ${initialDupes.dupes.length} potential dupes`);

      // 4. Create initial products with minimal data
      sendEvent("progress", "Found some gems! Let's doll them up with more details... 💎");
      
      // Insert original product and dupes
      const { originalProduct, dupeIds, productSlug } = await insertProductAndDupes(initialDupes, requestId);

      // 5. Run all background processes
      sendEvent("progress", "Putting together your beauty dossier... 📋");
      
      // Background tasks data
      const backgroundData = {
        originalProductId: originalProduct?.id,
        dupeProductIds: dupeIds,
        originalBrand: initialDupes.originalBrand,
        originalName: initialDupes.originalName,
        dupeInfo: initialDupes.dupes.map((dupe: any, index: number) => ({ id: dupeIds[index], name: dupe.name, brand: dupe.brand }))
      };
      
      // Run background tasks in parallel
      const results = await runBackgroundTasks(backgroundData, requestId);
      
      // Check for any failures in the results
      const failures = results.filter(result => !result.success);
      if (failures.length > 0) {
        logError(`[${requestId}] ${failures.length} background processes failed: ${safeStringify(failures)}`);
        // Continue anyway - we'll still show what we have
      }

      // 6. Return results to frontend
      sendEvent("progress", "Ta-da! Your dupes are ready to shine! 🌟");
      logInfo(`[${requestId}] Sending final result to client with slug: ${productSlug}`);
      sendEvent("result", {
        success: true,
        data: {
          name: originalProduct.name,
          brand: originalProduct.brand,
          slug: productSlug
        }
      });
      
      logInfo(`[${requestId}] Request completed successfully`);
    } else {
      // Couldn't identify product clearly
      logError(`[${requestId}] Failed to identify product from input`);
      sendEvent("error", "We couldn't identify the product clearly. Please try again.");
    }
  } catch (error) {
    logError(`[${requestId}] Error in search-dupes processing: ${safeStringify(error)}`);
    sendEvent("error", error instanceof Error ? error.message : String(error));
  }
}

/**
 * Main handler function for search-dupes endpoint
 * Supports both POST for data submission and GET for SSE connections 
 */
serve(async (req) => {
  // Create a unique request ID for tracing this request through logs
  const requestId = crypto.randomUUID();
  const url = new URL(req.url);
  const providedRequestId = url.searchParams.get('requestId');
  
  // Use provided requestId or generate a new one
  const actualRequestId = providedRequestId || requestId;
  
  logInfo(`[${actualRequestId}] New search-dupes request received: ${req.method}`);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    logInfo(`[${actualRequestId}] Handling preflight OPTIONS request`);
    return new Response('ok', { headers: corsHeaders });
  }

  // Check for SSE stream request (GET)
  const isStream = url.searchParams.get('stream') === 'true';
  
  if (req.method === 'GET') {
    logInfo(`[${actualRequestId}] Handling GET request, isStream: ${isStream}`);
    
    // If it's not a streaming request, return an error
    if (!isStream) {
      logError(`[${actualRequestId}] GET method without stream parameter`);
      return new Response(
        JSON.stringify({ success: false, error: "This endpoint requires either a POST request with search data or a GET request with stream=true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Set up Server-Sent Events for streaming response
    logInfo(`[${actualRequestId}] Setting up SSE stream for client`);
    const encoder = new TextEncoder();
    
    // Get request data from store if it exists
    const searchData = requestDataStore.get(actualRequestId);
    
    if (!searchData) {
      logError(`[${actualRequestId}] No data found for this request ID`);
      return new Response(
        JSON.stringify({ success: false, error: "No data found for this request ID. Send a POST request first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          logInfo(`[${actualRequestId}] Sending event: ${type}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
        };
        
        try {
          // Process the search request
          await processSearchRequest(searchData, actualRequestId, sendEvent);
        } catch (error) {
          logError(`[${actualRequestId}] Error in SSE stream handler: ${safeStringify(error)}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : String(error)
          })}\n\n`));
        } finally {
          // Clean up the request data
          requestDataStore.delete(actualRequestId);
          controller.close();
          logInfo(`[${actualRequestId}] SSE stream closed`);
        }
      }
    });
    
    return new Response(stream, { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }
  
  // Handle POST request
  if (req.method === 'POST') {
    logInfo(`[${actualRequestId}] Handling POST request`);
    
    try {
      // Extract input data from POST request body
      const body = await req.json();
      const searchText = body.searchText;
      const imageData = body.imageData;
      
      logInfo(`[${actualRequestId}] POST request with:
        - searchText: ${searchText ? `${searchText.substring(0, 30)}${searchText.length > 30 ? '...' : ''}` : 'None'}
        - imageData: ${imageData ? "Present" : "None"}`);
      
      if (!searchText && !imageData) {
        logError(`[${actualRequestId}] No search input provided in request`);
        return new Response(
          JSON.stringify({ success: false, error: "No search input provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Store the data for this request ID
      requestDataStore.set(actualRequestId, { searchText, imageData });
      
      // If streaming is requested directly in the POST, set up SSE
      if (isStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const sendEvent = (type: string, data: any) => {
              logInfo(`[${actualRequestId}] Sending event: ${type}`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
            };
            
            try {
              // Process the search request
              await processSearchRequest({ searchText, imageData }, actualRequestId, sendEvent);
            } catch (error) {
              logError(`[${actualRequestId}] Error in SSE stream handler: ${safeStringify(error)}`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : String(error)
              })}\n\n`));
            } finally {
              // Clean up the request data
              requestDataStore.delete(actualRequestId);
              controller.close();
              logInfo(`[${actualRequestId}] SSE stream closed`);
            }
          }
        });
        
        return new Response(stream, { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      }
      
      // If no streaming requested, process immediately and return result
      logInfo(`[${actualRequestId}] Processing search synchronously`);
      
      // Define a collector for events
      const events: any[] = [];
      const sendEvent = (type: string, data: any) => {
        logInfo(`[${actualRequestId}] Collecting event: ${type}`);
        events.push({ type, ...data });
      };
      
      // Process the search and collect events
      await processSearchRequest({ searchText, imageData }, actualRequestId, sendEvent);
      
      // Find the last result event if any
      const resultEvent = events.findLast(event => event.type === 'result');
      if (resultEvent) {
        return new Response(
          JSON.stringify({ success: true, data: resultEvent.data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Find any error events
      const errorEvent = events.findLast(event => event.type === 'error');
      if (errorEvent) {
        return new Response(
          JSON.stringify({ success: false, error: errorEvent.error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // If no result or error, return a general success with the last progress
      const lastProgressEvent = events.findLast(event => event.type === 'progress');
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: "processing", 
          message: lastProgressEvent?.message || "Processing request",
          requestId: actualRequestId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      logError(`[${actualRequestId}] Fatal error in search-dupes handler: ${safeStringify(error)}`);
      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
  
  // Reject all other HTTP methods
  logError(`[${actualRequestId}] Method not allowed: ${req.method}`);
  return new Response(
    JSON.stringify({ success: false, error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});