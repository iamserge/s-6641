import { motion } from "framer-motion";
import { ExternalLink, Heart, Leaf, Info, Check, DollarSign, Droplet, Shield, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dupe } from "@/types/dupe";
import { CategoryImage } from "./CategoryImage";
import { useState } from "react";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
  originalIngredients?: string[]; // Added to compare ingredients
}

export const DupeCard = ({ dupe, index, originalIngredients }: DupeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const savingsAmount = dupe.savings_percentage ? (dupe.price / (1 - dupe.savings_percentage / 100)) - dupe.price : 0;
  const dupeIngredientNames = dupe.ingredients?.map(i => i.name.toLowerCase()) || [];
  const commonIngredients = originalIngredients?.filter(ing => dupeIngredientNames.includes(ing.toLowerCase())) || [];
  const commonIngredientsCount = commonIngredients.length;
  const commonIngredientsPercentage = originalIngredients && originalIngredients.length > 0 
    ? Math.round((commonIngredientsCount / originalIngredients.length) * 100) 
    : 0;

  // Find potentially problematic ingredients
  const problematicIngredients = dupe.ingredients?.filter(i => i.is_controversial) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="w-full"
    >
      <Card className="w-full bg-white/50 backdrop-blur-sm border-[#0EA5E9]/20 overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Image and Match Score */}
            <div className="w-full md:w-1/4 flex flex-col items-center gap-4">
              <div className="relative aspect-square w-full max-w-[160px]">
                <CategoryImage
                  category={dupe.category}
                  imageUrl={dupe.image_url}
                  images={dupe.images}
                  alt={dupe.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <Badge className="bg-[#0EA5E9] text-white px-4 py-1 text-lg w-full flex justify-center">
                {dupe.match_score}% Match
              </Badge>
            </div>

            {/* Right Column - Product Details */}
            <div className="w-full md:w-3/4">
              {/* Brand, Title, and Price */}
              <div className="flex flex-col md:flex-row items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-medium">{dupe.brand}</h3>
                  <h4 className="text-lg text-gray-600 mb-2">{dupe.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#0EA5E9]">${dupe.price.toFixed(2)}</span>
                  {dupe.savings_percentage && (
                    <Badge className="bg-green-100 text-green-700 px-4 py-1 gap-1 flex items-center">
                      <DollarSign className="w-3 h-3" />
                      Save ${savingsAmount.toFixed(2)} ({dupe.savings_percentage}%)
                    </Badge>
                  )}
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

              {/* Show More Button */}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-gray-500 hover:text-[#0EA5E9] transition-colors mt-2 flex items-center gap-1"
              >
                {isExpanded ? 'Less Details' : 'More Details'}
                <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid gap-y-4">
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
                              <p className="text-xs text-gray-500">${offer.price} {offer.condition && `- ${offer.condition}`}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-[#0EA5E9]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
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