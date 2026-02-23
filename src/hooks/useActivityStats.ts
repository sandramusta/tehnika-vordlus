import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  email: string;
  pdf_count: number;
  comparison_count: number;
  roi_count: number;
  total_points: number;
  last_active: string | null;
}

interface DashboardStats {
  todayPDFs: number;
  mostPopularModel: string | null;
  mostActiveUser: string | null;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["activity-leaderboard"],
    queryFn: async () => {
      // Get all activity logs
      const { data: logs, error } = await (supabase as any)
        .from("user_activity_logs")
        .select("user_id, action_type, created_at")
        .in("action_type", ["PDF_GENERATED", "COMPARISON_MADE", "ROI_CALCULATED"]);

      if (error) throw error;

      // Get profiles for names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      const profileMap = new Map(
        profiles?.map((p) => [p.id, { full_name: p.full_name, email: p.email }]) || []
      );

      // Aggregate per user
      const userMap = new Map<string, {
        pdf_count: number;
        comparison_count: number;
        roi_count: number;
        last_active: string | null;
      }>();

      for (const log of logs || []) {
        const entry = userMap.get(log.user_id) || {
          pdf_count: 0,
          comparison_count: 0,
          roi_count: 0,
          last_active: null,
        };

        if (log.action_type === "PDF_GENERATED") entry.pdf_count++;
        if (log.action_type === "COMPARISON_MADE") entry.comparison_count++;
        if (log.action_type === "ROI_CALCULATED") entry.roi_count++;

        if (!entry.last_active || log.created_at > entry.last_active) {
          entry.last_active = log.created_at;
        }

        userMap.set(log.user_id, entry);
      }

      const leaderboard: LeaderboardEntry[] = Array.from(userMap.entries())
        .map(([user_id, stats]) => {
          const profile = profileMap.get(user_id);
          return {
            user_id,
            full_name: profile?.full_name || "Tundmatu",
            email: profile?.email || "",
            ...stats,
            total_points: stats.pdf_count * 3 + stats.comparison_count,
          };
        })
        .sort((a, b) => b.total_points - a.total_points);

      return leaderboard;
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["activity-dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Today's PDFs
      const { count: todayPDFs } = await (supabase as any)
        .from("user_activity_logs")
        .select("*", { count: "exact", head: true })
        .eq("action_type", "PDF_GENERATED")
        .gte("created_at", todayStart.toISOString());

      // Most popular model in comparisons (from details JSON)
      const { data: comparisonLogs } = await (supabase as any)
        .from("user_activity_logs")
        .select("details")
        .eq("action_type", "COMPARISON_MADE")
        .order("created_at", { ascending: false })
        .limit(100);

      let mostPopularModel: string | null = null;
      if (comparisonLogs && comparisonLogs.length > 0) {
        const modelCounts = new Map<string, number>();
        for (const log of comparisonLogs) {
          const details = log.details as Record<string, unknown> | null;
          const models = details?.models as string[] | undefined;
          if (models) {
            for (const model of models) {
              modelCounts.set(model, (modelCounts.get(model) || 0) + 1);
            }
          }
        }
        let maxCount = 0;
        for (const [model, count] of modelCounts) {
          if (count > maxCount) {
            maxCount = count;
            mostPopularModel = model;
          }
        }
      }

      // Most active user today
      const { data: todayLogs } = await (supabase as any)
        .from("user_activity_logs")
        .select("user_id")
        .gte("created_at", todayStart.toISOString());

      let mostActiveUser: string | null = null;
      if (todayLogs && todayLogs.length > 0) {
        const userCounts = new Map<string, number>();
        for (const log of todayLogs) {
          userCounts.set(log.user_id, (userCounts.get(log.user_id) || 0) + 1);
        }
        let maxCount = 0;
        let topUserId: string | null = null;
        for (const [userId, count] of userCounts) {
          if (count > maxCount) {
            maxCount = count;
            topUserId = userId;
          }
        }
        if (topUserId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", topUserId)
            .maybeSingle();
          mostActiveUser = profile?.full_name || null;
        }
      }

      return {
        todayPDFs: todayPDFs || 0,
        mostPopularModel,
        mostActiveUser,
      };
    },
    refetchInterval: 30000,
  });
}
