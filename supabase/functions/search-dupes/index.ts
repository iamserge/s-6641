
/// <reference lib="es2015" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleDupeSearch } from "./handlers.ts";
import { corsHeaders } from "../shared/constants.ts";
import { logInfo } from "../shared/utils.ts";

/**
 * Main entry point for the search-dupes Edge Function
 * 
 * This function processes search requests for makeup dupes,
 * handling the full workflow from fetching data to storing
 * products, dupes, brands, ingredients, and resources.
 */
serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize request timing for performance monitoring
  const startTime = Date.now();
  
  // Process the search request
  const response = await handleDupeSearch(req);
  
  // Log performance metrics
  const endTime = Date.now();
  logInfo(`Request processed in ${endTime - startTime}ms`);
  
  return response;
});
