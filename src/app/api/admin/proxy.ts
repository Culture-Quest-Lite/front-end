import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

export async function forwardAdminRequest(
  request: NextRequest,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  adminPath: string[],
) {
  const backendUrl = buildBackendUrl(request, adminPath);
  const headers = buildBackendHeaders(request);
  const requestBody =
    method === "POST" || method === "PUT" || method === "PATCH"
      ? await request.text()
      : undefined;

  const response = await fetch(backendUrl, {
    method,
    headers,
    cache: "no-store",
    body: requestBody,
  });

  const responseText = await response.text();
  const contentType = response.headers.get("content-type");

  // Danh sách đăng ký partner chứa link S3 thô (documentUrl / medias[].fileUrl).
  // Thay bằng đường dẫn proxy nội bộ để URL AWS không bao giờ đi tới trình duyệt.
  const body =
    method === "GET" &&
    response.ok &&
    adminPath[0] === "subscriptions" &&
    (contentType ?? "").includes("json")
      ? sanitizePartnerSubscriptions(responseText)
      : responseText;

  const nextResponse = new NextResponse(body, {
    status: response.status,
  });

  if (contentType) {
    nextResponse.headers.set("content-type", contentType);
  }

  nextResponse.headers.set("cache-control", "no-store");
  return nextResponse;
}

type RawMedia = {
  mediaId?: number;
  fileUrl?: string;
  fileName?: string;
  mediaType?: string;
};

type RawSubscription = Record<string, unknown> & {
  id?: number;
  documentUrl?: string | null;
  medias?: RawMedia[] | null;
};

/** Suy ra cách hiển thị từ đuôi file, vì backend không gắn mimeType. */
export function resolveAttachmentKind(url: string): "image" | "pdf" | "other" {
  const path = url.split("?")[0].toLowerCase();

  if (/\.(png|jpe?g|gif|webp|bmp|svg|avif)$/.test(path)) return "image";
  if (path.endsWith(".pdf")) return "pdf";
  return "other";
}

function sanitizePartnerSubscriptions(responseText: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    return responseText;
  }

  const items: RawSubscription[] = Array.isArray(parsed)
    ? (parsed as RawSubscription[])
    : Array.isArray((parsed as { content?: unknown })?.content)
      ? ((parsed as { content: RawSubscription[] }).content)
      : [];

  if (items.length === 0) {
    return responseText;
  }

  for (const item of items) {
    const attachments: {
      index: number;
      name: string;
      kind: "image" | "pdf" | "other";
      previewUrl: string;
    }[] = [];

    const sources: { url: string; name: string }[] = [];

    if (typeof item.documentUrl === "string" && item.documentUrl.trim()) {
      sources.push({ url: item.documentUrl, name: "Giấy tờ xác minh" });
    }

    for (const media of item.medias ?? []) {
      if (typeof media?.fileUrl === "string" && media.fileUrl.trim()) {
        sources.push({
          url: media.fileUrl,
          name: media.fileName?.trim() || `Ảnh cửa hàng ${sources.length + 1}`,
        });
      }
    }

    sources.forEach((source, index) => {
      attachments.push({
        index,
        name: source.name,
        kind: resolveAttachmentKind(source.url),
        previewUrl: `/api/admin/partner-files/${item.id}/${index}`,
      });
    });

    item.attachments = attachments;
    delete item.documentUrl;

    if (Array.isArray(item.medias)) {
      // Giữ metadata nhưng bỏ fileUrl.
      item.medias = item.medias.map((media) => ({
        mediaId: media?.mediaId,
        fileName: media?.fileName,
        mediaType: media?.mediaType,
      }));
    }
  }

  return JSON.stringify(parsed);
}

function buildBackendUrl(request: NextRequest, adminPath: string[]) {
  const normalizedBaseUrl = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const joinedPath = adminPath.length > 0 ? `/${adminPath.join("/")}` : "";

  return `${normalizedBaseUrl}/api/admin${joinedPath}${request.nextUrl.search}`;
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
