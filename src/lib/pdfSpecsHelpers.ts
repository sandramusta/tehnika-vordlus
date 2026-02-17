// PDF export helpers - shared constants and utility functions for detailed specs
import { Equipment } from "@/types/equipment";

// ============================================================================
// COMBINE (Kombain) - Original 12 categories
// ============================================================================
export const COMBINE_CATEGORY_ORDER = [
  "mootor",
  "kaldtransportöör_etteanne",
  "peksusüsteem",
  "puhastussüsteem",
  "terapunker",
  "koristusjääkide_käitlemine",
  "nõlvakusüsteem",
  "mõõtmed",
  "heedrid",
  "kabiin",
  "veosüsteem",
  "tehnoloogia",
] as const;

export const COMBINE_CATEGORY_NAMES: Record<string, string> = {
  mootor: "MOOTOR",
  kaldtransportöör_etteanne: "KALDTRANSPORTÖÖR / ETTEANNE",
  peksusüsteem: "PEKS JA SEPAREERIMINE",
  puhastussüsteem: "PUHASTUSSÜSTEEM",
  terapunker: "TERAPUNKER",
  koristusjääkide_käitlemine: "KORISTUSJÄÄKIDE KÄITLEMINE",
  nõlvakusüsteem: "NÕLVAKUSÜSTEEM",
  mõõtmed: "MÕÕTMED",
  heedrid: "HEEDRID",
  kabiin: "KABIIN",
  veosüsteem: "VEOSÜSTEEM",
  tehnoloogia: "INTEGREERITUD TEHNOLOOGIA",
};

export const COMBINE_FIELD_NAMES: Record<string, Record<string, string>> = {
  mootor: {
    mark_ja_mudel: "Mark ja mudel",
    heitgaasinorm: "Heitgaasinorm",
    silindrid: "Silindrid",
    töömahu_liitrid: "Töömaht (l)",
    võimsus_kW_hj: "Võimsus (kW/hj)",
    max_pöördemoment_Nm: "Max pöördemoment (Nm)",
    kütusepaagi_maht_l: "Kütusepaagi maht (l)",
    adblue_paagi_maht_l: "AdBlue paagi maht (l)",
    jahutussüsteem: "Jahutussüsteem",
  },
  kaldtransportöör_etteanne: {
    sisestuslaius_mm: "Sisestuslaius (mm)",
    etteande_kett: "Etteande kett",
    raspi_latid: "Raspi latid",
    kivikaitse: "Kivikaitse",
  },
  peksusüsteem: {
    süsteemi_tüüp: "Süsteemi tüüp",
    rootorite_arv: "Rootorite arv",
    rootori_läbimõõt_mm: "Rootori läbimõõt (mm)",
    rootori_pikkus_mm: "Rootori pikkus (mm)",
    separeerimispind_m2: "Separeerimispind (m²)",
    rootori_kiiruse_reguleerimine: "Rootori kiiruse reguleerimine",
  },
  puhastussüsteem: {
    puhastussüsteemi_tüüp: "Puhastussüsteemi tüüp",
    sõelapind_m2: "Sõelapind (m²)",
    ventilaatori_tüüp: "Ventilaatori tüüp",
    aktiivne_sõelavõre: "Aktiivne sõelavõre",
  },
  terapunker: {
    maht_standardne_l: "Maht standardne (l)",
    maht_laiendusega_l: "Maht laiendusega (l)",
    tühjenduskiirus_l_s: "Tühjenduskiirus (l/s)",
    tigupikkus_m: "Tigupikkus (m)",
    tigupööramise_nurk: "Tigupööramise nurk",
    kokkuvolditav: "Kokkuvolditav",
  },
  koristusjääkide_käitlemine: {
    hekseldi_tüüp: "Hekseldi tüüp",
    laotuslaius_m: "Laotuslaius (m)",
  },
  nõlvakusüsteem: {
    süsteemi_nimi: "Süsteemi nimi",
    küljenurk_kraadi: "Küljenurk (°)",
    pikinurk_kraadi: "Pikinurk (°)",
  },
  mõõtmed: {
    kaal_baasmasin_kg: "Kaal baasmasin (kg)",
    transpordi_laius_mm: "Transpordi laius (mm)",
    transpordi_kõrgus_mm: "Transpordi kõrgus (mm)",
  },
  heedrid: {
    teraviljaheedri_laius_min_m: "Teraviljaheedri laius min (m)",
    teraviljaheedri_laius_max_m: "Teraviljaheedri laius max (m)",
  },
  kabiin: {
    kabiini_tüüp: "Kabiini tüüp",
    istme_tüüp: "Istme tüüp",
    vaateväli: "Vaateväli",
  },
  veosüsteem: {
    vedamise_tüüp: "Vedamise tüüp",
    kiiruse_vahemik_km_h: "Kiiruse vahemik (km/h)",
  },
  tehnoloogia: {
    starfire_positsioneerimine: "StarFire positsioneerimine",
    autotrac_juhtimine: "AutoTrac juhtimine",
    active_yield: "Active Yield",
    harvest_doc: "Harvest Doc",
  },
};

// ============================================================================
// TELEHANDLER (Teleskooplaadur) - 4 categories
// ============================================================================
export const TELEHANDLER_CATEGORY_ORDER = [
  "tõsteomadused",
  "hüdraulika",
  "mõõtmed",
  "mootor",
] as const;

export const TELEHANDLER_CATEGORY_NAMES: Record<string, string> = {
  tõsteomadused: "TÕSTEOMADUSED",
  hüdraulika: "HÜDRAULIKA",
  mõõtmed: "MÕÕTMED",
  mootor: "MOOTOR",
};

export const TELEHANDLER_FIELD_NAMES: Record<string, Record<string, string>> = {
  tõsteomadused: {
    tõstekõrgus_m: "Tõstekõrgus (m)",
    tõste_kaugus_m: "Tõste kaugus (m)",
    max_tõstevõime_kg: "Max tõstevõime (kg)",
  },
  hüdraulika: {
    hüdraulikapumba_võimsus_lpm: "Hüdraulikapumba võimsus (l/min)",
  },
  mõõtmed: {
    laius_mm: "Laius (mm)",
    kõrgus_mm: "Kõrgus (mm)",
    pikkus_mm: "Pikkus (mm)",
    kaal_kg: "Kaal (kg)",
  },
  mootor: {
    võimsus_hj: "Võimsus (hj)",
    kütusekulu_lh: "Kütusekulu (l/h)",
    kütusepaagi_maht_l: "Kütusepaagi maht (l)",
  },
};

// ============================================================================
// TRACTOR (Traktor) - 9 categories
// ============================================================================
export const TRACTOR_CATEGORY_ORDER = [
  "mootor",
  "käigukast",
  "hüdrosüsteem",
  "tagumine_rippsüsteem",
  "eesmine_rippsüsteem",
  "kabiin",
  "mahud",
  "mõõtmed",
  "massid",
] as const;

export const TRACTOR_CATEGORY_NAMES: Record<string, string> = {
  mootor: "MOOTOR",
  käigukast: "KÄIGUKAST",
  hüdrosüsteem: "HÜDROSÜSTEEM",
  tagumine_rippsüsteem: "TAGUMINE RIPPSÜSTEEM",
  eesmine_rippsüsteem: "EESMINE RIPPSÜSTEEM",
  kabiin: "KABIIN",
  mahud: "MAHUD",
  mõõtmed: "MÕÕTMED",
  massid: "MASSID",
};

export const TRACTOR_TRANSMISSION_OPTIONS = [
  "PowrQuad™ Plus",
  "AutoQuad™ Plus",
  "AutoQuad™ Plus EcoShift",
  "CommandQuad™ Plus",
  "CommandQuad™ Plus EcoShift",
  "AutoPowr™",
  "e23",
  "eAutoPowr™",
  "e18",
  "e21",
] as const;

export const TRACTOR_FIELD_NAMES: Record<string, Record<string, string>> = {
  mootor: {
    max_võimsus_hj_kw: "Max võimsus (ECE-R120), hj (kW)",
    max_võimsus_ipm_hj_kw: "Max võimsus IPM-iga, hj (kW)",
    pöördemomendi_varu_pct: "Pöördemomendi varu (%)",
    max_pöördemoment_Nm: "Maksimaalne pöördemoment (Nm)",
    silindrid: "Silindrid",
    kubatuur_l: "Kubatuur (l)",
  },
  käigukast: {
    tüüp: "Käigukasti tüüp",
  },
  hüdrosüsteem: {
    hüdrojaoturid: "Hüdrojaoturid",
    vooluhulk_lpm: "Vooluhulk mootori nimipööretel (l/min)",
  },
  tagumine_rippsüsteem: {
    max_tõstevõime_konksudel_kg: "Max tõstevõime aisa konksudel (kg)",
    tõstevõime_oecd_610_kg: "Tõstevõime kogu tõsteulatuses OECD 610 mm (kg)",
  },
  eesmine_rippsüsteem: {
    max_tõstevõime_konksudel_kg: "Max tõstevõime aisa konksudel (kg)",
    tõstevõime_oecd_610_kg: "Tõstevõime kogu tõsteulatuses OECD 610 mm (kg)",
  },
  kabiin: {
    vedrustus: "Vedrustus",
    kabiini_ruumala_m3: "Kabiini ruumala (m³)",
  },
  mahud: {
    kütusepaak_l: "Kütusepaak (standard/lisavarustus) (l)",
    def_l: "DEF (l)",
  },
  mõõtmed: {
    teljevahe_mm: "Teljevahe (mm)",
    kliirens_mm: "Kliirens (mm)",
  },
  massid: {
    tühimass_kg: "Tühimass (kg)",
    max_lubatud_täismass_kg: "Maksimaalne lubatud täismass (kg)",
  },
};

// ============================================================================
// FORAGE HARVESTER (Hekseldi) - 4 categories
// ============================================================================
export const FORAGE_HARVESTER_CATEGORY_ORDER = [
  "mootor",
  "lõikur",
  "tõstuk",
  "mõõtmed",
] as const;

export const FORAGE_HARVESTER_CATEGORY_NAMES: Record<string, string> = {
  mootor: "MOOTOR",
  lõikur: "LÕIKUR",
  tõstuk: "TÕSTUK",
  mõõtmed: "MÕÕTMED",
};

export const FORAGE_HARVESTER_FIELD_NAMES: Record<string, Record<string, string>> = {
  mootor: {
    võimsus_hj: "Võimsus (hj)",
    töömaht_l: "Töömaht (l)",
    silindrid: "Silindrid",
    kütusepaagi_maht_l: "Kütusepaagi maht (l)",
  },
  lõikur: {
    lõikelaius_m: "Lõikelaius (m)",
    nugade_arv: "Nugade arv",
    lõikekiirus_min: "Lõikekiirus (1/min)",
  },
  tõstuk: {
    väljutuskõrgus_m: "Väljutuskõrgus (m)",
    väljutuskaugus_m: "Väljutuskaugus (m)",
  },
  mõõtmed: {
    kaal_kg: "Kaal (kg)",
    laius_mm: "Laius (mm)",
    kõrgus_mm: "Kõrgus (mm)",
    pikkus_mm: "Pikkus (mm)",
  },
};

// ============================================================================
// WHEEL LOADER (Rataslaadur) - 3 categories
// ============================================================================
export const WHEEL_LOADER_CATEGORY_ORDER = [
  "tõsteomadused",
  "mootor",
  "mõõtmed",
] as const;

export const WHEEL_LOADER_CATEGORY_NAMES: Record<string, string> = {
  tõsteomadused: "TÕSTEOMADUSED",
  mootor: "MOOTOR",
  mõõtmed: "MÕÕTMED",
};

export const WHEEL_LOADER_FIELD_NAMES: Record<string, Record<string, string>> = {
  tõsteomadused: {
    tõstekõrgus_m: "Tõstekõrgus (m)",
    max_tõstevõime_kg: "Max tõstevõime (kg)",
    kopalaius_mm: "Kopa laius (mm)",
    kopamaht_m3: "Kopa maht (m³)",
  },
  mootor: {
    võimsus_hj: "Võimsus (hj)",
    kütusepaagi_maht_l: "Kütusepaagi maht (l)",
  },
  mõõtmed: {
    kaal_kg: "Kaal (kg)",
    laius_mm: "Laius (mm)",
    kõrgus_mm: "Kõrgus (mm)",
    pikkus_mm: "Pikkus (mm)",
  },
};

// ============================================================================
// SELF-PROPELLED SPRAYER (Iseliikuv taimekaitseprits) - 4 categories
// ============================================================================
export const SELF_PROPELLED_SPRAYER_CATEGORY_ORDER = [
  "paak",
  "poomid",
  "mootor",
  "mõõtmed",
] as const;

export const SELF_PROPELLED_SPRAYER_CATEGORY_NAMES: Record<string, string> = {
  paak: "PAAK",
  poomid: "POOMID",
  mootor: "MOOTOR",
  mõõtmed: "MÕÕTMED",
};

export const SELF_PROPELLED_SPRAYER_FIELD_NAMES: Record<string, Record<string, string>> = {
  paak: {
    paagi_maht_l: "Paagi maht (l)",
    puhastvee_paak_l: "Puhta vee paak (l)",
  },
  poomid: {
    poomi_laius_m: "Poomi laius (m)",
    poomi_kõrguse_vahemik_mm: "Poomi kõrguse vahemik (mm)",
  },
  mootor: {
    võimsus_hj: "Võimsus (hj)",
    kütusepaagi_maht_l: "Kütusepaagi maht (l)",
  },
  mõõtmed: {
    kaal_kg: "Kaal (kg)",
    laius_mm: "Transpordi laius (mm)",
    kõrgus_mm: "Kõrgus (mm)",
    pikkus_mm: "Pikkus (mm)",
  },
};

// ============================================================================
// TRAILED SPRAYER (Järelveetav taimekaitseprits) - 3 categories
// ============================================================================
export const TRAILED_SPRAYER_CATEGORY_ORDER = [
  "paak",
  "poomid",
  "mõõtmed",
] as const;

export const TRAILED_SPRAYER_CATEGORY_NAMES: Record<string, string> = {
  paak: "PAAK",
  poomid: "POOMID",
  mõõtmed: "MÕÕTMED",
};

export const TRAILED_SPRAYER_FIELD_NAMES: Record<string, Record<string, string>> = {
  paak: {
    paagi_maht_l: "Paagi maht (l)",
    puhastvee_paak_l: "Puhta vee paak (l)",
  },
  poomid: {
    poomi_laius_m: "Poomi laius (m)",
    poomi_kõrguse_vahemik_mm: "Poomi kõrguse vahemik (mm)",
  },
  mõõtmed: {
    kaal_kg: "Kaal (kg)",
    laius_mm: "Transpordi laius (mm)",
    kõrgus_mm: "Kõrgus (mm)",
    pikkus_mm: "Pikkus (mm)",
  },
};

// ============================================================================
// ROUND BALER (Ruloonpress) - 3 categories
// ============================================================================
export const ROUND_BALER_CATEGORY_ORDER = [
  "ruloonid",
  "nõuded",
  "mõõtmed",
] as const;

export const ROUND_BALER_CATEGORY_NAMES: Record<string, string> = {
  ruloonid: "RULOONID",
  nõuded: "NÕUDED",
  mõõtmed: "MÕÕTMED",
};

export const ROUND_BALER_FIELD_NAMES: Record<string, Record<string, string>> = {
  ruloonid: {
    rulooni_läbimõõt_mm: "Rulooni läbimõõt (mm)",
    rulooni_laius_mm: "Rulooni laius (mm)",
    sidumine: "Sidumine",
  },
  nõuded: {
    min_võimsus_hj: "Min võimsus (hj)",
    kardaanivõlli_pöörded: "Kardaanivõlli pöörded (1/min)",
  },
  mõõtmed: {
    kaal_kg: "Kaal (kg)",
    laius_mm: "Laius (mm)",
    kõrgus_mm: "Kõrgus (mm)",
    pikkus_mm: "Pikkus (mm)",
  },
};

// ============================================================================
// BACKWARD COMPATIBILITY - Original exports (aliases to combine data)
// ============================================================================
export const CATEGORY_ORDER = COMBINE_CATEGORY_ORDER;
export const CATEGORY_NAMES = COMBINE_CATEGORY_NAMES;
export const FIELD_NAMES = COMBINE_FIELD_NAMES;

// ============================================================================
// DYNAMIC GETTERS - Get specs based on equipment type
// ============================================================================

/**
 * Returns the category order array for a given equipment type
 */
export function getCategoryOrderForType(typeName?: string): readonly string[] {
  if (!typeName) return COMBINE_CATEGORY_ORDER;
  
  const normalizedType = typeName.toLowerCase().trim();
  
  if (normalizedType === "combine" || normalizedType === "kombain") {
    return COMBINE_CATEGORY_ORDER;
  }
  if (normalizedType === "teleskooplaadur" || normalizedType === "telehandler") {
    return TELEHANDLER_CATEGORY_ORDER;
  }
  if (normalizedType === "traktor" || normalizedType === "tractor") {
    return TRACTOR_CATEGORY_ORDER;
  }
  if (normalizedType === "hekseldi" || normalizedType === "forage harvester") {
    return FORAGE_HARVESTER_CATEGORY_ORDER;
  }
  if (normalizedType === "rataslaadur" || normalizedType === "wheel loader") {
    return WHEEL_LOADER_CATEGORY_ORDER;
  }
  if (normalizedType === "iseliikuv taimekaitseprits" || normalizedType === "self-propelled sprayer") {
    return SELF_PROPELLED_SPRAYER_CATEGORY_ORDER;
  }
  if (normalizedType === "järelveetav taimekaitseprits" || normalizedType === "trailed sprayer") {
    return TRAILED_SPRAYER_CATEGORY_ORDER;
  }
  if (normalizedType === "ruloonpress" || normalizedType === "round baler") {
    return ROUND_BALER_CATEGORY_ORDER;
  }
  
  // Default to combine for unknown types
  return COMBINE_CATEGORY_ORDER;
}

/**
 * Returns the category names mapping for a given equipment type
 */
export function getCategoryNamesForType(typeName?: string): Record<string, string> {
  if (!typeName) return COMBINE_CATEGORY_NAMES;
  
  const normalizedType = typeName.toLowerCase().trim();
  
  if (normalizedType === "combine" || normalizedType === "kombain") {
    return COMBINE_CATEGORY_NAMES;
  }
  if (normalizedType === "teleskooplaadur" || normalizedType === "telehandler") {
    return TELEHANDLER_CATEGORY_NAMES;
  }
  if (normalizedType === "traktor" || normalizedType === "tractor") {
    return TRACTOR_CATEGORY_NAMES;
  }
  if (normalizedType === "hekseldi" || normalizedType === "forage harvester") {
    return FORAGE_HARVESTER_CATEGORY_NAMES;
  }
  if (normalizedType === "rataslaadur" || normalizedType === "wheel loader") {
    return WHEEL_LOADER_CATEGORY_NAMES;
  }
  if (normalizedType === "iseliikuv taimekaitseprits" || normalizedType === "self-propelled sprayer") {
    return SELF_PROPELLED_SPRAYER_CATEGORY_NAMES;
  }
  if (normalizedType === "järelveetav taimekaitseprits" || normalizedType === "trailed sprayer") {
    return TRAILED_SPRAYER_CATEGORY_NAMES;
  }
  if (normalizedType === "ruloonpress" || normalizedType === "round baler") {
    return ROUND_BALER_CATEGORY_NAMES;
  }
  
  return COMBINE_CATEGORY_NAMES;
}

/**
 * Returns the field names mapping for a given equipment type
 */
export function getFieldNamesForType(typeName?: string): Record<string, Record<string, string>> {
  if (!typeName) return COMBINE_FIELD_NAMES;
  
  const normalizedType = typeName.toLowerCase().trim();
  
  if (normalizedType === "combine" || normalizedType === "kombain") {
    return COMBINE_FIELD_NAMES;
  }
  if (normalizedType === "teleskooplaadur" || normalizedType === "telehandler") {
    return TELEHANDLER_FIELD_NAMES;
  }
  if (normalizedType === "traktor" || normalizedType === "tractor") {
    return TRACTOR_FIELD_NAMES;
  }
  if (normalizedType === "hekseldi" || normalizedType === "forage harvester") {
    return FORAGE_HARVESTER_FIELD_NAMES;
  }
  if (normalizedType === "rataslaadur" || normalizedType === "wheel loader") {
    return WHEEL_LOADER_FIELD_NAMES;
  }
  if (normalizedType === "iseliikuv taimekaitseprits" || normalizedType === "self-propelled sprayer") {
    return SELF_PROPELLED_SPRAYER_FIELD_NAMES;
  }
  if (normalizedType === "järelveetav taimekaitseprits" || normalizedType === "trailed sprayer") {
    return TRAILED_SPRAYER_FIELD_NAMES;
  }
  if (normalizedType === "ruloonpress" || normalizedType === "round baler") {
    return ROUND_BALER_FIELD_NAMES;
  }
  
  return COMBINE_FIELD_NAMES;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Format value for PDF display
export function formatDetailedValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Jah" : "Ei";
  if (typeof value === "number") {
    return new Intl.NumberFormat("et-EE").format(value);
  }
  return String(value);
}

// Get all unique fields across all models for a category
export function getAllFieldsForCategory(
  allModels: Equipment[],
  categoryKey: string
): string[] {
  const allFields = new Set<string>();

  allModels.forEach((model) => {
    const specs = model.detailed_specs;
    if (specs && typeof specs === "object" && specs[categoryKey]) {
      const categoryData = specs[categoryKey] as Record<string, unknown>;
      Object.keys(categoryData).forEach((key) => allFields.add(key));
    }
  });

  // Sort fields by predefined order if available
  const fieldOrder = FIELD_NAMES[categoryKey];
  if (fieldOrder) {
    const orderedFields = Object.keys(fieldOrder).filter((f) => allFields.has(f));
    const remainingFields = Array.from(allFields).filter(
      (f) => !orderedFields.includes(f)
    );
    return [...orderedFields, ...remainingFields];
  }

  return Array.from(allFields);
}

// Get all fields for a category based on FIELD_NAMES (for forced display)
export function getCategoryFields(categoryKey: string): string[] {
  return Object.keys(FIELD_NAMES[categoryKey] || {});
}

// Get available categories from models
export function getAvailableCategories(
  allModels: Equipment[],
  forceAll: boolean = false
): string[] {
  if (forceAll) {
    return CATEGORY_ORDER.slice();
  }

  const availableCategories = new Set<string>();

  allModels.forEach((model) => {
    const specs = model.detailed_specs;
    if (specs && typeof specs === "object") {
      Object.keys(specs).forEach((key) => {
        if (CATEGORY_ORDER.includes(key as typeof CATEGORY_ORDER[number])) {
          availableCategories.add(key);
        }
      });
    }
  });

  return CATEGORY_ORDER.filter((cat) => availableCategories.has(cat));
}

export interface DetailedSpecCategory {
  categoryKey: string;
  categoryName: string;
  rows: { label: string; values: string[] }[];
}

// Build detailed spec rows for PDF export
export function buildDetailedSpecRows(
  selectedModels: Equipment[],
  isCombine: boolean
): DetailedSpecCategory[] {
  const result: DetailedSpecCategory[] = [];

  // Get categories - for combines, always show all
  const categories = isCombine
    ? CATEGORY_ORDER.slice()
    : getAvailableCategories(selectedModels, false);

  categories.forEach((categoryKey) => {
    const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;
    
    // For combines, always show all fields; otherwise, only fields with data
    const fields = isCombine
      ? getCategoryFields(categoryKey)
      : getAllFieldsForCategory(selectedModels, categoryKey);
    
    const fieldNames = FIELD_NAMES[categoryKey] || {};

    const rows: { label: string; values: string[] }[] = [];
    fields.forEach((fieldKey) => {
      const label = fieldNames[fieldKey] || fieldKey.replace(/_/g, " ");
      const values = selectedModels.map((model) => {
        const specs = model.detailed_specs;
        const categoryData =
          specs && typeof specs === "object" && specs[categoryKey]
            ? (specs[categoryKey] as Record<string, unknown>)
            : null;
        const value = categoryData ? categoryData[fieldKey] : null;
        return formatDetailedValue(value);
      });
      rows.push({ label, values });
    });

    // Always include category for combines; otherwise only if it has rows
    if (rows.length > 0 || isCombine) {
      result.push({ categoryKey, categoryName, rows });
    }
  });

  return result;
}
