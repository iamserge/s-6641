import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from 'lucide-react';
import { motion } from "framer-motion";
import { Product } from "@/types/dupe";
import { HeroProduct } from "@/components/dupe/HeroProduct";
import { DupeCard } from "@/components/dupe/DupeCard";
import Navbar from '@/components/Navbar';

const DupePage = () => {
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDupeData = async () => {
      if (!slug) {
        setError('No product slug provided');
        setIsLoading(false);
        return;
      }

      try {
        // First, fetch the original product
        const { data: product, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            brand_info:brands(*)
          `)
          .eq('slug', slug)
          .single();

        if (productError) throw productError;
        if (!product) throw new Error('Product not found');

        // Then, fetch the dupes related to this product
        const { data: productDupes, error: dupesError } = await supabase
          .from('product_dupes')
          .select(`
            *,
            dupe:products!product_dupes_dupe_product_id_fkey(*)
          `)
          .eq('original_product_id', product.id);

        if (dupesError) throw dupesError;

        // For each dupe, fetch its ingredients
        const dupes = await Promise.all(
          productDupes.map(async (productDupe) => {
            const dupe = productDupe.dupe;
            
            // Fetch ingredients for this dupe
            const { data: ingredientsData, error: ingredientsError } = await supabase
              .from('product_ingredients')
              .select(`
                ingredient:ingredients(id, name)
              `)
              .eq('product_id', dupe.id);

            if (ingredientsError) {
              console.error('Error fetching ingredients:', ingredientsError);
              return {
                ...dupe,
                match_score: productDupe.match_score,
                savings_percentage: productDupe.savings_percentage,
                ingredients: []
              };
            }

            // Extract ingredient objects from the nested structure
            const ingredients = ingredientsData.map(item => item.ingredient);

            return {
              ...dupe,
              match_score: productDupe.match_score, 
              savings_percentage: productDupe.savings_percentage,
              ingredients
            };
          })
        );

        // Combine everything into our data structure
        setData({
          ...product,
          brand_info: product.brand_info,
          dupes
        });
      } catch (error) {
        console.error('Error fetching dupe data:', error);
        setError('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDupeData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8F3FF] to-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#9b87f5]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8F3FF] to-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F3FF] to-white font-urbanist">
      <Navbar />
      <HeroProduct product={data} />
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {data.dupes && data.dupes.map((dupe, index) => (
            <DupeCard key={dupe.id} dupe={dupe} index={index} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DupePage;