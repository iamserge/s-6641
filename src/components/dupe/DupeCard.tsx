
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Leaf, Check, DollarSign, Star, ExternalLink, ChevronDown, ChevronUp, MapPin, Droplet, Layout, Layers, Shield, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dupe, EnhancedResource, Review } from "@/types/dupe";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { IngredientPill } from "@/components/dupe/IngredientPill";
import { ReviewCard } from "@/components/dupe/ReviewCard";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getFlagEmoji } from "@/lib/utils";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
  originalIngredients?: string[];
  originalPrice?: number;
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
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  
  const dupeIngredientNames = dupe.ingredients?.map(i => i.name.toLowerCase()) || [];
  
  const commonIngredients = originalIngredients?.filter(ing => 
    dupeIngredientNames.includes(ing.toLowerCase())
  ) || [];
  
  const commonIngredientsPercentage = originalIngredients && originalIngredients.length > 0 
    ? Math.round((commonIngredients.length / originalIngredients.length) * 100)
    : 0;
  
  const calculatedSavingsPercentage = originalPrice && dupe.price && originalPrice > 0
    ? Math.round(((originalPrice - dupe.price) / originalPrice) * 100)
    : dupe.savings_percentage;
  
  const notableIngredients = dupe.ingredients?.filter(i => i.is_controversial || i.benefits?.length > 0) || [];
  
  const beneficialIngredients = dupe.ingredients?.filter(i => i.benefits?.length > 0 && !i.is_controversial) || [];
  
  const problematicIngredients = dupe.ingredients?.filter(i => i.is_controversial) || [];

  const nextReview = () => {
    if (dupe.reviews && dupe.reviews.length > 0) {
      setCurrentReviewIndex((prev) => (prev + 1) % dupe.reviews.length);
    }
  };

  const prevReview = () => {
    if (dupe.reviews && dupe.reviews.length > 0) {
      setCurrentReviewIndex((prev) => (prev - 1 + dupe.reviews.length) % dupe.reviews.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (index * 0.1), duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 relative bg-white/50 my-6">
        <div className="flex justify-between items-center p-5">
          <Badge variant="outline" className="bg-white text-gray-700 font-medium px-4 py-1.5 text-sm rounded-full border-gray-200">
            {Math.round(dupe.match_score)}% Match
          </Badge>
          
          {dupe.price ? (
            <Badge variant="outline" className="bg-white text-gray-700 font-medium px-4 py-1.5 text-sm rounded-full border-gray-200">
              ~${Math.round(dupe.price)}
              {calculatedSavingsPercentage > 0 ? (
                <span className="ml-2 text-green-600">(-{calculatedSavingsPercentage}%)</span>
              ) : null}
            </Badge>
          ) : null}
        </div>
        
        <CardContent className="px-5 pb-6 pt-2">
          <div className="flex flex-col md:flex-row gap-6">
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
              
              {dupe.rating && dupe.rating > 0 ? (
                <div className="flex items-center justify-center md:justify-start mt-3 mb-2">
                  <StarRating rating={dupe.rating} />
                </div>
              ) : null}
            </div>
            
            <div className="w-full md:w-3/4 lg:w-4/5">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{dupe.name}</h3>
                <p className="text-base text-gray-600 mb-2">by {dupe.brand}</p>
                
                {dupe.notes ? (
                  <p className="text-base text-gray-700 leading-relaxed mt-3 mb-2">
                    {dupe.notes}
                  </p>
                ) : null}
              </div>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-2.5">
                  {dupe.country_of_origin ? (
                    <Badge variant="outline" className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border-gray-200">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span>{getFlagEmoji(dupe.country_of_origin)}</span>
                      {dupe.country_of_origin}
                    </Badge>
                  ) : null}
                
                  {dupe.texture ? (
                    <Badge variant="outline" className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border-gray-200">
                      <Droplet className="w-3 h-3 text-blue-500" />
                      Texture: {dupe.texture}
                    </Badge>
                  ) : null}
                  
                  {dupe.finish ? (
                    <Badge variant="outline" className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border-gray-200">
                      <Layout className="w-3 h-3 text-purple-500" />
                      Finish: {dupe.finish}
                    </Badge>
                  ) : null}
                  
                  {dupe.coverage ? (
                    <Badge variant="outline" className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border-gray-200">
                      <Layers className="w-3 h-3 text-amber-500" />
                      Coverage: {dupe.coverage}
                    </Badge>
                  ) : null}
                  
                  {dupe.spf && dupe.spf > 0 ? (
                    <Badge variant="outline" className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border-gray-200">
                      <Shield className="w-3 h-3 text-orange-500" />
                      SPF {dupe.spf}
                    </Badge>
                  ) : null}
                  
                  {dupe.longevity_rating && dupe.longevity_rating > 0 ? (
                    <Badge variant="outline" className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border-gray-200">
                      <Clock className="w-3 h-3 text-teal-500" />
                      Longevity: {dupe.longevity_rating}/10
                    </Badge>
                  ) : null}
                  
                  {dupe.cruelty_free ? (
                    <Badge variant="outline" className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border-gray-200">
                      <Heart className="w-3 h-3 text-pink-500" />
                      Cruelty-Free
                    </Badge>
                  ) : null}
                  
                  {dupe.vegan ? (
                    <Badge variant="outline" className="bg-white text-gray-700 flex gap-1 items-center px-3 py-1.5 text-sm rounded-full border-gray-200">
                      <Leaf className="w-3 h-3 text-green-500" />
                      Vegan
                    </Badge>
                  ) : null}
                </div>
              </div>
              
              {commonIngredients.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-base font-medium mb-2 text-gray-800">
                    Matching Ingredients {commonIngredientsPercentage > 0 ? `(${commonIngredientsPercentage}% Match)` : ''}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {commonIngredients.map((ingredient, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-white text-gray-700 px-3 py-1.5 text-sm rounded-full border-gray-200 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-green-500" />
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              
              <div className="mb-4">
                <h4 className="text-base font-medium mb-2 text-gray-800">Key Ingredients</h4>
                {dupe.loading_ingredients ? (
                  <div className="flex py-2">
                    <div className="animate-pulse rounded-full bg-gray-200 h-8 w-24"></div>
                  </div>
                ) : notableIngredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
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

              <div className="grid md:grid-cols-2 gap-4 mt-5">
                {(dupe.skin_types?.length > 0 || dupe.best_for?.length > 0) ? (
                  <div>
                    <h4 className="text-base font-medium mb-2 text-gray-800">Best For</h4>
                    <div className="flex flex-wrap gap-2">
                      {dupe.skin_types && dupe.skin_types.length > 0 ? 
                        dupe.skin_types.map((type, index) => (
                          <Badge 
                            key={`skin-${index}`} 
                            variant="outline" 
                            className="bg-white rounded-full text-gray-700 border-gray-200 px-3 py-1"
                          >
                            {type}
                          </Badge>
                        ))
                      : null}
                      
                      {dupe.best_for && dupe.best_for.length > 0 ? 
                        dupe.best_for.map((item, index) => (
                          <Badge 
                            key={`best-${index}`} 
                            variant="outline" 
                            className="bg-white rounded-full text-gray-700 border-gray-200 px-3 py-1"
                          >
                            {item}
                          </Badge>
                        ))
                      : null}
                    </div>
                  </div>
                ) : null}
                
                {dupe.free_of && dupe.free_of.length > 0 ? (
                  <div>
                    <h4 className="text-base font-medium mb-2 text-gray-800">Free Of</h4>
                    <div className="flex flex-wrap gap-2">
                      {dupe.free_of.map((item, index) => (
                        <Badge 
                          key={`free-${index}`} 
                          variant="outline" 
                          className="bg-white rounded-full text-gray-700 border-gray-200 px-3 py-1"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              
              {dupe.reviews && dupe.reviews.length > 0 ? (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-base font-medium text-gray-800">Reviews</h4>
                    {dupe.reviews.length > 1 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">{currentReviewIndex + 1}/{dupe.reviews.length}</span>
                        <div className="flex">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={prevReview}
                            disabled={dupe.reviews.length <= 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={nextReview}
                            disabled={dupe.reviews.length <= 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="relative">
                    <ReviewCard 
                      review={dupe.reviews[currentReviewIndex]} 
                      index={currentReviewIndex} 
                    />
                  </div>
                </div>
              ) : null}
              
              {dupe.offers && dupe.offers.length > 0 ? (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <h4 className="text-base font-medium mb-3 text-gray-800">Where to Buy</h4>
                  <div className="space-y-2">
                    {dupe.offers.map((offer, i) => (
                      <a
                        key={i}
                        href={offer.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
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
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DupeCard;
