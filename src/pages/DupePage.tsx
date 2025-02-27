import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, ChevronUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types/dupe";
import { HeroProduct } from "@/components/dupe/HeroProduct";
import { DupeCard } from "@/components/dupe/DupeCard";
import Navbar from '@/components/Navbar';
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
import { getFlagEmoji } from "@/lib/utils";

const DupePage = () => {
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDupeIndex, setActiveDupeIndex] = useState(-1);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const dupeRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Refs for scroll to top functionality
  const heroRef = useRef<HTMLDivElement>(null);

  // Add this to your DupePage component's useEffect where you fetch data:

useEffect(() => {
  const fetchDupeData = async () => {
    if (!slug) {
      setError('No product slug provided');
      setIsLoading(false);
      return;
    }

    try {
      // Fetch the original product with all fields including reviews and resources
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          brand_info:brands(*),
          product_ingredients(ingredients(*)),
          reviews(*),
          product_resources(
            is_featured,
            resources:resource_id(*)
          )
        `)
        .eq('slug', slug)
        .single();

      if (productError) throw productError;
      if (!product) throw new Error('Product not found');

      // Fetch dupes with expanded fields through product_offers junction table
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
              is_featured,
              resources:resource_id(*)
            )
          )
        `)
        .eq('original_product_id', product.id);

      if (dupesError) throw dupesError;

      // Fetch ingredients for each dupe
      const dupes = await Promise.all(
        dupeRelations.map(async (relation) => {
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('product_ingredients')
            .select(`ingredients(*)`)
            .eq('product_id', relation.dupe.id);

          if (ingredientsError) console.error('Error fetching ingredients:', ingredientsError);

          const ingredients = ingredientsData ? ingredientsData.map(item => item.ingredients) : [];
          
          // Process offers to flatten the nested structure
          const offers = relation.dupe.product_offers?.map(po => ({
            ...po.offers,
            merchant: po.offers.merchant
          })) || [];

          // Format reviews
          const reviews = relation.dupe.reviews || [];

          // Format resources
          const resources = relation.dupe.product_resources?.map(pr => ({
            ...pr,
            resource: pr.resources
          })) || [];

          return {
            ...relation.dupe,
            match_score: relation.match_score,
            savings_percentage: relation.savings_percentage,
            ingredients,
            offers,
            reviews,
            resources
          };
        })
      );

      // Format the reviews array for the original product
      const reviews = product.reviews || [];

      // Format the resources array for the original product
      const resources = product.product_resources?.map(pr => ({
        ...pr,
        resource: pr.resources
      })) || [];

      // Create the final product data object that matches the Product type
      const productData = {
        ...product,
        ingredients: product.product_ingredients?.map(item => item.ingredients) || [],
        dupes,
        reviews,
        resources
      };

      setData(productData);
    } catch (error) {
      console.error('Error fetching dupe data:', error);
      setError('Failed to load product data');
    } finally {
      setIsLoading(false);
    }
  };

  fetchDupeData();
}, [slug]);

  useEffect(() => {
    // Setup intersection observer to detect when dupes are in view
    if (!isLoading && data?.dupes) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const index = dupeRefs.current.findIndex(ref => ref === entry.target);
              if (index !== -1) {
                setActiveDupeIndex(index);
                setShowBottomBar(true);
              }
            }
          });
        },
        { threshold: 0.3 } // Trigger when 30% of the element is visible
      );

      dupeRefs.current.forEach(ref => {
        if (ref) observer.observe(ref);
      });

      // Also observe when we scroll back to the product (top of the page)
      const heroObserver = new IntersectionObserver(
        (entries) => {
          const isHeroVisible = entries[0]?.isIntersecting;
          if (isHeroVisible) {
            setShowBottomBar(false);
          }
        },
        { threshold: 0.7 } // Hide the bottom bar when most of the hero is visible
      );

      if (heroRef.current) {
        heroObserver.observe(heroRef.current);
      }

      return () => {
        dupeRefs.current.forEach(ref => {
          if (ref) observer.unobserve(ref);
        });
        if (heroRef.current) {
          heroObserver.unobserve(heroRef.current);
        }
      };
    }
  }, [isLoading, data]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

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

  const activeDupe = activeDupeIndex >= 0 ? data.dupes[activeDupeIndex] : null;
  const problematicIngredients = activeDupe?.ingredients?.filter(i => i.is_controversial) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F3FF] to-white font-urbanist">
      <Navbar />
      
      <div ref={heroRef} className="hero-product">
        <HeroProduct product={data} />
      </div>
      
      <div className="container mx-auto px-4 py-8 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          {data.dupes.length} Dupes Found
        </h2>
        
        <div className="space-y-6">
          {data.dupes && data.dupes.map((dupe, index) => (
            <motion.div
              key={dupe.id}
              ref={el => dupeRefs.current[index] = el}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <DupeCard
                dupe={dupe}
                index={index}
                originalIngredients={data.ingredients?.map(i => i.name) || []}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showBottomBar && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 bottom-24 md:bottom-20 z-40 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200"
            onClick={scrollToTop}
          >
            <ChevronUp className="w-5 h-5 text-gray-600" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Fixed bottom bar that appears when scrolling through dupes */}
      <AnimatePresence>
        {showBottomBar && activeDupe && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-50"
          >
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 line-through mr-2">${data.price.toFixed(2)}</span>
                    <span className="text-lg font-bold text-[#0EA5E9]">${activeDupe.price.toFixed(2)}</span>
                    {activeDupe.savings_percentage && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                        Save {activeDupe.savings_percentage}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center mt-1">
                    <Badge className="bg-[#0EA5E9] text-white">
                      {activeDupe.match_score}% Match
                    </Badge>
                    <p className="text-sm text-gray-600 ml-2 truncate max-w-[200px]">
                      {activeDupe.brand} {activeDupe.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {problematicIngredients.length > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs text-amber-700">
                        Contains {problematicIngredients.length} flagged {problematicIngredients.length === 1 ? 'ingredient' : 'ingredients'}
                      </span>
                    </div>
                  )}
                
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="default" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90">
                        Buy Now
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="px-4 sm:px-6">
                      <SheetHeader>
                        <SheetTitle>Shop {activeDupe.brand} {activeDupe.name}</SheetTitle>
                        <SheetDescription>
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
                              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <div>
                                <p className="font-medium">{offer.merchant.name}</p>
                                <p className="text-sm text-gray-500">${offer.price} - {offer.condition || 'New'}</p>
                              </div>
                              <ExternalLink className="h-5 w-5 text-[#0EA5E9]" />
                            </a>
                          ))
                        ) : activeDupe.purchase_link ? (
                          <a
                            href={activeDupe.purchase_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <div>
                              <p className="font-medium">Shop Now</p>
                              <p className="text-sm text-gray-500">${activeDupe.price}</p>
                            </div>
                            <ExternalLink className="h-5 w-5 text-[#0EA5E9]" />
                          </a>
                        ) : (
                          <p className="text-center text-gray-500 py-6">No purchasing options available</p>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DupePage;