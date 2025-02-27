import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Heart, Leaf, Check, DollarSign, Droplet, Star, MessageSquare, ChevronDown, AlertTriangle } from 'lucide-react';
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
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-zinc-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#0EA5E9] text-white px-4 py-1.5 text-sm rounded-full">
              {dupe.match_score}% Match
            </Badge>
            
            {dupe.savings_percentage && (
              <Badge className="bg-green-50 text-green-700 px-4 py-1.5 text-sm gap-1 flex items-center rounded-full">
                <DollarSign className="w-3 h-3" />
                Save ${savingsAmount} ({dupe.savings_percentage}%)
              </Badge>
            )}
          </div>
          
          {/* Buy Now button - desktop only */}
          <div className="hidden md:block">
            {dupe.purchase_link && (
              <a 
                href={dupe.purchase_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#0EA5E9] rounded-full hover:bg-[#0EA5E9]/90 transition-colors"
              >
                Buy Now <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        
        <CardContent className="p-4 md:p-6 relative">
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

          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            {/* Left Column - Circular Image */}
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="w-36 h-36 rounded-full overflow-hidden bg-white shadow-sm p-1 mx-auto md:mx-0">
                <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                  <CategoryImage 
                    category={dupe.category}
                    imageUrl={dupe.image_url}
                    name={dupe.name}
                    className="object-contain w-full h-full p-1"
                  />
                </div>
              </div>
              
              {/* Ratings if available */}
              {dupe.rating && (
                <div className="flex flex-col items-center mt-3">
                  <StarRating rating={dupe.rating} />
                  {dupe.rating_count && (
                    <span className="text-xs text-gray-500 mt-1">
                      {dupe.rating_count.toLocaleString()} reviews
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Right Column - Product Details */}
            <div className="w-full md:w-3/4 lg:w-4/5">
              {/* Brand & Title with Price */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <div>
                  <p className="text-lg font-medium text-gray-900">{dupe.brand}</p>
                  <h3 className="text-xl font-semibold text-[#0EA5E9]">{dupe.name}</h3>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-2xl font-bold text-[#0EA5E9]">${Math.round(dupe.price)}</span>
                </div>
              </div>
              
              {/* Feature Badges */}
              <div className="flex flex-wrap gap-2 my-3">
                {dupe.cruelty_free && (
                  <Badge className="bg-purple-50 text-purple-700 rounded-full px-3 py-1 text-sm flex items-center gap-1 hover:bg-purple-100 transition-all">
                    <Heart className="w-3 h-3" />
                    Cruelty-Free
                  </Badge>
                )}
                
                {dupe.vegan && (
                  <Badge className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-sm flex items-center gap-1 hover:bg-green-100 transition-all">
                    <Leaf className="w-3 h-3" />
                    Vegan
                  </Badge>
                )}
                
                {commonIngredientsCount > 0 && (
                  <Badge className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm flex items-center gap-1 hover:bg-blue-100 transition-all">
                    <Check className="w-3 h-3" />
                    {commonIngredientsPercentage}% Formula Match
                  </Badge>
                )}

                {dupe.finish && (
                  <Badge className="bg-pink-50 text-pink-700 rounded-full px-3 py-1 text-sm hover:bg-pink-100 transition-all">
                    {dupe.finish} Finish
                  </Badge>
                )}
                
                {dupe.texture && (
                  <Badge className="bg-yellow-50 text-yellow-700 rounded-full px-3 py-1 text-sm flex items-center gap-1 hover:bg-yellow-100 transition-all">
                    <Droplet className="w-3 h-3" />
                    {dupe.texture}
                  </Badge>
                )}
              </div>
              
              {/* Notable/Sensitive Ingredients as Pills */}
              {notableIngredients.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Ingredients:</p>
                  <div className="flex flex-wrap gap-2">
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
                </div>
              )}
              
              {/* Preview of social media content if available */}
              {featuredResources.length > 0 && !isExpanded && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Related content:</p>
                  <div className="flex flex-wrap gap-2">
                    {featuredResources.slice(0, 2).map((resourceItem, i) => (
                      <a
                        key={i}
                        href={resourceItem.resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-white text-gray-700 border-gray-200 border px-3 py-1 rounded-full hover:bg-gray-50 transition-colors gap-1"
                      >
                        {resourceItem.resource.type}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ))}
                    {featuredResources.length > 2 && (
                      <Badge
                        variant="outline"
                        className="bg-white text-blue-600 border-blue-200 cursor-pointer rounded-full"
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
              )}
              
              {/* Description Snippet */}
              {dupe.description && !isExpanded && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {dupe.description}
                </p>
              )}

              {/* Collapsed/Expanded toggle - centered */}
              <div className="flex justify-center mt-4">
                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "Show Less" : "Show More"}
                  <ChevronDown className={`w-4 h-4 transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                </button>
              </div>

              {/* Mobile Buy Now - only shown on mobile */}
              <div className="flex md:hidden justify-center mt-4">
                {dupe.purchase_link && (
                  <a 
                    href={dupe.purchase_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#0EA5E9] rounded-full hover:bg-[#0EA5E9]/90 transition-colors"
                  >
                    Buy Now <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                )}
              </div>

              {/* Expanded content with tabs */}
              {isExpanded && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Tabs defaultValue={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
                    <TabsList className="bg-gray-50/70 rounded-lg">
                      <TabsTrigger value="details" className="rounded-md">Details</TabsTrigger>
                      <TabsTrigger value="reviews" className="rounded-md">
                        Reviews {dupe.reviews?.length ? `(${dupe.reviews.length})` : ''}
                      </TabsTrigger>
                      <TabsTrigger value="resources" className="rounded-md">
                        Content {dupe.resources?.length ? `(${dupe.resources.length})` : ''}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-4">
                      <div className="grid gap-y-4">
                        {/* Description in full */}
                        {dupe.description && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Description:</h5>
                            <p className="text-sm text-gray-700">{dupe.description}</p>
                          </div>
                        )}
                        
                        {/* All Ingredients */}
                        {dupe.ingredients && dupe.ingredients.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">All Ingredients:</h5>
                            <div className="flex flex-wrap gap-2">
                              <TooltipProvider>
                                {dupe.ingredients.map((ingredient, index) => (
                                  <IngredientPill
                                    key={index}
                                    ingredient={ingredient}
                                  />
                                ))}
                              </TooltipProvider>
                            </div>
                          </div>
                        )}
                        
                        {/* Common Ingredients */}
                        {commonIngredients.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Common Ingredients with Original:</h5>
                            <div className="flex flex-wrap gap-2">
                              {commonIngredients.map((ingredient, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 rounded-full flex items-center hover:bg-green-100 transition-all"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  {ingredient}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Suitability */}
                        {(dupe.skin_types?.length > 0 || dupe.best_for?.length > 0) && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Best For:</h5>
                            <div className="flex flex-wrap gap-2">
                              {dupe.skin_types?.map((type, i) => (
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full hover:bg-white transition-all">
                                  {type}
                                </Badge>
                              ))}
                              {dupe.best_for?.map((item, i) => (
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full hover:bg-white transition-all">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Free Of */}
                        {dupe.free_of && dupe.free_of.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Free Of:</h5>
                            <div className="flex flex-wrap gap-2">
                              {dupe.free_of.map((item, i) => (
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full hover:bg-white transition-all">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Purchase Options */}
                        {dupe.offers && dupe.offers.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Where to Buy:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {dupe.offers.slice(0, 4).map((offer, i) => (
                                <a
                                  key={i}
                                  href={offer.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  <div>
                                    <p className="font-medium">{offer.merchant?.name || "Retailer"}</p>
                                    <p className="text-xs text-gray-500">~${Math.round(offer.price)} {offer.condition && `- ${offer.condition}`}</p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-[#0EA5E9]" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-4">
                      {dupe.reviews && dupe.reviews.length > 0 ? (
                        <div className="space-y-4">
                          {dupe.reviews.slice(0, 3).map((review, index) => (
                            <ReviewCard key={index} review={review} index={index} />
                          ))}
                          {dupe.reviews.length > 3 && (
                            <button className="text-sm text-[#5840c0] hover:text-[#4330a0] hover:underline">
                              View all {dupe.reviews.length} reviews
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No reviews available for this product yet.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="resources" className="mt-4">
                      {dupe.resources && dupe.resources.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {dupe.resources.map((resourceItem, index) => (
                            <SocialMediaResource 
                              key={index} 
                              resource={resourceItem.resource as EnhancedResource} 
                              index={index}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
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