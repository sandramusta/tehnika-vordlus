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

  // Filter to show allowed equipment types
  const allowedTypes = [
    "combine",
    "tractor",
    "forage_harvester",
    "wheel_loader",
    "telehandler",
    "self_propelled_sprayer",
    "trailed_sprayer",
    "round_baler"
  ];
  const filteredTypes = types?.filter((t) => allowedTypes.includes(t.name)) || [];

  // Filter models by selected type and brand
  const filteredModels = equipment.filter((model) => {
    if (selectedType !== "all" && model.equipment_type_id !== selectedType) return false;
    if (selectedBrand !== "all" && model.brand_id !== selectedBrand) return false;
    return true;
  });

  const isTypeSelected = selectedType !== "all";
  const isBrandSelected = selectedBrand !== "all";

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Tehnika tüüp</label>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[180px]">
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Bränd</label>
        <Select 
          value={selectedBrand} 
          onValueChange={onBrandChange}
          disabled={!isTypeSelected}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={isTypeSelected ? "Vali bränd" : "Vali esmalt tüüp"} />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Vali bränd...</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Mudel</label>
        <Select 
          value={selectedModel} 
          onValueChange={onModelChange}
          disabled={!isBrandSelected}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={isBrandSelected ? "Vali mudel" : "Vali esmalt bränd"} />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Vali mudel...</SelectItem>
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
