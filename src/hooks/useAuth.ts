import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "user" | "product_manager" | "admin";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  roles: AppRole[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (profileData) {
        setProfile({
          id: profileData.id,
          full_name: profileData.full_name,
          email: profileData.email,
          roles: (rolesData?.map((r) => r.role as AppRole) || []),
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes — do NOT await inside callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        // If this is a password recovery event, redirect to reset-password page
        if (event === "PASSWORD_RECOVERY") {
          // Don't set session/user yet — let ResetPassword page handle it
          if (window.location.pathname !== "/reset-password") {
            window.location.href = "/reset-password";
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            if (isMounted) fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // INITIAL load — controls loading state
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // Log login activity
    if (!error && data?.user) {
      try {
        await (supabase as any).from("user_activity_logs").insert({
          user_id: data.user.id,
          action_type: "USER_LOGIN",
          details: {},
        });
      } catch (e) {
        console.error("Failed to log login:", e);
      }
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Create profile
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
      });

      // Assign default 'user' role
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "user",
      });
    }

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
    return { error };
  };

  const hasRole = (role: AppRole): boolean => {
    return profile?.roles.includes(role) ?? false;
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return roles.some((role) => profile?.roles.includes(role));
  };

  const isAdmin = hasRole("admin");
  const isProductManager = hasRole("product_manager");
  const canEdit = hasAnyRole(["admin", "product_manager"]);
  const canManageUsers = isAdmin;

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasAnyRole,
    isAdmin,
    isProductManager,
    canEdit,
    canManageUsers,
  };
}
