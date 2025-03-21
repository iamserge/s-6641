
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, Search } from 'lucide-react';
import { Dupe } from "@/types/dupe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { useCurrency } from "@/hooks/useCurrency";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DupeBottomBarProps {
  showBottomBar: boolean;
  activeDupe: Dupe | null;
  scrollToTop: () => void;
  originalPrice?: number;
}

export const DupeBottomBar = ({ showBottomBar, activeDupe, scrollToTop, originalPrice }: DupeBottomBarProps) => {
  const { convertPrice } = useCurrency();
  
  if (!activeDupe) return null;
  
  const handleGoogleSearch = () => {
    const searchQuery = `${activeDupe.brand} ${activeDupe.name}`;
    const encodedSearchQuery = encodeURIComponent(searchQuery);
    window.open(`https://www.google.com/search?q=${encodedSearchQuery}`, '_blank');
  };
  
  const calculatedSavingsPercentage = originalPrice && activeDupe.price && originalPrice > 0
    ? Math.round(((originalPrice - activeDupe.price) / originalPrice) * 100)
    : activeDupe.savings_percentage;
  
  return (
    <>
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm border border-gray-100">
                    <CategoryImage 
                      category={activeDupe.category} 
                      imageUrl={activeDupe.image_url}
                      name={activeDupe.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-100 text-violet-700 px-3 py-1.5 font-medium text-sm rounded-full">
                        {Math.round(activeDupe.match_score)}% Match
                      </Badge>
                      
                      {activeDupe.price ? (
                        <Badge className="bg-green-100 text-green-700 px-3 py-1.5 font-medium text-sm rounded-full">
                          {convertPrice(activeDupe.price)} 
                          {calculatedSavingsPercentage > 0 ? (
                            <span className="ml-1 text-green-600">(-{calculatedSavingsPercentage}%)</span>
                          ) : null}
                        </Badge>
                      ) : null}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-700 font-medium">
                        {activeDupe.brand} <span className="font-semibold text-violet-700">{activeDupe.name}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="default" 
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center gap-2"
                  onClick={handleGoogleSearch}
                >
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DupeBottomBar;
