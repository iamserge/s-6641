
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
}

const BrandsDirectory = () => {
  const [brands, setBrands] = useState<Record<string, Brand[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('id, name, slug, description, logo_url')
          .order('name');
        
        if (error) throw error;
        
        // Organize brands by first letter
        const organizedBrands: Record<string, Brand[]> = {};
        
        data.forEach((brand: Brand) => {
          const firstLetter = brand.name.charAt(0).toUpperCase();
          if (!organizedBrands[firstLetter]) {
            organizedBrands[firstLetter] = [];
          }
          organizedBrands[firstLetter].push(brand);
        });
        
        setBrands(organizedBrands);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setError('Failed to load brands');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return (
    <div className="min-h-screen font-urbanist bg-gradient-to-b from-blue-50 to-pink-50">
      <AnimatedBackground />
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
            Brand Directory
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-center mb-16">
            Discover all beauty and skincare brands in our database. Find brand information and explore all their products.
          </p>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              {error}
            </div>
          ) : (
            <div className="space-y-12">
              {Object.keys(brands).sort().map((letter) => (
                <div key={letter} id={letter} className="scroll-mt-24">
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-pink-100 p-6">
                    <h2 className="text-3xl font-bold text-violet-700 mb-6">{letter}</h2>
                    <Separator className="mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {brands[letter].map((brand) => (
                        <Link 
                          key={brand.id}
                          to={`/brands/${brand.slug}`}
                          className="flex items-center gap-4 p-4 rounded-lg hover:bg-violet-50 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                            {brand.logo_url ? (
                              <img 
                                src={brand.logo_url} 
                                alt={brand.name} 
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-violet-100 flex items-center justify-center text-violet-800 font-bold text-xl">
                                {brand.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-violet-900">{brand.name}</h3>
                            {brand.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {brand.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && !error && (
            <div className="sticky bottom-4 left-0 w-full flex justify-center mt-8">
              <div className="flex flex-wrap gap-2 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-md border border-pink-100">
                {Object.keys(brands).sort().map((letter) => (
                  <a
                    key={letter}
                    href={`#${letter}`}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-violet-100 text-violet-800 font-medium text-sm transition-colors"
                  >
                    {letter}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BrandsDirectory;
