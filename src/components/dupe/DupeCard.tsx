import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Leaf, Check, DollarSign, Droplet, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dupe, EnhancedResource } from "@/types/dupe";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { IngredientPill } from "@/components/dupe/IngredientPill";
import { ReviewCard } from "@/components/dupe/ReviewCard";
import { SocialMediaResource } from "@/components/dupe/SocialMediaResource";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
  originalIngredients?: string[];
  showBottomBar?: boolean;
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

export const DupeCard = ({ dupe, index, originalIngredients, showBottomBar = false }: DupeCardProps) => {
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
  
  // Calculate common ingredients with original product
  const dupeIngredientNames = dupe.ingredients?.map(i => i.name.toLowerCase()) || [];
  
  const commonIngredients = originalIngredients?.filter(ing => 
    dupeIngredientNames.includes(ing.toLowerCase())
  ) || [];
  
  const commonIngredientsPercentage = originalIngredients && originalIngredients.length > 0 
    ? Math.round((commonIngredients.length / originalIngredients.length) * 100)
    : 0;
  
  // Notable ingredients (with benefits or safety concerns)
  const notableIngredients = dupe.ingredients?.filter(i => i.is_controversial || i.benefits?.length > 0) || [];
  
  // Beneficial ingredients (with benefits but not controversial)
  const beneficialIngredients = dupe.ingredients?.filter(i => i.benefits?.length > 0 && !i.is_controversial) || [];
  
  // Problematic ingredients
  const problematicIngredients = dupe.ingredients?.filter(i => i.is_controversial) || [];
  
  // Featured resources
  const featuredResources = dupe.resources?.filter(r => r.is_featured && r.resource) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (index * 0.1), duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full bg-white/50 backdrop-blur-sm border-0 overflow-hidden shadow-sm rounded-2xl">
        {/* Match Score and Savings Banner */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-violet-50 to-pink-50 border-b border-violet-100/30">
          <div className="flex items-center gap-3">
            <Badge variant="pastelPurple" className="px-4 py-2 text-base rounded-full font-medium">
              {Math.round(dupe.match_score)}% Match
            </Badge>
            
            {dupe.savings_percentage > 0 && (
              <Badge variant="pastelGreen" className="px-4 py-2 text-base gap-1.5 flex items-center rounded-full font-medium">
                <DollarSign className="w-4 h-4" />
                Save {Math.round(dupe.savings_percentage)}%
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column - Circular Image */}
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-white shadow-sm p-1.5 mx-auto md:mx-0 relative">
                <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                  <CategoryImage 
                    category={dupe.category}
                    imageUrl={dupe.image_url}
                    name={dupe.name}
                    className="object-contain w-full h-full p-1.5"
                  />
                </div>
                
                {/* Price Badge */}
                {dupe.price && (
                  <div className="absolute -right-2 -bottom-2 bg-pink-100 text-pink-800 px-3 py-1.5 text-sm rounded-full font-medium shadow-sm border border-pink-200">
                    ~${Math.round(dupe.price)}
                  </div>
                )}
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
              {/* Brand & Title */}
              <div className="mb-4">
                <h3 className="text-2xl font-semibold text-violet-700 mb-1">{dupe.name}</h3>
                <p className="text-lg font-medium text-gray-700">{dupe.brand}</p>
              </div>
              
              {/* Feature Badges */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {commonIngredientsPercentage > 0 && (
                  <Badge className="bg-blue-50 text-blue-700 px-3 py-1.5 text-sm flex items-center gap-1.5 rounded-full font-medium">
                    <Check className="w-3.5 h-3.5" />
                    {commonIngredientsPercentage}% Formula Match
                  </Badge>
                )}
                
                {dupe.cruelty_free && (
                  <Badge className="bg-purple-50 text-purple-700 px-3 py-1.5 text-sm flex items-center gap-1.5 rounded-full font-medium">
                    <Heart className="w-3.5 h-3.5" />
                    Cruelty-Free
                  </Badge>
                )}
                
                {dupe.vegan && (
                  <Badge className="bg-green-50 text-green-700 px-3 py-1.5 text-sm flex items-center gap-1.5 rounded-full font-medium">
                    <Leaf className="w-3.5 h-3.5" />
                    Vegan
                  </Badge>
                )}
                
                {dupe.finish && (
                  <Badge className="bg-pink-50 text-pink-700 px-3 py-1.5 text-sm rounded-full font-medium">
                    {dupe.finish} Finish
                  </Badge>
                )}
                
                {dupe.texture && (
                  <Badge className="bg-amber-50 text-amber-700 px-3 py-1.5 text-sm flex items-center gap-1.5 rounded-full font-medium">
                    <Droplet className="w-3.5 h-3.5" />
                    {dupe.texture}
                  </Badge>
                )}
              </div>
              
              {/* Key Ingredients Section */}
              <div className="mb-6">
                <h4 className="text-base font-medium text-gray-700 mb-3">Key Ingredients:</h4>
                
                {dupe.loading_ingredients ? (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50/50 rounded-lg">
                    <div className="animate-pulse rounded-md bg-gray-200 h-8 w-32"></div>
                  </div>
                ) : notableIngredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 bg-white/30 p-3 rounded-lg">
                    <TooltipProvider>
                      {/* Problematic ingredients */}
                      {problematicIngredients.map((ingredient, index) => (
                        <IngredientPill
                          key={`problem-${index}`}
                          ingredient={ingredient}
                          className="text-sm"
                        />
                      ))}
                      
                      {/* Beneficial ingredients */}
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
                  <p className="text-sm text-gray-500 bg-white/30 p-3 rounded-lg">
                    No ingredient information available
                  </p>
                )}
                
                {dupe.ingredients && dupe.ingredients.length > notableIngredients.length && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAllIngredients(!showAllIngredients)}
                    className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-full mt-2 flex items-center gap-1 text-sm px-3 py-1"
                  >
                    {showAllIngredients ? "Hide All Ingredients" : "Show All Ingredients"}
                    {showAllIngredients ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                )}
                
                {showAllIngredients && dupe.ingredients && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 bg-white/30 p-3 rounded-lg"
                  >
                    <div className="flex flex-wrap gap-2">
                      <TooltipProvider>
                        {dupe.ingredients.map((ingredient, index) => (
                          <IngredientPill
                            key={index}
                            ingredient={ingredient}
                            className="text-xs"
                          />
                        ))}
                      </TooltipProvider>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Product Notes */}
              {dupe.notes && (
                <div className="mb-6 bg-white/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{dupe.notes}</p>
                </div>
              )}
              
              {/* Purchase Options Preview */}
              {dupe.offers && dupe.offers.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base font-medium text-gray-700 mb-3">Where to Buy:</h4>
                  <div className="bg-white/30 p-3 rounded-lg">
                    <a
                      href={dupe.offers[0].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{dupe.offers[0].merchant?.name || "Retailer"}</p>
                        <p className="text-sm text-gray-500">~${Math.round(dupe.offers[0].price)} {dupe.offers[0].condition && `- ${dupe.offers[0].condition}`}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-violet-600" />
                    </a>
                    
                    {dupe.offers.length > 1 && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowAllDetails(!showAllDetails)}
                        className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-full mt-2 flex items-center gap-1 text-sm px-3 py-1"
                      >
                        {showAllDetails ? "Hide Options" : `Show ${dupe.offers.length - 1} More Options`}
                        {showAllDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Show More Details Section */}
              <Button 
                variant="outline" 
                onClick={() => setShowAllDetails(!showAllDetails)}
                className="w-full bg-white hover:bg-purple-50 text-violet-700 hover:text-violet-800 border-violet-200 rounded-full flex items-center justify-center gap-1"
              >
                {showAllDetails ? "Show Less" : "Show More Details"}
                {showAllDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              {/* Expanded Details */}
              {showAllDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 pt-6 border-t border-gray-100 space-y-6"
                >
                  {/* Additional Purchase Options */}
                  {dupe.offers && dupe.offers.length > 1 && (
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">All Purchase Options:</h4>
                      <div className="bg-white/30 p-3 rounded-lg space-y-2">
                        {dupe.offers.slice(1).map((offer, i) => (
                          <a
                            key={i + 1}
                            href={offer.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div>
                              <p className="font-medium">{offer.merchant?.name || "Retailer"}</p>
                              <p className="text-sm text-gray-500">~${Math.round(offer.price)} {offer.condition && `- ${offer.condition}`}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-violet-600" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Product Details and Suitability Section */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Product Details */}
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Product Details:</h4>
                      <div className="bg-white/30 p-4 rounded-lg">
                        {dupe.texture && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600">Texture:</span>
                            <span className="font-medium">{dupe.texture}</span>
                          </div>
                        )}
                        {dupe.finish && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600">Finish:</span>
                            <span className="font-medium">{dupe.finish}</span>
                          </div>
                        )}
                        {dupe.coverage && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600">Coverage:</span>
                            <span className="font-medium">{dupe.coverage}</span>
                          </div>
                        )}
                        {dupe.spf && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600">SPF:</span>
                            <span className="font-medium">{dupe.spf}</span>
                          </div>
                        )}
                        {dupe.longevity_rating && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600">Longevity:</span>
                            <span className="font-medium">{dupe.longevity_rating}/10</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Suitability */}
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Best For:</h4>
                      <div className="bg-white/30 p-4 rounded-lg">
                        {dupe.skin_types && dupe.skin_types.length > 0 ? (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">Skin Types:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {dupe.skin_types.map((type, i) => (
                                <Badge key={i} variant="outline" className="rounded-full bg-white text-sm">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No skin type information available</p>
                        )}
                        
                        {dupe.best_for && dupe.best_for.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Concerns:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {dupe.best_for.map((item, i) => (
                                <Badge key={i} variant="outline" className="rounded-full bg-white text-sm">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Free Of Section */}
                  {dupe.free_of && dupe.free_of.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Free Of:</h4>
                      <div className="bg-white/30 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-1.5">
                          {dupe.free_of.map((item, i) => (
                            <Badge key={i} variant="outline" className="rounded-full bg-white text-sm">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Common Ingredients */}
                  {commonIngredients.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Common Ingredients with Original:</h4>
                      <div className="bg-white/30 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-1.5">
                          {commonIngredients.map((ingredient, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 rounded-full flex items-center hover:bg-green-100 transition-all px-3 py-1.5 text-sm"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Reviews Preview */}
                  {dupe.reviews && dupe.reviews.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Reviews:</h4>
                      <div className="bg-white/30 p-4 rounded-lg">
                        <ReviewCard review={dupe.reviews[0]} index={0} />
                        
                        {dupe.reviews.length > 1 && (
                          <p className="text-sm text-violet-600 hover:text-violet-700 mt-2 text-center">
                            {dupe.reviews.length - 1} more {dupe.reviews.length - 1 === 1 ? 'review' : 'reviews'} available
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Resources Preview */}
                  {featuredResources.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Content:</h4>
                      <div className="bg-white/30 p-4 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {featuredResources.slice(0, 2).map((resourceItem, index) => (
                            <SocialMediaResource 
                              key={index} 
                              resource={resourceItem.resource as EnhancedResource} 
                              index={index}
                            />
                          ))}
                        </div>
                        
                        {featuredResources.length > 2 && (
                          <p className="text-sm text-violet-600 hover:text-violet-700 mt-3 text-center">
                            {featuredResources.length - 2} more {featuredResources.length - 2 === 1 ? 'resource' : 'resources'} available
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DupeCard;