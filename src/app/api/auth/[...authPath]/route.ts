import http from "node:http";
import https from "node:https";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";
const ACCESS_TOKEN_ROUTE_NAMES = new Set([
  "login",
  "login-by-google",
  "login-by-facebook",
]);
/**
 * Các endpoint dưới /api/auth vẫn yêu cầu JWT ở backend (không nằm trong
 * PUBLIC_AUTH_ENDPOINTS của SecurityConfig), nên proxy phải gắn access token.
 */
const AUTHENTICATED_ROUTE_NAMES = new Set(["change-password"]);
const AUTH_PROXY_VERSION = "2026-06-19-node-http-retry-1";

type AuthRouteContext = {
  params: Promise<{ authPath: string[] }> | { authPath: string[] };
};

export async function POST(request: NextRequest, context: AuthRouteContext) {
  return proxyAuthRequest(request, context);
}

async function proxyAuthRequest(request: NextRequest, context: AuthRouteContext) {
  const { authPath } = await Promise.resolve(context.params);
  const backendUrl = buildBackendUrl(authPath, request);
  const backendRequest = await createBackendRequest(request, authPath);
  const backendResponse = await sendBackendRequestWithRetry(
    backendUrl,
    request.method,
    authPath,
    backendRequest
  );
  const responseText = backendResponse.body;
  const nextResponse = new NextResponse(responseText, {
    status: backendResponse.statusCode,
    headers: buildForwardHeaders(backendResponse.headers),
  });
  nextResponse.headers.set("x-auth-proxy-version", AUTH_PROXY_VERSION);

  if (backendResponse.statusCode < 200 || backendResponse.statusCode >= 300) {
    logAuthProxyFailure(authPath, backendUrl, backendRequest, responseText);
  }

  if (backendResponse.statusCode >= 200 && backendResponse.statusCode < 300) {
    syncAccessTokenCookie(nextResponse, authPath, responseText, request);

    if (authPath[0] === "logout") {
      clearAccessTokenCookie(nextResponse, request);
    }
  }

  for (const setCookieHeader of backendResponse.setCookies) {
    nextResponse.headers.append(
      "set-cookie",
      normalizeSetCookieHeader(setCookieHeader, request)
    );
  }

  return nextResponse;
}

function buildBackendUrl(authPath: string[], request: NextRequest) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const joinedPath = authPath.join("/");

  return `${normalizedBaseUrl}/api/auth/${joinedPath}${request.nextUrl.search}`;
}

function buildBackendHeaders(request: NextRequest, authPath: string[], body?: string) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  } else if (body && shouldNormalizeJsonBody(authPath)) {
    headers.set("content-type", "application/json");
  }

  headers.set("accept", "application/json");
  headers.set("x-client-type", request.headers.get("x-client-type") ?? "web");
  headers.set("connection", "close");

  const origin = request.headers.get("origin");
  if (origin) {
    headers.set("origin", origin);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    headers.set("referer", referer);
  }

  if (authPath[0] === "logout") {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (refreshToken) {
      headers.set("cookie", `refresh_token=${refreshToken}`);
    }
  }

  if (AUTHENTICATED_ROUTE_NAMES.has(authPath[0])) {
    const authorization = request.headers.get("authorization");
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_KEY)?.value;

    if (authorization) {
      headers.set("authorization", authorization);
    } else if (accessToken) {
      headers.set("authorization", `Bearer ${accessToken}`);
    }
  }

  if (body) {
    headers.set("content-length", Buffer.byteLength(body).toString());
  }

  return headers;
}

function buildForwardHeaders(headers: Headers) {
  const forwardedHeaders = new Headers();
  const contentType = headers.get("content-type");

  if (contentType) {
    forwardedHeaders.set("content-type", contentType);
  }

  forwardedHeaders.set("cache-control", "no-store");
  return forwardedHeaders;
}

async function readRequestBody(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const rawBody = await request.text();
  return rawBody.length > 0 ? rawBody : undefined;
}

async function createBackendRequest(request: NextRequest, authPath: string[]) {
  const rawBody = await readRequestBody(request);
  const body = normalizeRequestBody(authPath, rawBody);
  const headers = buildBackendHeaders(request, authPath, body);

  return { headers, body };
}

function normalizeRequestBody(authPath: string[], rawBody?: string) {
  if (!rawBody) {
    return undefined;
  }

  if (!shouldNormalizeJsonBody(authPath)) {
    return rawBody;
  }

  try {
    const parsedBody = JSON.parse(rawBody) as Record<string, unknown>;

    if (authPath[0] === "login") {
      const username =
        typeof parsedBody.username === "string" ? parsedBody.username.trim() : "";
      const password =
        typeof parsedBody.password === "string" ? parsedBody.password : "";

      return JSON.stringify({ username, password });
    }

    return JSON.stringify(parsedBody);
  } catch {
    return rawBody;
  }
}

function shouldNormalizeJsonBody(authPath: string[]) {
  return new Set([
    "login",
    "register",
    "verify-otp",
    "resend-otp",
    "forgot-password",
    "reset-password",
    "change-password",
    "login-by-google",
    "login-by-facebook",
  ]).has(authPath[0]);
}

function syncAccessTokenCookie(
  response: NextResponse,
  authPath: string[],
  responseText: string,
  request: NextRequest
) {
  if (!ACCESS_TOKEN_ROUTE_NAMES.has(authPath[0])) {
    return;
  }

  try {
    const payload = JSON.parse(responseText) as {
      accessToken?: string;
      expiresIn?: number;
    };

    if (typeof payload.accessToken !== "string" || payload.accessToken.length === 0) {
      return;
    }

    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE_KEY,
      value: payload.accessToken,
      httpOnly: false,
      maxAge:
        typeof payload.expiresIn === "number"
          ? payload.expiresIn
          : getTokenMaxAge(payload.accessToken),
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  } catch {
    // Ignore invalid JSON payloads and return the backend response as-is.
  }
}

function clearAccessTokenCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_KEY,
    value: "",
    httpOnly: false,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
}

function normalizeSetCookieHeader(setCookieHeader: string, request: NextRequest) {
  if (request.nextUrl.protocol === "https:") {
    return setCookieHeader;
  }

  const hostname = request.nextUrl.hostname;
  const isLocalhost =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  if (!isLocalhost) {
    return setCookieHeader;
  }

  return setCookieHeader.replace(/;\s*Secure/gi, "");
}

function getTokenMaxAge(token: string) {
  try {
    const payload = parseJwt(token);
    if (!payload || typeof payload.exp !== "number") {
      return undefined;
    }

    const maxAge = payload.exp - Math.floor(Date.now() / 1000);
    return maxAge > 0 ? maxAge : 0;
  } catch {
    return undefined;
  }
}

function parseJwt(token: string) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const normalizedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const jsonPayload = Buffer.from(normalizedBase64, "base64").toString("utf8");

  return JSON.parse(jsonPayload) as { exp?: number };
}

function logAuthProxyFailure(
  authPath: string[],
  backendUrl: string,
  backendRequest: { headers: Headers; body?: string },
  responseText: string
) {
  const sanitizedPayload = sanitizeRequestBody(authPath, backendRequest.body);

  console.error("[auth-proxy] Backend request failed", {
    path: authPath.join("/"),
    backendUrl,
    clientType: backendRequest.headers.get("x-client-type"),
    payload: sanitizedPayload,
    responseText,
  });
}

function sanitizeRequestBody(authPath: string[], body?: string) {
  if (!body) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;

    if (authPath[0] === "login") {
      return {
        username: parsed.username,
        passwordLength:
          typeof parsed.password === "string" ? parsed.password.length : null,
      };
    }

    if ("password" in parsed) {
      parsed.password =
        typeof parsed.password === "string"
          ? `[hidden:${parsed.password.length}]`
          : "[hidden]";
    }

    if ("currentPassword" in parsed) {
      parsed.currentPassword =
        typeof parsed.currentPassword === "string"
          ? `[hidden:${parsed.currentPassword.length}]`
          : "[hidden]";
    }

    if ("oldPassword" in parsed) {
      parsed.oldPassword =
        typeof parsed.oldPassword === "string"
          ? `[hidden:${parsed.oldPassword.length}]`
          : "[hidden]";
    }

    if ("newPassword" in parsed) {
      parsed.newPassword =
        typeof parsed.newPassword === "string"
          ? `[hidden:${parsed.newPassword.length}]`
          : "[hidden]";
    }

    if ("confirmPassword" in parsed) {
      parsed.confirmPassword =
        typeof parsed.confirmPassword === "string"
          ? `[hidden:${parsed.confirmPassword.length}]`
          : "[hidden]";
    }

    return parsed;
  } catch {
    return "[non-json-body]";
  }
}

async function sendBackendRequest(
  backendUrl: string,
  method: string,
  backendRequest: { headers: Headers; body?: string }
) {
  const targetUrl = new URL(backendUrl);
  const transport = targetUrl.protocol === "https:" ? https : http;

  return new Promise<{
    statusCode: number;
    body: string;
    headers: Headers;
    setCookies: string[];
  }>((resolve, reject) => {
    const req = transport.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        method,
        headers: Object.fromEntries(backendRequest.headers.entries()),
        agent: false,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        res.on("end", () => {
          const headers = new Headers();
          const setCookies = Array.isArray(res.headers["set-cookie"])
            ? res.headers["set-cookie"]
            : [];

          for (const [headerName, headerValue] of Object.entries(res.headers)) {
            if (!headerValue || headerName === "set-cookie") {
              continue;
            }

            if (Array.isArray(headerValue)) {
              headers.set(headerName, headerValue.join(", "));
            } else {
              headers.set(headerName, headerValue);
            }
          }

          resolve({
            statusCode: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString("utf8"),
            headers,
            setCookies,
          });
        });
      }
    );

    req.on("error", reject);

    if (backendRequest.body) {
      req.write(backendRequest.body);
    }

    req.end();
  });
}

async function sendBackendRequestWithRetry(
  backendUrl: string,
  method: string,
  authPath: string[],
  backendRequest: { headers: Headers; body?: string }
) {
  const firstAttempt = await sendBackendRequest(backendUrl, method, backendRequest);

  if (!shouldRetryAuthRequest(authPath, firstAttempt.statusCode)) {
    return firstAttempt;
  }

  console.warn("[auth-proxy] Retrying backend request after 5xx", {
    path: authPath.join("/"),
    backendUrl,
    firstStatus: firstAttempt.statusCode,
    version: AUTH_PROXY_VERSION,
  });

  await delay(75);
  return sendBackendRequest(backendUrl, method, backendRequest);
}

function shouldRetryAuthRequest(authPath: string[], statusCode: number) {
  return authPath[0] === "login" && statusCode >= 500;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
