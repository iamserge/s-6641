import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAndProcessDupes } from "./handlers.ts";
import { logInfo, logError } from "../shared/utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchText } = await req.json();
    
    if (!searchText) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Search text is required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    logInfo(`Processing search request for: ${searchText}`);

    // First, check if we already have this product in our database
    // If yes, return it directly, otherwise proceed with the full dupe search flow
    const result = await searchAndProcessDupes(searchText);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logError('Error processing search request:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to process search request',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});