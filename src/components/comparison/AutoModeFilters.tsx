import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBrands, useEquipmentTypes } from "@/hooks/useEquipmentData";
import { Equipment } from "@/types/equipment";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getTranslation } from "@/lib/i18nHelpers";

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
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
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
          <label className="text-sm font-medium text-muted-foreground">{t("autoFilter.equipmentType")}</label>
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder={t("modelSelect.selectType")} />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">{t("modelSelect.selectTypeHint")}</SelectItem>
              {filteredTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {getTranslation(type.name_translations, lang, type.name_et)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand Selector - hidden for show-all types */}
        {!isShowAllModelsType && (
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-sm font-medium text-muted-foreground">{t("autoFilter.brand")}</label>
            <Select
              value={selectedBrand}
              onValueChange={onBrandChange}
              disabled={!isTypeSelected}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={isTypeSelected ? t("autoFilter.selectBrand") : t("autoFilter.selectTypeFirst")} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">{t("autoFilter.allBrands")}</SelectItem>
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
            <label className="text-sm font-medium text-muted-foreground">{t("autoFilter.model")}</label>
            <Select
              value={selectedModelId}
              onValueChange={onModelChange}
              disabled={!isBrandSelected}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder={isBrandSelected ? t("autoFilter.allModels") : t("autoFilter.selectBrandFirst")} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">{t("autoFilter.allModels")}</SelectItem>
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
            {t("autoFilter.showAllModels", { count: equipment.length })}
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
                ? t("autoFilter.noCompetitorsTrailedSprayer")
                : isTelehandler
                ? t("autoFilter.noCompetitorsTelehandler")
                : t("autoFilter.noCompetitorsHP", { hp: hpRangeLabel })
              }
            </div>
          )}
        </div>
      )}

      {/* Selection guidance */}
      {!isShowAllModelsType && !isModelSelected && isTypeSelected && (
        <div className="text-sm text-muted-foreground">
          {isTrailedSprayer
            ? t("autoFilter.selectionGuideTrailedSprayer")
            : isTelehandler
            ? t("autoFilter.selectionGuideTelehandler")
            : t("autoFilter.selectionGuideHP", { hp: hpRangeLabel })
          }
        </div>
      )}
    </div>
  );
}
