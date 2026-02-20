import { useMemo } from "react";
import { Equipment } from "@/types/equipment";

const HP_RANGE_DEFAULT = 50;
const HP_RANGE_TRACTOR = 10;
const LIFT_HEIGHT_RANGE_M = 0.5; // ±0.5m for telehandler matching
const LIFT_CAPACITY_RANGE_KG = 400; // ±400kg for telehandler matching

// Check if equipment type is telehandler
function isTelehandler(equipment: Equipment): boolean {
  return equipment.equipment_type?.name === "telehandler";
}

function isTractor(equipment: Equipment): boolean {
  return equipment.equipment_type?.name === "tractor";
}

function getHpRange(equipment: Equipment): number {
  return isTractor(equipment) ? HP_RANGE_TRACTOR : HP_RANGE_DEFAULT;
}

export function useCompetitors(
  selectedModel: Equipment | null,
  allEquipment: Equipment[]
): Equipment[] {
  return useMemo(() => {
    if (!selectedModel) return [];

    // For telehandlers, use lift height and capacity for matching
    if (isTelehandler(selectedModel)) {
      // Need at least lift height for telehandler matching
      if (!selectedModel.lift_height_m) return [];

      return allEquipment.filter((eq) => {
        if (eq.id === selectedModel.id) return false;
        if (eq.equipment_type_id !== selectedModel.equipment_type_id) return false;
        if (eq.brand_id === selectedModel.brand_id) return false;
        if (!eq.lift_height_m) return false;

        // Match by lift height (primary criterion)
        const heightDiff = Math.abs(eq.lift_height_m - selectedModel.lift_height_m!);
        if (heightDiff > LIFT_HEIGHT_RANGE_M) return false;

        // If both have capacity data, also check capacity range
        if (selectedModel.max_lift_capacity_kg && eq.max_lift_capacity_kg) {
          const capacityDiff = Math.abs(eq.max_lift_capacity_kg - selectedModel.max_lift_capacity_kg);
          if (capacityDiff > LIFT_CAPACITY_RANGE_KG) return false;
        }

        return true;
      });
    }

    // For other equipment types, use HP-based matching
    if (!selectedModel.engine_power_hp) return [];

    return allEquipment.filter((eq) => {
      if (eq.id === selectedModel.id) return false;
      if (eq.equipment_type_id !== selectedModel.equipment_type_id) return false;
      if (eq.brand_id === selectedModel.brand_id) return false;
      if (!eq.engine_power_hp) return false;

      const hpDifference = Math.abs(eq.engine_power_hp - selectedModel.engine_power_hp!);
      return hpDifference <= getHpRange(selectedModel);
    });
  }, [selectedModel, allEquipment]);
}

export function getCompetitorSummary(
  selectedModel: Equipment | null,
  competitors: Equipment[]
): string | null {
  if (!selectedModel || competitors.length === 0) return null;

  // For telehandlers, show lift height and capacity info
  if (isTelehandler(selectedModel) && selectedModel.lift_height_m) {
    const capacityInfo = selectedModel.max_lift_capacity_kg 
      ? `, ${selectedModel.max_lift_capacity_kg} kg` 
      : "";
    return `Leitud ${competitors.length} konkurenti ±${LIFT_HEIGHT_RANGE_M}m tõstekõrguse ja ±${LIFT_CAPACITY_RANGE_KG}kg tõstevõime vahemikus (valitud: ${selectedModel.lift_height_m}m${capacityInfo})`;
  }

  // For other equipment, show HP info
  if (!selectedModel.engine_power_hp) return null;
  const hpRange = getHpRange(selectedModel);
  return `Leitud ${competitors.length} konkurenti ±${hpRange} hj vahemikus (valitud: ${selectedModel.engine_power_hp} hj)`;
}
