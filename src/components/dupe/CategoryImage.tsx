
import { ProductCategory } from "@/types/dupe";
import { useState, useEffect } from "react";

// Define available placeholder images
const PLACEHOLDER_COUNT = 3; // Could be dynamically determined based on files in folder
const getPlaceholderForProduct = (category: string): string => {
  // Simple hash function to consistently map category to a number 1-3
  const hash = Array.from(category).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const placeholderNum = (hash % PLACEHOLDER_COUNT) + 1;
  return `/placeholders/${placeholderNum}.png`;
};

export interface CategoryImageProps {
  category?: ProductCategory | null;
  imageUrl?: string | null;
  images?: string[];
  alt: string;
  className?: string;
}

export const CategoryImage = ({ category, imageUrl, images, alt, className }: CategoryImageProps) => {
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const fallbackSrc = category ? getPlaceholderForProduct(category) : "/placeholders/1.png";

  useEffect(() => {
    const processImage = async () => {
      setProcessedImage(fallbackSrc); 
    };

    processImage();
  }, [imageUrl, images, fallbackSrc]);

  return (
    <img
      src={processedImage || fallbackSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallbackSrc;
      }}
    />
  );
};
