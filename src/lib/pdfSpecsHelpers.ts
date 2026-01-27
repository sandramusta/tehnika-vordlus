// PDF export helpers - shared constants and utility functions for detailed specs
import { Equipment } from "@/types/equipment";

// Category display names and order (mirrored from DetailedSpecsTableRows)
export const CATEGORY_ORDER = [
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

export const CATEGORY_NAMES: Record<string, string> = {
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

// Field display names for each category
export const FIELD_NAMES: Record<string, Record<string, string>> = {
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
