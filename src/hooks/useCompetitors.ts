import { useMemo } from "react";
import { Equipment } from "@/types/equipment";

const HP_RANGE_DEFAULT = 50;
const HP_RANGE_TRACTOR = 10;
const HP_RANGE_FORAGE_HARVESTER = 25;
const LIFT_HEIGHT_RANGE_M = 0.5; // ±0.5m for telehandler matching
const LIFT_CAPACITY_RANGE_KG = 400; // ±400kg for telehandler matching
const TANK_VOLUME_RANGE_L = 1000; // ±1000L for trailed sprayer matching

// Check if equipment type is telehandler
function isTelehandler(equipment: Equipment): boolean {
  return equipment.equipment_type?.name === "telehandler";
}

function isTrailedSprayer(equipment: Equipment): boolean {
  return equipment.equipment_type?.name === "trailed_sprayer";
}

function getSprayerTankVolume(equipment: Equipment): number | null {
  const specs = equipment.detailed_specs as Record<string, Record<string, string>> | null;
  if (!specs?.paak_ja_poomid?.paagi_maht_l) return null;
  const val = parseFloat(specs.paak_ja_poomid.paagi_maht_l);
  return isNaN(val) ? null : val;
}

type PumpCategory = "tsentrifugaal" | "kolb-membraan";

function getSprayerPumpCategories(equipment: Equipment): PumpCategory[] | null {
  const specs = equipment.detailed_specs as Record<string, Record<string, string>> | null;
  const raw = specs?.pumbasüsteem?.tüüp?.toLowerCase().trim();
  if (!raw) return null;
  const categories: PumpCategory[] = [];
  if (raw.includes("tsentrifugaal")) categories.push("tsentrifugaal");
  if (raw.includes("kolb-membraan")) categories.push("kolb-membraan");
  return categories.length > 0 ? categories : null;
}

function isForageHarvester(equipment: Equipment): boolean {
  return equipment.equipment_type?.name === "forage_harvester";
}

function isTractor(equipment: Equipment): boolean {
  return equipment.equipment_type?.name === "tractor";
}

// Parse ECE-R120 power from detailed_specs.mootor.max_võimsus_hj_kw
// Format examples: "310 (228)", "243", "283 (208)"
function getTractorECEPower(equipment: Equipment): number | null {
  const specs = equipment.detailed_specs as Record<string, Record<string, string>> | null;
  const raw = specs?.mootor?.max_võimsus_hj_kw;
  if (typeof raw === 'string') {
    const match = raw.match(/^(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  if (typeof raw === 'number') return raw;
  return equipment.engine_power_hp;
}

function getHpRange(equipment: Equipment): number {
  if (isTractor(equipment)) return HP_RANGE_TRACTOR;
  if (isForageHarvester(equipment)) return HP_RANGE_FORAGE_HARVESTER;
  return HP_RANGE_DEFAULT;
}

export function useCompetitors(
  selectedModel: Equipment | null,
  allEquipment: Equipment[]
): Equipment[] {
  return useMemo(() => {
    if (!selectedModel) return [];

    // For trailed sprayers, use tank volume and pump type for matching
    if (isTrailedSprayer(selectedModel)) {
      const selectedTank = getSprayerTankVolume(selectedModel);
      const selectedPumps = getSprayerPumpCategories(selectedModel);
      if (!selectedTank || !selectedPumps) return [];

      return allEquipment.filter((eq) => {
        if (eq.id === selectedModel.id) return false;
        if (eq.equipment_type_id !== selectedModel.equipment_type_id) return false;
        if (eq.brand_id === selectedModel.brand_id) return false;

        const eqTank = getSprayerTankVolume(eq);
        const eqPumps = getSprayerPumpCategories(eq);
        if (!eqTank || !eqPumps) return false;

        // Must have overlapping pump categories
        const hasPumpOverlap = eqPumps.some(p => selectedPumps.includes(p));
        if (!hasPumpOverlap) return false;

        // Tank volume within range
        const tankDiff = Math.abs(eqTank - selectedTank);
        return tankDiff <= TANK_VOLUME_RANGE_L;
      });
    }

    // For telehandlers, use lift height and capacity for matching
    if (isTelehandler(selectedModel)) {
      if (!selectedModel.lift_height_m) return [];

      return allEquipment.filter((eq) => {
        if (eq.id === selectedModel.id) return false;
        if (eq.equipment_type_id !== selectedModel.equipment_type_id) return false;
        if (eq.brand_id === selectedModel.brand_id) return false;
        if (!eq.lift_height_m) return false;

        const heightDiff = Math.abs(eq.lift_height_m - selectedModel.lift_height_m!);
        if (heightDiff > LIFT_HEIGHT_RANGE_M) return false;

        if (selectedModel.max_lift_capacity_kg && eq.max_lift_capacity_kg) {
          const capacityDiff = Math.abs(eq.max_lift_capacity_kg - selectedModel.max_lift_capacity_kg);
          if (capacityDiff > LIFT_CAPACITY_RANGE_KG) return false;
        }

        return true;
      });
    }

    // For tractors, use ECE-R120 power from detailed_specs
    if (isTractor(selectedModel)) {
      const selectedPower = getTractorECEPower(selectedModel);
      if (!selectedPower) return [];

      return allEquipment.filter((eq) => {
        if (eq.id === selectedModel.id) return false;
        if (eq.equipment_type_id !== selectedModel.equipment_type_id) return false;
        if (eq.brand_id === selectedModel.brand_id) return false;

        const eqPower = getTractorECEPower(eq);
        if (!eqPower) return false;

        return Math.abs(eqPower - selectedPower) <= HP_RANGE_TRACTOR;
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

  // For trailed sprayers, show tank volume and pump type info
  if (isTrailedSprayer(selectedModel)) {
    const tank = getSprayerTankVolume(selectedModel);
    const pumps = getSprayerPumpCategories(selectedModel);
    if (!tank || !pumps) return null;
    const pumpLabel = pumps.length > 1
      ? "tsentrifugaal- / kolb-membraanpump"
      : pumps[0] === "tsentrifugaal" ? "tsentrifugaalpump" : "kolb-membraanpump";
    return `Leitud ${competitors.length} konkurenti pumba tüübiga "${pumpLabel}" ja ±${TANK_VOLUME_RANGE_L}L paagi mahuga (valitud: ${tank}L)`;
  }

  // For telehandlers, show lift height and capacity info
  if (isTelehandler(selectedModel) && selectedModel.lift_height_m) {
    const capacityInfo = selectedModel.max_lift_capacity_kg 
      ? `, ${selectedModel.max_lift_capacity_kg} kg` 
      : "";
    return `Leitud ${competitors.length} konkurenti ±${LIFT_HEIGHT_RANGE_M}m tõstekõrguse ja ±${LIFT_CAPACITY_RANGE_KG}kg tõstevõime vahemikus (valitud: ${selectedModel.lift_height_m}m${capacityInfo})`;
  }

  // For tractors, show ECE-R120 power info
  if (isTractor(selectedModel)) {
    const ecePower = getTractorECEPower(selectedModel);
    if (!ecePower) return null;
    return `Leitud ${competitors.length} konkurenti ±${HP_RANGE_TRACTOR} hj vahemikus (valitud: ${ecePower} hj, ECE-R120)`;
  }

  // For other equipment, show HP info
  if (!selectedModel.engine_power_hp) return null;
  const hpRange = getHpRange(selectedModel);
  return `Leitud ${competitors.length} konkurenti ±${hpRange} hj vahemikus (valitud: ${selectedModel.engine_power_hp} hj)`;
}
