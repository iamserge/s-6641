import { motion } from "framer-motion";
import { ExternalLink } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dupe } from "@/types/dupe";

interface DupeCardProps {
  dupe: Dupe;
  index: number;
}

export const DupeCard = ({ dupe, index }: DupeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 + index * 0.1 }}
      whileHover={{ y: -5 }}
      className="relative"
    >
      <Card className="h-full bg-white/50 backdrop-blur-sm border-[#0EA5E9]/20 overflow-hidden">
        <CardHeader className="space-y-6">
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className="bg-[#0EA5E9] text-white text-lg px-4 py-1">
              {dupe.match_score}% Match
            </Badge>
            <span className="text-2xl font-bold text-[#0EA5E9]">${dupe.price}</span>
          </div>
          
          {dupe.image_url && (
            <div className="relative aspect-square">
              <img
                src={dupe.image_url}
                alt={dupe.name}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          )}
          
          <div className="text-center">
            <p className="text-2xl font-medium mb-2">{dupe.brand}</p>
            <h3 className="text-xl text-gray-600">{dupe.name}</h3>
            <Badge variant="outline" className="mt-4 bg-green-50 text-green-700 border-green-200 text-lg px-4 py-1">
              Save {dupe.savings_percentage}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {dupe.ingredients && dupe.ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dupe.ingredients.map((ingredient, i) => (
                <Badge key={i} variant="outline" className="bg-white/50">
                  {ingredient.name}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-6 text-base">
            {dupe.texture && (
              <div>
                <p className="text-gray-500 mb-2">Texture</p>
                <p className="font-medium">{dupe.texture}</p>
              </div>
            )}
            {dupe.finish && (
              <div>
                <p className="text-gray-500 mb-2">Finish</p>
                <p className="font-medium">{dupe.finish}</p>
              </div>
            )}
          </div>

          {dupe.skin_types && dupe.skin_types.length > 0 && (
            <div>
              <p className="text-gray-500 mb-2">Best for</p>
              <div className="flex flex-wrap gap-2">
                {dupe.skin_types.map((type: string, i: number) => (
                  <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-600">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {dupe.notes && (
            <p className="text-gray-600 italic border-l-2 border-[#0EA5E9]/20 pl-4">
              {dupe.notes}
            </p>
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