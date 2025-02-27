
import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/dupe";
import { Heart, Leaf, MapPin, Clock, ChevronDown, Info, Star, ExternalLink } from 'lucide-react';
import { getFlagEmoji } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryImage } from "@/components/dupe/CategoryImage";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Process description for show more/less functionality
  const description = product.description || '';
  const shortDescription = description.length > 150 ? `${description.substring(0, 150)}...` : description;
  
  // Filter featured resources
  const featuredResources = product.resources?.filter(r => r.is_featured && r.resource) || [];
  
  return (
    <div className="container mx-auto px-4 pt-24 pb-8 md:pt-32 md:pb-16">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
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

          {/* Product Image - Circular Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8 relative"
          >
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden bg-white shadow-lg p-3 mx-auto">
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                <CategoryImage 
                  category={product.category}
                  imageUrl={product.image_url}
                  alt={product.name}
                  className="object-contain w-full h-full p-4"
                />
              </div>
            </div>
          </motion.div>

          {/* Primary Info Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {product.category && (
              <Badge variant="secondary" className="bg-white/50 backdrop-blur-sm text-gray-700 px-4 py-1 rounded-full">
                {product.category}
              </Badge>
            )}
            
            {product.price && (
              <Badge variant="secondary" className="bg-[#9b87f5] text-white px-4 py-1 rounded-full">
                ${Math.round(product.price)}
              </Badge>
            )}
            
            {product.country_of_origin && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-1 flex items-center gap-1 rounded-full">
                <MapPin className="w-3 h-3" />
                <span>{getFlagEmoji(product.country_of_origin)}</span>
                {product.country_of_origin}
              </Badge>
            )}
            
            {product.longevity_rating && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 px-4 py-1 flex items-center gap-1 rounded-full">
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
              <Badge className="bg-purple-100 text-purple-800 flex gap-1 items-center px-3 py-1 rounded-full">
                <Heart className="w-3 h-3" />
                Cruelty-Free
              </Badge>
            )}
            
            {product.vegan && (
              <Badge className="bg-green-100 text-green-800 flex gap-1 items-center px-3 py-1 rounded-full">
                <Leaf className="w-3 h-3" />
                Vegan
              </Badge>
            )}
            
            {product.finish && (
              <Badge className="bg-pink-100 text-pink-800 flex gap-1 items-center px-3 py-1 rounded-full">
                {product.finish} Finish
              </Badge>
            )}
            
            {product.coverage && (
              <Badge className="bg-indigo-100 text-indigo-800 flex gap-1 items-center px-3 py-1 rounded-full">
                {product.coverage} Coverage
              </Badge>
            )}
          </motion.div>

          {/* Description with Show More/Less */}
          {description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mb-6 max-w-2xl mx-auto bg-white/70 backdrop-blur-sm p-4 rounded-xl"
            >
              <p className="text-base text-gray-700">
                {showFullDescription ? description : shortDescription}
                {description.length > 150 && (
                  <button 
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="ml-2 text-blue-500 hover:text-blue-700 font-medium"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </p>
            </motion.div>
          )}

          {/* Ingredients Section */}
          {product.ingredients && product.ingredients.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1 }}
              className="mb-6 max-w-2xl mx-auto bg-white/70 backdrop-blur-sm p-4 rounded-xl"
            >
              <h3 className="text-lg font-medium mb-3">Key Ingredients</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {product.ingredients.map((ingredient, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className={`
                      rounded-full bg-white/50 text-gray-700 flex items-center gap-1
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

          {/* Featured Resources Preview */}
          {featuredResources.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mb-6 max-w-2xl mx-auto w-full"
            >
              <h3 className="text-lg font-medium mb-4">Related Content</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {featuredResources.slice(0, 3).map((resourceItem, index) => (
                  <a
                    key={index}
                    href={resourceItem.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-white/70 backdrop-blur-sm px-3 py-2 rounded-full border border-gray-100 hover:bg-white transition-colors gap-2"
                  >
                    <Badge variant="outline" className="rounded-full bg-[#9b87f5]/10 border-[#9b87f5]/30 text-[#9b87f5]">
                      {resourceItem.resource.type}
                    </Badge>
                    <span className="text-sm truncate max-w-[200px]">{resourceItem.resource.title}</span>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                ))}
              </div>
              {featuredResources.length > 3 && !isExpanded && (
                <button 
                  className="text-sm text-blue-500 hover:text-blue-700 mt-2 hover:underline mx-auto block"
                  onClick={() => setIsExpanded(true)}
                >
                  View more content
                </button>
              )}
            </motion.div>
          )}

          {/* Expand Button with Tabs for Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="w-full"
          >
            {!isExpanded ? (
              <button
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mx-auto"
                onClick={() => setIsExpanded(true)}
                aria-expanded={isExpanded}
              >
                Show More Details
                <ChevronDown className="w-4 h-4" />
              </button>
            ) : (
              <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm p-4 rounded-xl mt-6">
                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mx-auto mb-4"
                  onClick={() => setIsExpanded(false)}
                  aria-expanded={isExpanded}
                >
                  Show Less
                  <ChevronDown className="w-4 h-4 transform rotate-180" />
                </button>
                
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4 rounded-lg bg-gray-50/80">
                    <TabsTrigger value="details" className="rounded-md">Details</TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-md">Reviews</TabsTrigger>
                    <TabsTrigger value="resources" className="rounded-md">Content</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-2">
                    <div className="grid gap-4">
                      {/* Product Details Section */}
                      {(product.texture || product.finish || product.coverage || product.spf) && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">Product Details</h3>
                          <div className="flex flex-wrap justify-center gap-2">
                            {product.texture && (
                              <Badge variant="outline" className="rounded-full bg-white/50 text-gray-700">
                                Texture: {product.texture}
                              </Badge>
                            )}
                            {product.finish && (
                              <Badge variant="outline" className="rounded-full bg-white/50 text-gray-700">
                                Finish: {product.finish}
                              </Badge>
                            )}
                            {product.coverage && (
                              <Badge variant="outline" className="rounded-full bg-white/50 text-gray-700">
                                Coverage: {product.coverage}
                              </Badge>
                            )}
                            {product.spf && (
                              <Badge variant="outline" className="rounded-full bg-white/50 text-gray-700">
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
                              <Badge key={`skin-${index}`} variant="outline" className="rounded-full bg-white/50 text-gray-700">
                                {type}
                              </Badge>
                            ))}
                            {product.best_for?.map((item, index) => (
                              <Badge key={`best-${index}`} variant="outline" className="rounded-full bg-white/50 text-gray-700">
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
                              <Badge key={index} variant="outline" className="rounded-full bg-white/50 text-gray-700">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="mt-2">
                    {product.reviews && product.reviews.length > 0 ? (
                      <div>
                        {product.reviews.slice(0, 3).map((review, index) => (
                          <div key={index} className="bg-white/80 p-3 rounded-lg mb-3 text-left">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-sm">{review.author_name || "Anonymous"}</p>
                              <StarRating rating={review.rating} />
                            </div>
                            <p className="text-sm text-gray-700 italic">"{review.review_text}"</p>
                            {review.source && (
                              <p className="text-xs text-gray-500 mt-1">via {review.source}</p>
                            )}
                          </div>
                        ))}
                        {product.reviews.length > 3 && (
                          <button className="text-sm text-blue-500 hover:text-blue-700 mt-1 hover:underline">
                            See all {product.reviews.length} reviews
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No reviews available yet.</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="resources" className="mt-2">
                    {featuredResources.length > 0 ? (
                      <div className="grid gap-3">
                        {featuredResources.map((resourceItem, index) => (
                          <a
                            key={index}
                            href={resourceItem.resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between bg-white/80 p-3 rounded-lg hover:bg-white transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Badge className="rounded-full bg-[#9b87f5] text-white">
                                {resourceItem.resource.type}
                              </Badge>
                              <span className="text-sm">{resourceItem.resource.title}</span>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No content available yet.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
