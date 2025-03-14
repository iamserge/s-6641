
import { useState, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { Info, ExternalLink } from "lucide-react";
import { Ingredient } from "@/types/dupe";
import { Button } from "@/components/ui/button";

interface IngredientPillProps {
  ingredient: Ingredient;
  className?: string;
}

export const IngredientPill = ({ ingredient, className }: IngredientPillProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={pillRef}
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Badge 
        variant="outline" 
        className={`
          rounded-full bg-white text-gray-700 font-[500] transition-all hover:bg-white flex items-center gap-1 px-3 py-1
          ${ingredient.is_controversial ? 'border-[#FFDEE2]' : 'border-slate-200'}
          ${ingredient.is_controversial ? 'bg-[#FFDEE2]/30' :  ''}
          ${className}
        `}
      >
        {ingredient.name}
        {ingredient.is_controversial && <Info className="w-3 h-3 text-rose-500" />}
      </Badge>
      
      {showTooltip && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 p-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-lg z-[100]"
        >
          {/* Small arrow pointing to the pill */}
          <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 border-r border-b border-slate-200 transform rotate-45"></div>
          
          <div className="space-y-2 text-sm">
            <div className="flex-col justify-between items-start">
              <h3 className="text-xl font-bold">{ingredient.name}</h3>
              a.k.a. <br/>
              {ingredient.inci_name && (
                 <h4 className='text-[14px]'>{ingredient.inci_name}</h4>
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
                  console.log(`View details for ${ingredient.slug}`);
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
