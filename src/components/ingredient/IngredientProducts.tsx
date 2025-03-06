import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { memo } from "react";

interface IngredientProductsProps {
  products: any[];
  ingredientId: string;
  isKeyOnly?: boolean;
}

const IngredientProductsComponent = ({ products, ingredientId, isKeyOnly = true }: IngredientProductsProps) => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const pageSize = 6;

  const { data: paginatedProducts, isLoading, isFetching } = useQuery({
    queryKey: ["ingredientProducts", ingredientId, page, isKeyOnly],
    queryFn: async () => {
      if (page === 1) return products;
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from("product_ingredients")
        .select(`
          products:product_id(
            id, name, brand, slug, image_url, category, price,
            rating, rating_count,
            product_dupes!product_dupes_dupe_product_id_fkey(match_score)
          )
        `)
        .eq("ingredient_id", ingredientId)
        .eq("is_key_ingredient", isKeyOnly)
        .range(from, to);
      
      if (error) throw error;
      
      return data?.map(item => item.products) || [];
    },
    enabled: page > 1 || products.length === 0
  });

  const { data: totalCount } = useQuery({
    queryKey: ["ingredientProductsCount", ingredientId, isKeyOnly],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("product_ingredients")
        .select("*", { count: "exact", head: true })
        .eq("ingredient_id", ingredientId)
        .eq("is_key_ingredient", isKeyOnly);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const hasMore = totalCount ? page * pageSize < totalCount : false;

  const handleProductClick = (slug: string) => {
    navigate(`/dupes/for/${slug}`);
  };

  const displayProducts = paginatedProducts || products;

  const toggleIsKeyOnly = () => {
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-end mb-6">
        <div className="space-x-2">
          <Button 
            variant={isKeyOnly ? "default" : "outline"}
            size="sm"
            onClick={() => toggleIsKeyOnly()}
            className={isKeyOnly ? "bg-[#5840c0] hover:bg-[#4330a0] text-white" : ""}
          >
            Key Ingredients
          </Button>
          <Button 
            variant={!isKeyOnly ? "default" : "outline"}
            size="sm"
            onClick={() => toggleIsKeyOnly()}
            className={!isKeyOnly ? "bg-[#5840c0] hover:bg-[#4330a0] text-white" : ""}
          >
            All Products
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.4 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleProductClick(product.slug)}
          >
            <div className="p-6 flex flex-col items-center">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-white shadow-sm mb-4 flex items-center justify-center">
                <CategoryImage
                  category={product.category}
                  imageUrl={product.image_url}
                  name={product.name}
                  className="object-contain w-full h-full p-1"
                />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center line-clamp-2 mb-1">
                {product.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-3">by {product.brand}</p>
              
              <div className="flex justify-center items-center gap-2 mb-3">
                <Badge variant="secondary" className="rounded-full bg-[#d2c9f9] text-[#5840c0]">
                  ${Math.round(product.price || 0)}
                </Badge>
                
                {product.category && (
                  <Badge variant="outline" className="rounded-full">
                    {product.category}
                  </Badge>
                )}
              </div>
              
              {product.rating && (
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">
                    {product.rating.toFixed(1)}
                    {product.rating_count && (
                      <span className="text-xs text-gray-500"> ({product.rating_count})</span>
                    )}
                  </span>
                </div>
              )}
              
              {product.product_dupes && product.product_dupes.length > 0 ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1 bg-green-50 text-green-700">
                  Has {product.product_dupes.length} dupes
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full px-3 py-1 bg-gray-50 text-gray-600">
                  No dupes yet
                </Badge>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {isFetching && (
        <div className="flex justify-center mt-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#5840c0]" />
        </div>
      )}

      {hasMore && !isFetching && (
        <div className="flex justify-center mt-8">
          <Button 
            onClick={() => setPage(prev => prev + 1)}
            variant="outline"
            className="gap-2"
          >
            Load More
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {displayProducts.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-xl">
          <p className="text-lg text-gray-600">No products found containing this ingredient.</p>
        </div>
      )}
    </div>
  );
};

export const IngredientProducts = memo(IngredientProductsComponent);
