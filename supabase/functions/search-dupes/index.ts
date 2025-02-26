
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processSearchRequest } from "./handlers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Search-dupes function invoked:', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { searchText } = body;
    
    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Search text received:', searchText);
    
    if (!searchText) {
      console.log('Error: Search text is missing');
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
    
    const apiKey = Deno.env.get('GETIMG_API_KEY');
    console.log('API Key present:', !!apiKey);

    const result = await processSearchRequest(searchText, apiKey || '');
    console.log('Search processing completed successfully');
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing search request:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to process search request',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
