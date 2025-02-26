
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processSearchRequest } from "./handlers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Search-dupes function invoked`);
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { searchText } = body;
    
    console.log('[Request] Full body:', JSON.stringify(body, null, 2));
    console.log('[Request] Search text:', searchText);
    
    if (!searchText) {
      console.log('[Validation] Error: Search text is missing');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Search text is required',
          timestamp 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Processing] Starting search request for: "${searchText}"`);
    
    const apiKey = Deno.env.get('GETIMG_API_KEY');
    console.log('[Config] API Key present:', !!apiKey);
    console.log('[Config] API Key length:', apiKey ? apiKey.length : 0);

    const startTime = performance.now();
    const result = await processSearchRequest(searchText, apiKey || '');
    const duration = performance.now() - startTime;
    
    console.log(`[Success] Search processing completed in ${duration.toFixed(2)}ms`);
    console.log('[Response] Result size:', JSON.stringify(result).length);
    
    return new Response(
      JSON.stringify({
        ...result,
        _metadata: {
          timestamp,
          duration: `${duration.toFixed(2)}ms`,
          searchText
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[Error] Processing search request:', error);
    console.error('[Error] Stack trace:', error.stack);
    console.error('[Error] Error type:', error.constructor.name);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to process search request',
        details: error.message,
        type: error.constructor.name,
        timestamp,
        path: req.url
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
