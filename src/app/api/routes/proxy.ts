import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.ROUTE_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://api.culturequestlite.com";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type RouteMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function forwardRouteRequest(
  request: NextRequest,
  method: RouteMethod,
  routePath: string[] = [],
) {
  try {
    const headers = buildBackendHeaders(request);
    const requestBody = shouldForwardBody(method)
      ? await request.arrayBuffer()
      : undefined;

    const backendUrl = buildBackendUrl(request, method, routePath);
    const response = await fetch(backendUrl, {
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

    copyResponseHeader(response, nextResponse, "content-type");
    nextResponse.headers.set("cache-control", "no-store");
    return nextResponse;
  } catch (error) {
    console.error("[route proxy] Backend route request failed", error);

    return NextResponse.json(
      {
        message: "Không thể kết nối Route API backend.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}

function shouldForwardBody(method: RouteMethod) {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

function buildBackendUrl(
  request: NextRequest,
  method: RouteMethod,
  routePath: string[],
) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;

  const joinedPath =
    routePath.length > 0
      ? `/${routePath.map((segment) => encodeURIComponent(segment)).join("/")}`
      : "";

  const routeBasePath =
    method === "POST" && routePath.length === 0 ? "/api/v2/routes" : "/api/v1/routes";

  return `${normalizedBaseUrl}${routeBasePath}${joinedPath}${request.nextUrl.search}`;
}

function buildBackendHeaders(request: NextRequest) {
  const headers = new Headers();

  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  headers.set("accept", request.headers.get("accept") ?? "application/json");

  // Giữ nguyên boundary khi frontend gửi FormData/multipart.
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

function copyResponseHeader(
  source: Response,
  target: NextResponse,
  headerName: string,
) {
  const value = source.headers.get(headerName);
  if (value) {
    target.headers.set(headerName, value);
  }
}
