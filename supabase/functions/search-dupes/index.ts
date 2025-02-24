
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
    const { searchText } = await req.json()
    
    if (!searchText) {
      throw new Error("No search query provided")
    }

    console.log('Searching for dupes for:', searchText)

    const prompt = `I'm building a makeup dupe-finding tool for Dupe.academy. Please write a detailed analysis report for the product '${searchText}'. Your report should cover:

Original Product Description:
Provide the product name, brand, price, and key attributes (for example, 'SPF 40, rich, creamy texture, dewy finish, hydrating formula suitable for dry/combination skin').
Include an image URL if available (optional).

Dupe Recommendations:
For each recommended dupe, include:
Product Name & Brand: e.g., 'Revolution Miracle Cream' by 'Revolution Beauty'
Price: e.g., '$14'
Savings Percentage: Calculate and include the percentage savings compared to the original product's price (e.g., '86% savings').
Key Ingredients/Formulation Highlights: List the main ingredients or formulation benefits (e.g., 'Hyaluronic Acid, Peptides, Shea Butter').
Texture and Finish: Describe the texture (e.g., 'thick and rich') and finish (e.g., 'semi-matte' or 'dewy').
SPF (if applicable): e.g., 'SPF 30 or 50'
Skin Type Compatibility: Which skin type(s) it is best suited for.
Match Score or Similarity Grade: A similarity indicator compared to the original product (e.g., '90% match' or 'Grade A').
Additional Notes: Any extra observations (e.g., 'lower SPF but comparable hydration').
Purchase Link: (Optional) A link where the product can be purchased.

Comparison Summary:
Provide a concise summary that compares the original product and its dupes, highlighting which dupe stands out based on performance, savings, and suitability.

Resource Library:
Create a library of supplementary resources related to '${searchText}', including various content types such as:
Videos (e.g., YouTube, TikTok)
Instagram posts
Articles and blog posts
For each resource, include:
Title/Description: Brief description of the resource.
URL: The link to the resource.
Type: Specify the type (e.g., 'Video', 'YouTube', 'Instagram', 'TikTok', 'Article').

Please format your response in JSON format for easy parsing and display. Each section should be clearly structured with appropriate fields and nested objects.`

    console.log('Sending request to Perplexity...')

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: [
          {
            role: 'system',
            content: `You are a makeup expert specializing in finding dupes for high-end products. Always format your responses as JSON with this structure:
{
  "original": {
    "name": string,
    "brand": string,
    "price": number,
    "attributes": string[],
    "imageUrl": string (optional)
  },
  "dupes": [{
    "name": string,
    "brand": string,
    "price": number,
    "savingsPercentage": number,
    "keyIngredients": string[],
    "texture": string,
    "finish": string,
    "spf": number (optional),
    "skinTypes": string[],
    "matchScore": number,
    "notes": string,
    "purchaseLink": string (optional)
  }],
  "summary": string,
  "resources": [{
    "title": string,
    "url": string,
    "type": "Video" | "YouTube" | "Instagram" | "TikTok" | "Article"
  }]
}`
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
