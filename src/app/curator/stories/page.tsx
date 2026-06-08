"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Eye,
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

type StoryStatus = "Đã xuất bản" | "Chờ duyệt" | "Bản nháp" | "Bị từ chối";

type StoryItem = {
  id: string;
  title: string;
  hotspot: string;
  status: StoryStatus;
  updatedAt: string;
  reviewNote?: string;
};

const initialStories: StoryItem[] = [
  {
    id: "chua-cau-hoi-an",
    title: "Chuyện chiếc cầu Nhật Bản giữa lòng Hội An",
    hotspot: "Chùa Cầu Hội An",
    status: "Đã xuất bản",
    updatedAt: "04/06/2026",
  },
  {
    id: "co-do-hoa-lu",
    title: "Hoa Lư - kinh đô đầu tiên của Đại Cồ Việt",
    hotspot: "Cố đô Hoa Lư",
    status: "Chờ duyệt",
    updatedAt: "05/06/2026",
  },
  {
    id: "hoang-thanh-thang-long",
    title: "Bí mật dưới lòng Hoàng thành",
    hotspot: "Hoàng thành Thăng Long",
    status: "Bản nháp",
    updatedAt: "06/06/2026",
  },
  {
    id: "pho-co-ha-noi",
    title: "Áo dài và phố cổ",
    hotspot: "Phố cổ Hà Nội",
    status: "Bị từ chối",
    updatedAt: "02/06/2026",
  },
];

const statusOptions: Array<{ label: string; value: StoryStatus | "all" }> = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đã xuất bản", value: "Đã xuất bản" },
  { label: "Chờ duyệt", value: "Chờ duyệt" },
  { label: "Bản nháp", value: "Bản nháp" },
  { label: "Bị từ chối", value: "Bị từ chối" },
];
const STORIES_PER_PAGE = 8;

const statusBadgeClasses: Record<StoryStatus, string> = {
  "Đã xuất bản": "bg-emerald-100 text-emerald-700",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Bản nháp": "bg-slate-100 text-slate-600",
  "Bị từ chối": "bg-rose-100 text-rose-700",
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildStoryId(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("vi-VN").format(new Date());
}

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
  const [openMenuStoryId, setOpenMenuStoryId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftHotspot, setDraftHotspot] = useState("");
  const [draftStatus, setDraftStatus] = useState<StoryStatus>("Bản nháp");
  const [draftReviewNote, setDraftReviewNote] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);
  const deferredSearch = useDeferredValue(searchQuery);

  const normalizedQuery = normalizeText(deferredSearch);
  const filteredStories = stories.filter((story) => {
    const matchesQuery =
      !normalizedQuery ||
      normalizeText(story.title).includes(normalizedQuery) ||
      normalizeText(story.hotspot).includes(normalizedQuery);
    const matchesStatus =
      selectedStatus === "all" || story.status === selectedStatus;

    return matchesQuery && matchesStatus;
  });
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStories.length / STORIES_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStories = filteredStories.slice(
    (safeCurrentPage - 1) * STORIES_PER_PAGE,
    safeCurrentPage * STORIES_PER_PAGE,
  );
  const isEditing = editingStoryId !== null;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-story-actions]")) {
        setOpenMenuStoryId(null);
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

  function handleSubmitStory() {
    const trimmedTitle = draftTitle.trim();
    const trimmedHotspot = draftHotspot.trim();
    const trimmedReviewNote = draftReviewNote.trim();

    if (!trimmedTitle) {
      setFormError("Tiêu đề story không được để trống.");
      return;
    }

    if (!trimmedHotspot) {
      setFormError("Hotspot gắn với story không được để trống.");
      return;
    }

    if (draftStatus === "Bị từ chối" && !trimmedReviewNote) {
      setFormError("Story bị từ chối cần có ghi chú phản hồi.");
      return;
    }

    const duplicate = stories.some(
      (story) =>
        story.id !== editingStoryId &&
        normalizeText(story.title) === normalizeText(trimmedTitle) &&
        normalizeText(story.hotspot) === normalizeText(trimmedHotspot),
    );

    if (duplicate) {
      setFormError("Story này đã tồn tại trong danh sách.");
      return;
    }

    setFormError(null);

    if (editingStoryId) {
      setStories((current) =>
        current.map((story) =>
          story.id === editingStoryId
            ? {
                ...story,
                title: trimmedTitle,
                hotspot: trimmedHotspot,
                status: draftStatus,
                updatedAt: getTodayLabel(),
                reviewNote:
                  draftStatus === "Bị từ chối" ? trimmedReviewNote : undefined,
              }
            : story,
        ),
      );
      resetForm();
      return;
    }

    const nextIdBase =
      buildStoryId(trimmedTitle) || `story-${stories.length + 1}`;
    let nextId = nextIdBase;
    let suffix = 2;

    while (stories.some((story) => story.id === nextId)) {
      nextId = `${nextIdBase}-${suffix}`;
      suffix += 1;
    }

    setStories((current) => [
      ...current,
      {
        id: nextId,
        title: trimmedTitle,
        hotspot: trimmedHotspot,
        status: draftStatus,
        updatedAt: getTodayLabel(),
        reviewNote:
          draftStatus === "Bị từ chối" ? trimmedReviewNote : undefined,
      },
    ]);
    resetForm();
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

  function handleDeleteStory(storyId: string) {
    setStories((current) => current.filter((story) => story.id !== storyId));
    setOpenMenuStoryId(null);

    if (editingStoryId === storyId) {
      resetForm();
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

  function handlePageChange(page: number) {
    setOpenMenuStoryId(null);
    setCurrentPage(page);
  }

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

        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-[320px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm story phù hợp"
              className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
            />
          </div>

          <div className="relative w-full lg:max-w-[220px]">
            <select
              value={selectedStatus}
              onChange={(event) =>
                handleStatusFilterChange(event.target.value as StoryStatus | "all")
              }
              className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <section className="flex flex-1 flex-col gap-5">
          <div>
            {filteredStories.length > 0 ? (
              <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white">
                <table className="min-w-[760px] w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-left">
                      <th className="w-14 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        #
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tiêu đề
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Hotspot
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Cập nhật
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Trạng thái
                      </th>
                      <th className="w-20 px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Actions
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
                            {(safeCurrentPage - 1) * STORIES_PER_PAGE + index + 1}
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-6 text-slate-950">
                                {story.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                Story ID: {story.id}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                              {story.hotspot}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-900">
                                {story.updatedAt}
                              </p>
                              <p className="text-xs text-slate-500">
                                Cập nhật gần nhất
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={story.status} />
                          </td>
                          <td className="px-4 py-4">
                            <div
                              className="relative flex justify-end"
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
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => setOpenMenuStoryId(null)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>Xem chi tiết</span>
                                  </button>

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

            {filteredStories.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-card px-5 py-10 text-center">
                <p className="cq-card-title sm:text-base">
                  Không tìm thấy story
                </p>
                <p className="cq-page-subtitle mt-2">
                  Thử đổi từ khóa, bộ lọc hoặc tạo một story mới.
                </p>
              </div>
            ) : null}
          </div>

          {filteredStories.length > 0 ? (
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
