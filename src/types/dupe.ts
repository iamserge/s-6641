
export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  benefits?: string[];
  concerns?: string[];
  skin_types?: string[];
  comedogenic_rating?: number;
  vegan?: boolean;
  inci_name?: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  price_range?: string;
  cruelty_free?: boolean;
  vegan?: boolean;
  country_of_origin?: string;
  sustainable_packaging?: boolean;
  parent_company?: string;
}

export interface Dupe {
  id: string;
  name: string;
  brand: string;
  brand_id?: string;
  price: number;
  savings_percentage: number;
  texture?: string;
  finish?: string;
  spf?: number | null;
  skin_types?: string[];
  match_score: number;
  color_match_score?: number;
  formula_match_score?: number;
  dupe_type?: string;
  coverage?: string;
  confidence_level?: string;  // Changed from number to string
  longevity_comparison?: string;
  notes?: string | null;
  purchase_link?: string | null;
  image_url?: string | null;
  cruelty_free?: boolean;
  vegan?: boolean;
  ingredients?: Ingredient[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  brand_id?: string;
  brand_info?: Brand;
  price: number;
  attributes?: string[];
  image_url?: string | null;
  images?: string[];
  summary?: string;
  country_of_origin?: string;
  longevity_rating?: number;
  oxidation_tendency?: string;
  free_of?: string[];
  best_for?: string[];
  category?: string;
  dupes?: Dupe[];
}

export interface ProductDupe {
  id: string;
  original_product_id: string;
  dupe_product_id: string;
  match_score: number;
  savings_percentage: number;
  verified?: boolean;
}

export interface ProductIngredient {
  product_id: string;
  ingredient_id: string;
  is_key_ingredient: boolean;
}

export interface DupeResource {
  id: string;
  title: string;
  url: string;
  type: "Video" | "YouTube" | "Instagram" | "TikTok" | "Article" | "Reddit";
}
