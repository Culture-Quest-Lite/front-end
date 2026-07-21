"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock3, MapPin, Route, Sparkles, Tag } from "lucide-react";

import { routeApi, type RouteResponse } from "@/services/api/routeApi";

const difficultyLabels: Record<string, string> = {
  EASY: "Dễ",
  MEDIUM: "Vừa",
  HARD: "Khó",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Bản nháp",
  RECORDING: "Đang ghi",
  TRIAL: "Đang thử nghiệm",
  PENDING: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  DELETED: "Đã xoá",
};

function parseRouteId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatStatus(status?: string) {
  const normalized = status?.trim().toUpperCase() || "DRAFT";
  return statusLabels[normalized] ?? normalized;
}

function OverviewStat({
  value,
  label,
  className = "",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`px-3 py-2 ${className}`}>
      <p className="text-[0.95rem] font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

export default function CuratorRouteDetailPage() {
  const params = useParams();
  const routeId = parseRouteId(params.slug);

  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (!routeId) {
        setError("Route ID không hợp lệ.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const routeResponse = await routeApi.getRouteById(routeId);

        if (cancelled) return;
        setRoute(routeResponse);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Không thể tải chi tiết tuyến.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRoute();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const sortedStops = useMemo(() => {
    return [...(route?.hotspots ?? [])].sort(
      (a, b) =>
        (a.index ?? a.orderIndex ?? Number.MAX_SAFE_INTEGER) -
        (b.index ?? b.orderIndex ?? Number.MAX_SAFE_INTEGER),
    );
  }, [route]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Đang tải chi tiết tuyến...
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="space-y-4">
        <Link
          href="/curator/routes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error || "Không tìm thấy tuyến."}
        </div>
      </div>
    );
  }

  const overviewStats = [
    { label: "Địa điểm", value: `${sortedStops.length} điểm` },
    { label: "Khoảng cách", value: `${route.totalDistance ?? 0} km` },
    { label: "Thời lượng", value: `${route.estimateTime ?? 0} phút` },
    {
      label: "Độ khó",
      value: difficultyLabels[route.difficulty] ?? route.difficulty,
    },
    { label: "Điểm XP", value: `${route.xp ?? 0} XP` },
    { label: "Điểm thưởng", value: String(route.point ?? 0) },
  ];

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-slate-700">
          <Link
            href="/curator/routes"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-2.5 w-2.5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
              Chi tiết tuyến
            </h1>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              Thông tin chi tiết tuyến hành trình.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-900">
              Tổng quan tuyến
            </p>
            <h2
              className="mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[1.85rem]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {route.routeName}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-600 sm:text-sm">
              {route.description || "Chưa có mô tả."}
            </p>
          </div>

          <div className="flex flex-nowrap items-center gap-1.5 self-start xl:self-auto">
            <span className="inline-flex shrink-0 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 shadow-sm">
              {formatStatus(route.status)}
            </span>
            {route.tags?.map((tag) => (
              <span
                key={tag.tagId}
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700"
              >
                <Tag className="mr-1 h-2.5 w-2.5" />
                {tag.tagName}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-y-2 border-y border-slate-200/80 py-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-y-0">
          {overviewStats.map((stat, index) => (
            <OverviewStat
              key={stat.label}
              value={stat.value}
              label={stat.label}
              className={
                index !== overviewStats.length - 1
                  ? "xl:border-r xl:border-slate-200"
                  : ""
              }
            />
          ))}
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div>
            <h3 className="cq-section-title">Điểm dừng trong tuyến</h3>
            <p className="cq-page-subtitle">
              Danh sách các địa điểm hiện có trong tuyến.
            </p>
          </div>

          {sortedStops.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
              Tuyến này chưa có điểm dừng nào.
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-200">
              {sortedStops.map((stop, index) => (
                <div
                  key={stop.routeHotspotId ?? `${stop.hotspotId}-${index}`}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#cf3d37] text-xs font-semibold text-white">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1 border-l border-slate-200 pl-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-semibold text-slate-900 sm:text-sm">
                            {stop.hotspotName}
                          </h4>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
                            {stop.address}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Điểm dừng {index + 1}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500 sm:text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Route className="h-3.5 w-3.5" />
                          Thứ tự: {index + 1}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          XP: {stop.xp ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5" />
                          Điểm: {stop.point ?? 0}
                        </span>
                        {typeof stop.distanceToNext === "number" ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            Tới điểm sau: {stop.distanceToNext.toFixed(2)} km
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
