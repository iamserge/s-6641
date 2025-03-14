
import { motion } from "framer-motion";

interface RecentProduct {
  id: string;
  name: string;
  image_url: string;
  brand: string;
  slug: string;
  dupesCount: number;
  maxSavings: number;
}

interface RecentProductsDisplayProps {
  showRecentProducts?: boolean;
  recentProducts?: RecentProduct[];
}

const RecentProductsDisplay = ({ 
  showRecentProducts = false, 
  recentProducts = [] 
}: RecentProductsDisplayProps) => {
  if (!showRecentProducts || !recentProducts?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeIn" }}
      className="mt-6"
    >
      <p className="text-lg font-light text-gray-800 mb-2">
        Trending Dupe Finds
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recentProducts.map((product) => (
          <div key={product?.id} className="border rounded-lg p-2 bg-gray-50">
            <img
              src={product.image_url || "/placeholder-image.png"}
              alt={product.name}
              className="w-full h-24 object-cover rounded mb-2"
            />
            <p className="text-sm font-medium">
              <a
                href={`/dupes/for/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:underline"
              >
                {product.name}
              </a>
            </p>
            <p className="text-xs text-gray-600">{product.brand}</p>
            <p className="text-xs text-gray-600">{product.dupesCount} dupes</p>
            <p className="text-xs text-gray-600">Max saving: {product.maxSavings}%</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentProductsDisplay;
