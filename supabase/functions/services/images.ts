/// <reference lib="es2015" />

import { logInfo, logError, base64ToBlob } from "../shared/utils.ts";
import { uploadImage, getPublicUrl } from "../shared/db-client.ts";
import { processProductImage } from "./image-enhancement.ts";
import { getProductImageUrl } from "./product-search.ts";

/**
 * Uploads a processed image (base64) to Supabase storage and returns the public URL
 */
export async function uploadProcessedImageToSupabase(base64Image: string, fileName: string): Promise<string | undefined> {
  logInfo(`Uploading processed image to Supabase: ${fileName}`);
  try {
    // Convert base64 to blob
    const imageBlob = base64ToBlob(base64Image, "image/png");
    
    // Upload to Supabase
    const { error } = await uploadImage(
      "productimages", 
      `${fileName}.png`, 
      imageBlob, 
      "image/png"
    );

    if (error) throw error;

    // Get public URL
    const { data, error: urlError } = getPublicUrl("productimages", `${fileName}.png`);
    if (urlError) throw urlError;
    
    logInfo(`Image uploaded successfully: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    logError(`Failed to upload image ${fileName}:`, error);
    return undefined;
  }
}

/**
 * Downloads and processes product images for original product and dupes
 * Handles product search, image enhancement, background removal, and storage
 * 
 * @param productName Product name
 * @param brand Brand name
 * @param slug Unique product slug for file naming
 * @param dupes Array of dupe products
 * @returns Object with image URLs
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
  
  logInfo(`Starting image processing for ${productName} by ${brand}`);
  const startTime = Date.now();
  
  try {
    // Step 1: Find the original product image
    const originalImageUrl = await getProductImageUrl(productName, brand);
    
    if (originalImageUrl) {
      try {
        // Step 2: Process the image (upscale and remove background)
        const processedImageBase64 = await processProductImage(originalImageUrl);
        
        if (processedImageBase64) {
          // Step 3: Upload processed image to Supabase
          result.originalImageUrl = await uploadProcessedImageToSupabase(
            processedImageBase64, 
            `${slug}-original`
          );
          
          logInfo(`Original product image processed and uploaded successfully: ${result.originalImageUrl}`);
        } else {
          // If processing fails, use the original URL
          logInfo(`Image processing failed for ${productName}, using original URL`);
          result.originalImageUrl = originalImageUrl;
        }
      } catch (processError) {
        logError(`Error processing original image:`, processError);
        // Use original unprocessed image on error
        result.originalImageUrl = originalImageUrl;
      }
    } else {
      logInfo(`No image found for original product ${productName}`);
    }
  } catch (error) {
    logError(`Error getting original product image:`, error);
  }
  
  // Process dupe images in sequence to avoid rate limits
  for (let i = 0; i < dupes.length; i++) {
    try {
      const dupe = dupes[i];
      logInfo(`Processing image for dupe #${i + 1}: ${dupe.name} by ${dupe.brand}`);
      
      // Step 1: Find the dupe product image
      const dupeImageUrl = await getProductImageUrl(dupe.name, dupe.brand);
      
      if (dupeImageUrl) {
        try {
          // Step 2: Process dupe image
          const processedImageBase64 = await processProductImage(dupeImageUrl);
          
          if (processedImageBase64) {
            // Step 3: Upload processed image to Supabase
            result.dupeImageUrls[i] = await uploadProcessedImageToSupabase(
              processedImageBase64, 
              `${slug}-dupe-${i + 1}`
            );
            
            logInfo(`Dupe image for ${dupe.name} processed and uploaded successfully`);
          } else {
            // If processing fails, use the original URL
            result.dupeImageUrls[i] = dupeImageUrl;
            logInfo(`Image processing failed for dupe ${dupe.name}, using original URL: ${dupeImageUrl}`);
          }
        } catch (processError) {
          logError(`Error processing dupe image for ${dupe.name}:`, processError);
          // Use original unprocessed image on error
          result.dupeImageUrls[i] = dupeImageUrl;
        }
      } else {
        logInfo(`No image found for dupe ${dupe.name}`);
        result.dupeImageUrls[i] = undefined;
      }
    } catch (error) {
      logError(`Error getting dupe image for index ${i}:`, error);
      result.dupeImageUrls[i] = undefined;
    }
    
    // Add a small delay between processing dupe images to avoid rate limits
    if (i < dupes.length - 1) {
      logInfo(`Adding delay before processing next dupe image`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const endTime = Date.now();
  logInfo(`Image processing completed in ${endTime - startTime}ms`);
  
  return result;
}