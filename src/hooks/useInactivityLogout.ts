import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = "last_activity_timestamp";

export function useInactivityLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const performLogout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    if (timerRef.current) clearTimeout(timerRef.current);
    await supabase.auth.signOut();
    navigate("/auth");
  }, [navigate]);

  const updateActivity = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      performLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [performLogout]);

  useEffect(() => {
    // Check if already expired on mount
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - parseInt(last, 10) > INACTIVITY_TIMEOUT_MS) {
      performLogout();
      return;
    }

    // Set fresh activity timestamp (also covers first login)
    updateActivity();

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    let lastUpdate = Date.now();
    const handler = () => {
      if (Date.now() - lastUpdate > 60_000) {
        lastUpdate = Date.now();
        updateActivity();
      }
    };

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [updateActivity, performLogout]);
}
