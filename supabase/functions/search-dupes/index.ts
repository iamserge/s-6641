
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getInitialDupes } from "../services/perplexity.ts";
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";
import { supabase } from "../shared/db-client.ts";
import { corsHeaders } from "../shared/utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const searchText = url.searchParams.get("searchText");

  if (!searchText) {
    return new Response(
      JSON.stringify({ success: false, error: "Search text is required" }),
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
        // 1. Check if product exists in database
        sendProgress("Checking our database for existing dupes...");
        const { data: existingProducts } = await supabase
          .from('products')
          .select('id, name, brand, slug')
          .or(`name.ilike.%${searchText}%,brand.ilike.%${searchText}%`)
          .limit(1);

        if (existingProducts && existingProducts.length > 0) {
          sendProgress("Found existing product! Loading dupes...");
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

        // 2. Get initial dupes from Perplexity
        sendProgress("Searching for beauty dupes across the web...");
        const initialDupes = await getInitialDupes(searchText);
        
        if (!initialDupes.originalName || !initialDupes.originalBrand) {
          throw new Error('Could not identify original product from search text');
        }

        // 3. Create initial products with minimal data
        sendProgress("Found some matches! Creating initial entries...");
        
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
            loading_ingredients: true,
            loading_reviews: true,
            loading_resources: true
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
                loading_ingredients: true,
                loading_reviews: true,
                loading_resources: true
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

        // 4. Trigger parallel background processes
        sendProgress("Gathering detailed information in the background...");
        
        // Background tasks data
        const backgroundData = {
          originalProductId: originalProduct.id,
          dupeProductIds: dupeIds,
          originalBrand: initialDupes.originalBrand,
          originalName: initialDupes.originalName,
          dupeInfo: initialDupes.dupes.map(dupe => ({ name: dupe.name, brand: dupe.brand }))
        };
        
        // Trigger parallel background functions
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const authKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        // Fire and forget - parallel background processing
        Promise.all([
          fetch(`${supabaseUrl}/functions/v1/process-brands`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          }),
          
          fetch(`${supabaseUrl}/functions/v1/process-ingredients`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          }),
          
          fetch(`${supabaseUrl}/functions/v1/process-reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          }),
          
          fetch(`${supabaseUrl}/functions/v1/process-resources`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          }),
          
          fetch(`${supabaseUrl}/functions/v1/process-detailed-analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
            body: JSON.stringify(backgroundData)
          })
        ]).catch(error => console.error("Error triggering background tasks:", error));

        // 5. Return results to frontend
        sendProgress("Your dupes are ready! Loading details...");
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
});
