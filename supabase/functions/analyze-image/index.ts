
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image } = await req.json()

    if (!image) {
      throw new Error('No image provided')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes images of makeup products. Extract the product name, brand if visible and if it is barcode output product number',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image and extract string: {product name} by {brand} OR {product code} (if barcode ), output just that, nothing else',
              },
              {
                type: 'image_url',
                image_url: image,
              },
            ],
          },
        ],
      }),
    })

    const text = await response.text()
    console.log('OpenAI response:', text)

    return new Response(
      JSON.stringify({ product: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-image:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
