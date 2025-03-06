import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import DupeProductCard from "@/components/dupe/DupeProductCard";

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

  const fetchRecentDupes = useCallback(async () => {
    try {
      const { data: productsWithDupes, error: dupeError } = await supabase
        .from('product_dupes')
        .select('original_product_id, savings_percentage')
        .order('savings_percentage', { ascending: false })
        .limit(10);

      if (dupeError) throw dupeError;
      
      if (!productsWithDupes || !productsWithDupes.length) {
        return [];
      }
      
      const productIds = productsWithDupes.map(item => item.original_product_id);
      
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
          .eq('original_product_id', product?.id)
          .order('savings_percentage', { ascending: false });

        if (relationsError) {
          console.error(`Error fetching dupes for product ${product?.id}:`, relationsError);
          return {
            ...product,
            dupes: [],
            highest_savings: 0,
            highest_match: 0
          };
        }

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
            id: relation.dupe?.id,
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
      
      return productsWithDupeDetails.map(product => {
        const dupeInfo = product.dupes && product.dupes.length > 0 ? {
          coverage: product.coverage,
          confidence_level: product.confidence_level,
          longevity_comparison: product.longevity_comparison,
          cruelty_free: product.cruelty_free,
          vegan: product.vegan
        } : null;
        
        const recentDupe: RecentDupe = {
          id: product?.id,
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
  }, []);

  const { data: recentDupes, isLoading, isError } = useQuery({
    queryKey: ["recentDupes"],
    queryFn: fetchRecentDupes,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleProductClick = useCallback((slug: string) => {
    navigate(`/dupes/for/${slug}`);
  }, [navigate]);

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
        {recentDupes?.map((product, index) => (
          <DupeProductCard 
            key={product.slug}
            product={product}
            onClick={() => handleProductClick(product.slug)}
            index={index}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentDupes;
