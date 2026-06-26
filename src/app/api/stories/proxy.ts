import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://13.158.40.56:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type StoriesMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function forwardStoriesRequest(
  request: NextRequest,
  method: StoriesMethod,
  pathSegments?: string[],
) {
  const headers = buildBackendHeaders(request);
  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  const requestBody =
    method === "POST" || method === "PUT"
      ? await request.arrayBuffer()
      : undefined;

  if (requestBody !== undefined) {
    init.body = requestBody;
    // Next.js requires duplex for request streams when forwarding bodies.
    // See https://nextjs.org/docs/app/api-reference/functions/request#duplex
    (init as RequestInit & { duplex: "half" }).duplex = "half";
  }

  const response = await fetch(buildBackendUrl(request, pathSegments), init);

  const responseText = await response.text();
  const nextResponse = new NextResponse(
    responseText.length > 0 ? responseText : null,
    { status: response.status },
  );

  const contentType = response.headers.get("content-type");
  if (contentType) {
    nextResponse.headers.set("content-type", contentType);
  }

  nextResponse.headers.set("cache-control", "no-store");
  return nextResponse;
}

function buildBackendUrl(request: NextRequest, pathSegments?: string[]) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;

  const path =
    pathSegments && pathSegments.length > 0
      ? `/${pathSegments.map((segment) => encodeURIComponent(segment)).join("/")}`
      : "";

  return `${normalizedBaseUrl}/api/v1/stories${path}${request.nextUrl.search}`;
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
