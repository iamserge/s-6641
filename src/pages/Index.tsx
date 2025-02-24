
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ResultsGallery from "../components/ResultsGallery";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { Flame, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProductWithCounts {
  id: string;
  name: string;
  brand: string;
  slug: string;
  dupes: { count: number; };
  resources: { count: number; };
}

const TrendingPill = ({ text }: { text: string }) => (
  <motion.div 
    className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-2 rounded-full 
               border border-pink-100 inline-flex items-center gap-2 hover:scale-105 transition-transform"
    animate={{ 
      y: [0, -10, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }}
  >
    <Flame className="w-4 h-4 text-orange-500" />
    <span className="text-gray-700">{text}</span>
  </motion.div>
);

const RecentDupes = () => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useQuery<ProductWithCounts[]>({
    queryKey: ['recentDupes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          brand,
          slug,
          dupes(count),
          resources(count)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products?.map((product) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/dupes/for/${product.slug}`)}
          >
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                {product.brand}
              </CardTitle>
              <p className="text-2xl font-light text-gray-600 mt-2">
                {product.name}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">
                    {product.dupes.count || 0} dupes found
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.resources.count || 0} resources
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

const Index = () => {
  const trendingProducts = [
    "Charlotte Tilbury Flawless Filter",
    "Rare Beauty Blush",
    "Dyson Airwrap",
    "Drunk Elephant Protini",
    "Glossier Cloud Paint",
    "Olaplex No. 3",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      <Hero />

      {/* Trending Products Section - Moved right after Hero */}
      <section className="container mx-auto px-4 py-8">
        <motion.div 
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {trendingProducts.map((product, index) => (
            <motion.div
              key={product}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.2 }}
            >
              <TrendingPill text={product} />
            </motion.div>
          ))}
        </motion.div>
      </section>
      
      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="text-4xl font-semibold text-pink-500">$10+</div>
          <div className="text-gray-600 mt-2">Average Savings Per Product</div>
        </motion.div>
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="text-4xl font-semibold text-pink-500">5K+</div>
          <div className="text-gray-600 mt-2">Products Analyzed</div>
        </motion.div>
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-4xl font-semibold text-pink-500">98%</div>
          <div className="text-gray-600 mt-2">Match Accuracy</div>
        </motion.div>
      </section>

      {/* Recent Dupes Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.h2 
          className="text-3xl font-bold text-gray-800 mb-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Recently Added Dupes
        </motion.h2>
        <RecentDupes />
      </section>

      <ResultsGallery />
      <Footer />
    </div>
  );
};

export default Index;
