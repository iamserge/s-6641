
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/dupe";

interface HeroProductProps {
  product: Product;
}

export const HeroProduct = ({ product }: HeroProductProps) => {
  return (
    <div className="container mx-auto px-4 pt-32 pb-16">
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-4xl font-light text-gray-600 mb-3">{product.brand}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-6xl font-medium text-gray-900 mb-6">{product.name}</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-3 mb-12"
          >
            {product.attributes.map((attribute: string, index: number) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-white/50 backdrop-blur-sm text-gray-700 px-4 py-1"
              >
                {attribute}
              </Badge>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="relative"
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-80 h-80 object-contain mx-auto"
              />
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-3xl font-medium text-[#9b87f5] mt-8"
          >
            ${product.price}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};
