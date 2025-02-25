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

interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'Video' | 'YouTube' | 'Instagram' | 'TikTok' | 'Article';
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
  resources: Resource[];
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
          .select('*, dupes(*), resources(*)')
          .eq('slug', slug)
          .single();

        if (productError) throw productError;
        if (!product) throw new Error('Product not found');

        const transformedData = {
          original: {
            name: product.name,
            brand: product.brand,
            price: product.price,
            attributes: product.attributes,
            imageUrl: product.image_url
          },
          dupes: product.dupes.map((dupe: any) => ({
            name: dupe.name,
            brand: dupe.brand,
            price: dupe.price,
            savingsPercentage: dupe.savings_percentage,
            keyIngredients: dupe.key_ingredients,
            texture: dupe.texture,
            finish: dupe.finish,
            spf: dupe.spf,
            skinTypes: dupe.skin_types,
            matchScore: dupe.match_score,
            notes: dupe.notes,
            purchaseLink: dupe.purchase_link,
            imageUrl: dupe.image_url
          })),
          summary: product.summary,
          resources: product.resources.map((resource: any) => ({
            title: resource.title,
            url: resource.url,
            type: resource.type
          }))
        };

        setData(transformedData);
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
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="mb-12 overflow-hidden bg-white/50 backdrop-blur-sm border-[#9b87f5]/20">
            <CardHeader className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge variant="secondary" className="mb-2 bg-[#9b87f5] text-white">Original</Badge>
                    <CardTitle className="text-3xl font-light mb-1">{data.original.brand}</CardTitle>
                    <h2 className="text-2xl font-medium text-gray-900">{data.original.name}</h2>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-[#9b87f5]"
                >
                  ${data.original.price}
                </motion.div>
              </div>
              {data.original.imageUrl && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  src={data.original.imageUrl}
                  alt={data.original.name}
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
              )}
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2"
              >
                {data.original.attributes.map((attribute: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-white/50">
                    {attribute}
                  </Badge>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {data.dupes.map((dupe: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * index }}
              whileHover={{ y: -5 }}
              className="relative"
            >
              <Card className="h-full bg-white/50 backdrop-blur-sm border-[#0EA5E9]/20">
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="secondary" className="bg-[#0EA5E9] text-white">
                      {dupe.matchScore}% Match
                    </Badge>
                    <span className="text-xl font-bold text-[#0EA5E9]">${dupe.price}</span>
                  </div>
                  {dupe.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mb-4"
                    >
                      <img
                        src={dupe.imageUrl}
                        alt={dupe.name}
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                    </motion.div>
                  )}
                  <CardTitle className="text-xl mb-1">{dupe.brand}</CardTitle>
                  <h3 className="text-lg text-gray-600">{dupe.name}</h3>
                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                    Save {dupe.savingsPercentage}%
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {dupe.keyIngredients.map((ingredient: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs bg-white/50">
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Texture</p>
                        <p className="font-medium">{dupe.texture}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Finish</p>
                        <p className="font-medium">{dupe.finish}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-500 mb-1">Best for</p>
                      <div className="flex flex-wrap gap-1">
                        {dupe.skinTypes.map((type: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {dupe.notes && (
                      <p className="text-sm text-gray-600 italic border-l-2 border-[#0EA5E9]/20 pl-3">
                        {dupe.notes}
                      </p>
                    )}
                  </div>

                  {dupe.purchaseLink && (
                    <motion.a
                      href={dupe.purchaseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-[#0EA5E9] rounded-md hover:bg-[#0EA5E9]/90 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Shop Now <ExternalLink className="ml-2 h-4 w-4" />
                    </motion.a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {data.resources && data.resources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-medium text-gray-900 mb-6">Additional Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.resources.map((resource: Resource, index: number) => (
                <motion.a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 rounded-lg hover:bg-white/50 transition-colors border border-gray-100"
                  whileHover={{ y: -2 }}
                >
                  <Badge variant="outline">{resource.type}</Badge>
                  <span className="flex-1 text-sm text-gray-600">{resource.title}</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DupePage;
