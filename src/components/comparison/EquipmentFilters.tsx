import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrands, usePowerClasses, useEquipmentTypes, useEquipment } from "@/hooks/useEquipmentData";
import { Equipment } from "@/types/equipment";

interface EquipmentFiltersProps {
  selectedType: string;
  selectedBrand: string;
  selectedPowerClass: string;
  selectedModel: string;
  onTypeChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onPowerClassChange: (value: string) => void;
  onModelChange: (value: string) => void;
  equipment: Equipment[];
}

export function EquipmentFilters({
  selectedType,
  selectedBrand,
  selectedPowerClass,
  selectedModel,
  onTypeChange,
  onBrandChange,
  onPowerClassChange,
  onModelChange,
  equipment,
}: EquipmentFiltersProps) {
  const { data: types } = useEquipmentTypes();
  const { data: brands } = useBrands();
  const { data: powerClasses } = usePowerClasses();

  // Filter to show only combine, sprayer, tractor types
  const allowedTypes = ["combine", "sprayer", "tractor"];
  const filteredTypes = types?.filter((t) => allowedTypes.includes(t.name)) || [];

  // Get John Deere models for model filter
  const johnDeereBrand = brands?.find((b) => b.name === "John Deere");
  const johnDeereModels = equipment.filter(
    (e) => e.brand_id === johnDeereBrand?.id
  );

  // Filter models by selected type and power class
  const filteredModels = johnDeereModels.filter((model) => {
    if (selectedType !== "all" && model.equipment_type_id !== selectedType) return false;
    if (selectedPowerClass !== "all" && model.power_class_id !== selectedPowerClass) return false;
    return true;
  });

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Tehnika tüüp</label>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vali tüüp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kõik tüübid</SelectItem>
            {filteredTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name_et}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Jõuklass</label>
        <Select value={selectedPowerClass} onValueChange={onPowerClassChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Vali jõuklass" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kõik jõuklassid</SelectItem>
            {powerClasses?.map((pc) => (
              <SelectItem key={pc.id} value={pc.id}>
                {pc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">John Deere mudel</label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Vali mudel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kõik mudelid</SelectItem>
            {filteredModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.model_name} ({model.power_class?.name || "—"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Bränd (filter)</label>
        <Select value={selectedBrand} onValueChange={onBrandChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vali bränd" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kõik brändid</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
