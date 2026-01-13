export interface EquipmentType {
  id: string;
  name: string;
  name_et: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  is_primary: boolean;
  logo_url: string | null;
  created_at: string;
}

export interface PowerClass {
  id: string;
  name: string;
  min_hp: number;
  max_hp: number;
  created_at: string;
}

export interface Equipment {
  id: string;
  equipment_type_id: string;
  brand_id: string;
  power_class_id: string | null;
  model_name: string;
  engine_power_hp: number | null;
  grain_tank_liters: number | null;
  header_width_m: number | null;
  weight_kg: number | null;
  fuel_consumption_lh: number | null;
  price_eur: number | null;
  annual_maintenance_eur: number | null;
  expected_lifespan_years: number;
  features: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  brand?: Brand;
  power_class?: PowerClass;
  equipment_type?: EquipmentType;
}

export interface CompetitiveArgument {
  id: string;
  competitor_brand_id: string;
  equipment_type_id: string;
  argument_title: string;
  argument_description: string;
  category: string;
  sort_order: number;
  created_at: string;
  // Joined data
  competitor_brand?: Brand;
}

export interface WorkDocumentation {
  id: string;
  equipment_id: string;
  work_date: string;
  work_type: string;
  hours_worked: number | null;
  area_hectares: number | null;
  fuel_used_liters: number | null;
  notes: string | null;
  created_at: string;
  // Joined data
  equipment?: Equipment;
}

export interface TCOCalculation {
  equipment: Equipment;
  purchasePrice: number;
  totalMaintenanceCost: number;
  totalOwnershipCost: number;
  annualCost: number;
  costPerHour: number;
}
