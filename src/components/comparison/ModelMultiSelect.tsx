import { useState, useMemo, useEffect } from "react";
import { Equipment, EquipmentType } from "@/types/equipment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrands, useEquipmentTypes } from "@/hooks/useEquipmentData";

interface ModelMultiSelectProps {
  selectedType: string;
  selectedModels: Equipment[];
  onTypeChange: (value: string) => void;
  onModelsChange: (models: Equipment[]) => void;
  equipment: Equipment[];
  maxModels?: number;
}

const allowedTypes = [
  "combine",
  "tractor",
  "forage_harvester",
  "telehandler",
  "self_propelled_sprayer",
  "trailed_sprayer",
  "round_baler"
];

export function ModelMultiSelect({
  selectedType,
  selectedModels,
  onTypeChange,
  onModelsChange,
  equipment,
  maxModels = 3,
}: ModelMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [categoryChangeAlert, setCategoryChangeAlert] = useState(false);
  const [previousType, setPreviousType] = useState(selectedType);

  const { data: types } = useEquipmentTypes();
  const { data: brands } = useBrands();

  const filteredTypes = types?.filter((t) => allowedTypes.includes(t.name)) || [];

  // Filter equipment by selected type
  const availableModels = useMemo(() => {
    if (selectedType === "all") return [];
    return equipment.filter((model) => model.equipment_type_id === selectedType);
  }, [equipment, selectedType]);

  // Group models by brand for display
  const modelsByBrand = useMemo(() => {
    const grouped: Record<string, Equipment[]> = {};
    availableModels.forEach((model) => {
      const brandName = model.brand?.name || "Unknown";
      if (!grouped[brandName]) {
        grouped[brandName] = [];
      }
      grouped[brandName].push(model);
    });
    return grouped;
  }, [availableModels]);

  // Handle type change - clear selections
  const handleTypeChange = (value: string) => {
    if (value !== selectedType && selectedModels.length > 0) {
      setCategoryChangeAlert(true);
      setPreviousType(selectedType);
    }
    onTypeChange(value);
    onModelsChange([]);
    
    // Auto-hide alert after 3 seconds
    setTimeout(() => setCategoryChangeAlert(false), 3000);
  };

  // Toggle model selection
  const toggleModel = (model: Equipment) => {
    const isSelected = selectedModels.some((m) => m.id === model.id);
    
    if (isSelected) {
      onModelsChange(selectedModels.filter((m) => m.id !== model.id));
    } else {
      if (selectedModels.length < maxModels) {
        onModelsChange([...selectedModels, model]);
      }
    }
  };

  // Remove model from selection
  const removeModel = (modelId: string) => {
    onModelsChange(selectedModels.filter((m) => m.id !== modelId));
  };

  const isTypeSelected = selectedType !== "all";
  const selectedTypeName = filteredTypes.find((t) => t.id === selectedType)?.name_et || "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        {/* Type Selector */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-sm font-medium text-muted-foreground">Tehnika tüüp</label>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Vali tüüp" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Vali tüüp...</SelectItem>
              {filteredTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name_et}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Multi-Select */}
        <div className="flex flex-col gap-1.5 w-full sm:flex-1 sm:min-w-[300px]">
          <label className="text-sm font-medium text-muted-foreground">
            Mudelid võrdluseks (max {maxModels})
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={!isTypeSelected}
                className={cn(
                  "w-full justify-between h-auto min-h-10 px-3 py-2",
                  !isTypeSelected && "text-muted-foreground"
                )}
              >
                {!isTypeSelected ? (
                  "Vali esmalt tehnika tüüp"
                ) : selectedModels.length === 0 ? (
                  "Vali 1–3 mudelit võrdluseks..."
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedModels.map((model) => (
                      <Badge
                        key={model.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <span className={cn(
                          "font-medium",
                          model.brand?.name === "John Deere" && "text-john-deere",
                          model.brand?.name === "Claas" && "text-claas",
                          model.brand?.name === "Case IH" && "text-case-ih",
                          model.brand?.name === "New Holland" && "text-new-holland",
                          model.brand?.name === "Fendt" && "text-fendt"
                        )}>
                          {model.brand?.name}
                        </span>
                        {model.model_name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeModel(model.id);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-popover" align="start">
              <div className="max-h-[400px] overflow-auto p-2">
                {selectedModels.length >= maxModels && (
                  <div className="mb-2 p-2 rounded-md bg-muted text-sm text-muted-foreground">
                    Maksimaalselt {maxModels} mudelit valitud
                  </div>
                )}
                {Object.entries(modelsByBrand).map(([brandName, models]) => (
                  <div key={brandName} className="mb-3">
                    <div className={cn(
                      "text-sm font-semibold px-2 py-1 rounded-t-md bg-muted/50",
                      brandName === "John Deere" && "text-john-deere",
                      brandName === "Claas" && "text-claas",
                      brandName === "Case IH" && "text-case-ih",
                      brandName === "New Holland" && "text-new-holland",
                      brandName === "Fendt" && "text-fendt"
                    )}>
                      {brandName}
                    </div>
                    <div className="space-y-1 pt-1">
                      {models.map((model) => {
                        const isSelected = selectedModels.some((m) => m.id === model.id);
                        const isDisabled = !isSelected && selectedModels.length >= maxModels;
                        
                        return (
                          <div
                            key={model.id}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/70",
                              isSelected && "bg-primary/10",
                              isDisabled && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => !isDisabled && toggleModel(model)}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={() => !isDisabled && toggleModel(model)}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{model.model_name}</div>
                              {model.engine_power_hp && (
                                <div className="text-xs text-muted-foreground">
                                  {model.engine_power_hp} hj
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {availableModels.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Selles kategoorias mudeleid ei leitud
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Category change alert */}
      {categoryChangeAlert && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-warning/10 border border-warning/20 text-sm text-warning-foreground">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span>
            Kategooria vahetamisel eelmised valikud tühjendati. Vali uued mudelid võrdluseks.
          </span>
        </div>
      )}

      {/* Selection status */}
      {isTypeSelected && selectedModels.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Vali vähemalt 1 mudel, et näha võrdlustabelit
        </div>
      )}
    </div>
  );
}
