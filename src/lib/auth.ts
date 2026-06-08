export type Role = "admin" | "curator";

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
  refreshToken?: string;
}

const STORAGE_KEY = "culture-quest-auth-session";

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

      const { password, ...session } = user;
      resolve(session);
    }, 500);
  });
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const sampleAccounts = mockUsers.map(({ email, role }) => ({
  email,
  password: role === "admin" ? "Admin123" : "Curator123",
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

export function createSessionFromToken(token: string, refreshToken?: string): AuthSession | null {
  const payload = parseJwt(token);
  if (!payload) return null;

  const realmRoles: string[] = payload.realm_access?.roles || [];
  let role: Role | null = null;

  if (realmRoles.includes("ADMIN")) {
    role = "admin";
  } else if (realmRoles.includes("CURATOR")) {
    role = "curator";
  }

  if (!role) {
    return null;
  }

  return {
    id: payload.sub || "",
    email: payload.email || "",
    name: payload.name || payload.preferred_username || "",
    role,
    token,
    refreshToken,
  };
}

