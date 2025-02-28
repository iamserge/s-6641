
import { motion } from "framer-motion";
import { AlertTriangle, Check, Heart, Info, Leaf, Link, Star } from "lucide-react";
import { Ingredient } from "@/types/dupe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IngredientHeroProps {
  ingredient: Ingredient;
  similarIngredients?: Ingredient[];
}

export const IngredientHero = ({ ingredient, similarIngredients = [] }: IngredientHeroProps) => {
  const getBenefitIcon = (benefit: string) => {
    const lowerBenefit = benefit.toLowerCase();
    
    if (lowerBenefit.includes('hydrat') || lowerBenefit.includes('moistur')) return '💧';
    if (lowerBenefit.includes('anti-aging') || lowerBenefit.includes('wrinkle')) return '⏳';
    if (lowerBenefit.includes('acne') || lowerBenefit.includes('breakout')) return '🧴';
    if (lowerBenefit.includes('brighten') || lowerBenefit.includes('glow')) return '✨';
    if (lowerBenefit.includes('spf') || lowerBenefit.includes('protect')) return '☀️';
    if (lowerBenefit.includes('sooth') || lowerBenefit.includes('calm')) return '🌿';
    if (lowerBenefit.includes('exfoli') || lowerBenefit.includes('renew')) return '🔄';
    if (lowerBenefit.includes('firm') || lowerBenefit.includes('elasticity')) return '🏋️';
    return '✓';
  };

  const getIngredientIcon = () => {
    const name = ingredient.name.toLowerCase();
    
    // Common skincare ingredient categories
    if (name.includes('acid') || name.includes('aha') || name.includes('bha')) return '🧪';
    if (name.includes('vitamin') || name.includes('retinol')) return '💊';
    if (name.includes('oil') || name.includes('butter')) return '🫧';
    if (name.includes('extract') || name.includes('flower')) return '🌱';
    if (name.includes('peptide') || name.includes('protein')) return '🧬';
    if (name.includes('hyaluronic') || name.includes('ceramide')) return '💧';
    if (name.includes('zinc') || name.includes('copper')) return '⚗️';
    
    return '🧴';
  };

  const getComedogenicRatingColor = (rating: number) => {
    if (rating <= 1) return 'bg-green-50 text-green-700';
    if (rating <= 3) return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-700';
  };

  return (
    <section className="container mx-auto px-4 pt-24 pb-8 md:pt-32 md:pb-16 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center relative z-10"
        >
          {/* Ingredient Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 relative"
          >
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg p-1 mx-auto flex items-center justify-center">
              <span className="text-6xl">{getIngredientIcon()}</span>
            </div>
          </motion.div>

          {/* Ingredient Name and INCI */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2"
            >
              {ingredient.name}
            </motion.h1>
            
            {ingredient.inci_name && ingredient.inci_name !== ingredient.name && (
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-medium">INCI Name:</span> {ingredient.inci_name}
              </p>
            )}
            
            {ingredient.description && (
              <p className="text-gray-700 max-w-2xl mx-auto mb-6">
                {ingredient.description}
              </p>
            )}
            
            {/* Status Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-6"
            >
              {ingredient.comedogenic_rating !== undefined && (
                <Badge variant="secondary" className={cn(
                  "px-5 py-1.5 text-sm rounded-full transition-all",
                  getComedogenicRatingColor(ingredient.comedogenic_rating)
                )}>
                  Comedogenic Rating: {ingredient.comedogenic_rating}/5
                </Badge>
              )}
              
              {ingredient.is_controversial && (
                <Badge variant="secondary" className="bg-red-50 text-red-700 px-5 py-1.5 text-sm flex items-center gap-1 rounded-full hover:bg-red-100 transition-all">
                  <AlertTriangle className="w-3 h-3" />
                  Controversial
                </Badge>
              )}
              
              {ingredient.restricted_in && ingredient.restricted_in.length > 0 && (
                <Badge variant="secondary" className="bg-orange-50 text-orange-700 px-5 py-1.5 text-sm flex items-center gap-1 rounded-full hover:bg-orange-100 transition-all">
                  <Info className="w-3 h-3" />
                  Restricted in {ingredient.restricted_in.length} regions
                </Badge>
              )}
            </motion.div>

            {/* Benefits and Attributes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-3 mb-6"
            >
              {ingredient.vegan && (
                <Badge className="bg-green-50 text-green-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-green-100 transition-all">
                  <Leaf className="w-3 h-3" />
                  Vegan
                </Badge>
              )}
              
              {ingredient.ethically_sourced && (
                <Badge className="bg-teal-50 text-teal-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-teal-100 transition-all">
                  <Check className="w-3 h-3" />
                  Ethically Sourced
                </Badge>
              )}
            </motion.div>

            {/* Benefits List */}
            {ingredient.benefits && ingredient.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-6"
              >
                <h3 className="text-lg font-medium text-gray-800 mb-3">Benefits</h3>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                  {ingredient.benefits.map((benefit, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="rounded-full bg-green-50/50 text-green-700 border-green-200 px-3 py-1.5 flex items-center gap-1"
                    >
                      <span>{getBenefitIcon(benefit)}</span>
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Concerns List */}
            {ingredient.concerns && ingredient.concerns.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="mb-6"
              >
                <h3 className="text-lg font-medium text-gray-800 mb-3">Potential Concerns</h3>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                  {ingredient.concerns.map((concern, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="rounded-full bg-red-50/50 text-red-700 border-red-200 px-3 py-1.5 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {concern}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Best For Skin Types */}
            {ingredient.skin_types && ingredient.skin_types.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mb-6"
              >
                <h3 className="text-lg font-medium text-gray-800 mb-3">Best For</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {ingredient.skin_types.map((skinType, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="rounded-full bg-blue-50 text-blue-700 px-3 py-1"
                    >
                      {skinType}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Similar Ingredients */}
            {similarIngredients.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                className="mt-10"
              >
                <h3 className="text-lg font-medium text-gray-800 mb-3">Similar Ingredients</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  <TooltipProvider>
                    {similarIngredients.map((similar, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-full bg-white"
                            onClick={() => window.location.href = `/ingredients/${similar.slug}`}
                          >
                            {similar.name}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="p-3 max-w-xs">
                          <p className="font-medium">{similar.name}</p>
                          {similar.description && <p className="text-xs mt-1">{similar.description.slice(0, 100)}...</p>}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
