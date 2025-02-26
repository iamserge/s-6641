/// <reference lib="es2015" />

// Common type definitions used across the application

// Product Category Type
export type ProductCategory = 
  | 'Foundation' 
  | 'Concealer' 
  | 'Powder' 
  | 'Blush' 
  | 'Bronzer' 
  | 'Highlighter' 
  | 'Eyeshadow' 
  | 'Eyeliner' 
  | 'Mascara' 
  | 'Lipstick' 
  | 'Lip Gloss'
  | 'Lip Liner'
  | 'Setting Spray'
  | 'Primer'
  | 'Skincare'
  | 'Haircare'
  | 'Other';

// Perplexity API Response Types with enhanced fields from report
export interface DupeResponse {
  original: {
    name: string;
    brand: string;
    price: number;
    category: ProductCategory; // Added product category
    attributes: string[];
    keyIngredients?: string[];
    imageUrl?: string;
    countryOfOrigin?: string;
    freeOf?: string[];
    longevityRating?: number; // 1-10 scale
    oxidationTendency?: string; // "None", "Minor", "Significant"
    bestFor?: string[];
  };
  dupes: Array<{
    name: string;
    brand: string;
    price: number;
    category?: ProductCategory; // Added product category (optional as may be same as original)
    savingsPercentage: number;
    keyIngredients: string[];
    texture: string;
    finish: string;
    coverage?: string;
    spf?: number;
    skinTypes: string[];
    matchScore: number; // Overall match score (0-100)
    colorMatchScore?: number; // Color match (0-100)
    formulaMatchScore?: number; // Formula match (0-100)
    dupeType?: string; // "Shade Match", "Formula Match", "Exact Dupe", etc.
    validationSource?: string; // Where validated, e.g., "Temptalia", "Reddit"
    confidenceLevel?: string; // "High", "Medium", or "Low"
    longevityComparison?: string;
    notes: string;
    purchaseLink?: string;
    imageUrl?: string;
    bestFor?: string[]; // Best conditions/skin types
    countryOfOrigin?: string;
    crueltyFree?: boolean;
    vegan?: boolean;
    freeOf?: string[]; // Claims about excluded ingredients
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
  id: string;
  name: string;
  slug: string;
  description: string;
  price_range: string;
  cruelty_free: boolean | null;
  vegan: boolean | null;
  country_of_origin?: string;
  sustainable_packaging?: boolean;
  parent_company?: string;
}

export interface Ingredient {
  id: string;
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
  id: string;
  brand: string;
  brand_id: string;
  name: string;
  slug: string;
  category?: ProductCategory; // Added product category
  price: number;
  attributes: string[];
  image_url?: string;
  summary: string;
  country_of_origin?: string;
  longevity_rating?: number;
  oxidation_tendency?: string;
  free_of?: string[];
  best_for?: string[];
}

export interface Dupe {
  id: string;
  product_id: string;
  brand_id: string;
  name: string;
  category?: ProductCategory; // Added product category
  price: number;
  savings_percentage: number;
  texture: string;
  finish: string;
  coverage?: string;
  spf?: number;
  skin_types: string[];
  match_score: number;
  color_match_score?: number;
  formula_match_score?: number;
  dupe_type?: string;
  validation_source?: string;
  confidence_level?: string;
  longevity_comparison?: string;
  verified?: boolean;
  notes?: string;
  purchase_link?: string;
  image_url?: string;
  best_for?: string[];
  cruelty_free?: boolean;
  vegan?: boolean;
  country_of_origin?: string;
  free_of?: string[]; // Added field for excluded ingredients claims
}

export interface Resource {
  id?: string;
  product_id?: string;
  brand_id?: string;
  ingredient_id?: string;
  title: string;
  url: string;
  type: string;
}

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