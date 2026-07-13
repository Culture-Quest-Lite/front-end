import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.HOTSPOT_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://3.113.215.65:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type HotspotMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function forwardHotspotRequest(
  request: NextRequest,
  method: HotspotMethod,
  hotspotPath: string[] = [],
) {
  const headers = buildBackendHeaders(request);
  const requestBody =
    method === "POST" || method === "PUT"
      ? await request.arrayBuffer()
      : undefined;
  const response = await fetch(buildBackendUrl(request, hotspotPath), {
    method,
    headers,
    cache: "no-store",
    body: requestBody,
  });

  const responseText = await response.text();
  const nextResponse = new NextResponse(
    responseText.length > 0 ? responseText : null,
    { status: response.status },
  );
  const contentType = response.headers.get("content-type");

  if (contentType) {
    nextResponse.headers.set("content-type", contentType);
  } else if (
    responseText.trim().startsWith("{") ||
    responseText.trim().startsWith("[")
  ) {
    nextResponse.headers.set("content-type", "application/json");
  }

  nextResponse.headers.set("cache-control", "no-store");
  return nextResponse;
}

function buildBackendUrl(request: NextRequest, hotspotPath: string[]) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const joinedPath = hotspotPath.length > 0 ? `/${hotspotPath.join("/")}` : "";

  return `${normalizedBaseUrl}/api/v1/hotspots${joinedPath}${request.nextUrl.search}`;
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
