import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useAuth";

export interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  role?: AppRole;
  auth_user_id?: string;
  has_logged_in?: boolean;
}

async function enrichWithRoles(users: StaffUser[]): Promise<StaffUser[]> {
  // Get all profiles to map email -> auth user id
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email");

  // Get all roles
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role");

  // Get login activity to determine who has logged in
  const { data: loginLogs } = await supabase
    .from("user_activity_logs")
    .select("user_id")
    .eq("action_type", "USER_LOGIN");

  const emailToAuthId = new Map(profiles?.map((p) => [p.email, p.id]) || []);
  const authIdToRole = new Map(roles?.map((r) => [r.user_id, r.role as AppRole]) || []);
  const loggedInUsers = new Set(loginLogs?.map((l) => l.user_id) || []);

  return users.map((u) => {
    const authId = emailToAuthId.get(u.email);
    return {
      ...u,
      auth_user_id: authId || undefined,
      role: authId ? authIdToRole.get(authId) || "user" : undefined,
      has_logged_in: authId ? loggedInUsers.has(authId) : false,
    };
  });
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
      return enrichWithRoles(data as StaffUser[]);
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
      return enrichWithRoles(data as StaffUser[]);
    },
  });
}

export function useInviteStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: { full_name: string; email: string; role: AppRole }) => {
      // First, add to staff_users table
      const { data: staffUser, error: staffError } = await supabase
        .from("staff_users")
        .insert({ full_name: user.full_name, email: user.email })
        .select()
        .single();
      
      if (staffError) throw staffError;

      // Then, invoke the invite edge function
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      });

      if (error) {
        // Rollback staff_users entry if invite fails
        await supabase.from("staff_users").delete().eq("id", staffUser.id);
        throw error;
      }

      if (data?.error) {
        await supabase.from("staff_users").delete().eq("id", staffUser.id);
        throw new Error(data.error);
      }

      return { ...staffUser, authUserId: data.userId, emailSent: data.emailSent !== false };
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

export function useUpdateStaffUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ authUserId, role }: { authUserId: string; role: AppRole }) => {
      // Delete existing role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", authUserId);
      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: authUserId, role });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      queryClient.invalidateQueries({ queryKey: ["staff-users-all"] });
    },
  });
}
