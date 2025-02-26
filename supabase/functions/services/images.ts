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
    const { data, error: urlError } = getPublicUrl("productimages", `${fileName}.png`);
    if (urlError) throw urlError;
    
    logInfo(`Image uploaded successfully: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    logError(`Failed to upload image ${fileName}:`, error);
    return undefined;
  }
}

