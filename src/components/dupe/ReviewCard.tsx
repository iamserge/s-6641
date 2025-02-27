import { Review } from "@/types/dupe";
import { Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface ReviewCardProps {
  review: Review;
  index?: number;
}

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-4 h-4 text-yellow-400" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-yellow-400" />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

export const ReviewCard = ({ review, index = 0 }: ReviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-100/50 mb-4 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-3">
        {review.author_name && (
          <p className="font-medium text-gray-800">{review.author_name}</p>
        )}
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} />
          {review.verified_purchase && (
            <Badge variant="outline" className="bg-green-50 text-green-700 gap-1 flex items-center text-xs">
              <CheckCircle className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>
      </div>
      
      <div className="relative mt-2">
        <div className="absolute -left-2 top-0 text-6xl text-gray-200 font-serif leading-none">
          "
        </div>
        <p className="text-gray-700 italic pl-5 pr-2 relative z-10">
          {review.review_text}
        </p>
        <div className="absolute -right-2 bottom-0 text-6xl text-gray-200 font-serif leading-none">
          "
        </div>
      </div>
      
      {review.source && (
        <div className="mt-3 text-right">
          <span className="text-xs text-gray-500">
            via {review.source}
          </span>
        </div>
      )}
    </motion.div>
  );
};