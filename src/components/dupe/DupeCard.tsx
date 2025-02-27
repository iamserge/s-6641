
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Heart, Leaf, Info, Check, DollarSign, Droplet, Shield, AlertTriangle, Star, MessageSquare } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dupe, Review, ProductResource, EnhancedResource } from "@/types/dupe";
import { CategoryImage } from "@/components/dupe/CategoryImage";

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

// Review component
const ReviewCard = ({ review }: { review: Review }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-100 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          {review.author_avatar ? (
            <img 
              src={review.author_avatar} 
              alt={review.author_name || "Reviewer"} 
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{review.author_name || "Anonymous"}</p>
            {review.source && (
              <p className="text-xs text-gray-500">via {review.source}</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <StarRating rating={review.rating} />
          {review.verified_purchase && (
            <Badge className="ml-2 bg-green-100 text-green-700 text-xs rounded-full">Verified</Badge>
          )}
        </div>
      </div>
      <div className="relative">
        <p className="text-sm text-gray-700 italic">
          "{review.review_text}"
        </p>
      </div>
    </div>
  );
};

// Resource Preview component
const ResourcePreview = ({ resource }: { resource: EnhancedResource }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";

  switch(resource.type) {
    case "Instagram":
      bgColor = "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500";
      textColor = "text-white";
      break;
    case "TikTok":
      bgColor = "bg-black";
      textColor = "text-white";
      break;
    case "YouTube":
      bgColor = "bg-red-600";
      textColor = "text-white";
      break;
    case "Article":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-transform transform group-hover:shadow-md group-hover:scale-[1.02]">
        <div className="relative aspect-video">
          {resource.video_thumbnail ? (
            <img 
              src={resource.video_thumbnail} 
              alt={resource.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${bgColor} flex items-center justify-center`}>
              <span className={`${textColor} font-medium`}>{resource.type}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
          {resource.video_duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
              {resource.video_duration}
            </div>
          )}
          <div className={`absolute top-2 left-2 ${bgColor} ${textColor} text-xs px-2 py-1 rounded-full`}>
            {resource.type}
          </div>
        </div>
        <div className="p-3">
          <h4 className="text-sm font-medium line-clamp-2 mb-1">{resource.title}</h4>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{resource.author_name}</span>
            {(resource.views_count !== undefined || resource.likes_count !== undefined) && (
              <div className="flex items-center gap-2">
                {resource.views_count !== undefined && (
                  <span>{resource.views_count.toLocaleString()} views</span>
                )}
                {resource.likes_count !== undefined && (
                  <span>{resource.likes_count.toLocaleString()} likes</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
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
  
  // Filter featured resources
  const featuredResources = useMemo(() => 
    dupe.resources?.filter(r => r.is_featured && r.resource) || [], 
    [dupe.resources]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (index * 0.1), duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full bg-white/50 backdrop-blur-sm border-gray-100/50 overflow-hidden shadow-md rounded-3xl">
        {/* Top badges row */}
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <Badge className="bg-[#0EA5E9] text-white px-4 py-1 text-base rounded-full">
            {dupe.match_score}% Match
          </Badge>
          {dupe.savings_percentage && (
            <Badge className="bg-green-100 text-green-700 px-4 py-1 gap-1 flex items-center rounded-full">
              <DollarSign className="w-3 h-3" />
              Save ${savingsAmount} ({dupe.savings_percentage}%)
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Circular Image */}
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-sm p-2 mx-auto md:mx-0">
                <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                  <CategoryImage 
                    category={dupe.category}
                    imageUrl={dupe.image_url}
                    alt={dupe.name}
                    className="object-contain w-full h-full p-2"
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
                  <Badge className="bg-purple-100 text-purple-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Cruelty-Free
                  </Badge>
                )}
                
                {dupe.vegan && (
                  <Badge className="bg-green-100 text-green-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Vegan
                  </Badge>
                )}
                
                {commonIngredientsCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {commonIngredientsPercentage}% Formula Match
                  </Badge>
                )}

                {dupe.finish && (
                  <Badge className="bg-pink-100 text-pink-800 rounded-full px-3 py-1">
                    {dupe.finish} Finish
                  </Badge>
                )}
                
                {dupe.texture && (
                  <Badge className="bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Droplet className="w-3 h-3" />
                    {dupe.texture}
                  </Badge>
                )}
              </div>
              
              {/* Warning for Controversial Ingredients */}
              {problematicIngredients.length > 0 && (
                <div className="flex items-center gap-2 mb-3 bg-amber-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-amber-700">
                    Contains ingredients that may cause sensitivity
                  </span>
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
              {dupe.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {dupe.description}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Show Less' : 'Show More'}
                </Button>
                
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
                        {/* Common Ingredients */}
                        {commonIngredients.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Common Ingredients with Original:</h5>
                            <div className="flex flex-wrap gap-2">
                              {commonIngredients.map((ingredient, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 rounded-full flex items-center"
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
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full">
                                  {type}
                                </Badge>
                              ))}
                              {dupe.best_for?.map((item, i) => (
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full">
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
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700 rounded-full">
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
                            <ReviewCard key={index} review={review} />
                          ))}
                          {dupe.reviews.length > 3 && (
                            <button className="text-sm text-blue-500 hover:text-blue-700 hover:underline">
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
                            <ResourcePreview 
                              key={index} 
                              resource={resourceItem.resource as EnhancedResource} 
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

export default DupeCard;
