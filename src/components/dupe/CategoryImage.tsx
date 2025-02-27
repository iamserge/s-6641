import { ProductCategory } from "@/types/dupe";
import { useState, useEffect } from "react";
import imglyRemoveBackground from "@imgly/background-removal";

const categoryImageMap: Record<string, string> = {
  Foundation: "/cream.png",
  Concealer: "/cream.png",
  Primer: "/cream.png",
  "Eye Primer": "/cream.png",
  "Makeup Remover": "/cream.png",
  Skincare: "/cream.png",
  Haircare: "/cream.png",
  "Setting Spray": "/spray.png",
  Powder: "/compact.png",
  Blush: "/compact.png",
  Bronzer: "/compact.png",
  Contour: "/compact.png",
  Highlighter: "/compact.png",
  Eyeshadow: "/compact.png",
  Lipstick: "/tube.png",
  "Lip Gloss": "/tube.png",
  "Lip Liner": "/tube.png",
  "Lip Balm": "/tube.png",
  "Lip Stain": "/tube.png",
  Eyeliner: "/tube.png",
  Mascara: "/tube.png",
  "Eyebrow Products": "/tube.png",
  Tools: "/brush.png",
  Other: "/cream.png",
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
  const fallbackSrc = categoryImageMap[category || "Other"] || "/cream.png";

  useEffect(() => {
    const processImage = async () => {
      // Use provided imageUrl or first image from images array
      const src = imageUrl || (images && images.length > 0 ? images[0] : null);

      if (src) {
        try {
          // Remove background using @imgly/background-removal
          const blob = await imglyRemoveBackground(src);
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