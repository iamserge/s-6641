
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ResultsGallery from "../components/ResultsGallery";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const TrendingPill = ({ text }: { text: string }) => (
  <motion.div 
    className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-2 rounded-full 
               border border-pink-100 inline-flex items-center gap-2 hover:scale-105 transition-transform"
    whileHover={{ y: -2 }}
  >
    <Sparkles className="w-4 h-4 text-pink-400" />
    <span className="text-gray-700">{text}</span>
  </motion.div>
);

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

      {/* Trending Products Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.h2 
          className="text-2xl text-gray-700 mb-6 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Trending Searches
        </motion.h2>
        <motion.div 
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {trendingProducts.map((product, index) => (
            <motion.div
              key={product}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <TrendingPill text={product} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <ResultsGallery />
      <Footer />
    </div>
  );
};

export default Index;
