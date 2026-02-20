import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export type ActivityAction = 
  | "PDF_GENERATED" 
  | "COMPARISON_MADE" 
  | "ROI_CALCULATED" 
  | "USER_LOGIN";

export function useActivityLog() {
  const { user } = useAuthContext();

  const logActivity = useCallback(
    async (action_type: ActivityAction, details?: Record<string, unknown>) => {
      if (!user) return;
      try {
        await (supabase as any).from("user_activity_logs").insert({
          user_id: user.id,
          action_type,
          details: details || {},
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    },
    [user]
  );

  return { logActivity };
}
