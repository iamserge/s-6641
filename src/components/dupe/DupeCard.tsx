import { motion } from "framer-motion";
import { ExternalLink, Heart, Leaf, Info, Check, DollarSign, Droplet, Shield, AlertTriangle, Star, MessageSquare } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dupe, Review, ProductResource, EnhancedResource } from "@/types/dupe";
import { CategoryImage } from "./CategoryImage";
import { useState } from "react";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
  originalIngredients?: string[]; // Added to compare ingredients
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
            <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Verified</Badge>
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

// Resource Preview component (for social media and videos)
const ResourcePreview = ({ resource }: { resource: EnhancedResource }) => {
  let icon;
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";

  switch(resource.type) {
    case "Instagram":
      icon = <i className="fab fa-instagram text-white text-xl" />;
      bgColor = "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500";
      textColor = "text-white";
      break;
    case "TikTok":
      icon = <i className="fab fa-tiktok text-white text-xl" />;
      bgColor = "bg-black";
      textColor = "text-white";
      break;
    case "YouTube":
      icon = <i className="fab fa-youtube text-white text-xl" />;
      bgColor = "bg-red-600";
      textColor = "text-white";
      break;
    case "Article":
      icon = <i className="fas fa-newspaper text-gray-800 text-xl" />;
      break;
    default:
      icon = <ExternalLink className="w-5 h-5 text-gray-600" />;
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-transform transform group-hover:scale-102">
        <div className="relative aspect-video">
          {resource.video_thumbnail ? (
            <img 
              src={resource.video_thumbnail} 
              alt={resource.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${bgColor} flex items-center justify-center`}>
              {icon}
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
  
  const savingsAmount = dupe.savings_percentage ? (dupe.price / (1 - dupe.savings_percentage / 100)) - dupe.price : 0;
  const dupeIngredientNames = dupe.ingredients?.map(i => i.name.toLowerCase()) || [];
  const commonIngredients = originalIngredients?.filter(ing => dupeIngredientNames.includes(ing.toLowerCase())) || [];
  const commonIngredientsCount = commonIngredients.length;
  const commonIngredientsPercentage = originalIngredients && originalIngredients.length > 0 
    ? Math.round((commonIngredientsCount / originalIngredients.length) * 100) 
    : 0;

  // Find potentially problematic ingredients
  const problematicIngredients = dupe.ingredients?.filter(i => i.is_controversial) || [];
  
  // Filter featured resources
  const featuredResources = dupe.resources?.filter(r => r.is_featured && r.resource) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="w-full"
    >
      <Card className="w-full bg-white/50 backdrop-blur-sm border-[#0EA5E9]/20 overflow-hidden shadow-lg">
        {/* Add top badges row */}
        <div className="flex justify-between items-center p-3 bg-gray-50/50 border-b border-gray-100">
          <Badge className="bg-[#0EA5E9] text-white px-4 py-1 text-base">
            {dupe.match_score}% Match
          </Badge>
          {dupe.savings_percentage && (
            <Badge className="bg-green-100 text-green-700 px-4 py-1 gap-1 flex items-center">
              <DollarSign className="w-3 h-3" />
              Save ~${Math.round(savingsAmount)} ({dupe.savings_percentage}%)
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Left Column - Image and Ratings */}
            <div className="w-full md:w-1/5 flex flex-col items-center gap-3">
              <div className="relative aspect-square w-full max-w-[140px]">
                <CategoryImage
                  category={dupe.category}
                  imageUrl={dupe.image_url}
                  images={dupe.images}
                  alt={dupe.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Ratings if available */}
              {dupe.rating && (
                <div className="flex flex-col items-center">
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
            <div className="w-full md:w-4/5">
              {/* Brand, Title, and Price */}
              <div className="flex flex-col md:flex-row items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-medium">{dupe.brand}</h3>
                  <h4 className="text-lg text-gray-600 mb-2">{dupe.name}</h4>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-[#0EA5E9]">~${Math.round(dupe.price)}</span>
                </div>
              </div>

              {/* Key Product Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {dupe.cruelty_free && (
                  <Badge className="bg-purple-100 text-purple-800 flex gap-1 items-center px-3 py-1">
                    <Heart className="w-3 h-3" />
                    Cruelty-Free
                  </Badge>
                )}
                
                {dupe.vegan && (
                  <Badge className="bg-green-100 text-green-800 flex gap-1 items-center px-3 py-1">
                    <Leaf className="w-3 h-3" />
                    Vegan
                  </Badge>
                )}
                
                {commonIngredientsCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 flex gap-1 items-center px-3 py-1">
                    <Check className="w-3 h-3" />
                    {commonIngredientsPercentage}% Formula Match
                  </Badge>
                )}

                {dupe.texture && (
                  <Badge className="bg-pink-100 text-pink-800 flex gap-1 items-center px-3 py-1">
                    <Droplet className="w-3 h-3" />
                    {dupe.texture}
                  </Badge>
                )}
                
                {dupe.finish && (
                  <Badge className="bg-yellow-100 text-yellow-800 flex gap-1 items-center px-3 py-1">
                    {dupe.finish}
                  </Badge>
                )}
              </div>
              
              {/* Highlighted Ingredients - Especially Problematic */}
              {problematicIngredients.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">Note-worthy ingredients:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {problematicIngredients.map((ingredient, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"
                      >
                        {ingredient.name}
                        <Info className="w-3 h-3 text-amber-500" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview of social media content if available */}
              {featuredResources.length > 0 && !isExpanded && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Popular content:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {featuredResources.slice(0, 2).map((resourceItem, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-white text-gray-700 border-gray-200 flex items-center gap-1"
                        // href={resourceItem.resource?.url}
                        // target="_blank"
                        rel="noopener noreferrer"
                      >
                        {resourceItem.resource?.type === "Instagram" && "Instagram"}
                        {resourceItem.resource?.type === "TikTok" && "TikTok"}
                        {resourceItem.resource?.type === "YouTube" && "YouTube"}
                        {resourceItem.resource?.type === "Article" && "Article"}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                    {featuredResources.length > 2 && (
                      <Badge
                        variant="outline"
                        className="bg-white text-blue-600 border-blue-200 cursor-pointer"
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

              {/* Show More Button */}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-gray-500 hover:text-[#0EA5E9] transition-colors mt-2 flex items-center gap-1"
                aria-expanded={isExpanded}
              >
                {isExpanded ? 'Less Details' : 'More Details'}
                <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Expanded Content - Using height animation for smoother transitions */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {/* Tabs - simplified with fixed height to prevent layout shift */}
                  <div className="border-b border-gray-200 mb-4 flex">
                    <nav className="flex space-x-4 flex-wrap">
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`py-1 px-3 border-b-2 font-medium text-sm rounded-t-md ${
                          activeTab === 'details' 
                            ? 'border-[#0EA5E9] text-[#0EA5E9] bg-blue-50/30' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className={`py-1 px-3 border-b-2 font-medium text-sm rounded-t-md ${
                          activeTab === 'reviews' 
                            ? 'border-[#0EA5E9] text-[#0EA5E9] bg-blue-50/30' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Reviews {dupe.reviews?.length ? `(${dupe.reviews.length})` : ''}
                      </button>
                      <button
                        onClick={() => setActiveTab('resources')}
                        className={`py-1 px-3 border-b-2 font-medium text-sm rounded-t-md ${
                          activeTab === 'resources' 
                            ? 'border-[#0EA5E9] text-[#0EA5E9] bg-blue-50/30' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Content {dupe.resources?.length ? `(${dupe.resources.length})` : ''}
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content - using fixed height containers to prevent layout shift */}
                  <div className="min-h-[200px]">
                    {activeTab === 'details' && (
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
                                  className="bg-green-50 text-green-700 border-green-200 flex items-center"
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
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700">
                                  {type}
                                </Badge>
                              ))}
                              {dupe.best_for?.map((item, i) => (
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700">
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
                                <Badge key={i} variant="outline" className="bg-white/50 text-gray-700">
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
                                  className="flex items-center justify-between p-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  <div>
                                    <p className="font-medium">{offer.merchant.name}</p>
                                    <p className="text-xs text-gray-500">~${Math.round(offer.price)} {offer.condition && `- ${offer.condition}`}</p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-[#0EA5E9]" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'reviews' && (
                      <div>
                        {dupe.reviews && dupe.reviews.length > 0 ? (
                          <div className="space-y-4">
                            {dupe.reviews.map((review, index) => (
                              <ReviewCard key={index} review={review} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No reviews available for this product yet.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'resources' && (
                      <div>
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
                            <p className="text-gray-500">No videos or articles available for this product yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Purchase Button only on mobile */}
              <div className="md:hidden mt-4">
                {dupe.purchase_link && (
                  <motion.a
                    href={dupe.purchase_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/90 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Shop Now <ExternalLink className="ml-2 h-4 w-4" />
                  </motion.a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DupeCard;