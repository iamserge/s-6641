
import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductCategory } from "@/types/dupe";
import { HeroProduct } from "@/components/dupe/HeroProduct";
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import DupeLoading from '@/components/dupe/DupeLoading';
import ErrorMessage from '@/components/dupe/ErrorMessage';
import DupeHeader from '@/components/dupe/DupeHeader';
import DupeList from '@/components/dupe/DupeList';
import DupeBottomBar from '@/components/dupe/DupeBottomBar';

const DupePage = () => {
  const { slug } = useParams();
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isLoadingDupes, setIsLoadingDupes] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDupeIndex, setActiveDupeIndex] = useState(-1);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Fetch product data when the component mounts
  useEffect(() => {
    const fetchProductData = async () => {
      if (!slug) {
        setError('No product slug provided');
        setIsLoadingProduct(false);
        return;
      }

      try {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            brand_info:brands(*),
            product_ingredients(ingredients(*)),
            reviews(*),
            product_resources(
              id,
              is_featured,
              resources:resource_id(*)
            )
          `)
          .eq('slug', slug)
          .single();

        if (productError) throw productError;
        if (!product) throw new Error('Product not found');

        const reviews = product.reviews || [];
        const resources = product.product_resources?.map(pr => ({
          id: pr?.id,
          product_id: product?.id,
          resource_id: pr.resources?.id,
          is_featured: pr.is_featured,
          resource: pr.resources
        })) || [];
        
        const category = product.category as ProductCategory;

        const productData: Product = {
          ...product,
          category,
          ingredients: product.product_ingredients?.map(item => item.ingredients) || [],
          dupes: [],
          reviews,
          resources,
          loading_ingredients: product.loading_ingredients !== undefined ? product.loading_ingredients : false,
          loading_reviews: product.loading_reviews !== undefined ? product.loading_reviews : false,
          loading_resources: product.loading_resources !== undefined ? product.loading_resources : false
        };

        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product data:', error);
        setError('Failed to load product data');
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProductData();
  }, [slug]);

  // Fetch dupes data when the product is loaded
  useEffect(() => {
    const fetchDupesData = async () => {
      if (!product || !product?.id) return;
      
      try {
        setIsLoadingDupes(true);
        
        const { data: dupeRelations, error: dupesError } = await supabase
          .from('product_dupes')
          .select(`
            match_score,
            savings_percentage,
            dupe:products!product_dupes_dupe_product_id_fkey(
              *,
              product_offers(
                offers(
                  *,
                  merchant:merchants(*)
                )
              ),
              reviews(*),
              product_resources(
                id,
                is_featured,
                resources:resource_id(*)
              )
            )
          `)
          .eq('original_product_id', product?.id);

        if (dupesError) throw dupesError;

        const processedDupes = await Promise.all(
          dupeRelations.map(async (relation) => {
            const { data: ingredientsData, error: ingredientsError } = await supabase
              .from('product_ingredients')
              .select(`ingredients(*)`)
              .eq('product_id', relation.dupe?.id);

            if (ingredientsError) console.error('Error fetching ingredients:', ingredientsError);

            const ingredients = ingredientsData ? ingredientsData.map(item => item.ingredients) : [];
            
            const offers = relation.dupe.product_offers?.map(po => ({
              ...po.offers,
              merchant: po.offers.merchant
            })) || [];

            const reviews = relation.dupe.reviews || [];

            const resources = relation.dupe.product_resources?.map(pr => ({
              id: pr?.id,
              product_id: relation.dupe?.id,
              resource_id: pr.resources?.id,
              is_featured: pr.is_featured,
              resource: pr.resources
            })) || [];
            
            const category = relation.dupe.category as ProductCategory || 'Other' as ProductCategory;

            return {
              ...relation.dupe,
              category,
              match_score: relation.match_score,
              savings_percentage: relation.savings_percentage,
              ingredients,
              offers,
              reviews,
              resources,
              loading_ingredients: relation.dupe.loading_ingredients !== undefined ? relation.dupe.loading_ingredients : false,
              loading_reviews: relation.dupe.loading_reviews !== undefined ? relation.dupe.loading_reviews : false,
              loading_resources: relation.dupe.loading_resources !== undefined ? relation.dupe.loading_resources : false
            };
          })
        );

        // Sort dupes by match score in descending order
        processedDupes.sort((a, b) => b.match_score - a.match_score);

        setProduct(prevProduct => {
          if (!prevProduct) return null;
          return {
            ...prevProduct,
            dupes: processedDupes
          };
        });
        
      } catch (error) {
        console.error('Error fetching dupes data:', error);
      } finally {
        setIsLoadingDupes(false);
      }
    };

    if (product && product?.id) {
      fetchDupesData();
    }
  }, [product?.id]);

  // Get the active dupe based on the active index
  const activeDupe = useMemo(() => 
    activeDupeIndex >= 0 && product?.dupes ? 
    product.dupes[activeDupeIndex] : null, 
  [activeDupeIndex, product?.dupes]);
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Show loading state while product data is loading
  if (isLoadingProduct) {
    return <DupeLoading message="Loading product details..." />;
  }

  // Show error message if there was an error or no product was found
  if (error || !product) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="min-h-screen font-urbanist bg-gradient-to-b from-violet-50 to-pink-50">
      <AnimatedBackground />
      <Navbar />
      
      <div ref={heroRef} className="pt-8">
        <HeroProduct product={product} />
      </div>
      
      <div className="container mx-auto px-4 py-8 md:py-16">
        <DupeHeader 
          isLoadingDupes={isLoadingDupes} 
          dupeCount={product.dupes?.length || 0} 
        />
        
        <DupeList 
          isLoadingDupes={isLoadingDupes}
          product={product}
          setActiveDupeIndex={setActiveDupeIndex}
          setShowBottomBar={setShowBottomBar}
          heroRef={heroRef}
        />
      </div>

      <DupeBottomBar 
        showBottomBar={showBottomBar}
        activeDupe={activeDupe}
        scrollToTop={scrollToTop}
      />
    </div>
  );
};

export default DupePage;
