/// <reference lib="es2015" />

import { GETIMG_API_KEY, GETIMG_BASE_URL } from "../shared/constants.ts";
import { logInfo, logError, withRetry, blobToBase64, base64ToBlob } from "../shared/utils.ts";
import * as tf from "https://deno.land/x/tfjs@3.21.0/mod.ts"; // TensorFlow.js for Deno
import { BodyPix, load as loadBodyPix } from "https://deno.land/x/bodypix@2.0.7/mod.ts"; // BodyPix model

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
    
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
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
          try {
            const errorText = await response.text();
            errorDetails += ` - ${errorText}`;
          } catch (textError) {}
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
 * Removes background from an image using BodyPix (TensorFlow.js)
 * @param base64Image Base64 encoded image to process
 * @returns Base64 encoded image with background removed or original if failed
 */
export async function removeBackground(base64Image: string): Promise<string | null> {
  try {
    logInfo(`Removing background locally using BodyPix`);

    // Convert base64 to an Image object
    const imgBlob = base64ToBlob(base64Image);
    const imgUrl = URL.createObjectURL(imgBlob);
    const img = new Image();
    img.src = imgUrl;
    await new Promise((resolve) => img.onload = resolve);

    // Load BodyPix model
    const net = await loadBodyPix({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    });

    // Segment the image (assuming product images have a distinct foreground)
    const segmentation = await net.segmentPerson(img, {
      segmentationThreshold: 0.7 // Adjust for stricter foreground detection
    });

    // Create a canvas to mask the background
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply segmentation mask (set background to transparent)
    for (let i = 0; i < segmentation.data.length; i++) {
      if (segmentation.data[i] === 0) { // Background
        data[i * 4 + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to base64
    const result = canvas.toDataURL('image/png').split(',')[1];
    URL.revokeObjectURL(imgUrl); // Clean up

    logInfo(`Successfully removed background locally`);
    return result;
  } catch (error) {
    logError(`Error removing background locally:`, error);
    return base64Image; // Return original on failure
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
    if (GETIMG_API_KEY) {
      processedImage = await upscaleImage(imageUrl);
    }
    
    // If upscaling failed or was skipped, fetch the original image
    if (!processedImage) {
      logInfo(`Using original image without upscaling: ${imageUrl}`);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const imageBlob = await imageResponse.blob();
      processedImage = await blobToBase64(imageBlob);
    }
    
    // Step 2: Remove background locally
    if (processedImage) {
      const noBackgroundImage = await removeBackground(processedImage);
      if (noBackgroundImage) {
        return noBackgroundImage;
      }
    }
    
    // Return whatever processed image we have
    return processedImage;
  } catch (error) {
    logError(`Error processing product image:`, error);
    return null;
  }
}