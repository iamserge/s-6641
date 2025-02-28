
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialMediaResource } from "@/components/dupe/SocialMediaResource";
import { EnhancedResource } from "@/types/dupe";

interface BrandResourcesProps {
  resources: any[];
  brandId?: string;
}

export const BrandResources = ({ resources, brandId }: BrandResourcesProps) => {
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Query to fetch more resources for pagination
  const { data: paginatedResources, isLoading, isFetching } = useQuery({
    queryKey: ["brandResources", brandId, page],
    queryFn: async () => {
      if (page === 1) return resources; // Use initial resources for first page
      if (!brandId) return [];
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from("resources")
        .select(`
          id, title, url, type,
          video_thumbnail, video_duration, 
          author_name, author_handle,
          views_count, likes_count, embed_code,
          created_at
        `)
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data || [];
    },
    enabled: page > 1 && !!brandId,
    keepPreviousData: true
  });

  // Calculate if there are more resources to load
  const { data: totalCount } = useQuery({
    queryKey: ["brandResourcesCount", brandId],
    queryFn: async () => {
      if (!brandId) return 0;
      
      const { count, error } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brandId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!brandId
  });

  const hasMore = totalCount ? page * pageSize < totalCount : false;
  const displayResources = paginatedResources || resources;

  return (
    <div className="max-w-6xl mx-auto">
      {displayResources.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
              >
                <SocialMediaResource 
                  resource={resource as EnhancedResource} 
                  index={index}
                />
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
        </>
      ) : (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-xl">
          <p className="text-lg text-gray-600">No resources found for this brand.</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for tutorials, reviews, and more.</p>
        </div>
      )}
    </div>
  );
};
