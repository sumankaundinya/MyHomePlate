import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS  = 5 * 60 * 1000;   // warn 5 min before logout
const THROTTLE_MS        = 1_000;            // ignore activity bursts within 1 s

// Events that cover all meaningful interactions on both desktop and mobile.
// pointermove is intentionally excluded — it fires hundreds of times per second
// during touch scroll and causes unnecessary timer churn on mobile devices.
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",   // desktop click
  "keydown",     // keyboard (desktop + mobile keyboard)
  "scroll",      // desktop wheel + mobile scroll
  "touchstart",  // any mobile tap or gesture start
];

export const useAdminSessionTimeout = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const logoutTimer  = useRef<ReturnType<typeof setTimeout>>();
  const warningTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastActivity = useRef<number>(Date.now());

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/");
  }, [navigate]);

  const resetTimers = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    setShowWarning(false);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS);

    logoutTimer.current = setTimeout(() => {
      logout();
    }, INACTIVITY_LIMIT_MS);
  }, [logout]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivity.current < THROTTLE_MS) return;
    lastActivity.current = now;
    resetTimers();
  }, [resetTimers]);

  const stayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, handleActivity, { passive: true })
    );
    resetTimers();

    return () => {
      ACTIVITY_EVENTS.forEach((e) =>
        window.removeEventListener(e, handleActivity)
      );
      clearTimeout(logoutTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, [handleActivity, resetTimers]);

  return { showWarning, stayLoggedIn, logout };
};
