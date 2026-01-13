import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Equipment, Brand, PowerClass, EquipmentType, CompetitiveArgument, WorkDocumentation } from "@/types/equipment";

export function useEquipmentTypes() {
  return useQuery({
    queryKey: ["equipment-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as EquipmentType[];
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as Brand[];
    },
  });
}

export function usePowerClasses() {
  return useQuery({
    queryKey: ["power-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("power_classes")
        .select("*")
        .order("min_hp");
      if (error) throw error;
      return data as PowerClass[];
    },
  });
}

export function useEquipment(equipmentTypeId?: string) {
  return useQuery({
    queryKey: ["equipment", equipmentTypeId],
    queryFn: async () => {
      let query = supabase
        .from("equipment")
        .select(`
          *,
          brand:brands(*),
          power_class:power_classes(*),
          equipment_type:equipment_types(*)
        `)
        .order("model_name");

      if (equipmentTypeId) {
        query = query.eq("equipment_type_id", equipmentTypeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Equipment[];
    },
  });
}

export function useCompetitiveArguments(equipmentTypeId?: string) {
  return useQuery({
    queryKey: ["competitive-arguments", equipmentTypeId],
    queryFn: async () => {
      let query = supabase
        .from("competitive_arguments")
        .select(`
          *,
          competitor_brand:brands(*)
        `)
        .order("sort_order");

      if (equipmentTypeId) {
        query = query.eq("equipment_type_id", equipmentTypeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CompetitiveArgument[];
    },
  });
}

export function useWorkDocumentation(equipmentId?: string) {
  return useQuery({
    queryKey: ["work-documentation", equipmentId],
    queryFn: async () => {
      let query = supabase
        .from("work_documentation")
        .select(`
          *,
          equipment:equipment(*, brand:brands(*))
        `)
        .order("work_date", { ascending: false });

      if (equipmentId) {
        query = query.eq("equipment_id", equipmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WorkDocumentation[];
    },
  });
}

// Mutations
export function useCreateEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (equipment: Omit<Equipment, "id" | "created_at" | "updated_at" | "brand" | "power_class" | "equipment_type">) => {
      const { data, error } = await supabase
        .from("equipment")
        .insert(equipment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...equipment }: Partial<Equipment> & { id: string }) => {
      const { data, error } = await supabase
        .from("equipment")
        .update(equipment)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
}

export function useCreateArgument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (argument: Omit<CompetitiveArgument, "id" | "created_at" | "competitor_brand">) => {
      const { data, error } = await supabase
        .from("competitive_arguments")
        .insert(argument)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitive-arguments"] });
    },
  });
}

export function useDeleteArgument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitive_arguments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitive-arguments"] });
    },
  });
}

export function useUpdateArgument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...argument }: Partial<CompetitiveArgument> & { id: string }) => {
      const { data, error } = await supabase
        .from("competitive_arguments")
        .update(argument)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitive-arguments"] });
    },
  });
}
