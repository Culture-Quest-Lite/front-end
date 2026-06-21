import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

export async function forwardAdminRequest(
  request: NextRequest,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  adminPath: string[],
) {
  const backendUrl = buildBackendUrl(request, adminPath);
  const headers = buildBackendHeaders(request);
  const requestBody =
    method === "POST" || method === "PUT" || method === "PATCH"
      ? await request.text()
      : undefined;

  const response = await fetch(backendUrl, {
    method,
    headers,
    cache: "no-store",
    body: requestBody,
  });

  const responseText = await response.text();
  const nextResponse = new NextResponse(responseText, {
    status: response.status,
  });
  const contentType = response.headers.get("content-type");

  if (contentType) {
    nextResponse.headers.set("content-type", contentType);
  }

  nextResponse.headers.set("cache-control", "no-store");
  return nextResponse;
}

function buildBackendUrl(request: NextRequest, adminPath: string[]) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const joinedPath = adminPath.length > 0 ? `/${adminPath.join("/")}` : "";

  return `${normalizedBaseUrl}/api/admin${joinedPath}${request.nextUrl.search}`;
}

function buildBackendHeaders(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  headers.set("accept", "application/json");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (authorization) {
    headers.set("authorization", authorization);
    return headers;
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_KEY)?.value;
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  return headers;
}
