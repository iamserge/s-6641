
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
  resourceType?: string;
}

export const IngredientResources = ({ 
  resources, 
  ingredientId,
  resourceType 
}: IngredientResourcesProps) => {
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string | undefined>(resourceType);
  const pageSize = 6;

  // Query to fetch more resources for pagination
  const { data: paginatedResources, isLoading, isFetching } = useQuery({
    queryKey: ["ingredientResources", ingredientId, page, selectedType],
    queryFn: async () => {
      if (page === 1 && !selectedType) return resources; // Use initial resources for first page
      if (!ingredientId) return [];
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from("resources")
        .select(`
          id, title, url, type,
          video_thumbnail, video_duration, 
          author_name, author_handle,
          views_count, likes_count, embed_code,
          created_at
        `)
        .eq("ingredient_id", ingredientId);
        
      // Add type filter if selected
      if (selectedType) {
        query = query.eq("type", selectedType);
      }
      
      // Add pagination
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data || [];
    },
    enabled: (page > 1 || selectedType !== undefined) && !!ingredientId
  });

  // Calculate if there are more resources to load
  const { data: totalCount } = useQuery({
    queryKey: ["ingredientResourcesCount", ingredientId, selectedType],
    queryFn: async () => {
      if (!ingredientId) return 0;
      
      let query = supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("ingredient_id", ingredientId);
        
      // Add type filter if selected
      if (selectedType) {
        query = query.eq("type", selectedType);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!ingredientId
  });

  const hasMore = totalCount ? page * pageSize < totalCount : false;
  const displayResources = paginatedResources || resources;

  // Handle resource type change
  const handleTypeChange = (type: string | undefined) => {
    setSelectedType(type);
    setPage(1); // Reset to page 1 when changing type
  };

  // Get unique resource types for filter buttons
  const resourceTypes = ['YouTube', 'Article', 'TikTok', 'Instagram'].filter(type => 
    resources.some(resource => resource.type === type)
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Filter buttons */}
      {resourceTypes.length > 0 && (
        <div className="flex justify-center mb-6 flex-wrap gap-2">
          <Button 
            variant={selectedType === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeChange(undefined)}
            className={selectedType === undefined ? "bg-[#5840c0] hover:bg-[#4330a0] text-white" : ""}
          >
            All
          </Button>
          
          {resourceTypes.map(type => (
            <Button 
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange(type)}
              className={selectedType === type ? "bg-[#5840c0] hover:bg-[#4330a0] text-white" : ""}
            >
              {type}
            </Button>
          ))}
        </div>
      )}

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
          <p className="text-lg text-gray-600">No resources found for this ingredient.</p>
          <p className="text-sm text-gray-500 mt-2">
            Check back later for educational content, tutorials, and studies.
          </p>
        </div>
      )}
    </div>
  );
};
