
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processProductIngredients, processDupeIngredients } from "../services/ingredients.ts";
import { supabase } from "../shared/db-client.ts";
import { getDetailedDupeAnalysis } from "../services/perplexity.ts";

serve(async (req) => {
  try {
    const {
      originalProductId,
      dupeProductIds,
      originalName,
      originalBrand,
      dupeInfo
    } = await req.json();

    console.log(`Processing ingredients for product ${originalProductId}`);

    // Get more detailed ingredient info from Perplexity
    const { data: originalProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', originalProductId)
      .single();

    // Get lightweight basic ingredients from Perplexity for original and dupes
    const basicResult = await getBasicIngredientsInfo(
      originalName,
      originalBrand,
      dupeInfo.map(d => ({ name: d.name, brand: d.brand }))
    );

    // Update original product with ingredients
    if (basicResult.original.keyIngredients?.length > 0) {
      await processProductIngredients(originalProductId, basicResult.original.keyIngredients);
      
      // Mark ingredients as loaded
      await supabase
        .from('products')
        .update({ loading_ingredients: false })
        .eq('id', originalProductId);
    }

    // Process dupe ingredients in parallel
    await Promise.all(
      dupeProductIds.map(async (dupeId, index) => {
        const dupeIngredients = basicResult.dupes[index]?.keyIngredients || [];
        if (dupeIngredients.length > 0) {
          await processDupeIngredients(dupeId, dupeIngredients);
        }
        
        // Mark ingredients as loaded
        await supabase
          .from('products')
          .update({ loading_ingredients: false })
          .eq('id', dupeId);
      })
    );

    console.log('Successfully processed ingredients');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in process-ingredients:', error);
    
    // Mark ingredients as loaded even on error to prevent UI from hanging
    try {
      const { originalProductId, dupeProductIds } = await req.json();
      await supabase
        .from('products')
        .update({ loading_ingredients: false })
        .eq('id', originalProductId);
        
      if (dupeProductIds?.length) {
        await supabase
          .from('products')
          .update({ loading_ingredients: false })
          .in('id', dupeProductIds);
      }
    } catch (e) {
      console.error('Error updating loading state:', e);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function getBasicIngredientsInfo(originalName, originalBrand, dupes) {
  // Simplified Perplexity call to just get ingredients lists
  // This would be a modified version of your existing getDetailedDupeAnalysis
  // with focus only on ingredients to be faster
  
  // This is a placeholder implementation
  return {
    original: {
      keyIngredients: []
    },
    dupes: dupes.map(() => ({ keyIngredients: [] }))
  };
}
