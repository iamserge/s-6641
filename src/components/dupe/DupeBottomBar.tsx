
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ExternalLink } from 'lucide-react';
import { Dupe } from "@/types/dupe";
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

interface DupeBottomBarProps {
  showBottomBar: boolean;
  activeDupe: Dupe | null;
  scrollToTop: () => void;
}

export const DupeBottomBar = ({ showBottomBar, activeDupe, scrollToTop }: DupeBottomBarProps) => {
  if (!activeDupe) return null;
  
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
                              <p className="text-gray-500">~${Math.round(offer.price)} {offer.condition ? `- ${offer.condition}` : ''}</p>
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
                            {activeDupe.price && <p className="text-gray-500">~${Math.round(activeDupe.price)}</p>}
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
    </>
  );
};

export default DupeBottomBar;
