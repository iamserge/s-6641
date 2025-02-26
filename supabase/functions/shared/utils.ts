/// <reference lib="es2015" />

/**
 * Logs an informational message with a timestamp 
 */
export function logInfo(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Logs an error message with a timestamp
 */
export function logError(message: string, error?: unknown): void {
  console.error(
    `[${new Date().toISOString()}] ${message}`, 
    error instanceof Error ? error.message : error
  );
}

/**
 * Helper function to safely stringify objects for logging
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "[Unable to stringify object]";
  }
}

/**
 * Helper function to safely parse JSON with error handling
 */
export function safeJsonParse(text: string, defaultValue: any = null): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    logError("Failed to parse JSON:", error);
    return defaultValue;
  }
}

/**
 * Cleans a markdown code block from text
 */
export function cleanMarkdownCodeBlock(text: string): string {
  return text.replace(/^```(?:json)?\n?|\n?```$/g, '');
}

/**
 * Converts a Blob to a base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Converts a base64 string to a Blob
 */
export function base64ToBlob(base64: string, contentType: string = 'image/png'): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes.buffer], { type: contentType });
}

/**
 * Retries a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  initialDelay: number = 500
): Promise<T> {
  let retries = 0;
  let lastError: unknown;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      retries++;
      
      if (retries >= maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, retries - 1);
      logInfo(`Retry ${retries}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}