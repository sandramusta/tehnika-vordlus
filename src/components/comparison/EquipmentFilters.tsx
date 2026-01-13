import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrands, useEquipmentTypes } from "@/hooks/useEquipmentData";
import { Equipment } from "@/types/equipment";

interface EquipmentFiltersProps {
  selectedType: string;
  selectedModel: string;
  onTypeChange: (value: string) => void;
  onModelChange: (value: string) => void;
  equipment: Equipment[];
}

export function EquipmentFilters({
  selectedType,
  selectedModel,
  onTypeChange,
  onModelChange,
  equipment,
}: EquipmentFiltersProps) {
  const { data: types } = useEquipmentTypes();
  const { data: brands } = useBrands();

  // Filter to show only combine, sprayer, tractor types
  const allowedTypes = ["combine", "sprayer", "tractor"];
  const filteredTypes = types?.filter((t) => allowedTypes.includes(t.name)) || [];

  // Get John Deere models for model filter
  const johnDeereBrand = brands?.find((b) => b.name === "John Deere");
  const johnDeereModels = equipment.filter(
    (e) => e.brand_id === johnDeereBrand?.id
  );

  // Filter models by selected type
  const filteredModels = johnDeereModels.filter((model) => {
    if (selectedType !== "all" && model.equipment_type_id !== selectedType) return false;
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
        <label className="text-sm font-medium text-muted-foreground">John Deere mudel</label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Vali mudel" />
          </SelectTrigger>
          <SelectContent>
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
