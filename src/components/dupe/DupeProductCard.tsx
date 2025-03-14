import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DupeActions from "./DupeActions";

const DupeProductCard = ({ product, onClick, index }) => {
  const {
    id,
    name,
    brand,
    slug,
    image_url,
    category,
    country_of_origin,
    highest_match,
    highest_savings,
  } = product;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col"
    >
      <div 
        onClick={onClick}
        className="cursor-pointer flex flex-col h-full"
      >
        <img
          src={image_url}
          alt={name}
          className="rounded-xl object-cover aspect-square mb-3"
        />
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{name}</h3>
          <p className="text-sm text-gray-500 line-clamp-1">{brand}</p>
          <p className="text-xs text-gray-400 mt-1">{category} from {country_of_origin}</p>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium">Match Score:</span>
            <span className="font-semibold">{highest_match}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium">Savings:</span>
            <span className="font-semibold">{highest_savings}%</span>
          </div>
        </div>
      </div>
      
      {product.dupes.length > 0 && product.dupes[0]?.id && (
        <DupeActions 
          dupeId={product.dupes[0].id} 
          originalProductId={product.id} 
        />
      )}
    </motion.div>
  );
};

export default DupeProductCard;
