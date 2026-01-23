import { useState } from "react";
import { Equipment } from "@/types/equipment";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditableCell, EditableValueCell } from "./EditableCell";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { useSpecLabels } from "@/hooks/useSpecLabels";
import { toast } from "sonner";

interface DetailedSpecsTableRowsProps {
  allModels: Equipment[];
  selectedModelId: string;
}

// Category display names and order
const CATEGORY_ORDER = [
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

// Field display names for each category
const FIELD_NAMES: Record<string, Record<string, string>> = {
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

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "●" : "○";
  if (typeof value === "number") {
    return new Intl.NumberFormat("et-EE").format(value);
  }
  return String(value);
}

// Get all unique fields across all models for a category
function getAllFieldsForCategory(
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

// Get all available categories from the models
function getAvailableCategories(allModels: Equipment[]): string[] {
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

export function DetailedSpecsTableRows({
  allModels,
  selectedModelId,
}: DetailedSpecsTableRowsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["mootor"])
  );
  const { data: specLabels = {} } = useSpecLabels();
  const inlineEdit = useInlineEdit({
    onSuccess: () => toast.success("Salvestatud"),
    onError: (error) => toast.error(`Viga: ${error.message}`),
  });

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const getLabel = (categoryKey: string, fieldKey: string, defaultLabel: string): string => {
    // Create a composite key for JSONB fields
    const compositeKey = `${categoryKey}_${fieldKey}`;
    return specLabels[compositeKey] || defaultLabel;
  };

  const handleLabelSave = (categoryKey: string, fieldKey: string) => {
    const compositeKey = `${categoryKey}_${fieldKey}`;
    inlineEdit.saveSpecLabel(compositeKey, inlineEdit.editValue);
  };

  const handleValueSave = (model: Equipment, categoryKey: string, fieldKey: string) => {
    inlineEdit.saveDetailedSpec(
      model.id,
      categoryKey,
      fieldKey,
      inlineEdit.editValue,
      model.detailed_specs as Record<string, unknown> | null
    );
  };

  const availableCategories = getAvailableCategories(allModels);

  if (availableCategories.length === 0) {
    return null;
  }

  return (
    <>
      {availableCategories.map((categoryKey) => {
        const isExpanded = expandedCategories.has(categoryKey);
        const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;
        const fields = getAllFieldsForCategory(allModels, categoryKey);
        const fieldNames = FIELD_NAMES[categoryKey] || {};

        return (
          <tr key={`category-wrapper-${categoryKey}`} style={{ display: 'contents' }}>
            <td colSpan={allModels.length + 1} style={{ display: 'contents' }}>
              {/* Category Header Row */}
              <tr
                key={`header-${categoryKey}`}
                className={cn(
                  "border-b border-border cursor-pointer transition-colors",
                  isExpanded ? "bg-primary/10" : "bg-muted/30 hover:bg-muted/50"
                )}
                onClick={() => toggleCategory(categoryKey)}
              >
                <td className="sticky left-0 z-10 p-3 text-sm font-semibold text-foreground bg-inherit border-r border-border">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={isExpanded ? "text-primary" : ""}>
                      {categoryName}
                    </span>
                  </div>
                </td>
                {allModels.map((model) => (
                  <td
                    key={model.id}
                    className={cn(
                      "p-3 text-center",
                      model.id === selectedModelId && "bg-primary/5"
                    )}
                  />
                ))}
              </tr>

              {/* Category Data Rows */}
              {isExpanded &&
                fields.map((fieldKey) => {
                  const defaultFieldName = fieldNames[fieldKey] || fieldKey.replace(/_/g, " ");
                  const fieldLabel = getLabel(categoryKey, fieldKey, defaultFieldName);
                  const labelCellId = `label-${categoryKey}-${fieldKey}`;

                  return (
                    <tr
                      key={`${categoryKey}-${fieldKey}`}
                      className="border-b border-border/30"
                    >
                      <td className="sticky left-0 z-10 bg-card p-3 pl-10 text-sm text-muted-foreground border-r border-border">
                        <EditableCell
                          value={fieldLabel}
                          cellId={labelCellId}
                          editingCell={inlineEdit.editingCell}
                          editValue={inlineEdit.editValue}
                          onStartEdit={inlineEdit.startEditing}
                          onValueChange={inlineEdit.setEditValue}
                          onSave={() => handleLabelSave(categoryKey, fieldKey)}
                          onCancel={inlineEdit.cancelEditing}
                          isLabel
                        />
                      </td>
                      {allModels.map((model) => {
                        const specs = model.detailed_specs;
                        const categoryData =
                          specs &&
                          typeof specs === "object" &&
                          specs[categoryKey]
                            ? (specs[categoryKey] as Record<string, unknown>)
                            : null;
                        const value = categoryData ? categoryData[fieldKey] : null;
                        const displayValue = formatValue(value);
                        const cellId = `${model.id}-${categoryKey}-${fieldKey}`;

                        return (
                          <td
                            key={model.id}
                            className={cn(
                              "p-3 text-center text-sm font-medium",
                              model.id === selectedModelId && "bg-primary/5"
                            )}
                          >
                            <EditableValueCell
                              displayValue={displayValue}
                              rawValue={value}
                              cellId={cellId}
                              editingCell={inlineEdit.editingCell}
                              editValue={inlineEdit.editValue}
                              onStartEdit={inlineEdit.startEditing}
                              onValueChange={inlineEdit.setEditValue}
                              onSave={() => handleValueSave(model, categoryKey, fieldKey)}
                              onCancel={inlineEdit.cancelEditing}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
            </td>
          </tr>
        );
      })}
    </>
  );
}
