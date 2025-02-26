import { motion } from "framer-motion";
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dupe } from "@/types/dupe";
import { CategoryImage } from "./CategoryImage";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
  originalIngredients?: string[]; // Added to compare ingredients
}

export const DupeCard = ({ dupe, index, originalIngredients }: DupeCardProps) => {
  const savingsAmount = dupe.savings_percentage ? (dupe.price / (1 - dupe.savings_percentage / 100)) - dupe.price : 0;
  const dupeIngredientNames = dupe.ingredients?.map(i => i.name.toLowerCase()) || [];
  const commonIngredients = originalIngredients?.filter(ing => dupeIngredientNames.includes(ing.toLowerCase())) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 + index * 0.1 }}
      whileHover={{ y: -5 }}
      className="relative"
    >
      <Card className="h-full bg-white/50 backdrop-blur-sm border-[#0EA5E9]/20 overflow-hidden shadow-lg">
        <CardHeader className="space-y-6">
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className="bg-[#0EA5E9] text-white text-lg px-4 py-1">
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
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-medium mb-2">{dupe.brand}</p>
            <h3 className="text-xl text-gray-600">{dupe.name}</h3>
            {dupe.savings_percentage && (
              <Badge variant="outline" className="mt-4 bg-green-50 text-green-700 border-green-200 text-lg px-4 py-1">
                Save ${savingsAmount.toFixed(2)} ({dupe.savings_percentage}%)
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-base">
            {dupe.texture && <div><p className="text-gray-500">Texture</p><p className="font-medium">{dupe.texture}</p></div>}
            {dupe.finish && <div><p className="text-gray-500">Finish</p><p className="font-medium">{dupe.finish}</p></div>}
            {dupe.coverage && <div><p className="text-gray-500">Coverage</p><p className="font-medium">{dupe.coverage}</p></div>}
            {dupe.spf && <div><p className="text-gray-500">SPF</p><p className="font-medium">{dupe.spf}</p></div>}
          </div>

          {dupe.ingredients && dupe.ingredients.length > 0 && (
            <div>
              <p className="text-gray-500 mb-2">Ingredients</p>
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
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    {ingredient.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {dupe.free_of && dupe.free_of.length > 0 && (
            <div>
              <p className="text-gray-500 mb-2">Free Of</p>
              <div className="flex flex-wrap gap-2">
                {dupe.free_of.map((item, i) => (
                  <Badge key={i} variant="outline" className="bg-gray-100">{item}</Badge>
                ))}
              </div>
            </div>
          )}

          {dupe.best_for && dupe.best_for.length > 0 && (
            <div>
              <p className="text-gray-500 mb-2">Best For</p>
              <div className="flex flex-wrap gap-2">
                {dupe.best_for.map((item, i) => (
                  <Badge key={i} variant="outline" className="bg-gray-100">{item}</Badge>
                ))}
              </div>
            </div>
          )}

          {(dupe.cruelty_free || dupe.vegan) && (
            <div className="flex justify-center gap-2">
              {dupe.cruelty_free && <Badge className="bg-green-100 text-green-700">Cruelty-Free</Badge>}
              {dupe.vegan && <Badge className="bg-green-100 text-green-700">Vegan</Badge>}
            </div>
          )}

          {dupe.offers && dupe.offers.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-500 font-medium">Offers</p>
              {dupe.offers.map((offer, i) => (
                <motion.a
                  key={i}
                  href={offer.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div>
                    <p className="text-gray-700 font-medium">{offer.merchant.name}</p>
                    <p className="text-sm text-gray-500">${offer.price} - {offer.condition}</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-[#0EA5E9]" />
                </motion.a>
              ))}
            </div>
          )}

          {dupe.purchase_link && (
            <motion.a
              href={dupe.purchase_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Shop Now <ExternalLink className="ml-2 h-5 w-5" />
            </motion.a>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};