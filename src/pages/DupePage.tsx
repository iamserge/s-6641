
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Star } from 'lucide-react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from '@/components/Navbar';

interface Dupe {
  id: string;
  name: string;
  brand: string;
  price: number;
  savings_percentage: number;
  key_ingredients: string[];
  texture: string;
  finish: string;
  spf: number | null;
  skin_types: string[];
  match_score: number;
  notes: string | null;
  purchase_link: string | null;
  image_url: string | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  attributes: string[];
  image_url: string | null;
  summary: string;
  slug: string;
  dupes: Dupe[];
}

const DupePage = () => {
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDupeData = async () => {
      if (!slug) {
        setError('No product slug provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*, dupes(*)')
          .eq('slug', slug)
          .single();

        if (productError) throw productError;
        if (!product) throw new Error('Product not found');

        setData(product);
      } catch (error) {
        console.error('Error fetching dupe data:', error);
        setError('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDupeData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8F3FF] to-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#9b87f5]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8F3FF] to-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F3FF] to-white font-urbanist">
      <Navbar />
      
      {/* Hero Product Section */}
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-4xl font-light text-gray-600 mb-3">{data.brand}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-6xl font-medium text-gray-900 mb-6">{data.name}</h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-3 mb-12"
            >
              {data.attributes.map((attribute: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-white/50 backdrop-blur-sm text-gray-700 px-4 py-1"
                >
                  {attribute}
                </Badge>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="relative"
            >
              {data.image_url && (
                <img
                  src={data.image_url}
                  alt={data.name}
                  className="w-80 h-80 object-contain mx-auto"
                />
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-3xl font-medium text-[#9b87f5] mt-8"
            >
              ${data.price}
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Dupes Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {data.dupes.map((dupe: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative"
            >
              <Card className="h-full bg-white/50 backdrop-blur-sm border-[#0EA5E9]/20 overflow-hidden">
                <CardHeader className="space-y-6">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-[#0EA5E9] text-white text-lg px-4 py-1">
                      {dupe.match_score}% Match
                    </Badge>
                    <span className="text-2xl font-bold text-[#0EA5E9]">${dupe.price}</span>
                  </div>
                  
                  {dupe.image_url && (
                    <div className="relative aspect-square">
                      <img
                        src={dupe.image_url}
                        alt={dupe.name}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <p className="text-2xl font-medium mb-2">{dupe.brand}</p>
                    <h3 className="text-xl text-gray-600">{dupe.name}</h3>
                    <Badge variant="outline" className="mt-4 bg-green-50 text-green-700 border-green-200 text-lg px-4 py-1">
                      Save {dupe.savings_percentage}%
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {dupe.key_ingredients.map((ingredient: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-white/50">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 text-base">
                    <div>
                      <p className="text-gray-500 mb-2">Texture</p>
                      <p className="font-medium">{dupe.texture}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-2">Finish</p>
                      <p className="font-medium">{dupe.finish}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-2">Best for</p>
                    <div className="flex flex-wrap gap-2">
                      {dupe.skin_types.map((type: string, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-600">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {dupe.notes && (
                    <p className="text-gray-600 italic border-l-2 border-[#0EA5E9]/20 pl-4">
                      {dupe.notes}
                    </p>
                  )}

                  {dupe.purchase_link && (
                    <motion.a
                      href={dupe.purchase_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/90 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Shop Now <ExternalLink className="ml-2 h-5 w-5" />
                    </motion.a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DupePage;
