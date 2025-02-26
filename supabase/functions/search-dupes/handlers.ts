
import { supabase } from "../shared/db-client.ts";
import { logInfo, logError } from "../shared/utils.ts";
import { findDupesForProduct } from "../services/external-db.ts";

interface SearchResult {
  success: boolean;
  data?: {
    slug: string;
    [key: string]: any;
  };
  error?: string;
}

export async function searchAndProcessDupes(
  searchText: string,
  onProgress: (message: string) => void
): Promise<SearchResult> {
  try {
    onProgress("🔍 Searching for your product...");

    // 1. Search for existing product in our database
    const { data: existingProducts, error: searchError } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchText}%`)
      .limit(1);

    if (searchError) {
      throw new Error(`Error searching for product: ${searchError.message}`);
    }

    // If product exists, return its data
    if (existingProducts && existingProducts.length > 0) {
      onProgress("💫 Found existing dupes in our database!");
      return {
        success: true,
        data: {
          slug: existingProducts[0].slug,
          ...existingProducts[0]
        }
      };
    }

    // 2. If not found, search external sources and process
    onProgress("🌐 Searching external sources...");
    const externalResult = await findDupesForProduct(searchText, onProgress);

    if (!externalResult.success) {
      throw new Error(externalResult.error || "Failed to find product data");
    }

    return {
      success: true,
      data: {
        slug: externalResult.data.slug,
        ...externalResult.data
      }
    };

  } catch (error) {
    logError("Error in searchAndProcessDupes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}
