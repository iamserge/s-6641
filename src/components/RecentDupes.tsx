
import { motion } from "framer-motion";
import { Shield, Droplet, Check, DollarSign, Heart, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { getFlagEmoji } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface DupeInfo {
  coverage?: string | null;
  confidence_level?: string | null;
  longevity_comparison?: string | null;
  cruelty_free?: boolean | null;
  vegan?: boolean | null;
}

interface BrandInfo {
  name?: string | null;
  country_of_origin?: string | null;
  sustainable_packaging?: boolean | null;
  cruelty_free?: boolean | null;
  vegan?: boolean | null;
}

interface DupeSummary {
  id: string;
  name: string;
  brand: string;
  image_url?: string | null;
  category?: string | null; 
  match_score: number;
  savings_percentage: number;
}

interface RecentDupe {
  id: string;
  name: string;
  brand: string;
  slug: string;
  image_url?: string | null;
  category?: string | null;
  country_of_origin?: string | null;
  longevity_rating?: number | null;
  free_of?: string[] | null;
  best_for?: string[] | null;
  brandInfo: BrandInfo | null;
  dupeInfo: DupeInfo | null;
  dupes: DupeSummary[];
  highest_savings?: number | null;
  highest_match?: number | null;
}

const RecentDupes = () => {
  const navigate = useNavigate();

  const { data: recentDupes, isLoading, isError } = useQuery({
    queryKey: ["recentDupes"],
    queryFn: async () => {
      try {
        // First query: Get distinct original products from product_dupes table
        const { data: productsWithDupes, error: dupeError } = await supabase
          .from('product_dupes')
          .select('original_product_id, savings_percentage')
          .order('savings_percentage', { ascending: false })
          .limit(10);

        if (dupeError) throw dupeError;
        
        if (!productsWithDupes || !productsWithDupes.length) {
          return [];
        }
        
        // Get the IDs of products with dupes
        const productIds = productsWithDupes.map(item => item.original_product_id);
        
        // Query for detailed information about these products
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            brand,
            slug,
            image_url,
            category,
            country_of_origin,
            longevity_rating,
            free_of,
            best_for,
            coverage,
            confidence_level,
            longevity_comparison,
            cruelty_free,
            vegan,
            brands!products_brand_id_fkey (
              name,
              country_of_origin,
              sustainable_packaging,
              cruelty_free,
              vegan
            )
          `)
          .in('id', productIds);

        if (error) {
          console.error("Error fetching recent dupes:", error);
          throw error;
        }

        // For each product, fetch its dupes with images
        const productsWithDupeDetails = await Promise.all(data.map(async (product) => {
          const { data: dupeRelations, error: relationsError } = await supabase
            .from('product_dupes')
            .select(`
              match_score,
              savings_percentage,
              dupe:products!product_dupes_dupe_product_id_fkey(
                id,
                name,
                brand,
                image_url,
                category
              )
            `)
            .eq('original_product_id', product.id)
            .order('savings_percentage', { ascending: false });

          if (relationsError) {
            console.error(`Error fetching dupes for product ${product.id}:`, relationsError);
            return {
              ...product,
              dupes: [],
              highest_savings: 0,
              highest_match: 0
            };
          }

          // Transform and get highest savings and match score
          let highest_savings = 0;
          let highest_match = 0;
          const dupes = dupeRelations.map(relation => {
            if (relation.savings_percentage > highest_savings) {
              highest_savings = relation.savings_percentage;
            }
            
            if (relation.match_score > highest_match) {
              highest_match = relation.match_score;
            }
            
            return {
              id: relation.dupe.id,
              name: relation.dupe.name,
              brand: relation.dupe.brand, 
              image_url: relation.dupe.image_url,
              category: relation.dupe.category,
              match_score: relation.match_score,
              savings_percentage: relation.savings_percentage
            };
          });

          return {
            ...product,
            dupes,
            highest_savings,
            highest_match
          };
        }));
        
        // Map to the expected return format
        return productsWithDupeDetails.map(product => {
          const dupeInfo = product.dupes && product.dupes.length > 0 ? {
            coverage: product.coverage,
            confidence_level: product.confidence_level,
            longevity_comparison: product.longevity_comparison,
            cruelty_free: product.cruelty_free,
            vegan: product.vegan
          } : null;
          
          const recentDupe: RecentDupe = {
            id: product.id,
            name: product.name,
            brand: product.brands?.name || product.brand,
            slug: product.slug,
            image_url: product.image_url,
            category: product.category,
            country_of_origin: product.country_of_origin,
            longevity_rating: product.longevity_rating,
            free_of: product.free_of,
            best_for: product.best_for,
            brandInfo: product.brands as BrandInfo || null,
            dupeInfo: dupeInfo,
            dupes: product.dupes,
            highest_savings: product.highest_savings,
            highest_match: product.highest_match
          };

          return recentDupe;
        });
      } catch (err) {
        console.error("Error in queryFn:", err);
        return [];
      }
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-100/50 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle>Recent Discoveries</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#5840c0]" />
            <p className="text-gray-500">Fetching recent discoveries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-100/50 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle>Recent Discoveries</CardTitle>
        </CardHeader>
        <CardContent>Error loading recent dupes.</CardContent>
      </Card>
    );
  }

  if (!recentDupes || recentDupes.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-100/50 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle>Recent Discoveries</CardTitle>
        </CardHeader>
        <CardContent>No recent dupes found.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-100/50 shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle>Recent Discoveries</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recentDupes?.map((product) => (
          <motion.div
            key={product.slug}
            className="relative rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer bg-white/70 backdrop-blur-sm border border-slate-100/50 overflow-hidden flex flex-col"
            onClick={() => navigate(`/dupes/for/${product.slug}`)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Top badges row */}
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-zinc-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {product.highest_match && (
                  <Badge variant="pastelPurple" className="rounded-full text-xs font-medium px-2 py-0.5">
                    {Math.round(product.highest_match)}% Match
                  </Badge>
                )}
                
                {product.highest_savings && product.highest_savings > 0 && (
                  <Badge variant="pastelGreen" className="rounded-full text-xs font-medium px-2 py-0.5 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Save {Math.round(product.highest_savings)}%
                  </Badge>
                )}
              </div>
              
              <Badge className="bg-[#5840c0] text-white text-xs rounded-full px-2 py-0.5">
                {product.dupes.length} Dupes
              </Badge>
            </div>
            
            {/* Main content */}
            <div className="p-4 flex flex-col items-center">
              {/* Product image */}
              <div className="w-28 h-28 rounded-full overflow-hidden border border-slate-100 shadow-sm bg-white flex items-center justify-center mb-4">
                <CategoryImage
                  category={product.category}
                  imageUrl={product.image_url}
                  name={product.name}
                  className="object-contain w-full h-full p-1"
                />
              </div>
              
              {/* Product name and brand */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-600">by {product.brand}</p>
                
                {/* Country badge if available */}
                {product.country_of_origin && (
                  <div className="flex items-center gap-1 mt-1 justify-center">
                    <span className="text-sm text-gray-500">
                      {getFlagEmoji(product.country_of_origin)} {product.country_of_origin}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Dupe image stack with tooltips */}
              {product.dupes.length > 0 && (
                <div className="mb-4">
                  <TooltipProvider>
                    <div className="flex -space-x-3 justify-center">
                      {product.dupes.slice(0, 5).map((dupe, index) => (
                        <Tooltip key={dupe.id}>
                          <TooltipTrigger asChild>
                            <div 
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center"
                              style={{ zIndex: 10 - index }}
                            >
                              <CategoryImage
                                category={dupe.category}
                                imageUrl={dupe.image_url}
                                name={dupe.name}
                                className="object-contain w-full h-full p-1"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="p-3 max-w-[200px] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg">
                            <p className="font-medium text-sm">{dupe.name}</p>
                            <p className="text-xs text-gray-500">by {dupe.brand}</p>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="pastelBlue" className="text-xs px-1.5 py-0.5">
                                {Math.round(dupe.match_score)}% Match
                              </Badge>
                              {dupe.savings_percentage > 0 && (
                                <Badge variant="pastelGreen" className="text-xs px-1.5 py-0.5">
                                  Save {Math.round(dupe.savings_percentage)}%
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {product.dupes.length > 5 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-gray-50 text-xs font-medium text-gray-600">
                          +{product.dupes.length - 5}
                        </div>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              )}
            </div>
            
            {/* Feature badges at bottom */}
            <div className="bg-gray-50/50 p-3 mt-auto">
              <div className="flex flex-wrap gap-2 justify-center">
                {product.dupeInfo?.coverage && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-xs hover:bg-blue-100 transition-all">
                    <Droplet className="w-3 h-3 mr-1" />
                    {product.dupeInfo.coverage}
                  </Badge>
                )}
                
                {product.dupeInfo?.confidence_level && (
                  <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 rounded-full px-2 py-0.5 text-xs hover:bg-yellow-100 transition-all">
                    <Check className="w-3 h-3 mr-1" />
                    {product.dupeInfo.confidence_level}
                  </Badge>
                )}
                
                {(product.dupeInfo?.cruelty_free || product.brandInfo?.cruelty_free) && (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 rounded-full px-2 py-0.5 text-xs hover:bg-purple-100 transition-all">
                    <Heart className="w-3 h-3 mr-1" />
                    Cruelty-Free
                  </Badge>
                )}
                
                {(product.dupeInfo?.vegan || product.brandInfo?.vegan) && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 text-xs hover:bg-emerald-100 transition-all">
                    <Leaf className="w-3 h-3 mr-1" />
                    Vegan
                  </Badge>
                )}
                
                {product.brandInfo?.sustainable_packaging && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-xs hover:bg-green-100 transition-all">
                    <Shield className="w-3 h-3 mr-1" />
                    Sustainable
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentDupes;
