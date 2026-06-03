"use client";

import { useCallback, useEffect, useState } from "react";
import { clearAuthSession, getAuthSession, type AuthSession } from "@/lib/auth";

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getAuthSession());
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  return { session, loading, logout } as const;
}
