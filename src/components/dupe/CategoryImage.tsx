import { ProductCategory } from "@/types/dupe";

const categoryImageMap: Record<string, string> = {
  'Foundation': '/cream.png',
  'Concealer': '/cream.png',
  'Primer': '/cream.png',
  'Eye Primer': '/cream.png',
  'Makeup Remover': '/cream.png',
  'Skincare': '/cream.png',
  'Haircare': '/cream.png',
  'Setting Spray': '/spray.png',
  'Powder': '/compact.png',
  'Blush': '/compact.png',
  'Bronzer': '/compact.png',
  'Contour': '/compact.png',
  'Highlighter': '/compact.png',
  'Eyeshadow': '/compact.png',
  'Lipstick': '/tube.png',
  'Lip Gloss': '/tube.png',
  'Lip Liner': '/tube.png',
  'Lip Balm': '/tube.png',
  'Lip Stain': '/tube.png',
  'Eyeliner': '/tube.png',
  'Mascara': '/tube.png',
  'Eyebrow Products': '/tube.png',
  'Tools': '/brush.png',
  'Other': '/cream.png'
};

interface CategoryImageProps {
  category?: ProductCategory;
  imageUrl?: string;
  images?: string[];
  alt: string;
  className?: string;
}

export const CategoryImage = ({ category, imageUrl, images, alt, className }: CategoryImageProps) => {
  const src = imageUrl || (images && images.length > 0 ? images[0] : categoryImageMap[category || 'Other'] || '/cream.png');

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = categoryImageMap[category || 'Other'] || '/cream.png';
      }}
    />
  );
};