import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Equipment } from "@/types/equipment";
import type { ExtractedData } from "./BrochureUpload";

interface BrochureDataReviewProps {
  equipment: Equipment;
  extractedData: ExtractedData;
  onConfirm: (data: ExtractedData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Field labels for equipment columns
const COLUMN_LABELS: Record<string, string> = {
  engine_power_hp: "Mootori võimsus (hj)",
  engine_displacement_liters: "Mootori töömaht (l)",
  engine_cylinders: "Silindrite arv",
  max_torque_nm: "Max pöördemoment (Nm)",
  fuel_tank_liters: "Kütusepaagi maht (l)",
  grain_tank_liters: "Viljabunkri maht (l)",
  unloading_rate_ls: "Tühjenduskiirus (l/s)",
  auger_reach_m: "Tigu ulatus (m)",
  cleaning_area_m2: "Puhastusala (m²)",
  sieve_area_m2: "Sõelapind (m²)",
  rotor_diameter_mm: "Rootori läbimõõt (mm)",
  rotor_length_mm: "Rootori pikkus (mm)",
  separator_area_m2: "Separaatori pind (m²)",
  feeder_width_mm: "Etteande laius (mm)",
  threshing_drum_diameter_mm: "Pekstrulli läbimõõt (mm)",
  threshing_drum_width_mm: "Pekstrulli laius (mm)",
  threshing_area_m2: "Pekspind (m²)",
  weight_kg: "Kaal (kg)",
  transport_width_mm: "Transpordi laius (mm)",
  transport_height_mm: "Transpordi kõrgus (mm)",
  header_width_min_m: "Heedri laius min (m)",
  header_width_max_m: "Heedri laius max (m)",
  max_slope_percent: "Max nõlv (%)",
  throughput_tons_h: "Läbilaskevõime (t/h)",
  straw_walker_count: "Õlgkõndijate arv",
  straw_walker_area_m2: "Õlgkõndijate pind (m²)",
  chopper_width_mm: "Hekseldi laius (mm)",
  rasp_bar_count: "Raspi latide arv",
};

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
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

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Jah" : "Ei";
  if (typeof value === "number") {
    return new Intl.NumberFormat("et-EE").format(value);
  }
  return String(value);
}

function getCurrentValue(equipment: Equipment, key: string): unknown {
  const eqKey = key as keyof Equipment;
  return equipment[eqKey] ?? null;
}

function getDetailedSpecValue(equipment: Equipment, category: string, field: string): unknown {
  const specs = equipment.detailed_specs as Record<string, Record<string, unknown>> | null;
  if (!specs || !specs[category]) return null;
  return specs[category][field] ?? null;
}

export function BrochureDataReview({
  equipment,
  extractedData,
  onConfirm,
  onCancel,
  isLoading = false,
}: BrochureDataReviewProps) {
  const [editedData, setEditedData] = useState<ExtractedData>(extractedData);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["equipment_columns", "mootor"])
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const updateColumnValue = (key: string, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      equipment_columns: {
        ...prev.equipment_columns,
        [key]: value === "" ? null : isNaN(Number(value)) ? value : Number(value),
      },
    }));
  };

  const updateDetailedSpecValue = (category: string, field: string, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      detailed_specs: {
        ...prev.detailed_specs,
        [category]: {
          ...(prev.detailed_specs?.[category] || {}),
          [field]: value === "" ? null : isNaN(Number(value)) ? value : Number(value),
        },
      },
    }));
  };

  // Count extracted vs empty values
  const stats = useMemo(() => {
    let extracted = 0;
    let empty = 0;

    // Count equipment columns
    Object.values(editedData.equipment_columns || {}).forEach((val) => {
      if (val !== null && val !== undefined && val !== "") {
        extracted++;
      } else {
        empty++;
      }
    });

    // Count detailed specs
    Object.values(editedData.detailed_specs || {}).forEach((category) => {
      if (typeof category === "object" && category !== null) {
        Object.values(category).forEach((val) => {
          if (val !== null && val !== undefined && val !== "") {
            extracted++;
          } else {
            empty++;
          }
        });
      }
    });

    return { extracted, empty, total: extracted + empty };
  }, [editedData]);

  const handleConfirm = async () => {
    await onConfirm(editedData);
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ekstraheeritud andmete ülevaatus
            </CardTitle>
            <CardDescription className="mt-1">
              Vaata üle ja paranda ekstraheeritud andmed enne salvestamist
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-700">
              {stats.extracted} leitud
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              {stats.empty} puudu
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Equipment Columns Section */}
        <div className="rounded-lg border bg-card">
          <button
            type="button"
            className="flex w-full items-center justify-between p-3 text-left font-semibold hover:bg-muted/50"
            onClick={() => toggleCategory("equipment_columns")}
          >
            <span>Põhinäitajad</span>
            {expandedCategories.has("equipment_columns") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {expandedCategories.has("equipment_columns") && (
            <div className="border-t p-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(editedData.equipment_columns || {}).map(([key, value]) => {
                  const currentValue = getCurrentValue(equipment, key);
                  const hasValue = value !== null && value !== undefined && value !== "";
                  const isDifferent = hasValue && currentValue !== value;

                  return (
                    <div key={key} className="space-y-1">
                      <Label
                        htmlFor={`col-${key}`}
                        className="flex items-center gap-1 text-xs"
                      >
                        <span>{COLUMN_LABELS[key] || key}</span>
                        {hasValue ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`col-${key}`}
                          value={value === null || value === undefined ? "" : String(value)}
                          onChange={(e) => updateColumnValue(key, e.target.value)}
                          className={cn(
                            "h-8 text-sm",
                            hasValue && "border-green-300 bg-green-50 dark:bg-green-950/20",
                            isDifferent && "ring-1 ring-amber-400"
                          )}
                          placeholder="—"
                        />
                      </div>
                      {isDifferent && (
                        <p className="text-xs text-muted-foreground">
                          Praegune: {formatValue(currentValue)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Specs Categories */}
        {Object.entries(editedData.detailed_specs || {}).map(([categoryKey, categoryData]) => {
          if (!categoryData || typeof categoryData !== "object") return null;

          return (
            <div key={categoryKey} className="rounded-lg border bg-card">
              <button
                type="button"
                className="flex w-full items-center justify-between p-3 text-left font-semibold hover:bg-muted/50"
                onClick={() => toggleCategory(categoryKey)}
              >
                <span>{CATEGORY_LABELS[categoryKey] || categoryKey}</span>
                {expandedCategories.has(categoryKey) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {expandedCategories.has(categoryKey) && (
                <div className="border-t p-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(categoryData as Record<string, unknown>).map(([field, value]) => {
                      const currentValue = getDetailedSpecValue(equipment, categoryKey, field);
                      const hasValue = value !== null && value !== undefined && value !== "";
                      const isDifferent = hasValue && currentValue !== value;

                      return (
                        <div key={`${categoryKey}-${field}`} className="space-y-1">
                          <Label
                            htmlFor={`spec-${categoryKey}-${field}`}
                            className="flex items-center gap-1 text-xs"
                          >
                            <span>{field.replace(/_/g, " ")}</span>
                            {hasValue ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <X className="h-3 w-3 text-muted-foreground" />
                            )}
                          </Label>
                          <Input
                            id={`spec-${categoryKey}-${field}`}
                            value={value === null || value === undefined ? "" : String(value)}
                            onChange={(e) =>
                              updateDetailedSpecValue(categoryKey, field, e.target.value)
                            }
                            className={cn(
                              "h-8 text-sm",
                              hasValue && "border-green-300 bg-green-50 dark:bg-green-950/20",
                              isDifferent && "ring-1 ring-amber-400"
                            )}
                            placeholder="—"
                          />
                          {isDifferent && (
                            <p className="text-xs text-muted-foreground">
                              Praegune: {formatValue(currentValue)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Tühista
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Salvestan...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Kinnita ja salvesta ({stats.extracted} väärtust)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
