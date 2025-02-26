
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database } from '../shared/types.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function processSearchRequest(searchText: string, getimgApiKey: string) {
  console.log('Processing search request for:', searchText);
  
  try {
    // Search for products matching the search text
    const { data: products, error: searchError } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchText}%`)
      .limit(1);

    if (searchError) {
      console.error('Error searching products:', searchError);
      throw searchError;
    }

    if (!products || products.length === 0) {
      console.log('No products found for search text:', searchText);
      return {
        success: false,
        message: 'No products found matching your search'
      };
    }

    const product = products[0];
    console.log('Found product:', product.name);

    return {
      success: true,
      data: {
        name: product.name,
        brand: product.brand,
        slug: product.slug,
        category: product.category
      }
    };
  } catch (error) {
    console.error('Error in processSearchRequest:', error);
    throw error;
  }
}
