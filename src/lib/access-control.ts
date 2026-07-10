export type AppRole = "admin" | "curator" | "explorer" | "partner";

export interface AccessTokenSession {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type JwtPayload = {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  role?: string;
  realm_access?: {
    roles?: unknown;
  };
  resource_access?: Record<string, { roles?: unknown }>;
};

export function parseJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractUserFromToken(
  accessToken: string,
): AccessTokenSession | null {
  const decoded = parseJwt(accessToken);
  if (!decoded) {
    return null;
  }

  return {
    id: decoded.sub || decoded.id || "",
    email: decoded.email || "",
    name: decoded.preferred_username || decoded.name || "",
    role: resolveRole(decoded),
  };
}

export function getRedirectPathForRole(role: AppRole | null | undefined) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "curator") {
    return "/curator";
  }

  if (role === "partner") {
    return "/partner";
  }

  return null;
}

function resolveRole(decoded: JwtPayload): AppRole {
  let role: AppRole = "explorer";

  if (isStringArray(decoded.realm_access?.roles)) {
    const roles = decoded.realm_access.roles.map((value) => value.toUpperCase());

    if (roles.includes("ADMIN")) {
      return "admin";
    }

    if (roles.includes("CURATOR")) {
      return "curator";
    }

    if (roles.includes("PARTNER")) {
      return "partner";
    }

    if (roles.includes("EXPLORER")) {
      return "explorer";
    }
  }

  if (decoded.resource_access && typeof decoded.resource_access === "object") {
    for (const resource of Object.values(decoded.resource_access)) {
      if (!isStringArray(resource?.roles)) {
        continue;
      }

      const roles = resource.roles.map((value) => value.toUpperCase());

      if (roles.includes("ADMIN")) {
        return "admin";
      }

      if (roles.includes("CURATOR")) {
        role = "curator";
        continue;
      }

      if (roles.includes("PARTNER")) {
        role = "partner";
      }
    }
  }

  if (typeof decoded.role === "string") {
    const directRole = decoded.role.toLowerCase();

    if (directRole === "admin") {
      return "admin";
    }

    if (directRole === "curator") {
      return "curator";
    }

    if (directRole === "partner") {
      return "partner";
    }
  }

  return role;
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  const normalized = `${base64}${"=".repeat(padding)}`;

  if (typeof window === "undefined") {
    return Buffer.from(normalized, "base64").toString("utf-8");
  }

  const binary = globalThis.atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
