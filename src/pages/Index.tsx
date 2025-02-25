import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
        .select("name, brand, slug")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching recent dupes:", error);
        throw error;
      }
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Dupes</CardTitle>
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
          <CardTitle>Recent Dupes</CardTitle>
        </CardHeader>
        <CardContent>Error loading recent dupes.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Recent Dupes</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentDupes?.map((dupe) => (
          <motion.div
            key={dupe.slug}
            className="p-4 rounded-md shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => navigate(`/dupes/for/${dupe.slug}`)}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="text-lg font-semibold text-primary">{dupe.name}</h3>
            <p className="text-sm text-secondary">by {dupe.brand}</p>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-pink-50 to-white">
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, rgba(252, 231, 243, 0.8) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 70% 30%, rgba(252, 231, 243, 0.8) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 30% 70%, rgba(252, 231, 243, 0.8) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </div>
  </div>
);

const Index = () => {
  const trendingProducts = [
    { name: "Flawless Filter", brand: "Charlotte Tilbury" },
    { name: "Soft Pinch Liquid Blush", brand: "Rare Beauty" },
    { name: "Airwrap Complete", brand: "Dyson" },
    { name: "Cloud Paint", brand: "Glossier" },
    { name: "No. 3 Hair Perfector", brand: "Olaplex" },
  ];

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />
      
      <div className="relative">
        <Hero />
        
        {/* Trending Section */}
        <div className="container mx-auto px-4 mt-12 relative z-10">
          <div className="flex items-center gap-6 max-w-4xl mx-auto overflow-x-auto no-scrollbar">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0"
            >
              <Flame className="w-6 h-6 text-orange-500" />
            </motion.div>
            
            <div className="flex gap-4">
              {trendingProducts.map((product, index) => (
                <motion.div
                  key={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TrendingPill product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12">
        <RecentDupes />
      </section>

      <Footer />
    </div>
  );
};

export default Index;
