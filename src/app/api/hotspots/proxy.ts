import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.HOTSPOT_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://api.culturequestlite.com";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type HotspotMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function forwardHotspotRequest(
  request: NextRequest,
  method: HotspotMethod,
  hotspotPath: string[] = [],
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
    (init as RequestInit & { duplex: "half" }).duplex = "half";
  }

  const backendUrl = buildBackendUrl(request, hotspotPath);
  let response: Response;

  try {
    response = await fetch(backendUrl, init);
  } catch (error) {
    console.error("[hotspot proxy] upstream fetch failed", {
      method,
      backendUrl,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        message: "Không thể kết nối tới dịch vụ hotspot.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }

  const responseText = await response.text();
  if (!response.ok) {
    console.error("[hotspot proxy] upstream responded with error", {
      method,
      backendUrl,
      status: response.status,
      responseText,
    });
  }

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
  const joinedPath =
    hotspotPath.length > 0
      ? `/${hotspotPath.map((segment) => encodeURIComponent(segment)).join("/")}`
      : "";

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
