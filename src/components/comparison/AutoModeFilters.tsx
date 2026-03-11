import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBrands, useEquipmentTypes } from "@/hooks/useEquipmentData";
import { Equipment } from "@/types/equipment";
import { Info } from "lucide-react";

interface AutoModeFiltersProps {
  selectedType: string;
  selectedBrand: string;
  selectedModelId: string;
  onTypeChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  equipment: Equipment[];
  competitorCount: number;
  competitorSummary: string | null;
  equipmentTypeName?: string;
  isShowAllModelsType?: boolean;
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

export function AutoModeFilters({
  selectedType,
  selectedBrand,
  selectedModelId,
  onTypeChange,
  onBrandChange,
  onModelChange,
  equipment,
  competitorCount,
  competitorSummary,
  equipmentTypeName,
  isShowAllModelsType = false,
}: AutoModeFiltersProps) {
  const { data: types } = useEquipmentTypes();
  const { data: brands } = useBrands();

  const filteredTypes = types?.filter((t) => allowedTypes.includes(t.name)) || [];

  // Filter brands that have equipment in the selected type
  const availableBrands = brands?.filter((brand) =>
    equipment.some((eq) => eq.brand_id === brand.id)
  ) || [];

  // Filter models by selected type and brand
  const filteredModels = equipment.filter((model) => {
    if (selectedType !== "all" && model.equipment_type_id !== selectedType) return false;
    if (selectedBrand !== "all" && model.brand_id !== selectedBrand) return false;
    return true;
  });

  const isTypeSelected = selectedType !== "all";
  const isBrandSelected = selectedBrand !== "all";
  const isModelSelected = selectedModelId !== "all";

  const isSelfPropelledSprayer = equipmentTypeName === "self_propelled_sprayer";
  const selectedModel = equipment.find((m) => m.id === selectedModelId);
  const isTelehandler = equipmentTypeName === "telehandler";
  const isTrailedSprayer = equipmentTypeName === "trailed_sprayer";
  const isForageHarvester = equipmentTypeName === "forage_harvester";

  const hpRangeLabel = equipmentTypeName === 'tractor' ? '10' : isForageHarvester ? '25' : '50';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        {/* Type Selector */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-sm font-medium text-muted-foreground">Tehnika tüüp</label>
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full sm:w-[240px]">
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

        {/* Brand Selector - hidden for show-all types */}
        {!isShowAllModelsType && (
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-sm font-medium text-muted-foreground">Bränd</label>
            <Select 
              value={selectedBrand} 
              onValueChange={onBrandChange}
              disabled={!isTypeSelected}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={isTypeSelected ? "Vali bränd" : "Vali esmalt tüüp"} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Vali bränd...</SelectItem>
                {availableBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Model Selector - hidden for show-all types */}
        {!isShowAllModelsType && (
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-sm font-medium text-muted-foreground">Mudel</label>
            <Select 
              value={selectedModelId} 
              onValueChange={onModelChange}
              disabled={!isBrandSelected}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder={isBrandSelected ? "Vali mudel" : "Vali esmalt bränd"} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Vali mudel...</SelectItem>
                {filteredModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.model_name}
                    {isTelehandler 
                      ? (model.lift_height_m && ` (${model.lift_height_m}m)`)
                      : (model.engine_power_hp && ` (${model.engine_power_hp} hj)`)
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Show-all type info message */}
      {isShowAllModelsType && isTypeSelected && (
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
            <Info className="h-3.5 w-3.5" />
            Kuvatakse kõik {equipment.length} mudelit
          </Badge>
        </div>
      )}

      {/* Competitor Summary */}
      {!isShowAllModelsType && isModelSelected && selectedModel && (
        <div className="flex items-center gap-3">
          {competitorCount > 0 ? (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
              <Info className="h-3.5 w-3.5" />
              {competitorSummary}
            </Badge>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
             {isTrailedSprayer
                ? "Konkurente sama pumba tüübi ja sarnase paagi mahu vahemikus ei leitud"
                : isTelehandler 
                ? "Konkurente sarnase tõstekõrguse ja kandevõime vahemikus ei leitud"
                : `Konkurente vahemikus ±${hpRangeLabel} hj ei leitud`
              }
            </div>
          )}
        </div>
      )}

      {/* Selection guidance */}
      {!isShowAllModelsType && !isModelSelected && isTypeSelected && (
        <div className="text-sm text-muted-foreground">
          {isTrailedSprayer
            ? "Vali bränd ja mudel. Süsteem leiab automaatselt konkurendid sama pumba tüübi ja ±1000L paagi mahu vahemikus teistest brändidest."
            : isTelehandler 
            ? "Vali bränd ja mudel. Süsteem leiab automaatselt konkurendid sarnase tõstekõrguse (±0.5m) ja kandevõime (±400kg) vahemikus."
            : `Vali bränd ja mudel. Süsteem leiab automaatselt konkurendid ±${hpRangeLabel} hj vahemikus teistest brändidest.`
          }
        </div>
      )}
    </div>
  );
}
