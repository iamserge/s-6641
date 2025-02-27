
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Heart, Leaf, Check, DollarSign, Droplet, Star, MessageSquare, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dupe, Review, EnhancedResource } from "@/types/dupe";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { IngredientPill } from "@/components/dupe/IngredientPill";
import { ReviewCard } from "@/components/dupe/ReviewCard";
import { SocialMediaResource } from "@/components/dupe/SocialMediaResource";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
  originalIngredients?: string[]; // For comparing with original product
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

export const DupeCard = ({ dupe, index, originalIngredients }: DupeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'resources'>('details');
  
  // Calculate savings
  const savingsAmount = dupe.savings_percentage 
    ? Math.round((dupe.price / (1 - dupe.savings_percentage / 100)) - dupe.price) 
    : 0;
  
  // Calculate common ingredients with original product
  const dupeIngredientNames = useMemo(() => 
    dupe.ingredients?.map(i => i.name.toLowerCase()) || [], 
    [dupe.ingredients]
  );
  
  const commonIngredients = useMemo(() => 
    originalIngredients?.filter(ing => 
      dupeIngredientNames.includes(ing.toLowerCase())
    ) || [], 
    [originalIngredients, dupeIngredientNames]
  );
  
  const commonIngredientsCount = commonIngredients.length;
  const commonIngredientsPercentage = originalIngredients && originalIngredients.length > 0 
    ? Math.round((commonIngredientsCount / originalIngredients.length) * 100)
    : 0;
  
  // Find potentially problematic ingredients
  const problematicIngredients = useMemo(() => 
    dupe.ingredients?.filter(i => i.is_controversial) || [], 
    [dupe.ingredients]
  );
  
  // Notable ingredients (with benefits or safety concerns)
  const notableIngredients = useMemo(() => 
    dupe.ingredients?.filter(i => i.is_controversial || i.benefits?.length > 0) || [], 
    [dupe.ingredients]
  );
  
  // Beneficial ingredients (with benefits but not controversial)
  const beneficialIngredients = useMemo(() => 
    dupe.ingredients?.filter(i => i.benefits?.length > 0 && !i.is_controversial) || [], 
    [dupe.ingredients]
  );
  
  // Filter featured resources
  const featuredResources = useMemo(() => 
    dupe.resources?.filter(r => r.is_featured && r.resource) || [], 
    [dupe.resources]
  );

  // Get YouTube resources for potential background
  const youtubeResources = useMemo(() => 
    featuredResources.filter(r => 
      r.resource?.type === 'YouTube' || 
      (r.resource?.url && r.resource.url.includes('youtube.com'))
    ) || [], 
    [featuredResources]
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (index * 0.1), duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full bg-white/50 backdrop-blur-sm border-gray-100/50 overflow-hidden shadow-md rounded-3xl">
        {/* Top badges row - Aligned side by side */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-zinc-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Badge className="bg-[#0EA5E9] text-white px-5 py-2 text-sm rounded-full">
              {dupe.match_score}% Match
            </Badge>
            
            {dupe.savings_percentage && (
              <Badge className="bg-green-50 text-green-700 px-5 py-2 text-sm gap-1.5 flex items-center rounded-full">
                <DollarSign className="w-3.5 h-3.5" />
                Save ${savingsAmount} ({dupe.savings_percentage}%)
              </Badge>
            )}
          </div>
          
          {/* Buy Now button is removed as requested */}
        </div>
        
        <CardContent className="p-6 md:p-8 lg:p-10 relative">
          {/* YouTube video background if available */}
          {backgroundVideoId && isExpanded && (
            <div className="absolute inset-0 overflow-hidden -z-10 opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-white to-white/80 z-20"></div>
              <iframe
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%]"
                src={`https://www.youtube.com/embed/${backgroundVideoId}?autoplay=1&controls=0&loop=1&mute=1&playlist=${backgroundVideoId}`}
                title="Background Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8 relative z-10">
            {/* Left Column - Circular Image */}
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="w-40 h-40 md:w-44 md:h-44 rounded-full overflow-hidden bg-white shadow-sm p-1.5 mx-auto md:mx-0">
                <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                  <CategoryImage 
                    category={dupe.category}
                    imageUrl={dupe.image_url}
                    name={dupe.name}
                    className="object-contain w-full h-full p-1.5"
                  />
                </div>
              </div>
              
              {/* Ratings if available */}
              {dupe.rating && (
                <div className="flex flex-col items-center mt-4">
                  <StarRating rating={dupe.rating} />
                  {dupe.rating_count && (
                    <span className="text-xs text-gray-500 mt-1.5">
                      {dupe.rating_count.toLocaleString()} reviews
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Right Column - Product Details */}
            <div className="w-full md:w-3/4 lg:w-4/5">
              {/* Brand & Title with Price */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">{dupe.brand}</p>
                  <h3 className="text-2xl font-semibold text-[#0EA5E9]">{dupe.name}</h3>
                </div>
                <div className="mt-3 md:mt-0">
                  <span className="text-2xl font-bold text-[#0EA5E9]">${Math.round(dupe.price)}</span>
                </div>
              </div>
              
              {/* Feature Badges */}
              <div className="flex flex-wrap gap-2.5 my-4">
                {dupe.cruelty_free && (
                  <Badge className="bg-purple-50 text-purple-700 rounded-full px-4 py-1.5 text-sm flex items-center gap-1.5 hover:bg-purple-100 transition-all">
                    <Heart className="w-3.5 h-3.5" />
                    Cruelty-Free
                  </Badge>
                )}
                
                {dupe.vegan && (
                  <Badge className="bg-green-50 text-green-700 rounded-full px-4 py-1.5 text-sm flex items-center gap-1.5 hover:bg-green-100 transition-all">
                    <Leaf className="w-3.5 h-3.5" />
                    Vegan
                  </Badge>
                )}
                
                {commonIngredientsCount > 0 && (
                  <Badge className="bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm flex items-center gap-1.5 hover:bg-blue-100 transition-all">
                    <Check className="w-3.5 h-3.5" />
                    {commonIngredientsPercentage}% Formula Match
                  </Badge>
                )}

                {dupe.finish && (
                  <Badge className="bg-pink-50 text-pink-700 rounded-full px-4 py-1.5 text-sm hover:bg-pink-100 transition-all">
                    {dupe.finish} Finish
                  </Badge>
                )}
                
                {dupe.texture && (
                  <Badge className="bg-yellow-50 text-yellow-700 rounded-full px-4 py-1.5 text-sm flex items-center gap-1.5 hover:bg-yellow-100 transition-all">
                    <Droplet className="w-3.5 h-3.5" />
                    {dupe.texture}
                  </Badge>
                )}
              </div>
              
              {/* Notable/Sensitive Ingredients as Pills */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-3">Key Ingredients:</p>
                
                {dupe.loading_ingredients ? (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50/50 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-[#9b87f5]" />
                    <span className="text-sm text-gray-500">Loading ingredients...</span>
                  </div>
                ) : notableIngredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 p-2.5 bg-gray-50/30 rounded-lg">
                    <TooltipProvider>
                      {/* Problematic ingredients */}
                      {problematicIngredients.map((ingredient, index) => (
                        <IngredientPill
                          key={`problem-${index}`}
                          ingredient={ingredient}
                          className="bg-rose-50/50 text-rose-700 border-rose-200"
                        />
                      ))}
                      
                      {/* Beneficial ingredients */}
                      {beneficialIngredients.map((ingredient, index) => (
                        <IngredientPill
                          key={`benefit-${index}`}
                          ingredient={ingredient}
                          className="bg-emerald-50/50 text-emerald-700 border-emerald-200"
                        />
                      ))}
                    </TooltipProvider>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-2 px-3 bg-gray-50/30 rounded-lg">No ingredient information available</p>
                )}
              </div>
              
              {/* Preview of social media content if available - Moved above the "Show More" button */}
              {dupe.loading_resources ? (
                <div className="mb-5 bg-gray-50/30 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 px-3 pt-3 mb-2">Related content:</p>
                  <div className="flex items-center gap-2 p-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[#9b87f5]" />
                    <span className="text-sm text-gray-500">Loading content...</span>
                  </div>
                </div>
              ) : featuredResources.length > 0 && !isExpanded ? (
                <div className="mb-5 bg-gray-50/30 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 px-3 pt-3 mb-2">Related content:</p>
                  <div className="flex flex-wrap gap-2.5 p-3">
                    {featuredResources.slice(0, 2).map((resourceItem, i) => (
                      <a
                        key={i}
                        href={resourceItem.resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-white text-gray-700 border-gray-200 border px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors gap-1.5"
                      >
                        {resourceItem.resource.type}
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    ))}
                    {featuredResources.length > 2 && (
                      <Badge
                        variant="outline"
                        className="bg-white text-blue-600 border-blue-200 cursor-pointer rounded-full px-4 py-1.5"
                        onClick={() => {
                          setIsExpanded(true);
                          setActiveTab('resources');
                        }}
                      >
                        +{featuredResources.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              ) : !isExpanded && (
                <div className="mb-5 bg-gray-50/30 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 px-3 pt-3 mb-2">Related content:</p>
                  <p className="text-sm text-gray-500 p-3">No content available</p>
                </div>
              )}
              
              {/* Description Snippet */}
              {dupe.description && !isExpanded && (
                <p className="text-sm text-gray-600 mb-5 line-clamp-2 bg-gray-50/30 p-3 rounded-lg">
                  {dupe.description}
                </p>
              )}

              {/* Collapsed/Expanded toggle - centered */}
              <div className="flex justify-center mt-5">
                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors bg-gray-50 px-5 py-2 rounded-full"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "Show Less" : "Show More"}
                  <ChevronDown className={`w-4 h-4 transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                </button>
              </div>

              {/* Buy Now button is removed */}

              {/* Expanded content with tabs */}
              {isExpanded && (
                <div className="mt-8 pt-5 border-t border-gray-100">
                  <Tabs defaultValue={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
                    <TabsList className="bg-gray-50/70 rounded-lg p-1">
                      <TabsTrigger value="details" className="rounded-md px-5 py-2">Details</TabsTrigger>
                      <TabsTrigger 
                        value="reviews" 
                        className="rounded-md px-5 py-2"
                        disabled={dupe.loading_reviews}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5">
                                Reviews {dupe.reviews?.length ? `(${dupe.reviews.length})` : ''}
                                {dupe.loading_reviews && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
                              </div>
                            </TooltipTrigger>
                            {dupe.loading_reviews && (
                              <TooltipContent>
                                <p className="text-xs">Loading reviews...</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="resources" 
                        className="rounded-md px-5 py-2"
                        disabled={dupe.loading_resources}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5">
                                Content {featuredResources.length ? `(${featuredResources.length})` : ''}
                                {dupe.loading_resources && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
                              </div>
                            </TooltipTrigger>
                            {dupe.loading_resources && (
                              <TooltipContent>
                                <p className="text-xs">Loading content...</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-6">
                      <div className="grid gap-y-6">
                        {/* All Ingredients */}
                        <div className="bg-white/70 p-4 rounded-xl shadow-sm">
                          <h5 className="text-base font-medium text-gray-700 mb-3">All Ingredients:</h5>
                          {dupe.loading_ingredients ? (
                            <div className="flex items-center justify-center gap-2 py-6">
                              <Loader2 className="w-6 h-6 animate-spin text-[#9b87f5]" />
                              <span className="text-sm text-gray-500">Loading ingredients...</span>
                            </div>
                          ) : dupe.ingredients && dupe.ingredients.length > 0 ? (
                            <div className="flex flex-wrap gap-2.5 p-2">
                              <TooltipProvider>
                                {dupe.ingredients.map((ingredient, index) => (
                                  <IngredientPill
                                    key={index}
                                    ingredient={ingredient}
                                  />
                                ))}
                              </TooltipProvider>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 py-3">No ingredients information available</p>
                          )}
                        </div>
                        
                        {/* Common Ingredients */}
                        {commonIngredients.length > 0 && (
                          <div className="bg-white/70 p-4 rounded-xl shadow-sm">
                            <h5 className="text-base font-medium text-gray-700 mb-3">Common Ingredients with Original:</h5>
                            <div className="flex flex-wrap gap-2.5 p-2">
                              {commonIngredients.map((ingredient, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 rounded-full flex items-center hover:bg-green-100 transition-all px-3 py-1.5"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1.5" />
                                  {ingredient}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Suitability */}
                        {(dupe.skin_types?.length > 0 || dupe.best_for?.length > 0) && (
                          <div className="bg-white/70 p-4 rounded-xl shadow-sm">
                            <h5 className="text-base font-medium text-gray-700 mb-3">Best For:</h5>
                            <div className="flex flex-wrap gap-2.5 p-2">
                              {dupe.skin_types?.map((type, i) => (
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full hover:bg-white transition-all px-3 py-1.5">
                                  {type}
                                </Badge>
                              ))}
                              {dupe.best_for?.map((item, i) => (
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full hover:bg-white transition-all px-3 py-1.5">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Free Of */}
                        {dupe.free_of && dupe.free_of.length > 0 && (
                          <div className="bg-white/70 p-4 rounded-xl shadow-sm">
                            <h5 className="text-base font-medium text-gray-700 mb-3">Free Of:</h5>
                            <div className="flex flex-wrap gap-2.5 p-2">
                              {dupe.free_of.map((item, i) => (
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full hover:bg-white transition-all px-3 py-1.5">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Purchase Options */}
                        {dupe.offers && dupe.offers.length > 0 && (
                          <div className="bg-white/70 p-4 rounded-xl shadow-sm">
                            <h5 className="text-base font-medium text-gray-700 mb-3">Where to Buy:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                              {dupe.offers.slice(0, 4).map((offer, i) => (
                                <a
                                  key={i}
                                  href={offer.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  <div>
                                    <p className="font-medium">{offer.merchant?.name || "Retailer"}</p>
                                    <p className="text-sm text-gray-500">~${Math.round(offer.price)} {offer.condition && `- ${offer.condition}`}</p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-[#0EA5E9]" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-6">
                      {dupe.loading_reviews ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white/70 rounded-xl shadow-sm">
                          <Loader2 className="w-8 h-8 animate-spin text-[#9b87f5] mb-4" />
                          <p className="text-gray-500">Loading reviews...</p>
                        </div>
                      ) : dupe.reviews && dupe.reviews.length > 0 ? (
                        <div className="space-y-5 bg-white/70 p-4 rounded-xl shadow-sm">
                          {dupe.reviews.slice(0, 3).map((review, index) => (
                            <ReviewCard key={index} review={review} index={index} />
                          ))}
                          {dupe.reviews.length > 3 && (
                            <button className="text-sm text-[#5840c0] hover:text-[#4330a0] hover:underline px-3 py-2 w-full text-center">
                              View all {dupe.reviews.length} reviews
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-white/70 rounded-xl shadow-sm">
                          <p className="text-gray-500">No reviews available for this product yet.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="resources" className="mt-6">
                      {dupe.loading_resources ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white/70 rounded-xl shadow-sm">
                          <Loader2 className="w-8 h-8 animate-spin text-[#9b87f5] mb-4" />
                          <p className="text-gray-500">Loading content...</p>
                        </div>
                      ) : dupe.resources && dupe.resources.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white/70 p-4 rounded-xl shadow-sm">
                          {dupe.resources.map((resourceItem, index) => (
                            <SocialMediaResource 
                              key={index} 
                              resource={resourceItem.resource as EnhancedResource} 
                              index={index}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-white/70 rounded-xl shadow-sm">
                          <p className="text-gray-500">No content available for this product yet.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DupeCard;
