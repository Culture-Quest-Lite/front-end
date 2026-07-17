"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  LoaderCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildTagToken, type TagRecord } from "@/lib/tags";
import { hotspotApi, tagApi, type BackendHotspot } from "@/services/api";
import {
  routeApi,
  type RouteDifficulty,
  type RoutePayload,
} from "@/services/api/routeApi";

type RouteBuilderStep = 1 | 2 | 3 | 4 | 5 | 6;
type StepVisualState = "active" | "completed" | "upcoming";

const routeSteps = [
  { id: 1, label: "Chủ đề" },
  { id: 2, label: "Chọn hotspot" },
  { id: 3, label: "Sắp xếp" },
  { id: 4, label: "Thông tin" },
  { id: 5, label: "Xem trước" },
  { id: 6, label: "Lưu tuyến" },
];

const HOTSPOTS_PER_PAGE = 4;

const difficultyOptions: Array<{
  label: string;
  value: RouteDifficulty;
}> = [
    { label: "Dễ", value: "EASY" },
    { label: "Vừa", value: "MEDIUM" },
    { label: "Khó", value: "HARD" },
  ];

function getHotspotCover(hotspot: BackendHotspot) {
  return (
    hotspot.medias?.find((media) => media.mediaType === "IMAGE")?.fileUrl ||
    hotspot.medias?.[0]?.fileUrl ||
    ""
  );
}
const RouteHotspotMap = dynamic(
  () => import("@/components/map/map").then((mod) => mod.RouteHotspotMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[420px] place-items-center rounded-[1.5rem] border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Đang tải bản đồ...
      </div>
    ),
  },
);
function BuilderStep({
  id,
  label,
  state,
  interactive,
  onClick,
}: {
  id: number;
  label: string;
  state: StepVisualState;
  interactive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "inline-flex items-center gap-2 px-1 py-2 text-sm transition disabled:cursor-default disabled:opacity-100",
        state === "active"
          ? "rounded-full border border-[#F7DCE8] bg-[linear-gradient(90deg,_#eb489b_0%,_#f58752_58%,_#ffc93c_100%)] px-3 font-semibold text-white shadow-[0_14px_28px_rgba(235,72,155,0.18)]"
          : state === "completed"
            ? "font-medium text-emerald-700 hover:text-emerald-800"
            : interactive
              ? "font-medium text-slate-500 hover:text-slate-900"
              : "font-medium text-slate-400",
      )}
    >
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
          state === "active"
            ? "bg-white/20 text-white"
            : state === "completed"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-[#F7F5EF] text-slate-500",
        )}
      >
        {state === "completed" ? <CheckCircle2 className="h-4 w-4" /> : id}
      </span>
      <span>{label}</span>
    </button>
  );
}

function TagThemeCard({
  tag,
  selected,
  onToggle,
}: {
  tag: TagRecord;
  selected: boolean;
  onToggle: (tagId: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(tag.tagId)}
      className={cn(
        "w-full rounded-[1.75rem] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg",
        selected
          ? "border-[#f3b0a8] bg-[#fff5f2] shadow-sm"
          : "border-slate-200/80 bg-card shadow-sm",
      )}
      aria-pressed={selected}
    >
      <h3 className="cq-card-title sm:text-[0.95rem]">
        #{buildTagToken(tag.tagName)}
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-[0.8rem]">
        Chọn tag này để gắn chủ đề cho tuyến hành trình.
      </p>
    </button>
  );
}

function HotspotSelectionCard({
  item,
  selected,
  onToggle,
}: {
  item: BackendHotspot;
  selected: boolean;
  onToggle: (hotspotId: number) => void;
}) {
  const image = getHotspotCover(item);

  return (
    <button
      type="button"
      onClick={() => onToggle(item.hotspotId)}
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
        selected
          ? "border-[#f3b0a8] bg-[#fff5f2]"
          : "border-slate-200/80 bg-card",
      )}
    >
      <div
        className="relative h-36 w-full bg-slate-100 bg-cover bg-center"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <div
          className={cn(
            "absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition",
            selected
              ? "bg-[#cf3d37] text-white"
              : "bg-white/90 text-slate-500 group-hover:text-slate-900",
          )}
        >
          {selected ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="cq-card-title">{item.hotspotName}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {item.address}
        </p>
      </div>
    </button>
  );
}

function SortableHotspotRow({
  item,
  index,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  isDragging,
}: {
  item: BackendHotspot;
  index: number;
  onDragStart: (hotspotId: number) => void;
  onDragEnd: () => void;
  onDrop: (targetHotspotId: number) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  isDragging: boolean;
}) {
  const image = getHotspotCover(item);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.hotspotId)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={() => onDrop(item.hotspotId)}
      className={cn(
        "rounded-[1.5rem] border border-[#e6ddd2] bg-[#fcfbf8] p-3 shadow-sm transition sm:p-3.5",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="cursor-grab text-slate-400 active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#cf3d37] text-sm font-semibold text-white sm:h-9 sm:w-9">
          {index + 1}
        </div>

        <div
          role="img"
          aria-label={item.hotspotName}
          className="h-10 w-10 shrink-0 rounded-[0.9rem] bg-slate-100 bg-cover bg-center sm:h-12 sm:w-12 sm:rounded-[1rem]"
          style={image ? { backgroundImage: `url(${image})` } : undefined}
        />

        <div className="min-w-0">
          <h3 className="truncate text-[0.95rem] font-semibold text-slate-900">
            {item.hotspotName}
          </h3>
          <p className="mt-0.5 text-[0.8rem] text-slate-500">
            {item.address} · {item.xp ?? 0} XP
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-slate-500 sm:text-sm">{label}</span>
      <span className="cq-card-title text-right sm:text-[0.95rem]">
        {value}
      </span>
    </div>
  );
}

export default function CuratorRouteCreatePage() {
  const searchParams = useSearchParams();
  const routeIdParam = Number(searchParams.get("id"));
  const editingRouteId = Number.isInteger(routeIdParam) && routeIdParam > 0 ? routeIdParam : null;
  const isEditing = editingRouteId !== null;

  const [activeStep, setActiveStep] = useState<RouteBuilderStep>(1);
  const [hotspots, setHotspots] = useState<BackendHotspot[]>([]);
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedHotspotIds, setSelectedHotspotIds] = useState<number[]>([]);
  const [focusedHotspotId, setFocusedHotspotId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Mọi trạng thái");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hotspotPage, setHotspotPage] = useState(1);
  const [draggingHotspotId, setDraggingHotspotId] = useState<number | null>(null);
  const [routeTitle, setRouteTitle] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [routeDurationInput, setRouteDurationInput] = useState("120");
  const [routeDistanceInput, setRouteDistanceInput] = useState("3");
  const [routeXpInput, setRouteXpInput] = useState("100");
  const [routePointInput, setRoutePointInput] = useState("100");
  const [routeDifficulty, setRouteDifficulty] =
    useState<RouteDifficulty>("MEDIUM");
  const [currentRouteStatus, setCurrentRouteStatus] = useState<"DRAFT" | "RECORDING" | "TRIAL" | "PENDING" | "PUBLISHED" | "DELETED">("DRAFT");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [hotspotResponse, tagResponse] = await Promise.all([
          hotspotApi.getHotspots(),
          tagApi.getTags({ page: 0, size: 100, status: "ACTIVE" }),
        ]);

        if (cancelled) return;

        setHotspots(hotspotResponse);
        setTags(tagResponse.content);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editingRouteId === null || isLoading) return;

    const routeId = editingRouteId;
    let cancelled = false;

    async function loadRouteForEdit() {
      try {
        setError(null);
        const route = await routeApi.getRouteById(routeId);
        if (cancelled) return;

        setRouteTitle(route.routeName ?? "");
        setRouteDescription(route.description ?? "");
        setRouteDifficulty(route.difficulty ?? "MEDIUM");
        setCurrentRouteStatus(route.status);
        setRouteDurationInput(String(route.estimateTime ?? 0));
        setRouteDistanceInput(String(route.totalDistance ?? 0));
        setRouteXpInput(String(route.xp ?? 0));
        setRoutePointInput(String(route.point ?? 0));
        const tagId = route.tag?.tagId ?? route.tags?.[0]?.tagId;
        setSelectedTagIds(tagId ? [tagId] : []);
        setSelectedHotspotIds((route.hotspots ?? []).map((item) => item.hotspotId));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải tuyến để chỉnh sửa.");
        }
      }
    }

    void loadRouteForEdit();
    return () => { cancelled = true; };
  }, [editingRouteId, isLoading]);

  useEffect(() => {
    if (!isFilterOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsFilterOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFilterOpen]);

  const hotspotStatusOptions = useMemo(
    () => [
      "Mọi trạng thái",
      ...Array.from(
        new Set(
          hotspots
            .map((hotspot) => hotspot.status)
            .filter((status): status is string => Boolean(status)),
        ),
      ),
    ],
    [hotspots],
  );

  const filteredHotspots = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return hotspots.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.hotspotName, item.description, item.address]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(normalizedQuery),
          );

      const matchesStatus =
        selectedStatus === "Mọi trạng thái" || item.status === selectedStatus;

      return matchesQuery && matchesStatus;
    });
  }, [hotspots, searchQuery, selectedStatus]);

  const selectedHotspots = selectedHotspotIds
    .map((id) => hotspots.find((item) => item.hotspotId === id))
    .filter((item): item is BackendHotspot => Boolean(item));

  const hotspotPageCount = Math.max(
    1,
    Math.ceil(filteredHotspots.length / HOTSPOTS_PER_PAGE),
  );

  const currentHotspotPage = Math.min(hotspotPage, hotspotPageCount);

  const paginatedHotspots = filteredHotspots.slice(
    (currentHotspotPage - 1) * HOTSPOTS_PER_PAGE,
    currentHotspotPage * HOTSPOTS_PER_PAGE,
  );

  const hotspotPageNumbers = Array.from(
    { length: hotspotPageCount },
    (_, index) => index + 1,
  );

  const activeFilterCount = Number(selectedStatus !== "Mọi trạng thái");

  const estimatedDistance =
    selectedHotspots.length > 0
      ? `~${(selectedHotspots.length * 0.75).toFixed(1)} km`
      : `~${routeDistanceInput || 0} km`;

  const estimatedDuration =
    routeDurationInput.trim().length > 0
      ? `~${routeDurationInput.trim()} phút`
      : "~0 phút";

  const maxUnlockedStep: RouteBuilderStep =
    activeStep === 6
      ? 6
      : activeStep === 5
        ? 5
        : activeStep === 4
          ? 4
          : activeStep === 3
            ? 3
            : activeStep === 2 && selectedHotspots.length > 0
              ? 3
              : activeStep;

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setHotspotPage(1);
  }

  function handleStatusChange(value: string) {
    setSelectedStatus(value);
    setHotspotPage(1);
  }

  function handleResetHotspotFilters() {
    setSelectedStatus("Mọi trạng thái");
    setHotspotPage(1);
  }

  function handleStepChange(step: RouteBuilderStep) {
    if (step <= maxUnlockedStep) setActiveStep(step);
  }

  function toggleTag(tagId: number) {
    setSelectedTagIds((current) => (current[0] === tagId ? [] : [tagId]));
  }

  function handleToggleHotspot(hotspotId: number) {
    setSelectedHotspotIds((current) =>
      current.includes(hotspotId)
        ? current.filter((item) => item !== hotspotId)
        : [...current, hotspotId],
    );
  }

  function handleContinue() {
    setError(null);

    if (activeStep === 1) {
      if (selectedTagIds.length === 0) {
        setError("Vui lòng chọn ít nhất 1 chủ đề/tag.");
        return;
      }
      setActiveStep(2);
      return;
    }

    if (activeStep === 2) {
      if (selectedHotspots.length < 4) {
        setError("Tuyến đường phải có ít nhất 4 hotspot.");
        return;
      }
      setActiveStep(3);
      return;
    }

    if (activeStep === 3) {
      if (selectedHotspots.length < 4) {
        setError("Tuyến đường phải có ít nhất 4 hotspot.");
        return;
      }
      setActiveStep(4);
      return;
    }

    if (activeStep === 4) {
      if (!routeTitle.trim()) {
        setError("Vui lòng nhập tên tuyến.");
        return;
      }
      setActiveStep(5);
      return;
    }

    if (activeStep === 5) {
      setActiveStep(6);
    }
  }

  function handleBack() {
    setError(null);

    if (activeStep > 1) {
      setActiveStep((activeStep - 1) as RouteBuilderStep);
    }
  }

  function handleSortDragStart(hotspotId: number) {
    setDraggingHotspotId(hotspotId);
  }

  function handleSortDragEnd() {
    setDraggingHotspotId(null);
  }

  function handleSortDrop(targetHotspotId: number) {
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

  function handleRouteFilesSelected(fileList: FileList | null) {
    if (!fileList) return;

    const incomingFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );

    setSelectedFiles((current) => [
      ...current,
      ...incomingFiles.filter(
        (file) =>
          !current.some(
            (item) => item.name === file.name && item.size === file.size,
          ),
      ),
    ]);
  }

  function removeRouteFile(index: number) {
    setSelectedFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function buildPayload(): RoutePayload {
    const routeName = routeTitle.trim();
    const description = routeDescription.trim();

    if (!routeName) throw new Error("Vui lòng nhập tên tuyến.");
    if (selectedTagIds.length === 0) throw new Error("Vui lòng chọn tag.");
    if (selectedHotspotIds.length < 4) {
      throw new Error("Tuyến đường phải có ít nhất 4 hotspot.");
    }

    const estimateTime = Number(routeDurationInput);
    const totalDistance = Number(routeDistanceInput);
    const xp = Number(routeXpInput);
    const point = Number(routePointInput);

    if (!Number.isFinite(estimateTime) || estimateTime <= 0) {
      throw new Error("Thời lượng phải lớn hơn 0.");
    }

    if (!Number.isFinite(totalDistance) || totalDistance <= 0) {
      throw new Error("Khoảng cách phải lớn hơn 0.");
    }

    if (!Number.isInteger(xp) || xp < 0) {
      throw new Error("XP phải là số nguyên >= 0.");
    }

    if (!Number.isInteger(point) || point < 0) {
      throw new Error("Point phải là số nguyên >= 0.");
    }
    console.log("========== CREATE ROUTE ==========");
    console.log("selectedFiles:", selectedFiles);

    selectedFiles.forEach((file, index) => {
      console.log(`File ${index}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });

    console.log("==================================");
    return {
      routeName,
      description,
      difficulty: routeDifficulty,
      estimateTime,
      totalDistance,
      hotspotIds: selectedHotspotIds,
      tagId: selectedTagIds[0],
      xp,
      point,
      status: isEditing ? currentRouteStatus : "DRAFT",
      files: isEditing ? undefined : selectedFiles,
    };
  }

  async function handleSubmitRoute() {
    try {
      setError(null);
      setIsSubmitting(true);

      const payload = buildPayload();
      const response = isEditing && editingRouteId
        ? await routeApi.updateRoute(editingRouteId, payload)
        : await routeApi.createRoute(payload);

      window.location.href = `/curator/routes/${response.routeId}`;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Không thể cập nhật tuyến."
            : "Không thể tạo tuyến.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewPositions = [
    { x: 15, y: 78 },
    { x: 40, y: 48 },
    { x: 70, y: 68 },
    { x: 87, y: 35 },
    { x: 58, y: 24 },
    { x: 26, y: 30 },
  ];

  const previewHotspots = selectedHotspots.map((item, index) => ({
    item,
    index,
    position: previewPositions[index % previewPositions.length],
  }));

  const previewPolylinePoints = previewHotspots
    .map(({ position }) => `${position.x},${position.y}`)
    .join(" ");

  function renderMainContent() {
    if (activeStep === 1) {
      return (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Chọn chủ đề tuyến
          </h2>

          {tags.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {tags.map((tag) => (
                <TagThemeCard
                  key={tag.tagId}
                  tag={tag}
                  selected={selectedTagIds.includes(tag.tagId)}
                  onToggle={toggleTag}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-[#faf9f6] px-6 py-10 text-center text-sm text-slate-500">
              Chưa có tag nào khả dụng.
            </div>
          )}
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Chọn hotspot
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn tối thiểu 4 hotspot để tạo tuyến hành trình.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="relative min-w-0 w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => handleSearchQueryChange(event.target.value)}
                placeholder="Tìm theo tên hotspot hoặc địa chỉ..."
                className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div ref={filterMenuRef} className="relative w-full sm:w-auto sm:justify-self-end">
              <button
                type="button"
                onClick={() => setIsFilterOpen((open) => !open)}
                className="relative ml-auto flex h-11 w-16 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left shadow-sm transition hover:border-[#F7DCE8] hover:shadow-md"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F7] text-[#D94A8D]">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                {activeFilterCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#D94A8D] px-1 text-[10px] font-semibold text-white shadow-sm">
                    {activeFilterCount}
                  </span>
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-400 transition",
                    isFilterOpen && "rotate-180 text-[#D94A8D]",
                  )}
                />
              </button>

              {isFilterOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(24rem,calc(100vw-2rem))] rounded-[1.5rem] border border-[#F3E3EA] bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Trạng thái
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hotspotStatusOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleStatusChange(option)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition",
                          selectedStatus === option
                            ? "border-[#F7DCE8] bg-[#FFF1F7] font-medium text-[#D94A8D] shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#F7DCE8] hover:text-[#D94A8D]",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={handleResetHotspotFilters}
                      className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      Đặt lại
                    </button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-full px-4 text-white"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Xong
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-[#F7F5EF] px-4 py-3 text-xs text-slate-600">
            <span>
              {filteredHotspots.length} hotspot phù hợp ·{" "}
              {selectedHotspots.length} điểm đang được chọn
            </span>
            {selectedHotspots.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedHotspotIds([])}
                className="font-medium text-[#cf3d37] transition hover:text-[#bf342f]"
              >
                Xóa tất cả lựa chọn
              </button>
            ) : null}
          </div>

          {filteredHotspots.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-2">
                {paginatedHotspots.map((item) => (
                  <HotspotSelectionCard
                    key={item.hotspotId}
                    item={item}
                    selected={selectedHotspotIds.includes(item.hotspotId)}
                    onToggle={handleToggleHotspot}
                  />
                ))}
              </div>

              {hotspotPageCount > 1 ? (
                <div className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Trang {currentHotspotPage} / {hotspotPageCount}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {hotspotPageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setHotspotPage(pageNumber)}
                        className={cn(
                          "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full px-3 text-sm transition",
                          currentHotspotPage === pageNumber
                            ? "bg-[linear-gradient(90deg,_#eb489b_0%,_#f58752_58%,_#ffc93c_100%)] font-semibold text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-[#F7DCE8] hover:text-[#D94A8D]",
                        )}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-[#faf9f6] px-6 py-10 text-center text-sm text-slate-500">
              Không tìm thấy hotspot phù hợp.
            </div>
          )}
        </div>
      );
    }

    if (activeStep === 3) {
      return (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Sắp xếp thứ tự
          </h2>

          {selectedHotspots.length > 0 ? (
            <div className="space-y-4">
              {selectedHotspots.map((item, index) => (
                <SortableHotspotRow
                  key={item.hotspotId}
                  item={item}
                  index={index}
                  onDragStart={handleSortDragStart}
                  onDragEnd={handleSortDragEnd}
                  onDrop={handleSortDrop}
                  onDragOver={(event) => event.preventDefault()}
                  isDragging={draggingHotspotId === item.hotspotId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-[#faf9f6] px-6 py-10 text-center text-sm text-slate-500">
              Chưa có hotspot nào để sắp xếp.
            </div>
          )}
        </div>
      );
    }

    if (activeStep === 4) {
      return (
        <div className="space-y-4">
          <h2 className="text-[1.1rem] font-semibold text-slate-900">
            Thông tin tuyến
          </h2>

          <Input
            value={routeTitle}
            onChange={(event) => setRouteTitle(event.target.value)}
            placeholder="Nhập tên tuyến"
            aria-label="Tên tuyến"
            className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8]"
          />

          <textarea
            value={routeDescription}
            onChange={(event) => setRouteDescription(event.target.value)}
            placeholder="Mô tả tuyến"
            className="min-h-28 w-full resize-none rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8] px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="rounded-[1.05rem] border border-dashed border-[#e6ddd2] bg-[#fcfbf8] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Hình ảnh tuyến
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Thêm một hoặc nhiều ảnh đại diện cho tuyến bản nháp.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#cf3d37]/20 bg-white px-4 py-2 text-sm font-medium text-[#cf3d37] shadow-sm transition hover:bg-[#fff2ef]">
                <Upload className="h-4 w-4" />
                Thêm ảnh
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleRouteFilesSelected(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {selectedFiles.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center gap-3 rounded-[1rem] border border-[#e6ddd2] bg-white p-2.5"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[0.8rem] bg-[#fff2ef] text-[#cf3d37]">
                      <ImageIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRouteFile(index)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      aria-label={`Xoá ảnh ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={routeDurationInput}
              onChange={(event) => setRouteDurationInput(event.target.value)}
              placeholder="Thời lượng/phút"
              type="number"
              className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8]"
            />

            <Input
              value={routeDistanceInput}
              onChange={(event) => setRouteDistanceInput(event.target.value)}
              placeholder="Khoảng cách/km"
              type="number"
              className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8]"
            />

            <Input
              value={routeXpInput}
              onChange={(event) => setRouteXpInput(event.target.value)}
              placeholder="XP"
              type="number"
              className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8]"
            />

            <Input
              value={routePointInput}
              onChange={(event) => setRoutePointInput(event.target.value)}
              placeholder="Point"
              type="number"
              className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8]"
            />

            <select
              value={routeDifficulty}
              onChange={(event) =>
                setRouteDifficulty(event.target.value as RouteDifficulty)
              }
              className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8] px-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {difficultyOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (activeStep === 5) {
      return (
        <div className="space-y-4">
          <h2 className="text-[1.1rem] font-semibold text-slate-900">
            Xem trước tuyến
          </h2>

          <div className="overflow-hidden rounded-[1.75rem] border border-[#d8d2ca] bg-[#f9f8f3] shadow-sm">
            <RouteHotspotMap
              hotspots={selectedHotspots}
              selectedIds={selectedHotspotIds}
              focusedHotspotId={focusedHotspotId}
              onToggle={handleToggleHotspot}
            />

            <div className="border-t border-[#e9e3da] bg-white/80 px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedHotspots.map((item, index) => (
                  <button
                    key={item.hotspotId}
                    type="button"
                    onClick={() => setFocusedHotspotId(item.hotspotId)}
                    className={cn(
                      "group w-full rounded-[1.35rem] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
                      focusedHotspotId === item.hotspotId
                        ? "border-[#cf3d37] ring-1 ring-[#cf3d37]/20"
                        : "border-slate-200"
                    )}
                  >
                    <div className="flex gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#fff2ef] text-sm font-semibold text-[#cf3d37]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {item.hotspotName}
                        </h3>
                        {item.address ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {item.address}
                          </p>
                        ) : null}
                        {item.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {item.description}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                          {item.xp != null ? (
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              XP {item.xp}
                            </span>
                          ) : null}
                          {item.point != null ? (
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              Point {item.point}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex min-h-[13rem] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-100/70">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mt-4 text-[1.45rem] font-semibold tracking-[-0.02em] text-slate-900">
            {isEditing ? "Sẵn sàng cập nhật tuyến" : "Sẵn sàng tạo bản nháp"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isEditing ? "Kiểm tra lại thông tin trước khi lưu thay đổi." : "Tuyến sẽ được tạo ở trạng thái bản nháp."}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={isSubmitting}
            onClick={() => void handleSubmitRoute()}
            className="mt-5 rounded-full border border-[#cf3d37] bg-[#cf3d37] px-5 text-sm text-white shadow-sm hover:bg-[#bf342f]"
          >
            {isSubmitting ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isEditing ? "Cập nhật tuyến" : "Tạo bản nháp"}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="cq-page-title">Tuyến hành trình</h1>
            <p className="cq-page-subtitle max-w-2xl">
              Xây dựng các tuyến khám phá di sản TP.HCM.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit items-center rounded-full border border-slate-100 bg-[#F7F5EF] p-1">
              <Link
                href="/curator/routes"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                Danh sách
              </Link>
              <Link
                href="/curator/routes/create"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-sm"
              >
                Trình tạo tuyến
              </Link>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-[1.75rem] border border-slate-200/80 bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {routeSteps.map((step) => {
              const stepState: StepVisualState =
                activeStep === step.id
                  ? "active"
                  : step.id < activeStep
                    ? "completed"
                    : "upcoming";

              return (
                <div key={step.id} className="flex items-center gap-2 lg:gap-3">
                  <BuilderStep
                    id={step.id}
                    label={step.label}
                    state={stepState}
                    interactive={step.id <= maxUnlockedStep}
                    onClick={
                      step.id <= maxUnlockedStep
                        ? () => handleStepChange(step.id as RouteBuilderStep)
                        : undefined
                    }
                  />
                  {step.id < routeSteps.length ? (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_29rem]">
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-card p-5 shadow-sm sm:p-6">
            {renderMainContent()}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-200/80 bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Tóm tắt
              </h2>

              <div className="mt-5 space-y-4">
                <SummaryRow label="Số tag" value={selectedTagIds.length} />
                <SummaryRow
                  label="Số hotspot"
                  value={selectedHotspots.length}
                />
                <SummaryRow label="Khoảng cách" value={estimatedDistance} />
                <SummaryRow label="Thời lượng" value={estimatedDuration} />
                <SummaryRow label="Độ khó" value={routeDifficulty} />
              </div>

              {activeStep === 2 ? (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="cq-label">Hotspot đã chọn</p>
                    {selectedHotspots.length > 0 ? (
                      <span className="text-xs font-medium text-slate-500">
                        {selectedHotspots.length} điểm
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-3">
                    {selectedHotspots.length > 0 ? (
                      selectedHotspots.map((item) => (
                        <div
                          key={item.hotspotId}
                          className="flex items-start gap-3 rounded-[1.25rem] bg-[#F7F5EF] p-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-sm">
                            {(item.hotspotName ?? "H").charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {item.hotspotName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {item.address}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleHotspot(item.hotspotId)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
                            aria-label={`Bỏ chọn ${item.hotspotName}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.25rem] bg-[#F7F5EF] p-4 text-xs leading-5 text-slate-500">
                        Chưa có hotspot nào được chọn.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={activeStep === 1}
                onClick={handleBack}
                className="rounded-full px-4 py-2 shadow-sm"
              >
                Quay lại
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleContinue}
                disabled={activeStep === 6 || isSubmitting}
                className="rounded-full px-4 py-2 shadow-sm"
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}