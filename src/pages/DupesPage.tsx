
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DupeProductCard from "@/components/dupe/DupeProductCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { DupeInfo, BrandInfo } from "@/types/product";

// Categories matching the ones in PopularCategories component
const categories = [
  { id: "all", name: "All Categories" },
  { id: "Skincare", name: "Skincare" },
  { id: "Makeup", name: "Makeup" },
  { id: "Haircare", name: "Haircare" },
  { id: "Fragrance", name: "Fragrance" }
];

const DupesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "all"
  );

  // Update URL when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", selectedCategory);
    }
    setSearchParams(searchParams);
  }, [selectedCategory, searchParams, setSearchParams]);

  // Fetch dupes from Supabase
  const fetchDupes = useCallback(async () => {
    try {
      let query = supabase
        .from('product_dupes')
        .select('original_product_id, savings_percentage')
        .order('savings_percentage', { ascending: false });
      
      const { data: productsWithDupes, error: dupeError } = await query;

      if (dupeError) throw dupeError;
      
      if (!productsWithDupes || !productsWithDupes.length) {
        return [];
      }
      
      const productIds = productsWithDupes.map(item => item.original_product_id);
      
      let productsQuery = supabase
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
        
      // Apply category filter if selected
      if (selectedCategory && selectedCategory !== "all") {
        productsQuery = productsQuery.eq('category', selectedCategory);
      }

      const { data, error } = await productsQuery;

      if (error) {
        console.error("Error fetching dupes:", error);
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
            highest_match: 0,
            dupeInfo: null,
            brandInfo: null
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

        // Create the dupeInfo object from product properties
        const dupeInfo: DupeInfo = {
          coverage: product.coverage,
          confidence_level: product.confidence_level,
          longevity_comparison: product.longevity_comparison,
          cruelty_free: product.cruelty_free,
          vegan: product.vegan
        };

        // Create the brandInfo object from product.brands properties
        const brandInfo: BrandInfo = product.brands ? {
          name: product.brands.name,
          country_of_origin: product.brands.country_of_origin,
          sustainable_packaging: product.brands.sustainable_packaging,
          cruelty_free: product.brands.cruelty_free,
          vegan: product.brands.vegan
        } : null;

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          slug: product.slug,
          image_url: product.image_url,
          category: product.category,
          country_of_origin: product.country_of_origin,
          highest_match,
          highest_savings,
          dupes,
          dupeInfo,
          brandInfo
        };
      }));
      
      return productsWithDupeDetails;
    } catch (err) {
      console.error("Error in queryFn:", err);
      return [];
    }
  }, [selectedCategory]);

  const { data: dupes, isLoading, isError } = useQuery({
    queryKey: ["dupes", selectedCategory],
    queryFn: fetchDupes,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleProductClick = useCallback((slug: string) => {
    navigate(`/dupes/for/${slug}`);
  }, [navigate]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center pt-6 md:pt-8" // Added padding-top here
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-800 to-purple-600">
              Discover Beauty Dupes
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find affordable alternatives to your favorite luxury beauty products across all categories.
            </p>
          </motion.div>

          <div className="mb-10">
            <Tabs defaultValue={selectedCategory} onValueChange={handleCategoryChange} className="w-full justify-center">
              <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full border border-gray-100 shadow-sm mx-auto">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="rounded-full px-5 py-2 data-[state=active]:bg-violet-100 data-[state=active]:text-violet-800"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
              <span className="ml-4 text-lg text-violet-800">Loading dupes...</span>
            </div>
          ) : isError ? (
            <div className="text-center p-12 bg-red-50 rounded-xl">
              <p className="text-red-600">There was an error loading the dupes. Please try again later.</p>
            </div>
          ) : dupes && dupes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {dupes.map((product, index) => (
                <DupeProductCard 
                  key={product.slug}
                  product={product}
                  onClick={() => handleProductClick(product.slug)}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-xl">
              <p className="text-gray-600">No dupes found in this category. Try selecting a different category.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DupesPage;
