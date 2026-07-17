"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Clock3,
  Plus,
  Route,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { hotspotApi, type BackendHotspot } from "@/services/api";
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

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-sm font-normal text-slate-900">{value}</p>
      <p className="cq-label mt-1">{label}</p>
    </div>
  );
}

export default function CuratorRouteDetailPage() {
  const params = useParams();
  const routeId = parseRouteId(params.slug);

  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [hotspots, setHotspots] = useState<BackendHotspot[]>([]);
  const [hotspotToAdd, setHotspotToAdd] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
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
        const [routeResponse, hotspotResponse] = await Promise.all([
          routeApi.getRouteById(routeId),
          hotspotApi.getHotspots(),
        ]);

        if (cancelled) return;
        setRoute(routeResponse);
        setHotspots(hotspotResponse);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không thể tải chi tiết tuyến.");
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
    (a, b) => (a.index ?? Number.MAX_SAFE_INTEGER) - (b.index ?? Number.MAX_SAFE_INTEGER),
  );
}, [route]);

  const addableHotspots = useMemo(() => {
    const currentIds = new Set(sortedStops.map((stop) => stop.hotspotId));
    return hotspots.filter((hotspot) => !currentIds.has(hotspot.hotspotId));
  }, [hotspots, sortedStops]);

  async function handleAddHotspot() {
    if (!routeId) return;
    const hotspotId = Number(hotspotToAdd);
    if (!Number.isInteger(hotspotId) || hotspotId <= 0) {
      toast.error("Vui lòng chọn hotspot cần thêm.");
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await routeApi.addHotspotToRoute(routeId, hotspotId);
      setRoute(response);
      setHotspotToAdd("");
      toast.success("Đã thêm hotspot vào cuối tuyến.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm hotspot.");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleRemoveHotspot(hotspotId: number) {
    if (!routeId) return;
    const ok = window.confirm("Bạn có chắc muốn xoá hotspot này khỏi tuyến không?");
    if (!ok) return;

    setIsActionLoading(true);
    try {
      const response = await routeApi.removeHotspotFromRoute(routeId, hotspotId);
      setRoute(response);
      toast.success("Đã xoá hotspot khỏi tuyến.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xoá hotspot khỏi tuyến.");
    } finally {
      setIsActionLoading(false);
    }
  }

  if (isLoading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Đang tải chi tiết tuyến...</div>;
  }

  if (error || !route) {
    return (
      <div className="space-y-4">
        <Link href="/curator/routes" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error || "Không tìm thấy tuyến."}</div>
      </div>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-slate-700">
        <Link
          href="/curator/routes"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-2.5 w-2.5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            Chi tiết tuyến
          </h1>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
            Thông tin chi tiết tuyến hành trình.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-900">
              Tổng quan tuyến
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              {route.routeName}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {route.description || "Chưa có mô tả."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 xl:w-auto xl:items-end">
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 shadow-sm">
              {formatStatus(route.status)}
            </span>
            <div className="flex flex-wrap gap-1.5 xl:justify-end">
              {route.tags?.map((tag) => (
                <span key={tag.tagId} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  <Tag className="mr-1 inline h-2.5 w-2.5" />
                  {tag.tagName}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <MetricTile value={`${sortedStops.length} điểm`} label="Hotspot" />
          <MetricTile value={`${route.totalDistance ?? 0} km`} label="Khoảng cách" />
          <MetricTile value={`${route.estimateTime ?? 0} phút`} label="Thời lượng" />
          <MetricTile value={difficultyLabels[route.difficulty] ?? route.difficulty} label="Độ khó" />
          <MetricTile value={`${route.xp ?? 0} XP`} label="Phần thưởng" />
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="cq-section-title">Điểm dừng trong tuyến</h3>
              <p className="cq-page-subtitle">
                Backend yêu cầu tuyến luôn có ít nhất 4 hotspot.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select value={hotspotToAdd} onChange={(event) => setHotspotToAdd(event.target.value)} className="h-10 min-w-72 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="">Chọn hotspot để thêm</option>
                {addableHotspots.map((hotspot) => (
                  <option key={hotspot.hotspotId} value={hotspot.hotspotId}>{hotspot.hotspotName}</option>
                ))}
              </select>
              <Button type="button" variant="secondary" className="rounded-full text-white" onClick={() => void handleAddHotspot()} disabled={isActionLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm cuối tuyến
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {sortedStops.map((stop, index) => (
              <div key={stop.routeHotspotId ?? `${stop.hotspotId}-${index}`} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-3.5 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#cf3d37] text-xs font-semibold text-white">{index + 1}</span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 sm:text-sm">{stop.hotspotName}</h4>
                      <p className="mt-1 text-xs font-normal leading-5 text-slate-500">{stop.address}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5" /> Thứ tự: {index + 1}</span>
                        <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> XP: {stop.xp ?? 0}</span>
                        {typeof stop.distanceToNext === "number" ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Tới điểm sau: {stop.distanceToNext.toFixed(2)} km</span> : null}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => void handleRemoveHotspot(stop.hotspotId)} disabled={isActionLoading || sortedStops.length <= 4} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 className="h-3.5 w-3.5" />
                    Xoá khỏi tuyến
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
