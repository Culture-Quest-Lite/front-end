"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { AccessTokenSession } from "@/lib/access-control";
import { AUTH_SESSION_EVENT, notifyAuthSessionChanged } from "@/lib/auth";
import { fetchCurrentSession, logoutUser } from "@/lib/api";

type AuthSnapshot = AccessTokenSession | null | undefined;

let authSnapshot: AuthSnapshot = undefined;
let refreshInFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();
let refreshRequestId = 0;
let windowSubscriberCount = 0;
let isWindowAuthListenerBound = false;

export function useAuth() {
  const session = useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSnapshot,
    getServerSnapshot,
  );
  const loading = session === undefined;

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Failed to logout from server:", err);
    } finally {
      setAuthSnapshot(null);
      notifyAuthSessionChanged();
      window.location.href = "/";
    }
  }, []);

  return { session: session ?? null, loading, logout } as const;
}

function subscribeToAuthSession(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  if (typeof window !== "undefined") {
    windowSubscriberCount += 1;
    bindWindowAuthListener();

    if (authSnapshot === undefined) {
      void refreshAuthSession();
    }

    return () => {
      listeners.delete(onStoreChange);
      windowSubscriberCount -= 1;
      unbindWindowAuthListener();
    };
  }

  return () => {
    listeners.delete(onStoreChange);
  };
}

function getAuthSnapshot() {
  if (typeof window !== "undefined" && authSnapshot === undefined) {
    void refreshAuthSession();
  }

  return authSnapshot;
}

function getServerSnapshot() {
  return undefined;
}

async function refreshAuthSession(force = false) {
  if (!force && refreshInFlight) {
    return refreshInFlight;
  }

  const requestId = ++refreshRequestId;
  const currentTask = (async () => {
    try {
      const response = await fetchCurrentSession();
      if (requestId === refreshRequestId) {
        setAuthSnapshot(response.session);
      }
    } catch (error) {
      console.error("Failed to load auth session:", error);
      if (requestId === refreshRequestId) {
        setAuthSnapshot(null);
      }
    }
  })();

  refreshInFlight = currentTask;
  currentTask.finally(() => {
    if (refreshInFlight === currentTask) {
      refreshInFlight = null;
    }
  });

  return currentTask;
}

function setAuthSnapshot(nextSnapshot: AuthSnapshot) {
  authSnapshot = nextSnapshot;

  for (const listener of listeners) {
    listener();
  }
}

function bindWindowAuthListener() {
  if (isWindowAuthListenerBound || typeof window === "undefined") {
    return;
  }

  window.addEventListener(AUTH_SESSION_EVENT, refreshAuthSessionFromEvent);
  isWindowAuthListenerBound = true;
}

function unbindWindowAuthListener() {
  if (
    !isWindowAuthListenerBound ||
    windowSubscriberCount > 0 ||
    typeof window === "undefined"
  ) {
    return;
  }

  window.removeEventListener(AUTH_SESSION_EVENT, refreshAuthSessionFromEvent);
  isWindowAuthListenerBound = false;
}

function refreshAuthSessionFromEvent() {
  void refreshAuthSession(true);
}
