import { useState, useCallback } from "react";
import { useUpdateEquipment } from "./useEquipmentData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Equipment } from "@/types/equipment";

interface UseInlineEditOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useInlineEdit(options: UseInlineEditOptions = {}) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const updateEquipment = useUpdateEquipment();
  const queryClient = useQueryClient();

  const startEditing = useCallback((cellId: string, currentValue: unknown) => {
    setEditingCell(cellId);
    setEditValue(currentValue === null || currentValue === undefined ? "" : String(currentValue));
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  // Update a top-level equipment field
  const saveTopLevelField = useCallback(
    async (equipmentId: string, fieldName: keyof Equipment, rawValue: string) => {
      const parsedValue = parseValue(rawValue, fieldName);
      
      try {
        await updateEquipment.mutateAsync({
          id: equipmentId,
          [fieldName]: parsedValue,
        });
        options.onSuccess?.();
      } catch (error) {
        options.onError?.(error as Error);
      } finally {
        setEditingCell(null);
        setEditValue("");
      }
    },
    [updateEquipment, options]
  );

  // Update a nested field in detailed_specs JSONB
  const saveDetailedSpec = useCallback(
    async (
      equipmentId: string,
      categoryKey: string,
      fieldKey: string,
      rawValue: string,
      currentSpecs: Record<string, unknown> | null
    ) => {
      const parsedValue = parseDetailedSpecValue(rawValue);
      
      const updatedSpecs = {
        ...currentSpecs,
        [categoryKey]: {
          ...(currentSpecs?.[categoryKey] as Record<string, unknown> || {}),
          [fieldKey]: parsedValue,
        },
      };

      try {
        await updateEquipment.mutateAsync({
          id: equipmentId,
          detailed_specs: updatedSpecs,
        });
        options.onSuccess?.();
      } catch (error) {
        options.onError?.(error as Error);
      } finally {
        setEditingCell(null);
        setEditValue("");
      }
    },
    [updateEquipment, options]
  );

  // Save a custom spec label to spec_labels table
  const saveSpecLabel = useCallback(
    async (specKey: string, newLabel: string) => {
      try {
        // Upsert: insert or update
        const { error } = await supabase
          .from("spec_labels")
          .upsert(
            { spec_key: specKey, custom_label: newLabel },
            { onConflict: "spec_key" }
          );

        if (error) throw error;
        
        // Invalidate spec_labels cache
        queryClient.invalidateQueries({ queryKey: ["spec-labels"] });
        options.onSuccess?.();
      } catch (error) {
        options.onError?.(error as Error);
      } finally {
        setEditingCell(null);
        setEditValue("");
      }
    },
    [queryClient, options]
  );

  return {
    editingCell,
    editValue,
    setEditValue,
    startEditing,
    cancelEditing,
    saveTopLevelField,
    saveDetailedSpec,
    saveSpecLabel,
    isUpdating: updateEquipment.isPending,
  };
}

// Parse value based on field type
function parseValue(value: string, fieldName: keyof Equipment): unknown {
  if (value === "" || value === "—") return null;

  // Numeric fields
  const numericFields: (keyof Equipment)[] = [
    "engine_power_hp",
    "grain_tank_liters",
    "header_width_m",
    "weight_kg",
    "fuel_consumption_lh",
    "price_eur",
    "annual_maintenance_eur",
    "expected_lifespan_years",
    "fuel_tank_liters",
    "cleaning_area_m2",
    "rotor_diameter_mm",
    "throughput_tons_h",
    "engine_displacement_liters",
    "engine_cylinders",
    "max_torque_nm",
    "feeder_width_mm",
    "rasp_bar_count",
    "threshing_drum_diameter_mm",
    "threshing_drum_width_mm",
    "threshing_area_m2",
    "rotor_length_mm",
    "separator_area_m2",
    "straw_walker_count",
    "straw_walker_area_m2",
    "sieve_area_m2",
    "unloading_rate_ls",
    "auger_reach_m",
    "chopper_width_mm",
    "max_slope_percent",
    "transport_width_mm",
    "transport_height_mm",
    "transport_length_mm",
    "header_width_min_m",
    "header_width_max_m",
  ];

  if (numericFields.includes(fieldName)) {
    // Remove spaces, replace comma with dot for decimal
    const cleanValue = value.replace(/\s/g, "").replace(",", ".");
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  }

  return value;
}

// Parse detailed spec values (auto-detect type)
function parseDetailedSpecValue(value: string): unknown {
  if (value === "" || value === "—") return null;
  
  // Check for boolean-like values
  if (value === "●" || value.toLowerCase() === "jah" || value.toLowerCase() === "true") return true;
  if (value === "○" || value.toLowerCase() === "ei" || value.toLowerCase() === "false") return false;
  
  // Try to parse as number
  const cleanValue = value.replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(cleanValue);
  if (!isNaN(parsed) && cleanValue === String(parsed)) {
    return parsed;
  }
  
  return value;
}
