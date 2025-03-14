
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const IngredientsDirectory = () => {
  const [ingredients, setIngredients] = useState<Record<string, Ingredient[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const { data, error } = await supabase
          .from('ingredients')
          .select('id, name, slug, description')
          .order('name');
        
        if (error) throw error;
        
        // Organize ingredients by first letter
        const organizedIngredients: Record<string, Ingredient[]> = {};
        
        data.forEach((ingredient: Ingredient) => {
          const firstLetter = ingredient.name.charAt(0).toUpperCase();
          if (!organizedIngredients[firstLetter]) {
            organizedIngredients[firstLetter] = [];
          }
          organizedIngredients[firstLetter].push(ingredient);
        });
        
        setIngredients(organizedIngredients);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        setError('Failed to load ingredients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  return (
    <div className="min-h-screen font-urbanist bg-gradient-to-b from-blue-50 to-pink-50">
      <AnimatedBackground />
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
            Ingredient Directory
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-center mb-16">
            Explore our comprehensive list of skincare and beauty ingredients. Learn about their properties and discover products that contain them.
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
              {Object.keys(ingredients).sort().map((letter) => (
                <div key={letter} id={letter} className="scroll-mt-24">
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-pink-100 p-6">
                    <h2 className="text-3xl font-bold text-violet-700 mb-6">{letter}</h2>
                    <Separator className="mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ingredients[letter].map((ingredient) => (
                        <Link 
                          key={ingredient.id} 
                          to={`/ingredients/${ingredient.slug}`}
                          className="p-3 rounded-lg hover:bg-violet-50 transition-colors"
                        >
                          <div className="font-medium text-violet-900">{ingredient.name}</div>
                          {ingredient.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {ingredient.description}
                            </p>
                          )}
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
              <div className="flex gap-2 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-md border border-pink-100">
                {Object.keys(ingredients).sort().map((letter) => (
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

export default IngredientsDirectory;
