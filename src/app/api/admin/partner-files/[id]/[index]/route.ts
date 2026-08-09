import { NextRequest, NextResponse } from "next/server";

/**
 * Stream giấy tờ / ảnh cửa hàng của một đăng ký partner.
 *
 * Trình duyệt chỉ biết `/api/admin/partner-files/{id}/{index}`; URL S3 thật
 * được phân giải tại server và không bao giờ lộ ra client (kể cả trong DOM hay
 * tab Network). Quyền truy cập vẫn do backend quyết định: route này gọi lại
 * `GET /api/admin/subscriptions` bằng chính token của người dùng, endpoint đó
 * yêu cầu ROLE_ADMIN nên người không đủ quyền sẽ nhận 401/403 y như cũ.
 *
 * Route tĩnh này được Next ưu tiên hơn catch-all `/api/admin/[...adminPath]`.
 */

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

type RouteContext = {
  params:
    | Promise<{ id: string; index: string }>
    | { id: string; index: string };
};

type RawMedia = { fileUrl?: string };
type RawSubscription = {
  id?: number;
  documentUrl?: string | null;
  medias?: RawMedia[] | null;
};

function buildAuthHeaders(request: NextRequest) {
  const headers = new Headers();
  headers.set("accept", "application/json");

  const authorization = request.headers.get("authorization");
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

function normalizedBaseUrl() {
  return BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
}

/**
 * Thứ tự phải khớp với `sanitizePartnerSubscriptions` trong proxy admin:
 * documentUrl trước, rồi tới từng phần tử medias.
 */
function collectSourceUrls(subscription: RawSubscription) {
  const urls: string[] = [];

  if (
    typeof subscription.documentUrl === "string" &&
    subscription.documentUrl.trim()
  ) {
    urls.push(subscription.documentUrl);
  }

  for (const media of subscription.medias ?? []) {
    if (typeof media?.fileUrl === "string" && media.fileUrl.trim()) {
      urls.push(media.fileUrl);
    }
  }

  return urls;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id, index } = await Promise.resolve(context.params);
  const subscriptionId = Number(id);
  const fileIndex = Number(index);

  if (!Number.isInteger(subscriptionId) || !Number.isInteger(fileIndex) || fileIndex < 0) {
    return NextResponse.json({ message: "Tham số không hợp lệ." }, { status: 400 });
  }

  const listResponse = await fetch(
    `${normalizedBaseUrl()}/api/admin/subscriptions`,
    { headers: buildAuthHeaders(request), cache: "no-store" },
  );

  if (!listResponse.ok) {
    return NextResponse.json(
      { message: "Không xem được hồ sơ đăng ký." },
      { status: listResponse.status },
    );
  }

  let parsed: unknown;
  try {
    parsed = await listResponse.json();
  } catch {
    return NextResponse.json(
      { message: "Dữ liệu hồ sơ không hợp lệ." },
      { status: 502 },
    );
  }

  const items: RawSubscription[] = Array.isArray(parsed)
    ? (parsed as RawSubscription[])
    : Array.isArray((parsed as { content?: unknown })?.content)
      ? (parsed as { content: RawSubscription[] }).content
      : [];

  const subscription = items.find((item) => item.id === subscriptionId);

  if (!subscription) {
    return NextResponse.json({ message: "Không tìm thấy hồ sơ." }, { status: 404 });
  }

  const sourceUrl = collectSourceUrls(subscription)[fileIndex];

  if (!sourceUrl) {
    return NextResponse.json({ message: "Không tìm thấy tệp." }, { status: 404 });
  }

  const fileResponse = await fetch(sourceUrl, { cache: "no-store" });

  if (!fileResponse.ok || !fileResponse.body) {
    return NextResponse.json(
      { message: "Không tải được tệp đính kèm." },
      { status: 502 },
    );
  }

  const headers = new Headers();
  headers.set(
    "content-type",
    fileResponse.headers.get("content-type") ?? "application/octet-stream",
  );
  // inline: mở ngay trong tab hiện tại thay vì tải xuống.
  headers.set("content-disposition", "inline");
  headers.set("cache-control", "private, max-age=60");

  const contentLength = fileResponse.headers.get("content-length");
  if (contentLength) {
    headers.set("content-length", contentLength);
  }

  return new NextResponse(fileResponse.body, { status: 200, headers });
}
