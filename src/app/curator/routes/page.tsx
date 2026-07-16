"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { CuratorPagination } from "@/components/curator/CuratorPagination";
import { routeApi, type RouteMediaResponse, type RouteResponse } from "@/services/api/routeApi";
import { ChevronRight, Clock3, MapPin, Plus, Sparkles, Trash2, TrendingUp } from "lucide-react";

const ROUTES_PER_PAGE = 8;

const difficultyLabels: Record<string, string> = {
  EASY: "Dễ",
  MEDIUM: "Vừa",
  HARD: "Khó",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING: "Chờ duyệt",
  PUBLISHED: "Đã publish",
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
  return statusClasses[normalized] ?? "border-slate-200 bg-slate-50 text-slate-600";
}

function getMediaUrl(media?: RouteMediaResponse) {
  return media?.fileUrl || media?.mediaUrl || media?.url || null;
}

function getMediaUrlFromArray(medias?: unknown[]) {
  const mediaItems = Array.isArray(medias) ? medias : [];
  const imageMedia = mediaItems.find((media) => {
    if (!media || typeof media !== "object") return false;
    const mediaType = String((media as any).mediaType ?? "");
    const mimeType = String((media as any).mimeType ?? "");
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

  return url?.trim() ? url : getMediaUrlFromArray(firstHotspot.medias as unknown[] ?? firstHotspot.media as unknown[]);
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

function Metric({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] bg-[#F7F5EF] px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-4 w-4 text-red-500" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RouteCard({
  route,
  onDelete,
  onPublish,
}: {
  route: RouteResponse;
  onDelete: (id: number) => void;
  onPublish: (id: number) => void;
}) {
  const tags = route.tags ?? [];
  const imageUrl = getRouteImage(route);
  const hotspotCount = getHotspotCount(route);
  const normalizedStatus = route.status?.trim().toUpperCase() || "DRAFT";
  const canPublish = normalizedStatus !== "PUBLISHED" && normalizedStatus !== "APPROVED" && normalizedStatus !== "DELETED";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-44 w-full bg-[#F7F5EF]">
        {imageUrl ? (
          <img src={imageUrl} alt={route.routeName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Chưa có hình ảnh
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{route.routeName}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{route.description || "Chưa có mô tả."}</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${getStatusClass(route.status)}`}>
            <span className="h-2 w-2 rounded-full bg-current/75" />
            {getStatusLabel(route.status)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? tags.map((tag) => (
            <span key={tag.tagId} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              #{tag.tagName}
            </span>
          )) : <span className="text-xs text-slate-400">Chưa có tag</span>}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Metric icon={MapPin} label="Khoảng cách" value={`${route.totalDistance ?? 0} km`} />
          <Metric icon={Clock3} label="Thời lượng" value={`${route.estimateTime ?? 0} phút`} />
          <Metric icon={Sparkles} label="Độ khó" value={difficultyLabels[route.difficulty] ?? route.difficulty} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span>{hotspotCount} hotspot</span>
          <span>XP: {route.xp ?? 0}</span>
          <span>Point: {route.point ?? 0}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => onDelete(route.routeId)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xoá
          </button>

          <div className="flex items-center gap-3">
            {canPublish ? (
              <button
                type="button"
                onClick={() => onPublish(route.routeId)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Kích hoạt
              </button>
            ) : null}

            {isPublished(route.status) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Đang hoạt động
              </span>
            ) : null}

            <Link
              href={`/curator/routes/${route.routeId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#e35a48] transition hover:text-[#c74735]"
            >
              Mở tuyến
              <ChevronRight className="h-4 w-4" />
            </Link>
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
  const [publishingRouteId, setPublishingRouteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

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
        setError(err instanceof Error ? err.message : "Không thể tải danh sách tuyến.");
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

  async function handlePublish(routeId: number) {
    const ok = window.confirm("Bạn có chắc muốn kích hoạt tuyến này không?");
    if (!ok) return;

    setPublishingRouteId(routeId);

    try {
      await routeApi.publishRoute(routeId);
      toast.success("Đã kích hoạt tuyến.");
      setReloadVersion((value) => value + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể kích hoạt tuyến.");
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
            <p className="cq-page-subtitle max-w-2xl">Xây dựng các tuyến khám phá di sản TP.HCM.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit items-center rounded-full border border-slate-100 bg-[#F7F5EF] p-1">
              <Link href="/curator/routes" className="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-950 shadow-sm">Danh sách</Link>
              <Link href="/curator/routes/create" className="rounded-full px-4 py-2 text-xs font-medium text-slate-500 transition hover:text-slate-900">Trình tạo tuyến</Link>
            </div>

            <Button asChild variant="secondary" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 text-white shadow-sm">
              <Link href="/curator/routes/create">
                <Plus className="h-4 w-4" />
                Tuyến mới
              </Link>
            </Button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {isLoading ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Đang tải danh sách tuyến...</div>
        ) : routes.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Chưa có tuyến nào.</div>
        ) : (
          <div className="mt-7 grid auto-rows-fr gap-4 xl:grid-cols-2">
            {routes.map((route) => (
              <div key={route.routeId} className={`h-full ${publishingRouteId === route.routeId ? "pointer-events-none opacity-70" : ""}`}>
                <RouteCard route={route} onDelete={handleDelete} onPublish={handlePublish} />
              </div>
            ))}
          </div>
        )}

        {routes.length > 0 ? (
          <div className="mt-auto flex justify-end pt-6">
            <CuratorPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        ) : null}
      </section>
    </div>
  );
}