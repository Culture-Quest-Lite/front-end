"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { CuratorPagination } from "@/components/curator/CuratorPagination";
import { routeApi, type RouteResponse } from "@/services/api/routeApi";
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
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  DELETED: "Đã xoá",
};

const statusClasses: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
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

function RouteCard({ route, onDelete }: { route: RouteResponse; onDelete: (id: number) => void }) {
  const hotspots = route.hotspots ?? [];
  const tags = route.tags ?? [];

  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-col gap-4">
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
          <span>{hotspots.length} hotspot</span>
          <span>XP: {route.xp ?? 0}</span>
          <span>Point: {route.point ?? 0}</span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => onDelete(route.routeId)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xoá
          </button>
          <Link
            href={`/curator/routes/${route.routeId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#e35a48] transition hover:text-[#c74735]"
          >
            Mở tuyến
            <ChevronRight className="h-4 w-4" />
          </Link>
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

        if (cancelled) return;
        setRoutes(response.content);
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
          <div className="mt-7 grid gap-4 xl:grid-cols-2">
            {routes.map((route) => (
              <RouteCard key={route.routeId} route={route} onDelete={handleDelete} />
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
