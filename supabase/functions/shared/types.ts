/// <reference lib="es2015" />

// Common type definitions used across the application

export const PRODUCT_CATEGORIES = [
  'Foundation',
  'Concealer',
  'Powder',
  'Blush',
  'Bronzer',
  'Contour',
  'Highlighter',
  'Eyeshadow',
  'Eyeliner',
  'Mascara',
  'Eyebrow Products',
  'Lipstick',
  'Lip Gloss',
  'Lip Liner',
  'Lip Balm',
  'Lip Stain',
  'Setting Spray',
  'Primer',
  'Eye Primer',
  'Makeup Remover',
  'Skincare',
  'Haircare',
  'Tools',
  'Other'
] as const;

// Define the type based on the array
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Perplexity API Response Types with enhanced fields from report
export interface DupeResponse {
  original: {
    name: string;
    brand: string;
    price: number;
    category: ProductCategory; 
    attributes: string[];
    keyIngredients?: string[];
    texture?: string;
    finish?: string;
    coverage?: string;
    spf?: number;
    skinTypes?: string[];
    images?: string[];
    imageUrl?: string;
    countryOfOrigin?: string;
    longevityRating?: number;
    oxidationTendency?: string;
    bestFor?: string[];
    freeOf?: string[];
    crueltyFree?: boolean;
    vegan?: boolean;
    notes?: string;
    // External DB fields
    ean?: string;
    upc?: string;
    gtin?: string;
    asin?: string;
    model?: string;
    description?: string;
    lowest_recorded_price?: number;
    highest_recorded_price?: number;
    offers?: any[]; // External DB offers
  };
  dupes: Array<{
    name: string;
    brand: string;
    price: number;
    category?: ProductCategory;
    attributes?: string[];
    keyIngredients: string[];
    texture: string;
    finish: string;
    coverage?: string;
    spf?: number;
    skinTypes: string[];
    longevityRating?: number;
    images?: string[];
    imageUrl?: string;
    bestFor?: string[];
    countryOfOrigin?: string;
    freeOf?: string[];
    crueltyFree?: boolean;
    vegan?: boolean;
    notes: string;
    
    // Dupe-specific comparison fields
    savingsPercentage: number;
    matchScore: number;
    colorMatchScore?: number;
    formulaMatchScore?: number;
    dupeType?: string;
    validationSource?: string;
    confidenceLevel?: string;
    longevityComparison?: string;
    purchaseLink?: string;
    
    // External DB fields
    ean?: string;
    upc?: string;
    gtin?: string;
    asin?: string;
    model?: string;
    description?: string;
    lowest_recorded_price?: number;
    highest_recorded_price?: number;
    offers?: any[]; // External DB offers
  }>;
  summary: string;
  resources: Array<{
    title: string;
    url: string;
    type: "Video" | "YouTube" | "Instagram" | "TikTok" | "Article" | "Reddit";
  }>;
}
// Brand Info from OpenAI
export interface BrandInfo {
  description: string;
  price_range: string;
  cruelty_free: boolean | null;
  vegan: boolean | null;
  country_of_origin?: string;
  sustainable_packaging?: boolean;
  parent_company?: string;
}

// Ingredient Info from OpenAI
export interface IngredientInfo {
  description: string;
  benefits: string[];
  concerns: string[];
  skin_types: string[];
  comedogenic_rating: number;
  vegan: boolean;
  inci_name?: string;
  ethically_sourced?: boolean;
  is_controversial?: boolean;
  restricted_in?: string[];
}

// Database Entity Types
export interface Brand {
  id?: string;
  name: string;
  slug: string;
  description: string;
  founded_year?: number;
  headquarters?: string;
  website_url?: string;
  price_range: string;
  cruelty_free: boolean | null;
  vegan: boolean | null;
  clean_beauty?: boolean;
  sustainable_packaging?: boolean;
  key_values?: string[];
  parent_company?: string;
  product_categories?: string[];
  country_of_origin?: string;
}

export interface Ingredient {
  id?: string;
  name: string;
  slug: string;
  description: string;
  benefits: string[];
  concerns: string[];
  skin_types: string[];
  comedogenic_rating: number;
  vegan: boolean;
  inci_name?: string;
  ethically_sourced?: boolean;
  is_controversial?: boolean;
  restricted_in?: string[];
}
export interface Product {
  id?: string;
  name: string;
  brand: string;
  brand_id?: string;
  slug: string;
  ean?: string;
  upc?: string;
  gtin?: string;
  asin?: string;
  model?: string;
  category?: ProductCategory;
  price: number;
  attributes: string[];
  description?: string;
  image_url?: string;
  images?: string[];
  summary?: string;
  country_of_origin?: string;
  longevity_rating?: number;
  oxidation_tendency?: string;
  free_of?: string[];
  best_for?: string[];
  texture?: string;
  finish?: string;
  coverage?: string;
  spf?: number;
  skin_types?: string[];
  color_match_score?: number;
  formula_match_score?: number;
  dupe_type?: string;
  validation_source?: string;
  confidence_level?: string;
  longevity_comparison?: string;
  notes?: string;
  purchase_link?: string;
  cruelty_free?: boolean;
  vegan?: boolean;
  lowest_recorded_price?: number;
  highest_recorded_price?: number;
  offers?: Offer[];
}

export interface Merchant {
  id?: string;
  name: string;
  domain?: string;
  logo_url?: string;
}

export interface Offer {
  id?: string;
  merchant_id: string;
  merchant?: Merchant;
  title?: string;
  currency?: string;
  list_price?: number;
  price: number;
  shipping?: string;
  condition?: string;
  availability?: string;
  link: string;
  updated_t?: number;
}

export interface ProductOffer {
  id?: string;
  product_id: string;
  offer_id: string;
  is_best_price?: boolean;
}


export interface ProductDupe {
  id?: string;
  original_product_id: string;
  dupe_product_id: string;
  match_score: number;
  savings_percentage: number;
  verified?: boolean;
}

export interface ProductIngredient {
  id?: string;
  product_id: string;
  ingredient_id: string;
  is_key_ingredient: boolean;
}

export interface Merchant {
  id?: string;
  name: string;
  domain?: string;
  logo_url?: string;
}

export interface Offer {
  id?: string;
  merchant_id: string;
  title?: string;
  currency?: string;
  list_price?: number;
  price: number;
  shipping?: string;
  condition?: string;
  availability?: string;
  link: string;
  updated_t?: number;
}

export interface ProductOffer {
  id?: string;
  product_id: string;
  offer_id: string;
  is_best_price?: boolean;
}

export interface Resource {
  id?: string;
  title: string;
  url: string;
  type: "Video" | "YouTube" | "Instagram" | "TikTok" | "Article" | "Reddit";
  product_id?: string;
  brand_id?: string;
  ingredient_id?: string;
}

// Database structure type for Supabase JS client
export type Database = {
  public: {
    Tables: {
      brands: {
        Row: Brand & { 
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Brand;
        Update: Partial<Brand>;
      };
      ingredients: {
        Row: Ingredient & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Ingredient;
        Update: Partial<Ingredient>;
      };
      products: {
        Row: Product & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Product;
        Update: Partial<Product>;
      };
      product_dupes: {
        Row: ProductDupe & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: ProductDupe;
        Update: Partial<ProductDupe>;
      };
      product_ingredients: {
        Row: ProductIngredient & {
          id: string;
          created_at: string;
        };
        Insert: ProductIngredient;
        Update: Partial<ProductIngredient>;
      };
      merchants: {
        Row: Merchant & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Merchant;
        Update: Partial<Merchant>;
      };
      offers: {
        Row: Offer & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Offer;
        Update: Partial<Offer>;
      };
      product_offers: {
        Row: ProductOffer & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: ProductOffer;
        Update: Partial<ProductOffer>;
      };
      resources: {
        Row: Resource & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Resource;
        Update: Partial<Resource>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      product_category: ProductCategory;
      resource_type: "Video" | "YouTube" | "Instagram" | "TikTok" | "Article" | "Reddit";
    };
    CompositeTypes: Record<string, never>;
  };
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Image Processing Types
export interface ImageProcessingResult {
  success: boolean;
  url?: string;
  error?: string;
}