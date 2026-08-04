"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import {
  Eye,
  ImagePlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { TagIdentityChip } from "@/components/curator/TagIdentityChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildTagDetailHref,
  buildTagSlug,
  formatTagDateTime,
  formatTagStatus,
  getTagStatusTone,
  getTagColor,
  normalizeTagText,
  type TagRecord,
} from "@/lib/tags";
import { CuratorPagination } from "@/components/curator/CuratorPagination";
import { cn } from "@/lib/utils";
import { tagApi } from "@/services/api";

type TagItem = {
  id: string;
  backendId: number | null;
  slug: string;
  name: string;
  imageUrl: string | null;
  routeCount: number;
  hotspotCount: number;
  storyCount: number;
  color: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

function getTagTotalUsage(tag: Pick<TagItem, "routeCount" | "storyCount">) {
  return tag.routeCount + tag.storyCount;
}

function mapTagRecordToTagItem(tag: TagRecord): TagItem {
  return {
    id: String(tag.tagId),
    backendId: tag.tagId,
    slug: buildTagSlug(tag.tagName) || `tag-${tag.tagId}`,
    name: tag.tagName,
    imageUrl: tag.imageUrl ?? null,
    routeCount: tag.routeCount,
    hotspotCount: tag.hotspotCount,
    storyCount: tag.storyCount,
    color: getTagColor(tag.tagId - 1),
    status: tag.tagStatus,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

const TAGS_PAGE_SIZE = 10;
type TagListResponse = Awaited<ReturnType<typeof tagApi.getTags>>;

const pendingTagListRequests = new Map<string, Promise<TagListResponse>>();

function loadTagsOnce({
  search,
  page,
  size,
  reloadVersion,
}: {
  search?: string;
  page: number;
  size: number;
  reloadVersion: number;
}) {
  const requestKey = JSON.stringify({
    search: search ?? "",
    page,
    size,
    reloadVersion,
  });
  const existingRequest = pendingTagListRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = tagApi
    .getTags({
      search,
      page,
      size,
    })
    .finally(() => {
      pendingTagListRequests.delete(requestKey);
    });

  pendingTagListRequests.set(requestKey, request);
  return request;
}

export default function CuratorTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(TAGS_PAGE_SIZE);
  const [serverPageNumber, setServerPageNumber] = useState(0);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuTagId, setOpenMenuTagId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImageInputKey, setFormImageInputKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(searchQuery);
  const effectiveSearchQuery = deferredSearch.trim();
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const maxTagCount = Math.max(...tags.map((tag) => getTagTotalUsage(tag)), 1);
  const isEditing = editingTagId !== null;
  const showEmptyState = !isLoadingTags && tags.length === 0;
  const editingTag =
    editingTagId === null
      ? null
      : (tags.find((tag) => tag.id === editingTagId) ?? null);
  const pendingDeleteTag =
    pendingDeleteId === null
      ? null
      : (tags.find((tag) => tag.id === pendingDeleteId) ?? null);

  useEffect(() => {
    let cancelled = false;

    async function loadTags() {
      try {
        setIsLoadingTags(true);
        setLoadError(null);

        const response = await loadTagsOnce({
          search: effectiveSearchQuery || undefined,
          page: currentPage - 1,
          size: TAGS_PAGE_SIZE,
          reloadVersion,
        });
        if (cancelled) {
          return;
        }

        setTags(response.content.map(mapTagRecordToTagItem));
        setTotalElements(response.page.totalElements);
        setPageSize(response.page.size);
        setServerPageNumber(response.page.number);

        const nextTotalPages = Math.max(1, response.page.totalPages || 1);
        const nextCurrentPage =
          response.page.totalPages === 0 ? 1 : response.page.number + 1;

        setTotalPages(nextTotalPages);

        if (nextCurrentPage !== currentPage) {
          setCurrentPage(nextCurrentPage);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách thẻ.";
        setLoadError(message);
      } finally {
        if (!cancelled) {
          setIsLoadingTags(false);
        }
      }
    }

    loadTags();

    return () => {
      cancelled = true;
    };
  }, [currentPage, effectiveSearchQuery, reloadVersion]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-tag-actions]")) {
        setOpenMenuTagId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuTagId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function resetForm() {
    setFormName("");
    setFormImageFile(null);
    setFormImageInputKey((value) => value + 1);
    setEditingTagId(null);
    setFormError(null);
  }

  function openCreateModal() {
    resetForm();
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    resetForm();
  }

  function handleEditTag(tag: TagItem) {
    setEditingTagId(tag.id);
    setFormName(tag.name);
    setFormImageFile(null);
    setFormImageInputKey((value) => value + 1);
    setFormError(null);
    setIsEditorOpen(true);
  }

  async function handleSubmitTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = formName.trim();

    if (!trimmedName) {
      setFormError("Tên thẻ không được để trống.");
      return;
    }

    if (formImageFile && !formImageFile.type.startsWith("image/")) {
      setFormError("Ảnh thẻ phải là tệp hình ảnh hợp lệ.");
      return;
    }

    const duplicate = tags.some(
      (tag) =>
        tag.id !== editingTagId &&
        normalizeTagText(tag.name) === normalizeTagText(trimmedName),
    );

    if (duplicate) {
      setFormError("Tên thẻ phải duy nhất trong hệ thống.");
      return;
    }

    setFormError(null);

    if (editingTagId) {
      if (!editingTag?.backendId) {
        setFormError("Không tìm thấy ID backend của thẻ để cập nhật.");
        return;
      }
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTag?.backendId) {
        await tagApi.updateTag(editingTag.backendId, {
          tagName: trimmedName,
          imageFile: formImageFile,
        });
      } else {
        await tagApi.createTag({
          tagName: trimmedName,
          imageFile: formImageFile,
        });
      }

      setCurrentPage(1);
      setReloadVersion((version) => version + 1);
      closeEditor();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditing
            ? "Không thể cập nhật thẻ."
            : "Không thể tạo thẻ mới.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteRequest(tagId: string) {
    setOpenMenuTagId(null);
    setPendingDeleteId(tagId);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) {
      return;
    }

    if (!pendingDeleteTag?.backendId) {
      setPendingDeleteId(null);
      return;
    }

    try {
      setIsSubmitting(true);
      await tagApi.deleteTag(pendingDeleteTag.backendId);

      if (editingTagId === pendingDeleteId) {
        closeEditor();
      }

      setReloadVersion((version) => version + 1);
      setPendingDeleteId(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePageChange(page: number) {
    setOpenMenuTagId(null);
    setCurrentPage(page);
  }

  return (
    <>
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="cq-page-title">Thẻ hành trình</h1>
              <p className="cq-page-subtitle max-w-2xl">
                Tạo và quản lý các thẻ chủ đề để phân loại địa điểm, câu chuyện
                và tuyến hành trình, giúp người dùng dễ dàng khám phá nội dung
                liên quan.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Tạo mới
            </Button>
          </div>

          <div className="relative w-full lg:max-w-[320px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm thẻ phù hợp với địa điểm "
              className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
            />
          </div>

          {loadError ? (
            <div className="rounded-[1.25rem] border border-[#F3D1CD] bg-[#FFF6F5] px-4 py-3 text-sm font-medium text-[#CF3F34]">
              Không thể tải danh sách thẻ từ API: {loadError}
            </div>
          ) : null}

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <h3 className="cq-card-title">
                Thống kê sử dụng thẻ trong hệ thống
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 sm:text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  Tuyến
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Câu chuyện
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {isLoadingTags ? (
                  <p className="cq-page-subtitle">Đang tải thống kê thẻ...</p>
                ) : null}

                {tags.map((tag) => {
                  const totalUsage = getTagTotalUsage(tag);
                  const totalUsageWidth =
                    totalUsage > 0
                      ? `${(totalUsage / maxTagCount) * 100}%`
                      : "0%";
                  const routeSegmentWidth =
                    totalUsage > 0
                      ? `${(tag.routeCount / totalUsage) * 100}%`
                      : "0%";
                  const storySegmentWidth =
                    totalUsage > 0
                      ? `${(tag.storyCount / totalUsage) * 100}%`
                      : "0%";

                  return (
                    <div
                      key={`${tag.id}-stats`}
                      className="grid gap-3 sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(220px,auto)] sm:items-center sm:gap-4"
                    >
                      <Link
                        href={buildTagDetailHref(tag.backendId ?? tag.id)}
                        className="inline-flex max-w-full transition hover:opacity-85"
                      >
                        <TagIdentityChip
                          name={tag.name}
                          imageUrl={tag.imageUrl}
                          accentColor={tag.color}
                        />
                      </Link>

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="flex h-full overflow-hidden rounded-full"
                          style={{ width: totalUsageWidth }}
                        >
                          {tag.routeCount > 0 ? (
                            <div
                              className="h-full bg-sky-500"
                              style={{ width: routeSegmentWidth }}
                            />
                          ) : null}
                          {tag.storyCount > 0 ? (
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: storySegmentWidth }}
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-start gap-2 text-xs text-slate-500 sm:justify-end sm:text-sm">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          {totalUsage} tổng
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                          Tuyến: {tag.routeCount}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          Câu chuyện: {tag.storyCount}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {showEmptyState ? (
                  <p className="cq-page-subtitle">
                    Chưa có dữ liệu để hiển thị thống kê.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-slate-900">
                    Quản lý thẻ
                  </h3>
                  <p className="cq-page-subtitle mt-1 text-xs sm:text-sm">
                    Tạo, chỉnh sửa và xóa thẻ trực tiếp trên cùng một trang.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>
                    {isLoadingTags
                      ? "Đang tải dữ liệu..."
                      : `${totalElements} kết quả`}
                  </span>
                  {!isLoadingTags ? (
                    <>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        Trang {serverPageNumber + 1}/{Math.max(totalPages, 1)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        Kích thước trang {pageSize}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white">
                {isLoadingTags ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="space-y-3 animate-pulse">
                      <div className="h-5 w-48 rounded-full bg-slate-100" />
                      <div className="h-16 rounded-2xl bg-slate-50" />
                      <div className="h-16 rounded-2xl bg-slate-50" />
                      <div className="h-16 rounded-2xl bg-slate-50" />
                    </div>
                  </div>
                ) : null}

                {!isLoadingTags && tags.length > 0 ? (
                  <div className="w-full">
                    <table className="w-full table-fixed border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90">
                          <th className="w-[28%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Thẻ
                          </th>
                          <th className="w-[10%] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Tuyến
                          </th>
                          <th className="w-[12%] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Câu chuyện
                          </th>
                          <th className="w-[16%] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Trạng thái
                          </th>
                          <th className="w-[15%] px-3 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Ngày tạo
                          </th>
                          <th className="w-[8%] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tags.map((tag) => {
                          return (
                            <tr
                              key={`${tag.id}-row`}
                              className={cn(
                                "border-t border-slate-200 align-top",
                                openMenuTagId === tag.id && "relative z-20",
                              )}
                            >
                              <td className="px-4 py-4 text-left">
                                <div className="min-w-0">
                                  <Link
                                    href={buildTagDetailHref(
                                      tag.backendId ?? tag.id,
                                    )}
                                    className="inline-flex max-w-full transition hover:opacity-85"
                                  >
                                    <TagIdentityChip
                                      name={tag.name}
                                      imageUrl={tag.imageUrl}
                                      accentColor={tag.color}
                                      className="max-w-full"
                                      avatarClassName="h-11 w-11"
                                      labelClassName="text-sm"
                                    />
                                  </Link>
                                </div>
                              </td>

                              <td className="px-3 py-4 text-center text-sm font-semibold text-slate-700">
                                {tag.routeCount}
                              </td>

                              <td className="px-3 py-4 text-center text-sm font-semibold text-slate-700">
                                {tag.storyCount}
                              </td>

                              <td className="px-3 py-4 text-center">
                                <span
                                  className={cn(
                                    "inline-flex max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-center text-xs font-medium leading-5",
                                    getTagStatusTone(tag.status),
                                  )}
                                >
                                  {formatTagStatus(tag.status)}
                                </span>
                              </td>

                              <td className="px-3 py-4 text-left text-xs leading-5 text-slate-500 sm:text-sm">
                                {formatTagDateTime(tag.createdAt)}
                              </td>

                              <td className="px-3 py-4 text-center">
                                <div
                                  className="relative flex justify-center overflow-visible"
                                  data-tag-actions
                                >
                                  <button
                                    type="button"
                                    aria-haspopup="menu"
                                    aria-expanded={openMenuTagId === tag.id}
                                    onClick={() =>
                                      setOpenMenuTagId(
                                        openMenuTagId === tag.id
                                          ? null
                                          : tag.id,
                                      )
                                    }
                                    className={cn(
                                      "inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700",
                                      openMenuTagId === tag.id &&
                                        "bg-slate-100",
                                    )}
                                    aria-label={`Tác vụ cho ${tag.name}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  {openMenuTagId === tag.id ? (
                                    <div
                                      role="menu"
                                      className="absolute right-0 top-[calc(100%+0.6rem)] w-44 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)] z-30"
                                    >
                                      <Link
                                        href={buildTagDetailHref(
                                          tag.backendId ?? tag.id,
                                        )}
                                        role="menuitem"
                                        onClick={() => setOpenMenuTagId(null)}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                      >
                                        <Eye className="h-4 w-4" />
                                        <span>Xem chi tiết</span>
                                      </Link>

                                      <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                          setOpenMenuTagId(null);
                                          handleEditTag(tag);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span>Chỉnh sửa</span>
                                      </button>

                                      <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() =>
                                          handleDeleteRequest(tag.id)
                                        }
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

                {showEmptyState ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-card px-5 py-10 text-center">
                    <p className="cq-card-title sm:text-base">
                      Không tìm thấy thẻ
                    </p>
                    <p className="cq-page-subtitle mt-2">
                      Thử đổi từ khóa hoặc tạo một thẻ mới.
                    </p>
                  </div>
                ) : null}
              </div>

              {tags.length > 0 ? (
                <div className="mt-auto flex justify-end pt-2">
                  <CuratorPagination
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </div>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={closeEditor}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={closeEditor}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Đóng modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2 pr-10">
              <h2 className="cq-modal-title">
                {isEditing ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
              </h2>
              <p className="cq-page-subtitle">
                Điền thông tin cơ bản để tạo thẻ nội dung cho địa điểm và câu
                chuyện.
              </p>
            </div>

            <form onSubmit={handleSubmitTag} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Tên thẻ
                </label>
                <Input
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="Ví dụ: Lịch sử kháng chiến"
                  className="h-12 rounded-3xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Ảnh thẻ
                </label>
                <input
                  key={formImageInputKey}
                  id="tag-image-file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) =>
                    setFormImageFile(event.target.files?.[0] ?? null)
                  }
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="tag-image-file"
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition",
                    isSubmitting
                      ? "cursor-not-allowed bg-slate-50 opacity-60"
                      : "cursor-pointer hover:border-slate-300",
                  )}
                >
                  <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-medium text-slate-700">
                    <ImagePlus className="h-4 w-4" />
                    Chọn ảnh
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-500">
                    {formImageFile ? formImageFile.name : "Chưa chọn tệp"}
                  </span>
                </label>
                {isEditing ? (
                  <p className="text-xs text-slate-500">
                    Không chọn ảnh mới thì hệ thống giữ ảnh hiện tại.
                  </p>
                ) : null}
              </div>

              {formError ? (
                <p className="text-sm font-medium text-[#CF3F34]">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={closeEditor}
                  disabled={isSubmitting}
                  className="rounded-full px-5 text-sm shadow-sm"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  disabled={isSubmitting}
                  className="rounded-full px-5 text-sm text-white shadow-sm"
                >
                  {isEditing
                    ? "Lưu thay đổi"
                    : isSubmitting
                      ? "Đang tạo..."
                      : "Tạo thẻ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingDeleteTag ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPendingDeleteId(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[22rem] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-7 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-8">
            <div className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF1F0] text-[#CF3F34]">
                <Trash2 className="h-10 w-10" />
              </div>
              <h2 className="text-[1.125rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.25rem]">
                Bạn có chắc muốn xóa?
              </h2>
              <p className="mx-auto max-w-[16.5rem] text-[0.8125rem] leading-5 text-slate-500 sm:text-[0.875rem]">
                Hành động này không thể hoàn tác. Thẻ{" "}
                <span className="font-semibold text-slate-900">
                  {pendingDeleteTag.name}
                </span>{" "}
                sẽ bị xóa khỏi danh sách hiện tại.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setPendingDeleteId(null)}
                disabled={isSubmitting}
                className="h-11 rounded-2xl border-slate-200 bg-slate-100 text-[0.8125rem] font-semibold text-slate-600 shadow-none hover:bg-slate-200 hover:text-slate-700 sm:text-sm"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="h-11 rounded-2xl border-[#F3D7D4] bg-white text-[0.8125rem] font-semibold text-[#CF3F34] shadow-none hover:border-[#E9B5AF] hover:bg-[#FFF1F0] hover:text-[#B9342A] sm:text-sm"
              >
                {isSubmitting ? "Đang xóa..." : "Xóa thẻ"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
