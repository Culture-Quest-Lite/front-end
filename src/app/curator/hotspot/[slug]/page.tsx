import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
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
import type { BackendHotspot, BackendUser } from "@/services/api";
import { HotspotMediaPanel } from "./HotspotMediaPanel";

const BACKEND_API_BASE_URL =
  process.env.HOTSPOT_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://13.158.40.56:8080";

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

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="cq-section-title">{title}</h2>
        <p className="cq-page-subtitle">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xl font-normal text-slate-950">{value}</p>
      <p className="cq-label mt-1">{label}</p>
    </div>
  );
}

export default async function HotspotDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ hotspotId?: string }> | { hotspotId?: string };
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;
  const hotspotId = parseHotspotId(resolvedSearchParams?.hotspotId);

  if (hotspotId) {
    redirect(`/curator/hotspots/${hotspotId}`);
  }

  return renderHotspotDetailPage({ slug });
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
  const summaryMetrics = isBackendDetail
    ? buildBackendMetrics(backendHotspot)
    : [
        { value: profile.stats.checkIns, label: "Check-in 30 ngày" },
        { value: profile.stats.saves, label: "Đã lưu" },
        { value: profile.stats.routes, label: "Tuyến chứa điểm" },
      ].filter((item) => item.value);
  const showEditorialInfo = Boolean(
    hotspot.author ||
    hotspot.date ||
    profile.lastUpdated ||
    hotspot.status ||
    hotspot.gps,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-slate-700">
        <Link
          href="/curator/hotspot"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-2.5 w-2.5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            Chi tiết hotspot
          </h1>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
            Thông tin chi tiết hotspot.
          </p>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="cq-kicker">Tổng quan hotspot</p>
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

          <div className="flex flex-col gap-3 xl:items-end">
            {hotspot.badge || googleMapsUrl ? (
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                {hotspot.badge ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${hotspot.statusStyle}`}
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
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
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
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Hình ảnh & video"
          description="Chuyển giữa ảnh và video của hotspot ngay trong trang chi tiết."
        >
          <HotspotMediaPanel
            key={`${effectiveHotspotId ?? hotspot.slug}-${hotspot.videoUrl ?? "no-video"}-${hotspot.image}`}
            title={hotspot.title}
            imageUrl={hotspot.image}
            videoUrl={hotspot.videoUrl}
          />
        </SectionCard>

        {showEditorialInfo ? (
          <SectionCard
            title="Thông tin biên tập"
            description="Tổng hợp trạng thái quản trị và lịch sử cập nhật chính."
          >
            <div className="space-y-3">
              {hotspot.author ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="cq-label">Người phụ trách</p>
                  <p className="cq-card-title mt-1 font-normal">
                    {hotspot.author}
                  </p>
                </div>
              ) : null}

              {hotspot.date || profile.lastUpdated ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {hotspot.date ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-sky-600" />
                        <p className="cq-label">Tạo ngày</p>
                      </div>
                      <p className="cq-card-title mt-2 font-normal">
                        {hotspot.date}
                      </p>
                    </div>
                  ) : null}

                  {profile.lastUpdated ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-amber-600" />
                        <p className="cq-label">Cập nhật gần nhất</p>
                      </div>
                      <p className="cq-card-title mt-2 font-normal">
                        {profile.lastUpdated}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </SectionCard>
        ) : null}
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

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/api/v1/hotspots/${hotspotId}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as BackendHotspot;
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

  const response = await fetch(`${BACKEND_API_BASE_URL}/api/users/${userId}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    return "";
  }

  const user = (await response.json()) as BackendUser;
  return user.displayName?.trim() || "";
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
    videoUrl: fallbackHotspot?.videoUrl,
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
    image: fallbackHotspot?.image || buildDefaultHotspotImage(title),
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

  return [
    typeof hotspot.xp === "number"
      ? { value: `${hotspot.xp} XP`, label: "XP thưởng" }
      : null,
    typeof hotspot.point === "number"
      ? { value: `${hotspot.point} điểm`, label: "Point thưởng" }
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
