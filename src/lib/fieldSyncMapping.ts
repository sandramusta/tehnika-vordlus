/**
 * Mapping between equipment DB columns and detailed_specs JSONB fields.
 * Used to auto-sync values when the same indicator appears in both places.
 */

export interface SpecLocation {
  category: string;
  field: string;
}

// ============================================================================
// Per-type mappings: DB column name → JSONB { category, field }
// ============================================================================

const COMBINE_MAPPING: Record<string, SpecLocation> = {
  fuel_tank_liters: { category: "mootor", field: "kütusepaagi_maht_l" },
  weight_kg: { category: "mõõtmed", field: "kaal_baasmasin_kg" },
  rotor_diameter_mm: { category: "peksusüsteem", field: "rootori_läbimõõt_mm" },
  rotor_length_mm: { category: "peksusüsteem", field: "rootori_pikkus_mm" },
  separator_area_m2: { category: "peksusüsteem", field: "separeerimispind_m2" },
  sieve_area_m2: { category: "puhastussüsteem", field: "sõelapind_m2" },
  feeder_width_mm: { category: "kaldtransportöör_etteanne", field: "sisestuslaius_mm" },
  grain_tank_liters: { category: "terapunker", field: "maht_standardne_l" },
  unloading_rate_ls: { category: "terapunker", field: "tühjenduskiirus_l_s" },
  auger_reach_m: { category: "terapunker", field: "tigupikkus_m" },
  transport_width_mm: { category: "mõõtmed", field: "transpordi_laius_mm" },
  transport_height_mm: { category: "mõõtmed", field: "transpordi_kõrgus_mm" },
  header_width_min_m: { category: "heedrid", field: "teraviljaheedri_laius_min_m" },
  header_width_max_m: { category: "heedrid", field: "teraviljaheedri_laius_max_m" },
  engine_cylinders: { category: "mootor", field: "silindrid" },
  max_torque_nm: { category: "mootor", field: "max_pöördemoment_Nm" },
  engine_displacement_liters: { category: "mootor", field: "töömahu_liitrid" },
};

const TELEHANDLER_MAPPING: Record<string, SpecLocation> = {
  engine_power_hp: { category: "mootor", field: "võimsus_hj" },
  fuel_consumption_lh: { category: "mootor", field: "kütusekulu_lh" },
  weight_kg: { category: "mõõtmed", field: "kaal_kg" },
  lift_height_m: { category: "tõsteomadused", field: "tõstekõrgus_m" },
  lift_reach_m: { category: "tõsteomadused", field: "tõste_kaugus_m" },
  max_lift_capacity_kg: { category: "tõsteomadused", field: "max_tõstevõime_kg" },
  hydraulic_pump_lpm: { category: "hüdraulika", field: "hüdraulikapumba_võimsus_lpm" },
  transport_width_mm: { category: "mõõtmed", field: "laius_mm" },
  transport_height_mm: { category: "mõõtmed", field: "kõrgus_mm" },
  transport_length_mm: { category: "mõõtmed", field: "pikkus_mm" },
};

const TRACTOR_MAPPING: Record<string, SpecLocation> = {
  engine_power_hp: { category: "mootor", field: "max_võimsus_hj_kw" },
  engine_displacement_liters: { category: "mootor", field: "kubatuur_l" },
  engine_cylinders: { category: "mootor", field: "silindrid" },
  max_torque_nm: { category: "mootor", field: "max_pöördemoment_Nm" },
  fuel_tank_liters: { category: "mahud", field: "kütusepaak_l" },
  weight_kg: { category: "massid", field: "tühimass_kg" },
};

const FORAGE_HARVESTER_MAPPING: Record<string, SpecLocation> = {
  engine_power_hp: { category: "mootor", field: "võimsus_hj" },
  engine_displacement_liters: { category: "mootor", field: "töömaht_l" },
  engine_cylinders: { category: "mootor", field: "silindrid" },
  fuel_tank_liters: { category: "mootor", field: "kütusepaagi_maht_l" },
  weight_kg: { category: "mõõtmed", field: "kaal_kg" },
  transport_width_mm: { category: "mõõtmed", field: "laius_mm" },
  transport_height_mm: { category: "mõõtmed", field: "kõrgus_mm" },
  transport_length_mm: { category: "mõõtmed", field: "pikkus_mm" },
};

const WHEEL_LOADER_MAPPING: Record<string, SpecLocation> = {
  engine_power_hp: { category: "mootor", field: "võimsus_hj" },
  lift_height_m: { category: "tõsteomadused", field: "tõstekõrgus_m" },
  max_lift_capacity_kg: { category: "tõsteomadused", field: "max_tõstevõime_kg" },
  weight_kg: { category: "mõõtmed", field: "kaal_kg" },
  transport_width_mm: { category: "mõõtmed", field: "laius_mm" },
  transport_height_mm: { category: "mõõtmed", field: "kõrgus_mm" },
  transport_length_mm: { category: "mõõtmed", field: "pikkus_mm" },
};

const SELF_PROPELLED_SPRAYER_MAPPING: Record<string, SpecLocation> = {
  engine_power_hp: { category: "šassii", field: "kliirens_cm" },
};

const TRAILED_SPRAYER_MAPPING: Record<string, SpecLocation> = {
  grain_tank_liters: { category: "paak_ja_poomid", field: "paagi_maht_l" },
  header_width_m: { category: "paak_ja_poomid", field: "poomi_laius_m" },
};

const ROUND_BALER_MAPPING: Record<string, SpecLocation> = {
  weight_kg: { category: "mõõtmed", field: "kaal_kg" },
  transport_width_mm: { category: "mõõtmed", field: "laius_mm" },
  transport_height_mm: { category: "mõõtmed", field: "kõrgus_mm" },
  transport_length_mm: { category: "mõõtmed", field: "pikkus_mm" },
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the column→spec mapping for a given equipment type.
 */
export function getColumnToSpecsMapping(typeName?: string): Record<string, SpecLocation> {
  if (!typeName) return COMBINE_MAPPING;
  const n = typeName.toLowerCase().trim();
  if (n === "combine" || n === "kombain") return COMBINE_MAPPING;
  if (n === "telehandler" || n === "teleskooplaadur") return TELEHANDLER_MAPPING;
  if (n === "tractor" || n === "traktor") return TRACTOR_MAPPING;
  if (n === "forage_harvester" || n === "forage harvester" || n === "hekseldi") return FORAGE_HARVESTER_MAPPING;
  if (n === "wheel_loader" || n === "wheel loader" || n === "rataslaadur") return WHEEL_LOADER_MAPPING;
  if (n === "self_propelled_sprayer" || n === "self-propelled sprayer" || n === "iseliikuv taimekaitseprits") return SELF_PROPELLED_SPRAYER_MAPPING;
  if (n === "trailed_sprayer" || n === "trailed sprayer" || n === "järelveetav taimekaitseprits") return TRAILED_SPRAYER_MAPPING;
  if (n === "round_baler" || n === "round baler" || n === "ruloonpress") return ROUND_BALER_MAPPING;
  return COMBINE_MAPPING;
}

/**
 * Build a reverse mapping: { "category.field" → columnName }
 */
export function getSpecsToColumnMapping(typeName?: string): Record<string, string> {
  const forward = getColumnToSpecsMapping(typeName);
  const reverse: Record<string, string> = {};
  for (const [col, loc] of Object.entries(forward)) {
    reverse[`${loc.category}.${loc.field}`] = col;
  }
  return reverse;
}

/**
 * Given a column value change, return the updated detailed_specs with the synced value.
 */
export function syncColumnToSpecs(
  typeName: string | undefined,
  columnName: string,
  value: unknown,
  currentSpecs: Record<string, Record<string, unknown>>
): Record<string, Record<string, unknown>> | null {
  const mapping = getColumnToSpecsMapping(typeName);
  const loc = mapping[columnName];
  if (!loc) return null;

  return {
    ...currentSpecs,
    [loc.category]: {
      ...(currentSpecs[loc.category] || {}),
      [loc.field]: value,
    },
  };
}

/**
 * Given a spec field change, return the column name and value to sync.
 */
export function syncSpecToColumn(
  typeName: string | undefined,
  category: string,
  field: string,
  value: unknown
): { columnName: string; value: unknown } | null {
  const reverse = getSpecsToColumnMapping(typeName);
  const key = `${category}.${field}`;
  const columnName = reverse[key];
  if (!columnName) return null;
  return { columnName, value };
}
