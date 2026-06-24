import { NextRequest, NextResponse } from "next/server";

/**
 * Generic proxy cho /api/partner/* — cùng pattern với
 * src/app/api/admin/[...path]/route.ts và src/app/api/tags/route.ts.
 *
 * Tránh lỗi CORS khi gọi trực tiếp sang backend, và tự động đính kèm
 * "Authorization: Bearer <token>" từ cookie "culture-quest-access-token".
 */

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type PartnerMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function forwardPartnerRequest(request: NextRequest, method: PartnerMethod) {
  const backendUrl = buildBackendUrl(request);
  const headers = buildBackendHeaders(request);
  const requestBody =
    method === "POST" || method === "PUT" || method === "PATCH"
      ? await request.text()
      : undefined;

  const response = await fetch(backendUrl, {
    method,
    headers,
    cache: "no-store",
    body: requestBody && requestBody.length > 0 ? requestBody : undefined,
  });

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

function buildBackendUrl(request: NextRequest) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;

  const requestPath = request.nextUrl.pathname.replace(/^\/api\/partner/, "");

  return `${normalizedBaseUrl}/api/partner${requestPath}${request.nextUrl.search}`;
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

export async function GET(request: NextRequest) {
  return forwardPartnerRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return forwardPartnerRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return forwardPartnerRequest(request, "PUT");
}

export async function PATCH(request: NextRequest) {
  return forwardPartnerRequest(request, "PATCH");
}

export async function DELETE(request: NextRequest) {
  return forwardPartnerRequest(request, "DELETE");
}