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
          created_at: string
          cruelty_free: boolean | null
          description: string
          id: string
          name: string
          price_range: string
          slug: string
          updated_at: string
          vegan: boolean | null
        }
        Insert: {
          created_at?: string
          cruelty_free?: boolean | null
          description: string
          id?: string
          name: string
          price_range: string
          slug: string
          updated_at?: string
          vegan?: boolean | null
        }
        Update: {
          created_at?: string
          cruelty_free?: boolean | null
          description?: string
          id?: string
          name?: string
          price_range?: string
          slug?: string
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
          brand: string
          brand_id: string | null
          created_at: string
          finish: string
          id: string
          image_url: string | null
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
        }
        Insert: {
          brand: string
          brand_id?: string | null
          created_at?: string
          finish: string
          id?: string
          image_url?: string | null
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
        }
        Update: {
          brand?: string
          brand_id?: string | null
          created_at?: string
          finish?: string
          id?: string
          image_url?: string | null
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
          id: string
          name: string
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
          id?: string
          name: string
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
          id?: string
          name?: string
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
          brand: string
          brand_id: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          slug: string
          summary: string
          updated_at: string
        }
        Insert: {
          attributes: string[]
          brand: string
          brand_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price: number
          slug: string
          summary: string
          updated_at?: string
        }
        Update: {
          attributes?: string[]
          brand?: string
          brand_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
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
