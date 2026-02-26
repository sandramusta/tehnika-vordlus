import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = "last_activity_timestamp";

export function useInactivityLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateActivity = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    // Reset timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = "/auth";
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    // Check if already expired on mount
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - parseInt(last, 10) > INACTIVITY_TIMEOUT_MS) {
      supabase.auth.signOut().then(() => {
        window.location.href = "/auth";
      });
      return;
    }

    updateActivity();

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    // Throttle updates to once per minute
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
  }, [updateActivity]);
}
