
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleDupeSearch } from "./handlers";
import { corsHeaders } from "../shared/constants";
import { logInfo } from "../shared/utils";

/**
 * Main entry point for the search-dupes Edge Function
 */
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const response = await handleDupeSearch(req);
  const endTime = Date.now();
  logInfo(`Request processed in ${endTime - startTime}ms`);
  
  return response;
});
