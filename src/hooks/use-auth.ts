"use client";

import { useCallback, useEffect, useState } from "react";
import { clearAuthSession, getAuthSession, type AuthSession } from "@/lib/auth";
import { logoutUser } from "@/lib/api";

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get session from localStorage
    const savedSession = getAuthSession();
    
    if (savedSession) {
      console.debug("Session found in localStorage:", { 
        email: savedSession.email, 
        role: savedSession.role 
      });
      setSession(savedSession);
    } else {
      console.debug("No session found in localStorage");
      setSession(null);
    }
    
    setLoading(false);
    setInitialized(true);
  }, []);

  const logout = useCallback(async () => {
    const currentSession = getAuthSession();
    if (currentSession?.refreshToken) {
      try {
        await logoutUser(currentSession.refreshToken);
      } catch (err) {
        console.error("Failed to logout from server:", err);
      }
    }
    clearAuthSession();
    setSession(null);
    window.location.href = "/";
  }, []);

  return { session, loading: loading || !initialized, logout } as const;
}
