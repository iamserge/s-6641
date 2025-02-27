import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/dupe";
import { CategoryImage } from "./CategoryImage";
import { Heart, Award, Leaf, Info, MapPin, Clock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HeroProductProps {
  product: Product;
}

export const HeroProduct = ({ product }: HeroProductProps) => {
  return (
    <div className="container mx-auto px-4 pt-24 pb-8 md:pt-32 md:pb-16">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-8 items-center"
        >
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative w-full md:w-1/2 flex justify-center"
          >
            <div className="relative aspect-square max-w-xs w-full">
              <CategoryImage
                category={product.category}
                imageUrl={product.image_url}
                images={product.images}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="w-full md:w-1/2 text-center md:text-left"
          >
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-light text-gray-600 mb-2"
            >
              {product.brand}
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-5xl font-medium text-gray-900 mb-4"
            >
              {product.name}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center md:justify-start gap-2 mb-6"
            >
              {product.category && (
                <Badge variant="secondary" className="bg-white/50 backdrop-blur-sm text-gray-700 px-4 py-1">
                  {product.category}
                </Badge>
              )}
              
              {product.price && (
                <Badge variant="secondary" className="bg-[#9b87f5] text-white px-4 py-1">
                  ${product.price.toFixed(2)}
                </Badge>
              )}
            </motion.div>

            {/* Product Badges - Specially styled */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center md:justify-start gap-2 mb-6"
            >
              {product.cruelty_free && (
                <Badge className="bg-purple-100 text-purple-800 flex gap-1 items-center px-3 py-1">
                  <Heart className="w-3 h-3" />
                  Cruelty-Free
                </Badge>
              )}
              
              {product.vegan && (
                <Badge className="bg-green-100 text-green-800 flex gap-1 items-center px-3 py-1">
                  <Leaf className="w-3 h-3" />
                  Vegan
                </Badge>
              )}
              
              {product.country_of_origin && (
                <Badge className="bg-blue-100 text-blue-800 flex gap-1 items-center px-3 py-1">
                  <MapPin className="w-3 h-3" />
                  {product.country_of_origin}
                </Badge>
              )}
              
              {product.longevity_rating && (
                <Badge className="bg-amber-100 text-amber-800 flex gap-1 items-center px-3 py-1">
                  <Clock className="w-3 h-3" />
                  Longevity: {product.longevity_rating}/10
                </Badge>
              )}
            </motion.div>

            {/* Description - Now prominently displayed */}
            {product.description && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mb-6"
              >
                <p className="text-base text-gray-700">{product.description}</p>
              </motion.div>
            )}

            {/* Accordion for additional details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Accordion type="single" collapsible className="w-full">
                {product.attributes && product.attributes.length > 0 && (
                  <AccordionItem value="attributes">
                    <AccordionTrigger className="text-left">Key Attributes</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.attributes.map((attribute, index) => (
                          <Badge key={index} variant="outline" className="bg-white/50 text-gray-700">
                            {attribute}
                          </Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {product.ingredients && product.ingredients.length > 0 && (
                  <AccordionItem value="ingredients">
                    <AccordionTrigger className="text-left">Ingredients</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.ingredients.map((ingredient, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="bg-white/50 text-gray-700 flex items-center gap-1"
                          >
                            {ingredient.name}
                            {ingredient.is_controversial && <Info className="w-3 h-3 text-red-500" />}
                          </Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {(product.texture || product.finish || product.coverage || product.spf) && (
                  <AccordionItem value="details">
                    <AccordionTrigger className="text-left">Product Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        {product.texture && (
                          <div>
                            <p className="text-gray-500 text-sm">Texture</p>
                            <p>{product.texture}</p>
                          </div>
                        )}
                        {product.finish && (
                          <div>
                            <p className="text-gray-500 text-sm">Finish</p>
                            <p>{product.finish}</p>
                          </div>
                        )}
                        {product.coverage && (
                          <div>
                            <p className="text-gray-500 text-sm">Coverage</p>
                            <p>{product.coverage}</p>
                          </div>
                        )}
                        {product.spf && (
                          <div>
                            <p className="text-gray-500 text-sm">SPF</p>
                            <p>{product.spf}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {(product.skin_types?.length > 0 || product.best_for?.length > 0) && (
                  <AccordionItem value="suitability">
                    <AccordionTrigger className="text-left">Suitability</AccordionTrigger>
                    <AccordionContent>
                      {product.skin_types && product.skin_types.length > 0 && (
                        <div className="mb-3">
                          <p className="text-gray-500 text-sm mb-1">Skin Types</p>
                          <div className="flex flex-wrap gap-2">
                            {product.skin_types.map((type, index) => (
                              <Badge key={index} variant="outline" className="bg-white/50 text-gray-700">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {product.best_for && product.best_for.length > 0 && (
                        <div>
                          <p className="text-gray-500 text-sm mb-1">Best For</p>
                          <div className="flex flex-wrap gap-2">
                            {product.best_for.map((item, index) => (
                              <Badge key={index} variant="outline" className="bg-white/50 text-gray-700">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};