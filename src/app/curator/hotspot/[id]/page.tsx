import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Compass,
  ExternalLink,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import {
  buildGoogleMapsUrl,
  getHotspotBySlug,
  getHotspotProfile,
  hotspotItems,
  type HotspotItem,
  type HotspotProfile,
} from "@/data/hotspots";
import { buildTagToken } from "@/lib/tags";
import type {
  BackendHotspot,
  BackendStory,
  BackendStoryMedia,
  BackendUser,
} from "@/services/api";
import { HotspotDetailNetworkSync } from "./HotspotDetailNetworkSync";
import { HotspotMediaPanel } from "./HotspotMediaPanel";

const BACKEND_API_BASE_URL =
  process.env.HOTSPOT_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://3.113.215.65:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

const HOTSPOT_STATUS_META: Record<string, { label: string; style: string }> = {
  ACTIVE: {
    label: "Đã xuất bản",
    style: "bg-emerald-600/95 text-white",
  },
  APPROVED: {
    label: "Đã xuất bản",
    style: "bg-emerald-600/95 text-white",
  },
  ARCHIVED: {
    label: "Đã lưu trữ",
    style: "bg-slate-500/95 text-white",
  },
  DELETED: {
    label: "Đã lưu trữ",
    style: "bg-slate-500/95 text-white",
  },
  DRAFT: {
    label: "Bản nháp",
    style: "bg-slate-500/95 text-white",
  },
  INACTIVE: {
    label: "Đã lưu trữ",
    style: "bg-slate-500/95 text-white",
  },
  PENDING: {
    label: "Chờ duyệt",
    style: "bg-amber-500/95 text-slate-900",
  },
  PUBLISHED: {
    label: "Đã xuất bản",
    style: "bg-emerald-600/95 text-white",
  },
  REJECTED: {
    label: "Bị từ chối",
    style: "bg-red-600/95 text-white",
  },
  SUBMITTED: {
    label: "Chờ duyệt",
    style: "bg-amber-500/95 text-slate-900",
  },
};

const STORY_STATUS_META: Record<string, { label: string; style: string }> = {
  DRAFT: {
    label: "Bản nháp",
    style: "border border-slate-200 bg-slate-100 text-slate-700",
  },
  PUBLISHED: {
    label: "Đã xuất bản",
    style: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  REJECTED: {
    label: "Bị từ chối",
    style: "border border-rose-200 bg-rose-50 text-rose-700",
  },
  REVIEW: {
    label: "Chờ duyệt",
    style: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  SUBMITTED: {
    label: "Chờ duyệt",
    style: "border border-amber-200 bg-amber-50 text-amber-700",
  },
};

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xl font-normal text-slate-950">{value}</p>
      <p className="cq-label mt-1">{label}</p>
    </div>
  );
}

type EditorialCard = {
  key: string;
  label: string;
  value: string;
  icon?: ReactNode;
};

function isEditorialCard(item: EditorialCard | null): item is EditorialCard {
  return item !== null;
}

export default async function HotspotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotspotId = parseHotspotId(id);

  // If numeric ID, use it; otherwise treat as slug
  const detailContent = await renderHotspotDetailPage({
    slug: hotspotId ? null : id,
    hotspotId: hotspotId,
  });

  return detailContent;
}

export async function renderHotspotDetailPage({
  slug,
  hotspotId,
}: {
  slug?: string | null;
  hotspotId?: number | null;
}) {
  const backendHotspot = hotspotId
    ? await getHotspotFromBackend(hotspotId)
    : null;
  const creatorDisplayName =
    typeof backendHotspot?.createByUserId === "number"
      ? await getCreatorDisplayName(backendHotspot.createByUserId)
      : "";
  const fallbackHotspot = resolveFallbackHotspot(slug, backendHotspot);

  if (!fallbackHotspot && !backendHotspot) {
    notFound();
  }

  const hotspot = buildDetailHotspot(
    fallbackHotspot,
    backendHotspot,
    creatorDisplayName,
  );
  const profile = buildDetailProfile(
    fallbackHotspot ? getHotspotProfile(fallbackHotspot.slug) : null,
    fallbackHotspot,
    backendHotspot,
  );
  const googleMapsUrl = buildGoogleMapsUrl(hotspot.address);
  const effectiveHotspotId = hotspotId ?? backendHotspot?.hotspotId ?? null;
  const isBackendDetail = Boolean(backendHotspot);
  const historyInformation = backendHotspot?.historyInformation?.trim() || "";
  const hotspotStories = resolveHotspotStories(backendHotspot?.stories);
  const summaryMetrics = isBackendDetail
    ? buildBackendMetrics(backendHotspot)
    : [
        { value: profile.stats.checkIns, label: "Check-in 30 ngày" },
        { value: profile.stats.saves, label: "Đã lưu" },
        { value: profile.stats.routes, label: "Tuyến chứa điểm" },
      ].filter((item) => item.value);
  const editorialCards: Array<EditorialCard | null> = [
    hotspot.author
      ? {
          key: "author",
          label: "Người phụ trách",
          value: hotspot.author,
        }
      : null,

    hotspot.date
      ? {
          key: "created-at",
          label: "Tạo ngày",
          value: hotspot.date,
          icon: <CalendarDays className="h-4 w-4 text-sky-600" />,
        }
      : null,
    profile.lastUpdated
      ? {
          key: "updated-at",
          label: "Cập nhật gần nhất",
          value: profile.lastUpdated,
          icon: <Clock3 className="h-4 w-4 text-amber-600" />,
        }
      : null,
    hotspot.badge
      ? {
          key: "status",
          label: "Trạng thái",
          value: hotspot.badge,
          icon: <ShieldCheck className="h-4 w-4 text-emerald-600" />,
        }
      : null,
  ];

  const filteredEditorialCards: EditorialCard[] =
    editorialCards.filter(isEditorialCard);
  const showEditorialInfo = filteredEditorialCards.length > 0;
  const editorialColumnCount = Math.min(filteredEditorialCards.length, 4);
  const showStorySection = hotspotStories.length > 0;

  return (
    <div className="space-y-8">
      {effectiveHotspotId ? (
        <HotspotDetailNetworkSync hotspotId={effectiveHotspotId} />
      ) : null}

      <div className="flex items-center gap-2 text-slate-700">
        <Link
          href="/curator/hotspot"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-2.5 w-2.5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            Chi tiết địa điểm
          </h1>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
            Thông tin chi tiết địa điểm.
          </p>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="cq-kicker">Tổng quan địa điểm</p>
            <h1
              className="cq-page-title mt-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {hotspot.title}
            </h1>
            {hotspot.subtitle ? (
              <p className="mt-2 text-sm font-normal text-slate-500">
                {hotspot.subtitle}
              </p>
            ) : null}
            {hotspot.description ? (
              <p className="cq-body-copy mt-5 max-w-3xl">
                {hotspot.description}
              </p>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
            {hotspot.badge || googleMapsUrl ? (
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start xl:justify-end">
                {hotspot.badge ? (
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${hotspot.statusStyle}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {hotspot.badge}
                  </span>
                ) : null}
                {googleMapsUrl ? (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Xem bản đồ
                  </a>
                ) : null}
              </div>
            ) : null}
            {hotspot.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {hotspot.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-normal text-amber-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {summaryMetrics.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {summaryMetrics.map((metric) => (
              <MetricTile
                key={`${metric.label}-${metric.value}`}
                value={metric.value}
                label={metric.label}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {hotspot.address ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="cq-label">Vị trí</p>
                  {hotspot.address ? (
                    <p className="mt-1 text-sm font-normal leading-6 text-slate-900">
                      {hotspot.address}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {historyInformation ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-700" />
                <p className="cq-label">Thông tin lịch sử</p>
              </div>
              <p className="mt-2 text-sm font-normal leading-6 text-slate-900">
                {historyInformation}
              </p>
            </div>
          ) : null}

          {profile.estimatedVisit || profile.bestTime ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.estimatedVisit ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="cq-label">
                        {isBackendDetail
                          ? "Thời gian mở/đóng cửa"
                          : "Thời lượng tham quan"}
                      </p>
                      <p className="cq-card-title mt-1 font-normal">
                        {profile.estimatedVisit}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {profile.bestTime ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3">
                    <Compass className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="cq-label">Khung giờ đẹp</p>
                      <p className="cq-card-title mt-1 font-normal">
                        {profile.bestTime}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-8 space-y-8 border-t border-slate-200 pt-8">
          <div className="space-y-5">
            <div className="flex flex-col gap-1">
              <h2 className="cq-section-title">Hình ảnh & video</h2>
              <p className="cq-page-subtitle">
                Chuyển giữa ảnh và video của địa điểm ngay trong trang chi tiết.
              </p>
            </div>

            <HotspotMediaPanel
              key={`${effectiveHotspotId ?? hotspot.slug}-${hotspot.videoUrl ?? "no-video"}-${hotspot.image}`}
              title={hotspot.title}
              imageUrl={hotspot.image}
              imageUrls={
                backendHotspot
                  ? resolveHotspotImageUrls(backendHotspot.medias)
                  : [hotspot.image]
              }
              videoUrl={hotspot.videoUrl}
            />
          </div>

          {showEditorialInfo ? (
            <div className="space-y-5 border-t border-slate-200 pt-8">
              <div className="flex flex-col gap-1">
                <h2 className="cq-section-title">Thông tin biên tập</h2>
                <p className="cq-page-subtitle">
                  Tổng hợp trạng thái quản trị và lịch sử cập nhật chính.
                </p>
              </div>

              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--editorial-columns),minmax(0,1fr))]"
                style={
                  {
                    "--editorial-columns": String(editorialColumnCount || 1),
                  } as CSSProperties
                }
              >
                {filteredEditorialCards.map((item) => (
                  <div
                    key={item.key}
                    className="h-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    {item.icon ? (
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <p className="cq-label">{item.label}</p>
                      </div>
                    ) : (
                      <p className="cq-label">{item.label}</p>
                    )}
                    <p className="cq-card-title mt-2 font-normal">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showStorySection ? (
            <div className="space-y-5 border-t border-slate-200 pt-8">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="cq-section-title">Câu chuyện liên kết</h2>
                  <p className="cq-page-subtitle">
                    Khám phá thêm những câu chuyện nổi bật gắn với địa điểm này.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {hotspotStories.length} câu chuyện
                </span>
              </div>

              <div className="grid gap-4">
                {hotspotStories.map((story) => {
                  const storyStatusMeta = getStoryStatusMeta(story.status);
                  const storyPreviewImage = getStoryPreviewImageUrl(story);
                  const updatedAtLabel = formatDateTimeLabel(
                    story.updatedAt ?? story.createdAt,
                  );
                  const storyMediaSummary = buildStoryMediaSummary(story);
                  const storyOrderLabel = formatStoryOrderIndex(
                    story.orderIndex,
                  );
                  const storyDistanceLabel = formatStoryDistance(
                    story.distanceToNext,
                  );

                  return (
                    <article
                      key={story.storyId}
                      className="overflow-hidden border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
                        <div className="relative min-h-[170px] overflow-hidden bg-slate-100 lg:min-h-[190px]">
                          {storyPreviewImage ? (
                            <div
                              aria-hidden="true"
                              className="h-full w-full bg-cover bg-center"
                              style={{
                                backgroundImage: `url("${storyPreviewImage}")`,
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.16),_transparent_45%),linear-gradient(135deg,#fff7ed,_#f8fafc_55%,#e2e8f0)] p-6 text-center">
                              <div>
                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm">
                                  <BookOpen className="h-5 w-5 text-amber-700" />
                                </div>
                                <p className="mt-3 text-xs font-semibold text-slate-800">
                                  Câu chuyện nổi bật
                                </p>
                                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                  Nội dung biên tập dành riêng cho địa điểm này
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/35 to-transparent" />
                        </div>

                        <div className="flex flex-col justify-between p-4 sm:p-5">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {story.tag?.tagName?.trim() ? (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                                  {story.tag.tagName.trim()}
                                </span>
                              ) : null}
                              {story.status?.trim() ? (
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${storyStatusMeta.style}`}
                                >
                                  {storyStatusMeta.label}
                                </span>
                              ) : null}
                            </div>

                            <Link
                              href={`/curator/stories/${story.storyId}`}
                              className="mt-3 block text-[1rem] font-semibold leading-snug tracking-[-0.02em] text-slate-950 transition hover:text-[#C94534] sm:text-[1.05rem]"
                            >
                              {story.title}
                            </Link>

                            {story.content?.trim() ? (
                              <p className="mt-2.5 text-[13px] leading-6 text-slate-600 sm:text-sm">
                                {truncateText(story.content.trim(), 220)}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3">
                            <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-600">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                {storyMediaSummary}
                              </span>

                              {updatedAtLabel ? (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                  Cập nhật: {updatedAtLabel}
                                </span>
                              ) : null}
                            </div>

                            <div className="flex justify-end">
                              <Link
                                href={`/curator/stories/${story.storyId}`}
                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800 sm:text-xs"
                              >
                                Đọc câu chuyện
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function resolveFallbackHotspot(
  slug?: string | null,
  backendHotspot?: BackendHotspot | null,
) {
  if (slug?.trim()) {
    const fallbackHotspot = getHotspotBySlug(slug);

    if (fallbackHotspot) {
      return fallbackHotspot;
    }
  }

  if (!backendHotspot) {
    return null;
  }

  return findFallbackHotspot(backendHotspot);
}

function parseHotspotId(value: string | undefined) {
  if (!value) {
    return null;
  }

  const hotspotId = Number(value.trim());
  if (!Number.isInteger(hotspotId) || hotspotId <= 0) {
    return null;
  }

  return hotspotId;
}

function findFallbackHotspot(backendHotspot: BackendHotspot) {
  const backendSlug = slugify(backendHotspot.hotspotName ?? "");
  const normalizedName = normalizeText(backendHotspot.hotspotName ?? "");
  const normalizedAddress = normalizeText(backendHotspot.address ?? "");

  return (
    hotspotItems.find((item) => {
      if (backendSlug && item.slug === backendSlug) {
        return true;
      }

      if (normalizedName && normalizeText(item.title) === normalizedName) {
        return true;
      }

      if (
        normalizedAddress &&
        normalizeText(item.address) === normalizedAddress
      ) {
        return true;
      }

      return false;
    }) ?? null
  );
}

async function getHotspotFromBackend(hotspotId: number) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_KEY)?.value;
  const headers = new Headers({
    accept: "application/json",
  });

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(
      `${BACKEND_API_BASE_URL}/api/v1/hotspots/${hotspotId}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch hotspot ${hotspotId}: ${response.status}`);
      return null;
    }

    return (await response.json()) as BackendHotspot;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Hotspot ${hotspotId} fetch timeout`);
    } else {
      console.error(`Error fetching hotspot ${hotspotId}:`, error);
    }
    return null;
  }
}

async function getCreatorDisplayName(userId: number) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_KEY)?.value;
  const headers = new Headers({
    accept: "application/json",
  });

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(
      `${BACKEND_API_BASE_URL}/api/users/${userId}`,
      {
        method: "GET",
        headers,
        cache: "force-cache",
        next: { revalidate: 600 }, // cache 10 min
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch user ${userId}: ${response.status}`);
      return "";
    }

    const user = (await response.json()) as BackendUser;
    return user.displayName?.trim() || "";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`User ${userId} fetch timeout`);
    } else {
      console.error(`Error fetching user ${userId}:`, error);
    }
    return "";
  }
}

function resolveHotspotMedia(medias?: BackendHotspot["medias"]) {
  const image =
    medias
      ?.filter((m) => Boolean(m.fileUrl?.trim()))
      .find((m) => {
        const mediaType = m.mediaType?.trim().toUpperCase();
        const mimeType = m.mimeType?.trim().toLowerCase();

        return mediaType === "IMAGE" || mimeType?.startsWith("image/");
      }) ?? null;

  const video =
    medias
      ?.filter((m) => Boolean(m.fileUrl?.trim()))
      .find((m) => {
        const mediaType = m.mediaType?.trim().toUpperCase();
        const mimeType = m.mimeType?.trim().toLowerCase();

        return mediaType === "VIDEO" || mimeType?.startsWith("video/");
      }) ?? null;

  return {
    imageUrl: image?.fileUrl?.trim() || null,
    videoUrl: video?.fileUrl?.trim() || null,
  };
}

function resolveHotspotImageUrls(medias?: BackendHotspot["medias"]) {
  return (
    resolveOrderedHotspotMedias(medias)
      ?.filter((m) => Boolean(m.fileUrl?.trim()))
      .filter((m) => {
        const mediaType = m.mediaType?.trim().toUpperCase();
        const mimeType = m.mimeType?.trim().toLowerCase();

        return mediaType === "IMAGE" || mimeType?.startsWith("image/");
      })
      .map((m) => m.fileUrl!.trim()) ?? []
  );
}

function resolveOrderedHotspotMedias(medias?: BackendHotspot["medias"]) {
  return [...(medias ?? [])].sort((mediaA, mediaB) => {
    const displayOrderDiff =
      (mediaA.displayOrder ?? Number.MAX_SAFE_INTEGER) -
      (mediaB.displayOrder ?? Number.MAX_SAFE_INTEGER);

    if (displayOrderDiff !== 0) {
      return displayOrderDiff;
    }

    return mediaA.mediaId - mediaB.mediaId;
  });
}

function resolveHotspotStories(stories?: BackendHotspot["stories"]) {
  return [...(stories ?? [])].sort((storyA, storyB) => {
    const orderDiff =
      (storyA.orderIndex ?? Number.MAX_SAFE_INTEGER) -
      (storyB.orderIndex ?? Number.MAX_SAFE_INTEGER);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return storyA.storyId - storyB.storyId;
  });
}

function isImageStoryMedia(media?: BackendStoryMedia) {
  if (!media?.fileUrl) {
    return false;
  }

  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();

  return (
    mediaType === "IMAGE" ||
    mimeType?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|avif)$/i.test(media.fileUrl)
  );
}

function isVideoStoryMedia(media?: BackendStoryMedia) {
  if (!media?.fileUrl) {
    return false;
  }

  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();

  return (
    mediaType === "VIDEO" ||
    mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov)$/i.test(media.fileUrl)
  );
}

function isAudioStoryMedia(media?: BackendStoryMedia) {
  if (!media?.fileUrl) {
    return false;
  }

  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();

  return (
    mediaType === "AUDIO" ||
    mimeType?.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a)$/i.test(media.fileUrl)
  );
}

function getStoryPreviewImageUrl(story: BackendStory) {
  return (
    story.medias?.find((media) => isImageStoryMedia(media))?.fileUrl?.trim() ||
    ""
  );
}

function getStoryStatusMeta(status?: string | null) {
  const normalizedStatus = status?.trim().toUpperCase();

  if (normalizedStatus && STORY_STATUS_META[normalizedStatus]) {
    return STORY_STATUS_META[normalizedStatus];
  }

  return {
    label: status?.trim() ? formatEnumLabel(status.trim()) : "Chưa rõ",
    style: "border border-slate-200 bg-slate-100 text-slate-700",
  };
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function formatStoryOrderIndex(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Chưa sắp";
  }

  return String(value);
}

function formatStoryDistance(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function buildStoryMediaSummary(story: BackendStory) {
  const medias = story.medias ?? [];
  const imageCount = medias.filter(isImageStoryMedia).length;
  const videoCount = medias.filter(isVideoStoryMedia).length;
  const audioCount = medias.filter(isAudioStoryMedia).length;
  const parts = [
    imageCount > 0 ? `${imageCount} ảnh` : "",
    videoCount > 0 ? `${videoCount} video` : "",
    audioCount > 0 ? `${audioCount} audio` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Chưa có media";
}

function buildDetailHotspot(
  fallbackHotspot: HotspotItem | null,
  backendHotspot: BackendHotspot | null,
  creatorDisplayName: string,
): HotspotItem {
  const hasBackendSource = Boolean(backendHotspot);
  const title =
    backendHotspot?.hotspotName?.trim() ||
    (!hasBackendSource ? fallbackHotspot?.title : undefined) ||
    (backendHotspot ? `Hotspot ${backendHotspot.hotspotId}` : "Hotspot");
  const category =
    backendHotspot?.tags?.find((tag) => tag.tagName?.trim())?.tagName.trim() ||
    (!hasBackendSource ? fallbackHotspot?.category : undefined) ||
    "";
  const statusMeta = buildStatusMeta(
    backendHotspot?.status,
    hasBackendSource ? undefined : (fallbackHotspot ?? undefined),
  );

  return {
    slug:
      fallbackHotspot?.slug ||
      `hotspot-${backendHotspot?.hotspotId ?? "detail"}`,
    title,
    subtitle: buildSubtitle(
      category,
      backendHotspot?.address ??
        (!hasBackendSource ? fallbackHotspot?.address : undefined),
      hasBackendSource ? undefined : fallbackHotspot?.subtitle,
    ),
    author:
      creatorDisplayName ||
      (typeof backendHotspot?.createByUserId === "number"
        ? `Curator #${backendHotspot.createByUserId}`
        : "") ||
      (!hasBackendSource ? fallbackHotspot?.author : "") ||
      "",
    date:
      formatDateLabel(backendHotspot?.createdAt ?? backendHotspot?.updatedAt) ||
      (!hasBackendSource ? fallbackHotspot?.date : "") ||
      "",
    address:
      backendHotspot?.address?.trim() ||
      (!hasBackendSource ? fallbackHotspot?.address : "") ||
      "",
    description:
      backendHotspot?.description?.trim() ||
      (!hasBackendSource ? fallbackHotspot?.description : "") ||
      "",
    category,
    relatedTopics: !hasBackendSource
      ? (fallbackHotspot?.relatedTopics ?? [])
      : [],
    videoLabel: fallbackHotspot?.videoLabel,
    videoUrl:
      (backendHotspot
        ? resolveHotspotMedia(backendHotspot.medias).videoUrl
        : null) || fallbackHotspot?.videoUrl,
    xp:
      typeof backendHotspot?.xp === "number"
        ? `${backendHotspot.xp} XP`
        : (!hasBackendSource ? fallbackHotspot?.xp : "") || "",
    status: statusMeta.label,
    statusStyle: statusMeta.style,
    badge: statusMeta.label,
    gps:
      typeof backendHotspot?.latitude === "number" &&
      typeof backendHotspot?.longitude === "number"
        ? "GPS OK"
        : (!hasBackendSource ? fallbackHotspot?.gps : "") || "",
    image:
      (backendHotspot
        ? resolveHotspotMedia(backendHotspot.medias).imageUrl
        : null) ||
      fallbackHotspot?.image ||
      buildDefaultHotspotImage(title),
    tags: buildTagLabels(
      backendHotspot?.tags,
      hasBackendSource ? null : fallbackHotspot,
    ),
  };
}

function buildDetailProfile(
  fallbackProfile: HotspotProfile | null,
  fallbackHotspot: HotspotItem | null,
  backendHotspot: BackendHotspot | null,
): HotspotProfile {
  if (backendHotspot) {
    return {
      coordinates: buildCoordinatesLabel(backendHotspot),
      district: extractLocationLabel(backendHotspot.address),
      estimatedVisit: buildOpeningHoursLabel(backendHotspot),
      bestTime: buildBestTimeLabel(backendHotspot),
      accessibility: "",
      lastUpdated: formatDateTimeLabel(
        backendHotspot.updatedAt ?? backendHotspot.createdAt,
      ),
      factSheet: buildFactSheet(backendHotspot, null),
      editorialNote: backendHotspot.historyInformation?.trim() || "",
      preservationNote: backendHotspot.description?.trim() || "",
      stats: {
        checkIns: "",
        saves: "",
        routes: "",
      },
    };
  }

  return {
    coordinates: buildCoordinatesLabel(
      backendHotspot,
      fallbackProfile?.coordinates,
    ),
    district:
      fallbackProfile?.district ||
      extractLocationLabel(fallbackHotspot?.address) ||
      "",
    estimatedVisit: fallbackProfile?.estimatedVisit || "",
    bestTime: fallbackProfile?.bestTime || "",
    accessibility: fallbackProfile?.accessibility || "",
    lastUpdated: fallbackProfile?.lastUpdated || "",
    factSheet: fallbackProfile?.factSheet.length
      ? fallbackProfile.factSheet
      : buildFactSheet(null, fallbackHotspot),
    editorialNote:
      fallbackProfile?.editorialNote || fallbackHotspot?.description || "",
    preservationNote: fallbackProfile?.preservationNote || "",
    stats: fallbackProfile?.stats ?? {
      checkIns: "-",
      saves: "-",
      routes: "-",
    },
  };
}

function buildStatusMeta(status?: string, fallback?: HotspotItem) {
  const normalizedStatus = status?.trim().toUpperCase();

  if (normalizedStatus && HOTSPOT_STATUS_META[normalizedStatus]) {
    return HOTSPOT_STATUS_META[normalizedStatus];
  }

  if (fallback) {
    return {
      label: fallback.status,
      style: fallback.statusStyle,
    };
  }

  return {
    label: status?.trim() ? formatEnumLabel(status.trim()) : "",
    style: "bg-slate-500/95 text-white",
  };
}

function buildTagLabels(
  tags?: BackendHotspot["tags"],
  fallbackHotspot?: HotspotItem | null,
) {
  const mappedTags =
    tags
      ?.map((tag) => tag.tagName?.trim())
      .filter((tagName): tagName is string => Boolean(tagName))
      .map((tagName) => `#${buildTagToken(tagName)}`) ?? [];

  if (mappedTags.length > 0) {
    return mappedTags;
  }

  return fallbackHotspot?.tags ?? [];
}

function extractLocationLabel(address?: string) {
  if (!address?.trim()) {
    return "";
  }

  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const reversedSegments = [...segments].reverse();
  const prioritizedMatchers = [
    /quận/i,
    /huyện/i,
    /thành phố thủ đức/i,
    /tp\./i,
    /thành phố/i,
    /phường/i,
  ];

  for (const matcher of prioritizedMatchers) {
    const matchedSegment = reversedSegments.find((segment) =>
      matcher.test(segment),
    );

    if (matchedSegment) {
      return matchedSegment;
    }
  }

  return segments.at(-2) ?? segments.at(-1) ?? "";
}

function buildSubtitle(
  category: string,
  address?: string,
  fallbackSubtitle?: string,
) {
  const parts = [category.trim(), extractLocationLabel(address)].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" · ") : (fallbackSubtitle ?? "");
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildCoordinatesLabel(
  hotspot: BackendHotspot | null,
  fallbackCoordinates?: string,
) {
  if (
    typeof hotspot?.latitude === "number" &&
    Number.isFinite(hotspot.latitude) &&
    typeof hotspot.longitude === "number" &&
    Number.isFinite(hotspot.longitude)
  ) {
    return `${hotspot.latitude}, ${hotspot.longitude}`;
  }

  return fallbackCoordinates || "";
}

function buildOpeningHoursLabel(
  hotspot: BackendHotspot | null,
  fallbackValue?: string,
) {
  if (hotspot?.openingTime && hotspot?.closingTime) {
    return `${hotspot.openingTime} - ${hotspot.closingTime}`;
  }

  return fallbackValue || "";
}

function buildBestTimeLabel(
  hotspot: BackendHotspot | null,
  fallbackValue?: string,
) {
  if (hotspot?.startTime && hotspot?.endTime) {
    return `${hotspot.startTime} - ${hotspot.endTime}`;
  }

  return fallbackValue || "";
}

function buildFactSheet(
  hotspot: BackendHotspot | null,
  fallbackHotspot: HotspotItem | null,
) {
  if (hotspot) {
    return [
      typeof hotspot.point === "number" ? `Point thưởng: ${hotspot.point}` : "",
      typeof hotspot.checkInRadius === "number"
        ? `Bán kính check-in: ${hotspot.checkInRadius} m`
        : "",
      hotspot.startTime && hotspot.endTime
        ? `Khung giờ hoạt động: ${hotspot.startTime} - ${hotspot.endTime}`
        : "",
      hotspot.openingTime && hotspot.closingTime
        ? `Giờ mở cửa: ${hotspot.openingTime} - ${hotspot.closingTime}`
        : "",
    ].filter(Boolean);
  }

  if (fallbackHotspot?.description.trim()) {
    return [fallbackHotspot.description.trim()];
  }

  return [];
}

function buildBackendMetrics(hotspot: BackendHotspot | null) {
  if (!hotspot) {
    return [];
  }
  const durationLabel =
    typeof hotspot.estimatedDurationMin === "number" &&
    typeof hotspot.estimatedDurationMax === "number"
      ? `${hotspot.estimatedDurationMin}–${hotspot.estimatedDurationMax} phút`
      : typeof hotspot.estimatedDurationMin === "number"
        ? `${hotspot.estimatedDurationMin} phút`
        : typeof hotspot.estimatedDurationMax === "number"
          ? `${hotspot.estimatedDurationMax} phút`
          : "";

  return [
    typeof hotspot.xp === "number"
      ? { value: `${hotspot.xp} XP`, label: "XP thưởng" }
      : null,
    typeof hotspot.point === "number"
      ? { value: `${hotspot.point} điểm`, label: "Điểm thưởng" }
      : null,
    durationLabel
      ? { value: durationLabel, label: "Thời lượng khám phá" }
      : null,
    typeof hotspot.checkInRadius === "number"
      ? { value: `${hotspot.checkInRadius} m`, label: "Bán kính check-in" }
      : null,
  ].filter((item): item is { value: string; label: string } => item !== null);
}

function buildDefaultHotspotImage(title: string) {
  const safeTitle = escapeXml(title.trim() || "Hotspot");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" fill="none"><rect width="1600" height="900" fill="#E2E8F0"/><rect x="120" y="120" width="1360" height="660" rx="48" fill="#F8FAFC"/><circle cx="420" cy="410" r="120" fill="#CBD5E1"/><path d="M630 560L790 400L970 560L1120 470L1300 660H300L510 470L630 560Z" fill="#94A3B8"/><text x="800" y="760" text-anchor="middle" fill="#475569" font-family="Arial, sans-serif" font-size="44" font-weight="700">${safeTitle}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value: string) {
  return stripVietnameseAccents(value).toLowerCase().trim();
}

function stripVietnameseAccents(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
