import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS   =  5 * 60 * 1000; // warn 5 min before logout
const THROTTLE_MS         =  1_000;          // ignore activity bursts within 1 s
const POLL_INTERVAL_MS    = 30_000;          // check elapsed time every 30 s

// Persisted in localStorage so sleep / background tabs don't cheat the timer.
const STORAGE_KEY = "admin_last_activity";

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

export const useAdminSessionTimeout = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const lastThrottle = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
    navigate("/");
  }, [navigate]);

  // Compare wall-clock time against the stored timestamp.
  // Called both by the poll and by visibilitychange so sleep / tab-switch
  // scenarios are caught as soon as the user returns to the page.
  const checkExpiry = useCallback(() => {
    const last = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    const elapsed = Date.now() - last;

    if (elapsed >= INACTIVITY_LIMIT_MS) {
      logout();
    } else if (elapsed >= INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [logout]);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottle.current < THROTTLE_MS) return;
    lastThrottle.current = now;
    localStorage.setItem(STORAGE_KEY, now.toString());
    setShowWarning(false);
  }, []);

  const stayLoggedIn = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShowWarning(false);
  }, []);

  useEffect(() => {
    // Stamp "now" as the first activity so the clock starts from login.
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    // Poll every 30 s — catches background-tab and minimised-window cases.
    pollRef.current = setInterval(checkExpiry, POLL_INTERVAL_MS);

    // Check immediately when the user switches back to this tab after sleeping
    // or working in another tab — covers the "closed laptop" scenario.
    const handleVisibility = () => {
      if (!document.hidden) checkExpiry();
    };

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, recordActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(pollRef.current);
      ACTIVITY_EVENTS.forEach((e) =>
        window.removeEventListener(e, recordActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibility);
      localStorage.removeItem(STORAGE_KEY);
    };
  }, [checkExpiry, recordActivity]);

  return { showWarning, stayLoggedIn, logout };
};
