import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Equipment } from "@/types/equipment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCategoryOrderForType,
  getCategoryNamesForType,
  getFieldNamesForType,
} from "@/lib/pdfSpecsHelpers";

interface DetailedSpecsEditorProps {
  equipment?: Equipment | null;
  initialSpecs?: Record<string, unknown>;
  onChange: (updatedSpecs: Record<string, unknown>) => void;
  equipmentTypeName?: string;
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
  
  // Check for boolean-like values
  if (value.toLowerCase() === "jah" || value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "ei" || value.toLowerCase() === "false") return false;
  
  // Try to parse as number
  const cleanValue = value.replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(cleanValue);
  if (!isNaN(parsed)) {
    return parsed;
  }
  
  return value;
}

export function DetailedSpecsEditor({ 
  equipment, 
  initialSpecs = {},
  onChange,
  equipmentTypeName,
}: DetailedSpecsEditorProps) {
  // Get dynamic categories and fields based on equipment type
  const categoryOrder = useMemo(() => getCategoryOrderForType(equipmentTypeName), [equipmentTypeName]);
  const categoryNames = useMemo(() => getCategoryNamesForType(equipmentTypeName), [equipmentTypeName]);
  const fieldNames = useMemo(() => getFieldNamesForType(equipmentTypeName), [equipmentTypeName]);

  // Track if this is the initial mount to avoid overwriting user edits
  const isInitialMount = useRef(true);
  const equipmentIdRef = useRef<string | null>(equipment?.id || null);
  
  // All categories expanded by default for Admin view
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categoryOrder)
  );

  // Update expanded categories when type changes
  useEffect(() => {
    setExpandedCategories(new Set(categoryOrder));
  }, [categoryOrder]);

  // Initialize specs from equipment or initialSpecs
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

  // Only sync with external data when equipment ID changes (switching to different equipment)
  useEffect(() => {
    const currentEquipmentId = equipment?.id || null;
    
    // If switching to a different equipment item, reset the specs
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

  const expandAll = () => {
    setExpandedCategories(new Set(categoryOrder));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Handle field changes - always allowed, no restrictions
  const handleFieldChange = useCallback(
    (categoryKey: string, fieldKey: string, value: string) => {
      const parsedValue = parseInputValue(value);
      
      setSpecs((prevSpecs) => {
        const existingCategory = prevSpecs[categoryKey] || {};
        const updatedSpecs = {
          ...prevSpecs,
          [categoryKey]: {
            ...existingCategory,
            [fieldKey]: parsedValue,
          },
        };
        // Notify parent of changes
        onChange(updatedSpecs);
        return updatedSpecs;
      });
    },
    [onChange]
  );

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
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-primary hover:underline"
          >
            Ava kõik
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-muted-foreground hover:underline"
          >
            Sulge kõik
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Admin: Kõik väljad on alati muudetavad. Muudatused salvestatakse vormi esitamisel.
      </p>
      
      <div className="border border-border rounded-lg overflow-hidden">
        {categoryOrder.map((categoryKey) => {
          const isExpanded = expandedCategories.has(categoryKey);
          const categoryName = categoryNames[categoryKey] || categoryKey;
          const categoryFieldNames = fieldNames[categoryKey] || {};
          const fields = Object.entries(categoryFieldNames);
          
          // Count filled fields for this category
          const filledCount = fields.filter(([fieldKey]) => {
            const val = specs[categoryKey]?.[fieldKey];
            return val !== null && val !== undefined && val !== "";
          }).length;

          return (
            <div key={categoryKey} className="border-b border-border last:border-b-0">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(categoryKey)}
                className={cn(
                  "w-full flex items-center gap-2 p-3 text-left transition-colors",
                  isExpanded ? "bg-primary/10" : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn("font-semibold text-sm", isExpanded && "text-primary")}>
                  {categoryName}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {filledCount}/{fields.length} täidetud
                </span>
              </button>

              {/* Category Fields - All fields are always editable */}
              {isExpanded && (
                <div className="p-4 bg-card space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {fields.map(([fieldKey, fieldLabel]) => {
                      const fieldValue = getFieldValue(categoryKey, fieldKey);
                      const hasValue = fieldValue !== "";
                      
                      return (
                        <div key={fieldKey} className="space-y-1">
                          <Label 
                            htmlFor={`${categoryKey}-${fieldKey}`} 
                            className={cn(
                              "text-xs",
                              hasValue ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {fieldLabel}
                          </Label>
                          <Input
                            id={`${categoryKey}-${fieldKey}`}
                            value={fieldValue}
                            onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value.replace(/,/g, "."))}
                            placeholder="—"
                            className={cn(
                              "h-8 text-sm",
                              hasValue && "border-primary/30 bg-primary/5"
                            )}
                            // No disabled, readOnly, or any other restrictions
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
