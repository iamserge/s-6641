
import { memo } from "react";
import { motion } from "framer-motion";
import { Star, DollarSign, Shield, Heart, Leaf, Droplet, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { getFlagEmoji } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Define prop types for better performance
interface DupeInfo {
  coverage?: string | null;
  confidence_level?: string | null;
  longevity_comparison?: string | null;
  cruelty_free?: boolean | null;
  vegan?: boolean | null;
}

interface BrandInfo {
  name?: string | null;
  country_of_origin?: string | null;
  sustainable_packaging?: boolean | null;
  cruelty_free?: boolean | null;
  vegan?: boolean | null;
}

interface DupeSummary {
  id: string;
  name: string;
  brand: string;
  image_url?: string | null;
  category?: string | null; 
  match_score: number;
  savings_percentage: number;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    slug: string;
    image_url?: string | null;
    category?: string | null;
    country_of_origin?: string | null;
    highest_match?: number | null;
    highest_savings?: number | null;
    dupes: DupeSummary[];
    dupeInfo: DupeInfo | null;
    brandInfo: BrandInfo | null;
  };
  onClick: () => void;
  index: number;
}

const DupeProductCard = memo(({ product, onClick, index }: ProductCardProps) => {
  return (
    <motion.div
      key={product.slug}
      className="relative rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer bg-white/70 backdrop-blur-sm border border-slate-100/50 overflow-hidden flex flex-col"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
    >
      {/* Top badges row */}
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-zinc-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {product.highest_match && (
            <Badge variant="pastelPurple" className="rounded-full text-xs font-medium px-2 py-0.5">
              {Math.round(product.highest_match)}% Match
            </Badge>
          )}
          
          {product.highest_savings && product.highest_savings > 0 && (
            <Badge variant="pastelGreen" className="rounded-full text-xs font-medium px-2 py-0.5 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Save {Math.round(product.highest_savings)}%
            </Badge>
          )}
        </div>
        
        <Badge className="bg-[#5840c0] text-white text-xs rounded-full px-2 py-0.5">
          {product.dupes.length} Dupes
        </Badge>
      </div>
      
      {/* Main content */}
      <div className="p-4 flex flex-col items-center">
        {/* Product image */}
        <div className="w-28 h-28 rounded-full overflow-hidden border border-slate-100 shadow-sm bg-white flex items-center justify-center mb-4">
          <CategoryImage
            category={product.category}
            imageUrl={product.image_url}
            name={product.name}
            className="object-contain w-full h-full p-1"
          />
        </div>
        
        {/* Product name and brand */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-600">by {product.brand}</p>
          
          {/* Country badge if available */}
          {product.country_of_origin && (
            <div className="flex items-center gap-1 mt-1 justify-center">
              <span className="text-sm text-gray-500">
                {getFlagEmoji(product.country_of_origin)} {product.country_of_origin}
              </span>
            </div>
          )}
        </div>
        
        {/* Dupe image stack with tooltips */}
        {product.dupes.length > 0 && (
          <div className="mb-4">
            <TooltipProvider>
              <div className="flex -space-x-3 justify-center">
                {product.dupes.slice(0, 5).map((dupe, index) => (
                  <Tooltip key={dupe?.id}>
                    <TooltipTrigger asChild>
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center"
                        style={{ zIndex: 10 - index }}
                      >
                        <CategoryImage
                          category={dupe.category}
                          imageUrl={dupe.image_url}
                          name={dupe.name}
                          className="object-contain w-full h-full p-1"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 max-w-[200px] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg">
                      <p className="font-medium text-sm">{dupe.name}</p>
                      <p className="text-xs text-gray-500">by {dupe.brand}</p>
                      <div className="flex gap-1 mt-2">
                        <Badge variant="pastelBlue" className="text-xs px-1.5 py-0.5">
                          {Math.round(dupe.match_score)}% Match
                        </Badge>
                        {dupe.savings_percentage > 0 && (
                          <Badge variant="pastelGreen" className="text-xs px-1.5 py-0.5">
                            Save {Math.round(dupe.savings_percentage)}%
                          </Badge>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {product.dupes.length > 5 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-gray-50 text-xs font-medium text-gray-600">
                    +{product.dupes.length - 5}
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>
        )}
      </div>
      
      {/* Feature badges at bottom */}
      <div className="bg-gray-50/50 p-3 mt-auto">
        <div className="flex flex-wrap gap-2 justify-center">
          {product.dupeInfo?.coverage && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-xs hover:bg-blue-100 transition-all">
              <Droplet className="w-3 h-3 mr-1" />
              {product.dupeInfo.coverage}
            </Badge>
          )}
          
          {product.dupeInfo?.confidence_level && (
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 rounded-full px-2 py-0.5 text-xs hover:bg-yellow-100 transition-all">
              <Check className="w-3 h-3 mr-1" />
              {product.dupeInfo.confidence_level}
            </Badge>
          )}
          
          {(product.dupeInfo?.cruelty_free || product.brandInfo?.cruelty_free) && (
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 rounded-full px-2 py-0.5 text-xs hover:bg-purple-100 transition-all">
              <Heart className="w-3 h-3 mr-1" />
              Cruelty-Free
            </Badge>
          )}
          
          {(product.dupeInfo?.vegan || product.brandInfo?.vegan) && (
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 text-xs hover:bg-emerald-100 transition-all">
              <Leaf className="w-3 h-3 mr-1" />
              Vegan
            </Badge>
          )}
          
          {product.brandInfo?.sustainable_packaging && (
            <Badge variant="secondary" className="bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-xs hover:bg-green-100 transition-all">
              <Shield className="w-3 h-3 mr-1" />
              Sustainable
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default DupeProductCard;
