import { useState } from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/dupe";
import { Heart, Leaf, MapPin, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Get featured resources
  const featuredResources = product.resources?.filter(r => r.is_featured && r.resource) || [];

  // Group ingredients by importance and sensitivity
  const notableIngredients = product.ingredients?.filter(i => i.is_controversial || i.benefits?.length > 0) || [];
  const allIngredients = product.ingredients || [];

  return (
    <div className="container mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16 relative">
      <div className="max-w-4xl mx-auto bg-white/30 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-pink-100/30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center relative"
        >
          {/* Brand & Title Section */}
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
            
            {/* Ratings Display */}
            {product.rating && (
              <div className="flex justify-center items-center gap-2 mb-2">
                <StarRating rating={product.rating} />
                {product.rating_count && (
                  <span className="text-sm text-gray-500">
                    ({product.rating_count.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
            {product.rating_source && (
              <span className="text-xs text-gray-400">via {product.rating_source}</span>
            )}
          </motion.div>

          {/* Product Image with Price Badge */}
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
              
              {/* Price Badge */}
              {product.price && (
                <div className="absolute -right-2 -bottom-2 bg-pink-100 text-pink-800 px-4 py-2 rounded-full font-medium shadow-sm border border-pink-200">
                  ~${Math.round(product.price)}
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Info Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {product.category && (
              <Badge className="bg-violet-50 text-violet-700 px-4 py-2 text-sm rounded-full hover:bg-violet-100 transition-all">
                {product.category}
              </Badge>
            )}
            
            {product.country_of_origin && (
              <Badge className="bg-blue-50 text-blue-700 px-4 py-2 text-sm flex items-center gap-1 rounded-full hover:bg-blue-100 transition-all">
                <MapPin className="w-3.5 h-3.5" />
                <span>{getFlagEmoji(product.country_of_origin)}</span>
                {product.country_of_origin}
              </Badge>
            )}
            
            {product.cruelty_free && (
              <Badge className="bg-purple-50 text-purple-700 flex gap-1 items-center px-4 py-2 text-sm rounded-full hover:bg-purple-100 transition-all">
                <Heart className="w-3.5 h-3.5" />
                Cruelty-Free
              </Badge>
            )}
            
            {product.vegan && (
              <Badge className="bg-green-50 text-green-700 flex gap-1 items-center px-4 py-2 text-sm rounded-full hover:bg-green-100 transition-all">
                <Leaf className="w-3.5 h-3.5" />
                Vegan
              </Badge>
            )}
          </motion.div>

          {/* Key Ingredients Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full mb-8"
          >
            <h3 className="text-xl font-medium mb-4 text-gray-800">Key Ingredients</h3>
            
            <div className="bg-white/70 rounded-xl p-6 shadow-sm mb-2">
              {product.loading_ingredients ? (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse rounded-md bg-gray-200 h-8 w-32"></div>
                </div>
              ) : notableIngredients.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <TooltipProvider>
                    {notableIngredients.map((ingredient, index) => (
                      <IngredientPill 
                        key={`notable-${index}`} 
                        ingredient={ingredient} 
                        className="text-sm px-3 py-1.5"
                      />
                    ))}
                  </TooltipProvider>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-2">No key ingredients information available</p>
              )}
              
              {allIngredients.length > notableIngredients.length && (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAllIngredients(!showAllIngredients)}
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full mt-2 mx-auto flex items-center gap-1"
                >
                  {showAllIngredients ? "Show Less" : "Show All Ingredients"}
                  {showAllIngredients ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
              
              {showAllIngredients && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <h4 className="text-base font-medium mb-3 text-gray-700">All Ingredients</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    <TooltipProvider>
                      {allIngredients.map((ingredient, index) => (
                        <IngredientPill 
                          key={`all-${index}`} 
                          ingredient={ingredient} 
                          className="text-sm"
                        />
                      ))}
                    </TooltipProvider>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Product Details Section (combined) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full mb-8"
          >
            <div className="bg-white/70 rounded-xl p-6 shadow-sm mb-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-gray-800">Product Details</h3>
                  <div className="space-y-2">
                    {product.texture && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Texture:</span>
                        <span className="font-medium text-gray-800">{product.texture}</span>
                      </div>
                    )}
                    {product.finish && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Finish:</span>
                        <span className="font-medium text-gray-800">{product.finish}</span>
                      </div>
                    )}
                    {product.coverage && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-medium text-gray-800">{product.coverage}</span>
                      </div>
                    )}
                    {product.spf && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">SPF:</span>
                        <span className="font-medium text-gray-800">{product.spf}</span>
                      </div>
                    )}
                    {product.longevity_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Longevity:</span>
                        <span className="font-medium text-gray-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {product.longevity_rating}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right Column */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-gray-800">Suitability</h3>
                  
                  {/* Skin Types */}
                  {product.skin_types && product.skin_types.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Skin Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.skin_types.map((type, index) => (
                          <Badge 
                            key={`skin-${index}`} 
                            variant="outline" 
                            className="bg-white text-gray-700 rounded-full"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Best For */}
                  {product.best_for && product.best_for.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Best For:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.best_for.map((item, index) => (
                          <Badge 
                            key={`best-${index}`} 
                            variant="outline" 
                            className="bg-white text-gray-700 rounded-full"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Free Of Section */}
              {product.free_of && product.free_of.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-medium mb-3 text-gray-800">Free Of</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.free_of.map((item, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-white/70 text-gray-700 rounded-full hover:bg-white transition-all"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Description */}
            {product.description && (
              <div className="bg-white/70 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-3 text-gray-800">Description</h3>
                <p className="text-gray-700">
                  {product.description}
                </p>
              </div>
            )}
          </motion.div>

          {/* Reviews Section */}
          {product.reviews && product.reviews.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="w-full mb-8"
            >
              <h3 className="text-xl font-medium mb-4 text-gray-800">Reviews</h3>
              
              <div className="bg-white/70 rounded-xl p-6 shadow-sm mb-2">
                {product.loading_reviews ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-pulse rounded-md bg-gray-200 h-40 w-full"></div>
                  </div>
                ) : (
                  <>
                    <ReviewCard 
                      review={product.reviews[0]} 
                      index={0} 
                    />
                    
                    {product.reviews.length > 1 && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full mt-4 mx-auto flex items-center gap-1"
                      >
                        {showAllReviews ? "Show Less" : `View All ${product.reviews.length} Reviews`}
                        {showAllReviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    )}
                    
                    {showAllReviews && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-6 space-y-6 border-t border-gray-100"
                      >
                        {product.reviews.slice(1).map((review, index) => (
                          <ReviewCard 
                            key={index + 1} 
                            review={review} 
                            index={index + 1} 
                          />
                        ))}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Resources Section */}
          {featuredResources.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-full mb-8"
            >
              <h3 className="text-xl font-medium mb-4 text-gray-800">Content</h3>
              
              <div className="bg-white/70 rounded-xl p-6 shadow-sm mb-2">
                {product.loading_resources ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-pulse rounded-md bg-gray-200 h-60 w-full"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {featuredResources.slice(0, 2).map((resourceItem, index) => (
                        <SocialMediaResource 
                          key={index} 
                          resource={resourceItem.resource} 
                          index={index} 
                        />
                      ))}
                    </div>
                    
                    {featuredResources.length > 2 && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowAllResources(!showAllResources)}
                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full mt-4 mx-auto flex items-center gap-1"
                      >
                        {showAllResources ? "Show Less" : `View All ${featuredResources.length} Resources`}
                        {showAllResources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    )}
                    
                    {showAllResources && featuredResources.length > 2 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-6 border-t border-gray-100"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {featuredResources.slice(2).map((resourceItem, index) => (
                            <SocialMediaResource 
                              key={index + 2} 
                              resource={resourceItem.resource} 
                              index={index + 2} 
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Summary */}
          {product.summary && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="w-full"
            >
              <h3 className="text-xl font-medium mb-3 text-gray-800">Summary</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {product.summary}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};