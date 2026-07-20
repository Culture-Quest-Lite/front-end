"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  AUTH_SESSION_EVENT,
  clearAuthSession,
  createSessionFromToken,
  getAccessToken,
} from "@/lib/auth";
import { logoutUser } from "@/lib/api";

export function useAuth() {
  const token = useSyncExternalStore(
    subscribeToAuthSession,
    getTokenSnapshot,
    getServerTokenSnapshot
  );
  const loading = token === undefined;
  const session = typeof token === "string" ? createSessionFromToken(token) : null;

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Failed to logout from server:", err);
    }

    clearAuthSession();
    window.location.href = "/";
  }, []);

  return { session, loading, logout } as const;
}

function subscribeToAuthSession(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(AUTH_SESSION_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getTokenSnapshot() {
  return getAccessToken();
}

function getServerTokenSnapshot() {
  return undefined;
}
