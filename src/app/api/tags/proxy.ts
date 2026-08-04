import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

export async function forwardTagRequest(
  request: NextRequest,
  method: "GET" | "POST" | "PUT" | "DELETE",
) {
  try {
    const backendUrl = buildBackendUrl(request);
    const headers = buildBackendHeaders(request);
    const requestBody =
      method === "POST" || method === "PUT"
        ? await request.arrayBuffer()
        : undefined;

    const response = await fetch(backendUrl, {
      method,
      headers,
      cache: "no-store",
      body:
        requestBody && requestBody.byteLength > 0 ? requestBody : undefined,
    });

    const responseBody = await response.arrayBuffer();
    const nextResponse = new NextResponse(
      responseBody.byteLength > 0 ? responseBody : null,
      {
        status: response.status,
      },
    );
    const contentType = response.headers.get("content-type");

    if (contentType) {
      nextResponse.headers.set("content-type", contentType);
    }

    nextResponse.headers.set("cache-control", "no-store");
    return nextResponse;
  } catch (error) {
    console.error("[tag proxy] Backend tag request failed", error);

    return NextResponse.json(
      {
        message: "Không thể kết nối Tag API backend.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}

function buildBackendUrl(request: NextRequest) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const requestPath = request.nextUrl.pathname.replace(/^\/api\/tags/, "");

  return `${normalizedBaseUrl}/api/tags${requestPath}${request.nextUrl.search}`;
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
