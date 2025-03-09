import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Product, ProductCategory } from "@/types/dupe";
import { HeroProduct } from "@/components/dupe/HeroProduct";
import { DupeCard } from "@/components/dupe/DupeCard";
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const DupePage = () => {
  const { slug } = useParams();
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isLoadingDupes, setIsLoadingDupes] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDupeIndex, setActiveDupeIndex] = useState(-1);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const dupeRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const heroRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!product?.dupes || dupeRefs.current.length === 0) return;
  
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        
        if (visibleEntries.length > 0) {
          const index = dupeRefs.current.findIndex(
            ref => ref === visibleEntries[0].target
          );
          
          if (index !== -1) {
            setActiveDupeIndex(index);
            setShowBottomBar(true);
          }
        }
      },
      { 
        threshold: [0.3],
        rootMargin: "-100px 0px" 
      }
    );
    
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShowBottomBar(false);
        }
      },
      { threshold: 0.3 }
    );
  
    dupeRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    
    if (heroRef.current) {
      heroObserver.observe(heroRef.current);
    }
  
    return () => {
      dupeRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
      
      if (heroRef.current) heroObserver.unobserve(heroRef.current);
      
      observer.disconnect();
      heroObserver.disconnect();
    };
  }, [product?.dupes]);

  const activeDupe = useMemo(() => 
    activeDupeIndex >= 0 && product?.dupes ? 
    product.dupes[activeDupeIndex] : null, 
  [activeDupeIndex, product?.dupes]);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-pink-50">
        <AnimatedBackground />
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mb-4 mx-auto" />
          <p className="text-xl text-gray-700">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-pink-50">
        <AnimatedBackground />
        <div className="text-center max-w-lg p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-xl text-gray-700 mb-2">{error || "Product could not be loaded"}</p>
          <p className="text-gray-500">Please try searching for a different product</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-urbanist bg-gradient-to-b from-violet-50 to-pink-50">
      <AnimatedBackground />
      <Navbar />
      
      <div ref={heroRef} className="pt-8">
        <HeroProduct product={product} />
      </div>
      
      {product.summary && (
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-700 leading-relaxed">
              {product.summary}
            </p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800">
          {isLoadingDupes ? (
            <div className="flex items-center justify-center gap-2">
              <span>Finding Dupes</span>
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
            </div>
          ) : (
            product.dupes.length > 0 
              ? `${product.dupes.length} Dupes Found`
              : "No Dupes Found"
          )}
        </h2>
        
        {isLoadingDupes ? (
          <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-pink-100/30 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4 mx-auto" />
              <p className="text-xl text-gray-700 mb-2">Searching for perfect dupes...</p>
              <p className="text-gray-500">This may take a moment</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {product.dupes && product.dupes.length > 0 ? (
              product.dupes.map((dupe, index) => (
                <div
                  key={dupe?.id}
                  ref={el => dupeRefs.current[index] = el}
                >
                  <DupeCard
                    dupe={dupe}
                    index={index}
                    originalIngredients={product.ingredients?.map(i => i.name) || []}
                    showBottomBar={showBottomBar && activeDupeIndex === index}
                  />
                </div>
              ))
            ) : (
              <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-pink-100/30 text-center">
                <p className="text-xl text-gray-700 mb-2">No dupes found for this product.</p>
                <p className="text-gray-500">Try searching for a different product.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showBottomBar && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 bottom-24 md:bottom-20 z-40 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-pink-200"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5 text-pink-700" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBottomBar && activeDupe && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-pink-200 px-4 py-3 z-50 shadow-lg"
          >
            <div className="container mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-violet-100 text-violet-700 px-3 py-1.5 font-medium text-sm rounded-full">
                      {Math.round(activeDupe.match_score)}% Match
                    </Badge>
                    
                    {activeDupe.savings_percentage > 0 && (
                      <Badge className="bg-green-100 text-green-700 px-3 py-1.5 font-medium text-sm rounded-full">
                        Save {Math.round(activeDupe.savings_percentage)}%
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 font-medium">
                    {activeDupe.brand} <span className="font-semibold text-violet-700">{activeDupe.name}</span>
                  </p>
                </div>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="default" className="bg-violet-600 hover:bg-violet-700 text-white rounded-full">
                      Buy Now
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="px-4 sm:px-6 rounded-t-3xl bg-white/95 backdrop-blur-md">
                    <SheetHeader>
                      <SheetTitle className="text-2xl text-violet-700">Shop {activeDupe.brand} {activeDupe.name}</SheetTitle>
                      <SheetDescription className="text-gray-600 text-base">
                        Choose where to purchase this dupe
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-3 mt-6">
                      {activeDupe.offers && activeDupe.offers.length > 0 ? (
                        activeDupe.offers.map((offer, i) => (
                          <a
                            key={i}
                            href={offer.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-lg">{offer.merchant?.name || "Retailer"}</p>
                              <p className="text-gray-500">~${Math.round(offer.price)} - {offer.condition || 'New'}</p>
                            </div>
                            <ExternalLink className="h-5 w-5 text-violet-600" />
                          </a>
                        ))
                      ) : activeDupe.purchase_link ? (
                        <a
                          href={activeDupe.purchase_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-lg">Shop Now</p>
                            <p className="text-gray-500">~${Math.round(activeDupe.price)}</p>
                          </div>
                          <ExternalLink className="h-5 w-5 text-violet-600" />
                        </a>
                      ) : (
                        <div className="text-center py-6 bg-white/70 rounded-xl">
                          <p className="text-gray-600 text-lg">No purchasing options available</p>
                          <p className="text-gray-500 text-sm mt-2">Try searching online retailers</p>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DupePage;