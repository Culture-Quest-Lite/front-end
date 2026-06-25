"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, CheckCircle2, GripVertical, LoaderCircle, Plus, Save, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildTagToken, type TagRecord } from "@/lib/tags";
import { hotspotApi, tagApi, type BackendHotspot } from "@/services/api";
import {
  routeApi,
  type RouteDifficulty,
  type RoutePayload,
  type RouteResponse,
} from "@/services/api/routeApi";

type FormState = {
  routeName: string;
  description: string;
  difficulty: RouteDifficulty;
  estimateTime: string;
  totalDistance: string;
  xp: string;
  point: string;
};

const defaultForm: FormState = {
  routeName: "",
  description: "",
  difficulty: "MEDIUM",
  estimateTime: "120",
  totalDistance: "3",
  xp: "100",
  point: "100",
};

function parseEditId(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getHotspotCover(hotspot: BackendHotspot) {
  return hotspot.medias?.find((media) => media.mediaType === "IMAGE")?.fileUrl || hotspot.medias?.[0]?.fileUrl;
}

function parsePositiveNumber(label: string, value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} phải là số lớn hơn 0.`);
  }
  return parsed;
}

function parsePositiveIntegerOrZero(label: string, value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} phải là số nguyên >= 0.`);
  }
  return parsed;
}

function toPayload(form: FormState, selectedHotspotIds: number[], selectedTagIds: number[]): RoutePayload {
  const routeName = form.routeName.trim();
  const description = form.description.trim();

  if (!routeName) throw new Error("Vui lòng nhập tên tuyến.");
  if (selectedHotspotIds.length < 4) throw new Error("Tuyến đường phải có ít nhất 4 hotspot.");
  if (selectedTagIds.length === 0) throw new Error("Vui lòng chọn ít nhất 1 tag.");

  return {
    routeName,
    description,
    difficulty: form.difficulty,
    estimateTime: parsePositiveNumber("Thời gian ước tính", form.estimateTime),
    totalDistance: parsePositiveNumber("Tổng khoảng cách", form.totalDistance),
    hotspots: selectedHotspotIds.map((hotspotId, index) => ({ hotspotId, index })),
    tagIds: selectedTagIds,
    xp: parsePositiveIntegerOrZero("XP", form.xp),
    point: parsePositiveIntegerOrZero("Point", form.point),
  };
}

function mapRouteToForm(route: RouteResponse): FormState {
  return {
    routeName: route.routeName ?? "",
    description: route.description ?? "",
    difficulty: route.difficulty ?? "MEDIUM",
    estimateTime: String(route.estimateTime ?? 120),
    totalDistance: String(route.totalDistance ?? 3),
    xp: String(route.xp ?? 100),
    point: String(route.point ?? 100),
  };
}

export default function CuratorRouteCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <CuratorRouteCreateContent />
    </Suspense>
  );
}

function CuratorRouteCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingRouteId = parseEditId(searchParams.get("id"));
  const isEditMode = editingRouteId !== null;

  const [form, setForm] = useState<FormState>(defaultForm);
  const [hotspots, setHotspots] = useState<BackendHotspot[]>([]);
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [selectedHotspotIds, setSelectedHotspotIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggingHotspotId, setDraggingHotspotId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [hotspotResponse, tagResponse, routeResponse] = await Promise.all([
          hotspotApi.getHotspots(),
          tagApi.getTags({ page: 0, size: 100, status: "ACTIVE" }),
          editingRouteId ? routeApi.getRouteById(editingRouteId) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setHotspots(hotspotResponse);
        setTags(tagResponse.content);

        if (routeResponse) {
          setForm(mapRouteToForm(routeResponse));
          setSelectedTagIds(routeResponse.tags?.map((tag) => tag.tagId) ?? []);
          setSelectedHotspotIds(
            [...(routeResponse.hotspots ?? [])]
              .sort((a, b) => a.index - b.index)
              .map((hotspot) => hotspot.hotspotId),
          );
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu tạo tuyến.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [editingRouteId]);

  const filteredHotspots = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return hotspots;

    return hotspots.filter((hotspot) =>
      [hotspot.hotspotName, hotspot.address, hotspot.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [hotspots, searchQuery]);

  const selectedHotspots = selectedHotspotIds
    .map((id) => hotspots.find((hotspot) => hotspot.hotspotId === id))
    .filter((hotspot): hotspot is BackendHotspot => Boolean(hotspot));

  function updateField<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleHotspot(hotspotId: number) {
    setSelectedHotspotIds((current) =>
      current.includes(hotspotId)
        ? current.filter((id) => id !== hotspotId)
        : [...current, hotspotId],
    );
  }

  function toggleTag(tagId: number) {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  function handleDrop(targetHotspotId: number) {
    if (!draggingHotspotId || draggingHotspotId === targetHotspotId) {
      setDraggingHotspotId(null);
      return;
    }

    setSelectedHotspotIds((current) => {
      const next = [...current];
      const fromIndex = next.indexOf(draggingHotspotId);
      const toIndex = next.indexOf(targetHotspotId);
      if (fromIndex === -1 || toIndex === -1) return current;
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDraggingHotspotId(null);
  }

  async function handleSubmit() {
    setError(null);

    try {
      const payload = toPayload(form, selectedHotspotIds, selectedTagIds);
      setIsSubmitting(true);

      if (isEditMode && editingRouteId) {
        await routeApi.updateRoute(editingRouteId, payload);
        toast.success("Đã cập nhật tuyến.");
        router.push(`/curator/routes/${editingRouteId}`);
      } else {
        const response = await routeApi.createRoute(payload);
        toast.success("Đã tạo tuyến. Vui lòng chờ admin duyệt.");
        router.push(`/curator/routes/${response.routeId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu tuyến.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/curator/routes" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="cq-page-title">{isEditMode ? "Chỉnh sửa tuyến" : "Tạo tuyến hành trình"}</h1>
            <p className="cq-page-subtitle max-w-2xl">Route API dùng JSON, không upload media trực tiếp.</p>
          </div>
        </div>

        <Button type="button" variant="secondary" className="rounded-full text-white" onClick={() => void handleSubmit()} disabled={isSubmitting || isLoading}>
          {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditMode ? "Lưu cập nhật" : "Tạo tuyến"}
        </Button>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {isLoading ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.8fr)]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="cq-section-title">Thông tin tuyến</h2>
              <div className="mt-5 grid gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Tên tuyến</label>
                  <Input value={form.routeName} onChange={(event) => updateField("routeName", event.target.value)} placeholder="Nhập tên tuyến" className="h-12 rounded-2xl" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Mô tả</label>
                  <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Mô tả tuyến" className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Độ khó</label>
                    <select value={form.difficulty} onChange={(event) => updateField("difficulty", event.target.value as RouteDifficulty)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <option value="EASY">Dễ</option>
                      <option value="MEDIUM">Vừa</option>
                      <option value="HARD">Khó</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Thời gian ước tính/phút</label>
                    <Input type="number" value={form.estimateTime} onChange={(event) => updateField("estimateTime", event.target.value)} className="h-12 rounded-2xl" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Tổng khoảng cách/km</label>
                    <Input type="number" step="any" value={form.totalDistance} onChange={(event) => updateField("totalDistance", event.target.value)} className="h-12 rounded-2xl" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">XP</label>
                    <Input type="number" value={form.xp} onChange={(event) => updateField("xp", event.target.value)} className="h-12 rounded-2xl" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Point</label>
                    <Input type="number" value={form.point} onChange={(event) => updateField("point", event.target.value)} className="h-12 rounded-2xl" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="cq-section-title">Chọn hotspot</h2>
              <p className="mt-1 text-sm text-slate-500">Backend yêu cầu ít nhất 4 hotspot. Thứ tự gửi lên bắt đầu từ index 0.</p>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm hotspot" className="h-11 rounded-full pl-11" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {filteredHotspots.map((hotspot) => {
                  const selected = selectedHotspotIds.includes(hotspot.hotspotId);
                  const image = getHotspotCover(hotspot);

                  return (
                    <button key={hotspot.hotspotId} type="button" onClick={() => toggleHotspot(hotspot.hotspotId)} className={cn("overflow-hidden rounded-2xl border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", selected ? "border-[#f3b0a8] bg-[#fff5f2]" : "border-slate-200 bg-white")}>
                      <div className="flex gap-3 p-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {image ? <img src={image} alt={hotspot.hotspotName ?? "Hotspot"} className="h-full w-full object-cover" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-1 text-sm font-semibold text-slate-900">{hotspot.hotspotName}</p>
                            {selected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Plus className="h-4 w-4 shrink-0 text-slate-400" />}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{hotspot.address}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="cq-section-title">Tags</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.tagId);
                  return (
                    <button key={tag.tagId} type="button" onClick={() => toggleTag(tag.tagId)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", selected ? "border-[#F7DCE8] bg-[#FFF1F7] text-[#D94A8D]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                      #{buildTagToken(tag.tagName)}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="cq-section-title">Thứ tự tuyến</h2>
                  <p className="mt-1 text-xs text-slate-500">Kéo thả để sắp xếp lại.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{selectedHotspots.length}/4+</span>
              </div>

              <div className="mt-4 space-y-3">
                {selectedHotspots.length > 0 ? selectedHotspots.map((hotspot, index) => (
                  <div
                    key={hotspot.hotspotId}
                    draggable
                    onDragStart={() => setDraggingHotspotId(hotspot.hotspotId)}
                    onDragEnd={() => setDraggingHotspotId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(hotspot.hotspotId)}
                    className={cn("flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3", draggingHotspotId === hotspot.hotspotId && "opacity-60")}
                  >
                    <GripVertical className="h-4 w-4 cursor-grab text-slate-400" />
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#cf3d37] text-xs font-semibold text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{hotspot.hotspotName}</p>
                      <p className="truncate text-xs text-slate-500">{hotspot.address}</p>
                    </div>
                    <button type="button" onClick={() => toggleHotspot(hotspot.hotspotId)} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">Chưa chọn hotspot.</div>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
