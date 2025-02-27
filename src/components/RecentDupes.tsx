
import { motion } from "framer-motion";
import { Shield, Droplet, Check, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DupeInfo {
  coverage?: string | null;
  confidence_level?: number | null;
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

interface RecentDupe {
  name: string;
  brand: string;
  slug: string;
  country_of_origin?: string | null;
  longevity_rating?: number | null;
  free_of?: string[] | null;
  best_for?: string[] | null;
  brandInfo: BrandInfo | null;
  dupeInfo: DupeInfo | null;
}

const RecentDupes = () => {
  const navigate = useNavigate();

  const { data: recentDupes, isLoading, isError } = useQuery({
    queryKey: ["recentDupes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          name,
          brand,
          slug,
          country_of_origin,
          longevity_rating,
          free_of,
          best_for,
          coverage,
          confidence_level,
          longevity_comparison,
          cruelty_free,
          vegan,
          dupes:product_dupes!product_dupes_original_product_id_fkey(
            match_score,
            savings_percentage
          ),
          brands!products_brand_id_fkey (
            name,
            country_of_origin,
            sustainable_packaging,
            cruelty_free,
            vegan
          )
        `)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching recent dupes:", error);
        throw error;
      }
      
      return data.map(product => {
        const dupeInfo = product.dupes && product.dupes.length > 0 ? {
          coverage: product.coverage,
          confidence_level: product.confidence_level ? parseFloat(product.confidence_level) : null,
          longevity_comparison: product.longevity_comparison,
          cruelty_free: product.cruelty_free,
          vegan: product.vegan
        } : null;
        
        const recentDupe: RecentDupe = {
          name: product.name,
          brand: product.brands?.name || product.brand,
          slug: product.slug,
          country_of_origin: product.country_of_origin,
          longevity_rating: product.longevity_rating,
          free_of: product.free_of,
          best_for: product.best_for,
          brandInfo: product.brands as BrandInfo || null,
          dupeInfo: dupeInfo
        };

        return recentDupe;
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Dupes Found</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin" />
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
        <CardTitle>Recent Dupes Found</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentDupes?.map((dupe) => (
          <motion.div
            key={dupe.slug}
            className="p-4 rounded-md shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer bg-white/50 backdrop-blur-sm"
            onClick={() => navigate(`/dupes/for/${dupe.slug}`)}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="text-lg font-semibold text-primary">{dupe.name}</h3>
            <p className="text-sm text-secondary mb-2">by {dupe.brand}</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {dupe.dupeInfo?.coverage && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Droplet className="w-3 h-3 mr-1" />
                  {dupe.dupeInfo.coverage} Coverage
                </Badge>
              )}
              {dupe.dupeInfo?.confidence_level && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Check className="w-3 h-3 mr-1" />
                  {dupe.dupeInfo.confidence_level}% Match
                </Badge>
              )}
              {dupe.dupeInfo?.longevity_comparison && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Clock className="w-3 h-3 mr-1" />
                  {dupe.dupeInfo.longevity_comparison} Wear Time
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {dupe.brandInfo?.sustainable_packaging && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Sustainable
                </Badge>
              )}
              {(dupe.dupeInfo?.cruelty_free || dupe.brandInfo?.cruelty_free) && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Cruelty-Free
                </Badge>
              )}
              {(dupe.dupeInfo?.vegan || dupe.brandInfo?.vegan) && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  Vegan
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
