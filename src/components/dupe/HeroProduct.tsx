import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Product, Review, ProductResource, EnhancedResource } from "@/types/dupe";
import { CategoryImage } from "./CategoryImage";
import { Heart, Leaf, MapPin, Clock, ChevronDown, Info, Star, ExternalLink, MessageSquare } from "lucide-react";
import { useState } from "react";
import { getFlagEmoji } from "@/lib/utils";

interface HeroProductProps {
  product: Product;
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

// Review component
const ReviewCard = ({ review }: { review: Review }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-100 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          {review.author_avatar ? (
            <img 
              src={review.author_avatar} 
              alt={review.author_name || "Reviewer"} 
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{review.author_name || "Anonymous"}</p>
            {review.source && (
              <p className="text-xs text-gray-500">via {review.source}</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <StarRating rating={review.rating} />
          {review.verified_purchase && (
            <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Verified</Badge>
          )}
        </div>
      </div>
      <div className="relative">
        <p className="text-sm text-gray-700 italic">
          "{review.review_text}"
        </p>
      </div>
    </div>
  );
};

// Resource Preview component (for social media and videos)
const ResourcePreview = ({ resource }: { resource: EnhancedResource }) => {
  let icon;
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";

  switch(resource.type) {
    case "Instagram":
      icon = <i className="fab fa-instagram text-white text-xl" />;
      bgColor = "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500";
      textColor = "text-white";
      break;
    case "TikTok":
      icon = <i className="fab fa-tiktok text-white text-xl" />;
      bgColor = "bg-black";
      textColor = "text-white";
      break;
    case "YouTube":
      icon = <i className="fab fa-youtube text-white text-xl" />;
      bgColor = "bg-red-600";
      textColor = "text-white";
      break;
    case "Article":
      icon = <i className="fas fa-newspaper text-gray-800 text-xl" />;
      break;
    default:
      icon = <ExternalLink className="w-5 h-5 text-gray-600" />;
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-transform transform group-hover:scale-102">
        <div className="relative aspect-video">
          {resource.video_thumbnail ? (
            <img 
              src={resource.video_thumbnail} 
              alt={resource.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${bgColor} flex items-center justify-center`}>
              {icon}
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
          {resource.video_duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
              {resource.video_duration}
            </div>
          )}
          <div className={`absolute top-2 left-2 ${bgColor} ${textColor} text-xs px-2 py-1 rounded-full`}>
            {resource.type}
          </div>
        </div>
        <div className="p-3">
          <h4 className="text-sm font-medium line-clamp-2 mb-1">{resource.title}</h4>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{resource.author_name}</span>
            {(resource.views_count !== undefined || resource.likes_count !== undefined) && (
              <div className="flex items-center gap-2">
                {resource.views_count !== undefined && (
                  <span>{resource.views_count.toLocaleString()} views</span>
                )}
                {resource.likes_count !== undefined && (
                  <span>{resource.likes_count.toLocaleString()} likes</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
};

export const HeroProduct = ({ product }: HeroProductProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'videos'>('details');
  
  // Filter featured resources
  const featuredResources = product.resources?.filter(r => r.is_featured && r.resource) || [];
  
  return (
    <div className="container mx-auto px-4 pt-24 pb-8 md:pt-32 md:pb-16">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative mb-8 max-w-xs w-full"
          >
            <div className="relative aspect-square w-full">
              <CategoryImage
                category={product.category}
                imageUrl={product.image_url}
                images={product.images}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          {/* Brand & Title */}
          <motion.div className="w-full mb-4">
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
              className="text-3xl md:text-5xl font-medium text-gray-900 mb-2"
            >
              {product.name}
            </motion.h1>
            
            {/* Ratings Display */}
            {product.rating && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.5 }}
                className="flex justify-center items-center gap-2 mb-4"
              >
                <StarRating rating={product.rating} />
                {product.rating_count && (
                  <span className="text-sm text-gray-500">({product.rating_count.toLocaleString()} reviews)</span>
                )}
                {product.rating_source && (
                  <span className="text-xs text-gray-400">via {product.rating_source}</span>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Primary Info Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
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
            
            {product.country_of_origin && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{getFlagEmoji(product.country_of_origin)}</span>
                {product.country_of_origin}
              </Badge>
            )}
            
            {product.longevity_rating && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 px-4 py-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Longevity: {product.longevity_rating}/10
              </Badge>
            )}
          </motion.div>

          {/* Key Status Pills */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
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
          </motion.div>

          {/* Description */}
          {product.description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mb-6 max-w-2xl mx-auto"
            >
              <p className="text-base text-gray-700">{product.description}</p>
            </motion.div>
          )}

          {/* Ingredients with Notes */}
          {product.ingredients && product.ingredients.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1 }}
              className="mb-6"
            >
              <h3 className="text-lg font-medium mb-3">Key Ingredients</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {product.ingredients.map((ingredient, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className={`
                      bg-white/50 text-gray-700 flex items-center gap-1
                      ${ingredient.is_controversial ? 'border-red-300' : ''}
                    `}
                  >
                    {ingredient.name}
                    {ingredient.is_controversial && <Info className="w-3 h-3 text-red-500" />}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Featured Social Media/Videos - Preview */}
          {featuredResources.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mb-8 w-full"
            >
              <h3 className="text-lg font-medium mb-4">Featured Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredResources.slice(0, 3).map((resourceItem, index) => (
                  <ResourcePreview 
                    key={index} 
                    resource={resourceItem.resource as EnhancedResource} 
                  />
                ))}
              </div>
              {featuredResources.length > 3 && !isExpanded && (
                <button 
                  className="text-sm text-blue-600 mt-2 hover:underline"
                  onClick={() => {
                    setIsExpanded(true);
                    setActiveTab('videos');
                  }}
                >
                  View more content
                </button>
              )}
            </motion.div>
          )}

          {/* Expand Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mt-4"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </motion.button>

          {/* Expanded Tabs and Content */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full mt-8"
            >
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'details' 
                        ? 'border-indigo-500 text-indigo-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Product Details
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews' 
                        ? 'border-indigo-500 text-indigo-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Reviews {product.reviews?.length ? `(${product.reviews.length})` : ''}
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'videos' 
                        ? 'border-indigo-500 text-indigo-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Videos & Articles {product.resources?.length ? `(${product.resources.length})` : ''}
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mb-8">
                {activeTab === 'details' && (
                  <div className="grid gap-8">
                    {/* Product Details Section */}
                    {(product.texture || product.finish || product.coverage || product.spf) && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Product Details</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {product.texture && (
                            <Badge variant="outline" className="bg-white/50 text-gray-700">
                              Texture: {product.texture}
                            </Badge>
                          )}
                          {product.finish && (
                            <Badge variant="outline" className="bg-white/50 text-gray-700">
                              Finish: {product.finish}
                            </Badge>
                          )}
                          {product.coverage && (
                            <Badge variant="outline" className="bg-white/50 text-gray-700">
                              Coverage: {product.coverage}
                            </Badge>
                          )}
                          {product.spf && (
                            <Badge variant="outline" className="bg-white/50 text-gray-700">
                              SPF: {product.spf}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Suitability Section */}
                    {(product.skin_types?.length > 0 || product.best_for?.length > 0) && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Suitability</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {product.skin_types?.map((type, index) => (
                            <Badge key={`skin-${index}`} variant="outline" className="bg-white/50 text-gray-700">
                              {type}
                            </Badge>
                          ))}
                          {product.best_for?.map((item, index) => (
                            <Badge key={`best-${index}`} variant="outline" className="bg-white/50 text-gray-700">
                              Best for: {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Free Of Section */}
                    {product.free_of && product.free_of.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Free Of</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {product.free_of.map((item, index) => (
                            <Badge key={index} variant="outline" className="bg-white/50 text-gray-700">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    {product.reviews && product.reviews.length > 0 ? (
                      <div className="space-y-4">
                        {product.reviews.map((review, index) => (
                          <ReviewCard key={index} review={review} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No reviews available for this product yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'videos' && (
                  <div>
                    {product.resources && product.resources.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {product.resources.map((resourceItem, index) => (
                          <ResourcePreview 
                            key={index} 
                            resource={resourceItem.resource as EnhancedResource} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No videos or articles available for this product yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};