
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Brand {
  id: string;
  name: string;
  slug: string;
  country_of_origin?: string | null;
  description?: string | null;
}

const BrandsDirectory = () => {
  const { data: brands, isLoading, error } = useQuery({
    queryKey: ["brandsDirectory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, slug, country_of_origin, description")
        .order("name");
      
      if (error) throw error;
      return data as Brand[];
    }
  });

  // Group brands by first letter
  const groupedBrands = brands?.reduce((acc, brand) => {
    const firstLetter = brand.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(brand);
    return acc;
  }, {} as Record<string, Brand[]>) || {};

  // Sort the letters alphabetically
  const sortedLetters = Object.keys(groupedBrands).sort();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-pink-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-12 text-center">Brands Directory</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-violet-700" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500">There was an error loading the brands.</p>
          </div>
        ) : sortedLetters.length === 0 ? (
          <div className="text-center py-16">
            <p>No brands found.</p>
          </div>
        ) : (
          <div className="grid gap-12">
            {sortedLetters.map(letter => (
              <div key={letter}>
                <h2 className="text-4xl font-bold mb-6 text-violet-800 border-b border-violet-100 pb-2">
                  {letter}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedBrands[letter].map(brand => (
                    <Link 
                      key={brand.id} 
                      to={`/brands/${brand.slug}`}
                      className="block p-6 rounded-lg bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow border border-violet-100/50"
                    >
                      <h3 className="text-xl font-semibold mb-2 text-violet-700">{brand.name}</h3>
                      {brand.country_of_origin && (
                        <p className="text-sm text-gray-500 mb-2">Origin: {brand.country_of_origin}</p>
                      )}
                      {brand.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{brand.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default BrandsDirectory;
