import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAndProcessDupes } from "./handlers.ts";
import { logInfo, logError } from "../shared/utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchText } = await req.json();

    if (!searchText) {
      return new Response(
        JSON.stringify({ success: false, error: "Search text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logInfo(`Processing search request for: ${searchText}`);

    // Set up the SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const onProgress = (message: string) => {
          // Send progress update as an SSE event
          const event = `data: ${JSON.stringify({ type: "progress", message })}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        try {
          // Process the search and get the result
          const result = await searchAndProcessDupes(searchText, onProgress);
          // Send the final result as an SSE event
          const finalEvent = `data: ${JSON.stringify({ type: "result", data: result })}\n\n`;
          controller.enqueue(encoder.encode(finalEvent));
        } catch (error) {
          // Send an error event if something goes wrong
          const errorEvent = `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          // Close the stream
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    logError("Error processing search request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process search request",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});