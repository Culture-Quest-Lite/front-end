"use client";

import { useCallback, useEffect, useState } from "react";
import { clearAuthSession, getAuthSession, type AuthSession } from "@/lib/auth";
import { logoutUser } from "@/lib/api";

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getAuthSession());
    setLoading(false);
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

  return { session, loading, logout } as const;
}
