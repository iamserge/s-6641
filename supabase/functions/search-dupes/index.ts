
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processSearchRequest } from "./handlers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GETIMG_API_KEY = "key-2x0wBE4ycwjRklqTk7CW9WTMYP8w7mxQscC4hB6YO02VHYw3i6vlhBJ1OShumlIuh5ZNUUwTyMpoO91GzR1Cid85wQojR7sx";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchText } = await req.json();
    
    if (!searchText) {
      return new Response(
        JSON.stringify({ error: 'Search text is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await processSearchRequest(searchText, GETIMG_API_KEY);
    
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
