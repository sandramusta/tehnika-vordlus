import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SpecLabel {
  id: string;
  spec_key: string;
  custom_label: string;
  created_at: string;
  updated_at: string;
}

export function useSpecLabels() {
  return useQuery({
    queryKey: ["spec-labels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spec_labels")
        .select("*")
        .order("spec_key");
      
      if (error) throw error;
      
      // Convert to a map for easy lookup
      const labelsMap: Record<string, string> = {};
      (data as SpecLabel[]).forEach((label) => {
        labelsMap[label.spec_key] = label.custom_label;
      });
      
      return labelsMap;
    },
  });
}
