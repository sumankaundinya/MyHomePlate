import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000;    // warn 5 min before logout

export const useAdminSessionTimeout = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const logoutTimer = useRef<ReturnType<typeof setTimeout>>();
  const warningTimer = useRef<ReturnType<typeof setTimeout>>();

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

  const stayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ["mousedown", "keydown", "scroll", "touchstart", "pointermove"];

    events.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimers));
      clearTimeout(logoutTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, [resetTimers]);

  return { showWarning, stayLoggedIn, logout };
};
