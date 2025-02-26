
export interface Ingredient {
  id: string;
  name: string;
}

export interface Dupe {
  id: string;
  name: string;
  brand: string;
  price: number;
  savings_percentage: number;
  texture: string;
  finish: string;
  spf: number | null;
  skin_types: string[];
  match_score: number;
  color_match_score?: number;
  formula_match_score?: number;
  dupe_type?: string;
  coverage?: string;
  confidence_level?: number;
  longevity_comparison?: string;
  notes: string | null;
  purchase_link: string | null;
  image_url: string | null;
  cruelty_free?: boolean;
  vegan?: boolean;
  ingredients?: Ingredient[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  attributes: string[];
  image_url: string | null;
  summary: string;
  slug: string;
  dupes: Dupe[];
}
