export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          clean_beauty: boolean | null
          country_of_origin: string | null
          created_at: string
          cruelty_free: boolean | null
          description: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          key_values: string[] | null
          name: string
          parent_company: string | null
          price_range: string | null
          product_categories: string[] | null
          slug: string
          sustainable_packaging: boolean | null
          updated_at: string
          vegan: boolean | null
          website_url: string | null
        }
        Insert: {
          clean_beauty?: boolean | null
          country_of_origin?: string | null
          created_at?: string
          cruelty_free?: boolean | null
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          key_values?: string[] | null
          name: string
          parent_company?: string | null
          price_range?: string | null
          product_categories?: string[] | null
          slug: string
          sustainable_packaging?: boolean | null
          updated_at?: string
          vegan?: boolean | null
          website_url?: string | null
        }
        Update: {
          clean_beauty?: boolean | null
          country_of_origin?: string | null
          created_at?: string
          cruelty_free?: boolean | null
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          key_values?: string[] | null
          name?: string
          parent_company?: string | null
          price_range?: string | null
          product_categories?: string[] | null
          slug?: string
          sustainable_packaging?: boolean | null
          updated_at?: string
          vegan?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          benefits: string[] | null
          comedogenic_rating: number | null
          concerns: string[] | null
          created_at: string
          description: string | null
          ethically_sourced: boolean | null
          id: string
          inci_name: string | null
          is_controversial: boolean | null
          name: string
          restricted_in: string[] | null
          skin_types: string[] | null
          slug: string
          updated_at: string
          vegan: boolean | null
        }
        Insert: {
          benefits?: string[] | null
          comedogenic_rating?: number | null
          concerns?: string[] | null
          created_at?: string
          description?: string | null
          ethically_sourced?: boolean | null
          id?: string
          inci_name?: string | null
          is_controversial?: boolean | null
          name: string
          restricted_in?: string[] | null
          skin_types?: string[] | null
          slug: string
          updated_at?: string
          vegan?: boolean | null
        }
        Update: {
          benefits?: string[] | null
          comedogenic_rating?: number | null
          concerns?: string[] | null
          created_at?: string
          description?: string | null
          ethically_sourced?: boolean | null
          id?: string
          inci_name?: string | null
          is_controversial?: boolean | null
          name?: string
          restricted_in?: string[] | null
          skin_types?: string[] | null
          slug?: string
          updated_at?: string
          vegan?: boolean | null
        }
        Relationships: []
      }
      merchants: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          availability: string | null
          condition: string | null
          created_at: string
          currency: string | null
          id: string
          link: string
          list_price: number | null
          merchant_id: string
          price: number
          shipping: string | null
          title: string | null
          updated_at: string
          updated_t: number | null
        }
        Insert: {
          availability?: string | null
          condition?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          link: string
          list_price?: number | null
          merchant_id: string
          price: number
          shipping?: string | null
          title?: string | null
          updated_at?: string
          updated_t?: number | null
        }
        Update: {
          availability?: string | null
          condition?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          link?: string
          list_price?: number | null
          merchant_id?: string
          price?: number
          shipping?: string | null
          title?: string | null
          updated_at?: string
          updated_t?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_dupes: {
        Row: {
          created_at: string
          dupe_product_id: string
          id: string
          match_score: number
          original_product_id: string
          savings_percentage: number
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          dupe_product_id: string
          id?: string
          match_score: number
          original_product_id: string
          savings_percentage: number
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          dupe_product_id?: string
          id?: string
          match_score?: number
          original_product_id?: string
          savings_percentage?: number
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_dupes_dupe_product_id_fkey"
            columns: ["dupe_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_dupes_original_product_id_fkey"
            columns: ["original_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          is_key_ingredient: boolean | null
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          is_key_ingredient?: boolean | null
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          is_key_ingredient?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_offers: {
        Row: {
          created_at: string
          id: string
          is_best_price: boolean | null
          offer_id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_best_price?: boolean | null
          offer_id: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_best_price?: boolean | null
          offer_id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          asin: string | null
          attributes: string[] | null
          best_for: string[] | null
          brand: string
          brand_id: string | null
          category: Database["public"]["Enums"]["product_category"] | null
          color_match_score: number | null
          confidence_level: string | null
          country_of_origin: string | null
          coverage: string | null
          created_at: string
          cruelty_free: boolean | null
          description: string | null
          dupe_type: string | null
          ean: string | null
          finish: string | null
          formula_match_score: number | null
          free_of: string[] | null
          gtin: string | null
          highest_recorded_price: number | null
          id: string
          image_url: string | null
          images: string[] | null
          longevity_comparison: string | null
          longevity_rating: number | null
          lowest_recorded_price: number | null
          model: string | null
          name: string
          notes: string | null
          oxidation_tendency: string | null
          price: number
          purchase_link: string | null
          skin_types: string[] | null
          slug: string
          spf: number | null
          summary: string | null
          texture: string | null
          upc: string | null
          updated_at: string
          validation_source: string | null
          vegan: boolean | null
        }
        Insert: {
          asin?: string | null
          attributes?: string[] | null
          best_for?: string[] | null
          brand: string
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          color_match_score?: number | null
          confidence_level?: string | null
          country_of_origin?: string | null
          coverage?: string | null
          created_at?: string
          cruelty_free?: boolean | null
          description?: string | null
          dupe_type?: string | null
          ean?: string | null
          finish?: string | null
          formula_match_score?: number | null
          free_of?: string[] | null
          gtin?: string | null
          highest_recorded_price?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          longevity_comparison?: string | null
          longevity_rating?: number | null
          lowest_recorded_price?: number | null
          model?: string | null
          name: string
          notes?: string | null
          oxidation_tendency?: string | null
          price: number
          purchase_link?: string | null
          skin_types?: string[] | null
          slug: string
          spf?: number | null
          summary?: string | null
          texture?: string | null
          upc?: string | null
          updated_at?: string
          validation_source?: string | null
          vegan?: boolean | null
        }
        Update: {
          asin?: string | null
          attributes?: string[] | null
          best_for?: string[] | null
          brand?: string
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          color_match_score?: number | null
          confidence_level?: string | null
          country_of_origin?: string | null
          coverage?: string | null
          created_at?: string
          cruelty_free?: boolean | null
          description?: string | null
          dupe_type?: string | null
          ean?: string | null
          finish?: string | null
          formula_match_score?: number | null
          free_of?: string[] | null
          gtin?: string | null
          highest_recorded_price?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          longevity_comparison?: string | null
          longevity_rating?: number | null
          lowest_recorded_price?: number | null
          model?: string | null
          name?: string
          notes?: string | null
          oxidation_tendency?: string | null
          price?: number
          purchase_link?: string | null
          skin_types?: string[] | null
          slug?: string
          spf?: number | null
          summary?: string | null
          texture?: string | null
          upc?: string | null
          updated_at?: string
          validation_source?: string | null
          vegan?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          ingredient_id: string | null
          product_id: string | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
          url: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          ingredient_id?: string | null
          product_id?: string | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
          url: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          ingredient_id?: string | null
          product_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_category:
        | "Foundation"
        | "Concealer"
        | "Powder"
        | "Blush"
        | "Bronzer"
        | "Contour"
        | "Highlighter"
        | "Eyeshadow"
        | "Eyeliner"
        | "Mascara"
        | "Eyebrow Products"
        | "Lipstick"
        | "Lip Gloss"
        | "Lip Liner"
        | "Lip Balm"
        | "Lip Stain"
        | "Setting Spray"
        | "Primer"
        | "Eye Primer"
        | "Makeup Remover"
        | "Skincare"
        | "Haircare"
        | "Tools"
        | "Other"
      resource_type: "Video" | "YouTube" | "Instagram" | "TikTok" | "Article"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
