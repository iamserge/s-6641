
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../shared/utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { inputType, inputData } = await req.json();
    
    let productInfo = null;
    
    // Handle different input types
    switch (inputType) {
      case 'image':
        productInfo = await processImageInput(inputData);
        break;
      case 'text':
        productInfo = await processTextInput(inputData);
        break;
      case 'barcode':
        productInfo = await processBarcodeInput(inputData);
        break;
      default:
        throw new Error('Invalid input type');
    }
    
    return new Response(
      JSON.stringify({ success: true, data: productInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-input:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processImageInput(imageData) {
  // Vision API call to detect product
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
          content: 'You analyze images of makeup products and return structured information.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract product name, brand, and category from this image.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    })
  });
  
  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

async function processTextInput(textData) {
  // Extract product name and brand from text
  return {
    name: textData.trim(),
    brand: null // Will be determined by Perplexity
  };
}

async function processBarcodeInput(barcodeData) {
  // Look up product by barcode
  // This could use the UPC database or similar services
  const UPCITEMDB_API_ENDPOINT = Deno.env.get("UPCITEMDB_API_ENDPOINT") || "https://api.upcitemdb.com/prod/trial/lookup";
  const response = await fetch(`${UPCITEMDB_API_ENDPOINT}?upc=${barcodeData}`, {
    headers: { 'Authorization': `Bearer ${Deno.env.get('UPCDB_API_KEY')}` }
  });
  
  const result = await response.json();
  if (result.items && result.items.length > 0) {
    return {
      name: result.items[0].title,
      brand: result.items[0].brand,
      category: result.items[0].category
    };
  }
  
  throw new Error('Barcode not found in database');
}
