import { useState } from "react";
import { Equipment } from "@/types/equipment";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrandTextColor } from "@/lib/brandColors";
import { useSpecLabels } from "@/hooks/useSpecLabels";

interface SpecRowConfig {
  key: keyof Equipment;
  labelKey: string;
  defaultLabel: string;
  format?: "number" | "currency";
  suffix?: string;
  bestType?: "max" | "min";
  conditional?: boolean;
}

interface MobileComparisonCardsProps {
  selectedModels: Equipment[];
  specRows: SpecRowConfig[];
  costRows: SpecRowConfig[];
  calculateBestValue: (key: keyof Equipment, type: "max" | "min") => number;
  calculateTCO: (equipment: Equipment) => number | null;
  bestTCO: number;
  equipmentTypeName?: string;
}

function formatNumber(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("et-EE").format(num);
}

function formatCurrency(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

function isMissing(value: unknown): boolean {
  return value === null || value === undefined;
}

function formatDetailedValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "●" : "○";
  if (typeof value === "number") return new Intl.NumberFormat("et-EE").format(value);
  return String(value);
}

// Detailed specs categories
const CATEGORY_ORDER = [
  "mootor", "kaldtransportöör_etteanne", "peksusüsteem", "puhastussüsteem",
  "terapunker", "koristusjääkide_käitlemine", "nõlvakusüsteem", "mõõtmed",
  "heedrid", "kabiin", "veosüsteem", "tehnoloogia",
] as const;

const CATEGORY_NAMES: Record<string, string> = {
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

const FIELD_NAMES: Record<string, Record<string, string>> = {
  mootor: {
    mark_ja_mudel: "Mark ja mudel", heitgaasinorm: "Heitgaasinorm", silindrid: "Silindrid",
    töömahu_liitrid: "Töömaht (l)", võimsus_kW_hj: "Võimsus (kW/hj)",
    max_pöördemoment_Nm: "Max pöördemoment (Nm)", kütusepaagi_maht_l: "Kütusepaagi maht (l)",
    adblue_paagi_maht_l: "AdBlue paagi maht (l)", jahutussüsteem: "Jahutussüsteem",
  },
  kaldtransportöör_etteanne: {
    sisestuslaius_mm: "Sisestuslaius (mm)", etteande_kett: "Etteande kett",
    raspi_latid: "Raspi latid", kivikaitse: "Kivikaitse",
  },
  peksusüsteem: {
    süsteemi_tüüp: "Süsteemi tüüp", rootorite_arv: "Rootorite arv",
    rootori_läbimõõt_mm: "Rootori läbimõõt (mm)", rootori_pikkus_mm: "Rootori pikkus (mm)",
    separeerimispind_m2: "Separeerimispind (m²)", rootori_kiiruse_reguleerimine: "Rootori kiiruse reguleerimine",
  },
  puhastussüsteem: {
    puhastussüsteemi_tüüp: "Puhastussüsteemi tüüp", sõelapind_m2: "Sõelapind (m²)",
    ventilaatori_tüüp: "Ventilaatori tüüp", aktiivne_sõelavõre: "Aktiivne sõelavõre",
  },
  terapunker: {
    maht_standardne_l: "Maht standardne (l)", maht_laiendusega_l: "Maht laiendusega (l)",
    tühjenduskiirus_l_s: "Tühjenduskiirus (l/s)", tigupikkus_m: "Tigupikkus (m)",
    tigupööramise_nurk: "Tigupööramise nurk", kokkuvolditav: "Kokkuvolditav",
  },
  koristusjääkide_käitlemine: { hekseldi_tüüp: "Hekseldi tüüp", laotuslaius_m: "Laotuslaius (m)" },
  nõlvakusüsteem: { süsteemi_nimi: "Süsteemi nimi", küljenurk_kraadi: "Küljenurk (°)", pikinurk_kraadi: "Pikinurk (°)" },
  mõõtmed: { kaal_baasmasin_kg: "Kaal baasmasin (kg)", transpordi_laius_mm: "Transpordi laius (mm)", transpordi_kõrgus_mm: "Transpordi kõrgus (mm)" },
  heedrid: { teraviljaheedri_laius_min_m: "Teraviljaheedri laius min (m)", teraviljaheedri_laius_max_m: "Teraviljaheedri laius max (m)" },
  kabiin: { kabiini_tüüp: "Kabiini tüüp", istme_tüüp: "Istme tüüp", vaateväli: "Vaateväli" },
  veosüsteem: { vedamise_tüüp: "Vedamise tüüp", kiiruse_vahemik_km_h: "Kiiruse vahemik (km/h)" },
  tehnoloogia: { starfire_positsioneerimine: "StarFire positsioneerimine", autotrac_juhtimine: "AutoTrac juhtimine", active_yield: "Active Yield", harvest_doc: "Harvest Doc" },
};

function formatFieldKey(key: string): string {
  let label = key.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getAllFieldsForCategory(allModels: Equipment[], categoryKey: string): string[] {
  const allFields = new Set<string>();
  allModels.forEach((model) => {
    const specs = model.detailed_specs;
    if (specs && typeof specs === "object" && specs[categoryKey]) {
      Object.keys(specs[categoryKey] as Record<string, unknown>).forEach((key) => allFields.add(key));
    }
  });
  const fieldOrder = FIELD_NAMES[categoryKey];
  if (fieldOrder) {
    const orderedFields = Object.keys(fieldOrder).filter((f) => allFields.has(f));
    const remainingFields = Array.from(allFields).filter((f) => !orderedFields.includes(f));
    return [...orderedFields, ...remainingFields];
  }
  return Array.from(allFields);
}

function getAvailableCategories(allModels: Equipment[], forceAll: boolean): string[] {
  if (forceAll) return CATEGORY_ORDER.slice();
  const available = new Set<string>();
  allModels.forEach((model) => {
    const specs = model.detailed_specs;
    if (specs && typeof specs === "object") {
      Object.keys(specs).forEach((key) => {
        if (CATEGORY_ORDER.includes(key as typeof CATEGORY_ORDER[number])) available.add(key);
      });
    }
  });
  return CATEGORY_ORDER.filter((cat) => available.has(cat));
}

export function MobileComparisonCards({
  selectedModels,
  specRows,
  costRows,
  calculateBestValue,
  calculateTCO,
  bestTCO,
  equipmentTypeName,
}: MobileComparisonCardsProps) {
  const { data: specLabels = {} } = useSpecLabels();
  const isCombine = equipmentTypeName === "combine";
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["mootor"]));

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const getLabel = (labelKey: string, defaultLabel: string): string => {
    return specLabels[labelKey] || defaultLabel;
  };

  const renderValue = (model: Equipment, config: SpecRowConfig) => {
    const { key, format, suffix = "", bestType } = config;
    const value = model[key] as number | null;
    const bestValue = bestType ? calculateBestValue(key, bestType) : null;
    const isBest = bestValue !== null && value === bestValue && value !== null;
    const isJohnDeere = model.brand?.name === "John Deere";

    const displayValue =
      format === "currency"
        ? formatCurrency(value)
        : isMissing(value)
        ? "—"
        : `${formatNumber(value)}${suffix}`;

    return (
      <div className="flex items-center justify-center gap-1">
        <span className={cn("whitespace-nowrap", isJohnDeere && "font-semibold")}>{displayValue}</span>
        {isBest && selectedModels.length > 1 && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
      </div>
    );
  };

  const visibleSpecRows = specRows.filter(
    (config) =>
      !config.conditional ||
      selectedModels.some((m) => m[config.key] !== null && m[config.key] !== undefined)
  );

  const modelColWidth = selectedModels.length === 1 ? "min-w-[140px]" : "min-w-[120px]";
  const availableCategories = getAvailableCategories(selectedModels, isCombine);

  return (
    <div className="overflow-auto -mx-4 px-0 max-h-[70vh]">
      <table className="w-full border-collapse text-sm" style={{ minWidth: `${120 + selectedModels.length * 120}px`, borderSpacing: 0 }}>
        {/* Header */}
        <thead className="sticky top-0 z-10" style={{ boxShadow: '0 1px 0 hsl(var(--border))' }}>
          <tr style={{ backgroundColor: 'hsl(var(--card))' }}>
            <th className="sticky left-0 z-20 bg-card p-2 min-w-[100px] max-w-[120px]" />
            {selectedModels.map((model, i) => (
              <th key={model.id} className={cn("p-2 text-center", modelColWidth, i === 0 ? "bg-primary/5" : "bg-card")}>
                {model.image_url && (
                  <img src={model.image_url} alt={model.model_name} className="h-12 w-full rounded object-contain bg-white mx-auto mb-1" />
                )}
                <span className={cn("text-[11px] font-bold block leading-tight", getBrandTextColor(model.brand?.name || ""))}>
                  {model.brand?.name}
                </span>
                <div className="text-[11px] font-medium text-foreground leading-tight truncate">{model.model_name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Spec rows */}
          {visibleSpecRows.map((config) => (
            <tr key={String(config.key)} className="border-t border-border/30">
              <td className="sticky left-0 z-10 bg-card p-2 text-[11px] text-muted-foreground font-medium leading-tight">
                {getLabel(config.labelKey, config.defaultLabel)}
              </td>
              {selectedModels.map((model, i) => (
                <td key={model.id} className={cn("p-2 text-center text-[12px]", i === 0 && "bg-primary/5")}>
                  {renderValue(model, config)}
                </td>
              ))}
            </tr>
          ))}

          {/* Cost section header */}
          <tr className="bg-muted/50">
            <td colSpan={selectedModels.length + 1} className="p-2 text-[11px] font-semibold text-foreground uppercase tracking-wide border-y border-border">
              Hinnad ja kulud
            </td>
          </tr>

          {/* Cost rows */}
          {costRows.map((config) => (
            <tr key={String(config.key)} className="border-t border-border/30">
              <td className="sticky left-0 z-10 bg-card p-2 text-[11px] text-muted-foreground font-medium leading-tight">
                {getLabel(config.labelKey, config.defaultLabel)}
              </td>
              {selectedModels.map((model, i) => (
                <td key={model.id} className={cn("p-2 text-center text-[12px]", i === 0 && "bg-primary/5")}>
                  {renderValue(model, config)}
                </td>
              ))}
            </tr>
          ))}

          {/* TCO row */}
          <tr className="border-t border-border bg-muted">
            <td className="sticky left-0 z-10 bg-muted p-2 text-[11px] font-semibold text-foreground leading-tight">
              TCO (Kogukulu)
            </td>
            {selectedModels.map((model, i) => {
              const tco = calculateTCO(model);
              const isBestTCO = tco === bestTCO && tco !== null;
              const isJohnDeere = model.brand?.name === "John Deere";
              return (
                <td key={model.id} className={cn("p-2 text-center text-[12px] font-semibold", i === 0 && "bg-primary/5")}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn("whitespace-nowrap", isJohnDeere && "font-semibold")}>
                      {tco !== null ? formatCurrency(tco) : "—"}
                    </span>
                    {isBestTCO && selectedModels.length > 1 && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                  </div>
                </td>
              );
            })}
          </tr>

          {/* Detailed specs categories */}
          {availableCategories.map((categoryKey) => {
            const isExpanded = expandedCategories.has(categoryKey);
            const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;
            const fields = getAllFieldsForCategory(selectedModels, categoryKey);
            const fieldNames = FIELD_NAMES[categoryKey] || {};

            return (
              <>
                {/* Category header */}
                <tr
                  key={`cat-${categoryKey}`}
                  className={cn(
                    "border-t border-border cursor-pointer",
                    isExpanded ? "bg-primary/10" : "bg-muted/30"
                  )}
                  onClick={() => toggleCategory(categoryKey)}
                >
                  <td className={cn("sticky left-0 z-10 p-2 text-[11px] font-semibold text-foreground", isExpanded ? "bg-primary/10" : "bg-muted")}>
                    <div className="flex items-center gap-1">
                      {isExpanded ? <ChevronDown className="h-3 w-3 text-primary shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <span className={cn("leading-tight", isExpanded && "text-primary")}>{categoryName}</span>
                    </div>
                  </td>
                  {selectedModels.map((model, i) => (
                    <td key={model.id} className={cn("p-2", i === 0 && "bg-primary/5")} />
                  ))}
                </tr>

                {/* Category fields */}
                {isExpanded && fields.map((fieldKey) => {
                  const defaultFieldName = fieldNames[fieldKey] || formatFieldKey(fieldKey);
                  const fieldLabel = specLabels[`${categoryKey}_${fieldKey}`] || defaultFieldName;

                  return (
                    <tr key={`${categoryKey}-${fieldKey}`} className="border-t border-border/30">
                      <td className="sticky left-0 z-10 bg-card p-2 pl-5 text-[11px] text-muted-foreground font-medium leading-tight">
                        {fieldLabel}
                      </td>
                      {selectedModels.map((model, i) => {
                        const specs = model.detailed_specs;
                        const catData = specs && typeof specs === "object" && specs[categoryKey]
                          ? (specs[categoryKey] as Record<string, unknown>)
                          : null;
                        const value = catData ? catData[fieldKey] : null;
                        return (
                          <td key={model.id} className={cn("p-2 text-center text-[12px]", i === 0 && "bg-primary/5")}>
                            {formatDetailedValue(value)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
