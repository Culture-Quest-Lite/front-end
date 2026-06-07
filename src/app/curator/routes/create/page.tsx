"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { hotspotItems, type HotspotItem } from "@/data/hotspots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RouteThemeId = "timeline" | "geo" | "culture" | "character" | "story";
type RouteBuilderStep = 1 | 2 | 3 | 4 | 5 | 6;
type StepVisualState = "active" | "completed" | "upcoming";

type RouteTheme = {
  id: RouteThemeId;
  title: string;
  description: string;
  distance: string;
  duration: string;
};

const routeSteps = [
  { id: 1, label: "Chủ đề" },
  { id: 2, label: "Chọn hotspot" },
  { id: 3, label: "Sắp xếp" },
  { id: 4, label: "Thông tin" },
  { id: 5, label: "Xem trước" },
  { id: 6, label: "Gửi duyệt" },
];

const routeThemes: RouteTheme[] = [
  {
    id: "timeline",
    title: "Dòng thời gian lịch sử",
    description: "Logic sắp xếp tự động dựa trên dòng thời gian lịch sử.",
    distance: "~3.1 km",
    duration: "~120 phút",
  },
  {
    id: "geo",
    title: "Tối ưu địa lý",
    description: "Logic sắp xếp tự động dựa trên tối ưu địa lý.",
    distance: "~2.2 km",
    duration: "~95 phút",
  },
  {
    id: "culture",
    title: "Chủ đề văn hoá",
    description: "Logic sắp xếp tự động dựa trên chủ đề văn hoá.",
    distance: "~2.8 km",
    duration: "~110 phút",
  },
  {
    id: "character",
    title: "Hành trình nhân vật",
    description: "Logic sắp xếp tự động dựa trên hành trình nhân vật.",
    distance: "~4.0 km",
    duration: "~145 phút",
  },
  {
    id: "story",
    title: "Chuỗi câu chuyện",
    description: "Logic sắp xếp tự động dựa trên chuỗi câu chuyện.",
    distance: "~3.5 km",
    duration: "~130 phút",
  },
];

const hotspotCategoryOptions = [
  "Tất cả",
  ...Array.from(new Set(hotspotItems.map((item) => item.category))),
];

const hotspotStatusOptions = [
  "Mọi trạng thái",
  ...Array.from(new Set(hotspotItems.map((item) => item.status))),
];

const HOTSPOTS_PER_PAGE = 4;

const themeDistanceOffsets: Record<RouteThemeId, number> = {
  timeline: 0.8,
  geo: 0.4,
  culture: 0.55,
  character: 1.05,
  story: 0.9,
};

const themeDurationOffsets: Record<RouteThemeId, number> = {
  timeline: 30,
  geo: 18,
  culture: 24,
  character: 38,
  story: 28,
};

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

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: RouteTheme;
  selected: boolean;
  onSelect: (id: RouteThemeId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      className={cn(
        "w-full rounded-[1.75rem] border p-5 text-left transition",
        "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf3d37]/20",
        selected
          ? "border-[#f3b0a8] bg-[#fff5f2] shadow-sm"
          : "border-slate-200/80 bg-card shadow-sm",
      )}
      aria-pressed={selected}
    >
      <h3 className="cq-card-title sm:text-[0.95rem]">{theme.title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-[0.8rem]">
        {theme.description}
      </p>
    </button>
  );
}

function HotspotSelectionCard({
  item,
  selected,
  onToggle,
}: {
  item: HotspotItem;
  selected: boolean;
  onToggle: (slug: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.slug)}
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
        style={{ backgroundImage: `url(${item.image})` }}
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
        <h3 className="cq-card-title">{item.title}</h3>
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
  item: HotspotItem;
  index: number;
  onDragStart: (slug: string) => void;
  onDragEnd: () => void;
  onDrop: (targetSlug: string) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  isDragging: boolean;
}) {
  const subtitleParts = item.subtitle.split("·").map((part) => part.trim());
  const district = subtitleParts[subtitleParts.length - 1] ?? item.subtitle;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.slug)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={() => onDrop(item.slug)}
      className={cn(
        "rounded-[1.5rem] border border-[#e6ddd2] bg-[#fcfbf8] p-3 shadow-sm transition sm:p-3.5",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="cursor-grab text-slate-400 active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#cf3d37] text-sm font-semibold text-white sm:h-9 sm:w-9">
            {index + 1}
          </div>

          <div
            role="img"
            aria-label={item.title}
            className="h-10 w-10 shrink-0 rounded-[0.9rem] bg-slate-100 bg-cover bg-center sm:h-12 sm:w-12 sm:rounded-[1rem]"
            style={{ backgroundImage: `url(${item.image})` }}
          />

          <div className="min-w-0">
            <h3 className="truncate text-[0.95rem] font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-0.5 text-[0.8rem] text-slate-500">
              {district} . {item.xp}
            </p>
          </div>
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
  const [activeStep, setActiveStep] = useState<RouteBuilderStep>(1);
  const [selectedThemeId, setSelectedThemeId] = useState<RouteThemeId>(
    routeThemes[0].id,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    hotspotCategoryOptions[0],
  );
  const [selectedStatus, setSelectedStatus] = useState(hotspotStatusOptions[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hotspotPage, setHotspotPage] = useState(1);
  const [selectedHotspotSlugs, setSelectedHotspotSlugs] = useState<string[]>(
    [],
  );
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const [routeTitle, setRouteTitle] = useState(
    "Hành trình 30/4 - Phiên bản 2025",
  );
  const [routeDescription, setRouteDescription] = useState(
    "Khám phá những điểm trọng yếu của ngày giải phóng miền Nam, từ Dinh Độc Lập đến phố đi bộ Nguyễn Huệ.",
  );
  const [routeDurationInput, setRouteDurationInput] = useState("120");
  const [routeDifficulty, setRouteDifficulty] = useState("Vừa");
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const selectedTheme =
    routeThemes.find((theme) => theme.id === selectedThemeId) ?? routeThemes[0];

  useEffect(() => {
    if (!isFilterOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFilterOpen]);

  const activeFilterCount =
    Number(selectedCategory !== hotspotCategoryOptions[0]) +
    Number(selectedStatus !== hotspotStatusOptions[0]);

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setHotspotPage(1);
  }

  function handleCategoryChange(value: string) {
    setSelectedCategory(value);
    setHotspotPage(1);
  }

  function handleStatusChange(value: string) {
    setSelectedStatus(value);
    setHotspotPage(1);
  }

  function handleResetHotspotFilters() {
    setSelectedCategory(hotspotCategoryOptions[0]);
    setSelectedStatus(hotspotStatusOptions[0]);
    setHotspotPage(1);
  }

  const filteredHotspots = hotspotItems.filter((item) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [item.title, item.subtitle, item.address, item.category].some((field) =>
        field.toLowerCase().includes(normalizedQuery),
      );
    const matchesCategory =
      selectedCategory === hotspotCategoryOptions[0] ||
      item.category === selectedCategory;
    const matchesStatus =
      selectedStatus === hotspotStatusOptions[0] ||
      item.status === selectedStatus;

    return matchesQuery && matchesCategory && matchesStatus;
  });

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

  const selectedHotspots = selectedHotspotSlugs
    .map((slug) => hotspotItems.find((item) => item.slug === slug))
    .filter((item): item is HotspotItem => Boolean(item));

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

  const estimatedDistance =
    selectedHotspots.length > 0
      ? `~${(
          selectedHotspots.length * 0.75 +
          themeDistanceOffsets[selectedTheme.id]
        ).toFixed(1)} km`
      : selectedTheme.distance;

  const estimatedDuration =
    selectedHotspots.length > 0
      ? `~${
          selectedHotspots.length * 30 + themeDurationOffsets[selectedTheme.id]
        } phút`
      : selectedTheme.duration;

  const summaryDuration =
    activeStep >= 4 && routeDurationInput.trim().length > 0
      ? `~${routeDurationInput.trim()} phút`
      : estimatedDuration;

  function handleStepChange(step: RouteBuilderStep) {
    if (step <= maxUnlockedStep) {
      setActiveStep(step);
    }
  }

  function handleToggleHotspot(slug: string) {
    setSelectedHotspotSlugs((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  }

  function handleContinue() {
    if (activeStep === 1) {
      setActiveStep(2);
      return;
    }

    if (activeStep === 2 && selectedHotspots.length > 0) {
      setActiveStep(3);
      return;
    }

    if (activeStep === 3 && selectedHotspots.length > 0) {
      setActiveStep(4);
      return;
    }

    if (activeStep === 4) {
      setActiveStep(5);
      return;
    }

    if (activeStep === 5) {
      setActiveStep(6);
    }
  }

  function handleBack() {
    if (activeStep === 6) {
      setActiveStep(5);
      return;
    }

    if (activeStep === 5) {
      setActiveStep(4);
      return;
    }

    if (activeStep === 4) {
      setActiveStep(3);
      return;
    }

    if (activeStep === 3) {
      setActiveStep(2);
      return;
    }

    if (activeStep === 2) {
      setActiveStep(1);
    }
  }

  function handleSortDragStart(slug: string) {
    setDraggingSlug(slug);
  }

  function handleSortDragEnd() {
    setDraggingSlug(null);
  }

  function handleSortDrop(targetSlug: string) {
    if (!draggingSlug || draggingSlug === targetSlug) {
      setDraggingSlug(null);
      return;
    }

    setSelectedHotspotSlugs((current) => {
      const next = [...current];
      const fromIndex = next.indexOf(draggingSlug);
      const toIndex = next.indexOf(targetSlug);

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      return next;
    });

    setDraggingSlug(null);
  }

  function renderMainContent() {
    if (activeStep === 1) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Chọn chủ đề tuyến
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {routeThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={theme.id === selectedTheme.id}
                onSelect={setSelectedThemeId}
              />
            ))}
          </div>
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
              Chọn các điểm di sản sẽ xuất hiện trong tuyến, có thể lọc theo
              danh mục và trạng thái.
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

            <div
              ref={filterMenuRef}
              className="relative w-full sm:w-auto sm:justify-self-end"
            >
              <button
                type="button"
                onClick={() => setIsFilterOpen((open) => !open)}
                className="relative ml-auto flex h-11 w-16 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left shadow-sm transition hover:border-[#F7DCE8] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                aria-expanded={isFilterOpen}
                aria-haspopup="dialog"
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
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tất cả
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {hotspotCategoryOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleCategoryChange(option)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-sm transition",
                              selectedCategory === option
                                ? "border-[#F7DCE8] bg-[#FFF1F7] font-medium text-[#D94A8D] shadow-sm"
                                : "border-slate-200 bg-white text-slate-600 hover:border-[#F7DCE8] hover:text-[#D94A8D]",
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
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
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
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
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-[#F7F5EF] px-4 py-3 text-xs text-slate-600">
            <span>
              {filteredHotspots.length} hotspot phù hợp .{" "}
              {selectedHotspots.length} điểm đang được chọn
            </span>
            {selectedHotspots.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedHotspotSlugs([])}
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
                    key={item.slug}
                    item={item}
                    selected={selectedHotspotSlugs.includes(item.slug)}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() =>
                        setHotspotPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentHotspotPage === 1}
                    >
                      Trước
                    </Button>

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

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() =>
                        setHotspotPage((page) =>
                          Math.min(hotspotPageCount, page + 1),
                        )
                      }
                      disabled={currentHotspotPage === hotspotPageCount}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-[#faf9f6] px-6 py-10 text-center text-sm text-slate-500">
              Không tìm thấy hotspot phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      );
    }

    if (activeStep === 3) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Sắp xếp thứ tự (kéo thả)
            </h2>
          </div>

          {selectedHotspots.length > 0 ? (
            <div className="space-y-4">
              {selectedHotspots.map((item, index) => (
                <SortableHotspotRow
                  key={item.slug}
                  item={item}
                  index={index}
                  onDragStart={handleSortDragStart}
                  onDragEnd={handleSortDragEnd}
                  onDrop={handleSortDrop}
                  onDragOver={(event) => event.preventDefault()}
                  isDragging={draggingSlug === item.slug}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-[#faf9f6] px-6 py-10 text-center text-sm text-slate-500">
              Chưa có hotspot nào để sắp xếp. Quay lại bước trước để chọn điểm.
            </div>
          )}
        </div>
      );
    }

    if (activeStep === 4) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-[1.1rem] font-semibold text-slate-900">
              Thông tin tuyến
            </h2>
          </div>

          <div className="space-y-4">
            <Input
              value={routeTitle}
              onChange={(event) => setRouteTitle(event.target.value)}
              className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8] px-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <textarea
              value={routeDescription}
              onChange={(event) => setRouteDescription(event.target.value)}
              className="min-h-28 w-full resize-none rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8] px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={routeDurationInput}
                onChange={(event) => setRouteDurationInput(event.target.value)}
                className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8] px-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <select
                value={routeDifficulty}
                onChange={(event) => setRouteDifficulty(event.target.value)}
                className="h-12 rounded-[1.05rem] border border-[#e6ddd2] bg-[#fcfbf8] px-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option>Dễ</option>
                <option>Vừa</option>
                <option>Khó</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (activeStep === 5) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-[1.1rem] font-semibold text-slate-900">
              Xem trước bản đồ & mạch chuyện
            </h2>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-[1.75rem] border border-[#d8d2ca] bg-[#f9f8f3] shadow-sm">
              <div className="relative h-[19rem] bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#faf8f1_42%,#f5f2ea_100%)] sm:h-[20rem]">
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.16),rgba(255,255,255,0.16)),linear-gradient(90deg,transparent_24%,rgba(230,225,215,0.35)_24%,rgba(230,225,215,0.35)_25%,transparent_25%),linear-gradient(transparent_24%,rgba(230,225,215,0.35)_24%,rgba(230,225,215,0.35)_25%,transparent_25%)] bg-[length:100%_100%,72px_72px,72px_72px]" />

                {previewHotspots.length > 1 ? (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                  >
                    <polyline
                      points={previewPolylinePoints}
                      fill="none"
                      stroke="#cf3d37"
                      strokeWidth="0.9"
                      strokeDasharray="2.4 1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}

                {previewHotspots.map(({ item, index, position }) => (
                  <div
                    key={item.slug}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cf3d37] text-base font-semibold text-white shadow-[0_10px_24px_rgba(207,61,55,0.22)]">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#e9e3da] bg-white/80 px-5 py-4">
                <div className="space-y-3">
                  {selectedHotspots.map((item, index) => (
                    <div
                      key={item.slug}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fff2ef] text-xs font-semibold text-[#cf3d37]">
                        {index + 1}
                      </span>
                      <span className="text-slate-900">{item.title}</span>
                    </div>
                  ))}
                </div>
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
          <h2 className="mt-4 text-[1.45rem] font-semibold tracking-[-0.02em] text-slate-900 sm:text-[1.55rem]">
            Sẵn sàng gửi duyệt
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-[0.95rem]">
            Tuyến của bạn sẽ được xem xét trong vòng 24 giờ.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mt-5 rounded-full border border-[#cf3d37] bg-[#cf3d37] px-5 text-sm text-white shadow-sm hover:bg-[#bf342f]"
          >
            Gửi duyệt tuyến
          </Button>
        </div>
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
              Xây dựng các tuyến khám phá di sản TP.HCM .
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

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tuyến mới
            </Button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200/80 bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {routeSteps.map((step) => {
              const stepState: StepVisualState =
                activeStep === step.id
                  ? "active"
                  : step.id < activeStep && step.id <= 6
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
                <SummaryRow label="Chủ đề" value={selectedTheme.title} />
                <SummaryRow
                  label="Số hotspot"
                  value={selectedHotspots.length}
                />
                <SummaryRow label="Khoảng cách" value={estimatedDistance} />
                <SummaryRow label="Thời lượng" value={summaryDuration} />
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
                          key={item.slug}
                          className="flex items-start gap-3 rounded-[1.25rem] bg-[#F7F5EF] p-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-sm">
                            {item.title.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {item.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {item.subtitle}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleHotspot(item.slug)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
                            aria-label={`Bỏ chọn ${item.title}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.25rem] bg-[#F7F5EF] p-4 text-xs leading-5 text-slate-500">
                        Chưa có hotspot nào được chọn. Chọn từ 3 đến 5 điểm để
                        bước sắp xếp tuyến có dữ liệu hợp lý hơn.
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
