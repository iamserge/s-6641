import { motion } from "framer-motion";
import { ExternalLink, Heart, Leaf, Info, Clock, Check, DollarSign, Droplet, Shield } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dupe } from "@/types/dupe";
import { CategoryImage } from "./CategoryImage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
  originalIngredients?: string[]; // Added to compare ingredients
}

export const DupeCard = ({ dupe, index, originalIngredients }: DupeCardProps) => {
  const savingsAmount = dupe.savings_percentage ? (dupe.price / (1 - dupe.savings_percentage / 100)) - dupe.price : 0;
  const dupeIngredientNames = dupe.ingredients?.map(i => i.name.toLowerCase()) || [];
  const commonIngredients = originalIngredients?.filter(ing => dupeIngredientNames.includes(ing.toLowerCase())) || [];
  const commonIngredientsCount = commonIngredients.length;
  const commonIngredientsPercentage = originalIngredients && originalIngredients.length > 0 
    ? Math.round((commonIngredientsCount / originalIngredients.length) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="h-full bg-white/50 backdrop-blur-sm border-[#0EA5E9]/20 overflow-hidden shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start">
            <Badge className="bg-[#0EA5E9] text-white px-4 py-1 text-lg">
              {dupe.match_score}% Match
            </Badge>
            <span className="text-2xl font-bold text-[#0EA5E9]">${dupe.price.toFixed(2)}</span>
          </div>
          
          <div className="relative aspect-square">
            <CategoryImage
              category={dupe.category}
              imageUrl={dupe.image_url}
              images={dupe.images}
              alt={dupe.name}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="text-center">
            <p className="text-xl font-medium mb-1">{dupe.brand}</p>
            <h3 className="text-lg text-gray-600 mb-3">{dupe.name}</h3>
            {dupe.savings_percentage && (
              <Badge className="bg-green-100 text-green-700 px-4 py-1 gap-1 flex items-center">
                <DollarSign className="w-3 h-3" />
                Save ${savingsAmount.toFixed(2)} ({dupe.savings_percentage}%)
              </Badge>
            )}
          </div>

          {/* Key Product Badges */}
          <div className="flex flex-wrap justify-center gap-2">
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
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description if available */}
          {dupe.description && (
            <p className="text-sm text-gray-600">{dupe.description}</p>
          )}

          {/* Accordion details */}
          <Accordion type="single" collapsible className="w-full">
            {(dupe.texture || dupe.finish || dupe.coverage || dupe.spf) && (
              <AccordionItem value="details">
                <AccordionTrigger className="text-left text-sm py-2">Product Details</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {dupe.texture && (
                      <div>
                        <p className="text-gray-500">Texture</p>
                        <p className="font-medium">{dupe.texture}</p>
                      </div>
                    )}
                    {dupe.finish && (
                      <div>
                        <p className="text-gray-500">Finish</p>
                        <p className="font-medium">{dupe.finish}</p>
                      </div>
                    )}
                    {dupe.coverage && (
                      <div>
                        <p className="text-gray-500">Coverage</p>
                        <p className="font-medium">{dupe.coverage}</p>
                      </div>
                    )}
                    {dupe.spf && (
                      <div>
                        <p className="text-gray-500">SPF</p>
                        <p className="font-medium">{dupe.spf}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {dupe.ingredients && dupe.ingredients.length > 0 && (
              <AccordionItem value="ingredients">
                <AccordionTrigger className="text-left text-sm py-2">Ingredients</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {dupe.ingredients.map((ingredient, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`${
                          commonIngredients.includes(ingredient.name.toLowerCase())
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-white/50 text-gray-700"
                        } flex items-center`}
                      >
                        {commonIngredients.includes(ingredient.name.toLowerCase()) && (
                          <Check className="w-3 h-3 mr-1" />
                        )}
                        {ingredient.name}
                        {ingredient.is_controversial && (
                          <Info className="w-3 h-3 ml-1 text-red-500" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {(dupe.skin_types?.length > 0 || dupe.best_for?.length > 0) && (
              <AccordionItem value="suitability">
                <AccordionTrigger className="text-left text-sm py-2">Suitability</AccordionTrigger>
                <AccordionContent>
                  {dupe.skin_types && dupe.skin_types.length > 0 && (
                    <div className="mb-3">
                      <p className="text-gray-500 text-xs mb-1">Skin Types</p>
                      <div className="flex flex-wrap gap-2">
                        {dupe.skin_types.map((type, i) => (
                          <Badge key={i} variant="outline" className="bg-white/50 text-gray-700">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {dupe.best_for && dupe.best_for.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Best For</p>
                      <div className="flex flex-wrap gap-2">
                        {dupe.best_for.map((item, i) => (
                          <Badge key={i} variant="outline" className="bg-white/50 text-gray-700">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            {dupe.free_of && dupe.free_of.length > 0 && (
              <AccordionItem value="free-of">
                <AccordionTrigger className="text-left text-sm py-2">Free Of</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {dupe.free_of.map((item, i) => (
                      <Badge key={i} variant="outline" className="bg-white/50 text-gray-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {dupe.offers && dupe.offers.length > 0 && (
              <AccordionItem value="offers">
                <AccordionTrigger className="text-left text-sm py-2">Where to Buy</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {dupe.offers.map((offer, i) => (
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
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

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
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DupeCard;