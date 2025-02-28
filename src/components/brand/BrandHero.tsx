
import { motion } from "framer-motion";
import { Heart, Leaf, MapPin, Shield, Info, ExternalLink } from "lucide-react";
import { Brand } from "@/types/dupe";
import { getFlagEmoji } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BrandHeroProps {
  brand: Brand;
}

export const BrandHero = ({ brand }: BrandHeroProps) => {
  return (
    <section className="container mx-auto px-4 pt-24 pb-8 md:pt-32 md:pb-16 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center relative z-10"
        >
          {/* Brand Logo/Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 relative"
          >
            <div className="w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden bg-white shadow-lg p-1 mx-auto">
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                {brand.website_url ? (
                  <img
                    src={`https://logo.clearbit.com/${brand.website_url.replace(/^https?:\/\//, '').split('/')[0]}?size=240`}
                    alt={brand.name}
                    className="object-contain w-full h-full p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `/placeholders/brand.png`;
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-4xl font-semibold text-gray-400">
                    {brand.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Brand Name and Details */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4"
            >
              {brand.name}
            </motion.h1>
            
            {brand.founded_year && (
              <p className="text-gray-600 mb-2">
                Founded in {brand.founded_year}
                {brand.headquarters && ` • Headquarters: ${brand.headquarters}`}
              </p>
            )}
            
            {brand.description && (
              <p className="text-gray-700 max-w-2xl mx-auto mb-6">
                {brand.description}
              </p>
            )}
            
            {/* Primary Details Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-6"
            >
              {brand.price_range && (
                <Badge variant="secondary" className="bg-[#d2c9f9] text-[#5840c0] px-5 py-1.5 text-sm rounded-full hover:bg-[#c1b4f6] transition-all">
                  {brand.price_range.charAt(0).toUpperCase() + brand.price_range.slice(1)} Price Range
                </Badge>
              )}
              
              {brand.country_of_origin && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-5 py-1.5 text-sm flex items-center gap-1 rounded-full hover:bg-blue-100 transition-all">
                  <MapPin className="w-3 h-3" />
                  <span>{getFlagEmoji(brand.country_of_origin)}</span>
                  {brand.country_of_origin}
                </Badge>
              )}
              
              {brand.parent_company && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 px-5 py-1.5 text-sm flex items-center gap-1 rounded-full hover:bg-amber-100 transition-all">
                  <Info className="w-3 h-3" />
                  Owned by {brand.parent_company}
                </Badge>
              )}
            </motion.div>

            {/* Secondary Detail Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-3 mb-6"
            >
              {brand.cruelty_free && (
                <Badge className="bg-purple-50 text-purple-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-purple-100 transition-all">
                  <Heart className="w-3 h-3" />
                  Cruelty-Free
                </Badge>
              )}
              
              {brand.vegan && (
                <Badge className="bg-green-50 text-green-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-green-100 transition-all">
                  <Leaf className="w-3 h-3" />
                  Vegan
                </Badge>
              )}
              
              {brand.clean_beauty && (
                <Badge className="bg-teal-50 text-teal-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-teal-100 transition-all">
                  Clean Beauty
                </Badge>
              )}
              
              {brand.sustainable_packaging && (
                <Badge className="bg-emerald-50 text-emerald-700 flex gap-1 items-center px-5 py-1.5 text-sm rounded-full hover:bg-emerald-100 transition-all">
                  <Shield className="w-3 h-3" />
                  Sustainable Packaging
                </Badge>
              )}
            </motion.div>

            {/* Key Values and Categories */}
            {(brand.key_values?.length > 0 || brand.product_categories?.length > 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-6"
              >
                {brand.key_values?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Key Values:</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {brand.key_values.map((value, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="rounded-full bg-white/50 text-gray-700"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {brand.product_categories?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Product Categories:</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {brand.product_categories.map((category, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="rounded-full bg-white/50 text-gray-700"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Website Button */}
            {brand.website_url && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Button 
                  as="a" 
                  href={brand.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 bg-[#5840c0] hover:bg-[#4330a0] text-white"
                >
                  Visit Official Website
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
