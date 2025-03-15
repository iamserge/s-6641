
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Brand } from '@/types/dupe';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { BrandHero } from '@/components/brand/BrandHero';
import { BrandProducts } from '@/components/brand/BrandProducts';
import { BrandResources } from '@/components/brand/BrandResources';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BrandData extends Brand {
  product_count?: number;
  dupes_count?: number;
  top_products?: any[];
  resources?: any[];
}

const BrandPage = () => {
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const fetchBrandData = async () => {
      if (!slug) {
        setError('No brand slug provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch basic brand info
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('slug', slug)
          .single();

        if (brandError) throw brandError;
        if (!brandData) throw new Error('Brand not found');

        // Fetch product count
        const { count: productCount, error: productCountError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brandData?.id);

        if (productCountError) throw productCountError;

        // Fetch dupes count where this brand's products are used as dupes
        // Create a subquery to get product IDs for this brand
        const { data: productIds } = await supabase
          .from('products')
          .select('id')
          .eq('brand_id', brandData?.id);
        
        // If there are no products, set dupes count to 0
        let dupesCount = 0;
        
        if (productIds && productIds.length > 0) {
          // Extract just the IDs into an array
          const ids = productIds.map(p => p?.id);
          
          // Use the array in the IN clause
          const { count, error: dupesCountError } = await supabase
            .from('product_dupes')
            .select('*', { count: 'exact', head: true })
            .in('dupe_product_id', ids);
            
          if (dupesCountError) throw dupesCountError;
          dupesCount = count || 0;
        }

        // Fetch top products
        const { data: topProducts, error: topProductsError } = await supabase
          .from('products')
          .select(`
            id, name, slug, image_url, category, price,
            product_dupes!product_dupes_dupe_product_id_fkey(match_score)
          `)
          .eq('brand_id', brandData?.id)
          .order('created_at', { ascending: false })
          .limit(6);

        if (topProductsError) throw topProductsError;

        // Fetch brand resources
        const { data: resources, error: resourcesError } = await supabase
          .from('resources')
          .select(`
            id, title, url, type, 
            created_at
          `)
          .eq('brand_id', brandData?.id)
          .order('created_at', { ascending: false })
          .limit(8);

        if (resourcesError) throw resourcesError;

        // Combine all data
        const enhancedBrandData: BrandData = {
          ...brandData,
          product_count: productCount || 0,
          dupes_count: dupesCount,
          top_products: topProducts || [],
          resources: resources || []
        };

        setBrand(enhancedBrandData);
      } catch (error) {
        console.error('Error fetching brand data:', error);
        setError('Failed to load brand data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandData();

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
          <Loader2 className="w-10 h-10 animate-spin text-gray-600 mb-4 mx-auto" />
          <p className="text-gray-600">Loading brand details...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error || "Brand could not be loaded"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-urbanist bg-gradient-to-b from-violet-50 to-pink-50">
      <AnimatedBackground />
      <Navbar />
      
      {/* Hero Section */}
      <BrandHero brand={brand} />
      
      {/* Tabs Section */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md bg-white/50 backdrop-blur-sm p-1 rounded-full border border-gray-100 shadow-sm">
              <TabsTrigger value="products" className="rounded-full px-5 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800">
                Products ({brand.product_count})
              </TabsTrigger>
              <TabsTrigger value="resources" className="rounded-full px-5 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800">
                Resources ({brand.resources?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="products" className="mt-2">
            <BrandProducts products={brand.top_products || []} brandId={brand?.id} />
          </TabsContent>
          
          <TabsContent value="resources" className="mt-2">
            <BrandResources resources={brand.resources || []} brandId={brand?.id} />
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

export default BrandPage;
