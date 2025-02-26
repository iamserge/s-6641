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
          country_of_origin: string | null
          created_at: string
          cruelty_free: boolean | null
          description: string
          id: string
          name: string
          parent_company: string | null
          price_range: string
          slug: string
          sustainable_packaging: boolean | null
          updated_at: string
          vegan: boolean | null
        }
        Insert: {
          country_of_origin?: string | null
          created_at?: string
          cruelty_free?: boolean | null
          description: string
          id?: string
          name: string
          parent_company?: string | null
          price_range: string
          slug: string
          sustainable_packaging?: boolean | null
          updated_at?: string
          vegan?: boolean | null
        }
        Update: {
          country_of_origin?: string | null
          created_at?: string
          cruelty_free?: boolean | null
          description?: string
          id?: string
          name?: string
          parent_company?: string | null
          price_range?: string
          slug?: string
          sustainable_packaging?: boolean | null
          updated_at?: string
          vegan?: boolean | null
        }
        Relationships: []
      }
      dupe_ingredients: {
        Row: {
          created_at: string
          dupe_id: string
          id: string
          ingredient_id: string
          is_key_ingredient: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          dupe_id: string
          id?: string
          ingredient_id: string
          is_key_ingredient?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          dupe_id?: string
          id?: string
          ingredient_id?: string
          is_key_ingredient?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dupe_ingredients_dupe_id_fkey"
            columns: ["dupe_id"]
            isOneToOne: false
            referencedRelation: "dupes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dupe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      dupes: {
        Row: {
          best_for: string[] | null
          brand: string
          brand_id: string | null
          category: Database["public"]["Enums"]["product_category"] | null
          color_match_score: number | null
          confidence_level: number | null
          coverage: string | null
          created_at: string
          cruelty_free: boolean | null
          dupe_type: string | null
          finish: string
          formula_match_score: number | null
          id: string
          image_url: string | null
          longevity_comparison: string | null
          match_score: number
          name: string
          notes: string | null
          price: number
          product_id: string
          purchase_link: string | null
          savings_percentage: number
          skin_types: string[]
          spf: number | null
          texture: string
          updated_at: string
          validation_source: string | null
          vegan: boolean | null
          verified: boolean | null
        }
        Insert: {
          best_for?: string[] | null
          brand: string
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          color_match_score?: number | null
          confidence_level?: number | null
          coverage?: string | null
          created_at?: string
          cruelty_free?: boolean | null
          dupe_type?: string | null
          finish: string
          formula_match_score?: number | null
          id?: string
          image_url?: string | null
          longevity_comparison?: string | null
          match_score: number
          name: string
          notes?: string | null
          price: number
          product_id: string
          purchase_link?: string | null
          savings_percentage: number
          skin_types: string[]
          spf?: number | null
          texture: string
          updated_at?: string
          validation_source?: string | null
          vegan?: boolean | null
          verified?: boolean | null
        }
        Update: {
          best_for?: string[] | null
          brand?: string
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          color_match_score?: number | null
          confidence_level?: number | null
          coverage?: string | null
          created_at?: string
          cruelty_free?: boolean | null
          dupe_type?: string | null
          finish?: string
          formula_match_score?: number | null
          id?: string
          image_url?: string | null
          longevity_comparison?: string | null
          match_score?: number
          name?: string
          notes?: string | null
          price?: number
          product_id?: string
          purchase_link?: string | null
          savings_percentage?: number
          skin_types?: string[]
          spf?: number | null
          texture?: string
          updated_at?: string
          validation_source?: string | null
          vegan?: boolean | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dupes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dupes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          benefits: string[]
          comedogenic_rating: number | null
          concerns: string[]
          created_at: string
          description: string
          ethically_sourced: boolean | null
          id: string
          inci_name: string | null
          is_controversial: boolean | null
          name: string
          restricted_in: string[] | null
          skin_types: string[]
          slug: string
          updated_at: string
          vegan: boolean | null
        }
        Insert: {
          benefits: string[]
          comedogenic_rating?: number | null
          concerns: string[]
          created_at?: string
          description: string
          ethically_sourced?: boolean | null
          id?: string
          inci_name?: string | null
          is_controversial?: boolean | null
          name: string
          restricted_in?: string[] | null
          skin_types: string[]
          slug: string
          updated_at?: string
          vegan?: boolean | null
        }
        Update: {
          benefits?: string[]
          comedogenic_rating?: number | null
          concerns?: string[]
          created_at?: string
          description?: string
          ethically_sourced?: boolean | null
          id?: string
          inci_name?: string | null
          is_controversial?: boolean | null
          name?: string
          restricted_in?: string[] | null
          skin_types?: string[]
          slug?: string
          updated_at?: string
          vegan?: boolean | null
        }
        Relationships: []
      }
      product_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          is_key_ingredient: boolean
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          is_key_ingredient?: boolean
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          is_key_ingredient?: boolean
          product_id?: string
          updated_at?: string
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
      products: {
        Row: {
          attributes: string[]
          best_for: string[] | null
          brand: string | null
          brand_id: string | null
          category: Database["public"]["Enums"]["product_category"] | null
          country_of_origin: string | null
          created_at: string
          free_of: string[] | null
          id: string
          image_url: string | null
          longevity_rating: number | null
          name: string
          oxidation_tendency: string | null
          price: number
          slug: string
          summary: string
          updated_at: string
        }
        Insert: {
          attributes: string[]
          best_for?: string[] | null
          brand?: string | null
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          country_of_origin?: string | null
          created_at?: string
          free_of?: string[] | null
          id?: string
          image_url?: string | null
          longevity_rating?: number | null
          name: string
          oxidation_tendency?: string | null
          price: number
          slug: string
          summary: string
          updated_at?: string
        }
        Update: {
          attributes?: string[]
          best_for?: string[] | null
          brand?: string | null
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          country_of_origin?: string | null
          created_at?: string
          free_of?: string[] | null
          id?: string
          image_url?: string | null
          longevity_rating?: number | null
          name?: string
          oxidation_tendency?: string | null
          price?: number
          slug?: string
          summary?: string
          updated_at?: string
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
        | "Highlighter"
        | "Eyeshadow"
        | "Eyeliner"
        | "Mascara"
        | "Lipstick"
        | "Lip Gloss"
        | "Lip Liner"
        | "Setting Spray"
        | "Primer"
        | "Skincare"
        | "Haircare"
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
