
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import ResultsGallery from '@/components/ResultsGallery';
import Navbar from '@/components/Navbar';
import { Loader2 } from 'lucide-react';

// Define the types for our data structure
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

        // Transform data to match ResultsGallery format
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
            purchaseLink: dupe.purchase_link
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      <ResultsGallery data={data} />
    </div>
  );
};

export default DupePage;
