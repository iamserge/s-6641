import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, ChevronUp } from 'lucide-react';
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

const DupePage = () => {
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDupeIndex, setActiveDupeIndex] = useState(-1);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const dupeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchDupeData = async () => {
      if (!slug) {
        setError('No product slug provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the original product with all fields
        const { data: product, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            brand_info:brands(*),
            product_ingredients(ingredients(*))
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

            return {
              ...relation.dupe,
              match_score: relation.match_score,
              savings_percentage: relation.savings_percentage,
              ingredients,
              offers
            };
          })
        );

        // Create the final product data object that matches the Product type
        const productData: Product = {
          ...product,
          ingredients: product.product_ingredients?.map(item => item.ingredients) || [],
          dupes
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

      const heroElement = document.querySelector('.hero-product');
      if (heroElement) {
        heroObserver.observe(heroElement);
      }

      return () => {
        dupeRefs.current.forEach(ref => {
          if (ref) observer.unobserve(ref);
        });
        if (heroElement) {
          heroObserver.unobserve(heroElement);
        }
      };
    }
  }, [isLoading, data]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F3FF] to-white font-urbanist">
      <Navbar />
      
      <div className="hero-product">
        <HeroProduct product={data} />
      </div>
      
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 line-through mr-2">${data.price.toFixed(2)}</span>
                  <span className="text-lg font-bold text-[#0EA5E9]">${activeDupe.price.toFixed(2)}</span>
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    Save {activeDupe.savings_percentage}%
                  </Badge>
                </div>
                <div className="flex items-center mt-1">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {activeDupe.match_score}% Match
                  </Badge>
                  <p className="text-sm text-gray-600 ml-2">{activeDupe.brand} {activeDupe.name}</p>
                </div>
              </div>

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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DupePage;