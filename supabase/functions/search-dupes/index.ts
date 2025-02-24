
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check if PERPLEXITY_API_KEY is set
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not set')
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
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
        model: 'sonar-medium-online',
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
      const errorText = await response.text()
      console.error('Perplexity API error response:', errorText)
      throw new Error(`Perplexity API error: ${response.status} ${errorText}`)
    }

    const perplexityResponse = await response.json()
    console.log('Perplexity response:', perplexityResponse)

    if (!perplexityResponse.choices?.[0]?.message?.content) {
      console.error('Invalid response format from Perplexity:', perplexityResponse)
      throw new Error('Invalid response format from Perplexity')
    }

    // Parse the response
    let formattedResponse
    try {
      const content = perplexityResponse.choices[0].message.content
      formattedResponse = JSON.parse(content)
    } catch (e) {
      console.error('Could not parse response as JSON:', e)
      throw new Error('Invalid response format from Perplexity')
    }

    // Validate response format
    if (!formattedResponse.original || !formattedResponse.dupes || !formattedResponse.summary) {
      console.error('Missing required fields in response:', formattedResponse)
      throw new Error('Invalid response format from Perplexity')
    }

    // Store in database
    const { original, dupes, summary, resources } = formattedResponse

    // Create slug from product name
    const slug = slugify(original.name, { lower: true })

    // Insert product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name: original.name,
        brand: original.brand,
        price: original.price,
        attributes: original.attributes,
        image_url: original.imageUrl,
        summary,
        slug
      })
      .select()
      .single()

    if (productError) {
      console.error('Error inserting product:', productError)
      throw productError
    }

    // Insert dupes
    const { error: dupesError } = await supabase
      .from('dupes')
      .insert(
        dupes.map(dupe => ({
          product_id: productData.id,
          name: dupe.name,
          brand: dupe.brand,
          price: dupe.price,
          savings_percentage: dupe.savingsPercentage,
          key_ingredients: dupe.keyIngredients,
          texture: dupe.texture,
          finish: dupe.finish,
          spf: dupe.spf,
          skin_types: dupe.skinTypes,
          match_score: dupe.matchScore,
          notes: dupe.notes,
          purchase_link: dupe.purchaseLink
        }))
      )

    if (dupesError) {
      console.error('Error inserting dupes:', dupesError)
      throw dupesError
    }

    // Insert resources
    const { error: resourcesError } = await supabase
      .from('resources')
      .insert(
        resources.map(resource => ({
          product_id: productData.id,
          title: resource.title,
          url: resource.url,
          type: resource.type
        }))
      )

    if (resourcesError) {
      console.error('Error inserting resources:', resourcesError)
      throw resourcesError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          id: productData.id,
          slug
        }
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
