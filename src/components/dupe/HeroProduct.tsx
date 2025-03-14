
import { useState } from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/dupe";
import { Heart, Leaf, MapPin, Clock, Star, ChevronDown, ChevronUp, Droplet, Layout, Layers, Shield } from 'lucide-react';
import { getFlagEmoji } from "@/lib/utils";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { IngredientPill } from "@/components/dupe/IngredientPill";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReviewCard } from "@/components/dupe/ReviewCard";
import { SocialMediaResource } from "@/components/dupe/SocialMediaResource";
import { Button } from "@/components/ui/button";

interface HeroProductProps {
  product: Product;
}

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 text-amber-400 fill-amber-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-4 h-4 text-amber-400" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-amber-400" />
      ))}
      <span className="ml-2 text-base font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

export const HeroProduct = ({ product }: HeroProductProps) => {
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllResources, setShowAllResources] = useState(false);

  const featuredResources = product.resources;

  const notableIngredients = product.ingredients?.filter(i => i.is_controversial || i.benefits?.length > 0) || [];
  const allIngredients = product.ingredients || [];

  return (
    <div className="container mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center relative"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-2">
              {product.name}
            </h1>
            
            <p className="text-xl font-light text-gray-600 mb-4">
              by {product.brand}
            </p>
            
            {product.rating ? (
              <div className="flex justify-center items-center gap-2 mb-2">
                <StarRating rating={product.rating} />
                {product.rating_count ? (
                  <span className="text-sm text-gray-500">
                    ({product.rating_count.toLocaleString()} reviews)
                  </span>
                ) : null}
              </div>
            ) : null}
            {product.rating_source ? (
              <span className="text-xs text-gray-400">via {product.rating_source}</span>
            ) : null}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 relative"
          >
            <div className="w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden bg-white shadow-md p-1 mx-auto relative">
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                <CategoryImage 
                  category={product.category} 
                  imageUrl={product.image_url} 
                  name={product.name} 
                  className="object-contain w-full h-full p-1"
                />
              </div>
            </div>
            {product.price ? (
              <div className="absolute -top-3 -right-3 bg-white text-gray-800 px-4 py-2 rounded-full font-bold shadow-md border border-gray-100 z-10 hover:shadow-lg transition-all duration-200">
                ~${Math.round(product.price)}
              </div>
            ) : null}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {product.category ? (
              <Badge className="bg-white text-gray-700 px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                {product.category}
              </Badge>
            ) : null}
            
            {product.country_of_origin ? (
              <Badge className="bg-white text-gray-700 px-5 py-2.5 text-base flex items-center gap-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{getFlagEmoji(product.country_of_origin)}</span>
                {product.country_of_origin}
              </Badge>
            ) : null}
            
            {product.cruelty_free ? (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Heart className="w-4 h-4 text-pink-500" />
                Cruelty-Free
              </Badge>
            ) : null}
            
            {product.vegan ? (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Leaf className="w-4 h-4 text-green-500" />
                Vegan
              </Badge>
            ) : null}
            
            {product.texture ? (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Droplet className="w-4 h-4 text-blue-500" />
                Texture: {product.texture}
              </Badge>
            ) : null}
            
            {product.finish ? (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Layout className="w-4 h-4 text-purple-500" />
                Finish: {product.finish}
              </Badge>
            ) : null}
            
            {product.coverage ? (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Layers className="w-4 h-4 text-amber-500" />
                Coverage: {product.coverage}
              </Badge>
            ) : null}
            
            {product.spf && product.spf > 0 ? (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Shield className="w-4 h-4 text-orange-500" />
                SPF {product.spf}
              </Badge>
            ) : null}
            
            {product.longevity_rating && product.longevity_rating > 0 ? (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Clock className="w-4 h-4 text-teal-500" />
                Longevity: {product.longevity_rating}/10
              </Badge>
            ) : null}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">Ingredients</h3>
            
            <div className="backdrop-blur-sm rounded-xl">
              {product.loading_ingredients ? (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse rounded-full bg-gray-200 h-10 w-40"></div>
                </div>
              ) : allIngredients.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-3 mb-4 relative">
                  <TooltipProvider delayDuration={100}>
                    {allIngredients.map((ingredient, index) => (
                      <div key={`notable-${index}`} className="z-20 relative">
                        <IngredientPill 
                          ingredient={ingredient} 
                          className="text-base px-5 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md"
                        />
                      </div>
                    ))}
                  </TooltipProvider>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-2 text-base">No ingredients information available</p>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full mb-8 grid md:grid-cols-2 gap-6"
          >
            <div>
              <h3 className="text-xl font-semibold mb-4 font-[500] text-gray-800 text-center">Best For</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {product.skin_types && product.skin_types.length > 0 ? (
                  product.skin_types.map((type, index) => (
                    <Badge 
                      key={`skin-${index}`} 
                      className="bg-white text-gray-700 font-[500] px-3 py-2 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
                    >
                      {type}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500 text-base">No skin type information</p>
                )}
                
                {product.best_for && product.best_for.length > 0 ? 
                  product.best_for.map((item, index) => (
                    <Badge 
                      key={`best-${index}`} 
                      className="bg-white text-gray-700 font-[500] px-5 py-2 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
                    >
                      {item}
                    </Badge>
                  ))
                : null}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Free Of</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {product.free_of && product.free_of.length > 0 ? (
                  product.free_of.map((item, index) => (
                    <Badge 
                      key={`free-${index}`} 
                      className="bg-white font-[500] text-gray-700 px-5 py-2 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
                    >
                      {item}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500 text-base">No free-of information</p>
                )}
              </div>
            </div>
            
          </motion.div>

          {product.summary ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="w-full mt-10"
            >
              <h3 className="text-xl font-semibold mb-3 text-gray-800 text-center">Summary</h3>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100">
                <p className="text-lg text-gray-700 leading-relaxed font-light text-[24px]">
                  {product.summary}
                </p>
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
};
