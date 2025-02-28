/// <reference lib="es2015" />

import { logInfo, logError, base64ToBlob } from "../shared/utils.ts";
import { uploadImage, getPublicUrl } from "../shared/db-client.ts";

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
    const result = getPublicUrl("productimages", `${fileName}.png`);
    
    // Add proper null/undefined check
    if (!result || !result.data) {
      logError(`getPublicUrl returned invalid data for ${fileName}`);
      return undefined;
    }
    
    logInfo(`Image uploaded successfully: ${result.data.publicUrl}`);
    return result.data.publicUrl;
  } catch (error) {
    logError(`Failed to upload image ${fileName}:`, error);
    return undefined;
  }
}

// Helper function to process and upload an image
async function processAndUploadImage(imageUrl: string | undefined, fileName: string): Promise<string | undefined> {
  if (!imageUrl) return undefined;
  try {
    const processedImageBase64 = await processProductImage(imageUrl);
    if (processedImageBase64) {
      return await uploadProcessedImageToSupabase(processedImageBase64, fileName);
    }
    return imageUrl; // Return original URL if processing fails
  } catch (error) {
    logError(`Error processing image for ${fileName}:`, error);
    return imageUrl; // Return original URL on error
  }
}
