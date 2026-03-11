import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Equipment } from "@/types/equipment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Unlock, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCategoryOrderForType,
  getCategoryNamesForType,
  getFieldNamesForType,
  formatFieldKey,
  TRACTOR_TRANSMISSION_OPTIONS,
} from "@/lib/pdfSpecsHelpers";
import { useSpecLabels } from "@/hooks/useSpecLabels";

interface DetailedSpecsEditorProps {
  equipment?: Equipment | null;
  initialSpecs?: Record<string, unknown>;
  onChange: (updatedSpecs: Record<string, unknown>) => void;
  equipmentTypeName?: string;
  equipmentTypeId?: string;
}

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Jah" : "Ei";
  if (typeof value === "number") {
    return new Intl.NumberFormat("et-EE").format(value);
  }
  return String(value);
}

function parseInputValue(value: string): unknown {
  if (value === "" || value === "—") return null;
  if (value.toLowerCase() === "jah" || value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "ei" || value.toLowerCase() === "false") return false;
  const cleanValue = value.replace(/\s/g, "");
  // If multiple commas exist, treat as a multi-value string (e.g. "2400,3200,4000")
  const commaCount = (cleanValue.match(/,/g) || []).length;
  if (commaCount <= 1) {
    const numValue = cleanValue.replace(",", ".");
    const parsed = parseFloat(numValue);
    if (!isNaN(parsed)) return parsed;
  }
  return value;
}

function sanitizeKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[()\/\\]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

interface FieldInfo {
  key: string;
  label: string;
}

export function DetailedSpecsEditor({ 
  equipment, 
  initialSpecs = {},
  onChange,
  equipmentTypeName,
  equipmentTypeId,
}: DetailedSpecsEditorProps) {
  const categoryOrder = useMemo(() => getCategoryOrderForType(equipmentTypeName), [equipmentTypeName]);
  const categoryNames = useMemo(() => getCategoryNamesForType(equipmentTypeName), [equipmentTypeName]);
  const fieldNames = useMemo(() => getFieldNamesForType(equipmentTypeName), [equipmentTypeName]);
  const { data: specLabels = {} } = useSpecLabels();
  const queryClient = useQueryClient();

  const isInitialMount = useRef(true);
  const equipmentIdRef = useRef<string | null>(equipment?.id || null);
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categoryOrder)
  );
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState("");
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [addingNewCategory, setAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    setExpandedCategories(new Set(categoryOrder));
  }, [categoryOrder]);

  const getInitialSpecs = (): Record<string, Record<string, unknown>> => {
    if (equipment?.detailed_specs && typeof equipment.detailed_specs === 'object') {
      return equipment.detailed_specs as Record<string, Record<string, unknown>>;
    }
    if (initialSpecs && typeof initialSpecs === 'object' && Object.keys(initialSpecs).length > 0) {
      return initialSpecs as Record<string, Record<string, unknown>>;
    }
    return {};
  };

  const [specs, setSpecs] = useState<Record<string, Record<string, unknown>>>(getInitialSpecs);

  useEffect(() => {
    const currentEquipmentId = equipment?.id || null;
    if (currentEquipmentId !== equipmentIdRef.current) {
      equipmentIdRef.current = currentEquipmentId;
      if (equipment?.detailed_specs && typeof equipment.detailed_specs === 'object') {
        setSpecs(equipment.detailed_specs as Record<string, Record<string, unknown>>);
      } else if (initialSpecs && typeof initialSpecs === 'object' && Object.keys(initialSpecs).length > 0) {
        setSpecs(initialSpecs as Record<string, Record<string, unknown>>);
      } else {
        setSpecs({});
      }
    }
    isInitialMount.current = false;
  }, [equipment?.id, equipment?.detailed_specs, initialSpecs]);

  // Build merged field list: predefined + extra fields from actual data
  const allFieldsByCategory = useMemo(() => {
    const result: Record<string, FieldInfo[]> = {};
    
    // Process predefined categories
    categoryOrder.forEach(cat => {
      const predefined = fieldNames[cat] || {};
      const actualData = specs[cat] || {};
      const hiddenFields = new Set(
        Array.isArray(actualData.__hidden_fields) ? (actualData.__hidden_fields as string[]) : []
      );
      const fields: FieldInfo[] = [];
      
      // Predefined fields are visible by default unless explicitly hidden
      Object.entries(predefined).forEach(([key, label]) => {
        if (!hiddenFields.has(key)) {
          const compositeKey = `${cat}_${key}`;
          fields.push({ key, label: specLabels[compositeKey] || label });
        }
      });
      
      // Extra fields from actual data
      Object.keys(actualData).forEach(key => {
        if (key === "__hidden_fields") return;
        if (!predefined[key]) {
          const compositeKey = `${cat}_${key}`;
          fields.push({ key, label: specLabels[compositeKey] || formatFieldKey(key) });
        }
      });
      
      result[cat] = fields;
    });
    
    // Check for categories in specs not in predefined order
    Object.keys(specs).forEach(cat => {
      if (!result[cat]) {
        const actualData = specs[cat] || {};
        result[cat] = Object.keys(actualData).map(key => {
          const compositeKey = `${cat}_${key}`;
          return { key, label: specLabels[compositeKey] || formatFieldKey(key) };
        });
      }
    });
    
    return result;
  }, [categoryOrder, fieldNames, specs, specLabels]);

  // All category keys (predefined + extra from data)
  const allCategories = useMemo(() => {
    const cats = [...categoryOrder];
    Object.keys(specs).forEach(cat => {
      if (!cats.includes(cat)) cats.push(cat);
    });
    return cats;
  }, [categoryOrder, specs]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) next.delete(categoryKey);
      else next.add(categoryKey);
      return next;
    });
  };

  const expandAll = () => setExpandedCategories(new Set(allCategories));
  const collapseAll = () => setExpandedCategories(new Set());

  const handleFieldChange = useCallback(
    (categoryKey: string, fieldKey: string, value: string) => {
      // Store raw string in local state for display (allows comma input)
      setSpecs((prevSpecs) => {
        const existingCategory = prevSpecs[categoryKey] || {};
        const updatedSpecs = {
          ...prevSpecs,
          [categoryKey]: {
            ...existingCategory,
            [fieldKey]: value,
          },
        };
        // Send normalized/parsed value to parent for saving
        const normalizedSpecs = { ...updatedSpecs };
        const parsedValue = parseInputValue(value);
        normalizedSpecs[categoryKey] = {
          ...normalizedSpecs[categoryKey],
          [fieldKey]: parsedValue,
        };
        onChange(normalizedSpecs);
        return updatedSpecs;
      });
    },
    [onChange]
  );

  // Bulk update ALL equipment of same type (remove a field from all, INCLUDING current)
  const bulkRemoveField = useCallback(
    async (categoryKey: string, fieldKey: string) => {
      if (!equipmentTypeId) return;
      const isPredefinedField = Boolean(fieldNames[categoryKey]?.[fieldKey]);

      const { data: allEquip, error: fetchErr } = await supabase
        .from("equipment")
        .select("id, detailed_specs")
        .eq("equipment_type_id", equipmentTypeId);
      if (fetchErr || !allEquip) return;

      const updates = allEquip.map((e) => {
        const specs = { ...((e.detailed_specs as Record<string, Record<string, unknown>> | null) || {}) };
        const category = { ...(specs[categoryKey] || {}) };

        if (isPredefinedField) {
          const hiddenFields = new Set(
            Array.isArray(category.__hidden_fields) ? (category.__hidden_fields as string[]) : []
          );
          hiddenFields.add(fieldKey);
          delete category[fieldKey];
          category.__hidden_fields = Array.from(hiddenFields);
        } else {
          delete category[fieldKey];
        }

        specs[categoryKey] = category;
        return supabase.from("equipment").update({ detailed_specs: specs as unknown as Json }).eq("id", e.id);
      });

      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
    [equipmentTypeId, fieldNames, queryClient]
  );

  // Bulk update all equipment of same type (add a field to all)
  const bulkAddField = useCallback(
    async (categoryKey: string, fieldKey: string) => {
      if (!equipmentTypeId) return;
      const { data: allEquip, error: fetchErr } = await supabase
        .from("equipment")
        .select("id, detailed_specs")
        .eq("equipment_type_id", equipmentTypeId);
      if (fetchErr || !allEquip) return;

      const updates = allEquip
        .filter((e) => e.id !== equipment?.id)
        .map((e) => {
          const specs = { ...(e.detailed_specs as Record<string, Record<string, unknown>> || {}) };
          specs[categoryKey] = { ...(specs[categoryKey] || {}), [fieldKey]: null };
          return supabase.from("equipment").update({ detailed_specs: specs as unknown as Json }).eq("id", e.id);
        });
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
    [equipmentTypeId, equipment?.id, queryClient]
  );

  // Bulk remove category from all equipment of same type
  const bulkRemoveCategory = useCallback(
    async (categoryKey: string) => {
      if (!equipmentTypeId) return;
      const { data: allEquip, error: fetchErr } = await supabase
        .from("equipment")
        .select("id, detailed_specs")
        .eq("equipment_type_id", equipmentTypeId);
      if (fetchErr || !allEquip) return;

      const updates = allEquip
        .filter((e) => e.id !== equipment?.id)
        .filter((e) => {
          const specs = e.detailed_specs as Record<string, Record<string, unknown>> | null;
          return specs?.[categoryKey] !== undefined;
        })
        .map((e) => {
          const specs = { ...(e.detailed_specs as Record<string, Record<string, unknown>>) };
          delete specs[categoryKey];
          return supabase.from("equipment").update({ detailed_specs: specs as unknown as Json }).eq("id", e.id);
        });
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
    [equipmentTypeId, equipment?.id, queryClient]
  );

  // Bulk add category to all equipment of same type
  const bulkAddCategory = useCallback(
    async (categoryKey: string) => {
      if (!equipmentTypeId) return;
      const { data: allEquip, error: fetchErr } = await supabase
        .from("equipment")
        .select("id, detailed_specs")
        .eq("equipment_type_id", equipmentTypeId);
      if (fetchErr || !allEquip) return;

      const updates = allEquip
        .filter((e) => e.id !== equipment?.id)
        .filter((e) => {
          const specs = e.detailed_specs as Record<string, Record<string, unknown>> | null;
          return specs?.[categoryKey] === undefined;
        })
        .map((e) => {
          const specs = { ...(e.detailed_specs as Record<string, Record<string, unknown>> || {}) };
          specs[categoryKey] = {};
          return supabase.from("equipment").update({ detailed_specs: specs as unknown as Json }).eq("id", e.id);
        });
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
    [equipmentTypeId, equipment?.id, queryClient]
  );

  const handleDeleteField = useCallback(
    (categoryKey: string, fieldKey: string) => {
      const isPredefinedField = Boolean(fieldNames[categoryKey]?.[fieldKey]);

      setSpecs((prevSpecs) => {
        const existingCategory = { ...(prevSpecs[categoryKey] || {}) };

        if (isPredefinedField) {
          const hiddenFields = new Set(
            Array.isArray(existingCategory.__hidden_fields) ? (existingCategory.__hidden_fields as string[]) : []
          );
          hiddenFields.add(fieldKey);
          delete existingCategory[fieldKey];
          existingCategory.__hidden_fields = Array.from(hiddenFields);
        } else {
          delete existingCategory[fieldKey];
        }

        const updatedSpecs = {
          ...prevSpecs,
          [categoryKey]: existingCategory,
        };
        onChange(updatedSpecs);
        return updatedSpecs;
      });

      bulkRemoveField(categoryKey, fieldKey);
      toast.success("Näitaja eemaldatud kõikidelt selle tüübi masinatelt");
    },
    [fieldNames, onChange, bulkRemoveField]
  );

  const handleAddField = useCallback(
    (categoryKey: string) => {
      if (!newFieldName.trim()) return;
      const key = sanitizeKey(newFieldName);
      if (!key) {
        toast.error("Vigane näitaja nimi");
        return;
      }
      const existing = specs[categoryKey] || {};
      const predefined = fieldNames[categoryKey] || {};
      if (existing[key] !== undefined || predefined[key] !== undefined) {
        toast.error("See näitaja on juba olemas");
        return;
      }
      
      const compositeKey = `${categoryKey}_${key}`;
      const displayLabel = newFieldName.trim();
      supabase
        .from("spec_labels")
        .upsert({ spec_key: compositeKey, custom_label: displayLabel }, { onConflict: "spec_key" })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["spec-labels"] });
        });

      setSpecs((prevSpecs) => {
        const updatedSpecs = {
          ...prevSpecs,
          [categoryKey]: {
            ...(prevSpecs[categoryKey] || {}),
            [key]: null,
          },
        };
        onChange(updatedSpecs);
        return updatedSpecs;
      });
      // Bulk add to all equipment of same type
      bulkAddField(categoryKey, key);
      setNewFieldName("");
      setAddingToCategory(null);
      toast.success("Näitaja lisatud kõikidele selle tüübi masinatele");
    },
    [newFieldName, specs, fieldNames, onChange, queryClient, bulkAddField]
  );

  const handleSaveLabel = useCallback(
    async (categoryKey: string, fieldKey: string) => {
      const newLabel = editingLabelValue.trim();
      if (!newLabel) {
        setEditingLabel(null);
        return;
      }
      const compositeKey = `${categoryKey}_${fieldKey}`;
      const { error } = await supabase
        .from("spec_labels")
        .upsert({ spec_key: compositeKey, custom_label: newLabel }, { onConflict: "spec_key" });
      
      if (error) {
        toast.error("Viga nime salvestamisel");
      } else {
        toast.success("Nimetus salvestatud");
        queryClient.invalidateQueries({ queryKey: ["spec-labels"] });
      }
      setEditingLabel(null);
    },
    [editingLabelValue, queryClient]
  );

  // ---- Category management ----
  const getCategoryDisplayName = (categoryKey: string): string => {
    const labelKey = `cat_${categoryKey}`;
    return specLabels[labelKey] || categoryNames[categoryKey] || categoryKey;
  };

  const handleSaveCategoryName = useCallback(
    async (categoryKey: string) => {
      const newName = editingCategoryValue.trim();
      if (!newName) {
        setEditingCategoryName(null);
        return;
      }
      const labelKey = `cat_${categoryKey}`;
      const { error } = await supabase
        .from("spec_labels")
        .upsert({ spec_key: labelKey, custom_label: newName }, { onConflict: "spec_key" });
      if (error) {
        toast.error("Viga kategooria nime salvestamisel");
      } else {
        toast.success("Kategooria nimetus salvestatud");
        queryClient.invalidateQueries({ queryKey: ["spec-labels"] });
      }
      setEditingCategoryName(null);
    },
    [editingCategoryValue, queryClient]
  );

  const handleDeleteCategory = useCallback(
    (categoryKey: string) => {
      setSpecs((prevSpecs) => {
        const updatedSpecs = { ...prevSpecs };
        delete updatedSpecs[categoryKey];
        onChange(updatedSpecs);
        return updatedSpecs;
      });
      bulkRemoveCategory(categoryKey);
      toast.success("Kategooria eemaldatud kõikidelt selle tüübi masinatelt");
    },
    [onChange, bulkRemoveCategory]
  );

  const handleAddCategory = useCallback(() => {
    if (!newCategoryName.trim()) return;
    const key = sanitizeKey(newCategoryName);
    if (!key) {
      toast.error("Vigane kategooria nimi");
      return;
    }
    if (allCategories.includes(key)) {
      toast.error("See kategooria on juba olemas");
      return;
    }
    const labelKey = `cat_${key}`;
    const displayName = newCategoryName.trim().toUpperCase();
    supabase
      .from("spec_labels")
      .upsert({ spec_key: labelKey, custom_label: displayName }, { onConflict: "spec_key" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["spec-labels"] });
      });

    setSpecs((prevSpecs) => {
      const updatedSpecs = { ...prevSpecs, [key]: {} };
      onChange(updatedSpecs);
      return updatedSpecs;
    });
    bulkAddCategory(key);
    setExpandedCategories(prev => new Set([...prev, key]));
    setNewCategoryName("");
    setAddingNewCategory(false);
    toast.success("Kategooria lisatud kõikidele selle tüübi masinatele");
  }, [newCategoryName, allCategories, onChange, queryClient, bulkAddCategory]);

  const getFieldValue = (categoryKey: string, fieldKey: string): string => {
    const categoryData = specs[categoryKey];
    if (!categoryData) return "";
    const value = categoryData[fieldKey];
    return formatDisplayValue(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Unlock className="h-4 w-4 text-primary" />
          <Label className="text-base font-semibold">Detailsed spetsifikatsioonid</Label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={expandAll} className="text-xs text-primary hover:underline">
            Ava kõik
          </button>
          <span className="text-muted-foreground">|</span>
          <button type="button" onClick={collapseAll} className="text-xs text-muted-foreground hover:underline">
            Sulge kõik
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Kõik väljad on muudetavad. Nimetusi saab muuta pliiatsiikooni alt, näitajaid kustutada ja juurde lisada.
      </p>
      
      <div className="border border-border rounded-lg overflow-hidden">
        {allCategories.map((categoryKey) => {
          const isExpanded = expandedCategories.has(categoryKey);
          const categoryDisplayName = getCategoryDisplayName(categoryKey);
          const fields = allFieldsByCategory[categoryKey] || [];
          const isEditingThisCat = editingCategoryName === categoryKey;
          
          const filledCount = fields.filter(({ key }) => {
            const val = specs[categoryKey]?.[key];
            return val !== null && val !== undefined && val !== "";
          }).length;

          return (
            <div key={categoryKey} className="border-b border-border last:border-b-0">
              {/* Category header */}
              <div
                className={cn(
                  "flex items-center gap-2 p-3 transition-colors group",
                  isExpanded ? "bg-primary/10" : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                {isEditingThisCat ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingCategoryValue}
                      onChange={(e) => setEditingCategoryValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveCategoryName(categoryKey);
                        }
                        if (e.key === "Escape") setEditingCategoryName(null);
                      }}
                      className="h-7 text-sm font-semibold flex-1"
                      autoFocus
                    />
                    <button type="button" onClick={() => handleSaveCategoryName(categoryKey)} className="text-primary hover:text-primary/80">
                      <Check className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setEditingCategoryName(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryKey)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn("font-semibold text-sm", isExpanded && "text-primary")}>
                        {categoryDisplayName}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {filledCount}/{fields.length} täidetud
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategoryName(categoryKey);
                        setEditingCategoryValue(categoryDisplayName);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                      title="Muuda kategooria nimetust"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(categoryKey);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      title="Eemalda kategooria"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>

              {isExpanded && (
                <div className="p-4 bg-card space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(({ key: fieldKey, label: fieldLabel }) => {
                      const fieldValue = getFieldValue(categoryKey, fieldKey);
                      const hasValue = fieldValue !== "";
                      const cellId = `${categoryKey}-${fieldKey}`;
                      const isEditingThisLabel = editingLabel === cellId;
                      const isTransmissionSelect = categoryKey === "käigukast" && fieldKey === "tüüp" && equipmentTypeName?.toLowerCase().includes("tractor") && equipment?.brand?.is_primary === true;
                      
                      return (
                        <div key={fieldKey} className="space-y-1">
                          <div className="flex items-center gap-1 group">
                            {isEditingThisLabel ? (
                              <div className="flex items-center gap-1 flex-1">
                                <Input
                                  value={editingLabelValue}
                                  onChange={(e) => setEditingLabelValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSaveLabel(categoryKey, fieldKey);
                                    }
                                    if (e.key === "Escape") setEditingLabel(null);
                                  }}
                                  className="h-6 text-xs flex-1"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveLabel(categoryKey, fieldKey)}
                                  className="text-primary hover:text-primary/80"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingLabel(null)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Label 
                                  htmlFor={cellId}
                                  className={cn(
                                    "text-xs flex-1",
                                    hasValue ? "text-foreground" : "text-muted-foreground"
                                  )}
                                >
                                  {fieldLabel}
                                </Label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLabel(cellId);
                                    setEditingLabelValue(fieldLabel);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                                  title="Muuda nimetust"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(categoryKey, fieldKey)}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                  title="Eemalda näitaja"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                          {isTransmissionSelect ? (
                            <Select
                              value={fieldValue || undefined}
                              onValueChange={(val) => handleFieldChange(categoryKey, fieldKey, val)}
                            >
                              <SelectTrigger className={cn(
                                "h-8 text-sm",
                                hasValue && "border-primary/30 bg-primary/5"
                              )}>
                                <SelectValue placeholder="Vali käigukast" />
                              </SelectTrigger>
                              <SelectContent>
                                {TRACTOR_TRANSMISSION_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={cellId}
                              value={fieldValue}
                              onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
                              placeholder="—"
                              className={cn(
                                "h-8 text-sm",
                                hasValue && "border-primary/30 bg-primary/5"
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add new field */}
                  {addingToCategory === categoryKey ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Input
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddField(categoryKey);
                          }
                          if (e.key === "Escape") {
                            setAddingToCategory(null);
                            setNewFieldName("");
                          }
                        }}
                        placeholder="Näitaja nimetus, nt 'Paagi maht (l)'"
                        className="h-8 text-sm flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="h-8 px-3"
                        onClick={() => handleAddField(categoryKey)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Lisa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => {
                          setAddingToCategory(null);
                          setNewFieldName("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingToCategory(categoryKey);
                        setNewFieldName("");
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 pt-2 border-t border-border/50"
                    >
                      <Plus className="h-3 w-3" />
                      Lisa näitaja
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add new category */}
        {addingNewCategory ? (
          <div className="flex items-center gap-2 p-3 bg-muted/20">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCategory();
                }
                if (e.key === "Escape") {
                  setAddingNewCategory(false);
                  setNewCategoryName("");
                }
              }}
              placeholder="Kategooria nimetus, nt 'Hüdraulika'"
              className="h-8 text-sm flex-1"
              autoFocus
            />
            <Button type="button" size="sm" variant="default" className="h-8 px-3" onClick={handleAddCategory}>
              <Check className="h-3 w-3 mr-1" />
              Lisa
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => { setAddingNewCategory(false); setNewCategoryName(""); }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setAddingNewCategory(true); setNewCategoryName(""); }}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 p-3 w-full"
          >
            <Plus className="h-3.5 w-3.5" />
            Lisa kategooria
          </button>
        )}
      </div>
    </div>
  );
}
