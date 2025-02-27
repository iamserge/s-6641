import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { Shield, Globe, Star, Droplet, Check, Clock } from "lucide-react";
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

const TrendingPill = ({ product }: { product: { name: string; brand: string } }) => (
  <div className="bg-[#F1F0FB] hover:bg-[#E5DEFF] px-8 py-2 rounded-full inline-flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-sm min-w-[200px]">
    <div className="flex flex-col items-start">
      <span className="text-gray-800 text-sm font-medium">{product.name}</span>
      <span className="text-gray-500 text-[10px]">by {product.brand}</span>
    </div>
  </div>
);

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
          dupes:product_dupes!product_dupes_original_product_id_fkey(
            coverage,
            confidence_level,
            longevity_comparison,
            cruelty_free,
            vegan
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

      return data.map((product) => {
        const dupeInfo =
          product.dupes && product.dupes.length > 0 ? product.dupes[0] as unknown as DupeInfo : null;

        return {
          ...product,
          brand: product.brands?.name || product.brand,
          brandInfo: product.brands as unknown as BrandInfo || null,
          dupeInfo: dupeInfo,
        } as RecentDupe;
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

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-white" />

      {/* Slick layered radial gradients */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.7) 0%, transparent 60%)",
          filter: "blur(90px)",
          mixBlendMode: "overlay",
        }}
        animate={{
          scale: [1, 1.05, 1],
          x: [-20, 20, -20],
          y: [-10, 10, -10],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 80% 40%, rgba(255, 105, 180, 0.6) 0%, transparent 50%)",
          filter: "blur(70px)",
          mixBlendMode: "soft-light",
        }}
        animate={{
          scale: [1.05, 1.1, 1.05],
          x: [30, -30, 30],
          y: [20, -20, 20],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      {/* Subtle studio spotlight effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 70%, rgba(255, 228, 225, 0.9) 0%, transparent 70%)",
          filter: "blur(100px)",
          mixBlendMode: "screen",
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 5, -5, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Dynamic glowing orb */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 182, 193, 0.8) 10%, transparent 80%)",
          filter: "blur(50px)",
          top: "10%",
          left: "10%",
        }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.6, 0.8, 0.5, 0.6],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      {/* Faint noise texture for studio vibe */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/noise.png')",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <section className="container mx-auto px-4 py-12">
          <RecentDupes />
        </section>
        <Footer />
      </div>
    </div>
  );
};

export default Index;