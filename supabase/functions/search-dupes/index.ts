/// <reference lib="es2015" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";

// **CORS Headers for Cross-Origin Requests**
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// **Environment Variables**
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
const GOOGLE_CSE_ID = Deno.env.get("GOOGLE_CSE_ID");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// **Check for Required Environment Variables**
if (!PERPLEXITY_API_KEY || !OPENAI_API_KEY || !GOOGLE_API_KEY || !GOOGLE_CSE_ID || !supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required environment variables. Please check your configuration.");
}

// **Initialize Supabase Client**
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// **Schema Definition for API Responses**
const SCHEMA_DEFINITION = `{
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
    "purchaseLink": string (optional),
    "imageUrl": string (optional)
  }],
  "summary": string,
  "resources": [{
    "title": string,
    "url": string,
    "type": "Video" | "YouTube" | "Instagram" | "TikTok" | "Article"
  }]
}`;

// **Type Definition for Dupe Response**
interface DupeResponse {
  original: {
    name: string;
    brand: string;
    price: number;
    attributes: string[];
    imageUrl?: string;
  };
  dupes: Array<{
    name: string;
    brand: string;
    price: number;
    savingsPercentage: number;
    keyIngredients: string[];
    texture: string;
    finish: string;
    spf?: number;
    skinTypes: string[];
    matchScore: number;
    notes: string;
    purchaseLink?: string;
    imageUrl?: string;
  }>;
  summary: string;
  resources: Array<{
    title: string;
    url: string;
    type: "Video" | "YouTube" | "Instagram" | "TikTok" | "Article";
  }>;
}

/** Logs an informational message with a timestamp */
function logInfo(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/** Logs an error message with a timestamp */
function logError(message: string, error?: unknown): void {
  console.error(`[${new Date().toISOString()}] ${message}`, error instanceof Error ? error.message : error);
}

/** Helper function to safely stringify objects for logging */
function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "[Unable to stringify object]";
  }
}

/** Fetches a product image using Google Custom Search API */
async function fetchProductImage(productName: string, brand: string): Promise<string | null> {
  const query = `product image for ${productName} by ${brand}`;
  logInfo(`Fetching image for product: ${productName} by ${brand}, ${query}`);
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&searchType=image&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google API error: ${response.status}`);
    const data = await response.json();
    const imageUrl = data.items?.[0]?.link || null;
    logInfo(`Image URL found: ${imageUrl ? "Yes" : "No"}`);
    return imageUrl;
  } catch (error) {
    logError(`Failed to fetch image for ${productName} by ${brand}:`, error);
    return null;
  }
}

/** Uploads an image to Supabase storage and returns the public URL */
async function uploadImageToSupabase(imageUrl: string, fileName: string): Promise<string | undefined> {
  logInfo(`Uploading image to Supabase: ${fileName}`);
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
    const imageBlob = await response.blob();

    const { error } = await supabase.storage
      .from("productimages")
      .upload(`${fileName}.jpg`, imageBlob, { contentType: "image/jpeg" });

    if (error) throw error;

    const { data, error: urlError } = supabase.storage
      .from("productimages")
      .getPublicUrl(`${fileName}.jpg`);

    if (urlError) throw urlError;
    logInfo(`Image uploaded successfully: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    logError(`Failed to upload image ${fileName}:`, error);
    return undefined;
  }
}

/** Fetches dupe data from Perplexity API */
async function getPerplexityResponse(searchText: string): Promise<DupeResponse> {
  logInfo(`Sending request to Perplexity API for: ${searchText}`);
  const prompt = `I'm building a makeup dupe-finding tool for Dupe.academy. Please write a detailed analysis report for the product '${searchText}'. Your report should cover:

  Original Product Description:
  Provide the product name, brand, price, and key attributes (e.g., 'SPF 40, rich, creamy texture, dewy finish, hydrating formula suitable for dry/combination skin').
  Include a high-quality image URL from the brand's official website or a major retailer.

  Dupe Recommendations:
  For each recommended dupe, include:
  - Product Name & Brand: e.g., 'Revolution Miracle Cream' by 'Revolution Beauty'
  - Image URL: A high-quality product image URL from the brand's website or a major retailer.
  - Price: e.g., '$14'
  - Savings Percentage: Calculate and include the percentage savings compared to the original product's price (e.g., '86% savings').
  - Key Ingredients/Formulation Highlights: List the main ingredients or formulation benefits (e.g., 'Hyaluronic Acid, Peptides, Shea Butter').
  - Texture and Finish: Describe the texture (e.g., 'thick and rich') and finish (e.g., 'semi-matte' or 'dewy').
  - SPF (if applicable): e.g., 'SPF 30 or 50'
  - Skin Type Compatibility: Which skin type(s) it is best suited for.
  - Match Score or Similarity Grade: A similarity indicator compared to the original product (e.g., '90% match' or 'Grade A').
  - Additional Notes: Any extra observations (e.g., 'lower SPF but comparable hydration').

  Comparison Summary:
  Provide a concise summary that compares the original product and its dupes, highlighting which dupe stands out based on performance, savings, and suitability.

  Resource Library:
  Create a library of supplementary resources related to '${searchText}', including various content types such as Videos (e.g., YouTube, TikTok), Instagram posts, and Articles/blog posts.
  For each resource, include:
  - Title/Description: Brief description of the resource.
  - URL: The link to the resource.
  - Type: Specify the type (e.g., 'Video', 'YouTube', 'Instagram', 'TikTok', 'Article').

  Please format your response in JSON format following this structure:\n${SCHEMA_DEFINITION}`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-reasoning-pro",
      messages: [
        {
          role: "system",
          content: `You are a makeup expert specializing in finding dupes for high-end products. Return ONLY a valid JSON object with this structure:\n${SCHEMA_DEFINITION}`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 20000,
      temperature: 0.2,
      top_p: 0.9,
      search_recency_filter: "month",
      stream: false,
    }),
  });

  if (!response.ok) throw new Error(`Perplexity API error: ${await response.text()}`);
  const data = await response.json();
  const jsonContent = data.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
  logInfo(`Perplexity response received: ${safeStringify(data)}`);

  try {
    const parsedData = JSON.parse(jsonContent) as DupeResponse;
    logInfo(`Perplexity JSON parsed successfully: ${safeStringify(parsedData)}`);
    return parsedData;
  } catch (error) {
    logError("Perplexity response is not valid JSON. Attempting repair with OpenAI.");
    return await repairJsonWithOpenAI(jsonContent);
  }
}

/** Repairs invalid JSON using OpenAI */
async function repairJsonWithOpenAI(perplexityContent: string): Promise<DupeResponse> {
  logInfo("Sending request to OpenAI for JSON repair");
  const openaiPrompt = `Convert this text data to valid JSON that follows the schema:\nSchema Definition:\n${SCHEMA_DEFINITION}\nInput Text:\n${perplexityContent}\nReturn only the structured JSON.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "o3-mini",
      messages: [
        { role: "system", content: "You are a JSON validation and repair service." },
        { role: "user", content: openaiPrompt },
      ],
      max_completion_tokens: 4000,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
  const data = await response.json();
  const repairedJson = data.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
  logInfo(`OpenAI repaired JSON: ${repairedJson}`);
  return JSON.parse(repairedJson) as DupeResponse;
}

/** Main Server Handler */
serve(async (req: Request): Promise<Response> => {
  // **Handle CORS Preflight Requests**
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // **Validate Request Payload**
    const { searchText } = await req.json();
    if (!searchText) throw new Error("No search query provided");
    logInfo(`Searching for dupes for: ${searchText}`);

    // **Fetch Dupe Data from Perplexity**
    const data = await getPerplexityResponse(searchText);
    const { original, dupes, summary, resources } = data;

    // **Generate Unique Slug with Brand for Better Uniqueness**
    const slug = slugify(`${original.brand}-${original.name}`, { lower: true });

    // **Fetch and Upload Original Product Image**
    const originalImageUrl = await fetchProductImage(original.name, original.brand);
    original.imageUrl = originalImageUrl
      ? await uploadImageToSupabase(originalImageUrl, `${slug}-original`)
      : undefined;

    // **Fetch and Upload Dupe Images**
    for (let i = 0; i < dupes.length; i++) {
      const dupeImageUrl = await fetchProductImage(dupes[i].name, dupes[i].brand);
      dupes[i].imageUrl = dupeImageUrl
        ? await uploadImageToSupabase(dupeImageUrl, `${slug}-dupe-${i + 1}`)
        : undefined;
    }

    // **Check if Product Already Exists**
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("id")
      .eq("name", original.name)
      .eq("brand", original.brand)
      .single();

    if (checkError && checkError.code !== "PGRST116") throw checkError; // PGRST116 means no rows found

    if (existingProduct) {
      logInfo(`Product ${original.name} by ${original.brand} already exists with ID: ${existingProduct.id}`);
      return new Response(
        JSON.stringify({ success: true, data: { id: existingProduct.id, slug } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // **Insert Original Product into Database**
    logInfo(`Inserting product into database: ${original.name}`);
    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        name: original.name,
        brand: original.brand,
        price: original.price,
        attributes: original.attributes,
        image_url: original.imageUrl,
        summary,
        slug,
      })
      .select()
      .single();

    if (productError) throw productError;
    logInfo(`Product inserted successfully with ID: ${productData.id}`);

    // **Insert Dupes into Database**
    logInfo(`Inserting dupes into database for product ID: ${productData.id}`);
    const { error: dupesError } = await supabase.from("dupes").insert(
      dupes.map((dupe) => ({
        product_id: productData.id,
        name: dupe.name,
        brand: dupe.brand,
        price: dupe.price,
        savings_percentage: dupe.savingsPercentage,
        key_ingredients: dupe.keyIngredients,
        texture: dupe.texture,
        finish: dupe.finish,
        spf: dupe.spf || null, // Handle optional field
        skin_types: dupe.skinTypes,
        match_score: dupe.matchScore,
        notes: dupe.notes,
        purchase_link: dupe.purchaseLink || null, // Handle optional field
        image_url: dupe.imageUrl,
      }))
    );

    if (dupesError) throw dupesError;
    logInfo(`Dupes inserted successfully for product ID: ${productData.id}`);

    // **Insert Resources into Database**
    logInfo(`Inserting resources into database for product ID: ${productData.id}`);
    const { error: resourcesError } = await supabase.from("resources").insert(
      resources.map((resource) => ({
        product_id: productData.id,
        title: resource.title,
        url: resource.url,
        type: resource.type,
      }))
    );

    if (resourcesError) throw resourcesError;
    logInfo(`Resources inserted successfully for product ID: ${productData.id}`);

    // **Return Success Response**
    return new Response(
      JSON.stringify({ success: true, data: { id: productData.id, slug } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("Error in search-dupes function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});