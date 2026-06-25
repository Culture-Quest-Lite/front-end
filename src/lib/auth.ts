import { extractUserFromToken } from "@/services/api/authApi";

export type Role = "admin" | "curator" | "explorer" | "partner";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  token: string;
}

const STORAGE_KEY = "culture-quest-auth-session";
const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";
export const AUTH_SESSION_EVENT = "auth-session-changed";

const mockUsers: Array<AuthSession & { password: string }> = [
  {
    id: "1",
    email: "admin@example.com",
    password: "Admin123",
    name: "Admin Quản trị",
    role: "admin",
    token: "mock-admin-token",
  },
  {
    id: "2",
    email: "curator@example.com",
    password: "Curator123",
    name: "Curator Biên tập",
    role: "curator",
    token: "mock-curator-token",
  },
  {
  id: "3",
  email: "explorer@example.com",
  password: "Explorer123",
  name: "Explorer User",
  role: "explorer",
  token: "mock-explorer-token",
}
];

export function mockLogin(credentials: LoginCredentials): Promise<AuthSession> {
  const user = mockUsers.find(
    (item) =>
      item.email.toLowerCase() === credentials.email.toLowerCase() &&
      item.password === credentials.password
  );

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!user) {
        reject(new Error("Email hoặc mật khẩu không đúng."));
        return;
      }

      resolve({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token: user.token,
      });
    }, 500);
  });
}

export function saveAuthSession(session: AuthSession) {
  saveAccessToken(session.token);
}

export function saveAccessToken(token: string, expiresIn?: number) {
  if (typeof window === "undefined" || !token) return;

  const maxAge =
    typeof expiresIn === "number" ? expiresIn : getTokenMaxAge(token);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const expires = typeof maxAge === "number" ? `; Max-Age=${maxAge}` : "";

  document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${expires}${secure}`;
  window.localStorage.removeItem(STORAGE_KEY);
  console.debug("Access token cookie updated:", {
    cookieName: ACCESS_TOKEN_COOKIE_KEY,
    exists: getCookieValue(ACCESS_TOKEN_COOKIE_KEY) !== null,
  });
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookieToken = getCookieValue(ACCESS_TOKEN_COOKIE_KEY);
  if (cookieToken) {
    return cookieToken;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const legacySession = JSON.parse(raw) as AuthSession;

    if (!legacySession.token) {
      return null;
    }

    return legacySession.token;
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  const token = getAccessToken();
  return token ? createSessionFromToken(token) : null;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export const sampleAccounts = mockUsers.map(({ email, role }) => ({
  email,
  password:
    role === "admin"
      ? "Admin123"
      : role === "curator"
      ? "Curator123"
      : "Explorer123",
  role,
}));
export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function createSessionFromToken(token: string): AuthSession | null {
  const user = extractUserFromToken(token);
  if (!user) {
    return null;
  }

  return {
    ...user,
    token,
  };
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));

  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function getTokenMaxAge(token: string) {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== "number") {
    return undefined;
  }

  const maxAge = payload.exp - Math.floor(Date.now() / 1000);
  return maxAge > 0 ? maxAge : 0;
}

