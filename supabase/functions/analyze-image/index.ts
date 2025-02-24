
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
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes images of makeup products. Extract the product name, brand if visible, and if there\'s a hand holding the product, analyze the skin tone.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image and extract: 1. Product name and brand 2. If a hand is visible, describe the skin tone. Return as JSON with fields: productName, brand, skinTone (null if no hand visible)',
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

    const data = await response.json()
    console.log('OpenAI response:', data)

    return new Response(
      JSON.stringify(data.choices[0].message.content),
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
