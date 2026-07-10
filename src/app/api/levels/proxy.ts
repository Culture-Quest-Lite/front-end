import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.GAMIFICATION_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://3.113.215.65:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

export async function forwardLevelRequest(
  request: NextRequest,
  method: "GET" | "POST" | "PUT" | "DELETE",
  levelPath: string[] = [],
) {
  const requestBody =
    method === "POST" || method === "PUT"
      ? await request.arrayBuffer()
      : undefined;
  const response = await fetch(buildBackendUrl(request, levelPath), {
    method,
    headers: buildBackendHeaders(request),
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

function buildBackendUrl(request: NextRequest, levelPath: string[]) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const joinedPath =
    levelPath.length > 0
      ? `/${levelPath.map((segment) => encodeURIComponent(segment)).join("/")}`
      : "";

  return `${normalizedBaseUrl}/api/gamification/levels${joinedPath}${request.nextUrl.search}`;
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
