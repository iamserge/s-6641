import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getInitialDupes } from "../services/perplexity.ts";
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { supabase } from "../shared/db-client.ts";
import { corsHeaders } from "../shared/utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
    } else if (req.method === 'POST') {
      const body = await req.json();
      searchText = body.searchText;
      imageData = body.imageData;
      barcodeData = body.barcodeData;
    }
    
    if (!searchText && !imageData && !barcodeData) {
      return new Response(
        JSON.stringify({ success: false, error: "No search input provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (message) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", message })}\n\n`));
        };

        try {
          // Initial progress
          sendProgress("Analyzing your input...");
          
          // 1. Determine input type and identify product
          let productInfo = null;
          let inputType = "unknown";
          
          if (imageData) {
            // Handle image input
            inputType = "image";
            productInfo = await processImageInput(imageData);
          } else if (barcodeData) {
            // Handle barcode input
            inputType = "barcode";
            productInfo = await processBarcodeInput(barcodeData);
          } else if (searchText) {
            // Handle text input - check if it's an EAN/UPC code first
            const eanRegex = /^[0-9]{8,14}$/;
            if (eanRegex.test(searchText.trim())) {
              inputType = "barcode";
              productInfo = await processBarcodeInput(searchText.trim());
            } else {
              inputType = "text";
              productInfo = await processTextInput(searchText);
            }
          }
          
          // Send identified product info
          if (productInfo && (productInfo.name || productInfo.brand)) {
            const productName = [productInfo.brand, productInfo.name].filter(Boolean).join(' ');
            
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
          const { data: existingProducts } = await supabase
            .from('products')
            .select('id, name, brand, slug')
            .or(`name.ilike.%${searchText}%,brand.ilike.%${searchText}%`)
            .limit(1);

          if (existingProducts && existingProducts.length > 0) {
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
            controller.close();
            return;
          }

          // 3. Get initial dupes from Perplexity
          sendProgress("Scouring the beauty universe for your perfect match... 💄");
          const initialDupes = await getInitialDupes(searchText);
          
          if (!initialDupes.originalName || !initialDupes.originalBrand) {
            throw new Error('Could not identify original product from search');
          }

          // 4. Create initial products with minimal data
          sendProgress("Found some gems! Let's doll them up with more details... 💎");
          
          // Create slug for original product
          const productSlug = slugify(`${initialDupes.originalBrand}-${initialDupes.originalName}`, { lower: true });
          
          // Insert original product with minimal data
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

          if (productError) throw productError;

          // Insert dupes with minimal data
          const dupeIds = await Promise.all(
            initialDupes.dupes.map(async (dupe) => {
              const dupeSlug = slugify(`${dupe.brand}-${dupe.name}`, { lower: true });
              
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

              if (dupeError) throw dupeError;

              // Create dupe relationship
              await supabase
                .from('product_dupes')
                .insert({
                  original_product_id: originalProduct.id,
                  dupe_product_id: dupeProduct.id,
                  match_score: dupe.matchScore,
                  savings_percentage: 0 // Will be updated later
                });

              return dupeProduct.id;
            })
          );

          // 5. Run all background processes and wait for them to complete
          sendProgress("Putting together your beauty dossier... 📋");
          
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
          
          // Execute all background functions in parallel but wait for them to complete
          const results = await Promise.all([
            // Process brands
            fetch(`${supabaseUrl}/functions/v1/process-brands`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
              body: JSON.stringify(backgroundData)
            }).then(res => res.json()),
            
            // Process ingredients
            fetch(`${supabaseUrl}/functions/v1/process-ingredients`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
              body: JSON.stringify(backgroundData)
            }).then(res => res.json()),
            
            // Process reviews
            fetch(`${supabaseUrl}/functions/v1/process-reviews`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
              body: JSON.stringify(backgroundData)
            }).then(res => res.json()),
            
            // Process resources
            fetch(`${supabaseUrl}/functions/v1/process-resources`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
              body: JSON.stringify(backgroundData)
            }).then(res => res.json()),
            
            // Process detailed analysis (images, prices, etc.)
            fetch(`${supabaseUrl}/functions/v1/process-detailed-analysis`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
              body: JSON.stringify(backgroundData)
            }).then(res => res.json())
          ]);
          
          // Check for any failures in the results
          const failures = results.filter(result => !result.success);
          if (failures.length > 0) {
            console.warn(`${failures.length} background processes failed:`, failures);
            // Continue anyway - we'll still show what we have
          }

          // 6. Return results to frontend once all background tasks are complete
          sendProgress("Ta-da! Your dupes are ready to shine! 🌟");
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
          
        } catch (error) {
          console.error('Error in search-dupes:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "error",
            error: error.message
          })}\n\n`));
        } finally {
          controller.close();
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
    console.error('Error in search-dupes:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processImageInput(imageData) {
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
    })
  });
  
  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

async function processTextInput(textData) {
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
    })
  });
  
  try {
    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    // If parsing fails, just return the text as name
    return {
      name: textData,
      brand: null
    };
  }
}

async function processBarcodeInput(barcodeData) {
  // Handle barcode/EAN/UPC lookup
  try {
    const UPCITEMDB_API_ENDPOINT = "https://api.upcitemdb.com/prod/trial/lookup";
    const response = await fetch(`${UPCITEMDB_API_ENDPOINT}?upc=${barcodeData}`, {
      headers: { 'Authorization': `Bearer ${Deno.env.get('UPCDB_API_KEY')}` }
    });
    
    const result = await response.json();
    if (result.items && result.items.length > 0) {
      return {
        name: result.items[0].title,
        brand: result.items[0].brand,
        category: result.items[0].category
      };
    }
    
    throw new Error('Barcode not found');
  } catch (error) {
    // If barcode lookup fails, return just the barcode as the name
    return {
      name: `Product #${barcodeData}`,
      brand: null
    };
  }
}