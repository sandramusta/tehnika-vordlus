 // Configuration for which fields to show based on equipment type
 // Maps equipment type names to their relevant form fields
 
 export interface FieldConfig {
   name: string;
   label: string;
   type: "text" | "number" | "textarea";
   step?: string;
   placeholder?: string;
 }
 
 export interface FieldGroup {
   title: string;
   fields: FieldConfig[];
 }
 
 // Common fields that appear for all equipment types
 export const COMMON_FIELDS: FieldGroup[] = [
   {
     title: "Põhiandmed",
     fields: [
       { name: "engine_power_hp", label: "Võimsus (hj)", type: "number", placeholder: "473" },
       { name: "weight_kg", label: "Kaal (kg)", type: "number", placeholder: "18500" },
       { name: "fuel_consumption_lh", label: "Kütusekulu (l/h)", type: "number", step: "0.1", placeholder: "45" },
     ],
   },
   {
     title: "Majandusandmed",
     fields: [
       { name: "price_eur", label: "Hind (€)", type: "number", placeholder: "450000" },
       { name: "annual_maintenance_eur", label: "Hooldus/aastas (€)", type: "number", placeholder: "12000" },
       { name: "expected_lifespan_years", label: "Eluiga (aastaid)", type: "number", placeholder: "10" },
     ],
   },
 ];
 
 // Fields specific to each equipment type
 export const TYPE_SPECIFIC_FIELDS: Record<string, FieldGroup[]> = {
   combine: [
     {
       title: "Bunker ja heedrid",
       fields: [
         { name: "grain_tank_liters", label: "Bunker (l)", type: "number", placeholder: "14100" },
         { name: "header_width_m", label: "Heedri laius (m)", type: "number", step: "0.1", placeholder: "10.7" },
         { name: "header_width_min_m", label: "Heedri min laius (m)", type: "number", step: "0.1", placeholder: "6.1" },
         { name: "header_width_max_m", label: "Heedri max laius (m)", type: "number", step: "0.1", placeholder: "12.2" },
       ],
     },
     {
       title: "Mootor ja küttesüsteem",
       fields: [
         { name: "fuel_tank_liters", label: "Kütusepaak (L)", type: "number", placeholder: "950" },
         { name: "engine_displacement_liters", label: "Mootori töömaht (L)", type: "number", step: "0.1", placeholder: "13.6" },
         { name: "engine_cylinders", label: "Silindrite arv", type: "number", placeholder: "6" },
         { name: "max_torque_nm", label: "Max pöördemoment (Nm)", type: "number", placeholder: "2057" },
       ],
     },
     {
       title: "Peksusüsteem",
       fields: [
         { name: "rotor_diameter_mm", label: "Rootori läbimõõt (mm)", type: "number", placeholder: "834" },
         { name: "rotor_length_mm", label: "Rootori pikkus (mm)", type: "number", placeholder: "4270" },
         { name: "feeder_width_mm", label: "Etteande laius (mm)", type: "number", placeholder: "1550" },
         { name: "rasp_bar_count", label: "Raspi latid", type: "number", placeholder: "10" },
         { name: "threshing_drum_diameter_mm", label: "Trumli läbimõõt (mm)", type: "number", placeholder: "760" },
         { name: "threshing_drum_width_mm", label: "Trumli laius (mm)", type: "number", placeholder: "1600" },
         { name: "threshing_area_m2", label: "Peksupindala (m²)", type: "number", step: "0.1", placeholder: "2.5" },
       ],
     },
     {
       title: "Separeerimine ja puhastus",
       fields: [
         { name: "separator_area_m2", label: "Separeerimispind (m²)", type: "number", step: "0.1", placeholder: "4.0" },
         { name: "straw_walker_count", label: "Õlekõndijaid", type: "number", placeholder: "6" },
         { name: "straw_walker_area_m2", label: "Õlekõndija pind (m²)", type: "number", step: "0.1", placeholder: "5.5" },
         { name: "cleaning_area_m2", label: "Puhasti pindala (m²)", type: "number", step: "0.1", placeholder: "5.9" },
         { name: "sieve_area_m2", label: "Sõelapind (m²)", type: "number", step: "0.1", placeholder: "6.7" },
       ],
     },
     {
       title: "Terapunker ja tühjendamine",
       fields: [
         { name: "unloading_rate_ls", label: "Tühjenduskiirus (l/s)", type: "number", placeholder: "150" },
         { name: "auger_reach_m", label: "Tigu ulatus (m)", type: "number", step: "0.1", placeholder: "7.5" },
       ],
     },
     {
       title: "Heksel ja transport",
       fields: [
         { name: "chopper_width_mm", label: "Heksli laius (mm)", type: "number", placeholder: "9000" },
         { name: "max_slope_percent", label: "Max kalle (%)", type: "number", placeholder: "35" },
         { name: "transport_width_mm", label: "Transpordi laius (mm)", type: "number", placeholder: "3490" },
         { name: "transport_height_mm", label: "Transpordi kõrgus (mm)", type: "number", placeholder: "3990" },
         { name: "transport_length_mm", label: "Transpordi pikkus (mm)", type: "number", placeholder: "9500" },
       ],
     },
     {
       title: "Jõudlus",
       fields: [
         { name: "throughput_tons_h", label: "Läbilaskevõime (t/h)", type: "number", step: "0.1", placeholder: "100" },
       ],
     },
   ],
   telehandler: [
     {
       title: "Tõsteomadused",
       fields: [
         { name: "lift_height_m", label: "Tõstekõrgus (m)", type: "number", step: "0.1", placeholder: "6.0" },
         { name: "lift_reach_m", label: "Tõste kaugus (m)", type: "number", step: "0.1", placeholder: "3.5" },
         { name: "max_lift_capacity_kg", label: "Max tõstevõime (kg)", type: "number", placeholder: "4400" },
       ],
     },
     {
       title: "Hüdraulika",
       fields: [
         { name: "hydraulic_pump_lpm", label: "Hüdraulikapump (l/min)", type: "number", placeholder: "140" },
       ],
     },
     {
       title: "Mõõtmed",
       fields: [
         { name: "transport_width_mm", label: "Laius (mm)", type: "number", placeholder: "2350" },
         { name: "transport_height_mm", label: "Kõrgus (mm)", type: "number", placeholder: "2450" },
         { name: "transport_length_mm", label: "Pikkus (mm)", type: "number", placeholder: "5200" },
       ],
     },
   ],
  tractor: [
    {
      title: "Mootor",
      fields: [
        { name: "engine_power_hp", label: "Max võimsus (hj)", type: "number", placeholder: "150" },
        { name: "engine_displacement_liters", label: "Kubatuur (L)", type: "number", step: "0.1", placeholder: "6.8" },
        { name: "engine_cylinders", label: "Silindrite arv", type: "number", placeholder: "6" },
        { name: "max_torque_nm", label: "Max pöördemoment (Nm)", type: "number", placeholder: "980" },
      ],
    },
    {
      title: "Mahud",
      fields: [
        { name: "fuel_tank_liters", label: "Kütusepaak (L)", type: "number", placeholder: "400" },
      ],
    },
    {
      title: "Massid",
      fields: [
        { name: "weight_kg", label: "Tühimass (kg)", type: "number", placeholder: "6500" },
      ],
    },
  ],
   "forage_harvester": [
     {
       title: "Mootor",
       fields: [
         { name: "fuel_tank_liters", label: "Kütusepaak (L)", type: "number", placeholder: "1200" },
         { name: "engine_displacement_liters", label: "Mootori töömaht (L)", type: "number", step: "0.1", placeholder: "16.0" },
         { name: "engine_cylinders", label: "Silindrite arv", type: "number", placeholder: "8" },
         { name: "max_torque_nm", label: "Max pöördemoment (Nm)", type: "number", placeholder: "3500" },
       ],
     },
     {
       title: "Heedrid",
       fields: [
         { name: "header_width_m", label: "Heedri laius (m)", type: "number", step: "0.1", placeholder: "7.5" },
         { name: "header_width_min_m", label: "Min laius (m)", type: "number", step: "0.1", placeholder: "3.0" },
         { name: "header_width_max_m", label: "Max laius (m)", type: "number", step: "0.1", placeholder: "9.0" },
       ],
     },
     {
       title: "Jõudlus",
       fields: [
         { name: "throughput_tons_h", label: "Läbilaskevõime (t/h)", type: "number", step: "0.1", placeholder: "250" },
         { name: "chopper_width_mm", label: "Heksli laius (mm)", type: "number", placeholder: "700" },
       ],
     },
   ],
   "wheel_loader": [
     {
       title: "Tõsteomadused",
       fields: [
         { name: "lift_height_m", label: "Kallutuskõrgus (m)", type: "number", step: "0.1", placeholder: "3.8" },
         { name: "max_lift_capacity_kg", label: "Kandevõime (kg)", type: "number", placeholder: "6500" },
       ],
     },
     {
       title: "Hüdraulika",
       fields: [
         { name: "hydraulic_pump_lpm", label: "Hüdraulikapump (l/min)", type: "number", placeholder: "180" },
       ],
     },
     {
       title: "Mõõtmed",
       fields: [
         { name: "transport_width_mm", label: "Laius (mm)", type: "number", placeholder: "2500" },
         { name: "transport_height_mm", label: "Kõrgus (mm)", type: "number", placeholder: "3200" },
         { name: "transport_length_mm", label: "Pikkus (mm)", type: "number", placeholder: "7500" },
       ],
     },
   ],
   "self_propelled_sprayer": [
     {
       title: "Paak ja pihustid",
       fields: [
         { name: "fuel_tank_liters", label: "Kütusepaak (L)", type: "number", placeholder: "400" },
         { name: "grain_tank_liters", label: "Pritsimispaak (L)", type: "number", placeholder: "5000" },
         { name: "header_width_m", label: "Töölaius (m)", type: "number", step: "0.1", placeholder: "36" },
       ],
     },
     {
       title: "Mõõtmed",
       fields: [
         { name: "transport_width_mm", label: "Transpordi laius (mm)", type: "number", placeholder: "3000" },
         { name: "transport_height_mm", label: "Transpordi kõrgus (mm)", type: "number", placeholder: "4000" },
       ],
     },
   ],
   "trailed_sprayer": [
     {
       title: "Paak ja pihustid",
       fields: [
         { name: "grain_tank_liters", label: "Pritsimispaak (L)", type: "number", placeholder: "4000" },
         { name: "header_width_m", label: "Töölaius (m)", type: "number", step: "0.1", placeholder: "28" },
       ],
     },
     {
       title: "Mõõtmed",
       fields: [
         { name: "transport_width_mm", label: "Transpordi laius (mm)", type: "number", placeholder: "2800" },
         { name: "transport_length_mm", label: "Transpordi pikkus (mm)", type: "number", placeholder: "8500" },
       ],
     },
   ],
  "round_baler": [
    {
      title: "Rulooni mõõtmed",
      fields: [
        { name: "header_width_m", label: "Rulooni läbimõõt (m)", type: "number", step: "0.01", placeholder: "1.25" },
        { name: "header_width_max_m", label: "Rulooni laius (m)", type: "number", step: "0.01", placeholder: "1.22" },
      ],
    },
    {
      title: "Kogur ja söötmine",
      fields: [
        { name: "header_width_min_m", label: "Koguri laius (m)", type: "number", step: "0.01", placeholder: "2.20" },
      ],
    },
    {
      title: "Võimsustarve ja mõõtmed",
      fields: [
        { name: "engine_power_hp", label: "Min võimsustarve (hj)", type: "number", placeholder: "60" },
        { name: "weight_kg", label: "Kaal (kg)", type: "number", placeholder: "3200" },
        { name: "transport_width_mm", label: "Laius (mm)", type: "number", placeholder: "2900" },
        { name: "transport_height_mm", label: "Kõrgus (mm)", type: "number", placeholder: "2800" },
        { name: "transport_length_mm", label: "Pikkus (mm)", type: "number", placeholder: "5200" },
      ],
    },
  ],
 };
 
 // Get fields for a specific equipment type
 export function getFieldsForEquipmentType(typeName: string): FieldGroup[] {
   const normalizedName = typeName.toLowerCase().replace(/\s+/g, "_");
   const specificFields = TYPE_SPECIFIC_FIELDS[normalizedName] || [];
   return [...COMMON_FIELDS, ...specificFields];
 }