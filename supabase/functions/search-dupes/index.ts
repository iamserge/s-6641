
// Edge function to handle dupe searches with Server-Sent Events (SSE)
// Modified to trigger rebuild again
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAndProcessDupes } from "./handlers.ts";
import { logInfo, logError } from "../shared/utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
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
        JSON.stringify({ success: false, error: "Search text is required" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    logInfo(`Processing search request for: ${searchText}`);

    // Set up the SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const onProgress = (message: string) => {
          const event = `data: ${JSON.stringify({ type: "progress", message })}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        try {
          const result = await searchAndProcessDupes(searchText, onProgress);
          const finalEvent = `data: ${JSON.stringify({ type: "result", data: result })}\n\n`;
          controller.enqueue(encoder.encode(finalEvent));
        } catch (error) {
          const errorEvent = `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          controller.close();
        }
      },
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
    logError('Error in request handler:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
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
