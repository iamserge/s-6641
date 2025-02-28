
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryImage } from "@/components/dupe/CategoryImage";

interface BrandProductsProps {
  products: any[];
  brandId: string;
}

export const BrandProducts = ({ products, brandId }: BrandProductsProps) => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const pageSize = 6;

  // Query to fetch more products for pagination
  const { data: paginatedProducts, isLoading, isFetching } = useQuery({
    queryKey: ["brandProducts", brandId, page],
    queryFn: async () => {
      if (page === 1) return products; // Use initial products for first page
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, slug, image_url, category, price,
          product_dupes!product_dupes_dupe_product_id_fkey(match_score)
        `)
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data || [];
    },
    enabled: page > 1 || products.length === 0,
    keepPreviousData: true
  });

  // Calculate if there are more products to load
  const { data: totalCount } = useQuery({
    queryKey: ["brandProductsCount", brandId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brandId);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const hasMore = totalCount ? page * pageSize < totalCount : false;

  const handleProductClick = (slug: string) => {
    navigate(`/dupes/for/${slug}`);
  };

  const displayProducts = paginatedProducts || products;

  return (
    <div className="max-w-6xl mx-auto">
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
              
              <h3 className="text-lg font-semibold text-gray-900 text-center line-clamp-2 mb-2">
                {product.name}
              </h3>
              
              <div className="flex justify-center items-center gap-2 mb-4">
                <Badge variant="secondary" className="rounded-full bg-[#d2c9f9] text-[#5840c0]">
                  ${Math.round(product.price || 0)}
                </Badge>
                
                {product.category && (
                  <Badge variant="outline" className="rounded-full">
                    {product.category}
                  </Badge>
                )}
              </div>
              
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

      {/* Loading indicator */}
      {isFetching && (
        <div className="flex justify-center mt-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#5840c0]" />
        </div>
      )}

      {/* Load more button */}
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

      {/* Empty state */}
      {displayProducts.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-xl mt-4">
          <p className="text-lg text-gray-600">No products found for this brand.</p>
        </div>
      )}
    </div>
  );
};
