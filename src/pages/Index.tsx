import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ResultsGallery from "../components/ResultsGallery";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useCallback } from 'react';

const TrendingPill = ({ product }: { product: { name: string; brand: string } }) => (
  <div className="bg-white/60 px-4 py-2 rounded-full border border-pink-100 inline-flex items-center gap-2 hover:bg-white/80 transition-all duration-200 cursor-pointer shadow-sm min-w-fit mx-2">
    <div className="flex flex-col items-start">
      <span className="text-gray-800 text-sm font-medium leading-snug">{product.name}</span>
      <span className="text-gray-500 text-xs leading-none">by {product.brand}</span>
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

const Index = () => {
  const trendingProducts = [
    { name: "Flawless Filter", brand: "Charlotte Tilbury" },
    { name: "Soft Pinch Liquid Blush", brand: "Rare Beauty" },
    { name: "Airwrap Complete", brand: "Dyson" },
    { name: "Protini Polypeptide Cream", brand: "Drunk Elephant" },
    { name: "Cloud Paint", brand: "Glossier" },
    { name: "No. 3 Hair Perfector", brand: "Olaplex" },
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: true,
    containScroll: "trimSnaps",
    speed: 5,
  });

  const onMouseEnter = useCallback(() => {
    if (emblaApi) emblaApi.stop();
  }, [emblaApi]);

  const onMouseLeave = useCallback(() => {
    if (emblaApi) emblaApi.play();
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.play();
    }
  }, [emblaApi]);

  const stats = [
    { label: "Products", value: "1,249+" },
    { label: "Brands", value: "350+" },
    { label: "Happy Users", value: "15,000+" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      
      <div className="relative">
        <Hero />
        
        {/* Trending Section with Auto-sliding Pills */}
        <div className="container mx-auto px-4 -mt-12 relative z-10">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0"
            >
              <Flame className="w-6 h-6 text-orange-500" />
            </motion.div>
            
            <div 
              className="overflow-hidden flex-1" 
              ref={emblaRef}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <div className="flex">
                {/* Double the items for seamless looping */}
                {[...trendingProducts, ...trendingProducts].map((product, index) => (
                  <motion.div
                    key={`${product.name}-${index}`}
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
      </div>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-4xl font-bold text-primary">{stat.value}</div>
            <div className="text-lg text-secondary">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Recent Dupes Section */}
      <section className="container mx-auto px-4 py-12">
        <RecentDupes />
      </section>

      <ResultsGallery />
      <Footer />
    </div>
  );
};

export default Index;
