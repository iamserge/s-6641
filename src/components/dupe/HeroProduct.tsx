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
  const featuredResources = product.resources;

  // Group ingredients by importance and sensitivity
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
              
             
            </div>
             {/* Price Badge - Positioned on top right of the image but OUTSIDE the overflow hidden container */}
             {product.price && (
                <div className="absolute -top-3 -right-3 bg-white text-gray-800 px-4 py-2 rounded-full font-bold shadow-md border border-gray-100 z-10 hover:shadow-lg transition-all duration-200">
                  ~${Math.round(product.price)}
                </div>
              )}
          </motion.div>

          {/* Main Info Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {product.category && (
              <Badge className="bg-white text-gray-700 px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                {product.category}
              </Badge>
            )}
            
            {product.country_of_origin && (
              <Badge className="bg-white text-gray-700 px-5 py-2.5 text-base flex items-center gap-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{getFlagEmoji(product.country_of_origin)}</span>
                {product.country_of_origin}
              </Badge>
            )}
            
            {product.cruelty_free && (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Heart className="w-4 h-4 text-gray-500" />
                Cruelty-Free
              </Badge>
            )}
            
            {product.vegan && (
              <Badge className="bg-white text-gray-700 flex gap-2 items-center px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium">
                <Leaf className="w-4 h-4 text-gray-500" />
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
                <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Key Ingredients</h3>
            
            <div className="backdrop-blur-sm">
              {product.loading_ingredients ? (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse rounded-full bg-gray-200 h-10 w-40"></div>
                </div>
              ) : notableIngredients.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-3 mb-4 relative">
                  <TooltipProvider delayDuration={100}>
                    {notableIngredients.map((ingredient, index) => (
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
                <p className="text-gray-500 text-center py-2 text-base">No key ingredients information available</p>
              )}
              
              {allIngredients.length > notableIngredients.length && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllIngredients(!showAllIngredients)}
                  className="bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full mt-4 mx-auto flex items-center gap-2 transition-all duration-300 px-6 py-2 font-medium shadow-sm hover:shadow-md border border-gray-200"
                >
                  {showAllIngredients ? "Show Less" : "Show All Ingredients"}
                  {showAllIngredients ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
              
              {showAllIngredients && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 pt-4"
                >
                  <h4 className="text-lg font-medium mb-4 text-gray-700 text-center">All Ingredients</h4>
                  <div className="flex flex-wrap justify-center gap-3 relative">
                    <TooltipProvider delayDuration={100}>
                      {allIngredients.map((ingredient, index) => (
                        <div key={`all-${index}`} className="z-20 relative">
                          <IngredientPill 
                            ingredient={ingredient} 
                            className="text-base px-5 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md"
                          />
                        </div>
                      ))}
                    </TooltipProvider>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Product Details, Suitability, and Free Of Sections in 3 Columns */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full mb-8"
          >
              {/* Product Details Column */}
              <div className="p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Product Details</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {product.texture ? (
                    <Badge className="bg-white text-gray-700 font-[500] px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200">
                      Texture: {product.texture}
                    </Badge>
                  ):null}
                  {product.finish ? (
                    <Badge className="bg-white text-gray-700 font-[500] px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200">
                      Finish: {product.finish}
                    </Badge>
                  ): null}
                  {product.coverage ? (
                    <Badge className="bg-white text-gray-700 font-[500] px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200">
                      Coverage: {product.coverage}
                    </Badge>
                  ): null}
                  {product.spf ? (
                    <Badge className="bg-white text-gray-700 font-[500] px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200">
                      SPF: {product.spf}
                    </Badge>
                  ): null}
                  {product.longevity_rating ? (
                    <Badge className="bg-white text-gray-700 font-[500] px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      Longevity: {product.longevity_rating}/10
                    </Badge>
                  ) : null }
                </div>
              </div>
              
              {/* Suitability Column */}
              <div className="p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 font-[500] text-gray-800 text-center">Suitability</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {product.skin_types && product.skin_types.length > 0 ? (
                    product.skin_types.map((type, index) => (
                      <Badge 
                        key={`skin-${index}`} 
                        className="bg-white text-gray-700 font-[500] px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
                      >
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-base">No skin type information</p>
                  )}
                  
                  {product.best_for && product.best_for.length > 0 && 
                    product.best_for.map((item, index) => (
                      <Badge 
                        key={`best-${index}`} 
                        className="bg-white text-gray-700 font-[500] px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
                      >
                        {item}
                      </Badge>
                    ))
                  }
                </div>
              </div>
              
              {/* Free Of Column */}
              <div className="p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Free Of</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {product.free_of && product.free_of.length > 0 ? (
                    product.free_of.map((item, index) => (
                      <Badge 
                        key={`free-${index}`} 
                        className="bg-white font-[500] text-gray-700 px-5 py-2.5 text-base rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
                      >
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-base">No free-of information</p>
                  )}
                </div>
              </div>
           
            
            {/* Description */}
            {product.description && (
              <div className="p-6 backdrop-blur-sm mt-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Description</h3>
                <p className="text-gray-700">
                  {product.description}
                </p>
              </div>
            )}
          </motion.div>

          {/* Reviews Section
          {product.reviews && product.reviews.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="w-full mb-8"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Reviews</h3>
              
              <div className="p-6 backdrop-blur-sm">
                {product.loading_reviews ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-pulse rounded-xl bg-gray-200 h-40 w-full"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl md:text-4xl text-gray-700 font-light leading-relaxed text-center px-6 mb-4">
                      "{product.reviews[0].review_text}"
                    </div>
                    <div className="flex justify-center">
                      <StarRating rating={product.reviews[0].rating} />
                    </div>
                    <p className="text-center text-gray-500 mt-2">{product.reviews[0].author_name}</p>
                    
                    {product.reviews.length > 1 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full mt-6 mx-auto flex items-center gap-2 transition-all duration-300 px-6 py-2 font-medium shadow-sm hover:shadow-md border border-gray-200"
                      >
                        {showAllReviews ? "Show Less" : `View All ${product.reviews.length} Reviews`}
                        {showAllReviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    )}
                    
                    {showAllReviews && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-6 space-y-6"
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
          )} */}

          {/* Resources Section
          {featuredResources.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-full mb-8"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Content</h3>
              
              <div className="p-6 backdrop-blur-sm">
                {product.loading_resources ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-pulse rounded-xl bg-gray-200 h-60 w-full"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        variant="outline" 
                        onClick={() => setShowAllResources(!showAllResources)}
                        className="bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full mt-6 mx-auto flex items-center gap-2 transition-all duration-300 px-6 py-2 font-medium shadow-sm hover:shadow-md border border-gray-200"
                      >
                        {showAllResources ? "Show Less" : `View All ${featuredResources.length} Resources`}
                        {showAllResources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    )}
                    
                    {showAllResources && featuredResources.length > 2 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          )} */}

          {/* Summary */}
          {product.summary && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="w-full"
            >
              <h3 className="text-xl font-semibold mb-3 text-gray-800 text-center">Summary</h3>
              <div className="p-6 backdrop-blur-sm">
                <p className="text-lg text-gray-700 leading-relaxed font-light text-[24px]">
                  {product.summary}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};