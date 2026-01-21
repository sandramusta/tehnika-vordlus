import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SpecLabel } from "@/types/equipment";

export function useSpecLabels() {
  return useQuery({
    queryKey: ["spec-labels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spec_labels")
        .select("*")
        .order("spec_key");
      if (error) throw error;
      return data as SpecLabel[];
    },
  });
}

export function useUpdateSpecLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ specKey, customLabel }: { specKey: string; customLabel: string }) => {
      const { data, error } = await supabase
        .from("spec_labels")
        .upsert(
          { spec_key: specKey, custom_label: customLabel },
          { onConflict: "spec_key" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spec-labels"] });
    },
  });
}
