"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ChevronDown,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CuratorPagination } from "@/components/curator/CuratorPagination";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  storyApi,
  tagApi,
  hotspotApi,
  type BackendHotspot,
  type BackendStory,
} from "@/services/api";

type StoryStatus = "Đã xuất bản" | "Chờ duyệt" | "Bản nháp" | "Bị từ chối";

type StoryItem = {
  id: string;
  title: string;
  hotspot: string;
  status: StoryStatus;
  tagName: string;
  updatedAt: string;
  reviewNote?: string;
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
    default:
      return "Chờ duyệt";
  }
}

const initialStories: StoryItem[] = [];

const statusOptions: Array<{ label: string; value: StoryStatus | "all" }> = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đã xuất bản", value: "Đã xuất bản" },
  { label: "Chờ duyệt", value: "Chờ duyệt" },
  { label: "Bản nháp", value: "Bản nháp" },
  { label: "Bị từ chối", value: "Bị từ chối" },
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

export default function CuratorStoriesPage() {
  const [stories, setStories] = useState(initialStories);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<StoryStatus | "all">(
    "all",
  );
  const [selectedTagId, setSelectedTagId] = useState<number | "all">("all");
  const [selectedHotspotId, setSelectedHotspotId] = useState<number | "all">(
    "all",
  );
  const [availableTags, setAvailableTags] = useState<
    { tagId: number; tagName: string }[] | []
  >([]);
  const [availableHotspots, setAvailableHotspots] = useState<BackendHotspot[]>(
    [],
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openMenuStoryId, setOpenMenuStoryId] = useState<string | null>(null);
  const [, setDraftTitle] = useState("");
  const [, setDraftHotspot] = useState("");
  const [, setDraftStatus] = useState<StoryStatus>("Bản nháp");
  const [, setDraftReviewNote] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [, setFormError] = useState<string | null>(null);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [loadStoriesError, setLoadStoriesError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);
  const deferredSearch = useDeferredValue(searchQuery);

  const backendStatusValue =
    selectedStatus === "Đã xuất bản"
      ? "PUBLISHED"
      : selectedStatus === "Bị từ chối"
        ? "REJECTED"
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
          keyword: deferredSearch,
          status: backendStatusValue,
          tagId: selectedTagId === "all" ? undefined : selectedTagId,
          hotspotId:
            selectedHotspotId === "all" ? undefined : selectedHotspotId,
        });

        const storiesWithHotspot = await Promise.all(
          response.content.map(async (story: BackendStory) => {
            const hotspot = await hotspotApi.getHotspotById(story.hotspotId);
            return {
              id: String(story.storyId),
              title: story.title,
              hotspot: hotspot.hotspotName ?? `#${story.hotspotId}`,
              status: getStoryStatusLabel(story.status),
              tagName: getSingleTagName(story.tag?.tagName),
              updatedAt: story.updatedAt
                ? new Intl.DateTimeFormat("vi-VN").format(
                    new Date(story.updatedAt),
                  )
                : "",
              reviewNote: undefined,
            };
          }),
        );

        if (!cancelled) {
          setStories(storiesWithHotspot);
          setTotalPages(response.page.totalPages);
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
    deferredSearch,
    selectedStatus,
    selectedTagId,
    selectedHotspotId,
    backendStatusValue,
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
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleCreateFocus() {
    createSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
    draftInputRef.current?.focus();
  }

  function resetForm() {
    setDraftTitle("");
    setDraftHotspot("");
    setDraftStatus("Bản nháp");
    setDraftReviewNote("");
    setEditingStoryId(null);
    setFormError(null);
  }

  function handleEditStory(story: StoryItem) {
    setEditingStoryId(story.id);
    setDraftTitle(story.title);
    setDraftHotspot(story.hotspot);
    setDraftStatus(story.status);
    setDraftReviewNote(story.reviewNote ?? "");
    setFormError(null);
    handleCreateFocus();
  }

  async function handleDeleteStory(storyId: string) {
    setOpenMenuStoryId(null);

    try {
      await storyApi.deleteStory(Number(storyId));
      setStories((current) => current.filter((story) => story.id !== storyId));
      if (editingStoryId === storyId) {
        resetForm();
      }
      toast.success("Xóa story thành công.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể xóa story. Vui lòng thử lại.",
      );
    }
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value: StoryStatus | "all") {
    setSelectedStatus(value);
    setCurrentPage(1);
  }

  function handleTagFilterChange(value: number | "all") {
    setSelectedTagId(value);
    setCurrentPage(1);
  }

  function handleHotspotFilterChange(value: number | "all") {
    setSelectedHotspotId(value);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    setOpenMenuStoryId(null);
    setCurrentPage(page);
  }

  useEffect(() => {
    async function loadFilterData() {
      try {
        const tagResponse = await tagApi.getTags({
          page: 0,
          size: 100,
          sortBy: "createdAt",
          sortDir: "DESC",
        });
        setAvailableTags(tagResponse.content);
      } catch {
        setAvailableTags([]);
      }

      try {
        const hotspotResponse = await hotspotApi.getHotspots();
        setAvailableHotspots(hotspotResponse);
      } catch {
        setAvailableHotspots([]);
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
              Quản lý micro-story gắn với hotspot và trạng thái biên tập.
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
                onClick={() => setIsFilterOpen((current) => !current)}
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
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="relative">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Trạng thái
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(event) =>
                          handleStatusFilterChange(
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
                        value={selectedTagId}
                        onChange={(event) =>
                          handleTagFilterChange(
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
                        value={selectedHotspotId}
                        onChange={(event) =>
                          handleHotspotFilterChange(
                            event.target.value === "all"
                              ? "all"
                              : Number(event.target.value),
                          )
                        }
                        className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="all">Tất cả địa điểm</option>
                        {availableHotspots.map((hotspot) => (
                          <option
                            key={hotspot.hotspotId}
                            value={hotspot.hotspotId}
                          >
                            {hotspot.hotspotName ?? `#${hotspot.hotspotId}`}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-[54%] h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
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
                Không thể tải story: {loadStoriesError}
              </div>
            ) : isLoadingStories ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">
                Đang tải dữ liệu story...
              </div>
            ) : stories.length > 0 ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white overflow-visible">
                <table className="min-w-190 w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-left">
                      <th className="w-14 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        #
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tiêu đề
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Địa điểm
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Thẻ
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Trạng thái
                      </th>
                      <th className="w-20 px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStories.map((story, index) => {
                      return (
                        <tr
                          key={story.id}
                          className={cn(
                            "border-t border-slate-200 align-top",
                            openMenuStoryId === story.id && "relative z-20",
                          )}
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-slate-500">
                            {(safeCurrentPage - 1) * STORIES_PER_PAGE +
                              index +
                              1}
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-6 text-slate-950">
                                {story.title}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                              {story.hotspot}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                              {story.tagName}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={story.status} />
                          </td>
                          <td className="px-4 py-4">
                            <div
                              className="relative flex justify-end overflow-visible"
                              data-story-actions
                            >
                              <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={openMenuStoryId === story.id}
                                onClick={() =>
                                  setOpenMenuStoryId(
                                    openMenuStoryId === story.id
                                      ? null
                                      : story.id,
                                  )
                                }
                                className={cn(
                                  "inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700",
                                  openMenuStoryId === story.id &&
                                    "bg-slate-100",
                                )}
                                aria-label={`Tác vụ cho ${story.title}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>

                              {openMenuStoryId === story.id ? (
                                <div
                                  role="menu"
                                  className="absolute right-0 top-[calc(100%+0.6rem)] w-40 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
                                >
                                  <Link
                                    href={`/curator/stories/${story.id}`}
                                    role="menuitem"
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                    onClick={() => setOpenMenuStoryId(null)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>Xem chi tiết</span>
                                  </Link>

                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setOpenMenuStoryId(null);
                                      handleEditStory(story);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span>Chỉnh sửa</span>
                                  </button>

                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleDeleteStory(story.id)}
                                    className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 pt-3 pb-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Xóa</span>
                                  </button>
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
      </section>
    </div>
  );
}
