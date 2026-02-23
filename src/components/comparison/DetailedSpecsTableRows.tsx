import { useState } from "react";
import { Equipment } from "@/types/equipment";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditableCell, EditableValueCell } from "./EditableCell";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { useSpecLabels } from "@/hooks/useSpecLabels";
import { 
  formatFieldKey, 
  getCategoryOrderForType, 
  getCategoryNamesForType, 
  getFieldNamesForType 
} from "@/lib/pdfSpecsHelpers";
import { toast } from "sonner";

interface DetailedSpecsTableRowsProps {
  allModels: Equipment[];
  selectedModelId: string;
  equipmentTypeName?: string;
}



function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "●" : "○";
  if (typeof value === "number") {
    return new Intl.NumberFormat("et-EE").format(value);
  }
  return String(value);
}

// Get all unique fields across all models for a category, using type-specific field order
function getAllFieldsForCategoryDynamic(
  allModels: Equipment[],
  categoryKey: string,
  typeFieldNames: Record<string, Record<string, string>>
): string[] {
  const allFields = new Set<string>();
  
  allModels.forEach((model) => {
    const specs = model.detailed_specs;
    if (specs && typeof specs === "object" && specs[categoryKey]) {
      const categoryData = specs[categoryKey] as Record<string, unknown>;
      Object.keys(categoryData).forEach((key) => allFields.add(key));
    }
  });

  const fieldOrder = typeFieldNames[categoryKey];
  if (fieldOrder) {
    const orderedFields = Object.keys(fieldOrder).filter((f) => allFields.has(f));
    const remainingFields = Array.from(allFields).filter(
      (f) => !orderedFields.includes(f)
    );
    return [...orderedFields, ...remainingFields];
  }

  return Array.from(allFields);
}

// Get available categories from models, using type-specific category order
function getAvailableCategoriesDynamic(
  allModels: Equipment[],
  categoryOrder: readonly string[],
  forceAll: boolean = false
): string[] {
  if (forceAll) {
    return categoryOrder.slice();
  }

  const availableCategories = new Set<string>();

  allModels.forEach((model) => {
    const specs = model.detailed_specs;
    if (specs && typeof specs === "object") {
      Object.keys(specs).forEach((key) => {
        if ((categoryOrder as readonly string[]).includes(key)) {
          availableCategories.add(key);
        }
      });
    }
  });

  return categoryOrder.filter((cat) => availableCategories.has(cat));
}

export function DetailedSpecsTableRows({
  allModels,
  selectedModelId,
  equipmentTypeName,
}: DetailedSpecsTableRowsProps) {
  // For combines, always show all categories
  const isCombine = equipmentTypeName === "combine";
  const typeCategoryOrder = getCategoryOrderForType(equipmentTypeName);
  const typeCategoryNames = getCategoryNamesForType(equipmentTypeName);
  const typeFieldNames = getFieldNamesForType(equipmentTypeName);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([typeCategoryOrder[0] || "mootor"])
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

  const availableCategories = getAvailableCategoriesDynamic(allModels, typeCategoryOrder, isCombine);

  if (availableCategories.length === 0) {
    return null;
  }

  return (
    <>
      {availableCategories.map((categoryKey) => {
        const isExpanded = expandedCategories.has(categoryKey);
        const categoryName = typeCategoryNames[categoryKey] || categoryKey;
        const fields = getAllFieldsForCategoryDynamic(allModels, categoryKey, typeFieldNames);
        const fieldNames = typeFieldNames[categoryKey] || {};

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
                  const defaultFieldName = fieldNames[fieldKey] || formatFieldKey(fieldKey);
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
