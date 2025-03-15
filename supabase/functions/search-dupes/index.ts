import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getInitialDupes, identifyProductWithPerplexity } from "../services/perplexity.ts";
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { supabase } from "../shared/db-client.ts";
import { corsHeaders, logInfo, logError, safeStringify } from "../shared/utils.ts";
import { extractProductInfoFromImage } from "../services/openai.ts";

/**
 * Processes text input to identify product and check relevance
 * @param textData Text input from user
 * @returns Object with product name, brand, category and relevance status
 */
async function processTextInput(textData) {
  const logPrefix = `[TEXT-PROCESSING]`;
  logInfo(`${logPrefix} Processing text input: "${textData}"`);
  
  // Call Perplexity to identify product and determine if it's relevant
  return await identifyProductWithPerplexity(textData);
}

/**
 * Processes image input to extract product information or barcode
 * @param imageData Base64 encoded image data
 * @returns Object with product name, brand, category and relevance status
 */
async function processImageInput(imageData) {
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
          brand: null,
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
      brand: extractedInfo.brand || null,
      category: extractedInfo.category || null,
      isRelevant: false // Default to false when we can't determine
    };
  } catch (error) {
    logError(`${logPrefix} Error processing image: ${safeStringify(error)}`);
    return {
      name: "Unknown product",
      brand: null,
      isRelevant: false
    };
  }
}

/**
 * Processes barcode input to get product information
 * @param barcodeData Barcode number
 * @returns Object with product name, brand, category and relevance status
 */
async function processBarcodeInput(barcodeData) {
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
        brand: item.brand,
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
      brand: null,
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
async function runBackgroundTasks(backgroundData, requestId) {
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
          return { success: false, error: e.message };
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
          return { success: false, error: e.message };
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
          return { success: false, error: e.message };
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
          return { success: false, error: e.message };
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
 * Main handler function for search-dupes endpoint
 * Processes input (text/image), checks database, finds dupes, and runs background tasks
 */
serve(async (req) => {
  // Create a unique request ID for tracing this request through logs
  const requestId = crypto.randomUUID();
  
  logInfo(`[${requestId}] New search-dupes request received: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    logInfo(`[${requestId}] Handling preflight OPTIONS request`);
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract input data based on method
    let searchText = null;
    let imageData = null;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      searchText = url.searchParams.get("searchText");
      logInfo(`[${requestId}] GET request with searchText: ${searchText?.substring(0, 30)}${searchText?.length > 30 ? '...' : ''}`);
    } else if (req.method === 'POST') {
      logInfo(`[${requestId}] Processing POST request body`);
      const body = await req.json();
      searchText = body.searchText;
      imageData = body.imageData;
      
      logInfo(`[${requestId}] POST request with:
        - searchText: ${searchText?.substring(0, 30)}${searchText?.length > 30 ? '...' : ''}
        - imageData: ${imageData ? "Present" : "None"}`);
    }
    
    if (!searchText && !imageData) {
      logError(`[${requestId}] No search input provided in request`);
      return new Response(
        JSON.stringify({ success: false, error: "No search input provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set up SSE stream
    logInfo(`[${requestId}] Setting up Server-Sent Events (SSE) stream`);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (message) => {
          logInfo(`[${requestId}] Progress update: ${message}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", message })}\n\n`));
        };

        try {
          // Initial progress
          sendProgress("Analyzing your input...");
          
          // 1. Identify product from input (text or image)
          let productInfo = null;
          let inputType = searchText ? "text" : "image";
          
          if (imageData) {
            // Process image to extract product info or barcode
            logInfo(`[${requestId}] Processing image input`);
            productInfo = await processImageInput(imageData);
            logInfo(`[${requestId}] Image analysis complete, product identified: ${safeStringify(productInfo)}`);
          } else if (searchText) {
            // Handle text input - check if it's an EAN/UPC code first
            const eanRegex = /^[0-9]{8,14}$/;
            if (eanRegex.test(searchText.trim())) {
              logInfo(`[${requestId}] Detected EAN/UPC code in text input: ${searchText.trim()}`);
              inputType = "barcode";
              productInfo = await processBarcodeInput(searchText.trim());
            } else {
              logInfo(`[${requestId}] Processing text input: ${searchText}`);
              inputType = "text";
              productInfo = await processTextInput(searchText);
            }
            logInfo(`[${requestId}] Text analysis complete, product identified: ${safeStringify(productInfo)}`);
          }
          
          // Send identified product info
          if (productInfo && (productInfo.name || productInfo.brand)) {
            const productName = [productInfo.brand, productInfo.name].filter(Boolean).join(' ');
            logInfo(`[${requestId}] Product identified: ${productName}, isRelevant: ${productInfo.isRelevant}`);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "productIdentified",
              data: {
                name: productInfo.name || '',
                brand: productInfo.brand || '',
                category: productInfo.category || '',
                isRelevant: productInfo.isRelevant === false ? false : true,
                inputType: inputType
              }
            })}\n\n`));
            
            sendProgress(`We detected: ${productName}`);
            
            // If product is not relevant for beauty dupes, end processing
            if (productInfo.isRelevant === false) {
              logInfo(`[${requestId}] Product not relevant for dupes, ending processing`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: "notRelevant",
                message: "This doesn't appear to be a beauty product we can find dupes for."
              })}\n\n`));
              controller.close();
              return;
            }
            
            // Use the identified product name for further processing
            searchText = productName;
          } else {
            // Couldn't identify product clearly
            logError(`[${requestId}] Failed to identify product from input`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "error",
              error: "We couldn't identify the product clearly. Please try again."
            })}\n\n`));
            controller.close();
            return;
          }

          // 2. Check if product exists in database
          sendProgress("Checking our database for existing dupes...");
          logInfo(`[${requestId}] Searching database for existing product: ${searchText}`);
          
          const { data: existingProducts, error: searchError } = await supabase
            .from('products')
            .select('id, name, brand, slug')
            .or(`name.ilike.%${searchText}%,brand.ilike.%${searchText}%`)
            .limit(1);
            
          if (searchError) {
            logError(`[${requestId}] Error searching existing products: ${safeStringify(searchError)}`);
          }

          if (existingProducts && existingProducts.length > 0) {
            logInfo(`[${requestId}] Found existing product in database: ${existingProducts[0].brand} ${existingProducts[0].name} (${existingProducts[0].slug})`);
            sendProgress("Oh, we already know this one! Let's show you the dupes... 🌟");
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "result",
              data: {
                success: true,
                data: {
                  name: existingProducts[0].name,
                  brand: existingProducts[0].brand,
                  slug: existingProducts[0].slug
                }
              }
            })}\n\n`));
            logInfo(`[${requestId}] Request completed successfully with existing product`);
            controller.close();
            return;
          }
          
          logInfo(`[${requestId}] No existing product found, proceeding to fetch dupes`);

          // 3. Get initial dupes from Perplexity
          sendProgress("Scouring the beauty universe for your perfect match... 💄");
          logInfo(`[${requestId}] Calling Perplexity API to get initial dupes for: ${searchText}`);
          const initialDupes = await getInitialDupes(searchText);
          
          if (!initialDupes.originalName || !initialDupes.originalBrand) {
            const errorMsg = 'Could not identify original product from search';
            logError(`[${requestId}] ${errorMsg}`);
            throw new Error(errorMsg);
          }
          
          logInfo(`[${requestId}] Initial dupes received from Perplexity:
            - Original: ${initialDupes.originalBrand} ${initialDupes.originalName}
            - Found ${initialDupes.dupes.length} potential dupes`);

          // 4. Create initial products with minimal data
          sendProgress("Found some gems! Let's doll them up with more details... 💎");
          
          // Create slug for original product
          const productSlug = slugify(`${initialDupes.originalBrand}-${initialDupes.originalName}`, { lower: true });
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
              loading_ingredients: false, // Set to false since we'll wait for processing
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
            initialDupes.dupes.map(async (dupe, index) => {
              const dupeSlug = slugify(`${dupe.brand}-${dupe.name}`, { lower: true });
              logInfo(`[${requestId}] Processing dupe #${index + 1}: ${dupe.brand} ${dupe.name} (slug: ${dupeSlug})`);
              
              try {
                const { data: dupeProduct, error: dupeError } = await supabase
                  .from('products')
                  .insert({
                    name: dupe.name,
                    brand: dupe.brand,
                    slug: dupeSlug,
                    price: 0, // Will be updated later
                    loading_ingredients: false, // Set to false since we'll wait for processing
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

          // 5. Run all background processes
          sendProgress("Putting together your beauty dossier... 📋");
          
          // Background tasks data
          const backgroundData = {
            originalProductId: originalProduct?.id,
            dupeProductIds: dupeIds,
            originalBrand: initialDupes.originalBrand,
            originalName: initialDupes.originalName,
            dupeInfo: initialDupes.dupes.map((dupe, index) => ({ id: dupeIds[index], name: dupe.name, brand: dupe.brand }))
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
          sendProgress("Ta-da! Your dupes are ready to shine! 🌟");
          logInfo(`[${requestId}] Sending final result to client with slug: ${productSlug}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "result",
            data: {
              success: true,
              data: {
                name: originalProduct.name,
                brand: originalProduct.brand,
                slug: productSlug
              }
            }
          })}\n\n`));
          
          logInfo(`[${requestId}] Request completed successfully`);
          
        } catch (error) {
          logError(`[${requestId}] Error in search-dupes stream handler: ${safeStringify(error)}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "error",
            error: error.message
          })}\n\n`));
        } finally {
          controller.close();
          logInfo(`[${requestId}] SSE stream closed`);
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
  } catch (error) {
    logError(`[${requestId}] Fatal error in search-dupes handler: ${safeStringify(error)}`);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});