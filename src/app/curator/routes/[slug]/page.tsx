"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  PencilLine,
  Plus,
  Route,
  ShieldCheck,
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
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
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
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#cf3d37]" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

export default function CuratorRouteDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  async function reloadRoute() {
    if (!routeId) return;
    const response = await routeApi.getRouteById(routeId);
    setRoute(response);
  }

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

  async function handleDeleteRoute() {
    if (!routeId) return;
    const ok = window.confirm("Bạn có chắc muốn xoá tuyến này không?");
    if (!ok) return;

    setIsActionLoading(true);
    try {
      await routeApi.deleteRoute(routeId);
      toast.success("Đã xoá tuyến.");
      router.push("/curator/routes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xoá tuyến.");
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
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-4 flex items-center gap-3">
              <Link href="/curator/routes" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Chi tiết tuyến
              </span>
            </div>

            <p className="cq-kicker">Tổng quan tuyến</p>
            <h1 className="cq-detail-title mt-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              {route.routeName}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">{route.description || "Chưa có mô tả."}</p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              {formatStatus(route.status)}
            </span>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {route.tags?.map((tag) => (
                <span key={tag.tagId} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Tag className="mr-1 inline h-3 w-3" />
                  {tag.tagName}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/curator/routes/create?id=${route.routeId}`}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </Link>
              </Button>
              <Button type="button" variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => void handleDeleteRoute()} disabled={isActionLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Xoá tuyến
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricTile value={`${sortedStops.length} điểm`} label="Hotspot" />
          <MetricTile value={`${route.totalDistance ?? 0} km`} label="Khoảng cách" />
          <MetricTile value={`${route.estimateTime ?? 0} phút`} label="Thời lượng" />
          <MetricTile value={difficultyLabels[route.difficulty] ?? route.difficulty} label="Độ khó" />
          <MetricTile value={`${route.xp ?? 0} XP`} label="Phần thưởng" />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="cq-section-title">Điểm dừng trong tuyến</h2>
            <p className="cq-page-subtitle">Backend yêu cầu tuyến luôn có ít nhất 4 hotspot.</p>
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
            <div key={stop.routeHotspotId ?? `${stop.hotspotId}-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#cf3d37] text-sm font-semibold text-white">{index + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{stop.hotspotName}</h3>
                    <p className="mt-1 text-xs text-slate-500">{stop.address}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5" /> Index API: {stop.index}</span>
                      <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> XP: {stop.xp ?? 0}</span>
                      {typeof stop.distanceToNext === "number" ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Tới điểm sau: {stop.distanceToNext.toFixed(2)} km</span> : null}
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => void handleRemoveHotspot(stop.hotspotId)} disabled={isActionLoading || sortedStops.length <= 4} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                  <Trash2 className="h-3.5 w-3.5" />
                  Xoá khỏi tuyến
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
