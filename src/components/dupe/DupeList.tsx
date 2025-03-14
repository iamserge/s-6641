
import { Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Dupe, Product } from "@/types/dupe";
import DupeCard from "@/components/dupe/DupeCard";

interface DupeListProps {
  isLoadingDupes: boolean;
  product: Product;
  setActiveDupeIndex: (index: number) => void;
  setShowBottomBar: (show: boolean) => void;
  heroRef: React.RefObject<HTMLDivElement>;
}

export const DupeList = ({ 
  isLoadingDupes, 
  product, 
  setActiveDupeIndex, 
  setShowBottomBar,
  heroRef
}: DupeListProps) => {
  const dupeRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  useEffect(() => {
    if (!product?.dupes || dupeRefs.current.length === 0) return;
  
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        
        if (visibleEntries.length > 0) {
          const index = dupeRefs.current.findIndex(
            ref => ref === visibleEntries[0].target
          );
          
          if (index !== -1) {
            setActiveDupeIndex(index);
            setShowBottomBar(true);
          }
        }
      },
      { 
        threshold: [0.3],
        rootMargin: "-100px 0px" 
      }
    );
    
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShowBottomBar(false);
        }
      },
      { threshold: 0.3 }
    );
  
    dupeRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    
    if (heroRef.current) {
      heroObserver.observe(heroRef.current);
    }
  
    return () => {
      dupeRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
      
      if (heroRef.current) heroObserver.unobserve(heroRef.current);
      
      observer.disconnect();
      heroObserver.disconnect();
    };
  }, [product?.dupes, setActiveDupeIndex, setShowBottomBar, heroRef]);

  if (isLoadingDupes) {
    return (
      <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-pink-100/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4 mx-auto" />
          <p className="text-xl text-gray-700 mb-2">Searching for perfect dupes...</p>
          <p className="text-gray-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!product.dupes || product.dupes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-pink-100/30 text-center">
        <p className="text-xl text-gray-700 mb-2">No dupes found for this product.</p>
        <p className="text-gray-500">Try searching for a different product.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {product.dupes.map((dupe, index) => (
        <div
          key={dupe?.id}
          ref={el => dupeRefs.current[index] = el}
        >
          <DupeCard
            dupe={dupe}
            index={index}
            originalIngredients={product.ingredients?.map(i => i.name) || []}
            originalPrice={product.price}
          />
        </div>
      ))}
    </div>
  );
};

export default DupeList;
