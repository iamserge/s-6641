export interface DupeInfo {
  coverage?: string | null;
  confidence_level?: string | null; // Changed from number to string
  longevity_comparison?: string | null;
  cruelty_free?: boolean | null;
  vegan?: boolean | null;
}

export interface BrandInfo {
  name?: string | null;
  country_of_origin?: string | null;
  sustainable_packaging?: boolean | null;
  cruelty_free?: boolean | null;
  vegan?: boolean | null;
}

export interface RecentDupe {
  name: string;
  brand: string;
  slug: string;
  country_of_origin?: string | null;
  longevity_rating?: number | null;
  free_of?: string[] | null;
  best_for?: string[] | null;
  brandInfo: BrandInfo | null;
  dupeInfo: DupeInfo | null;
}