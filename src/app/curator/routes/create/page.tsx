"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  MapPinned,
  Search,
  Sparkles,
  Tag,
  Upload,
  X,
} from "lucide-react";

import { PageLoading } from "@/components/app/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouteRoadPaths } from "@/hooks/use-route-road-paths";
import {
  formatDistanceKilometers,
  formatDistanceMeters,
} from "@/lib/route-geometry";
import { cn } from "@/lib/utils";
import { buildTagToken, type TagRecord } from "@/lib/tags";
import {
  hotspotApi,
  storyApi,
  tagApi,
  type BackendHotspot,
  type BackendStory,
} from "@/services/api";
import {
  routeApi,
  type RouteDifficulty,
  type RoutePayload,
  type RouteResponse,
  type RouteStatus,
} from "@/services/api/routeApi";

type RouteBuilderStep = 1 | 2 | 3 | 4 | 5;
type StepVisualState = "active" | "completed" | "upcoming";
type StoryCatalogMap = Record<number, BackendStory[]>;
type StoryLoadErrorMap = Record<number, string>;

const routeSteps: Array<{
  id: RouteBuilderStep;
  label: string;
}> = [
  {
    id: 1,
    label: "Thông tin tuyến",
  },
  {
    id: 2,
    label: "Chọn địa điểm",
  },
  {
    id: 3,
    label: "Cấu hình câu chuyện",
  },
  {
    id: 4,
    label: "Sắp xếp câu chuyện",
  },
  {
    id: 5,
    label: "Rà soát",
  },
];

const HOTSPOTS_PER_PAGE = 8;
const ROUTE_SUCCESS_TOAST_KEY = "curator-route-success-toast";

const FORM_INPUT_CLASS =
  "h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";
const FORM_TEXTAREA_CLASS =
  "w-full min-w-0 resize-none break-words rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";
const STEP_SURFACE_CLASS = "min-w-0";

const difficultyOptions: Array<{
  label: string;
  value: RouteDifficulty;
  description: string;
}> = [
  {
    label: "Dễ",
    value: "EASY",
    description: "Tuyến nhẹ, phù hợp cho phần lớn người tham gia.",
  },
  {
    label: "Trung bình",
    value: "MEDIUM",
    description: "Cân bằng giữa thời lượng, di chuyển và lượng nội dung.",
  },
  {
    label: "Khó",
    value: "HARD",
    description: "Tuyến dài hơn, cần đầu tư thời gian và sức di chuyển.",
  },
];

const routeStatusOptions: Array<{
  label: string;
  status: RouteStatus;
}> = [
  { label: "Bản nháp", status: "DRAFT" },
  { label: "Đang ghi", status: "RECORDING" },
  { label: "Thử nghiệm", status: "TRIAL" },
  { label: "Chờ duyệt", status: "PENDING" },
  { label: "Đã xuất bản", status: "PUBLISHED" },
];

const RouteHotspotMap = dynamic(
  () => import("@/components/map/map").then((mod) => mod.RouteHotspotMap),
  {
    ssr: false,
    loading: () => (
      <PageLoading
        className="h-[360px] min-h-0 rounded-3xl border border-slate-200 shadow-none"
        spinnerClassName="h-7 w-7"
      />
    ),
  },
);

function getHotspotCover(hotspot: BackendHotspot) {
  return (
    hotspot.medias?.find((media) => media.mediaType === "IMAGE")?.fileUrl ||
    hotspot.medias?.[0]?.fileUrl ||
    ""
  );
}

function isPublishedStory(story: BackendStory) {
  return story.status?.trim().toUpperCase() === "PUBLISHED";
}

function resolveStories(stories?: BackendStory[]) {
  return [...(stories ?? [])].filter(isPublishedStory).sort((storyA, storyB) => {
    const orderDiff =
      (storyA.orderIndex ?? Number.MAX_SAFE_INTEGER) -
      (storyB.orderIndex ?? Number.MAX_SAFE_INTEGER);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return storyA.storyId - storyB.storyId;
  });
}

function getRouteCoverFromResponse(route: RouteResponse) {
  return (
    route.coverImageUrl ||
    route.thumbnailUrl ||
    route.imageUrl ||
    route.medias?.find((media) => media.mediaType === "IMAGE")?.fileUrl ||
    route.media?.find((media) => media.mediaType === "IMAGE")?.fileUrl ||
    ""
  );
}

function formatDifficultyLabel(value: RouteDifficulty) {
  return (
    difficultyOptions.find((item) => item.value === value)?.label ??
    "Trung bình"
  );
}

function formatRouteStatusLabel(value: RouteStatus) {
  return (
    routeStatusOptions.find((item) => item.status === value)?.label ?? value
  );
}

function getRouteStatusBadgeClass(value: RouteStatus) {
  if (value === "PUBLISHED") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (value === "PENDING") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isPublishedHotspot(hotspot: BackendHotspot) {
  return hotspot.status?.trim().toUpperCase() === "PUBLISHED";
}

function isStorySelectable(story: BackendStory, editingRouteId: number | null) {
  return (
    story.routeId == null ||
    (editingRouteId !== null && story.routeId === editingRouteId)
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
    <div className="flex items-start justify-between gap-4 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function EmptyStateCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-8 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white text-emerald-600 shadow-sm">
        {icon}
      </div>
      <h3 className="mt-3 text-[13px] font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

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
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-1 py-1 text-[12px] transition disabled:cursor-default disabled:opacity-100",
        state === "active"
          ? "bg-emerald-600/10 pr-4 text-emerald-700"
          : state === "completed"
            ? "text-emerald-700"
            : interactive
              ? "text-slate-500 hover:text-slate-900"
              : "text-slate-400",
      )}
    >
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold",
          state === "active"
            ? "bg-emerald-600 text-white shadow-sm"
            : state === "completed"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500",
        )}
      >
        {state === "completed" ? <CheckCircle2 className="h-4 w-4" /> : id}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function HotspotLocationCard({
  item,
  selected,
  storyCount,
  onToggle,
}: {
  item: BackendHotspot;
  selected: boolean;
  storyCount: number;
  onToggle: (hotspotId: number) => void;
}) {
  const image = getHotspotCover(item);

  return (
    <div className="flex h-[17.25rem] flex-col overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <Link
        href={`/curator/hotspot/${item.hotspotId}`}
        className="block flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
      >
        <div className="relative h-32 bg-slate-100">
          {image ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,_#d1fae5_0%,_#f0fdf4_52%,_#dcfce7_100%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-900/10 to-transparent" />
          <div className="absolute left-3 top-3">
            <span className="rounded-md bg-slate-950/70 px-2.5 py-1 text-[10px] font-medium text-white">
              {storyCount} câu chuyện
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-3.5 py-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-900 break-words">
              {item.hotspotName}
            </h3>
            <div className="mt-1.5 flex items-start gap-2 text-slate-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <p className="line-clamp-2 break-words text-[11px] leading-5">
                {item.address || "Địa chỉ đang cập nhật"}
              </p>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <Button
          type="button"
          onClick={() => onToggle(item.hotspotId)}
          variant={selected ? "outline" : "secondary"}
          size="sm"
          className={cn(
            "w-full rounded-full px-4 text-[12px]",
            selected
              ? "border-emerald-100 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-600"
              : "border border-pink-100 bg-pink-50 text-pink-700 hover:bg-pink-100",
          )}
        >
          {selected ? "Đã chọn" : "Thêm"}
        </Button>
      </div>
    </div>
  );
}

function StoryAccordionCard({
  hotspot,
  stories,
  selectedStoryIds,
  expanded,
  isLoading,
  loadError,
  onToggleExpanded,
  onToggleStory,
}: {
  hotspot: BackendHotspot;
  stories: BackendStory[];
  selectedStoryIds: number[];
  expanded: boolean;
  isLoading: boolean;
  loadError?: string;
  onToggleExpanded: (hotspotId: number) => void;
  onToggleStory: (hotspotId: number, storyId: number) => void;
}) {
  const image = getHotspotCover(hotspot);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => onToggleExpanded(hotspot.hotspotId)}
        className="flex w-full min-w-0 items-start justify-between gap-4 bg-slate-100/85 px-5 py-4 text-left transition hover:bg-slate-100"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 bg-cover bg-center"
            style={image ? { backgroundImage: `url(${image})` } : undefined}
          />
          <div className="min-w-0 flex-1 px-1 py-1">
            <h3 className="text-[13px] font-semibold leading-5 text-slate-900 break-words">
              {hotspot.hotspotName}
            </h3>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 break-words">
              {hotspot.address || "Địa chỉ đang cập nhật"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs font-medium text-slate-500">
            {stories.length} câu chuyện
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-slate-400 transition",
              expanded && "rotate-180 text-emerald-700",
            )}
          />
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-slate-200 px-5 py-4">
          {isLoading ? (
            <PageLoading
              className="min-h-[112px] rounded-2xl border border-slate-200 shadow-none"
              spinnerClassName="h-6 w-6 text-emerald-600"
            />
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          ) : stories.length > 0 ? (
            <div className="space-y-4">
              <div className="divide-y divide-slate-200">
                {stories.map((story) => (
                  <div
                    key={story.storyId}
                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStoryIds.includes(story.storyId)}
                        onChange={() =>
                          onToggleStory(hotspot.hotspotId, story.storyId)
                        }
                        aria-label={`Chọn câu chuyện ${story.title}`}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-semibold leading-5 text-slate-900 break-words">
                            {story.title}
                          </p>
                          {story.tag?.tagName?.trim() ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              #{buildTagToken(story.tag.tagName)}
                            </span>
                          ) : null}
                        </div>
                        {story.content?.trim() ? (
                          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-500 break-words">
                            {story.content}
                          </p>
                        ) : null}
                      </div>
                    </label>
                    <Link
                      href={`/curator/stories/${story.storyId}`}
                      className="shrink-0 text-sm font-semibold text-slate-400 transition hover:text-emerald-700"
                      aria-label={`Xem chi tiết câu chuyện ${story.title}`}
                    >
                      ...
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyStateCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Chưa có câu chuyện khả dụng"
              description="Địa điểm này hiện chưa có câu chuyện để cấu hình vào tuyến."
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function SortableHotspotRow({
  hotspot,
  index,
  storyCount,
  selectedStoryCount,
  distanceToNextLabel,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  isDragging,
}: {
  hotspot: BackendHotspot;
  index: number;
  storyCount: number;
  selectedStoryCount: number;
  distanceToNextLabel?: string | null;
  onDragStart: (hotspotId: number) => void;
  onDragEnd: () => void;
  onDrop: (targetHotspotId: number) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  isDragging: boolean;
}) {
  const image = getHotspotCover(hotspot);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(hotspot.hotspotId)}
      onDragEnd={onDragEnd}
      onDrop={() => onDrop(hotspot.hotspotId)}
      onDragOver={onDragOver}
      className={cn(
        "px-5 py-4 transition hover:bg-slate-50",
        isDragging && "bg-slate-50 opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="cursor-grab text-slate-400 active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[12px] font-semibold text-white">
          {index + 1}
        </div>
        <div
          className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 bg-cover bg-center"
          style={image ? { backgroundImage: `url(${image})` } : undefined}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-5 text-slate-900 break-words">
            {hotspot.hotspotName}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 break-words">
            {selectedStoryCount}/{storyCount} câu chuyện · {hotspot.address}
            {distanceToNextLabel
              ? ` · Tới điểm kế: ${distanceToNextLabel}`
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CuratorRouteCreatePage() {
  const searchParams = useSearchParams();
  const routeIdParam = Number(searchParams.get("id"));
  const editingRouteId =
    Number.isInteger(routeIdParam) && routeIdParam > 0 ? routeIdParam : null;
  const isEditing = editingRouteId !== null;

  const [activeStep, setActiveStep] = useState<RouteBuilderStep>(1);
  const [hotspots, setHotspots] = useState<BackendHotspot[]>([]);
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedHotspotIds, setSelectedHotspotIds] = useState<number[]>([]);
  const [hotspotStoriesMap, setHotspotStoriesMap] = useState<StoryCatalogMap>(
    {},
  );
  const [manualSelectedStoryIdsByHotspot, setManualSelectedStoryIdsByHotspot] =
    useState<Record<number, number[]>>({});
  const [storyLoadErrors, setStoryLoadErrors] = useState<StoryLoadErrorMap>({});
  const [loadingStoryHotspotIds, setLoadingStoryHotspotIds] = useState<
    number[]
  >([]);
  const [expandedHotspotIds, setExpandedHotspotIds] = useState<number[]>([]);
  const [focusedHotspotId, setFocusedHotspotId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hotspotPage, setHotspotPage] = useState(1);
  const [draggingHotspotId, setDraggingHotspotId] = useState<number | null>(
    null,
  );
  const [routeTitle, setRouteTitle] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [routeDurationInput, setRouteDurationInput] = useState("");
  const [routeDistanceInput, setRouteDistanceInput] = useState("");
  const [routeDifficulty, setRouteDifficulty] =
    useState<RouteDifficulty>("MEDIUM");
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("DRAFT");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingCoverImageUrl, setExistingCoverImageUrl] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submittingStatus, setSubmittingStatus] = useState<RouteStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const coverPreviewObjectUrlRef = useRef<string | null>(null);

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

        if (cancelled) {
          return;
        }

        setHotspots(hotspotResponse);
        setTags(tagResponse.content);
        setHotspotStoriesMap(() => {
          const seeded: StoryCatalogMap = {};

          hotspotResponse.forEach((hotspot) => {
            const stories = resolveStories(hotspot.stories);

            if (stories.length > 0) {
              seeded[hotspot.hotspotId] = stories;
            }
          });

          return seeded;
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Không thể tải dữ liệu.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editingRouteId === null || isLoading) {
      return;
    }

    const routeId = editingRouteId;
    let cancelled = false;

    async function loadRouteForEdit() {
      try {
        setError(null);

        const route = await routeApi.getRouteById(routeId);

        if (cancelled) {
          return;
        }

        setRouteTitle(route.routeName ?? "");
        setRouteDescription(route.description ?? "");
        setRouteDifficulty(route.difficulty ?? "MEDIUM");
        setRouteStatus(route.status ?? "DRAFT");
        setRouteDurationInput(String(route.estimateTime ?? 0));
        setRouteDistanceInput(String(route.totalDistance ?? 0));
        const routeCoverUrl = getRouteCoverFromResponse(route);
        setExistingCoverImageUrl(routeCoverUrl);
        setCoverPreviewUrl(routeCoverUrl);

        const tagId = route.tag?.tagId ?? route.tags?.[0]?.tagId;
        setSelectedTagIds(tagId ? [tagId] : []);

        const hotspotIds = (route.hotspots ?? []).map((item) => item.hotspotId);
        setSelectedHotspotIds(hotspotIds);
        setExpandedHotspotIds(hotspotIds);
        setFocusedHotspotId(hotspotIds[0] ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải tuyến để chỉnh sửa.",
          );
        }
      }
    }

    void loadRouteForEdit();

    return () => {
      cancelled = true;
    };
  }, [editingRouteId, isLoading]);

  useEffect(() => {
    const missingHotspotIds = selectedHotspotIds.filter(
      (hotspotId) =>
        !Object.prototype.hasOwnProperty.call(hotspotStoriesMap, hotspotId) &&
        !loadingStoryHotspotIds.includes(hotspotId),
    );

    if (missingHotspotIds.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadMissingStories() {
      setLoadingStoryHotspotIds((current) => [
        ...current,
        ...missingHotspotIds.filter(
          (hotspotId) => !current.includes(hotspotId),
        ),
      ]);

      const results = await Promise.all(
        missingHotspotIds.map(async (hotspotId) => {
          try {
            const response = await storyApi.getStories({
              hotspotId,
              size: 500,
              status: "PUBLISHED",
            });

            return {
              hotspotId,
              stories: resolveStories(response.content),
              error: "",
            };
          } catch (err) {
            return {
              hotspotId,
              stories: [] as BackendStory[],
              error:
                err instanceof Error
                  ? err.message
                  : "Không thể tải câu chuyện của câu chuyện.",
            };
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setHotspotStoriesMap((current) => {
        const next = { ...current };

        results.forEach(({ hotspotId, stories }) => {
          next[hotspotId] = stories;
        });

        return next;
      });

      setStoryLoadErrors((current) => {
        const next = { ...current };

        results.forEach(({ hotspotId, error: itemError }) => {
          if (itemError) {
            next[hotspotId] = itemError;
          } else {
            delete next[hotspotId];
          }
        });

        return next;
      });

      setLoadingStoryHotspotIds((current) =>
        current.filter((hotspotId) => !missingHotspotIds.includes(hotspotId)),
      );
    }

    void loadMissingStories();

    return () => {
      cancelled = true;
    };
  }, [hotspotStoriesMap, loadingStoryHotspotIds, selectedHotspotIds]);

  const publishedHotspots = useMemo(
    () => hotspots.filter((hotspot) => isPublishedHotspot(hotspot)),
    [hotspots],
  );

  const filteredHotspots = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return publishedHotspots.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.hotspotName, item.description, item.address]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(normalizedQuery),
          );

      return matchesQuery;
    });
  }, [publishedHotspots, searchQuery]);

  const selectedHotspots = useMemo(
    () =>
      selectedHotspotIds
        .map((id) => hotspots.find((item) => item.hotspotId === id))
        .filter((item): item is BackendHotspot => Boolean(item)),
    [hotspots, selectedHotspotIds],
  );

  const selectedTheme = useMemo(
    () => tags.find((tag) => tag.tagId === selectedTagIds[0]) ?? null,
    [selectedTagIds, tags],
  );

  const selectedStoryIdsByHotspot = useMemo(
    () =>
      selectedHotspotIds.reduce<Record<number, number[]>>((acc, hotspotId) => {
        if (
          !Object.prototype.hasOwnProperty.call(hotspotStoriesMap, hotspotId)
        ) {
          const manualStoryIds = manualSelectedStoryIdsByHotspot[hotspotId];

          if (manualStoryIds) {
            acc[hotspotId] = manualStoryIds;
          }
          return acc;
        }

        const selectableStories = (hotspotStoriesMap[hotspotId] ?? []).filter(
          (story) => isStorySelectable(story, editingRouteId),
        );
        const selectableStoryIds = new Set(
          selectableStories.map((story) => story.storyId),
        );
        const manualStoryIds = manualSelectedStoryIdsByHotspot[hotspotId];
        const defaultStoryIds =
          editingRouteId === null
            ? []
            : selectableStories
                .filter((story) => story.routeId === editingRouteId)
                .map((story) => story.storyId);
        const resolvedStoryIds = (
          manualStoryIds === undefined ? defaultStoryIds : manualStoryIds
        ).filter((storyId) => selectableStoryIds.has(storyId));

        acc[hotspotId] = resolvedStoryIds;
        return acc;
      }, {}),
    [
      editingRouteId,
      hotspotStoriesMap,
      manualSelectedStoryIdsByHotspot,
      selectedHotspotIds,
    ],
  );

  const selectedStoryIds = useMemo(
    () =>
      Array.from(
        new Set(
          selectedHotspotIds.flatMap(
            (hotspotId) => selectedStoryIdsByHotspot[hotspotId] ?? [],
          ),
        ),
      ),
    [selectedHotspotIds, selectedStoryIdsByHotspot],
  );

  const totalSelectedStories = selectedStoryIds.length;
  const {
    roadSegments: routeSegments,
    totalDistanceMeters: totalComputedRouteDistanceMeters,
    isLoading: isLoadingRoadPaths,
    error: roadPathError,
  } = useRouteRoadPaths(selectedHotspots);
  const routeDistanceToNextByHotspotId = useMemo(
    () =>
      routeSegments.reduce<Record<number, string>>((acc, segment) => {
        if (typeof segment.from.hotspotId === "number") {
          acc[segment.from.hotspotId] = formatDistanceMeters(
            segment.displayDistanceMeters,
          );
        }

        return acc;
      }, {}),
    [routeSegments],
  );
  const suggestedDurationMinutes = Math.max(selectedHotspots.length * 30, 60);
  const suggestedDistanceKilometers = Number(
    (totalComputedRouteDistanceMeters > 0
      ? totalComputedRouteDistanceMeters / 1000
      : Math.max(selectedHotspots.length * 0.8, 1)
    ).toFixed(totalComputedRouteDistanceMeters > 0 ? 2 : 1),
  );
  const parsedDurationMinutes = parsePositiveNumber(routeDurationInput);
  const parsedDistanceKilometers = parsePositiveNumber(routeDistanceInput);
  const resolvedDurationMinutes =
    parsedDurationMinutes ?? suggestedDurationMinutes;
  const resolvedDistanceKilometers =
    parsedDistanceKilometers ?? suggestedDistanceKilometers;
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
  const estimatedDistance = formatDistanceKilometers(
    resolvedDistanceKilometers,
  );
  const estimatedDuration = `${resolvedDurationMinutes} phút`;

  const routeInfoComplete =
    Boolean(routeTitle.trim()) &&
    selectedTagIds.length > 0 &&
    parsedDurationMinutes !== null &&
    parsedDistanceKilometers !== null;

  const hotspotSelectionComplete = selectedHotspots.length >= 4;
  const storyConfigurationComplete =
    hotspotSelectionComplete &&
    selectedHotspots.every(
      (hotspot) =>
        (selectedStoryIdsByHotspot[hotspot.hotspotId]?.length ?? 0) > 0,
    );
  const organizeComplete = storyConfigurationComplete;

  const maxUnlockedStep: RouteBuilderStep = !routeInfoComplete
    ? 1
    : !hotspotSelectionComplete
      ? 2
      : !storyConfigurationComplete
        ? 3
        : !organizeComplete
          ? 4
          : 5;
  const normalizedActiveStep =
    activeStep > maxUnlockedStep ? maxUnlockedStep : activeStep;
  const effectiveFocusedHotspotId =
    focusedHotspotId !== null &&
    selectedHotspots.some((hotspot) => hotspot.hotspotId === focusedHotspotId)
      ? focusedHotspotId
      : (selectedHotspots[0]?.hotspotId ?? null);

  function getStoriesForHotspot(hotspotId: number) {
    return hotspotStoriesMap[hotspotId] ?? [];
  }

  function getSelectableStoriesForHotspot(hotspotId: number) {
    return getStoriesForHotspot(hotspotId).filter((story) =>
      isStorySelectable(story, editingRouteId),
    );
  }

  function getSelectedStoriesForHotspot(hotspotId: number) {
    const selectedStoryIds = new Set(
      selectedStoryIdsByHotspot[hotspotId] ?? [],
    );

    return getSelectableStoriesForHotspot(hotspotId).filter((story) =>
      selectedStoryIds.has(story.storyId),
    );
  }

  function handleStepChange(step: RouteBuilderStep) {
    if (step <= maxUnlockedStep) {
      setActiveStep(step);
    }
  }

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setHotspotPage(1);
  }

  function handleThemeSelect(value: string) {
    const tagId = Number(value);

    if (!Number.isInteger(tagId) || tagId <= 0) {
      setSelectedTagIds([]);
      return;
    }

    setSelectedTagIds([tagId]);
  }

  function toggleHotspotExpansion(hotspotId: number) {
    setExpandedHotspotIds((current) =>
      current.includes(hotspotId)
        ? current.filter((item) => item !== hotspotId)
        : [...current, hotspotId],
    );
  }

  function handleToggleHotspot(hotspotId: number) {
    const isSelected = selectedHotspotIds.includes(hotspotId);

    if (isSelected) {
      setSelectedHotspotIds((current) =>
        current.filter((item) => item !== hotspotId),
      );
      setExpandedHotspotIds((current) =>
        current.filter((item) => item !== hotspotId),
      );
      setManualSelectedStoryIdsByHotspot((current) => {
        if (!Object.prototype.hasOwnProperty.call(current, hotspotId)) {
          return current;
        }

        const next = { ...current };
        delete next[hotspotId];
        return next;
      });
      if (focusedHotspotId === hotspotId) {
        const remainingHotspotIds = selectedHotspotIds.filter(
          (item) => item !== hotspotId,
        );
        setFocusedHotspotId(remainingHotspotIds[0] ?? null);
      }
      return;
    }

    setSelectedHotspotIds((current) => [...current, hotspotId]);
    setExpandedHotspotIds((current) =>
      current.includes(hotspotId) ? current : [...current, hotspotId],
    );
    setFocusedHotspotId(hotspotId);
  }

  function handleToggleStorySelection(hotspotId: number, storyId: number) {
    setManualSelectedStoryIdsByHotspot((current) => {
      const currentStoryIds =
        current[hotspotId] ?? selectedStoryIdsByHotspot[hotspotId] ?? [];
      const nextStoryIds = currentStoryIds.includes(storyId)
        ? currentStoryIds.filter((item) => item !== storyId)
        : [...currentStoryIds, storyId];

      return {
        ...current,
        [hotspotId]: nextStoryIds,
      };
    });
  }

  function handleContinue() {
    setError(null);

    if (normalizedActiveStep === 1) {
      if (!routeTitle.trim()) {
        setError("Vui lòng nhập tên tuyến.");
        return;
      }

      if (selectedTagIds.length === 0) {
        setError("Vui lòng chọn chủ đề tuyến.");
        return;
      }

      if (parsedDurationMinutes === null) {
        setError("Vui lòng nhập thời lượng ước tính lớn hơn 0.");
        return;
      }

      if (parsedDistanceKilometers === null) {
        setError("Vui lòng nhập quãng đường ước tính lớn hơn 0.");
        return;
      }

      setActiveStep(2);
      return;
    }

    if (normalizedActiveStep === 2) {
      if (selectedHotspots.length < 4) {
        setError(
          "Tuyến cần ít nhất 4 địa điểm để tạo thành một hành trình hợp lệ.",
        );
        return;
      }

      setActiveStep(3);
      return;
    }

    if (normalizedActiveStep === 3) {
      const hotspotWithoutStories = selectedHotspots.find(
        (hotspot) =>
          (selectedStoryIdsByHotspot[hotspot.hotspotId]?.length ?? 0) === 0,
      );

      if (hotspotWithoutStories) {
        setError(
          `Địa điểm ${hotspotWithoutStories.hotspotName} chưa có câu chuyện để đưa vào tuyến.`,
        );
        setExpandedHotspotIds((current) =>
          current.includes(hotspotWithoutStories.hotspotId)
            ? current
            : [...current, hotspotWithoutStories.hotspotId],
        );
        return;
      }

      setActiveStep(4);
      return;
    }

    if (normalizedActiveStep === 4) {
      setActiveStep(5);
    }
  }

  function handleBack() {
    setError(null);

    if (normalizedActiveStep > 1) {
      setActiveStep((normalizedActiveStep - 1) as RouteBuilderStep);
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

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    setDraggingHotspotId(null);
  }

  function handleRouteFilesSelected(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const firstImageFile = Array.from(fileList).find((file) =>
      file.type.startsWith("image/"),
    );

    if (!firstImageFile) {
      return;
    }

    const nextFiles = [firstImageFile];

    setSelectedFiles(nextFiles);
    syncCoverPreview(nextFiles);
  }

  function removeRouteFile(index: number) {
    const nextFiles = selectedFiles.filter(
      (_, itemIndex) => itemIndex !== index,
    );
    setSelectedFiles(nextFiles);
    syncCoverPreview(nextFiles);
  }

  function revokeCoverPreviewObjectUrl() {
    if (coverPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(coverPreviewObjectUrlRef.current);
      coverPreviewObjectUrlRef.current = null;
    }
  }

  function syncCoverPreview(files: File[]) {
    revokeCoverPreviewObjectUrl();

    if (files.length === 0) {
      setCoverPreviewUrl(existingCoverImageUrl);
      return;
    }

    const previewUrl = URL.createObjectURL(files[0]);
    coverPreviewObjectUrlRef.current = previewUrl;
    setCoverPreviewUrl(previewUrl);
  }

  function buildPayload(): RoutePayload {
    const routeName = routeTitle.trim();
    const description = routeDescription.trim();

    if (!routeName) {
      throw new Error("Vui lòng nhập tên tuyến.");
    }

    if (selectedTagIds.length === 0) {
      throw new Error("Vui lòng chọn chủ đề tuyến.");
    }

    if (parsedDurationMinutes === null) {
      throw new Error("Vui lòng nhập thời lượng ước tính lớn hơn 0.");
    }

    if (parsedDistanceKilometers === null) {
      throw new Error("Vui lòng nhập quãng đường ước tính lớn hơn 0.");
    }

    if (selectedHotspotIds.length < 4) {
      throw new Error("Tuyến cần ít nhất 4 địa điểm.");
    }

    const missingStoryHotspot = selectedHotspots.find(
      (hotspot) =>
        (selectedStoryIdsByHotspot[hotspot.hotspotId]?.length ?? 0) === 0,
    );

    if (missingStoryHotspot) {
      throw new Error(
        `Địa điểm ${missingStoryHotspot.hotspotName} chưa có câu chuyện để đưa vào tuyến.`,
      );
    }

    return {
      routeName,
      description,
      difficulty: routeDifficulty,
      estimateTime: parsedDurationMinutes,
      totalDistance: parsedDistanceKilometers,
      hotspotIds: selectedHotspotIds,
      storyIds: selectedStoryIds,
      tagId: selectedTagIds[0],
      status: routeStatus,
      imageFile: isEditing ? null : (selectedFiles[0] ?? null),
    };
  }

  async function handleSubmitRoute() {
    try {
      setError(null);
      setSubmittingStatus(routeStatus);

      const payload = buildPayload();
      if (isEditing && editingRouteId) {
        await routeApi.updateRoute(editingRouteId, payload);
      } else {
        await routeApi.createRoute(payload);
      }

      sessionStorage.setItem(
        ROUTE_SUCCESS_TOAST_KEY,
        isEditing
          ? "Cập nhật tuyến thành công."
          : "Tạo tuyến đường thành công.",
      );
      window.location.assign("/curator/routes");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Không thể cập nhật tuyến."
            : "Không thể tạo tuyến.",
      );
    } finally {
      setSubmittingStatus(null);
    }
  }

  function renderRouteInformationStep() {
    return (
      <div className={STEP_SURFACE_CLASS}>
        <div className="min-w-0 space-y-8">
          <section className="min-w-0 space-y-5">
            <h2 className="cq-section-title">Thông tin cơ bản</h2>
            <div className="grid min-w-0 gap-4 md:grid-cols-2 [&>*]:min-w-0">
              <div className="md:col-span-2">
                <label className="cq-label mb-2 block">Tên tuyến</label>
                <Input
                  value={routeTitle}
                  onChange={(event) => setRouteTitle(event.target.value)}
                  placeholder="Ví dụ: Sài Gòn hiện đại qua lăng kính kiến trúc"
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div className="md:col-span-2">
                <label className="cq-label mb-2 block">Mô tả</label>
                <textarea
                  value={routeDescription}
                  onChange={(event) => setRouteDescription(event.target.value)}
                  placeholder="Mô tả ghi chú biên tập, sắc thái nội dung và trải nghiệm mong muốn."
                  className={cn(FORM_TEXTAREA_CLASS, "min-h-28")}
                />
              </div>

              <div>
                <label className="cq-label mb-2 block">Độ khó</label>
                <select
                  value={routeDifficulty}
                  onChange={(event) =>
                    setRouteDifficulty(event.target.value as RouteDifficulty)
                  }
                  className={FORM_INPUT_CLASS}
                >
                  {difficultyOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="cq-label mb-2 block">Trạng thái</label>
                <select
                  value={routeStatus}
                  onChange={(event) =>
                    setRouteStatus(event.target.value as RouteStatus)
                  }
                  className={FORM_INPUT_CLASS}
                >
                  {routeStatusOptions.map((item) => (
                    <option key={item.status} value={item.status}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="cq-label mb-2 block">
                  Thời lượng ước tính (phút)
                </label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={routeDurationInput}
                  onChange={(event) =>
                    setRouteDurationInput(event.target.value)
                  }
                  placeholder="Ví dụ: 120"
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="cq-label mb-2 block">Quãng đường (km)</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={routeDistanceInput}
                  onChange={(event) =>
                    setRouteDistanceInput(event.target.value)
                  }
                  placeholder="Ví dụ: 3.5"
                  className={FORM_INPUT_CLASS}
                />
              </div>
            </div>
          </section>

          <section className="min-w-0 space-y-5">
            <h2 className="cq-section-title">Chủ đề tuyến</h2>
            {tags.length > 0 ? (
              <div className="min-w-0">
                <label className="cq-label mb-2 block">Thẻ chủ đề</label>
                <select
                  value={selectedTagIds[0] ?? ""}
                  onChange={(event) => handleThemeSelect(event.target.value)}
                  className={FORM_INPUT_CLASS}
                >
                  <option value="">Chọn chủ đề tuyến</option>
                  {tags.map((tag) => (
                    <option key={tag.tagId} value={tag.tagId}>
                      #{buildTagToken(tag.tagName)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <EmptyStateCard
                icon={<Sparkles className="h-6 w-6" />}
                title="Chưa có chủ đề tuyến"
                description="Hiện chưa có thẻ khả dụng để gắn chủ đề cho tuyến."
              />
            )}
          </section>

          <section className="min-w-0 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="cq-section-title">Ảnh bìa</h2>
              <label
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium shadow-sm",
                  isEditing
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "cursor-pointer border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50",
                )}
              >
                <Upload className="h-4 w-4" />
                Tải lên
                <input
                  type="file"
                  accept="image/*"
                  disabled={isEditing}
                  className="hidden"
                  onChange={(event) => {
                    handleRouteFilesSelected(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {isEditing ? (
              <p className="text-xs text-slate-500">
                Giữ nguyên ảnh bìa hiện tại khi chỉnh sửa.
              </p>
            ) : null}

            <div className="overflow-hidden rounded-3xl border border-dashed border-slate-200 bg-white">
              {coverPreviewUrl ? (
                <div
                  className="h-56 bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverPreviewUrl})` }}
                />
              ) : (
                <div className="grid h-48 place-items-center px-6 text-center">
                  <div>
                    <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-50 text-emerald-600 shadow-sm">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Chưa có ảnh bìa
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedFiles.length > 0 ? (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 text-[13px] text-slate-700 shadow-sm"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-emerald-600 shadow-sm">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRouteFile(index)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                      aria-label={`Xoá ảnh ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    );
  }

  function renderHotspotSelectionStep() {
    return (
      <div className={STEP_SURFACE_CLASS}>
        <div className="min-w-0 space-y-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) =>
                  handleSearchQueryChange(event.target.value)
                }
                placeholder="Tìm theo tên địa điểm hoặc địa chỉ..."
                className={cn(FORM_INPUT_CLASS, "h-9 pl-9")}
              />
            </div>

            {selectedHotspots.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedHotspotIds([]);
                  setExpandedHotspotIds([]);
                  setFocusedHotspotId(null);
                }}
                className="rounded-full"
              >
                Xóa toàn bộ
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-600">
            <span>
              {filteredHotspots.length} địa điểm đã xuất bản ·{" "}
              {selectedHotspots.length} điểm đang được chọn
            </span>
          </div>

          {filteredHotspots.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedHotspots.map((item) => (
                <HotspotLocationCard
                  key={item.hotspotId}
                  item={item}
                  selected={selectedHotspotIds.includes(item.hotspotId)}
                  storyCount={
                    getSelectableStoriesForHotspot(item.hotspotId).length
                  }
                  onToggle={handleToggleHotspot}
                />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              icon={<MapPinned className="h-6 w-6" />}
              title="Không tìm thấy địa điểm phù hợp"
              description="Hiện chỉ hiển thị địa điểm có trạng thái đã xuất bản."
            />
          )}

          {hotspotPageCount > 1 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                        ? "bg-emerald-600 font-semibold text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700",
                    )}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderStoryConfigurationStep() {
    return (
      <div className={STEP_SURFACE_CLASS}>
        {selectedHotspots.length > 0 ? (
          <section className="space-y-4">
            <h2 className="cq-section-title">Địa điểm và câu chuyện</h2>
            <div className="divide-y divide-slate-200">
              {selectedHotspots.map((hotspot) => (
                <StoryAccordionCard
                  key={hotspot.hotspotId}
                  hotspot={hotspot}
                  stories={getSelectableStoriesForHotspot(hotspot.hotspotId)}
                  selectedStoryIds={
                    selectedStoryIdsByHotspot[hotspot.hotspotId] ?? []
                  }
                  expanded={expandedHotspotIds.includes(hotspot.hotspotId)}
                  isLoading={loadingStoryHotspotIds.includes(hotspot.hotspotId)}
                  loadError={storyLoadErrors[hotspot.hotspotId]}
                  onToggleExpanded={toggleHotspotExpansion}
                  onToggleStory={handleToggleStorySelection}
                />
              ))}
            </div>
          </section>
        ) : (
          <EmptyStateCard
            icon={<BookOpen className="h-6 w-6" />}
            title="Chưa có địa điểm để cấu hình"
            description="Hãy quay lại bước chọn địa điểm và thêm các điểm đến trước khi chọn câu chuyện."
          />
        )}
      </div>
    );
  }

  function renderOrganizeRouteStep() {
    return (
      <div className={STEP_SURFACE_CLASS}>
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="cq-section-title">Bản đồ tuyến</h2>
              <MapPinned className="h-5 w-5 text-emerald-600" />
            </div>

            {selectedHotspots.length > 0 && isLoadingRoadPaths ? (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                Đang tính đường đi theo các con đường trên bản đồ...
              </p>
            ) : null}

            {selectedHotspots.length > 0 && roadPathError ? (
              <p className="text-xs text-amber-700">
                Không lấy được đường đi thực tế cho một số chặng (
                {roadPathError}). Các chặng đó tạm hiển thị bằng nét đứt nối
                trực tiếp.
              </p>
            ) : null}

            {selectedHotspots.length > 0 ? (
              <RouteHotspotMap
                hotspots={selectedHotspots}
                selectedIds={selectedHotspotIds}
                focusedHotspotId={effectiveFocusedHotspotId}
                onToggle={setFocusedHotspotId}
                className="h-[300px] rounded-3xl border border-slate-200"
              />
            ) : (
              <EmptyStateCard
                icon={<MapPinned className="h-6 w-6" />}
                title="Chưa có dữ liệu bản đồ"
                description="Bản đồ sẽ xuất hiện khi tuyến đã có địa điểm."
              />
            )}
          </section>

          {selectedHotspots.length > 0 ? (
            <section className="space-y-4">
              <h2 className="cq-section-title">Thứ tự địa điểm</h2>
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="divide-y divide-slate-200">
                  {selectedHotspots.map((hotspot, index) => (
                    <SortableHotspotRow
                      key={hotspot.hotspotId}
                      hotspot={hotspot}
                      index={index}
                      storyCount={
                        getSelectableStoriesForHotspot(hotspot.hotspotId).length
                      }
                      selectedStoryCount={
                        selectedStoryIdsByHotspot[hotspot.hotspotId]?.length ??
                        0
                      }
                      distanceToNextLabel={
                        routeDistanceToNextByHotspotId[hotspot.hotspotId] ??
                        null
                      }
                      onDragStart={handleSortDragStart}
                      onDragEnd={handleSortDragEnd}
                      onDrop={handleSortDrop}
                      onDragOver={(event) => event.preventDefault()}
                      isDragging={draggingHotspotId === hotspot.hotspotId}
                    />
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <EmptyStateCard
              icon={<GripVertical className="h-6 w-6" />}
              title="Chưa có địa điểm để sắp xếp"
              description="Thêm địa điểm và câu chuyện trước khi sắp xếp thứ tự tuyến."
            />
          )}
        </div>
      </div>
    );
  }

  function renderReviewStep() {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70">
          {selectedHotspots.length > 0 ? (
            <RouteHotspotMap
              hotspots={selectedHotspots}
              selectedIds={selectedHotspotIds}
              focusedHotspotId={effectiveFocusedHotspotId}
              onToggle={setFocusedHotspotId}
              className="h-[340px] border-b border-emerald-100"
            />
          ) : (
            <div className="border-b border-emerald-100 p-6">
              <EmptyStateCard
                icon={<MapPinned className="h-6 w-6" />}
                title="Chưa có dữ liệu bản đồ"
                description="Bản đồ xem trước sẽ xuất hiện khi tuyến đã có địa điểm."
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-900">
              Tổng quan tuyến
            </p>
            <h2 className="mt-2 text-base font-semibold tracking-[-0.02em] text-slate-900 sm:text-lg">
              {routeTitle || "Tuyến chưa có tên"}
            </h2>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 shadow-sm">
              <Tag className="h-3 w-3" />
              {selectedTheme
                ? buildTagToken(selectedTheme.tagName)
                : "Chưa chọn chủ đề"}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                getRouteStatusBadgeClass(routeStatus),
              )}
            >
              {formatRouteStatusLabel(routeStatus)}
            </span>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-6">
          <div className="grid max-w-5xl gap-x-5 gap-y-4 px-4 sm:grid-cols-2 sm:px-5 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="cq-label">Địa điểm</p>
              <p className="text-[13px] font-normal text-slate-900">
                {selectedHotspots.length} điểm
              </p>
            </div>
            <div className="space-y-1">
              <p className="cq-label">Câu chuyện</p>
              <p className="text-[13px] font-normal text-slate-900">
                {totalSelectedStories} câu chuyện
              </p>
            </div>
            <div className="space-y-1">
              <p className="cq-label">Thời lượng ước tính</p>
              <p className="text-[13px] font-normal text-slate-900">
                {estimatedDuration}
              </p>
            </div>
            <div className="space-y-1">
              <p className="cq-label">Quãng đường ước tính</p>
              <p className="text-[13px] font-normal text-slate-900">
                {estimatedDistance}
              </p>
            </div>
            <div className="space-y-1">
              <p className="cq-label">Độ khó</p>
              <p className="text-[13px] font-normal text-slate-900">
                {formatDifficultyLabel(routeDifficulty)}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-6">
          <div className="rounded-[1.5rem] bg-slate-50/80 px-4 py-4 sm:px-5">
            <p className="cq-label">Mô tả tuyến</p>
            <div className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
              {routeDescription?.trim()
                ? routeDescription
                : "Chưa có mô tả tuyến."}
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-6">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.5rem] bg-slate-50/80 p-4 sm:p-5">
              <p className="cq-label">Ảnh bìa tuyến</p>
              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                {coverPreviewUrl ? (
                  <div
                    className="h-56 bg-cover bg-center"
                    style={{ backgroundImage: `url(${coverPreviewUrl})` }}
                  />
                ) : (
                  <div className="grid h-56 place-items-center px-6 text-center text-sm text-slate-500">
                    Chưa có ảnh bìa
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-slate-50/80 p-4 sm:p-5">
              <p className="cq-label">Tiến độ các bước</p>
              <div className="mt-4 space-y-4">
                <SummaryRow
                  label="Thông tin tuyến"
                  value={routeInfoComplete ? "Hoàn tất" : "Chờ"}
                />
                <SummaryRow
                  label="Chọn địa điểm"
                  value={hotspotSelectionComplete ? "Hoàn tất" : "Chờ"}
                />
                <SummaryRow
                  label="Cấu hình câu chuyện"
                  value={storyConfigurationComplete ? "Hoàn tất" : "Chờ"}
                />
                <SummaryRow
                  label="Sắp xếp câu chuyện"
                  value={organizeComplete ? "Hoàn tất" : "Chờ"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-6">
          <div>
            <p className="cq-label">Địa điểm và câu chuyện theo thứ tự tuyến</p>
            {selectedHotspots.length > 0 ? (
              <div className="mt-4 divide-y divide-slate-200">
                {selectedHotspots.map((hotspot, index) => (
                  <div
                    key={hotspot.hotspotId}
                    className="flex items-start gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[12px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold leading-5 text-slate-900 break-words">
                          {hotspot.hotspotName}
                        </p>
                        <span className="text-[11px] font-medium text-slate-500">
                          {
                            getSelectedStoriesForHotspot(hotspot.hotspotId)
                              .length
                          }{" "}
                          câu chuyện
                        </span>
                        {routeDistanceToNextByHotspotId[hotspot.hotspotId] ? (
                          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
                            {routeDistanceToNextByHotspotId[hotspot.hotspotId]}{" "}
                            tới điểm kế
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500 break-words">
                        {hotspot.address || "Địa chỉ đang cập nhật"}
                      </p>

                      <div className="mt-4 space-y-3">
                        {getSelectedStoriesForHotspot(hotspot.hotspotId).map(
                          (story) => (
                            <div
                              key={`${hotspot.hotspotId}-${story.storyId}`}
                              className="rounded-[1.25rem] bg-slate-50/80 px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-medium leading-5 text-slate-900 break-words">
                                    {story.title}
                                  </p>
                                  {story.content?.trim() ? (
                                    <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-500 break-words">
                                      {story.content}
                                    </p>
                                  ) : null}
                                </div>
                                <Link
                                  href={`/curator/stories/${story.storyId}`}
                                  className="shrink-0 text-sm font-semibold text-slate-400 transition hover:text-emerald-700"
                                  aria-label={`Xem chi tiết câu chuyện ${story.title}`}
                                >
                                  ...
                                </Link>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyStateCard
                  icon={<BookOpen className="h-6 w-6" />}
                  title="Chưa có địa điểm để rà soát"
                  description="Hoàn thành các bước trước để xem tổng hợp hành trình."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderMainContent() {
    if (normalizedActiveStep === 1) {
      return renderRouteInformationStep();
    }

    if (normalizedActiveStep === 2) {
      return renderHotspotSelectionStep();
    }

    if (normalizedActiveStep === 3) {
      return renderStoryConfigurationStep();
    }

    if (normalizedActiveStep === 4) {
      return renderOrganizeRouteStep();
    }

    return renderReviewStep();
  }

  function renderStickyActions() {
    if (normalizedActiveStep === 5) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleBack}
            disabled={submittingStatus !== null}
            className="w-full rounded-full border-slate-200 px-5"
          >
            Quay lại
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => void handleSubmitRoute()}
            disabled={submittingStatus !== null}
            className="w-full rounded-full bg-emerald-600 px-5 text-white hover:bg-emerald-700"
          >
            {submittingStatus !== null ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isEditing ? "Cập nhật tuyến" : "Tạo tuyến"}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={normalizedActiveStep === 1 || submittingStatus !== null}
          onClick={handleBack}
          className="w-full rounded-full border-slate-200 px-5"
        >
          Quay lại
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleContinue}
          disabled={submittingStatus !== null}
          className="w-full rounded-full bg-emerald-600 px-5 text-white hover:bg-emerald-700"
        >
          Tiếp tục
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  useEffect(() => {
    return () => {
      revokeCoverPreviewObjectUrl();
    };
  }, []);

  if (isLoading) {
    return <PageLoading className="min-h-[calc(100vh-8rem)]" />;
  }

  return (
    <div className="space-y-6 pb-28">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pl-3">
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
              {isEditing ? "Chỉnh sửa tuyến" : "Tạo tuyến"}
            </h1>
            <p className="mt-0.5 max-w-3xl text-[11px] leading-4 text-muted-foreground">
              Tạo tuyến hành trình văn hóa theo địa điểm và câu chuyện.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-slate-100 bg-[#F7F5EF] p-1">
            <Link
              href="/curator/routes"
              className="rounded-full px-3.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-900"
            >
              Danh sách
            </Link>
            <Link
              href="/curator/routes/create"
              className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-medium text-slate-950 shadow-sm"
            >
              Trình tạo tuyến
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex flex-col gap-2">
              <p className="cq-label">Quy trình biên tập</p>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-2 lg:gap-3">
                {routeSteps.map((step) => {
                  const stepState: StepVisualState =
                    normalizedActiveStep === step.id
                      ? "active"
                      : step.id < normalizedActiveStep
                        ? "completed"
                        : "upcoming";

                  return (
                    <div
                      key={step.id}
                      className="flex shrink-0 items-center gap-2 lg:gap-3"
                    >
                      <BuilderStep
                        id={step.id}
                        label={step.label}
                        state={stepState}
                        interactive={step.id <= maxUnlockedStep}
                        onClick={
                          step.id <= maxUnlockedStep
                            ? () => handleStepChange(step.id)
                            : undefined
                        }
                      />
                      {step.id < routeSteps.length ? (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6">{renderMainContent()}</div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-[13px] font-semibold text-slate-900">
              Điều hướng
            </p>
            {renderStickyActions()}
          </div>
        </div>
      </section>
    </div>
  );
}
