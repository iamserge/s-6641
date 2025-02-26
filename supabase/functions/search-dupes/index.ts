
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processSearchRequest } from "./handlers.ts";

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

    console.log(`Processing search request for: ${searchText}`);

    const result = await processSearchRequest(searchText, Deno.env.get('GETIMG_API_KEY') || '');
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing search request:', error);
    
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
