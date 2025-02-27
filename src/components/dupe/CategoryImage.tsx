import { ProductCategory } from "@/types/dupe";
import { useState, useEffect } from "react";
import * as backgroundRemoval from "@imgly/background-removal";

// Define available placeholder images
const PLACEHOLDER_COUNT = 3; // Could be dynamically determined based on files in folder
const getPlaceholderForProduct = (category: string): string => {
  // Simple hash function to consistently map category to a number 1-3
  const hash = Array.from(category).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const placeholderNum = (hash % PLACEHOLDER_COUNT) + 1;
  return `/placeholders/${placeholderNum}.png`;
};

interface CategoryImageProps {
  category?: ProductCategory;
  imageUrl?: string;
  images?: string[];
  alt: string;
  className?: string;
}

export const CategoryImage = ({ category, imageUrl, images, alt, className }: CategoryImageProps) => {
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const fallbackSrc = category ? getPlaceholderForProduct(category) : "/placeholders/1.png";

  useEffect(() => {
    const processImage = async () => {
      // Use provided imageUrl or first image from images array
      const src = imageUrl || (images && images.length > 0 ? images[0] : null);

      if (src) {
        try {
          // Remove background using @imgly/background-removal
          const blob = await backgroundRemoval.removeBackground(src);
          const url = URL.createObjectURL(blob);
          setProcessedImage(url);

          // Cleanup: Revoke the object URL when component unmounts or src changes
          return () => URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Failed to remove background:", error);
          setProcessedImage(fallbackSrc); // Fallback to category default on error
        }
      } else {
        setProcessedImage(fallbackSrc); // Use fallback if no src provided
      }
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