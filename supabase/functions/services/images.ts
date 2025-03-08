/// <reference lib="es2015" />

import { GETIMG_API_KEY, GETIMG_BASE_URL, HF_API_KEY, HF_API_ENDPOINT } from "../shared/constants.ts";
import { logInfo, logError, withRetry, blobToBase64, base64ToBlob } from "../shared/utils.ts";
import { uploadImage, getPublicUrl } from "../shared/db-client.ts";

interface GetImgResponse {
  model: string;
  images: {
    content_type: string;
    b64: string;
    url?: string;
  }[];
}

/**
 * Validates the input URL to ensure it's processable
 * @param imageUrl URL to validate
 * @returns Boolean indicating if valid
 */
function isValidImageUrl(imageUrl: string): boolean {
  if (!imageUrl) return false;
  
  try {
    // Basic URL validation
    new URL(imageUrl);
    
    // Check for common image extensions or formats
    const lowerUrl = imageUrl.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const isImageExtension = validExtensions.some(ext => lowerUrl.includes(ext));
    
    // Check for image CDNs or known image services
    const knownImageDomains = [
      'cloudinary.com',
      'imgur.com',
      'i.imgur.com',
      'images.unsplash.com',
      'img.sephora.com',
      'ulta.com/images',
      'images-na.ssl-images-amazon.com',
      'cdn.shopify.com',
      'm.media-amazon.com',
      'media.ulta.com'
    ];
    const isImageDomain = knownImageDomains.some(domain => lowerUrl.includes(domain));
    
    return isImageExtension || isImageDomain;
  } catch (e) {
    return false;
  }
}

/**
 * Safely fetch an image from a URL with proper error handling
 * @param imageUrl URL of the image to fetch
 * @returns Array buffer of the image or null if failed
 */
async function safelyFetchImage(imageUrl: string): Promise<ArrayBuffer | null> {
  try {
    // Validate URL format first
    if (!isValidImageUrl(imageUrl)) {
      logError(`Invalid image URL format: ${imageUrl}`);
      return null;
    }

    // Add timeout to prevent hanging on problematic URLs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    // Fetch with retry
    const response = await withRetry(async () => {
      const fetchResponse = await fetch(imageUrl, { 
        signal: controller.signal,
        headers: {
          // Common headers for image requests
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error fetching image: ${response.status} ${response.statusText}`);
      }
      
      // Check if content type is image
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }
      
      return response;
    }, 3, 1000);

    // Get array buffer from response
    return await response.arrayBuffer();
  } catch (error) {
    if (error.name === 'AbortError') {
      logError(`Timeout fetching image: ${imageUrl}`);
    } else {
      logError(`Error fetching image from ${imageUrl}:`, error);
    }
    return null;
  }
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
    
    // First, fetch the image from the URL with improved error handling
    const imageBuffer = await safelyFetchImage(imageUrl);
    
    if (!imageBuffer) {
      logError(`Failed to fetch image for upscaling: ${imageUrl}`);
      return null;
    }
    
    // Convert image to base64
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
 * Uploads a processed image (base64) to Supabase storage and returns the public URL
 * - Added improved error handling and retry logic
 */
export async function uploadProcessedImageToSupabase(base64Image: string, fileName: string): Promise<string | undefined> {
  logInfo(`Uploading processed image to Supabase: ${fileName}`);
  
  if (!base64Image) {
    logError("Cannot upload empty base64 image");
    return undefined;
  }
  
  try {
    // Validate base64 format
    if (!base64Image.match(/^[A-Za-z0-9+/=]+$/)) {
      logError(`Invalid base64 format for image: ${fileName}`);
      return undefined;
    }
    
    // Convert base64 to blob
    const imageBlob = base64ToBlob(base64Image, "image/png");
    
    // Check if blob is valid
    if (!imageBlob || imageBlob.size === 0) {
      logError(`Invalid blob created from base64 for ${fileName}`);
      return undefined;
    }
    
    // Upload to Supabase with retry
    const { error } = await withRetry(async () => {
      return await uploadImage(
        "productimages", 
        `${fileName}.png`, 
        imageBlob, 
        "image/png"
      );
    }, 3, 1000);

    if (error) {
      throw error;
    }

    // Get public URL - add retry for this too
    const result = await withRetry(async () => {
      return getPublicUrl("productimages", `${fileName}.png`);
    }, 3, 1000);
    
    // Add proper null/undefined check and validate returned structure
    if (!result || !result.data || !result.data.publicUrl) {
      logError(`Invalid or missing publicUrl for uploaded image ${fileName}`);
      throw new Error("Failed to get public URL for uploaded image");
    }
    
    // Validate the returned URL
    try {
      new URL(result.data.publicUrl);
    } catch (urlError) {
      logError(`Invalid URL returned for ${fileName}: ${result.data.publicUrl}`);
      throw new Error("Invalid public URL format");
    }
    
    logInfo(`Image uploaded successfully: ${result.data.publicUrl}`);
    return result.data.publicUrl;
  } catch (error) {
    logError(`Failed to upload image ${fileName}:`, error);
    return undefined;
  }
}

/**
 * Process an image by attempting to fetch and upload it to Supabase storage
 * - Improved error handling, URL validation, and fetch logic
 * @param imageUrl URL of the image to process
 * @returns URL of the processed image in Supabase storage or null on failure
 */
export async function processProductImage(imageUrl: string): Promise<string | null> {
  try {
    if (!imageUrl) {
      logError("Empty image URL provided to processProductImage");
      return null;
    }
    
    logInfo(`Processing product image: ${imageUrl}`);
    
    // Validate the URL
    if (!isValidImageUrl(imageUrl)) {
      logError(`Invalid image URL format: ${imageUrl}`);
      return null;
    }
    
    // Fetch the image with our improved fetch function
    const imageArrayBuffer = await safelyFetchImage(imageUrl);
    
    if (!imageArrayBuffer) {
      logError(`Failed to fetch image from URL: ${imageUrl}`);
      return null;
    }
    
    // Convert to base64
    const base64Image = btoa(
      new Uint8Array(imageArrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return base64Image;
  } catch (error) {
    logError(`Error processing product image:`, error);
    return null;
  }
}

/**
 * Helper function to process and upload an image
 * - Complete rewrite with improved validation and error handling
 */
export async function processAndUploadImage(imageUrl: string | undefined, fileName: string): Promise<string | undefined> {
  // Validate inputs
  if (!imageUrl) {
    logError("Missing image URL for processAndUploadImage");
    return undefined;
  }
  
  if (!fileName) {
    logError("Missing file name for processAndUploadImage");
    return undefined;
  }
  
  try {
    logInfo(`Processing and uploading image: ${imageUrl} as ${fileName}`);
    
    // Ensure safe file name (alphanumeric, dash, underscore only)
    const safeFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Process the image
    const processedImageBase64 = await processProductImage(imageUrl);
    
    if (!processedImageBase64) {
      logError(`Failed to process image from URL: ${imageUrl}`);
      return undefined;
    }
    
    // Upload the processed image
    const uploadedUrl = await uploadProcessedImageToSupabase(processedImageBase64, safeFileName);
    
    if (!uploadedUrl) {
      logError(`Failed to upload processed image for ${safeFileName}`);
      return undefined;
    }
    
    logInfo(`Successfully processed and uploaded image: ${uploadedUrl}`);
    return uploadedUrl;
  } catch (error) {
    logError(`Error in processAndUploadImage for ${fileName}:`, error);
    // Return nothing on error - we don't want to return the original URL if processing fails
    return undefined;
  }
}