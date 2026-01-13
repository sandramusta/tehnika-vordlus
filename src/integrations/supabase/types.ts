export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      competitive_arguments: {
        Row: {
          argument_description: string
          argument_title: string
          category: string
          competitor_brand_id: string
          created_at: string
          equipment_type_id: string
          id: string
          sort_order: number | null
        }
        Insert: {
          argument_description: string
          argument_title: string
          category?: string
          competitor_brand_id: string
          created_at?: string
          equipment_type_id: string
          id?: string
          sort_order?: number | null
        }
        Update: {
          argument_description?: string
          argument_title?: string
          category?: string
          competitor_brand_id?: string
          created_at?: string
          equipment_type_id?: string
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_arguments_competitor_brand_id_fkey"
            columns: ["competitor_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitive_arguments_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          annual_maintenance_eur: number | null
          brand_id: string
          created_at: string
          engine_power_hp: number | null
          equipment_type_id: string
          expected_lifespan_years: number | null
          features: Json | null
          fuel_consumption_lh: number | null
          grain_tank_liters: number | null
          header_width_m: number | null
          id: string
          model_name: string
          notes: string | null
          power_class_id: string | null
          price_eur: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          annual_maintenance_eur?: number | null
          brand_id: string
          created_at?: string
          engine_power_hp?: number | null
          equipment_type_id: string
          expected_lifespan_years?: number | null
          features?: Json | null
          fuel_consumption_lh?: number | null
          grain_tank_liters?: number | null
          header_width_m?: number | null
          id?: string
          model_name: string
          notes?: string | null
          power_class_id?: string | null
          price_eur?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          annual_maintenance_eur?: number | null
          brand_id?: string
          created_at?: string
          engine_power_hp?: number | null
          equipment_type_id?: string
          expected_lifespan_years?: number | null
          features?: Json | null
          fuel_consumption_lh?: number | null
          grain_tank_liters?: number | null
          header_width_m?: number | null
          id?: string
          model_name?: string
          notes?: string | null
          power_class_id?: string | null
          price_eur?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_power_class_id_fkey"
            columns: ["power_class_id"]
            isOneToOne: false
            referencedRelation: "power_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          created_at: string
          id: string
          name: string
          name_et: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_et: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_et?: string
        }
        Relationships: []
      }
      power_classes: {
        Row: {
          created_at: string
          id: string
          max_hp: number
          min_hp: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_hp: number
          min_hp: number
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          max_hp?: number
          min_hp?: number
          name?: string
        }
        Relationships: []
      }
      work_documentation: {
        Row: {
          area_hectares: number | null
          created_at: string
          equipment_id: string
          fuel_used_liters: number | null
          hours_worked: number | null
          id: string
          notes: string | null
          work_date: string
          work_type: string
        }
        Insert: {
          area_hectares?: number | null
          created_at?: string
          equipment_id: string
          fuel_used_liters?: number | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          work_date?: string
          work_type: string
        }
        Update: {
          area_hectares?: number | null
          created_at?: string
          equipment_id?: string
          fuel_used_liters?: number | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          work_date?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_documentation_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
