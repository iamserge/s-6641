import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Leaf, Check, DollarSign, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dupe, EnhancedResource } from "@/types/dupe";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { IngredientPill } from "@/components/dupe/IngredientPill";
import { ReviewCard } from "@/components/dupe/ReviewCard";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
  originalIngredients?: string[];
  originalPrice?: number; // Add original price prop
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

export const DupeCard = ({ dupe, index, originalIngredients, originalPrice, showBottomBar = false }: DupeCardProps) => {
  const [showAllDetails, setShowAllDetails] = useState(false);
  
  // Calculate common ingredients with original product
  const dupeIngredientNames = dupe.ingredients?.map(i => i.name.toLowerCase()) || [];
  
  const commonIngredients = originalIngredients?.filter(ing => 
    dupeIngredientNames.includes(ing.toLowerCase())
  ) || [];
  
  const commonIngredientsPercentage = originalIngredients && originalIngredients.length > 0 
    ? Math.round((commonIngredients.length / originalIngredients.length) * 100)
    : 0;
  
  // Calculate savings percentage on the fly if original price is provided
  const calculatedSavingsPercentage = originalPrice && dupe.price && originalPrice > 0
    ? Math.round(((originalPrice - dupe.price) / originalPrice) * 100)
    : dupe.savings_percentage;
  
  // Notable ingredients (with benefits or safety concerns)
  const notableIngredients = dupe.ingredients?.filter(i => i.is_controversial || i.benefits?.length > 0) || [];
  
  // Beneficial ingredients (with benefits but not controversial)
  const beneficialIngredients = dupe.ingredients?.filter(i => i.benefits?.length > 0 && !i.is_controversial) || [];
  
  // Problematic ingredients
  const problematicIngredients = dupe.ingredients?.filter(i => i.is_controversial) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (index * 0.1), duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 relative bg-white/50 my-6">
        {/* Match Score and Price Banner */}
        <div className="flex justify-between items-center p-5">
          <Badge className="bg-white text-gray-700 font-medium px-4 py-1.5 text-sm rounded-full border border-gray-200">
            {Math.round(dupe.match_score)}% Match
          </Badge>
          
          {dupe.price && (
            <Badge className="bg-white text-gray-700 font-medium px-4 py-1.5 text-sm rounded-full border border-gray-200">
              ~${Math.round(dupe.price)}
              {calculatedSavingsPercentage > 0 && (
                <span className="ml-2 text-green-600">(-{calculatedSavingsPercentage}%)</span>
              )}
            </Badge>
          )}
        </div>
        
        <CardContent className="px-5 pb-6 pt-2">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Circular Image */}
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-white shadow-sm p-1 mx-auto md:mx-0">
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
                <div className="flex items-center justify-center md:justify-start mt-3 mb-2">
                  <StarRating rating={dupe.rating} />
                </div>
              )}
            </div>
            
            {/* Right Column - Product Details */}
            <div className="w-full md:w-3/4 lg:w-4/5">
              {/* Brand & Title */}
              <div className="mb-5">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{dupe.name}</h3>
                <p className="text-base text-gray-600 mb-2">by {dupe.brand}</p>
                
                {/* Notes - Moved directly below brand with no title */}
                {dupe.notes && (
                  <p className="text-base text-gray-700 leading-relaxed mt-3 mb-4">
                    {dupe.notes}
                  </p>
                )}
              </div>
              
              {/* Key Details Section */}
              <div className="mb-5">
                <h4 className="text-base font-medium mb-3 text-gray-800">Key Details</h4>
                <div className="flex flex-wrap gap-2.5">
                  {dupe.texture && (
                    <Badge className="bg-white text-gray-700 px-3 py-1.5 text-sm rounded-full border border-gray-200">
                      Texture: {dupe.texture}
                    </Badge>
                  )}
                  
                  {dupe.finish && (
                    <Badge className="bg-white text-gray-700 px-3 py-1.5 text-sm rounded-full border border-gray-200">
                      Finish: {dupe.finish}
                    </Badge>
                  )}
                  
                  {dupe.coverage && (
                    <Badge className="bg-white text-gray-700 px-3 py-1.5 text-sm rounded-full border border-gray-200">
                      Coverage: {dupe.coverage}
                    </Badge>
                  )}
                  
                  {dupe.cruelty_free && (
                    <Badge className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border border-gray-200">
                      <Heart className="w-3 h-3 text-pink-500" />
                      Cruelty-Free
                    </Badge>
                  )}
                  
                  {dupe.vegan && (
                    <Badge className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border border-gray-200">
                      <Leaf className="w-3 h-3 text-green-500" />
                      Vegan
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Matching Ingredients Section */}
              {commonIngredients.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-base font-medium mb-3 text-gray-800">
                    Matching Ingredients {commonIngredientsPercentage > 0 ? `(${commonIngredientsPercentage}% Match)` : ''}
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {commonIngredients.map((ingredient, i) => (
                      <Badge
                        key={i}
                        className="bg-white text-gray-700 px-3 py-1.5 text-sm rounded-full border border-gray-200 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-green-500" />
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Key Ingredients Section */}
              <div className="mb-5">
                <h4 className="text-base font-medium mb-3 text-gray-800">Key Ingredients</h4>
                {dupe.loading_ingredients ? (
                  <div className="flex py-2">
                    <div className="animate-pulse rounded-full bg-gray-200 h-8 w-24"></div>
                  </div>
                ) : notableIngredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    <TooltipProvider delayDuration={100}>
                      {notableIngredients.map((ingredient, index) => (
                        <IngredientPill 
                          key={`notable-${index}`}
                          ingredient={ingredient} 
                          className="text-sm"
                        />
                      ))}
                    </TooltipProvider>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm py-1">No key ingredients information available</p>
                )}
              </div>
              
              {/* Reviews Preview */}
              {dupe.reviews && dupe.reviews.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-base font-medium mb-3 text-gray-800">Reviews</h4>
                  <div className="text-base italic text-gray-700 leading-relaxed mb-2">
                    "{dupe.reviews[0].review_text}"
                  </div>
                  <div className="flex items-center">
                    <StarRating rating={dupe.reviews[0].rating} />
                    <span className="text-sm text-gray-500 ml-2">{dupe.reviews[0].author_name}</span>
                  </div>
                </div>
              )}
              
              {/* Show More Details Button */}
              <Button 
                variant="outline" 
                onClick={() => setShowAllDetails(!showAllDetails)}
                className="bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full w-full mt-4 flex items-center justify-center gap-1 transition-all duration-200 px-4 py-2 text-sm border border-gray-200"
              >
                {showAllDetails ? "Show Less" : "Show More Details"}
                {showAllDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
              
              {/* Expanded Details */}
              {showAllDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-5 pt-5 border-t border-gray-100 space-y-5"
                >
                  {/* Purchase Options */}
                  {dupe.offers && dupe.offers.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium mb-3 text-gray-800">Where to Buy</h4>
                      <div className="space-y-2.5">
                        {dupe.offers.map((offer, i) => (
                          <a
                            key={i}
                            href={offer.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div>
                              <p className="font-medium">{offer.merchant?.name || "Retailer"}</p>
                              <p className="text-sm text-gray-500">~${Math.round(offer.price)} {offer.condition ? `- ${offer.condition}` : ''}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-600" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Best For Section */}
                  <div>
                    <h4 className="text-base font-medium mb-3 text-gray-800">Suitability</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {dupe.skin_types && dupe.skin_types.length > 0 ? (
                        dupe.skin_types.map((type, index) => (
                          <Badge 
                            key={`skin-${index}`} 
                            className="bg-white text-gray-700 px-3 py-1.5 text-sm rounded-full border border-gray-200"
                          >
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No skin type information</p>
                      )}
                      
                      {dupe.best_for && dupe.best_for.length > 0 && 
                        dupe.best_for.map((item, index) => (
                          <Badge 
                            key={`best-${index}`} 
                            className="bg-white text-gray-700 px-3 py-1.5 text-sm rounded-full border border-gray-200"
                          >
                            {item}
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                  
                  {/* Free Of Section */}
                  {dupe.free_of && dupe.free_of.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium mb-3 text-gray-800">Free Of</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {dupe.free_of.map((item, index) => (
                          <Badge 
                            key={`free-${index}`} 
                            className="bg-white text-gray-700 px-3 py-1.5 text-sm rounded-full border border-gray-200"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Reviews */}
                  {dupe.reviews && dupe.reviews.length > 1 && (
                    <div>
                      <h4 className="text-base font-medium mb-3 text-gray-800">More Reviews</h4>
                      <div className="space-y-4">
                        {dupe.reviews.slice(1).map((review, index) => (
                          <ReviewCard 
                            key={index + 1} 
                            review={review} 
                            index={index + 1} 
                          />
                        ))}
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