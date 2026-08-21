"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Tags as TagsIcon,
  X,
} from "lucide-react";

import { Pagination } from "@/components/admin/Pagination";
import { PageLoading } from "@/components/app/page-loading";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { hotspotApi } from "@/services/api";
import { adminApi } from "@/services/api/admin/adminApi";
import {
  curatorApi,
  type CuratorPendingStory,
  type CuratorPendingTag,
} from "@/services/api/curator/curatorApi";
import {
  formatTagStatus,
  getTagInitials,
  getTagStatusTone,
} from "@/lib/tags";
import { cn } from "@/lib/utils";

const REVIEW_PAGE_SIZE = 12;

type ReviewEntityType = "tag" | "story";
type NameMap = Record<number, string>;
type SubmitAction = "approve" | "reject" | null;
type ReviewDialogMode = "approve" | "reject";
type ToastState = {
  tone: "success" | "error";
  message: string;
} | null;
type ReviewTarget =
  | { type: "tag"; item: CuratorPendingTag }
  | { type: "story"; item: CuratorPendingStory }
  | null;

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Không thể tải hàng đợi kiểm duyệt.";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function sortPendingTagsByCreatedAt(tags: CuratorPendingTag[]) {
  return [...tags].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return right.tagId - left.tagId;
    }

    return rightTime - leftTime;
  });
}

function sortPendingStoriesByCreatedAt(stories: CuratorPendingStory[]) {
  return [...stories].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? "").getTime();
    const rightTime = new Date(right.createdAt ?? "").getTime();

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return right.storyId - left.storyId;
    }

    return rightTime - leftTime;
  });
}

function formatStoryStatus(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase();

  switch (normalizedValue) {
    case "PENDING":
    case "PENDING_REVIEW":
    case "REVIEW":
      return "Chờ duyệt";
    case "APPROVED":
    case "PUBLISHED":
      return "Đã duyệt";
    case "REJECTED":
      return "Bị từ chối";
    case "DRAFT":
      return "Bản nháp";
    default:
      return value?.trim() || "Chưa có dữ liệu";
  }
}

function getStoryStatusTone(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase();

  switch (normalizedValue) {
    case "PENDING":
    case "PENDING_REVIEW":
    case "REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "APPROVED":
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "DRAFT":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getEntityLabel(type: ReviewEntityType) {
  return type === "tag" ? "thẻ" : "câu chuyện";
}

function getReviewTargetName(target: ReviewTarget) {
  if (!target) {
    return "";
  }

  return target.type === "tag" ? target.item.tagName : target.item.title;
}

function getReviewTargetCultureReason(target: ReviewTarget) {
  if (!target) {
    return "Backend chưa trả về lý do đánh giá văn hóa cho nội dung này.";
  }

  const cultureReason =
    target.type === "tag"
      ? target.item.cultureReason?.trim()
      : target.item.cultureReason?.trim();

  return (
    cultureReason ||
    "Backend chưa trả về lý do đánh giá văn hóa cho nội dung này."
  );
}

function getReviewTargetToastMessage(
  action: Exclude<SubmitAction, null>,
  target: Exclude<ReviewTarget, null>,
) {
  const label = getEntityLabel(target.type);

  if (action === "approve") {
    return `Đã duyệt ${label}.`;
  }

  return `Đã từ chối ${label}.`;
}

function getStoryTagName(story: CuratorPendingStory) {
  return story.tag?.tagName?.trim() || "Chưa gắn thẻ";
}

function getStoryHotspotName(
  story: CuratorPendingStory,
  hotspotNames: NameMap,
) {
  if (typeof story.hotspotId !== "number") {
    return "Chưa gắn địa điểm";
  }

  return hotspotNames[story.hotspotId] ?? "Đang tải tên địa điểm...";
}

export default function AdminTagReviewPage() {
  const [activeView, setActiveView] = useState<ReviewEntityType>("tag");
  const [allTags, setAllTags] = useState<CuratorPendingTag[]>([]);
  const [allStories, setAllStories] = useState<CuratorPendingStory[]>([]);
  const [hotspotNames, setHotspotNames] = useState<NameMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [tagPage, setTagPage] = useState(1);
  const [storyPage, setStoryPage] = useState(1);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget>(null);
  const [reviewDialogMode, setReviewDialogMode] =
    useState<ReviewDialogMode>("approve");
  const [rejectReason, setRejectReason] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<SubmitAction>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const totalTagPages = Math.max(
    1,
    Math.ceil(allTags.length / REVIEW_PAGE_SIZE),
  );
  const totalStoryPages = Math.max(
    1,
    Math.ceil(allStories.length / REVIEW_PAGE_SIZE),
  );
  const safeTagPage = Math.min(tagPage, totalTagPages);
  const safeStoryPage = Math.min(storyPage, totalStoryPages);

  const visibleTags = useMemo(() => {
    const start = (safeTagPage - 1) * REVIEW_PAGE_SIZE;
    return allTags.slice(start, start + REVIEW_PAGE_SIZE);
  }, [allTags, safeTagPage]);

  const visibleStories = useMemo(() => {
    const start = (safeStoryPage - 1) * REVIEW_PAGE_SIZE;
    return allStories.slice(start, start + REVIEW_PAGE_SIZE);
  }, [allStories, safeStoryPage]);

  const activeTotalItems =
    activeView === "tag" ? allTags.length : allStories.length;
  const activeTotalPages =
    activeView === "tag" ? totalTagPages : totalStoryPages;
  const activeSafePage = activeView === "tag" ? safeTagPage : safeStoryPage;
  const activeVisibleCount =
    activeView === "tag" ? visibleTags.length : visibleStories.length;
  const pendingCountLabel = useMemo(
    () => formatCount(activeTotalItems),
    [activeTotalItems],
  );
  const showErrorState =
    !loading &&
    Boolean(error) &&
    allTags.length === 0 &&
    allStories.length === 0;
  const showEmptyState =
    !loading &&
    !showErrorState &&
    (activeView === "tag"
      ? visibleTags.length === 0
      : visibleStories.length === 0);
  const isApproveDialog = reviewDialogMode === "approve";
  const reviewCultureReason = getReviewTargetCultureReason(reviewTarget);
  const reviewTargetName = getReviewTargetName(reviewTarget);
  const reviewTargetTypeLabel = reviewTarget
    ? getEntityLabel(reviewTarget.type)
    : "nội dung";
  const ReviewIcon = reviewTarget?.type === "story" ? FileText : TagsIcon;
  const ActiveQueueIcon = activeView === "tag" ? TagsIcon : FileText;

  useEffect(() => {
    let cancelled = false;

    async function loadPendingContent() {
      setLoading(true);
      setError(null);

      try {
        const response = await curatorApi.getPendingContent();

        if (cancelled) {
          return;
        }

        setAllTags(sortPendingTagsByCreatedAt(response.tags ?? []));
        setAllStories(sortPendingStoriesByCreatedAt(response.stories ?? []));
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setAllTags([]);
        setAllStories([]);
        setError(getErrorMessage(loadError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPendingContent();

    return () => {
      cancelled = true;
    };
  }, [reloadVersion]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && submittingAction === null) {
        resetReviewDialog();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [submittingAction]);

  useEffect(() => {
    const hotspotIds = [
      ...new Set(
        allStories.flatMap((story) =>
          typeof story.hotspotId === "number" ? [story.hotspotId] : [],
        ),
      ),
    ].filter((id) => hotspotNames[id] === undefined);

    if (hotspotIds.length === 0) {
      return;
    }

    let cancelled = false;

    async function resolveHotspotNames() {
      const results = await Promise.allSettled(
        hotspotIds.map((id) => hotspotApi.getHotspotById(id)),
      );

      if (cancelled) {
        return;
      }

      setHotspotNames((current) => {
        const next = { ...current };

        hotspotIds.forEach((id, index) => {
          const result = results[index];
          next[id] =
            result.status === "fulfilled"
              ? result.value.hotspotName?.trim() || "Địa điểm không có tên"
              : "Địa điểm không còn tồn tại";
        });

        return next;
      });
    }

    void resolveHotspotNames();

    return () => {
      cancelled = true;
    };
  }, [allStories, hotspotNames]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  function resetReviewDialog() {
    setReviewTarget(null);
    setReviewDialogMode("approve");
    setRejectReason("");
    setReviewError(null);
  }

  function openApproveDialog(target: Exclude<ReviewTarget, null>) {
    setReviewTarget(target);
    setReviewDialogMode("approve");
    setRejectReason("");
    setReviewError(null);
  }

  function openRejectDialog(target: Exclude<ReviewTarget, null>) {
    setReviewTarget(target);
    setReviewDialogMode("reject");
    setRejectReason("");
    setReviewError(null);
  }

  function removeTagFromQueue(tagId: number) {
    setAllTags((current) => current.filter((tag) => tag.tagId !== tagId));
  }

  function removeStoryFromQueue(storyId: number) {
    setAllStories((current) =>
      current.filter((story) => story.storyId !== storyId),
    );
  }

  async function handleApproveTarget() {
    if (!reviewTarget) {
      return;
    }

    const currentTarget = reviewTarget;
    setSubmittingAction("approve");
    setReviewError(null);

    try {
      if (currentTarget.type === "tag") {
        await adminApi.approveTag(currentTarget.item.tagId);
        removeTagFromQueue(currentTarget.item.tagId);
      } else {
        await adminApi.approveStory(currentTarget.item.storyId);
        removeStoryFromQueue(currentTarget.item.storyId);
      }

      setToast({
        tone: "success",
        message: getReviewTargetToastMessage("approve", currentTarget),
      });
      resetReviewDialog();
    } catch (approveError) {
      setReviewError(getErrorMessage(approveError));
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleRejectTarget() {
    if (!reviewTarget) {
      return;
    }

    const trimmedReason = rejectReason.trim();

    if (!trimmedReason) {
      setReviewError("Vui lòng nhập lý do từ chối.");
      return;
    }

    const currentTarget = reviewTarget;
    setSubmittingAction("reject");
    setReviewError(null);

    try {
      if (currentTarget.type === "tag") {
        await adminApi.rejectTag(currentTarget.item.tagId, trimmedReason);
        removeTagFromQueue(currentTarget.item.tagId);
      } else {
        await adminApi.rejectStory(currentTarget.item.storyId, trimmedReason);
        removeStoryFromQueue(currentTarget.item.storyId);
      }

      setToast({
        tone: "success",
        message: getReviewTargetToastMessage("reject", currentTarget),
      });
      resetReviewDialog();
    } catch (rejectError) {
      setReviewError(getErrorMessage(rejectError));
    } finally {
      setSubmittingAction(null);
    }
  }

  function handlePageChange(nextPage: number) {
    if (activeView === "tag") {
      setTagPage(nextPage);
      return;
    }

    setStoryPage(nextPage);
  }

  return (
    <div className="space-y-5 pb-5 pt-2">
      {toast ? (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[70] rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl",
            toast.tone === "success" ? "bg-slate-900" : "bg-red-600",
          )}
        >
          {toast.message}
        </div>
      ) : null}

      <PageHeader
        title="Kiểm duyệt thẻ và câu chuyện"
        subtitle="Hàng đợi quản trị viên xem xét các thẻ và câu chuyện trước khi nội dung hiển thị trong hệ thống."
        actions={
          <div className="flex flex-wrap items-center">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingCountLabel} {getEntityLabel(activeView)} chờ duyệt
            </span>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveView("tag")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            activeView === "tag"
              ? "border-pink-200 bg-pink-50 text-pink-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <TagsIcon className="h-4 w-4" />
          Thẻ
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-current">
            {formatCount(allTags.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("story")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            activeView === "story"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <FileText className="h-4 w-4" />
          Câu chuyện
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-current">
            {formatCount(allStories.length)}
          </span>
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Không thể tải hàng đợi kiểm duyệt: {error}
        </div>
      ) : null}

      {loading && allTags.length === 0 && allStories.length === 0 ? (
        <PageLoading className="min-h-[320px]" />
      ) : showErrorState ? (
        <div className="cq-admin-panel p-12 text-center">
          <ActiveQueueIcon className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Chưa tải được hàng đợi kiểm duyệt
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Kiểm tra lại kết nối hoặc thử tải lại dữ liệu chờ duyệt.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReloadVersion((value) => value + 1)}
            className="mt-4 gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      ) : showEmptyState ? (
        <div className="cq-admin-panel p-12 text-center">
          <ActiveQueueIcon className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Không có {getEntityLabel(activeView)} chờ duyệt
          </p>
          <p className="mt-1 text-xs text-slate-400">
            API hiện chưa trả về {getEntityLabel(activeView)} nào trong hàng đợi
            duyệt.
          </p>
        </div>
      ) : (
        <section className="cq-admin-panel relative overflow-visible">
          {activeView === "tag" ? (
            <table className="cq-admin-table">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[34%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-center">Ảnh</th>
                  <th>Thẻ</th>
                  <th>Trạng thái</th>
                  <th>Đánh giá văn hóa</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleTags.map((tag) => (
                  <TagReviewRow
                    key={tag.tagId}
                    tag={tag}
                    onOpenApprove={() =>
                      openApproveDialog({ type: "tag", item: tag })
                    }
                    onOpenReject={() =>
                      openRejectDialog({ type: "tag", item: tag })
                    }
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <table className="cq-admin-table">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[18%]" />
                <col className="w-[32%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead>
                <tr>
                  <th>Câu chuyện</th>
                  <th>Trạng thái</th>
                  <th>Địa điểm</th>
                  <th>Đánh giá văn hóa</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleStories.map((story) => (
                  <StoryReviewRow
                    key={story.storyId}
                    story={story}
                    hotspotName={getStoryHotspotName(story, hotspotNames)}
                    onOpenApprove={() =>
                      openApproveDialog({ type: "story", item: story })
                    }
                    onOpenReject={() =>
                      openRejectDialog({ type: "story", item: story })
                    }
                  />
                ))}
              </tbody>
            </table>
          )}

          <div className="rounded-b-[inherit] border-t border-slate-100 px-5 py-4">
            {activeTotalPages > 1 ? (
              <Pagination
                page={activeSafePage}
                totalPages={activeTotalPages}
                totalItems={activeTotalItems}
                pageSize={REVIEW_PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            ) : (
              <p className="text-xs text-slate-500">
                Hiển thị {activeVisibleCount} / {activeTotalItems}{" "}
                {getEntityLabel(activeView)} chờ duyệt
              </p>
            )}
          </div>
        </section>
      )}

      {reviewTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-2 sm:p-3">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => {
              if (submittingAction === null) {
                resetReviewDialog();
              }
            }}
            aria-label="Đóng popup"
          />

          <div
            className={cn(
              "relative z-10 flex w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.42)]",
              isApproveDialog
                ? "max-w-[23rem]"
                : "max-w-[21.5rem] max-h-[calc(100vh-0.75rem)] overflow-y-auto",
            )}
          >
            {isApproveDialog ? (
              <>
                <div className="relative overflow-hidden px-3 pb-2.5 pt-3.5 text-center sm:px-3.5 sm:pt-4">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[radial-gradient(circle_at_top,_rgba(255,125,173,0.16),_transparent_72%)]" />

                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
                    <Sparkles className="absolute left-1 top-1.5 h-2.5 w-2.5 text-[#FFC57A]" />
                    <Sparkles className="absolute right-1.5 top-0 h-2 w-2 text-[#FFA24D]" />
                    <Sparkles className="absolute bottom-2.5 right-1 h-2.5 w-2.5 text-[#FF7EB2]" />

                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(145deg,_#FFF1F7,_#FFF8EE)] shadow-[0_14px_28px_-24px_rgba(255,112,162,0.75)] ring-1 ring-[#F8DCE8]">
                      <div className="relative flex h-7.5 w-7.5 items-center justify-center rounded-[11px] border border-white/80 bg-white/90 shadow-sm">
                        <ReviewIcon className="h-3.5 w-3.5 text-[#9AA4B2]" />
                        <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#FF59A7,_#FFA235)] text-white shadow-[0_8px_18px_-12px_rgba(255,102,153,0.95)]">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                    Duyệt {reviewTargetTypeLabel}
                  </h2>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">
                    Xác nhận duyệt {reviewTargetTypeLabel}{" "}
                    <span className="font-semibold text-[#FF4F8F]">
                      {reviewTargetName}
                    </span>
                    .
                  </p>
                </div>

                <div className="border-t border-slate-100 px-3 py-2.5 sm:px-3.5">
                  <div className="space-y-2.5">
                    <div className="rounded-[16px] border border-[#FFD7C1] bg-[linear-gradient(135deg,_#FFF8F3,_#FFFDFC)] px-3 py-3 shadow-[0_14px_28px_-28px_rgba(249,115,22,0.55)]">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,_#FFE6F1,_#FFD9E9)] text-[#F04D88] shadow-inner">
                          <Sparkles className="h-3 w-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-[#EF4B79]">
                            Đánh giá văn hóa
                          </p>
                          <p className="mt-1 text-[12px] leading-5 text-slate-700">
                            {reviewCultureReason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {reviewTarget.type === "story" ? (
                      <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3 shadow-[0_14px_28px_-30px_rgba(15,23,42,0.42)]">
                        <p className="text-[12px] font-semibold text-slate-800">
                          Tóm tắt câu chuyện
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Địa điểm:{" "}
                          {getStoryHotspotName(reviewTarget.item, hotspotNames)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Thẻ: {getStoryTagName(reviewTarget.item)}
                        </p>
                        <p className="mt-2 line-clamp-4 text-[12px] leading-5 text-slate-700">
                          {reviewTarget.item.content?.trim() ||
                            "Câu chuyện không có nội dung."}
                        </p>
                      </div>
                    ) : null}

                    <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3 shadow-[0_14px_28px_-30px_rgba(15,23,42,0.42)]">
                      <p className="text-[12px] font-semibold text-slate-800">
                        Bạn có đồng ý duyệt {reviewTargetTypeLabel} này không?
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Sau khi duyệt, nội dung sẽ được đưa ra khỏi hàng đợi chờ
                        kiểm duyệt.
                      </p>
                    </div>

                    {reviewError ? (
                      <div className="rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                        {reviewError}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="relative overflow-hidden px-3 pb-2.5 pt-3.5 text-center sm:px-3.5 sm:pt-4">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[radial-gradient(circle_at_top,_rgba(255,111,145,0.14),_transparent_72%)]" />

                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
                    <Sparkles className="absolute left-1 top-1.5 h-2.5 w-2.5 text-[#FFB36A]" />
                    <Sparkles className="absolute right-1.5 top-0 h-2 w-2 text-[#FF8A6B]" />
                    <Sparkles className="absolute bottom-2.5 right-1 h-2.5 w-2.5 text-[#FF6F91]" />

                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(145deg,_#FFF2F5,_#FFF8F1)] shadow-[0_14px_28px_-24px_rgba(255,111,145,0.72)] ring-1 ring-[#F8DCE3]">
                      <div className="relative flex h-7.5 w-7.5 items-center justify-center rounded-[11px] border border-white/80 bg-white/90 shadow-sm">
                        <ReviewIcon className="h-3.5 w-3.5 text-[#9AA4B2]" />
                        <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#FF6E84,_#FF9A5C)] text-white shadow-[0_8px_18px_-12px_rgba(255,111,145,0.92)]">
                          <X className="h-2.5 w-2.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                    Từ chối {reviewTargetTypeLabel}
                  </h2>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">
                    Nhập lý do trước khi từ chối {reviewTargetTypeLabel}{" "}
                    <span className="font-semibold text-[#E5484D]">
                      {reviewTargetName}
                    </span>
                    .
                  </p>
                </div>

                <div className="px-3 pb-2.5 pt-1.5 sm:px-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    Đánh giá văn hóa
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    {reviewCultureReason}
                  </p>

                  {reviewTarget.type === "story" ? (
                    <div className="mt-3 rounded-[16px] border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[12px] font-semibold text-slate-800">
                        Nội dung câu chuyện
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Địa điểm:{" "}
                        {getStoryHotspotName(reviewTarget.item, hotspotNames)}
                      </p>
                      <p className="mt-1 line-clamp-4 text-[12px] leading-5 text-slate-600">
                        {reviewTarget.item.content?.trim() ||
                          "Câu chuyện không có nội dung."}
                      </p>
                    </div>
                  ) : null}

                  <textarea
                    id="content-reject-reason"
                    rows={4}
                    value={rejectReason}
                    onChange={(event) => {
                      setRejectReason(event.target.value);
                      if (reviewError) {
                        setReviewError(null);
                      }
                    }}
                    placeholder="Ghi chú bổ sung..."
                    disabled={submittingAction !== null}
                    className="mt-3 w-full resize-none rounded-[18px] border-0 bg-slate-100 px-4 py-3 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#FCEAF3] disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  {reviewError ? (
                    <div className="mt-2.5 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                      {reviewError}
                    </div>
                  ) : null}
                </div>
              </>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-3 py-2.5 sm:flex-row sm:justify-end sm:px-3.5">
              <button
                type="button"
                onClick={resetReviewDialog}
                disabled={submittingAction !== null}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-[12px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              {isApproveDialog ? (
                <button
                  type="button"
                  onClick={() => void handleApproveTarget()}
                  disabled={submittingAction !== null}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,_#FF5FAA,_#FFA43C)] px-3.5 text-[12px] font-semibold text-white shadow-[0_18px_28px_-22px_rgba(255,96,164,0.95)] transition hover:-translate-y-0.5 hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingAction === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Xác nhận duyệt
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleRejectTarget()}
                  disabled={submittingAction !== null}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#F5BAC1] bg-white px-3.5 text-[12px] font-semibold text-[#E5484D] transition hover:border-[#EE9CA5] hover:bg-[#FFF1F2] hover:text-[#D92D20] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingAction === "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Xác nhận từ chối
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TagReviewRow({
  tag,
  onOpenApprove,
  onOpenReject,
}: {
  tag: CuratorPendingTag;
  onOpenApprove: () => void;
  onOpenReject: () => void;
}) {
  const cultureReason = tag.cultureReason?.trim();
  const rejectReason = tag.rejectReason?.trim();

  return (
    <tr>
      <td className="align-middle">
        <div className="flex justify-center">
          {tag.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tag.imageUrl}
              alt={tag.tagName}
              className="h-11 w-11 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_#FFF1F7,_#FFF7ED)] text-xs font-semibold text-slate-700 ring-1 ring-[#F7DCE8]">
              {getTagInitials(tag.tagName)}
            </div>
          )}
        </div>
      </td>

      <td className="align-middle">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-800">
            {tag.tagName}
          </p>
        </div>
      </td>

      <td className="align-middle">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
            getTagStatusTone(tag.tagStatus),
          )}
        >
          {formatTagStatus(tag.tagStatus)}
        </span>
      </td>

      <td className="align-middle">
        <div className="space-y-2">
          <p className="line-clamp-3 text-sm leading-6 text-slate-700">
            {cultureReason ||
              "Backend chưa trả về lý do đánh giá văn hóa cho thẻ này."}
          </p>
          {rejectReason ? (
            <p className="line-clamp-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              Từ chối gần nhất: {rejectReason}
            </p>
          ) : null}
        </div>
      </td>

      <td className="align-middle">
        <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
          <Link
            href={`/admin/review-queue/tags/${tag.tagId}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Xem chi tiết ${tag.tagName}`}
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onOpenApprove}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-transparent bg-transparent px-2.5 text-[11px] font-medium text-[#12B76A] transition hover:border-emerald-100 hover:bg-emerald-50 hover:text-[#039855]"
          >
            <Check className="h-4 w-4" />
            Duyệt
          </button>
          <button
            type="button"
            onClick={onOpenReject}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-transparent bg-transparent px-2.5 text-[11px] font-medium text-[#FF4D4F] transition hover:border-[#FBE6E8] hover:bg-[#FFF3F5] hover:text-[#E53935]"
          >
            <X className="h-4 w-4" />
            Từ chối
          </button>
        </div>
      </td>
    </tr>
  );
}

function StoryReviewRow({
  story,
  hotspotName,
  onOpenApprove,
  onOpenReject,
}: {
  story: CuratorPendingStory;
  hotspotName: string;
  onOpenApprove: () => void;
  onOpenReject: () => void;
}) {
  const cultureReason = story.cultureReason?.trim();
  const rejectReason = story.rejectReason?.trim();

  return (
    <tr>
      <td className="align-middle">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-800">
            {story.title || "Câu chuyện chưa có tiêu đề"}
          </p>
        </div>
      </td>

      <td className="align-middle">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
            getStoryStatusTone(story.status),
          )}
        >
          {formatStoryStatus(story.status)}
        </span>
      </td>

      <td className="align-middle text-sm leading-6 text-slate-700">
        <div className="line-clamp-2">{hotspotName}</div>
      </td>

      <td className="align-middle">
        <div className="space-y-2">
          <p className="line-clamp-3 text-sm leading-6 text-slate-700">
            {cultureReason ||
              "Backend chưa trả về lý do đánh giá văn hóa cho câu chuyện này."}
          </p>
          {rejectReason ? (
            <p className="line-clamp-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              Từ chối gần nhất: {rejectReason}
            </p>
          ) : null}
        </div>
      </td>

      <td className="align-middle">
        <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
          <Link
            href={`/admin/review-queue/stories/${story.storyId}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Xem chi tiết ${story.title}`}
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onOpenApprove}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-transparent bg-transparent px-2.5 text-[11px] font-medium text-[#12B76A] transition hover:border-emerald-100 hover:bg-emerald-50 hover:text-[#039855]"
          >
            <Check className="h-4 w-4" />
            Duyệt
          </button>
          <button
            type="button"
            onClick={onOpenReject}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-transparent bg-transparent px-2.5 text-[11px] font-medium text-[#FF4D4F] transition hover:border-[#FBE6E8] hover:bg-[#FFF3F5] hover:text-[#E53935]"
          >
            <X className="h-4 w-4" />
            Từ chối
          </button>
        </div>
      </td>
    </tr>
  );
}
