
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchText, imageAnalysis } = await req.json()
    
    // Use imageAnalysis result if available, otherwise use searchText
    const productToSearch = imageAnalysis?.description || searchText

    if (!productToSearch) {
      throw new Error("No search query provided")
    }

    console.log('Searching for dupes for:', productToSearch)

    const prompt = `I am building a makeup dupe-finding tool called Dupe.academy. For the product "${productToSearch}", please generate a detailed report that includes:

Recommended Dupes: A list of makeup dupes with product names, brands, and links to high-quality product images.
Key Details: For each dupe, include information such as price, SPF (if applicable), key ingredients, and performance features.
Comparison Table: A side-by-side comparison table that highlights similarities and differences between ${productToSearch} and each recommended dupe (e.g., texture, finish, formulation, price savings).
User Feedback: Include user reviews, ratings, or match scores that indicate how closely the dupe resembles the original.
Skin Tone/Type Compatibility: Information on which skin tones or skin types each dupe is best suited for, along with any formulation differences.
Supplementary Resources: Links or references to articles, tutorials, or expert reviews that offer additional insights on evaluating the dupes.
Please format the output as a clear, structured comparison table (or in JSON format) followed by a concise summary of key findings and recommendations.`

    console.log('Sending request to Perplexity...')

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a makeup expert specializing in finding dupes for high-end products. Format your responses in clear, structured JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Perplexity API error:', error)
      throw new Error('Failed to get response from Perplexity')
    }

    const perplexityResponse = await response.json()
    console.log('Perplexity response:', perplexityResponse)

    // Parse and format the response
    let formattedResponse
    try {
      // Try to parse as JSON first
      const content = perplexityResponse.choices[0].message.content
      formattedResponse = JSON.parse(content)
    } catch (e) {
      console.log('Could not parse response as JSON, using raw text')
      formattedResponse = {
        raw: perplexityResponse.choices[0].message.content,
        error: 'Could not parse response as JSON'
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: formattedResponse
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in search-dupes function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
