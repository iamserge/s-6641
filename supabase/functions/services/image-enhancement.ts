/// <reference lib="es2015" />

import { GETIMG_API_KEY, GETIMG_BASE_URL, HF_API_KEY, HF_API_ENDPOINT } from "../shared/constants.ts";
import { logInfo, logError, withRetry, blobToBase64, base64ToBlob } from "../shared/utils.ts";

interface GetImgResponse {
  model: string;
  images: {
    content_type: string;
    b64: string;
    url?: string;
  }[];
}

/**
 * Upscales an image using getimg.ai API
 * @param imageUrl URL of the image to upscale
 * @param scale Scale factor (default: 4)
 * @returns Base64 encoded upscaled image or null on failure
 */
export async function upscaleImage(imageUrl: string, scale: number = 4): Promise<string | null> {
  try {
    logInfo(`Upscaling image from URL: ${imageUrl}`);
    
    if (!GETIMG_API_KEY) {
      logInfo("GetImg API key not configured, skipping upscaling");
      return null;
    }
    
    // First, fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    // Convert image to base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Call getimg.ai API with retry logic
    const result = await withRetry(async () => {
      const response = await fetch(`${GETIMG_BASE_URL}/upscale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GETIMG_API_KEY}`
        },
        body: JSON.stringify({
          model: "real-esrgan-4x",
          image: base64Image,
          scale: scale,
          output_format: "jpeg",
          response_format: "b64"
        })
      });
      
      if (!response.ok) {
        let errorDetails = `${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorDetails += ` - ${JSON.stringify(errorData)}`;
        } catch (e) {
          // If we can't parse the error as JSON, try to get the raw text
          try {
            const errorText = await response.text();
            errorDetails += ` - ${errorText}`;
          } catch (textError) {
            // Ignore errors when trying to read the error body
          }
        }
        throw new Error(`GetImg.ai API error: ${errorDetails}`);
      }
      
      return await response.json() as GetImgResponse;
    }, 3, 1000);
    
    if (result && result.images && result.images.length > 0) {
      logInfo(`Successfully upscaled image`);
      return result.images[0].b64;
    }
    
    return null;
  } catch (error) {
    logError(`Error upscaling image:`, error);
    return null;
  }
}

/**
 * Removes background from an image using Hugging Face Inference API
 * @param base64Image Base64 encoded image to process
 * @returns Base64 encoded image with background removed or original if failed
 */
export async function removeBackground(base64Image: string): Promise<string | null> {
  try {
    logInfo(`Removing background from image using Hugging Face API`);
    
    if (!HF_API_KEY) {
      logError("Hugging Face API key is not configured");
      return base64Image; // Return original if API key not configured
    }
    
    // Convert base64 to blob for API call
    const imageBlob = base64ToBlob(base64Image);
    
    // Convert blob to array buffer
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Call Hugging Face API with retry logic
    const result = await withRetry(async () => {
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
      // Convert processed blob back to base64
      return await blobToBase64(processedImageBlob);
    }, 3, 1000);
    
    if (result) {
      logInfo(`Successfully removed background using Hugging Face`);
      return result;
    }
    
    return base64Image; // Return original on failure
  } catch (error) {
    logError(`Error removing background with Hugging Face:`, error);
    return base64Image; // Return original on error
  }
}

/**
 * Process an image by upscaling and removing background
 * @param imageUrl URL of the image to process
 * @returns Base64 encoded processed image or null on failure
 */
export async function processProductImage(imageUrl: string): Promise<string | null> {
  try {
    let processedImage: string | null = null;
    
    // Step 1: Upscale image if GetImg API key is available
    // if (GETIMG_API_KEY) {
    //   processedImage = await upscaleImage(imageUrl);
    // }
    
    // If upscaling failed or was skipped, fetch the original image
    //if (!processedImage) {
      logInfo(`Using original image without upscaling: ${imageUrl}`);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const imageBlob = await imageResponse.blob();
      processedImage = await blobToBase64(imageBlob);
    //}
    
    // // Step 2: Remove background if Hugging Face API key is available
    // if (HF_API_KEY && processedImage) {
    //   const noBackgroundImage = await removeBackground(processedImage);
    //   if (noBackgroundImage) {
    //     return noBackgroundImage;
    //   }
    // }
    
    // Return whatever processed image we have at this point
    return processedImage;
  } catch (error) {
    logError(`Error processing product image:`, error);
    return null;
  }
}