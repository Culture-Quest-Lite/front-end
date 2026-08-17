"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import {
  adminApi,
  type PostItem,
  type PostReportItem,
  type ReviewItem,
  type ReviewReportItem,
} from "@/services/api/admin/adminApi";
import {
  AlertTriangle,
  Loader2,
  Check,
  X,
  Eye,
  Flag,
  Repeat2,
  Star,
  User as UserIcon,
} from "lucide-react";

const postStatusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  REPORTING: "Đang bị báo cáo",
  REPORTED: "Đã gỡ do báo cáo",
  DELETED: "Đã xoá",
};

const postVisibilityLabels: Record<string, string> = {
  PUBLIC: "Công khai",
  PRIVATE: "Riêng tư",
  FRIENDS: "Bạn bè",
};

const postStatusClasses: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  REPORTING: "bg-orange-100 text-orange-700 border-orange-200",
  REPORTED: "bg-rose-100 text-rose-700 border-rose-200",
  DELETED: "bg-slate-100 text-slate-500 border-slate-200",
};

const reviewStatusLabels: Record<string, string> = {
  ACTIVE: "Đang hiển thị",
  HIDDEN: "Đã ẩn",
  DELETED: "Đã xoá",
  REPORTING: "Đang bị báo cáo",
  REPORTED: "Đã gỡ do báo cáo",
};

const reviewStatusClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  HIDDEN: "bg-slate-100 text-slate-500 border-slate-200",
  DELETED: "bg-slate-100 text-slate-500 border-slate-200",
  REPORTING: "bg-orange-100 text-orange-700 border-orange-200",
  REPORTED: "bg-rose-100 text-rose-700 border-rose-200",
};

const reviewTargetLabels: Record<string, string> = {
  HOTSPOT: "Địa điểm",
  ROUTE: "Tuyến",
  STORY: "Câu chuyện",
};

/** Các báo cáo chưa xử lý của cùng một bài viết, kèm bài viết đã tải được. */
type ReportGroup = {
  postId: number;
  reports: PostReportItem[];
  post: PostItem | null;
};

/** Các báo cáo chưa xử lý của cùng một đánh giá, kèm đánh giá đã tải được. */
type ReviewReportGroup = {
  reviewId: number;
  reports: ReviewReportItem[];
  review: ReviewItem | null;
};

type ModerationTab = "posts" | "reviews";

function groupReportsByPost(reports: PostReportItem[]): ReportGroup[] {
  const byPost = new Map<number, PostReportItem[]>();

  for (const report of reports) {
    const current = byPost.get(report.postId);
    if (current) current.push(report);
    else byPost.set(report.postId, [report]);
  }

  return [...byPost.entries()]
    .map(([postId, items]) => ({ postId, reports: items, post: null }))
    .sort((a, b) => b.postId - a.postId);
}

function groupReportsByReview(reports: ReviewReportItem[]): ReviewReportGroup[] {
  const byReview = new Map<number, ReviewReportItem[]>();

  for (const report of reports) {
    const current = byReview.get(report.reviewId);
    if (current) current.push(report);
    else byReview.set(report.reviewId, [report]);
  }

  return [...byReview.entries()]
    .map(([reviewId, items]) => ({ reviewId, reports: items, review: null }))
    .sort((a, b) => b.reviewId - a.reviewId);
}

function describeError(err: unknown, fallback: string) {
  const status = (err as { status?: number } | null)?.status;
  return [
    status ? `HTTP ${status}` : null,
    err instanceof Error ? err.message : fallback,
  ]
    .filter(Boolean)
    .join(" — ");
}

export default function ModerationPage() {
  const [tab, setTab] = useState<ModerationTab>("posts");

  const [reportGroups, setReportGroups] = useState<ReportGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [reviewGroups, setReviewGroups] = useState<ReviewReportGroup[]>([]);
  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [reviewLoadError, setReviewLoadError] = useState<string | null>(null);

  const [actionId, setActionId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [detailPost, setDetailPost] = useState<PostItem | null>(null);
  const [detailReview, setDetailReview] = useState<ReviewItem | null>(null);
  const [handleTarget, setHandleTarget] = useState<
    { group: ReportGroup; isApprove: boolean } | null
  >(null);
  const [reviewHandleTarget, setReviewHandleTarget] = useState<
    { group: ReviewReportGroup; isApprove: boolean } | null
  >(null);
  const [handleReason, setHandleReason] = useState("");

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const reports = await adminApi.getPostReports();

      // Backend trả List phẳng; nếu nhận về thứ khác (HTML lỗi, object bọc...)
      // thì báo rõ thay vì để `for...of` ném lỗi khó hiểu.
      if (!Array.isArray(reports)) {
        throw new Error(
          `API /api/posts/reports trả về dữ liệu không phải danh sách: ${JSON.stringify(reports).slice(0, 200)}`,
        );
      }

      const groups = groupReportsByPost(reports);

      // Nội dung bài viết không nằm trong ReportPostResponse, phải lấy thêm
      // qua GET /api/posts/{id}. Bài đã bị xoá cứng sẽ lỗi -> để post = null.
      const details = await Promise.allSettled(
        groups.map((group) => adminApi.getPostById(group.postId)),
      );

      setReportGroups(
        groups.map((group, index) => {
          const detail = details[index];
          return {
            ...group,
            post: detail.status === "fulfilled" ? detail.value : null,
          };
        }),
      );
    } catch (err) {
      setReportGroups([]);
      setLoadError(describeError(err, "Không thể tải danh sách báo cáo."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadReviewReports = useCallback(async () => {
    setIsReviewLoading(true);
    setReviewLoadError(null);
    try {
      const reports = await adminApi.getReviewReports();

      if (!Array.isArray(reports)) {
        throw new Error(
          `API /api/reviews/report trả về dữ liệu không phải danh sách: ${JSON.stringify(reports).slice(0, 200)}`,
        );
      }

      const groups = groupReportsByReview(reports);

      // ReportReviewResponse không kèm nội dung đánh giá, phải lấy thêm qua
      // GET /api/reviews/{id}. Đánh giá đã bị xoá cứng sẽ lỗi -> review = null.
      const details = await Promise.allSettled(
        groups.map((group) => adminApi.getReviewById(group.reviewId)),
      );

      setReviewGroups(
        groups.map((group, index) => {
          const detail = details[index];
          return {
            ...group,
            review: detail.status === "fulfilled" ? detail.value : null,
          };
        }),
      );
    } catch (err) {
      setReviewGroups([]);
      setReviewLoadError(
        describeError(err, "Không thể tải danh sách báo cáo đánh giá."),
      );
    } finally {
      setIsReviewLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
    void loadReviewReports();
  }, [loadReports, loadReviewReports]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openHandleDialog(group: ReportGroup, isApprove: boolean) {
    setDetailPost(null);
    setHandleTarget({ group, isApprove });
    setHandleReason("");
  }

  function openReviewHandleDialog(group: ReviewReportGroup, isApprove: boolean) {
    setDetailReview(null);
    setReviewHandleTarget({ group, isApprove });
    setHandleReason("");
  }

  async function handleConfirmReport() {
    if (!handleTarget) return;
    const { group, isApprove } = handleTarget;
    const reason = handleReason.trim();

    if (!reason) {
      showToast("Bạn cần nhập lý do xử lý báo cáo.");
      return;
    }

    setActionId(group.postId);
    try {
      await adminApi.handlePostReport(group.postId, {
        postActionIds: group.reports.map((report) => report.postActionId),
        isApproveReport: isApprove,
        reason,
      });
      setReportGroups((prev) => prev.filter((item) => item.postId !== group.postId));
      setHandleTarget(null);
      setHandleReason("");
      showToast(isApprove ? "Đã chấp nhận báo cáo và gỡ bài." : "Đã bác bỏ báo cáo.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xử lý báo cáo.");
    } finally {
      setActionId(null);
    }
  }

  async function handleConfirmReviewReport() {
    if (!reviewHandleTarget) return;
    const { group, isApprove } = reviewHandleTarget;
    const reason = handleReason.trim();

    if (!reason) {
      showToast("Bạn cần nhập lý do xử lý báo cáo.");
      return;
    }

    setActionId(group.reviewId);
    try {
      await adminApi.handleReviewReport(group.reviewId, {
        reviewActionIds: group.reports.map((report) => report.reviewActionId),
        isApproveReport: isApprove,
        reason,
      });
      setReviewGroups((prev) =>
        prev.filter((item) => item.reviewId !== group.reviewId),
      );
      setReviewHandleTarget(null);
      setHandleReason("");
      showToast(
        isApprove ? "Đã chấp nhận báo cáo và gỡ đánh giá." : "Đã bác bỏ báo cáo.",
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xử lý báo cáo.");
    } finally {
      setActionId(null);
    }
  }

  const isPostsTab = tab === "posts";

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Xử lý báo cáo nội dung"
        subtitle="Xem và xử lý các báo cáo bài viết, đánh giá do người dùng gửi lên."
      />

      <div className="flex flex-wrap items-center gap-2">
        <TabButton
          active={isPostsTab}
          count={reportGroups.length}
          onClick={() => setTab("posts")}
        >
          Bài đăng
        </TabButton>
        <TabButton
          active={!isPostsTab}
          count={reviewGroups.length}
          onClick={() => setTab("reviews")}
        >
          Đánh giá
        </TabButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {isPostsTab
            ? "Báo cáo chưa xử lý, gộp theo bài viết. Xử lý một lần sẽ đánh dấu tất cả báo cáo của bài đó là đã giải quyết."
            : "Báo cáo chưa xử lý, gộp theo đánh giá. Xử lý một lần sẽ đánh dấu tất cả báo cáo của đánh giá đó là đã giải quyết."}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void (isPostsTab ? loadReports() : loadReviewReports())}
        >
          {(isPostsTab ? isLoading : isReviewLoading) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Làm mới"
          )}
        </Button>
      </div>

      {(isPostsTab ? loadError : reviewLoadError) ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {isPostsTab ? loadError : reviewLoadError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <ul className="space-y-3">
          {isPostsTab ? (
            isLoading ? (
              <li className="rounded-2xl border border-slate-200 bg-white p-8">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
              </li>
            ) : reportGroups.length === 0 ? (
              <li className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground">
                Không có báo cáo nào đang chờ xử lý.
              </li>
            ) : (
              reportGroups.map((group) => (
                <ReportRow
                  key={group.postId}
                  group={group}
                  actionLoading={actionId === group.postId}
                  onView={() => (group.post ? setDetailPost(group.post) : undefined)}
                  onApproveReport={() => openHandleDialog(group, true)}
                  onRejectReport={() => openHandleDialog(group, false)}
                />
              ))
            )
          ) : isReviewLoading ? (
            <li className="rounded-2xl border border-slate-200 bg-white p-8">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
            </li>
          ) : reviewGroups.length === 0 ? (
            <li className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground">
              Không có báo cáo đánh giá nào đang chờ xử lý.
            </li>
          ) : (
            reviewGroups.map((group) => (
              <ReviewReportRow
                key={group.reviewId}
                group={group}
                actionLoading={actionId === group.reviewId}
                onView={() =>
                  group.review ? setDetailReview(group.review) : undefined
                }
                onApproveReport={() => openReviewHandleDialog(group, true)}
                onRejectReport={() => openReviewHandleDialog(group, false)}
              />
            ))
          )}
        </ul>
      </div>

      {detailPost ? (
        <PostDetailModal post={detailPost} onClose={() => setDetailPost(null)} />
      ) : null}

      {detailReview ? (
        <ReviewDetailModal
          review={detailReview}
          onClose={() => setDetailReview(null)}
        />
      ) : null}

      {handleTarget ? (
        <ReasonDialog
          title={
            handleTarget.isApprove
              ? "Chấp nhận báo cáo và gỡ bài"
              : "Bác bỏ báo cáo, giữ lại bài"
          }
          description={
            handleTarget.group.post?.content ??
            "Không tải được nội dung bài viết (bài có thể đã bị xoá)."
          }
          label="Lý do xử lý (bắt buộc)"
          placeholder={
            handleTarget.isApprove
              ? "Nội dung vi phạm tiêu chuẩn cộng đồng"
              : "Nội dung không vi phạm, báo cáo không hợp lệ"
          }
          value={handleReason}
          onChange={setHandleReason}
          confirmLabel={handleTarget.isApprove ? "Gỡ bài viết" : "Giữ lại bài viết"}
          confirmClassName={
            handleTarget.isApprove
              ? "bg-red-600 hover:bg-red-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          }
          isSubmitting={actionId === handleTarget.group.postId}
          onCancel={() => setHandleTarget(null)}
          onConfirm={() => void handleConfirmReport()}
        />
      ) : null}

      {reviewHandleTarget ? (
        <ReasonDialog
          title={
            reviewHandleTarget.isApprove
              ? "Chấp nhận báo cáo và gỡ đánh giá"
              : "Bác bỏ báo cáo, giữ lại đánh giá"
          }
          description={
            reviewHandleTarget.group.review?.comment ??
            "Không tải được nội dung đánh giá (đánh giá có thể đã bị xoá)."
          }
          label="Lý do xử lý (bắt buộc)"
          placeholder={
            reviewHandleTarget.isApprove
              ? "Đánh giá vi phạm tiêu chuẩn cộng đồng"
              : "Đánh giá không vi phạm, báo cáo không hợp lệ"
          }
          value={handleReason}
          onChange={setHandleReason}
          confirmLabel={
            reviewHandleTarget.isApprove ? "Gỡ đánh giá" : "Giữ lại đánh giá"
          }
          confirmClassName={
            reviewHandleTarget.isApprove
              ? "bg-red-600 hover:bg-red-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          }
          isSubmitting={actionId === reviewHandleTarget.group.reviewId}
          onCancel={() => setReviewHandleTarget(null)}
          onConfirm={() => void handleConfirmReviewReport()}
        />
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
      <span
        className={`rounded-full px-1.5 text-xs ${
          active ? "bg-white/20" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
        postStatusClasses[status] ?? "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {postStatusLabels[status] ?? status}
    </span>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
        reviewStatusClasses[status] ?? "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {reviewStatusLabels[status] ?? status}
    </span>
  );
}

function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return null;

  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index < rating ? "fill-amber-400" : "text-slate-300"}`}
        />
      ))}
    </span>
  );
}

function ReportRow({
  group,
  actionLoading,
  onView,
  onApproveReport,
  onRejectReport,
}: {
  group: ReportGroup;
  actionLoading: boolean;
  onView: () => void;
  onApproveReport: () => void;
  onRejectReport: () => void;
}) {
  const { post, reports } = group;

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-slate-900">
                {post?.content ?? "Không tải được nội dung bài viết"}
              </span>
              {post ? <StatusBadge status={post.status} /> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {post ? `Tác giả: ${post.displayName || post.username}` : "Bài viết có thể đã bị xoá"}
              {" · "}
              <span className="font-semibold text-red-600">{reports.length} báo cáo</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {post ? (
              <Button size="sm" variant="outline" className="gap-1.5" type="button" onClick={onView}>
                <Eye className="h-4 w-4" /> Xem bài
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              type="button"
              disabled={actionLoading}
              onClick={onApproveReport}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              Chấp nhận báo cáo
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              type="button"
              disabled={actionLoading}
              onClick={onRejectReport}
            >
              <Check className="h-4 w-4" /> Bác bỏ
            </Button>
          </div>
        </div>

        <ul className="space-y-1.5 rounded-xl bg-slate-50 p-3">
          {reports.map((report) => (
            <li key={report.postActionId} className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{report.createdDisplayName}</span>
              {" · "}
              <span className="text-slate-400">
                {new Date(report.createdAt).toLocaleString("vi-VN")}
              </span>
              <p className="mt-0.5 text-slate-700">{report.comment}</p>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function ReviewReportRow({
  group,
  actionLoading,
  onView,
  onApproveReport,
  onRejectReport,
}: {
  group: ReviewReportGroup;
  actionLoading: boolean;
  onView: () => void;
  onApproveReport: () => void;
  onRejectReport: () => void;
}) {
  const { review, reports } = group;

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-slate-900">
                {review?.comment ?? "Không tải được nội dung đánh giá"}
              </span>
              {review ? <ReviewStatusBadge status={review.status} /> : null}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {review
                ? `Tác giả: ${review.displayName || review.username}`
                : "Đánh giá có thể đã bị xoá"}
              {review?.rating ? <RatingStars rating={review.rating} /> : null}
              {" · "}
              <span className="font-semibold text-red-600">{reports.length} báo cáo</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {review ? (
              <Button size="sm" variant="outline" className="gap-1.5" type="button" onClick={onView}>
                <Eye className="h-4 w-4" /> Xem đánh giá
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              type="button"
              disabled={actionLoading}
              onClick={onApproveReport}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              Chấp nhận báo cáo
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              type="button"
              disabled={actionLoading}
              onClick={onRejectReport}
            >
              <Check className="h-4 w-4" /> Bác bỏ
            </Button>
          </div>
        </div>

        <ul className="space-y-1.5 rounded-xl bg-slate-50 p-3">
          {reports.map((report) => (
            <li key={report.reviewActionId} className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{report.createdDisplayName}</span>
              {" · "}
              <span className="text-slate-400">
                {new Date(report.createdAt).toLocaleString("vi-VN")}
              </span>
              <p className="mt-0.5 text-slate-700">{report.comment}</p>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Chỉ để xem nội dung bài bị báo cáo — hành động nằm ở nút xử lý báo cáo. */
function PostDetailModal({ post, onClose }: { post: PostItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 p-6">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Chi tiết bài bị báo cáo</h2>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
              <UserIcon className="h-3.5 w-3.5 shrink-0" />
              {post.displayName || post.username} (@{post.username})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {post.medias && post.medias.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 bg-slate-100">
              {post.medias.map((media) => (
                <img
                  key={media.mediaId}
                  src={media.fileUrl}
                  alt={media.fileName ?? "Ảnh bài đăng"}
                  className="max-h-64 w-full object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="space-y-4 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Nội dung
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{post.content}</p>
            </div>

            {/* Bài chia sẻ lại: nội dung gốc nằm ở sharedPost, cần xem để kiểm duyệt đúng. */}
            {post.sharedPost ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                  <Repeat2 className="h-3.5 w-3.5" /> Bài gốc được chia sẻ lại
                </p>
                <p className="mt-1 text-xs text-sky-800">
                  Tác giả bài gốc:{" "}
                  {post.sharedPost.displayName || post.sharedPost.username}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {post.sharedPost.content}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={post.status} />
              {post.visibility ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {postVisibilityLabels[post.visibility] ?? post.visibility}
                </span>
              ) : null}
              {post.createdAt ? (
                <span className="text-xs text-slate-400">
                  Đăng lúc {new Date(post.createdAt).toLocaleString("vi-VN")}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span>{post.likeCount ?? 0} thích</span>
              <span>{post.commentCount ?? 0} bình luận</span>
              <span>{post.shareCount ?? 0} chia sẻ</span>
            </div>

            {post.reason ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> Lý do xử lý gần nhất
                </p>
                <p className="mt-1 text-sm text-amber-800">{post.reason}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Chỉ để xem nội dung đánh giá bị báo cáo — hành động nằm ở nút xử lý báo cáo. */
function ReviewDetailModal({
  review,
  onClose,
}: {
  review: ReviewItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 p-6">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">
              Chi tiết đánh giá bị báo cáo
            </h2>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
              <UserIcon className="h-3.5 w-3.5 shrink-0" />
              {review.displayName || review.username} (@{review.username})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {review.medias && review.medias.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 bg-slate-100">
              {review.medias.map((media) => (
                <img
                  key={media.mediaId}
                  src={media.fileUrl}
                  alt={media.fileName ?? "Ảnh đánh giá"}
                  className="max-h-64 w-full object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <RatingStars rating={review.rating} />
              {review.rating ? (
                <span className="text-sm font-semibold text-slate-700">
                  {review.rating}/5
                </span>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Nội dung
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                {review.comment}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ReviewStatusBadge status={review.status} />
              {review.targetType ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {reviewTargetLabels[review.targetType] ?? review.targetType}
                  {review.targetId ? ` #${review.targetId}` : ""}
                </span>
              ) : null}
              {review.createdAt ? (
                <span className="text-xs text-slate-400">
                  Đăng lúc {new Date(review.createdAt).toLocaleString("vi-VN")}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span>{review.likeCount ?? 0} thích</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReasonDialog({
  title,
  description,
  label,
  placeholder,
  value,
  onChange,
  confirmLabel,
  confirmClassName,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  confirmLabel: string;
  confirmClassName: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 line-clamp-3 text-sm text-slate-500">{description}</p>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={5}
              placeholder={placeholder}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 p-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${confirmClassName}`}
          >
            {isSubmitting ? "Đang gửi..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
