"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { CuratorPagination } from "@/components/curator/CuratorPagination";
import {
  routeApi,
  type RouteMediaResponse,
  type RouteResponse,
} from "@/services/api/routeApi";
import {
  ChevronRight,
  Clock3,
  MapPin,
  MoreHorizontal,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

const ROUTES_PER_PAGE = 4;
const ROUTE_SUCCESS_TOAST_KEY = "curator-route-success-toast";

const difficultyLabels: Record<string, string> = {
  EASY: "Dễ",
  MEDIUM: "Vừa",
  HARD: "Khó",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING: "Chờ duyệt",
  PUBLISHED: "Công khai",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  DELETED: "Đã xoá",
};

const statusClasses: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  DELETED: "border-slate-200 bg-slate-50 text-slate-400",
};

function getStatusLabel(status?: string) {
  const normalized = status?.trim().toUpperCase() || "DRAFT";
  return statusLabels[normalized] ?? normalized;
}

function getStatusClass(status?: string) {
  const normalized = status?.trim().toUpperCase() || "DRAFT";
  return (
    statusClasses[normalized] ?? "border-slate-200 bg-slate-50 text-slate-600"
  );
}

function getMediaUrl(media?: RouteMediaResponse) {
  return media?.fileUrl || media?.mediaUrl || media?.url || null;
}

function getMediaUrlFromArray(medias?: unknown[]) {
  const mediaItems = Array.isArray(medias) ? medias : [];
  const imageMedia =
    mediaItems.find((media) => {
      if (!media || typeof media !== "object") return false;
      const mediaRecord = media as Record<string, unknown>;
      const mediaType = String(mediaRecord.mediaType ?? "");
      const mimeType = String(mediaRecord.mimeType ?? "");
      return `${mediaType} ${mimeType}`.toLowerCase().includes("image");
    }) ?? mediaItems[0];

  return imageMedia && typeof imageMedia === "object"
    ? getMediaUrl(imageMedia as RouteMediaResponse)
    : null;
}

function getHotspotImage(hotspot?: unknown) {
  if (!hotspot || typeof hotspot !== "object") {
    return null;
  }

  const firstHotspot = hotspot as Record<string, unknown>;
  const url =
    (firstHotspot.thumbnailUrl as string) ||
    (firstHotspot.coverImageUrl as string) ||
    (firstHotspot.imageUrl as string) ||
    (firstHotspot.fileUrl as string) ||
    (firstHotspot.mediaUrl as string) ||
    (firstHotspot.url as string);

  return url?.trim()
    ? url
    : getMediaUrlFromArray(
        (firstHotspot.medias as unknown[]) ?? (firstHotspot.media as unknown[]),
      );
}

function getRouteImage(route: RouteResponse) {
  return (
    route.thumbnailUrl ||
    route.coverImageUrl ||
    route.imageUrl ||
    getMediaUrlFromArray(route.medias ?? route.media ?? []) ||
    getHotspotImage(route.hotspots?.[0]) ||
    null
  );
}

function getHotspotCount(route: RouteResponse) {
  return route.totalStops ?? route.hotspots?.length ?? 0;
}

function isPublished(status?: string) {
  const normalized = status?.trim().toUpperCase();
  return normalized === "PUBLISHED" || normalized === "APPROVED";
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[0.95rem] bg-[#F7F5EF] px-2.5 py-1.5 shadow-sm">
      <div className="flex items-center gap-1 text-[9px] text-slate-500">
        <Icon className="h-3 w-3 text-red-500" />
        <span>{label}</span>
      </div>
      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RouteCard({
  route,
  onDelete,
  onPublish,
  isMenuOpen,
  setOpenMenuRouteId,
  isPublishing,
}: {
  route: RouteResponse;
  onDelete: (id: number) => void;
  onPublish: (route: RouteResponse) => void;
  isMenuOpen: boolean;
  setOpenMenuRouteId: (routeId: number | null) => void;
  isPublishing: boolean;
}) {
  const tags = route.tags ?? [];
  const imageUrl = getRouteImage(route);
  const hotspotCount = getHotspotCount(route);
  const normalizedStatus = route.status?.trim().toUpperCase() || "DRAFT";
  const canPublish =
    normalizedStatus !== "PUBLISHED" &&
    normalizedStatus !== "APPROVED" &&
    normalizedStatus !== "DELETED";
  const isBusy = isPublishing;

  return (
    <article
      className={`flex h-full flex-col overflow-visible rounded-[1.5rem] border border-slate-200/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isMenuOpen ? "relative z-20" : ""}`}
    >
      <div className="relative h-54 w-full overflow-hidden rounded-t-[1.5rem] bg-[#F7F5EF]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={route.routeName}
            fill
            sizes="(min-width: 1280px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Chưa có hình ảnh
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-semibold leading-5 text-slate-950">
              {route.routeName}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-slate-500">
              {route.description || "Chưa có mô tả."}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-sm ${getStatusClass(route.status)}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current/75" />
            {getStatusLabel(route.status)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag.tagId}
                className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700"
              >
                #{tag.tagName}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">Chưa có tag</span>
          )}
        </div>

        <div className="grid gap-1.25 md:grid-cols-3">
          <Metric
            icon={MapPin}
            label="Khoảng cách"
            value={`${route.totalDistance ?? 0} km`}
          />
          <Metric
            icon={Clock3}
            label="Thời lượng"
            value={`${route.estimateTime ?? 0} phút`}
          />
          <Metric
            icon={Sparkles}
            label="Độ khó"
            value={difficultyLabels[route.difficulty] ?? route.difficulty}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600">
          <span>{hotspotCount} địa điểm</span>
          <span>XP: {route.xp ?? 0}</span>
          <span>Điểm: {route.point ?? 0}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {isPublished(route.status) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Đang hoạt động
              </span>
            ) : null}

            <Link
              href={`/curator/routes/${route.routeId}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#e35a48] transition hover:text-[#c74735]"
            >
              Mở tuyến
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative shrink-0" data-route-actions>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() =>
                setOpenMenuRouteId(isMenuOpen ? null : route.routeId)
              }
              className={`rounded-full p-1.25 text-slate-600 transition hover:bg-slate-100 ${isMenuOpen ? "bg-slate-100" : "bg-white/90"}`}
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                className="absolute bottom-[calc(100%+0.6rem)] right-0 w-40 rounded-[1.25rem] border border-slate-200 bg-white p-1.5 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
              >
                {canPublish ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenuRouteId(null);
                      onPublish(route);
                    }}
                    disabled={isBusy}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>
                      {isPublishing ? "Đang kiểm tra..." : "Kiểm tra"}
                    </span>
                  </button>
                ) : null}

                <Link
                  href={`/curator/routes/create?id=${route.routeId}`}
                  role="menuitem"
                  onClick={() => {
                    if (isBusy) {
                      return;
                    }
                    setOpenMenuRouteId(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa</span>
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenMenuRouteId(null);
                    onDelete(route.routeId);
                  }}
                  disabled={isBusy}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xoá tuyến</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CuratorRoutesPage() {
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuRouteId, setOpenMenuRouteId] = useState<number | null>(null);
  const [publishingRouteId, setPublishingRouteId] = useState<number | null>(
    null,
  );
  const [pendingPublishRoute, setPendingPublishRoute] =
    useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    const successMessage = sessionStorage.getItem(ROUTE_SUCCESS_TOAST_KEY);

    if (!successMessage) {
      return;
    }

    sessionStorage.removeItem(ROUTE_SUCCESS_TOAST_KEY);
    toast.success(successMessage);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-route-actions]")) {
        setOpenMenuRouteId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuRouteId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRoutes() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await routeApi.searchRoutes({
          filters: [],
          page: currentPage - 1,
          size: ROUTES_PER_PAGE,
          sortBy: "routeId",
          sortDirection: "DESC",
        });

        const detailedRoutes = await Promise.all(
          response.content.map(async (route) => {
            try {
              return await routeApi.getRouteById(route.routeId);
            } catch {
              return route;
            }
          }),
        );

        if (cancelled) return;
        setRoutes(detailedRoutes);
        setTotalPages(Math.max(1, response.page.totalPages || 1));
      } catch (err) {
        if (cancelled) return;
        setRoutes([]);
        setTotalPages(1);
        setError(
          err instanceof Error ? err.message : "Không thể tải danh sách tuyến.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRoutes();
    return () => {
      cancelled = true;
    };
  }, [currentPage, reloadVersion]);

  async function handleDelete(routeId: number) {
    setOpenMenuRouteId(null);
    const ok = window.confirm("Bạn có chắc muốn xoá tuyến này không?");
    if (!ok) return;

    try {
      await routeApi.deleteRoute(routeId);
      toast.success("Đã xoá tuyến.");
      setReloadVersion((value) => value + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xoá tuyến.");
    }
  }

  function handlePublishRequest(route: RouteResponse) {
    setOpenMenuRouteId(null);
    const normalizedStatus = route.status?.trim().toUpperCase();

    if (normalizedStatus === "PUBLISHED" || normalizedStatus === "APPROVED") {
      toast.info("Tuyến này đã ở trạng thái xuất bản.");
      return;
    }

    if (normalizedStatus === "DELETED") {
      toast.error("Không thể kích hoạt tuyến đã bị xóa.");
      return;
    }

    setPendingPublishRoute(route);
  }

  async function handleConfirmPublishRoute() {
    if (!pendingPublishRoute) {
      return;
    }

    const routeId = pendingPublishRoute.routeId;

    setPublishingRouteId(routeId);

    try {
      await routeApi.publishRoute(routeId);
      setPendingPublishRoute(null);
      toast.success("Đã kích hoạt tuyến.");
      setReloadVersion((value) => value + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể kích hoạt tuyến.",
      );
    } finally {
      setPublishingRouteId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <section className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="cq-page-title">Tuyến hành trình</h1>
            <p className="cq-page-subtitle max-w-2xl">
              Xây dựng các tuyến khám phá di sản TP.HCM.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-slate-100 bg-[#F7F5EF] p-1">
            <Link
              href="/curator/routes"
              className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-medium text-slate-950 shadow-sm"
            >
              Danh sách
            </Link>
            <Link
              href="/curator/routes/create"
              className="rounded-full px-3.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-900"
            >
              Trình tạo tuyến
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
            Đang tải danh sách tuyến...
          </div>
        ) : routes.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
            Chưa có tuyến nào.
          </div>
        ) : (
          <div className="mt-7 grid auto-rows-fr gap-4 xl:grid-cols-2">
            {routes.map((route) => (
              <div
                key={route.routeId}
                className={`mx-auto h-full w-full max-w-[30rem] ${publishingRouteId === route.routeId ? "pointer-events-none opacity-70" : ""}`}
              >
                <RouteCard
                  route={route}
                  onDelete={handleDelete}
                  onPublish={handlePublishRequest}
                  isMenuOpen={openMenuRouteId === route.routeId}
                  setOpenMenuRouteId={setOpenMenuRouteId}
                  isPublishing={publishingRouteId === route.routeId}
                />
              </div>
            ))}
          </div>
        )}

        {routes.length > 0 ? (
          <div className="mt-auto flex justify-end pt-6">
            <CuratorPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </section>

      {pendingPublishRoute ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPendingPublishRoute(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[22rem] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-7 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-8">
            <div className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h2 className="text-[1.125rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.25rem]">
                Bạn có chắc muốn kiểm tra?
              </h2>
              <p className="mx-auto max-w-[16.5rem] text-[0.8125rem] leading-5 text-slate-500 sm:text-[0.875rem]">
                Tuyến{" "}
                <span className="font-semibold text-slate-900">
                  {pendingPublishRoute.routeName}
                </span>{" "}
                sẽ được kích hoạt ngay lập tức.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingPublishRoute(null)}
                disabled={publishingRouteId === pendingPublishRoute.routeId}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-[0.8125rem] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmPublishRoute()}
                disabled={publishingRouteId === pendingPublishRoute.routeId}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-500 bg-emerald-500 px-4 text-[0.8125rem] font-semibold text-white transition hover:border-emerald-600 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {publishingRouteId === pendingPublishRoute.routeId
                  ? "Đang kiểm tra..."
                  : "Kiểm tra"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
