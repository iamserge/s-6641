import { logInfo, logError, blobToBase64, base64ToBlob } from "../shared/utils";
import { uploadImage, getPublicUrl } from "../shared/db-client";
import { 
  GOOGLE_API_KEY, 
  GOOGLE_CSE_ID, 
  HF_API_KEY, 
  HF_API_ENDPOINT, 
  BACKGROUND_REMOVAL_API 
} from "../shared/constants";

/**
 * Fetches a product image using Google Custom Search API
 */
export async function fetchProductImage(productName: string, brand: string): Promise<string | null> {
  const query = `"${productName}" "${brand}" product image -model -face -person -woman -man`;
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

/**
 * Remove background from image using Hugging Face Inference API
 */
export async function removeImageBackground(imageBlob: Blob): Promise<Blob> {
  logInfo("Processing image to remove background");
  
  // Only try with Hugging Face if API key is available
  if (HF_API_KEY) {
    try {
      logInfo("Using Hugging Face for background removal");
      
      // Convert blob to array buffer
      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // Since the HfInference client doesn't support trust_remote_code parameter directly,
      // we'll use a direct API call to the Inference API
      const response = await fetch(HF_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: buffer,
      });
      
      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status} - ${await response.text()}`);
      }
      
      const processedImageBlob = await response.blob();
      logInfo("Background removed successfully with Hugging Face");
      return processedImageBlob;
    } catch (error) {
      logError("Failed to remove background with Hugging Face:", error);
      // Fall through to try alternative method
    }
  }
  
  // Fallback to free API service
  try {
    logInfo("Using free API service for background removal");
    
    // Convert blob to base64
    const base64Image = await blobToBase64(imageBlob);
    
    // Using a free API service
    const response = await fetch(BACKGROUND_REMOVAL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_base64: base64Image,
        output_type: "cutout", // transparent background
        crop: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Background removal API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.image_base64) {
      throw new Error("API returned success: false or no image data");
    }
    
    // Convert base64 back to blob
    const processedImageBlob = base64ToBlob(result.image_base64);
    logInfo("Background removed successfully with free API");
    return processedImageBlob;
  } catch (error) {
    logError("Failed to remove background with free API:", error);
    
    // Return original image if all background removal attempts fail
    logInfo("Returning original image without background removal");
    return imageBlob;
  }
}

/**
 * Uploads an image to Supabase storage and returns the public URL
 */
export async function uploadImageToSupabase(imageUrl: string, fileName: string): Promise<string | undefined> {
  logInfo(`Downloading and processing image for: ${fileName}`);
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
    const imageBlob = await response.blob();
    
    // Remove background from image
    const processedImageBlob = await removeImageBackground(imageBlob);
    
    // Determine content type based on whether background was successfully removed
    // If background was removed, we'll have a PNG with transparency
    const contentType = processedImageBlob !== imageBlob ? "image/png" : "image/jpeg";
    const fileExtension = contentType === "image/png" ? "png" : "jpg";
    
    logInfo(`Uploading processed image to Supabase: ${fileName}.${fileExtension}`);
    const { error } = await uploadImage(
      "productimages", 
      `${fileName}.${fileExtension}`, 
      processedImageBlob, 
      contentType
    );

    if (error) throw error;

    const { data, error: urlError } = getPublicUrl("productimages", `${fileName}.${fileExtension}`);
    if (urlError) throw urlError;
    
    logInfo(`Image uploaded successfully: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    logError(`Failed to upload image ${fileName}:`, error);
    return undefined;
  }
}

/**
 * Downloads and processes multiple product images in parallel
 */
export async function processProductImages(
  productName: string, 
  brand: string, 
  slug: string, 
  dupes: any[]
): Promise<{
  originalImageUrl?: string;
  dupeImageUrls: Record<number, string | undefined>;
}> {
  // Fetch original product image
  const originalImageUrl = await fetchProductImage(productName, brand);
  let processedOriginalUrl: string | undefined;
  
  if (originalImageUrl) {
    processedOriginalUrl = await uploadImageToSupabase(originalImageUrl, `${slug}-original`);
  }
  
  // Process dupe images in parallel
  const dupeImagePromises = dupes.map(async (_, index) => {
    const dupe = dupes[index];
    const dupeImageUrl = await fetchProductImage(dupe.name, dupe.brand);
    
    if (dupeImageUrl) {
      return {
        index,
        url: await uploadImageToSupabase(dupeImageUrl, `${slug}-dupe-${index + 1}`)
      };
    }
    
    return { index, url: undefined };
  });
  
  // Wait for all image processing to complete
  const dupeResults = await Promise.all(dupeImagePromises);
  
  // Convert results to a record object
  const dupeImageUrls: Record<number, string | undefined> = {};
  for (const result of dupeResults) {
    dupeImageUrls[result.index] = result.url;
  }
  
  return {
    originalImageUrl: processedOriginalUrl,
    dupeImageUrls
  };
}