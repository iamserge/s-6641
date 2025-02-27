
import { motion } from "framer-motion";
import { Shield, Droplet, Check, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryImage } from "@/components/dupe/CategoryImage";
import { ProductCategory } from "@/types/dupe";

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
  category?: ProductCategory | null;
  match_score: number;
  savings_percentage: number;
}

interface RecentDupe {
  id: string;
  name: string;
  brand: string;
  slug: string;
  image_url?: string | null;
  category?: ProductCategory | null;
  country_of_origin?: string | null;
  longevity_rating?: number | null;
  free_of?: string[] | null;
  best_for?: string[] | null;
  brandInfo: BrandInfo | null;
  dupeInfo: DupeInfo | null;
  dupes: DupeSummary[];
  highest_savings?: number | null;
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
          .limit(6);

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
              highest_savings: 0
            };
          }

          // Transform and get highest savings
          let highest_savings = 0;
          const dupes = dupeRelations.map(relation => {
            if (relation.savings_percentage > highest_savings) {
              highest_savings = relation.savings_percentage;
            }
            
            return {
              id: relation.dupe.id,
              name: relation.dupe.name,
              brand: relation.dupe.brand, 
              image_url: relation.dupe.image_url,
              category: relation.dupe.category as ProductCategory | null,
              match_score: relation.match_score,
              savings_percentage: relation.savings_percentage
            };
          });

          return {
            ...product,
            dupes,
            highest_savings
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
            category: product.category as ProductCategory | null,
            country_of_origin: product.country_of_origin,
            longevity_rating: product.longevity_rating,
            free_of: product.free_of,
            best_for: product.best_for,
            brandInfo: product.brands as BrandInfo || null,
            dupeInfo: dupeInfo,
            dupes: product.dupes,
            highest_savings: product.highest_savings
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
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Dupes Found</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Fetching recent discoveries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Dupes Found</CardTitle>
        </CardHeader>
        <CardContent>Error loading recent dupes.</CardContent>
      </Card>
    );
  }

  if (!recentDupes || recentDupes.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Dupes Found</CardTitle>
        </CardHeader>
        <CardContent>No recent dupes found.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Recent Discoveries</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentDupes?.map((product) => (
          <motion.div
            key={product.slug}
            className="relative p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer bg-white/50 backdrop-blur-sm border border-gray-100/50"
            onClick={() => navigate(`/dupes/for/${product.slug}`)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Main product image and dupe indicator */}
            <div className="flex justify-between items-start mb-3">
              <div className="relative">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white flex items-center justify-center">
                  <CategoryImage
                    category={product.category}
                    imageUrl={product.image_url}
                    alt={product.name}
                    className="object-contain w-full h-full p-1"
                  />
                </div>
                
                {/* Dupes count indicator */}
                <div className="absolute -bottom-1 -right-1 bg-[#0EA5E9] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-white">
                  {product.dupes.length}
                </div>
              </div>
              
              {/* Highest savings if available */}
              {product.highest_savings && product.highest_savings > 0 && (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1 px-2 py-1 rounded-lg shadow-sm">
                  <DollarSign className="w-3 h-3" />
                  Save up to {Math.round(product.highest_savings)}%
                </Badge>
              )}
            </div>
            
            {/* Product info */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-gray-600">by {product.brand}</p>
            </div>
            
            {/* Dupe image stack */}
            {product.dupes.length > 0 && (
              <div className="mb-4">
                <div className="flex -space-x-3">
                  {product.dupes.slice(0, 5).map((dupe, index) => (
                    <div 
                      key={dupe.id} 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center"
                      style={{ zIndex: 10 - index }}
                    >
                      <CategoryImage
                        category={dupe.category}
                        imageUrl={dupe.image_url}
                        alt={dupe.name}
                        className="object-contain w-full h-full p-1"
                      />
                    </div>
                  ))}
                  {product.dupes.length > 5 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-gray-100 text-xs font-medium text-gray-600">
                      +{product.dupes.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Feature badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.dupeInfo?.coverage && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 rounded-full">
                  <Droplet className="w-3 h-3 mr-1" />
                  {product.dupeInfo.coverage}
                </Badge>
              )}
              
              {product.dupeInfo?.confidence_level && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 rounded-full">
                  <Check className="w-3 h-3 mr-1" />
                  {product.dupeInfo.confidence_level}
                </Badge>
              )}
              
              {(product.dupeInfo?.cruelty_free || product.brandInfo?.cruelty_free) && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 rounded-full">
                  Cruelty-Free
                </Badge>
              )}
              
              {(product.dupeInfo?.vegan || product.brandInfo?.vegan) && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 rounded-full">
                  Vegan
                </Badge>
              )}
              
              {product.brandInfo?.sustainable_packaging && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 rounded-full">
                  <Shield className="w-3 h-3 mr-1" />
                  Sustainable
                </Badge>
              )}
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentDupes;
