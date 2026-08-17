import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type ReviewMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function forwardReviewsRequest(
  request: NextRequest,
  method: ReviewMethod,
  reviewsPath: string[] = [],
) {
  try {
    const headers = buildBackendHeaders(request);
    const requestBody = shouldForwardBody(method)
      ? await request.arrayBuffer()
      : undefined;

    const backendUrl = buildBackendUrl(request, reviewsPath);
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

    const contentType = response.headers.get("content-type");
    if (contentType) {
      nextResponse.headers.set("content-type", contentType);
    }

    nextResponse.headers.set("cache-control", "no-store");
    return nextResponse;
  } catch (error) {
    console.error("[reviews proxy] Backend review request failed", error);

    return NextResponse.json(
      {
        message: "Không thể kết nối Review API backend.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}

function shouldForwardBody(method: ReviewMethod) {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

function buildBackendUrl(request: NextRequest, reviewsPath: string[]) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;

  const joinedPath =
    reviewsPath.length > 0
      ? `/${reviewsPath.map((segment) => encodeURIComponent(segment)).join("/")}`
      : "";

  return `${normalizedBaseUrl}/api/v1/reviews${joinedPath}${request.nextUrl.search}`;
}

function buildBackendHeaders(request: NextRequest) {
  const headers = new Headers();

  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  headers.set("accept", request.headers.get("accept") ?? "application/json");

  // Giữ nguyên boundary khi frontend gửi FormData/multipart (tạo/sửa đánh giá).
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
