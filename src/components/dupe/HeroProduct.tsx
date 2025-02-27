
import { useState, useMemo } from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/dupe";
import { Heart, Leaf, MapPin, Clock, Info, Star, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
import { getFlagEmoji } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { IngredientPill } from "@/components/dupe/IngredientPill";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReviewCard } from "@/components/dupe/ReviewCard";
import { SocialMediaResource } from "@/components/dupe/SocialMediaResource";

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
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-4 h-4 text-yellow-400" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-yellow-400" />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

export const HeroProduct = ({ product }: HeroProductProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'resources'>('details');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get featured resources
  const featuredResources = useMemo(() => 
    product.resources?.filter(r => r.is_featured && r.resource) || [], 
    [product.resources]
  );
  
  // Get YouTube resources for background
  const youtubeResources = useMemo(() => 
    featuredResources.filter(r => r.resource?.type === 'YouTube' || r.resource?.url.includes('youtube.com')) || [], 
    [featuredResources]
  );
  
  // Group ingredients by importance and sensitivity
  const notableIngredients = useMemo(() => 
    product.ingredients?.filter(i => i.is_controversial || i.benefits?.length > 0) || [], 
    [product.ingredients]
  );
  
  const problematicIngredients = useMemo(() => 
    product.ingredients?.filter(i => i.is_controversial) || [], 
    [product.ingredients]
  );
  
  const beneficialIngredients = useMemo(() => 
    product.ingredients?.filter(i => i.benefits?.length > 0 && !i.is_controversial) || [], 
    [product.ingredients]
  );
  
  // Background YouTube video if available
  const backgroundVideoId = useMemo(() => {
    if (youtubeResources.length > 0) {
      const url = youtubeResources[0].resource?.url;
      if (url) {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
      }
    }
    return null;
  }, [youtubeResources]);
  
  return (
    <div className="container mx-auto px-4 pt-24 pb-8 md:pt-32 md:pb-16 relative">
      {/* YouTube Background Video */}
      {backgroundVideoId && (
        <div className="absolute inset-0 overflow-hidden -z-10 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8F3FF] to-white z-20"></div>
          <div className="absolute inset-0 z-10"></div>
          <iframe
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%]"
            src={`https://www.youtube.com/embed/${backgroundVideoId}?autoplay=1&controls=0&loop=1&mute=1&playlist=${backgroundVideoId}`}
            title="Background Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center relative z-10"
        >
          {/* Brand & Title Section */}
          <motion.div className="w-full mb-8">
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.3 }}
              className="text-2xl font-light text-gray-600 mb-2"
            >
              {product.brand}
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2"
            >
              {product.name}
            </motion.h1>
            
            {/* Ratings Display */}
            {product.rating && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.5 }}
                className="flex justify-center items-center gap-2 mb-6"
              >
                <StarRating rating={product.rating} />
                {product.rating_count && (
                  <span className="text-sm text-gray-500">({product.rating_count.toLocaleString()} reviews)</span>
                )}
                {product.rating_source && (
                  <span className="text-xs text-gray-400">via {product.rating_source}</span>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Product Image - Circular Design - Now Larger */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8 relative"
          >
            <div className="w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden bg-white shadow-lg p-1 mx-auto md:mx-0">
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                <CategoryImage 
                  category={product.category}
                  imageUrl={product.image_url}
                  name={product.name}
                  className="object-contain w-full h-full p-1"
                />
              </div>
            </div>
          </motion.div>

          {/* Primary Info Pills - Now Larger */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-3 mb-6"
          >
            {product.category && (
              <Badge variant="secondary" className="bg-white/50 backdrop-blur-sm text-gray-700 px-5 py-1.5 text-sm rounded-full hover:bg-white/80 transition-all">
                {product.category}
              </Badge>
            )}
            
            {product.price && (
              <Badge variant="secondary" className="bg-[#d2c9f9] text-[#5840c0] px-5 py-1.5 text-sm rounded-full hover:bg-[#c1b4f6] transition-all">
                ${Math.round(product.price)}
              </Badge>
            )}
            
            {product.country_of_origin && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-5 py-1.5 text-sm flex items-center gap-1 rounded-full hover:bg-blue-100 transition-all">
                <MapPin className="w-3 h-3" />
                <span>{getFlagEmoji(product.country_of_origin)}</span>
                {product.country_of_origin}
              </Badge>
            )}
            
            {product.longevity_rating && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 px-5 py-1.5 text-sm flex items-center gap-1 rounded-full hover:bg-amber-100 transition-all">
                <Clock className="w-3 h-3" />
                Longevity: {product.longevity_rating}/10
              </Badge>
            )}
          </motion.div>

          {/* Key Status Pills - Now Larger */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-3 mb-6"
          >
            {product.cruelty_free && (
              <Badge className="bg-purple-50 text-purple-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-purple-100 transition-all">
                <Heart className="w-3 h-3" />
                Cruelty-Free
              </Badge>
            )}
            
            {product.vegan && (
              <Badge className="bg-green-50 text-green-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-green-100 transition-all">
                <Leaf className="w-3 h-3" />
                Vegan
              </Badge>
            )}
            
            {product.finish && (
              <Badge className="bg-pink-50 text-pink-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-pink-100 transition-all">
                {product.finish} Finish
              </Badge>
            )}
            
            {product.coverage && (
              <Badge className="bg-indigo-50 text-indigo-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-indigo-100 transition-all">
                {product.coverage} Coverage
              </Badge>
            )}
          </motion.div>

          {/* Notable Ingredients Section - No Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="mb-6 max-w-2xl mx-auto"
          >
            <h3 className="text-lg font-medium mb-3">Key Ingredients</h3>
            
            {product.loading_ingredients ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#9b87f5] mb-2" />
                <p className="text-sm text-gray-500">Loading ingredients...</p>
              </div>
            ) : notableIngredients.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                <TooltipProvider>
                  {/* Problematic Ingredients */}
                  {problematicIngredients.map((ingredient, index) => (
                    <IngredientPill 
                      key={`problem-${index}`}
                      ingredient={ingredient}
                      className="text-sm"
                    />
                  ))}
                  
                  {/* Beneficial Ingredients */}
                  {beneficialIngredients.map((ingredient, index) => (
                    <IngredientPill 
                      key={`benefit-${index}`}
                      ingredient={ingredient}
                      className="text-sm"
                    />
                  ))}
                </TooltipProvider>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-2">No key ingredients information available</p>
            )}
          </motion.div>

          {/* Description Section */}
          {product.description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mb-6 max-w-2xl mx-auto"
            >
              <p className="text-base text-gray-700">
                {product.description}
              </p>
            </motion.div>
          )}

          {/* Show More / Show Less Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full flex justify-center my-8"
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 px-6 py-2 rounded-full"
            >
              {isExpanded ? "Show Less" : "Show More Details"}
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </motion.div>

          {/* Tabs Section - Hidden until Show More is clicked */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl mx-auto mt-4"
            >
              <Tabs defaultValue="details" className="w-full" onValueChange={(val) => setActiveTab(val as any)}>
                <TabsList className="grid grid-cols-3 mb-4 rounded-lg">
                  <TabsTrigger value="details" className="rounded-md">Details</TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="rounded-md"
                    disabled={product.loading_reviews}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            Reviews {product.reviews?.length ? `(${product.reviews.length})` : ''}
                            {product.loading_reviews && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                          </div>
                        </TooltipTrigger>
                        {product.loading_reviews && (
                          <TooltipContent>
                            <p className="text-xs">Loading reviews...</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resources" 
                    className="rounded-md"
                    disabled={product.loading_resources}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            Content {featuredResources.length ? `(${featuredResources.length})` : ''}
                            {product.loading_resources && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                          </div>
                        </TooltipTrigger>
                        {product.loading_resources && (
                          <TooltipContent>
                            <p className="text-xs">Loading content...</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-2">
                  <div className="grid gap-4">
                    {/* All Ingredients Section - Now with Tooltips */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">All Ingredients</h3>
                      {product.loading_ingredients ? (
                        <div className="flex flex-col items-center justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-[#9b87f5] mb-2" />
                          <p className="text-sm text-gray-500">Loading ingredients...</p>
                        </div>
                      ) : product.ingredients && product.ingredients.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-2">
                          <TooltipProvider>
                            {product.ingredients.map((ingredient, index) => (
                              <IngredientPill 
                                key={index}
                                ingredient={ingredient}
                                className="px-3 py-1 text-sm"
                              />
                            ))}
                          </TooltipProvider>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-2">No ingredients information available</p>
                      )}
                    </div>
                    
                    {/* Product Details Section */}
                    {(product.texture || product.finish || product.coverage || product.spf) && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Product Details</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {product.texture && (
                            <Badge variant="outline" className="rounded-full bg-white/50 text-gray-700 px-3 py-1 text-sm hover:bg-white transition-all">
                              Texture: {product.texture}
                            </Badge>
                          )}
                          {product.finish && (
                            <Badge variant="outline" className="rounded-full bg-white/50 text-gray-700 px-3 py-1 text-sm hover:bg-white transition-all">
                              Finish: {product.finish}
                            </Badge>
                          )}
                          {product.coverage && (
                            <Badge variant="outline" className="rounded-full bg-white/50 text-gray-700 px-3 py-1 text-sm hover:bg-white transition-all">
                              Coverage: {product.coverage}
                            </Badge>
                          )}
                          {product.spf && (
                            <Badge variant="outline" className="rounded-full bg-white/50 text-gray-700 px-3 py-1 text-sm hover:bg-white transition-all">
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
                            <Badge key={`skin-${index}`} variant="outline" className="rounded-full bg-white/50 text-gray-700 px-3 py-1 text-sm hover:bg-white transition-all">
                              {type}
                            </Badge>
                          ))}
                          {product.best_for?.map((item, index) => (
                            <Badge key={`best-${index}`} variant="outline" className="rounded-full bg-white/50 text-gray-700 px-3 py-1 text-sm hover:bg-white transition-all">
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
                            <Badge key={index} variant="outline" className="rounded-full bg-white/50 text-gray-700 px-3 py-1 text-sm hover:bg-white transition-all">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-2">
                  {product.loading_reviews ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#9b87f5] mb-4" />
                      <p className="text-gray-500">Loading reviews...</p>
                    </div>
                  ) : product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {product.reviews.slice(0, 3).map((review, index) => (
                        <ReviewCard key={index} review={review} index={index} />
                      ))}
                      {product.reviews.length > 3 && (
                        <button className="text-sm text-[#5840c0] hover:text-[#4330a0] mt-1 hover:underline">
                          See all {product.reviews.length} reviews
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No reviews available yet.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="resources" className="mt-2">
                  {product.loading_resources ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#9b87f5] mb-4" />
                      <p className="text-gray-500">Loading content...</p>
                    </div>
                  ) : featuredResources.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {featuredResources.map((resourceItem, index) => (
                        <SocialMediaResource 
                          key={index} 
                          resource={resourceItem.resource}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No content available yet.</p>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
