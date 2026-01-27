import { useState, useCallback } from "react";
import { Equipment } from "@/types/equipment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ORDER,
  CATEGORY_NAMES,
  FIELD_NAMES,
} from "@/lib/pdfSpecsHelpers";

interface DetailedSpecsEditorProps {
  equipment: Equipment;
  onChange: (updatedSpecs: Record<string, unknown>) => void;
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

export function DetailedSpecsEditor({ equipment, onChange }: DetailedSpecsEditorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["mootor"])
  );

  const specs = (equipment.detailed_specs as Record<string, Record<string, unknown>>) || {};

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

  const handleFieldChange = useCallback(
    (categoryKey: string, fieldKey: string, value: string) => {
      const parsedValue = parseInputValue(value);
      const existingCategory = specs[categoryKey] || {};
      
      const updatedSpecs = {
        ...specs,
        [categoryKey]: {
          ...existingCategory,
          [fieldKey]: parsedValue,
        },
      };
      
      onChange(updatedSpecs);
    },
    [specs, onChange]
  );

  const getFieldValue = (categoryKey: string, fieldKey: string): string => {
    const categoryData = specs[categoryKey];
    if (!categoryData) return "";
    const value = categoryData[fieldKey];
    return formatDisplayValue(value);
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-semibold">Detailsed spetsifikatsioonid</Label>
      <p className="text-xs text-muted-foreground mb-3">
        Need väljad kuvatakse võrdlustabelis kategooriate kaupa.
      </p>
      
      <div className="border border-border rounded-lg overflow-hidden">
        {CATEGORY_ORDER.map((categoryKey) => {
          const isExpanded = expandedCategories.has(categoryKey);
          const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;
          const fieldNames = FIELD_NAMES[categoryKey] || {};
          const fields = Object.entries(fieldNames);

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
                  {fields.length} välja
                </span>
              </button>

              {/* Category Fields */}
              {isExpanded && (
                <div className="p-4 bg-card space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {fields.map(([fieldKey, fieldLabel]) => (
                      <div key={fieldKey} className="space-y-1">
                        <Label htmlFor={`${categoryKey}-${fieldKey}`} className="text-xs">
                          {fieldLabel}
                        </Label>
                        <Input
                          id={`${categoryKey}-${fieldKey}`}
                          value={getFieldValue(categoryKey, fieldKey)}
                          onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
                          placeholder="—"
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
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
