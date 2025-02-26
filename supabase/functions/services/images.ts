/// <reference lib="es2015" />

import { logInfo, logError, blobToBase64, base64ToBlob } from "../shared/utils.ts";
import { uploadImage, getPublicUrl } from "../shared/db-client.ts";
import { 
  GOOGLE_API_KEY, 
  GOOGLE_CSE_ID, 
  HF_API_KEY, 
  HF_API_ENDPOINT, 
  BACKGROUND_REMOVAL_API 
} from "../shared/constants.ts";

/**
 * Fetches a product image using Google Custom Search API
 */
/**
 * Fetches a product image using Google Custom Search API with rate limiting and retry logic
 */
export async function fetchProductImage(productName: string, brand: string): Promise<string | null> {
  const query = `"${productName}" "${brand}" product image -model -face -person -woman -man`;
  logInfo(`Fetching image for product: ${productName} by ${brand}, ${query}`);
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&searchType=image&q=${encodeURIComponent(query)}`;

  // Define retry parameters
  const maxRetries = 3;
  const initialDelay = 1000; // 1 second initial delay
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      // If this is a retry, add a delay with exponential backoff
      if (retryCount > 0) {
        const delay = initialDelay * Math.pow(2, retryCount - 1);
        logInfo(`Retry attempt ${retryCount}/${maxRetries} for ${productName} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch(url);
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        retryCount++;
        if (retryCount <= maxRetries) {
          logInfo(`Rate limit hit (429) for ${productName}. Will retry in a moment...`);
          continue; // Skip to next iteration with delay
        } else {
          throw new Error(`Google API rate limit exceeded after ${maxRetries} retries`);
        }
      }
      
      // Handle other errors
      if (!response.ok) {
        // Get detailed error information
        let errorDetails = `${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.text();
          errorDetails += ` - ${errorBody}`;
        } catch (e) {
          // Ignore errors when trying to read the error body
        }
        throw new Error(`Google API error: ${errorDetails}`);
      }
      
      const data = await response.json();
      const imageUrl = data.items?.[0]?.link || null;
      logInfo(`Image URL found for ${productName}: ${imageUrl ? "Yes" : "No"}`);
      return imageUrl;
      
    } catch (error) {
      if (error.message.includes('rate limit') && retryCount < maxRetries) {
        retryCount++;
        continue;
      }
      
      logError(`Failed to fetch image for ${productName} by ${brand} (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // If we've exhausted all retries or hit a non-retriable error, give up
      if (retryCount >= maxRetries) {
        logInfo(`All retry attempts exhausted for ${productName}. Proceeding without image.`);
        return null;
      }
      
      retryCount++;
    }
  }
  
  return null; // Fallback return if we somehow exit the loop without returning
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
  // Initialize the result object
  const result = {
    originalImageUrl: undefined,
    dupeImageUrls: {} as Record<number, string | undefined>
  };
  
  try {
    // Fetch original product image
    const originalImageUrl = await fetchProductImage(productName, brand);
    
    if (originalImageUrl) {
      try {
        result.originalImageUrl = await uploadImageToSupabase(originalImageUrl, `${slug}-original`);
      } catch (uploadError) {
        logError(`Error processing original image for ${productName}:`, uploadError);
        // Continue with the flow even if image processing fails
      }
    }
  } catch (error) {
    logError(`Error fetching original image for ${productName}:`, error);
    // Continue with dupes processing even if original image fails
  }
  
  // Process dupe images with better error handling
  const dupePromises = dupes.map(async (dupe, index) => {
    try {
      const dupeImageUrl = await fetchProductImage(dupe.name, dupe.brand);
      
      if (dupeImageUrl) {
        try {
          const processedUrl = await uploadImageToSupabase(dupeImageUrl, `${slug}-dupe-${index + 1}`);
          return { index, url: processedUrl };
        } catch (uploadError) {
          logError(`Error processing dupe image for ${dupe.name}:`, uploadError);
          return { index, url: undefined };
        }
      }
      
      return { index, url: undefined };
    } catch (error) {
      logError(`Error fetching dupe image for ${dupe.name}:`, error);
      return { index, url: undefined };
    }
  });
  
  // Wait for all promises to settle (not just resolve)
  const dupeResults = await Promise.allSettled(dupePromises);
  
  // Process results, including both fulfilled and rejected promises
  dupeResults.forEach((dupeResult, index) => {
    if (dupeResult.status === 'fulfilled') {
      const { index: dupeIndex, url } = dupeResult.value;
      result.dupeImageUrls[dupeIndex] = url;
    } else {
      // For rejected promises, log the error and set the URL to undefined
      logError(`Promise rejected for dupe image at index ${index}:`, dupeResult.reason);
      result.dupeImageUrls[index] = undefined;
    }
  });
  
  return result;
}