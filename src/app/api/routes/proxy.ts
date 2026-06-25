import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.ROUTE_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://13.158.40.56:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type RouteMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function forwardRouteRequest(
  request: NextRequest,
  method: RouteMethod,
  routePath: string[] = [],
) {
  const headers = buildBackendHeaders(request);
  const requestBody = method === "POST" || method === "PUT" ? await request.arrayBuffer() : undefined;

  const response = await fetch(buildBackendUrl(request, routePath), {
    method,
    headers,
    cache: "no-store",
    body: requestBody && requestBody.byteLength > 0 ? requestBody : undefined,
  });

  const responseBody = await response.arrayBuffer();
  const nextResponse = new NextResponse(
    responseBody.byteLength > 0 ? responseBody : null,
    { status: response.status },
  );

  const contentType = response.headers.get("content-type");
  if (contentType) {
    nextResponse.headers.set("content-type", contentType);
  }

  nextResponse.headers.set("cache-control", "no-store");
  return nextResponse;
}

function buildBackendUrl(request: NextRequest, routePath: string[]) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const joinedPath = routePath.length > 0 ? `/${routePath.map(encodeURIComponent).join("/")}` : "";

  return `${normalizedBaseUrl}/api/v1/routes${joinedPath}${request.nextUrl.search}`;
}

function buildBackendHeaders(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  headers.set("accept", request.headers.get("accept") ?? "application/json");
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
