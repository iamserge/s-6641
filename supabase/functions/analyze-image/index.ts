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

    // Ensure the image is in the correct base64 format if it's not already a URL
    const imageUrl = image.startsWith('data:image') 
      ? image 
      : `data:image/jpeg;base64,${image}`

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
            content: 'You are a helpful assistant that analyzes images of makeup products. Extract the product name, brand if visible, and if it is a barcode, output the product number.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image and extract string: "{product name} by {brand}" OR "{product code}" (if barcode), output just that, nothing else',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'auto' // Using 'auto' as per OpenAI recommendation
                },
              },
            ],
          },
        ],
        max_tokens: 100, // Limiting tokens for a concise response
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`)
    }

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('Invalid response from OpenAI: No choices returned')
    }

    const productText = data.choices[0].message.content.trim()

    console.log('OpenAI response:', productText)

    return new Response(
      JSON.stringify({ product: productText }),
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