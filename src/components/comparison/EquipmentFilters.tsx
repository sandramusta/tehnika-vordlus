import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrands, useEquipmentTypes } from "@/hooks/useEquipmentData";
import { Equipment } from "@/types/equipment";

interface EquipmentFiltersProps {
  selectedType: string;
  selectedBrand: string;
  selectedModel: string;
  onTypeChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  equipment: Equipment[];
}

export function EquipmentFilters({
  selectedType,
  selectedBrand,
  selectedModel,
  onTypeChange,
  onBrandChange,
  onModelChange,
  equipment,
}: EquipmentFiltersProps) {
  const { data: types } = useEquipmentTypes();
  const { data: brands } = useBrands();

  // Filter to show only combine, sprayer, tractor types
  const allowedTypes = ["combine", "sprayer", "tractor"];
  const filteredTypes = types?.filter((t) => allowedTypes.includes(t.name)) || [];

  // Check if selections are made (not "all" or empty)
  const isTypeSelected = selectedType !== "all" && selectedType !== "";
  const isBrandSelected = selectedBrand !== "all" && selectedBrand !== "";

  // Filter models by selected type and brand - only show when both are selected
  const filteredModels = equipment.filter((model) => {
    if (!isTypeSelected || model.equipment_type_id !== selectedType) return false;
    if (!isBrandSelected || model.brand_id !== selectedBrand) return false;
    return true;
  });

  return (
    <div className="flex flex-wrap gap-4">
      {/* Step 1: Equipment Type - always enabled */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          1. Tehnika tüüp <span className="text-destructive">*</span>
        </label>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vali tüüp..." />
          </SelectTrigger>
          <SelectContent>
            {filteredTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name_et}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Brand - enabled only after type is selected */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          2. Bränd <span className="text-destructive">*</span>
        </label>
        <Select 
          value={selectedBrand} 
          onValueChange={onBrandChange}
          disabled={!isTypeSelected}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={isTypeSelected ? "Vali bränd..." : "Vali esmalt tüüp"} />
          </SelectTrigger>
          <SelectContent>
            {brands?.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 3: Model - enabled only after brand is selected */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          3. Mudel <span className="text-destructive">*</span>
        </label>
        <Select 
          value={selectedModel} 
          onValueChange={onModelChange}
          disabled={!isBrandSelected}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={isBrandSelected ? "Vali mudel..." : "Vali esmalt bränd"} />
          </SelectTrigger>
          <SelectContent>
            {filteredModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.model_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
