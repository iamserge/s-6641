/// <reference lib="es2015" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import necessary dependencies
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";

// Environment variables (ensure these are set in your environment)
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
const GOOGLE_CSE_ID = Deno.env.get("GOOGLE_CSE_ID");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Logging functions (for debugging and monitoring)
function logInfo(message: string) {
  console.log(`[INFO] ${message}`);
}

function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error);
}

// Validate critical environment variables
if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not set in environment variables.");
}
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
}

// Log environment variable values for debugging
logInfo(`supabaseUrl: ${supabaseUrl}`);
logInfo(`supabaseServiceKey: ${supabaseServiceKey ? 'set' : 'not set'}`);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to fetch product image (stubbed out; implement as needed)
async function fetchProductImage(
  name: string,
  brand: string
): Promise<string | undefined> {
  logInfo(`Fetching image for ${name} by ${brand}`);
  return "https://example.com/placeholder.jpg";
}

// Function to get response from Perplexity (simplified for this example)
async function getPerplexityResponse(searchText: string): Promise<{
  original: any;
  dupes: any[];
  summary: string;
  resources: any[];
}> {
  logInfo(`Fetching Perplexity response for: ${searchText}`);
  const response = await fetch("https://api.perplexity.ai/query", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: `Find dupes for ${searchText}` }),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const repaired = await repairJsonWithOpenAI(text);
    data = JSON.parse(repaired);
  }
  return {
    original: data.original || { name: searchText, brand: "Unknown" },
    dupes: data.dupes || [],
    summary: data.summary || "",
    resources: data.resources || [],
  };
}

// Function to repair invalid JSON with OpenAI
async function repairJsonWithOpenAI(invalidJson: string): Promise<string> {
  logInfo("Repairing invalid JSON with OpenAI");
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: `Fix this invalid JSON:\n${invalidJson}\n\nReturn valid JSON.`,
      max_tokens: 1000,
    }),
  });
  const result = await response.json();
  return result.choices[0].text.trim();
}

// Function to upload image to Supabase with existence check
async function uploadImageToSupabase(
  imageUrl: string,
  fileName: string
): Promise<string | undefined> {
  const filePath = `${fileName}.jpg`;

  const { data: files, error: listError } = await supabase.storage
    .from("productimages")
    .list();

  if (listError) {
    logError(`Failed to list files:`, listError);
    return undefined;
  }

  const fileExists = files.some((file) => file.name === filePath);
  if (fileExists) {
    logInfo(`File ${filePath} already exists, retrieving public URL`);
    const publicUrl = supabase.storage.from("productimages").getPublicUrl(filePath);
    return publicUrl.data.publicUrl; // Updated to access the nested publicUrl property
  }

  logInfo(`Uploading image to Supabase: ${filePath}`);
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const imageBlob = await response.blob();
    const { error: uploadError } = await supabase.storage
      .from("productimages")
      .upload(filePath, imageBlob, { contentType: "image/jpeg" });
    if (uploadError) throw uploadError;

    const publicUrl = supabase.storage.from("productimages").getPublicUrl(filePath);
    logInfo(`Image uploaded successfully: ${publicUrl.data.publicUrl}`);
    return publicUrl.data.publicUrl; // Updated to access the nested publicUrl property
  } catch (error) {
    logError(`Failed to upload image ${filePath}:`, error);
    return undefined;
  }
}

// Main handler
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (
      !PERPLEXITY_API_KEY ||
      !OPENAI_API_KEY ||
      !GOOGLE_API_KEY ||
      !GOOGLE_CSE_ID
    ) {
      throw new Error("Missing API keys. Ensure all required keys are set.");
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase URL or service key missing.");
    }

    const { searchText } = await req.json();
    if (!searchText) throw new Error("No search query provided");

    logInfo(`Searching for dupes for: ${searchText}`);

    const data = await getPerplexityResponse(searchText);
    const { original, dupes, summary, resources } = data;

    const { data: existingProduct, error: existingError } = await supabase
      .from("products")
      .select("id, slug")
      .eq("name", original.name)
      .eq("brand", original.brand)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      throw existingError;
    }

    if (existingProduct) {
      logInfo(`Product already exists: ${existingProduct.slug}`);
      return new Response(
        JSON.stringify({
          success: true,
          data: { id: existingProduct.id, slug: existingProduct.slug },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const slug = slugify(`${original.name}-by-${original.brand}`, {
      lower: true,
    });

    const originalImageUrl = await fetchProductImage(
      original.name,
      original.brand
    );
    original.imageUrl = originalImageUrl
      ? await uploadImageToSupabase(originalImageUrl, `${slug}-original`)
      : undefined;

    for (let i = 0; i < dupes.length; i++) {
      const dupeImageUrl = await fetchProductImage(dupes[i].name, dupes[i].brand);
      dupes[i].imageUrl = dupeImageUrl
        ? await uploadImageToSupabase(dupeImageUrl, `${slug}-dupe-${i + 1}`)
        : undefined;
    }

    logInfo(`Inserting product into database: ${original.name} by ${original.brand}`);
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
        spf: dupe.spf,
        skin_types: dupe.skinTypes,
        match_score: dupe.matchScore,
        notes: dupe.notes,
        purchase_link: dupe.purchaseLink,
        image_url: dupe.imageUrl,
      }))
    );
    if (dupesError) throw dupesError;
    logInfo(`Dupes inserted successfully for product ID: ${productData.id}`);

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

    return new Response(
      JSON.stringify({ success: true, data: { id: productData.id, slug } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("Error in search-dupes function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});