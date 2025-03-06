
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Ingredient } from '@/types/dupe';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { IngredientHero } from '@/components/ingredient/IngredientHero';
import { IngredientProducts } from '@/components/ingredient/IngredientProducts';
import { IngredientResources } from '@/components/ingredient/IngredientResources';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface IngredientData extends Ingredient {
  product_count?: number;
  similar_ingredients?: Ingredient[];
  top_products?: any[];
  resources?: any[];
}

const IngredientPage = () => {
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [ingredient, setIngredient] = useState<IngredientData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isKeyOnly, setIsKeyOnly] = useState(true);

  useEffect(() => {
    const fetchIngredientData = async () => {
      if (!slug) {
        setError('No ingredient slug provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch basic ingredient info
        const { data: ingredientData, error: ingredientError } = await supabase
          .from('ingredients')
          .select('*')
          .eq('slug', slug)
          .single();

        if (ingredientError) throw ingredientError;
        if (!ingredientData) throw new Error('Ingredient not found');

        // Fetch product count
        const { count: productCount, error: productCountError } = await supabase
          .from('product_ingredients')
          .select('*', { count: 'exact', head: true })
          .eq('ingredient_id', ingredientData?.id);

        if (productCountError) throw productCountError;

        // Fetch similar ingredients (ingredients with similar benefits or concerns)
        let similarIngredients = [];
        if (ingredientData.skin_types && ingredientData.skin_types.length > 0) {
          const skinTypesArray = ingredientData.skin_types as string[];
          const { data: similarData, error: similarIngredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .neq('id', ingredientData?.id)
            .overlaps('skin_types', skinTypesArray)
            .limit(5);

          if (similarIngredientsError) throw similarIngredientsError;
          similarIngredients = similarData || [];
        }

        // Fetch top products containing this ingredient
        const { data: topProducts, error: topProductsError } = await supabase
          .from('product_ingredients')
          .select(`
            products:product_id(
              id, name, brand, slug, image_url, category, price,
              product_dupes!product_dupes_dupe_product_id_fkey(match_score)
            )
          `)
          .eq('ingredient_id', ingredientData?.id)
          .eq('is_key_ingredient', true)
          .limit(6);

        if (topProductsError) throw topProductsError;

        // Fetch ingredient resources
        const { data: resources, error: resourcesError } = await supabase
          .from('resources')
          .select(`
            id, title, url, type, 
            created_at
          `)
          .eq('ingredient_id', ingredientData?.id)
          .order('created_at', { ascending: false })
          .limit(8);

        if (resourcesError) throw resourcesError;

        // Process and flatten top products data
        const processedTopProducts = topProducts?.map(item => item.products) || [];

        // Combine all data
        const enhancedIngredientData: IngredientData = {
          ...ingredientData,
          product_count: productCount || 0,
          similar_ingredients: similarIngredients,
          top_products: processedTopProducts,
          resources: resources || []
        };

        setIngredient(enhancedIngredientData);
      } catch (error) {
        console.error('Error fetching ingredient data:', error);
        setError('Failed to load ingredient data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIngredientData();

    // Add scroll listener for back-to-top button
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#9b87f5] mb-4 mx-auto" />
          <p className="text-gray-600">Loading ingredient details...</p>
        </div>
      </div>
    );
  }

  if (error || !ingredient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error || "Ingredient could not be loaded"}</p>
        </div>
      </div>
    );
  }

  const toggleKeyIngredients = () => {
    setIsKeyOnly(!isKeyOnly);
  };

  return (
    <div className="min-h-screen font-urbanist">
      <AnimatedBackground />
      <Navbar />
      
      {/* Hero Section */}
      <IngredientHero ingredient={ingredient} similarIngredients={ingredient.similar_ingredients || []} />
      
      {/* Tabs Section */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="products" className="rounded-md">
                Products ({ingredient.product_count})
              </TabsTrigger>
              <TabsTrigger value="resources" className="rounded-md">
                Resources ({ingredient.resources?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="products" className="mt-2">
            <IngredientProducts 
              products={ingredient.top_products || []} 
              ingredientId={ingredient?.id} 
              isKeyOnly={isKeyOnly}
            />
          </TabsContent>
          
          <TabsContent value="resources" className="mt-2">
            <IngredientResources 
              resources={ingredient.resources || []} 
              ingredientId={ingredient?.id}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Back to Top Button */}
      {showScrollToTop && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed right-4 bottom-20 z-40 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200"
          onClick={scrollToTop}
        >
          <ChevronUp className="w-5 h-5 text-gray-600" />
        </motion.button>
      )}
    </div>
  );
};

export default IngredientPage;
