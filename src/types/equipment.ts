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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DetailedSpecs = Record<string, any>;

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
  image_url: string | null;
  threshing_system_image_url: string | null;
  // Technical specifications from brochures
  fuel_tank_liters: number | null;
  cleaning_area_m2: number | null;
  rotor_diameter_mm: number | null;
  throughput_tons_h: number | null;
  engine_displacement_liters: number | null;
  // Additional detailed specs
  engine_cylinders: number | null;
  max_torque_nm: number | null;
  feeder_width_mm: number | null;
  rasp_bar_count: number | null;
  threshing_drum_diameter_mm: number | null;
  threshing_drum_width_mm: number | null;
  threshing_area_m2: number | null;
  rotor_length_mm: number | null;
  separator_area_m2: number | null;
  straw_walker_count: number | null;
  straw_walker_area_m2: number | null;
  sieve_area_m2: number | null;
  unloading_rate_ls: number | null;
  auger_reach_m: number | null;
  chopper_width_mm: number | null;
  max_slope_percent: number | null;
  transport_width_mm: number | null;
  transport_height_mm: number | null;
  transport_length_mm: number | null;
  header_width_min_m: number | null;
  header_width_max_m: number | null;
  detailed_specs: DetailedSpecs | null;
  data_source_url: string | null;
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
  // Problem-Solution-Benefit structure
  problem_text: string | null;
  solution_text: string | null;
  benefit_text: string | null;
  icon_name: string | null;
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

export interface SpecLabel {
  id: string;
  spec_key: string;
  custom_label: string;
  created_at: string;
  updated_at: string;
}
