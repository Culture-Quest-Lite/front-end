"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ChevronDown,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CuratorPagination } from "@/components/curator/CuratorPagination";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  hotspotApi,
  routeApi,
  storyApi,
  tagApi,
  type BackendStorySummary,
} from "@/services/api";

type StoryStatus = "Đã xuất bản" | "Chờ duyệt" | "Bản nháp" | "Bị từ chối";

const STORY_SUCCESS_TOAST_KEY = "curator-story-success-toast";

const storyActions = [
  { key: "edit", label: "Chỉnh sửa", icon: PencilLine },
  { key: "detail", label: "Xem chi tiết", icon: Eye },
  { key: "submit", label: "Duyệt bài", icon: Send },
  { key: "delete", label: "Xóa", icon: Trash2 },
];

type StoryItem = BackendStorySummary & {
  id: string;
  statusLabel: StoryStatus;
  tagName: string;
  orderIndexLabel: string;
  distanceToNextLabel: string;
};

type FilterOption = {
  id: number;
  name: string;
};

function getSingleTagName(tagName?: string) {
  if (!tagName) {
    return "Không có tag";
  }

  const normalizedTags = tagName
    .split(/[,;|]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  return normalizedTags[0] ?? tagName.trim();
}

function getStoryStatusLabel(status?: string): StoryStatus {
  switch (status) {
    case "DRAFT":
      return "Bản nháp";
    case "PUBLISHED":
      return "Đã xuất bản";
    case "REJECTED":
      return "Bị từ chối";
    case "REVIEW":
      return "Chờ duyệt";
    default:
      return "Chờ duyệt";
  }
}

function getOrderIndexLabel(orderIndex?: number | null) {
  if (typeof orderIndex !== "number") {
    return "Chưa sắp";
  }

  return String(orderIndex);
}

function getDistanceToNextLabel(distanceToNext?: number | null) {
  if (typeof distanceToNext !== "number") {
    return "Chưa có";
  }

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(distanceToNext);
}

function parseOptionalFilterId(value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    return undefined;
  }

  return parsedValue;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function matchesStoryName(title: string, keyword: string) {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  return normalizeSearchText(title).includes(normalizedKeyword);
}

const initialStories: StoryItem[] = [];

const statusOptions: Array<{ label: string; value: StoryStatus | "all" }> = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đã xuất bản", value: "Đã xuất bản" },
  { label: "Bản nháp", value: "Bản nháp" },
];
const STORIES_PER_PAGE = 10;

const statusBadgeClasses: Record<StoryStatus, string> = {
  "Đã xuất bản": "bg-emerald-100 text-emerald-700",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Bản nháp": "bg-slate-100 text-slate-600",
  "Bị từ chối": "bg-rose-100 text-rose-700",
};

function StatusBadge({ status }: { status: StoryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
        statusBadgeClasses[status],
      )}
    >
      {status}
    </span>
  );
}

async function loadAllRouteOptions() {
  const routeOptions: FilterOption[] = [];
  const seenRouteIds = new Set<number>();
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const response = await routeApi.searchRoutes({
      filters: [],
      page,
      size: 100,
      sortBy: "routeName",
      sortDirection: "ASC",
    });

    response.content.forEach((route) => {
      if (seenRouteIds.has(route.routeId)) {
        return;
      }

      seenRouteIds.add(route.routeId);
      routeOptions.push({
        id: route.routeId,
        name: route.routeName?.trim() || `Route #${route.routeId}`,
      });
    });

    totalPages = Math.max(response.page.totalPages, 1);
    page += 1;

    if (response.content.length === 0) {
      break;
    }
  }

  return routeOptions;
}

export default function CuratorStoriesPage() {
  const [stories, setStories] = useState(initialStories);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<StoryStatus | "all">(
    "all",
  );
  const [draftStatus, setDraftStatus] = useState<StoryStatus | "all">("all");
  const [selectedTagId, setSelectedTagId] = useState<number | "all">("all");
  const [draftTagId, setDraftTagId] = useState<number | "all">("all");
  const [selectedHotspotId, setSelectedHotspotId] = useState("");
  const [draftHotspotId, setDraftHotspotId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [draftRouteId, setDraftRouteId] = useState("");
  const [availableTags, setAvailableTags] = useState<
    { tagId: number; tagName: string }[] | []
  >([]);
  const [availableHotspots, setAvailableHotspots] = useState<FilterOption[]>(
    [],
  );
  const [availableRoutes, setAvailableRoutes] = useState<FilterOption[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openMenuStoryId, setOpenMenuStoryId] = useState<string | null>(null);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [loadStoriesError, setLoadStoriesError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingPublishStory, setPendingPublishStory] =
    useState<StoryItem | null>(null);
  const [publishingStoryId, setPublishingStoryId] = useState<string | null>(
    null,
  );
  const [pendingDeleteStory, setPendingDeleteStory] =
    useState<StoryItem | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [storiesReloadToken, setStoriesReloadToken] = useState(0);
  const selectedHotspotFilterId = parseOptionalFilterId(selectedHotspotId);
  const selectedRouteFilterId = parseOptionalFilterId(selectedRouteId);

  useEffect(() => {
    const successMessage = sessionStorage.getItem(STORY_SUCCESS_TOAST_KEY);

    if (!successMessage) {
      return;
    }

    sessionStorage.removeItem(STORY_SUCCESS_TOAST_KEY);
    toast.success(successMessage);
  }, []);

  const backendStatusValue =
    selectedStatus === "Đã xuất bản"
      ? "PUBLISHED"
      : selectedStatus === "Bản nháp"
        ? "DRAFT"
        : undefined;

  useEffect(() => {
    let cancelled = false;

    async function loadStories() {
      setIsLoadingStories(true);
      setLoadStoriesError(null);

      try {
        const response = await storyApi.getStories({
          page: currentPage - 1,
          size: 10,
          sortBy: "createdAt",
          sortDir: "DESC",
          keyword: searchQuery.trim(),
          status: backendStatusValue,
          tagId: selectedTagId === "all" ? undefined : selectedTagId,
          hotspotId: selectedHotspotFilterId,
          routeId: selectedRouteFilterId,
        });

        const nextStories = response.content
          .filter((story) => matchesStoryName(story.title, searchQuery))
          .map((story) => ({
            ...story,
            id: String(story.storyId),
            statusLabel: getStoryStatusLabel(story.status),
            tagName: getSingleTagName(story.tag?.tagName),
            orderIndexLabel: getOrderIndexLabel(story.orderIndex),
            distanceToNextLabel: getDistanceToNextLabel(story.distanceToNext),
          }));

        if (!cancelled) {
          setStories(nextStories);
          setTotalPages(Math.max(response.page.totalPages, 1));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadStoriesError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách story.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStories(false);
        }
      }
    }

    void loadStories();

    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    searchQuery,
    selectedTagId,
    selectedHotspotFilterId,
    selectedRouteFilterId,
    backendStatusValue,
    storiesReloadToken,
  ]);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStories = stories;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-story-actions]")) {
        setOpenMenuStoryId(null);
      }

      if (
        !event.target.closest("[data-story-filter-panel]") &&
        !event.target.closest("[data-story-filter-toggle]")
      ) {
        setIsFilterOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuStoryId(null);
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handlePublishStory(story: StoryItem) {
    setOpenMenuStoryId(null);

    if (story.status === "PUBLISHED") {
      toast.info("Story này đã ở trạng thái xuất bản.");
      return;
    }

    setPendingPublishStory(story);
  }

  async function handleConfirmPublishStory() {
    if (!pendingPublishStory) {
      setPendingPublishStory(null);
      return;
    }

    const storyId = pendingPublishStory.id;
    setPublishingStoryId(storyId);

    try {
      await storyApi.updateStoryStatus(Number(storyId), "PUBLISHED");

      setStories((currentStories) =>
        currentStories.map((story) =>
          story.id === storyId
            ? {
                ...story,
                status: "PUBLISHED",
                statusLabel: "Đã xuất bản",
              }
            : story,
        ),
      );

      setPendingPublishStory(null);
      toast.success("Duyệt bài story thành công.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể duyệt bài story. Vui lòng thử lại.",
      );
    } finally {
      setPublishingStoryId(null);
    }
  }

  function handleDeleteStory(story: StoryItem) {
    setOpenMenuStoryId(null);
    setPendingDeleteStory(story);
  }

  async function handleConfirmDeleteStory() {
    if (!pendingDeleteStory) {
      setPendingDeleteStory(null);
      return;
    }

    const storyId = pendingDeleteStory.id;
    setDeletingStoryId(storyId);

    try {
      await storyApi.deleteStory(Number(storyId));

      if (stories.length === 1 && currentPage > 1) {
        setCurrentPage((page) => Math.max(page - 1, 1));
      } else {
        setStories((currentStories) =>
          currentStories.filter((story) => story.id !== storyId),
        );
        setStoriesReloadToken((current) => current + 1);
      }

      setPendingDeleteStory(null);
      toast.success("Xóa story thành công.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể xóa story. Vui lòng thử lại.",
      );
    } finally {
      setDeletingStoryId(null);
    }
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleDraftStatusFilterChange(value: StoryStatus | "all") {
    setDraftStatus(value);
  }

  function handleDraftTagFilterChange(value: number | "all") {
    setDraftTagId(value);
  }

  function handleDraftHotspotFilterChange(value: string) {
    setDraftHotspotId(value);
  }

  function handleDraftRouteFilterChange(value: string) {
    setDraftRouteId(value);
  }

  function handleToggleFilterPanel() {
    setIsFilterOpen((current) => {
      if (current) {
        return false;
      }

      setDraftStatus(selectedStatus);
      setDraftTagId(selectedTagId);
      setDraftHotspotId(selectedHotspotId);
      setDraftRouteId(selectedRouteId);
      return true;
    });
  }

  function handleApplyAdvancedFilters() {
    setSelectedStatus(draftStatus);
    setSelectedTagId(draftTagId);
    setSelectedHotspotId(draftHotspotId.trim());
    setSelectedRouteId(draftRouteId.trim());
    setCurrentPage(1);
    setIsFilterOpen(false);
    setStoriesReloadToken((current) => current + 1);
  }

  function handleResetAdvancedFilters() {
    setDraftStatus("all");
    setDraftTagId("all");
    setDraftHotspotId("");
    setDraftRouteId("");
    setSelectedStatus("all");
    setSelectedTagId("all");
    setSelectedHotspotId("");
    setSelectedRouteId("");
    setCurrentPage(1);
    setIsFilterOpen(false);
    setStoriesReloadToken((current) => current + 1);
  }

  function handlePageChange(page: number) {
    setOpenMenuStoryId(null);
    setCurrentPage(page);
  }

  useEffect(() => {
    async function loadFilterData() {
      const [tagResult, hotspotResult, routeResult] = await Promise.allSettled([
        tagApi.getTags({
          page: 0,
          size: 100,
          sortBy: "createdAt",
          sortDir: "DESC",
        }),
        hotspotApi.getHotspots(),
        loadAllRouteOptions(),
      ]);

      if (tagResult.status === "fulfilled") {
        setAvailableTags(tagResult.value.content);
      } else {
        setAvailableTags([]);
      }

      if (hotspotResult.status === "fulfilled") {
        setAvailableHotspots(
          hotspotResult.value.map((hotspot) => ({
            id: hotspot.hotspotId,
            name:
              hotspot.hotspotName?.trim() || `Hotspot #${hotspot.hotspotId}`,
          })),
        );
      } else {
        setAvailableHotspots([]);
      }

      if (routeResult.status === "fulfilled") {
        setAvailableRoutes(routeResult.value);
      } else {
        setAvailableRoutes([]);
      }
    }

    void loadFilterData();
  }, []);

  return (
    <div className="flex min-h-full flex-col gap-6">
      <section className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="cq-page-title">Quản lý câu chuyện</h1>
            <p className="cq-page-subtitle max-w-2xl">
              Quản lý câu chuyện theo nội dung, thẻ và trạng thái biên tập.
            </p>
          </div>

          <Button
            asChild
            variant="secondary"
            size="lg"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-white shadow-sm"
          >
            <Link href="/curator/stories/create">
              <Plus className="h-4 w-4" />
              Tạo mới
            </Link>
          </Button>
        </div>

        <div className="relative flex w-full flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex w-full items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Tìm story phù hợp"
                className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleToggleFilterPanel}
                data-story-filter-toggle
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <Filter className="h-4 w-4" />
                Bộ lọc nâng cao
                <ChevronDown className="h-4 w-4" />
              </Button>

              {isFilterOpen ? (
                <div
                  data-story-filter-panel
                  className="absolute right-0 top-full z-20 mt-3 w-[min(28rem,calc(100vw-2rem))] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_20px_40px_-16px_rgba(15,23,42,0.15)]"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Trạng thái
                      </label>
                      <select
                        value={draftStatus}
                        onChange={(event) =>
                          handleDraftStatusFilterChange(
                            event.target.value as StoryStatus | "all",
                          )
                        }
                        className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-[54%] h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="relative">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Thẻ
                      </label>
                      <select
                        value={draftTagId}
                        onChange={(event) =>
                          handleDraftTagFilterChange(
                            event.target.value === "all"
                              ? "all"
                              : Number(event.target.value),
                          )
                        }
                        className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="all">Tất cả thẻ</option>
                        {availableTags.map((tag) => (
                          <option key={tag.tagId} value={tag.tagId}>
                            {tag.tagName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-[54%] h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="relative">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Địa điểm
                      </label>
                      <select
                        value={draftHotspotId}
                        onChange={(event) =>
                          handleDraftHotspotFilterChange(event.target.value)
                        }
                        className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Tất cả địa điểm</option>
                        {availableHotspots.map((hotspot) => (
                          <option key={hotspot.id} value={String(hotspot.id)}>
                            {hotspot.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-[54%] h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="relative">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Tuyến đường
                      </label>
                      <select
                        value={draftRouteId}
                        onChange={(event) =>
                          handleDraftRouteFilterChange(event.target.value)
                        }
                        className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Tất cả tuyến đường</option>
                        {availableRoutes.map((route) => (
                          <option key={route.id} value={String(route.id)}>
                            {route.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-[54%] h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetAdvancedFilters}
                      className="rounded-full border-slate-200 px-4 text-slate-600 hover:bg-slate-50"
                    >
                      Xóa lọc
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyAdvancedFilters}
                      className="rounded-full px-4"
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <section className="flex flex-1 flex-col gap-5">
          <div>
            {loadStoriesError ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-8 text-center text-sm text-rose-700">
                Không thể tải câu chuyện: {loadStoriesError}
              </div>
            ) : isLoadingStories ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">
                Đang tải dữ liệu câu chuyện...
              </div>
            ) : stories.length > 0 ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white overflow-visible">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-left">
                      <th className="w-14 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        #
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tiêu đề
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tên thẻ
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Thứ tự
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Khoảng cách
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Trạng thái
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStories.map((story, index) => {
                      const isMenuOpen = openMenuStoryId === story.id;
                      const isPublishing = publishingStoryId === story.id;
                      const isDeleting = deletingStoryId === story.id;
                      const isBusy = isPublishing || isDeleting;

                      return (
                        <tr
                          key={story.id}
                          className={cn(
                            "border-t border-slate-200 align-top",
                            isMenuOpen && "relative z-20",
                          )}
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-slate-500">
                            {(safeCurrentPage - 1) * STORIES_PER_PAGE +
                              index +
                              1}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {story.title}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {story.tagName}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex px-3 py-1 text-xs font-medium text-slate-700">
                              {story.orderIndexLabel}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex px-3 py-1 text-xs font-medium text-slate-700">
                              {story.distanceToNextLabel}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={story.statusLabel} />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div
                              className="relative flex justify-end"
                              data-story-actions
                            >
                              <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                                onClick={() =>
                                  setOpenMenuStoryId(
                                    isMenuOpen ? null : story.id,
                                  )
                                }
                                className={`rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 ${isMenuOpen ? "bg-slate-100" : "bg-white/90"}`}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>

                              {isMenuOpen ? (
                                <div
                                  role="menu"
                                  className="absolute right-0 top-[calc(100%+0.6rem)] w-40 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
                                >
                                  {storyActions.map((action) => {
                                    const ActionIcon = action.icon;

                                    return action.key === "edit" ? (
                                      <Link
                                        key={action.label}
                                        href={`/curator/stories/${story.id}/edit`}
                                        role="menuitem"
                                        onClick={(event) => {
                                          if (isBusy) {
                                            event.preventDefault();
                                            return;
                                          }
                                          setOpenMenuStoryId(null);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                      >
                                        <ActionIcon className="h-4 w-4" />
                                        <span>{action.label}</span>
                                      </Link>
                                    ) : action.key === "detail" ? (
                                      <Link
                                        key={action.label}
                                        href={`/curator/stories/${story.id}`}
                                        role="menuitem"
                                        onClick={(event) => {
                                          if (isBusy) {
                                            event.preventDefault();
                                            return;
                                          }
                                          setOpenMenuStoryId(null);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                      >
                                        <ActionIcon className="h-4 w-4" />
                                        <span>{action.label}</span>
                                      </Link>
                                    ) : action.key === "submit" ? (
                                      <button
                                        key={action.label}
                                        type="button"
                                        role="menuitem"
                                        onClick={() =>
                                          handlePublishStory(story)
                                        }
                                        disabled={isBusy}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isPublishing ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <ActionIcon className="h-4 w-4" />
                                        )}
                                        <span>
                                          {isPublishing
                                            ? "Đang duyệt..."
                                            : action.label}
                                        </span>
                                      </button>
                                    ) : (
                                      <button
                                        key={action.label}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => handleDeleteStory(story)}
                                        disabled={isBusy}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isDeleting ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <ActionIcon className="h-4 w-4" />
                                        )}
                                        <span>
                                          {isDeleting
                                            ? "Đang xóa..."
                                            : action.label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {stories.length === 0 && !isLoadingStories && !loadStoriesError ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-card px-5 py-10 text-center">
                <p className="cq-card-title sm:text-base">
                  Không tìm thấy câu chuyện
                </p>
                <p className="cq-page-subtitle mt-2">
                  Thử đổi từ khóa, bộ lọc hoặc tạo một câu chuyện mới.
                </p>
              </div>
            ) : null}
          </div>

          {stories.length > 0 ? (
            <div className="mt-auto flex justify-end pt-6">
              <CuratorPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          ) : null}
        </section>

        {pendingPublishStory ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => setPendingPublishStory(null)}
              aria-hidden="true"
            />

            <div className="relative z-10 w-full max-w-[22rem] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-7">
              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Send className="h-8 w-8" />
                </div>
                <h2 className="text-[1.125rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.25rem]">
                  Bạn có chắc muốn duyệt bài?
                </h2>
                <p className="mx-auto max-w-[16.5rem] text-[0.8125rem] leading-5 text-slate-500 sm:text-[0.875rem]">
                  Câu chuyện{" "}
                  <span className="font-semibold text-slate-900">
                    {pendingPublishStory.title}
                  </span>{" "}
                  sẽ được xuất bản ngay lập tức.
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setPendingPublishStory(null)}
                  disabled={publishingStoryId === pendingPublishStory.id}
                  className="h-10 rounded-2xl border-slate-200 bg-slate-100 text-[0.8125rem] font-semibold text-slate-600 shadow-none hover:bg-slate-200 hover:text-slate-700 sm:text-sm"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => void handleConfirmPublishStory()}
                  disabled={publishingStoryId === pendingPublishStory.id}
                  className="h-10 rounded-2xl border-[#0066CC] bg-[#0066CC] text-[0.8125rem] font-semibold text-white shadow-none hover:border-[#0052A3] hover:bg-[#0052A3] sm:text-sm"
                >
                  {publishingStoryId === pendingPublishStory.id
                    ? "Đang duyệt..."
                    : "Duyệt bài"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {pendingDeleteStory ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => setPendingDeleteStory(null)}
              aria-hidden="true"
            />

            <div className="relative z-10 w-full max-w-[22rem] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-7">
              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <Trash2 className="h-8 w-8" />
                </div>
                <h2 className="text-[1.125rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.25rem]">
                  Bạn có chắc muốn xóa câu chuyện?
                </h2>
                <p className="mx-auto max-w-[16.5rem] text-[0.8125rem] leading-5 text-slate-500 sm:text-[0.875rem]">
                  Câu chuyện{" "}
                  <span className="font-semibold text-slate-900">
                    {pendingDeleteStory.title}
                  </span>{" "}
                  sẽ bị xóa khỏi danh sách.
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setPendingDeleteStory(null)}
                  disabled={deletingStoryId === pendingDeleteStory.id}
                  className="h-10 rounded-2xl border-slate-200 bg-slate-100 text-[0.8125rem] font-semibold text-slate-600 shadow-none hover:bg-slate-200 hover:text-slate-700 sm:text-sm"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => void handleConfirmDeleteStory()}
                  disabled={deletingStoryId === pendingDeleteStory.id}
                  className="h-10 rounded-2xl border-rose-600 bg-rose-600 text-[0.8125rem] font-semibold text-white shadow-none hover:border-rose-700 hover:bg-rose-700 sm:text-sm"
                >
                  {deletingStoryId === pendingDeleteStory.id
                    ? "Đang xóa..."
                    : "Xóa câu chuyện"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
