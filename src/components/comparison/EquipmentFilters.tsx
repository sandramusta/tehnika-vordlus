import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrands, usePowerClasses, useEquipmentTypes } from "@/hooks/useEquipmentData";

interface EquipmentFiltersProps {
  selectedType: string;
  selectedBrand: string;
  selectedPowerClass: string;
  onTypeChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onPowerClassChange: (value: string) => void;
}

export function EquipmentFilters({
  selectedType,
  selectedBrand,
  selectedPowerClass,
  onTypeChange,
  onBrandChange,
  onPowerClassChange,
}: EquipmentFiltersProps) {
  const { data: types } = useEquipmentTypes();
  const { data: brands } = useBrands();
  const { data: powerClasses } = usePowerClasses();

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
            {types?.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name_et}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Bränd</label>
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
    </div>
  );
}
