import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getInitialDupes } from "../services/perplexity.ts";
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { supabase } from "../shared/db-client.ts";
import { corsHeaders, logInfo, logError, safeStringify } from "../shared/utils.ts";

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
    let barcodeData = null;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      searchText = url.searchParams.get("searchText");
      logInfo(`[${requestId}] GET request with searchText: ${searchText?.substring(0, 30)}${searchText?.length > 30 ? '...' : ''}`);
    } else if (req.method === 'POST') {
      logInfo(`[${requestId}] Processing POST request body`);
      const body = await req.json();
      searchText = body.searchText;
      imageData = body.imageData ? "[IMAGE DATA PRESENT]" : null; // Log presence but not content
      barcodeData = body.barcodeData;
      
      logInfo(`[${requestId}] POST request with:
        - searchText: ${searchText?.substring(0, 30)}${searchText?.length > 30 ? '...' : ''}
        - imageData: ${imageData ? "Present" : "None"}
        - barcodeData: ${barcodeData || "None"}`);
    }
    
    if (!searchText && !imageData && !barcodeData) {
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
          
          // 1. Determine input type and identify product
          let productInfo = null;
          let inputType = "unknown";
          
          if (imageData) {
            logInfo(`[${requestId}] Processing image input`);
            inputType = "image";
            productInfo = await processImageInput(imageData);
            logInfo(`[${requestId}] Image analysis complete, product identified: ${safeStringify(productInfo)}`);
          } else if (barcodeData) {
            logInfo(`[${requestId}] Processing barcode input: ${barcodeData}`);
            inputType = "barcode";
            productInfo = await processBarcodeInput(barcodeData);
            logInfo(`[${requestId}] Barcode lookup complete, product identified: ${safeStringify(productInfo)}`);
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
            logInfo(`[${requestId}] Sending identified product to client: ${productName}`);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "productIdentified",
              data: {
                name: productInfo.name || '',
                brand: productInfo.brand || '',
                category: productInfo.category || '',
                inputType: inputType
              }
            })}\n\n`));
            
            sendProgress(`We detected: ${productName}`);
            
            // Use the detected product name for further processing
            searchText = productName;
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
          
          logInfo(`[${requestId}] Original product inserted successfully with ID: ${originalProduct.id}`);

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
                
                logInfo(`[${requestId}] Dupe #${index + 1} inserted with ID: ${dupeProduct.id}`);

                // Create dupe relationship
                logInfo(`[${requestId}] Creating relationship between ${originalProduct.id} and ${dupeProduct.id}`);
                const { error: relationError } = await supabase
                  .from('product_dupes')
                  .insert({
                    original_product_id: originalProduct.id,
                    dupe_product_id: dupeProduct.id,
                    match_score: dupe.matchScore,
                    savings_percentage: 0 // Will be updated later
                  });
                  
                if (relationError) {
                  logError(`[${requestId}] Error creating dupe relationship: ${safeStringify(relationError)}`);
                  throw relationError;
                }

                return dupeProduct.id;
              } catch (dupeInsertError) {
                logError(`[${requestId}] Failed to insert dupe #${index + 1}: ${safeStringify(dupeInsertError)}`);
                throw dupeInsertError;
              }
            })
          );

          
          logInfo(`[${requestId}] Successfully inserted all ${dupeIds.length} dupes`);

          // 5. Run all background processes and wait for them to complete
          sendProgress("Putting together your beauty dossier... 📋");
          logInfo(`[${requestId}] Initiating background processing tasks`);
          
          // Background tasks data
          const backgroundData = {
            originalProductId: originalProduct.id,
            dupeProductIds: dupeIds,
            originalBrand: initialDupes.originalBrand,
            originalName: initialDupes.originalName,
            dupeInfo: initialDupes.dupes.map(dupe => ({ name: dupe.name, brand: dupe.brand }))
          };
          
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const authKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
          
          if (!supabaseUrl || !authKey) {
            logError(`[${requestId}] Missing Supabase URL or service role key for background tasks`);
          }
          
          // Execute all background functions in parallel but wait for them to complete
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
              
              // Process ingredients
              (async () => {
                logInfo(`[${requestId}] Starting process-ingredients task`);
                try {
                  const response = await fetch(`${supabaseUrl}/functions/v1/process-ingredients`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
                    body: JSON.stringify(backgroundData)
                  });
                  const result = await response.json();
                  logInfo(`[${requestId}] process-ingredients task completed: ${safeStringify(result)}`);
                  return result;
                } catch (e) {
                  logError(`[${requestId}] process-ingredients task failed: ${safeStringify(e)}`);
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
            
            // Check for any failures in the results
            const failures = results.filter(result => !result.success);
            if (failures.length > 0) {
              logError(`[${requestId}] ${failures.length} background processes failed: ${safeStringify(failures)}`);
              // Continue anyway - we'll still show what we have
            }
          } catch (backgroundError) {
            logError(`[${requestId}] Error running background tasks: ${safeStringify(backgroundError)}`);
            // Continue anyway - we'll still return the basic product info
          }

          // 6. Return results to frontend once all background tasks are complete
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

async function processImageInput(imageData) {
  const logPrefix = `[IMAGE-PROCESSING]`;
  logInfo(`${logPrefix} Starting image analysis with OpenAI Vision API`);
  
  try {
    // Vision API call to detect product
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You analyze images of makeup products and return structured information in JSON format with name, brand and category fields.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract product name, brand, and category from this image. Return only name, brand, and category fields.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`${logPrefix} OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`Vision API error: ${response.status}`);
    }
    
    const result = await response.json();
    logInfo(`${logPrefix} OpenAI Vision API response received`);
    
    const content = result.choices[0].message.content;
    logInfo(`${logPrefix} Parsed content: ${content}`);
    
    const parsedResult = JSON.parse(content);
    logInfo(`${logPrefix} Image analysis complete: ${safeStringify(parsedResult)}`);
    
    return parsedResult;
  } catch (error) {
    logError(`${logPrefix} Error processing image: ${safeStringify(error)}`);
    // Return a basic structure on error
    return {
      name: "Unknown product",
      brand: null,
      category: null
    };
  }
}

async function processTextInput(textData) {
  const logPrefix = `[TEXT-PROCESSING]`;
  logInfo(`${logPrefix} Starting text analysis: "${textData}"`);
  
  try {
    // For text input, use a lightweight model to extract product name and brand
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract the makeup product name and brand from the text. Return JSON with name and brand fields only.'
          },
          {
            role: 'user',
            content: textData
          }
        ],
        response_format: { type: "json_object" }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`${logPrefix} OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`Text analysis API error: ${response.status}`);
    }
    
    const result = await response.json();
    logInfo(`${logPrefix} OpenAI text analysis response received`);
    
    const content = result.choices[0].message.content;
    logInfo(`${logPrefix} Parsed content: ${content}`);
    
    const parsedResult = JSON.parse(content);
    logInfo(`${logPrefix} Text analysis complete: ${safeStringify(parsedResult)}`);
    
    return parsedResult;
  } catch (error) {
    logError(`${logPrefix} Error processing text: ${safeStringify(error)}`);
    // If parsing fails, just return the text as name
    return {
      name: textData,
      brand: null
    };
  }
}

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
      return {
        name: item.title,
        brand: item.brand,
        category: item.category
      };
    }
    
    logError(`${logPrefix} No items found for barcode: ${barcodeData}`);
    throw new Error('Barcode not found');
  } catch (error) {
    logError(`${logPrefix} Error processing barcode: ${safeStringify(error)}`);
    // If barcode lookup fails, return just the barcode as the name
    return {
      name: `Product #${barcodeData}`,
      brand: null
    };
  }
}