export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object;
  sameOrigin?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const { sameOrigin = false, ...requestOptions } = options;
  const url = path.startsWith("http")
    ? path
    : sameOrigin
      ? path
      : `${API_BASE_URL}${path}`;
  const isAuthRequest = path.startsWith("/api/auth/");
  const headers = new Headers(requestOptions.headers);
  const isFormDataBody =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const init: RequestInit = {
    method: requestOptions.method,
    headers,
    cache: requestOptions.cache,
    credentials: requestOptions.credentials,
    integrity: requestOptions.integrity,
    keepalive: requestOptions.keepalive,
    mode: requestOptions.mode,
    redirect: requestOptions.redirect,
    referrer: requestOptions.referrer,
    referrerPolicy: requestOptions.referrerPolicy,
    signal: requestOptions.signal ?? controller.signal,
  };

  if (requestOptions.body !== undefined) {
    if (isFormDataBody) {
      init.body = requestOptions.body as FormData;
    } else if (typeof requestOptions.body === "string") {
      init.body = requestOptions.body;
    } else {
      init.body = JSON.stringify(requestOptions.body);
    }
  }

  if (isAuthRequest) {
    console.debug("[apiFetch] Auth request", {
      url,
      method: init.method ?? "GET",
      hasBody: !!init.body,
      headers: init.headers,
    });
  }
  console.log("[apiFetch URL]", {
  path,
  url,
  sameOrigin,
  method: init.method,
  isFormDataBody,
});
  try {
    const response = await fetch(url, {
      ...init,
      credentials: "include",
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") ?? "";
    const responseText = await response.text();
    const authProxyVersion = response.headers.get("x-auth-proxy-version");

    let body: unknown = null;
    const trimmedText = responseText.trim();
    const jsonText = trimmedText.replace(/^\uFEFF/, "");
    const shouldParseJson =
      contentType.includes("application/json") ||
      contentType.includes("+json") ||
      jsonText.startsWith("{") ||
      jsonText.startsWith("[");

    if (shouldParseJson) {
      try {
        body = jsonText ? JSON.parse(jsonText) : {};
      } catch (parseError) {
        console.error("[apiFetch] Failed to parse JSON response", {
          url,
          status: response.status,
          contentType,
          responseText,
          parseError,
        });
        throw new Error(`Invalid JSON response from ${url}`);
      }
    } else {
      body = responseText;
    }

    if (!response.ok) {
      const errorBody = body as { message?: unknown; error?: unknown } | null;
      const message =
        (errorBody &&
          typeof errorBody === "object" &&
          (errorBody.message || errorBody.error)) ??
        (typeof body === "string" && body.trim() !== ""
          ? body
          : response.statusText);
      const logDetails = {
        url,
        status: response.status,
        body,
        authProxyVersion,
        contentType,
      };
      if (response.status >= 500) {
        console.error("[apiFetch] Request failed", logDetails);
      } else {
        console.warn("[apiFetch] Request failed", logDetails);
      }

      const error = new Error(
        typeof message === "string" ? message : "Request failed",
      ) as Error & {
        status?: number;
        responseBody?: unknown;
        url?: string;
      };
      error.status = response.status;
      error.responseBody = body;
      error.url = url;
      if (authProxyVersion) {
        (error as Error & { authProxyVersion?: string }).authProxyVersion =
          authProxyVersion;
      }
      throw error;
    }

    return body as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new Error(
        `Request timeout after 15s: ${url}`,
      ) as Error & {
        status?: number;
        url?: string;
      };
      timeoutError.url = url;
      throw timeoutError;
    }

    throw error;
  }
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
  return apiFetch<KeycloakTokenResponse>("/api/auth/login", {
    method: "POST",
    headers: {
      "X-Client-Type": "web",
    },
    body: credentials,
    sameOrigin: true,
  });
}

export async function fetchUserProfile(token: string) {
  return apiFetch<{ id: string; email: string; name?: string }>(
    "/auth/profile",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export interface KeycloakTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export async function loginByGoogle(code: string, redirectUri: string) {
  return apiFetch<KeycloakTokenResponse>("/api/auth/login-by-google", {
    method: "POST",
    headers: {
      "X-Client-Type": "web",
    },
    body: { code, redirectUri },
    sameOrigin: true,
  });
}

export async function loginByFacebook(code: string, redirectUri: string) {
  return apiFetch<KeycloakTokenResponse>("/api/auth/login-by-facebook", {
    method: "POST",
    headers: {
      "X-Client-Type": "web",
    },
    body: { code, redirectUri },
    sameOrigin: true,
  });
}

export async function logoutUser() {
  return apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
    headers: {
      "X-Client-Type": "web",
    },
    sameOrigin: true,
  });
}
