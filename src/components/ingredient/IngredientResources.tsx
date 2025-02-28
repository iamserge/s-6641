
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialMediaResource } from "@/components/dupe/SocialMediaResource";
import { EnhancedResource } from "@/types/dupe";

interface IngredientResourcesProps {
  resources: any[];
  ingredientId?: string;
}

export const IngredientResources = ({ resources, ingredientId }: IngredientResourcesProps) => {
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Query to fetch more resources for pagination
  const { data: paginatedResources, isLoading, isFetching } = useQuery({
    queryKey: ["ingredientResources", ingredientId, page],
    queryFn: async () => {
      if (page === 1) return resources; // Use initial resources for first page
      if (!ingredientId) return [];
      
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
        .eq("ingredient_id", ingredientId)
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data || [];
    },
    enabled: page > 1 && !!ingredientId,
    keepPreviousData: true
  });

  // Calculate if there are more resources to load
  const { data: totalCount } = useQuery({
    queryKey: ["ingredientResourcesCount", ingredientId],
    queryFn: async () => {
      if (!ingredientId) return 0;
      
      const { count, error } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("ingredient_id", ingredientId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!ingredientId
  });

  const hasMore = totalCount ? page * pageSize < totalCount : false;
  const displayResources = paginatedResources || resources;
  
  // Group resources by type for better organization
  const groupedResources = displayResources.reduce((acc, resource) => {
    const type = resource.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(resource);
    return acc;
  }, {} as Record<string, any[]>);

  const resourceTypes = Object.keys(groupedResources);

  return (
    <div className="max-w-6xl mx-auto">
      {displayResources.length > 0 ? (
        <>
          {resourceTypes.map(type => (
            <div key={type} className="mb-12">
              <h3 className="text-xl font-medium text-gray-800 mb-6 px-4">{type} Resources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedResources[type].map((resource, index) => (
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
            </div>
          ))}

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
          <p className="text-lg text-gray-600">No resources found for this ingredient.</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for tutorials, articles, and more.</p>
        </div>
      )}
    </div>
  );
};
