/**
 * Utility functions used throughout the application
 */

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
  export function safeJsonParse<T>(text: string, defaultValue: T): T {
    try {
      return JSON.parse(text) as T;
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
  
  /**
   * Converts a string to title case
   */
  export function toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  }
  
  /**
   * Extracts a number from a string (e.g., "$24.99" -> 24.99)
   */
  export function extractNumber(str: string): number | null {
    const match = str.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
  }
  
  /**
   * Calculates savings percentage between original and dupe prices
   */
  export function calculateSavingsPercentage(originalPrice: number, dupePrice: number): number {
    if (originalPrice <= 0) return 0;
    const savings = ((originalPrice - dupePrice) / originalPrice) * 100;
    return Math.round(savings);
  }
  
  /**
   * Normalizes a string for comparison (lowercase, remove spaces, etc.)
   */
  export function normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\w\s]/gi, '');
  }
  
  /**
   * Checks if two strings are similar (ignoring case, spaces, etc.)
   */
  export function areStringsSimilar(str1: string, str2: string): boolean {
    return normalizeString(str1) === normalizeString(str2);
  }
  
  /**
   * Converts an array of strings to sentence case
   */
  export function formatArrayToSentenceCase(arr: string[]): string[] {
    return arr.map(item => 
      item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()
    );
  }
  
  /**
   * Adds 'https://' to a URL if it doesn't have a protocol
   */
  export function normalizeUrl(url: string): string {
    if (!url) return url;
    return url.startsWith('http') ? url : `https://${url}`;
  }