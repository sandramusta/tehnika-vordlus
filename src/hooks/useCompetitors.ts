import { useMemo } from "react";
import { Equipment } from "@/types/equipment";

const HP_RANGE = 50;

export function useCompetitors(
  selectedModel: Equipment | null,
  allEquipment: Equipment[]
): Equipment[] {
  return useMemo(() => {
    if (!selectedModel?.engine_power_hp) return [];

    return allEquipment.filter((eq) => {
      // Exclude the selected model itself
      if (eq.id === selectedModel.id) return false;
      
      // Must be same equipment type
      if (eq.equipment_type_id !== selectedModel.equipment_type_id) return false;
      
      // Must be different brand (competitor)
      if (eq.brand_id === selectedModel.brand_id) return false;
      
      // Must have engine power data
      if (!eq.engine_power_hp) return false;
      
      // Must be within ±50 HP range
      const hpDifference = Math.abs(eq.engine_power_hp - selectedModel.engine_power_hp!);
      return hpDifference <= HP_RANGE;
    });
  }, [selectedModel, allEquipment]);
}

export function getCompetitorSummary(
  selectedModel: Equipment | null,
  competitors: Equipment[]
): string | null {
  if (!selectedModel?.engine_power_hp || competitors.length === 0) return null;
  
  const minHp = selectedModel.engine_power_hp - HP_RANGE;
  const maxHp = selectedModel.engine_power_hp + HP_RANGE;
  
  return `Leitud ${competitors.length} konkurenti vahemikus ${minHp}–${maxHp} hj`;
}
