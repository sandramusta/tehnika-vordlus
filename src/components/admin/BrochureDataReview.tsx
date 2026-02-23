import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, ChevronDown, ChevronRight, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Equipment } from "@/types/equipment";
import type { ExtractedData, ExtractionMetadata } from "./BrochureUpload";
import { getFieldsForEquipmentType } from "@/lib/equipmentTypeFields";
import { getCategoryOrderForType, getCategoryNamesForType, getFieldNamesForType } from "@/lib/pdfSpecsHelpers";
import { getColumnToSpecsMapping, getSpecsToColumnMapping } from "@/lib/fieldSyncMapping";

interface BrochureDataReviewProps {
  equipment: Equipment;
  extractedData: ExtractedData;
  onConfirm: (data: ExtractedData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Fields that cannot come from brochures (economic data entered manually)
const EXCLUDED_FIELDS = new Set(["price_eur", "annual_maintenance_eur", "expected_lifespan_years"]);

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
  const equipmentTypeName = equipment.equipment_type?.name || "combine";

  // Build allowed column keys and labels from equipmentTypeFields.ts
  const { allowedColumnKeys, columnLabels } = useMemo(() => {
    const fieldGroups = getFieldsForEquipmentType(equipmentTypeName);
    const keys = new Set<string>();
    const labels: Record<string, string> = {};
    for (const group of fieldGroups) {
      for (const field of group.fields) {
        if (!EXCLUDED_FIELDS.has(field.name)) {
          keys.add(field.name);
          labels[field.name] = field.label;
        }
      }
    }
    return { allowedColumnKeys: keys, columnLabels: labels };
  }, [equipmentTypeName]);

  // Build allowed detailed_specs categories/fields from pdfSpecsHelpers.ts
  const { allowedCategories, categoryLabels, fieldLabels } = useMemo(() => {
    const catOrder = getCategoryOrderForType(equipmentTypeName);
    const catNames = getCategoryNamesForType(equipmentTypeName);
    const fieldNames = getFieldNamesForType(equipmentTypeName);
    return {
      allowedCategories: new Set(catOrder),
      categoryLabels: catNames,
      fieldLabels: fieldNames,
    };
  }, [equipmentTypeName]);

  // Sync mappings
  const columnToSpecs = useMemo(() => getColumnToSpecsMapping(equipmentTypeName), [equipmentTypeName]);
  const specsToColumn = useMemo(() => getSpecsToColumnMapping(equipmentTypeName), [equipmentTypeName]);

  // Filter extracted data to only allowed fields, filling missing with null.
  // RULE: If a field already has a value on the equipment, keep it (don't overwrite).
  // Only fill fields that are currently empty/null.
  const filteredData = useMemo(() => {
    // Filter equipment_columns
    const filteredColumns: Record<string, unknown> = {};
    for (const key of allowedColumnKeys) {
      const currentVal = getCurrentValue(equipment, key);
      const extractedVal = extractedData.equipment_columns?.[key] ?? null;
      // If current value exists, keep it; otherwise use extracted
      const hasCurrentValue = currentVal !== null && currentVal !== undefined && currentVal !== "" && currentVal !== 0;
      filteredColumns[key] = hasCurrentValue ? currentVal : extractedVal;
    }

    // Filter detailed_specs
    const filteredSpecs: Record<string, Record<string, unknown>> = {};
    for (const catKey of allowedCategories) {
      const allowedFields = fieldLabels[catKey];
      if (!allowedFields) continue;
      filteredSpecs[catKey] = {};
      for (const fieldKey of Object.keys(allowedFields)) {
        const currentVal = getDetailedSpecValue(equipment, catKey, fieldKey);
        const extractedCat = extractedData.detailed_specs?.[catKey] as Record<string, unknown> | undefined;
        const extractedVal = extractedCat?.[fieldKey] ?? null;
        // If current value exists, keep it; otherwise use extracted
        const hasCurrentValue = currentVal !== null && currentVal !== undefined && currentVal !== "" && currentVal !== 0;
        filteredSpecs[catKey][fieldKey] = hasCurrentValue ? currentVal : extractedVal;
      }
    }

    return {
      equipment_columns: filteredColumns,
      detailed_specs: filteredSpecs,
      extraction_metadata: extractedData.extraction_metadata,
    } as ExtractedData;
  }, [extractedData, allowedColumnKeys, allowedCategories, fieldLabels, equipment]);

  const [editedData, setEditedData] = useState<ExtractedData>(filteredData);
  const metadata: ExtractionMetadata | undefined = extractedData.extraction_metadata;
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["equipment_columns", ...Array.from(allowedCategories).slice(0, 1)])
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
    const normalized = value.replace(/,/g, ".");
    const parsed = normalized === "" ? null : isNaN(Number(normalized)) ? normalized : Number(normalized);
    setEditedData((prev) => {
      const updated = {
        ...prev,
        equipment_columns: {
          ...prev.equipment_columns,
          [key]: parsed,
        },
      };
      // Sync to detailed_specs if mapping exists
      const loc = columnToSpecs[key];
      if (loc) {
        updated.detailed_specs = {
          ...updated.detailed_specs,
          [loc.category]: {
            ...((updated.detailed_specs?.[loc.category] as Record<string, unknown>) || {}),
            [loc.field]: parsed,
          },
        };
      }
      return updated;
    });
  };

  const updateDetailedSpecValue = (category: string, field: string, value: string) => {
    const normalized = value.replace(/,/g, ".");
    const parsed = normalized === "" ? null : isNaN(Number(normalized)) ? normalized : Number(normalized);
    setEditedData((prev) => {
      const updated = {
        ...prev,
        detailed_specs: {
          ...prev.detailed_specs,
          [category]: {
            ...(prev.detailed_specs?.[category] || {}),
            [field]: parsed,
          },
        },
      };
      // Sync to equipment_columns if mapping exists
      const colKey = `${category}.${field}`;
      const columnName = specsToColumn[colKey];
      if (columnName && columnName in (updated.equipment_columns || {})) {
        updated.equipment_columns = {
          ...updated.equipment_columns,
          [columnName]: parsed,
        };
      }
      return updated;
    });
  };

  // Count extracted vs empty values
  const stats = useMemo(() => {
    let extracted = 0;
    let empty = 0;

    Object.values(editedData.equipment_columns || {}).forEach((val) => {
      if (val !== null && val !== undefined && val !== "") {
        extracted++;
      } else {
        empty++;
      }
    });

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

  // Get ordered category keys for display
  const orderedCategoryKeys = useMemo(() => {
    return Array.from(getCategoryOrderForType(equipmentTypeName));
  }, [equipmentTypeName]);

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
            {metadata && (
              <Badge
                variant="outline"
                className={cn(
                  metadata.confidence === "high" && "bg-green-100 text-green-700 border-green-300",
                  metadata.confidence === "medium" && "bg-amber-100 text-amber-700 border-amber-300",
                  metadata.confidence === "low" && "bg-red-100 text-red-700 border-red-300",
                )}
              >
                {metadata.confidence === "high" ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                {metadata.confidence === "high" ? "Kõrge kindlus" : metadata.confidence === "medium" ? "Keskmine kindlus" : "Madal kindlus"}
              </Badge>
            )}
            <Badge variant="outline" className="bg-green-100 text-green-700">
              {stats.extracted} leitud
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              {stats.empty} puudu
            </Badge>
          </div>
        </div>

        {/* Extraction metadata info */}
        {metadata && (
          <div className="mt-3 space-y-2">
            {metadata.models_found && metadata.models_found.length > 1 && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2 text-sm">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Brošüürist tuvastati {metadata.models_found.length} mudelit: </span>
                  <span className="text-blue-600 dark:text-blue-400">{metadata.models_found.join(", ")}</span>
                </div>
              </div>
            )}

            {!metadata.target_model_found && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-red-700 dark:text-red-300 font-medium">
                  Sihtmudelit ei leitud brošüürist otse — kontrolli andmeid hoolikalt!
                </span>
              </div>
            )}

            {metadata.warnings && metadata.warnings.length > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  {metadata.warnings.map((warning, i) => (
                    <p key={i} className="text-amber-700 dark:text-amber-300">{warning}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
                  if (!allowedColumnKeys.has(key)) return null;
                  const currentValue = getCurrentValue(equipment, key);
                  const hasValue = value !== null && value !== undefined && value !== "";
                  const isDifferent = hasValue && currentValue !== value;

                  return (
                    <div key={key} className="space-y-1">
                      <Label
                        htmlFor={`col-${key}`}
                        className="flex items-center gap-1 text-xs"
                      >
                        <span>{columnLabels[key] || key}</span>
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

        {/* Detailed Specs Categories - ordered by pdfSpecsHelpers */}
        {orderedCategoryKeys.map((categoryKey) => {
          const categoryData = editedData.detailed_specs?.[categoryKey] as Record<string, unknown> | undefined;
          if (!categoryData) return null;
          const allowedFields = fieldLabels[categoryKey];
          if (!allowedFields) return null;

          return (
            <div key={categoryKey} className="rounded-lg border bg-card">
              <button
                type="button"
                className="flex w-full items-center justify-between p-3 text-left font-semibold hover:bg-muted/50"
                onClick={() => toggleCategory(categoryKey)}
              >
                <span>{categoryLabels[categoryKey] || categoryKey}</span>
                {expandedCategories.has(categoryKey) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {expandedCategories.has(categoryKey) && (
                <div className="border-t p-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(allowedFields).map(([field, fieldLabel]) => {
                      const value = categoryData[field] ?? null;
                      const currentValue = getDetailedSpecValue(equipment, categoryKey, field);
                      const hasValue = value !== null && value !== undefined && value !== "";
                      const isDifferent = hasValue && currentValue !== value;

                      return (
                        <div key={`${categoryKey}-${field}`} className="space-y-1">
                          <Label
                            htmlFor={`spec-${categoryKey}-${field}`}
                            className="flex items-center gap-1 text-xs"
                          >
                            <span>{fieldLabel}</span>
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
