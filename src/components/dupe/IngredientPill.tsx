
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
          rounded-full text-gray-700 font-[500] transition-all hover:bg-white flex items-center gap-1 px-3 py-1
          ${ingredient.is_controversial ? 'border-rose-200 text-rose-700' : 'border-gray-200'}
          ${ingredient.is_controversial ? 'hover:bg-rose-50' : 'hover:bg-gray-50'}
          ${className}
        `}
      >
        {ingredient.name}
        {ingredient.is_controversial && <Info className="w-3 h-3 text-rose-500" />}
      </Badge>
      
      {showTooltip && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 p-4 bg-white border border-slate-200 shadow-lg rounded-lg z-[100]"
        >
          {/* Small arrow pointing to the pill */}
          <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-slate-200 transform rotate-45"></div>
          
          <div className="space-y-2 text-sm">
            <div className="flex-col justify-between items-start">
              <h3 className="text-xl font-bold">{ingredient.name}</h3>
              {ingredient.inci_name && (
                <div>
                  <span className="text-[12px] text-gray-500">a.k.a.</span>
                  <h4 className='text-[14px]'>{ingredient.inci_name}</h4>
                </div>
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
                  <Badge variant="outline" className="text-xs border-green-100 text-green-700">Vegan</Badge>
                )}
                {ingredient.ethically_sourced && (
                  <Badge variant="outline" className="text-xs border-blue-100 text-blue-700">Ethically Sourced</Badge>
                )}
                {ingredient.comedogenic_rating !== undefined && ingredient.comedogenic_rating > 0 && (
                  <Badge variant="outline" className="text-xs border-amber-100 text-amber-700">
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
