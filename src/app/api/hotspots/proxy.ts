import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.HOTSPOT_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://api.culturequestlite.com";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type HotspotMethod = "GET" | "POST" | "PUT" | "DELETE";

const STATIC_MEDIA_HOSTS = ["culture-quest-lite.s3.ap-northeast-1.amazonaws.com"];
const BACKEND_HOSTS = new Set(
  [
    process.env.HOTSPOT_API_BASE_URL,
    process.env.API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ]
    .map((value) => extractHost(value))
    .filter((value): value is string => Boolean(value)),
);
const ALLOWED_MEDIA_HOSTS = new Set([
  ...STATIC_MEDIA_HOSTS,
  ...Array.from(BACKEND_HOSTS),
]);
const MEDIA_HEADERS_TO_COPY = [
  "content-type",
  "content-length",
  "content-disposition",
  "etag",
  "last-modified",
];

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

export async function proxyHotspotMediaRequest(
  request: NextRequest,
  mediaUrl: string,
) {
  const normalizedMediaUrl = mediaUrl.trim();

  if (!normalizedMediaUrl) {
    return NextResponse.json(
      { message: "Thiếu tham số mediaUrl của media." },
      { status: 400 },
    );
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(normalizedMediaUrl);
  } catch {
    return NextResponse.json(
      { message: "Đường dẫn media không hợp lệ." },
      { status: 400 },
    );
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json(
      { message: "Chỉ hỗ trợ media qua HTTP hoặc HTTPS." },
      { status: 400 },
    );
  }

  if (!ALLOWED_MEDIA_HOSTS.has(targetUrl.host)) {
    return NextResponse.json(
      { message: `Media host chưa được cho phép: ${targetUrl.host}` },
      { status: 403 },
    );
  }

  const headers = new Headers({ accept: "*/*" });
  const authorization = request.headers.get("authorization");

  if (BACKEND_HOSTS.has(targetUrl.host)) {
    if (authorization) {
      headers.set("authorization", authorization);
    } else {
      const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_KEY)?.value;
      if (accessToken) {
        headers.set("authorization", `Bearer ${accessToken}`);
      }
    }
  }

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      headers,
      cache: "no-store",
    });
  } catch (error) {
    console.error("[hotspot media proxy] upstream fetch failed", {
      mediaUrl: targetUrl.toString(),
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { message: "Không thể tải media từ hệ thống lưu trữ." },
      { status: 502 },
    );
  }

  const responseBuffer = await response.arrayBuffer();
  const nextResponse = new NextResponse(responseBuffer, {
    status: response.status,
  });

  MEDIA_HEADERS_TO_COPY.forEach((headerName) => {
    const value = response.headers.get(headerName);
    if (value) {
      nextResponse.headers.set(headerName, value);
    }
  });

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

function extractHost(value?: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  try {
    return new URL(normalizedValue).host;
  } catch {
    return null;
  }
}
