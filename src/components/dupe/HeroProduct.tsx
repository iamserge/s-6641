import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/dupe";
import { CategoryImage } from "./CategoryImage";

interface HeroProductProps {
  product: Product;
}

export const HeroProduct = ({ product }: HeroProductProps) => {
  return (
    <div className="container mx-auto px-4 pt-32 pb-16">
      <div className="max-w-6xl mx-auto relative text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-4xl font-light text-gray-600 mb-3">{product.brand}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h1 className="text-6xl font-medium text-gray-900 mb-6">{product.name}</h1>
          </motion.div>

          {product.attributes && product.attributes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-3 mb-6"
            >
              {product.attributes.map((attribute, index) => (
                <Badge key={index} variant="secondary" className="bg-white/50 backdrop-blur-sm text-gray-700 px-4 py-1">
                  {attribute}
                </Badge>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="relative mb-6"
          >
            <CategoryImage
              category={product.category}
              imageUrl={product.image_url}
              images={product.images}
              alt={product.name}
              className="w-80 h-80 object-contain mx-auto"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="space-y-4">
            <p className="text-3xl font-medium text-[#9b87f5]">${product.price}</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {product.category && <div><span className="text-gray-500">Category: </span>{product.category}</div>}
              {product.longevity_rating && <div><span className="text-gray-500">Longevity: </span>{product.longevity_rating}/10</div>}
              {product.oxidation_tendency && <div><span className="text-gray-500">Oxidation: </span>{product.oxidation_tendency}</div>}
              {product.country_of_origin && <div><span className="text-gray-500">Origin: </span>{product.country_of_origin}</div>}
            </div>
            {product.description && <p className="text-lg text-gray-700 italic">{product.description}</p>}
            {(product.cruelty_free || product.vegan) && (
              <div className="flex justify-center gap-2">
                {product.cruelty_free && <Badge className="bg-green-100 text-green-700">Cruelty-Free</Badge>}
                {product.vegan && <Badge className="bg-green-100 text-green-700">Vegan</Badge>}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};