export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

export type ApiRequestOptions = RequestInit & {
  body?: BodyInit | Record<string, unknown>;
};

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const init: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  if (options.body && typeof options.body !== "string") {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...init,
    credentials: "include",
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (body && (body.message || body.error)) ?? response.statusText;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }

  return body as T;
}

export interface AuditEntry {
  id: string;
  who: string;
  action: string;
  target: string;
  at: string;
  before?: string;
  after?: string;
  details?: string;
}

export async function fetchAuditHistory() {
  return apiFetch<AuditEntry[]>("/audit/history");
}

export async function loginUser(credentials: LoginCredentials) {
  return apiFetch<{ token: string; user?: Record<string, unknown> }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function fetchUserProfile(token: string) {
  return apiFetch<{ id: string; email: string; name?: string }>("/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export interface KeycloakTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export async function loginByGoogle(code: string, redirectUri: string) {
  return apiFetch<KeycloakTokenResponse>("/api/auth/login-by-google", {
    method: "POST",
    body: { code, redirectUri },
  });
}

export async function logoutUser(refreshToken: string) {
  return apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}

