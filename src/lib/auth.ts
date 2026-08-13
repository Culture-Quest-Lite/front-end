import type { AccessTokenSession } from "@/lib/access-control";

export interface AuthSessionResponse {
  session: AccessTokenSession | null;
}

export const AUTH_SESSION_EVENT = "auth-session-changed";

export function notifyAuthSessionChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

/**
 * Client code can no longer clear the auth cookie directly because the cookie
 * is now HttpOnly. Keep this helper as an event-only compatibility layer.
 */
export function clearAuthSession() {
  notifyAuthSessionChanged();
}
