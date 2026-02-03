import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export function useStaffUsers() {
  return useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_users")
        .select("*")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data as StaffUser[];
    },
  });
}

export function useAllStaffUsers() {
  return useQuery({
    queryKey: ["staff-users-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_users")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data as StaffUser[];
    },
  });
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: { full_name: string; email: string }) => {
      const { data, error } = await supabase
        .from("staff_users")
        .insert(user)
        .select()
        .single();
      if (error) throw error;
      return data as StaffUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      queryClient.invalidateQueries({ queryKey: ["staff-users-all"] });
    },
  });
}

export function useUpdateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...user }: Partial<StaffUser> & { id: string }) => {
      const { data, error } = await supabase
        .from("staff_users")
        .update(user)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as StaffUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      queryClient.invalidateQueries({ queryKey: ["staff-users-all"] });
    },
  });
}

export function useDeleteStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      queryClient.invalidateQueries({ queryKey: ["staff-users-all"] });
    },
  });
}
