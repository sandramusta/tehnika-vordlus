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
          benefit_text: string | null
          category: string
          competitor_brand_id: string
          created_at: string
          equipment_type_id: string
          icon_name: string | null
          id: string
          problem_text: string | null
          solution_text: string | null
          sort_order: number | null
        }
        Insert: {
          argument_description: string
          argument_title: string
          benefit_text?: string | null
          category?: string
          competitor_brand_id: string
          created_at?: string
          equipment_type_id: string
          icon_name?: string | null
          id?: string
          problem_text?: string | null
          solution_text?: string | null
          sort_order?: number | null
        }
        Update: {
          argument_description?: string
          argument_title?: string
          benefit_text?: string | null
          category?: string
          competitor_brand_id?: string
          created_at?: string
          equipment_type_id?: string
          icon_name?: string | null
          id?: string
          problem_text?: string | null
          solution_text?: string | null
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
          auger_reach_m: number | null
          brand_id: string
          chopper_width_mm: number | null
          cleaning_area_m2: number | null
          created_at: string
          data_source_url: string | null
          detailed_specs: Json | null
          engine_cylinders: number | null
          engine_displacement_liters: number | null
          engine_power_hp: number | null
          equipment_type_id: string
          expected_lifespan_years: number | null
          features: Json | null
          feeder_width_mm: number | null
          fuel_consumption_lh: number | null
          fuel_tank_liters: number | null
          grain_tank_liters: number | null
          header_width_m: number | null
          header_width_max_m: number | null
          header_width_min_m: number | null
          id: string
          image_url: string | null
          max_slope_percent: number | null
          max_torque_nm: number | null
          model_name: string
          notes: string | null
          power_class_id: string | null
          price_eur: number | null
          rasp_bar_count: number | null
          rotor_diameter_mm: number | null
          rotor_length_mm: number | null
          separator_area_m2: number | null
          sieve_area_m2: number | null
          straw_walker_area_m2: number | null
          straw_walker_count: number | null
          threshing_area_m2: number | null
          threshing_drum_diameter_mm: number | null
          threshing_drum_width_mm: number | null
          threshing_system_image_url: string | null
          throughput_tons_h: number | null
          transport_height_mm: number | null
          transport_length_mm: number | null
          transport_width_mm: number | null
          unloading_rate_ls: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          annual_maintenance_eur?: number | null
          auger_reach_m?: number | null
          brand_id: string
          chopper_width_mm?: number | null
          cleaning_area_m2?: number | null
          created_at?: string
          data_source_url?: string | null
          detailed_specs?: Json | null
          engine_cylinders?: number | null
          engine_displacement_liters?: number | null
          engine_power_hp?: number | null
          equipment_type_id: string
          expected_lifespan_years?: number | null
          features?: Json | null
          feeder_width_mm?: number | null
          fuel_consumption_lh?: number | null
          fuel_tank_liters?: number | null
          grain_tank_liters?: number | null
          header_width_m?: number | null
          header_width_max_m?: number | null
          header_width_min_m?: number | null
          id?: string
          image_url?: string | null
          max_slope_percent?: number | null
          max_torque_nm?: number | null
          model_name: string
          notes?: string | null
          power_class_id?: string | null
          price_eur?: number | null
          rasp_bar_count?: number | null
          rotor_diameter_mm?: number | null
          rotor_length_mm?: number | null
          separator_area_m2?: number | null
          sieve_area_m2?: number | null
          straw_walker_area_m2?: number | null
          straw_walker_count?: number | null
          threshing_area_m2?: number | null
          threshing_drum_diameter_mm?: number | null
          threshing_drum_width_mm?: number | null
          threshing_system_image_url?: string | null
          throughput_tons_h?: number | null
          transport_height_mm?: number | null
          transport_length_mm?: number | null
          transport_width_mm?: number | null
          unloading_rate_ls?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          annual_maintenance_eur?: number | null
          auger_reach_m?: number | null
          brand_id?: string
          chopper_width_mm?: number | null
          cleaning_area_m2?: number | null
          created_at?: string
          data_source_url?: string | null
          detailed_specs?: Json | null
          engine_cylinders?: number | null
          engine_displacement_liters?: number | null
          engine_power_hp?: number | null
          equipment_type_id?: string
          expected_lifespan_years?: number | null
          features?: Json | null
          feeder_width_mm?: number | null
          fuel_consumption_lh?: number | null
          fuel_tank_liters?: number | null
          grain_tank_liters?: number | null
          header_width_m?: number | null
          header_width_max_m?: number | null
          header_width_min_m?: number | null
          id?: string
          image_url?: string | null
          max_slope_percent?: number | null
          max_torque_nm?: number | null
          model_name?: string
          notes?: string | null
          power_class_id?: string | null
          price_eur?: number | null
          rasp_bar_count?: number | null
          rotor_diameter_mm?: number | null
          rotor_length_mm?: number | null
          separator_area_m2?: number | null
          sieve_area_m2?: number | null
          straw_walker_area_m2?: number | null
          straw_walker_count?: number | null
          threshing_area_m2?: number | null
          threshing_drum_diameter_mm?: number | null
          threshing_drum_width_mm?: number | null
          threshing_system_image_url?: string | null
          throughput_tons_h?: number | null
          transport_height_mm?: number | null
          transport_length_mm?: number | null
          transport_width_mm?: number | null
          unloading_rate_ls?: number | null
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
      myths: {
        Row: {
          advantage: string
          category: string
          created_at: string
          id: string
          myth: string
          reality: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          advantage: string
          category: string
          created_at?: string
          id?: string
          myth: string
          reality: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          advantage?: string
          category?: string
          created_at?: string
          id?: string
          myth?: string
          reality?: string
          sort_order?: number
          updated_at?: string
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
      spec_labels: {
        Row: {
          created_at: string
          custom_label: string
          id: string
          spec_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_label: string
          id?: string
          spec_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_label?: string
          id?: string
          spec_key?: string
          updated_at?: string
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
