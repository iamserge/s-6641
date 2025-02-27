import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/dupe";
import { CategoryImage } from "./CategoryImage";
import { Heart, Leaf, MapPin, Clock, ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { getFlagEmoji } from "@/lib/utils";

interface HeroProductProps {
  product: Product;
}

export const HeroProduct = ({ product }: HeroProductProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="container mx-auto px-4 pt-24 pb-8 md:pt-32 md:pb-16">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative mb-8 max-w-xs w-full"
          >
            <div className="relative aspect-square w-full">
              <CategoryImage
                category={product.category}
                imageUrl={product.image_url}
                images={product.images}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          {/* Brand & Title */}
          <motion.div className="w-full mb-6">
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-light text-gray-600 mb-2"
            >
              {product.brand}
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-5xl font-medium text-gray-900 mb-4"
            >
              {product.name}
            </motion.h1>
          </motion.div>

          {/* Primary Info Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {product.category && (
              <Badge variant="secondary" className="bg-white/50 backdrop-blur-sm text-gray-700 px-4 py-1">
                {product.category}
              </Badge>
            )}
            
            {product.price && (
              <Badge variant="secondary" className="bg-[#9b87f5] text-white px-4 py-1">
                ${product.price.toFixed(2)}
              </Badge>
            )}
            
            {product.country_of_origin && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{getFlagEmoji(product.country_of_origin)}</span>
                {product.country_of_origin}
              </Badge>
            )}
            
            {product.longevity_rating && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 px-4 py-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Longevity: {product.longevity_rating}/10
              </Badge>
            )}
          </motion.div>

          {/* Key Status Pills */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {product.cruelty_free && (
              <Badge className="bg-purple-100 text-purple-800 flex gap-1 items-center px-3 py-1">
                <Heart className="w-3 h-3" />
                Cruelty-Free
              </Badge>
            )}
            
            {product.vegan && (
              <Badge className="bg-green-100 text-green-800 flex gap-1 items-center px-3 py-1">
                <Leaf className="w-3 h-3" />
                Vegan
              </Badge>
            )}
          </motion.div>

          {/* Description */}
          {product.description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mb-6 max-w-2xl mx-auto"
            >
              <p className="text-base text-gray-700">{product.description}</p>
            </motion.div>
          )}

          {/* Ingredients with Notes */}
          {product.ingredients && product.ingredients.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1 }}
              className="mb-6"
            >
              <h3 className="text-lg font-medium mb-3">Key Ingredients</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {product.ingredients.map((ingredient, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className={`
                      bg-white/50 text-gray-700 flex items-center gap-1
                      ${ingredient.is_controversial ? 'border-red-300' : ''}
                    `}
                  >
                    {ingredient.name}
                    {ingredient.is_controversial && <Info className="w-3 h-3 text-red-500" />}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Expand Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mt-4"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </motion.button>

          {/* Expanded Information */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full mt-8 grid gap-8"
            >
              {/* Product Details Section */}
              {(product.texture || product.finish || product.coverage || product.spf) && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Product Details</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {product.texture && (
                      <Badge variant="outline" className="bg-white/50 text-gray-700">
                        Texture: {product.texture}
                      </Badge>
                    )}
                    {product.finish && (
                      <Badge variant="outline" className="bg-white/50 text-gray-700">
                        Finish: {product.finish}
                      </Badge>
                    )}
                    {product.coverage && (
                      <Badge variant="outline" className="bg-white/50 text-gray-700">
                        Coverage: {product.coverage}
                      </Badge>
                    )}
                    {product.spf && (
                      <Badge variant="outline" className="bg-white/50 text-gray-700">
                        SPF: {product.spf}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Suitability Section */}
              {(product.skin_types?.length > 0 || product.best_for?.length > 0) && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Suitability</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {product.skin_types?.map((type, index) => (
                      <Badge key={`skin-${index}`} variant="outline" className="bg-white/50 text-gray-700">
                        {type}
                      </Badge>
                    ))}
                    {product.best_for?.map((item, index) => (
                      <Badge key={`best-${index}`} variant="outline" className="bg-white/50 text-gray-700">
                        Best for: {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Free Of Section */}
              {product.free_of && product.free_of.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Free Of</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {product.free_of.map((item, index) => (
                      <Badge key={index} variant="outline" className="bg-white/50 text-gray-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};