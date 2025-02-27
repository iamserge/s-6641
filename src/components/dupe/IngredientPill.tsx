
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ExternalLink } from "lucide-react";
import { Ingredient } from "@/types/dupe";
import { Button } from "@/components/ui/button";

interface IngredientPillProps {
  ingredient: Ingredient;
  className?: string;
}

export const IngredientPill = ({ ingredient, className }: IngredientPillProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={`
            rounded-full bg-white/50 text-gray-700 transition-all hover:bg-white flex items-center gap-1 px-3 py-1
            ${ingredient.is_controversial ? 'border-[#FFDEE2]' : ingredient.benefits?.length ? 'border-[#F2FCE2]' : 'border-slate-200'}
            ${ingredient.is_controversial ? 'bg-[#FFDEE2]/30' : ingredient.benefits?.length ? 'bg-[#F2FCE2]/40' : ''}
            ${className}
          `}
        >
          {ingredient.name}
          {ingredient.is_controversial && <Info className="w-3 h-3 text-rose-500" />}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-start">
            <h4 className="font-medium">{ingredient.name}</h4>
            {ingredient.inci_name && (
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">{ingredient.inci_name}</Badge>
            )}
          </div>
          
          {ingredient.description && (
            <p className="text-gray-700">{ingredient.description}</p>
          )}
          
          {ingredient.benefits && ingredient.benefits.length > 0 && (
            <div>
              <p className="font-medium text-green-700">Benefits:</p>
              <ul className="list-disc list-inside text-gray-700 ml-1">
                {ingredient.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
          
          {ingredient.is_controversial && ingredient.concerns && ingredient.concerns.length > 0 && (
            <div>
              <p className="font-medium text-rose-700">Concerns:</p>
              <ul className="list-disc list-inside text-gray-700 ml-1">
                {ingredient.concerns.map((concern, index) => (
                  <li key={index}>{concern}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-1">
            <div className="flex flex-wrap gap-1">
              {ingredient.vegan && (
                <Badge variant="pastelGreen" className="text-xs">Vegan</Badge>
              )}
              {ingredient.ethically_sourced && (
                <Badge variant="pastelBlue" className="text-xs">Ethically Sourced</Badge>
              )}
              {ingredient.comedogenic_rating !== undefined && ingredient.comedogenic_rating > 0 && (
                <Badge variant="pastelYellow" className="text-xs">
                  Comedogenic: {ingredient.comedogenic_rating}/5
                </Badge>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 p-1 text-xs text-[#5840c0] hover:text-[#4330a0] hover:bg-[#f6f4ff]"
              onClick={() => {
                // This will eventually navigate to ingredient details page
                // For now just log it
                console.log(`View details for ${ingredient.slug}`);
              }}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
