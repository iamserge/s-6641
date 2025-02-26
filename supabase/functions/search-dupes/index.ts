
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAndProcessDupes } from "../services/external-db.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { supabase } from "../shared/db-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    const url = new URL(req.url);
    const searchText = url.searchParams.get("searchText");

    if (!searchText) {
      return new Response(
        JSON.stringify({ error: "Search text is required" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Set up SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send progress updates
          const sendProgress = (message: string) => {
            const progressEvent = JSON.stringify({ type: "progress", message });
            controller.enqueue(encoder.encode(`data: ${progressEvent}\n\n`));
          };

          sendProgress("🔍 Starting search process...");

          // Search for dupes
          const result = await searchAndProcessDupes(searchText);

          // If data needs to be processed in background
          if (result.success && result.data) {
            // Use EdgeRuntime.waitUntil for background task
            EdgeRuntime.waitUntil((async () => {
              try {
                const { error } = await supabase.functions.invoke('populate-data', {
                  body: { productData: result.data }
                });
                
                if (error) {
                  logError('Background task error:', error);
                } else {
                  logInfo('Background task completed successfully');
                }
              } catch (error) {
                logError('Error in background task:', error);
              }
            })());
          }

          // Send final result
          const finalEvent = JSON.stringify({ type: "result", data: result });
          controller.enqueue(encoder.encode(`data: ${finalEvent}\n\n`));
        } catch (error) {
          const errorEvent = JSON.stringify({ 
            type: "error", 
            error: error instanceof Error ? error.message : "An unknown error occurred" 
          });
          controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    logError('Error in request handler:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
