"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageLoading } from "@/components/app/page-loading";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/ui-bits";
import { adminApi, type PostItem } from "@/services/api/admin/adminApi";
import { hotspotApi } from "@/services/api/hotspotApi";
import { routeApi } from "@/services/api/routeApi";
import {
  AlertTriangle,
  Check,
  Clock,
  Eye,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";

type PostStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

type OpenDialog =
  | { type: "detail"; itemId: number }
  | { type: "approve"; itemId: number }
  | { type: "reject"; itemId: number }
  | null;

/** Tên địa điểm/tuyến tra được theo id, dùng để không phải hiển thị id trần. */
type NameMap = Record<number, string>;

const postStatusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
};

const postStatusClasses: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const filterOptions: { value: PostStatusFilter; label: string }[] = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Bị từ chối" },
  { value: "ALL", label: "Tất cả" },
];

const rejectReasons = [
  "Nội dung không phù hợp với tiêu chuẩn cộng đồng",
  "Bài viết có ngôn từ xúc phạm hoặc gây tranh cãi",
  "Thông tin sai lệch hoặc gây hiểu nhầm",
  "Nội dung spam / quảng cáo không được phép",
  "Hình ảnh hoặc nội dung vi phạm chính sách",
  "Khác",
];

function getAuthorName(post: PostItem) {
  return post.displayName || post.username || "Người dùng không xác định";
}

/**
 * Ảnh của bài viết nằm trong `medias[].fileUrl` (khớp `MediaResponse.java`),
 * backend không trả về `imageUrl`/`mediaUrls`.
 */
function getPostImages(post: PostItem) {
  return (post.medias ?? [])
    .filter((media) => !!media.fileUrl)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

function getPostStatusLabel(status: string) {
  return postStatusLabels[status] ?? status;
}

function getPostStatusClass(status: string) {
  return postStatusClasses[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
}

function getCreatedText(createdAt?: string) {
  if (!createdAt) return "Không rõ thời gian";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Không rõ thời gian";
  return date.toLocaleString("vi-VN");
}

function getPostTags(post: PostItem) {
  return (post.tags ?? [])
    .map((tag) => tag.tagName?.trim())
    .filter((name): name is string => !!name);
}

/** Đổi danh sách id sang tên; id nào chưa tra được thì bỏ qua thay vì hiện số. */
function toNameList(ids: number[] | undefined, names: NameMap) {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => names[id]).filter((name): name is string => !!name);
}

function joinLabels(labels: string[], hasIds: boolean) {
  if (labels.length > 0) return labels.join(", ");
  return hasIds ? "—" : "Không có";
}

export default function ContentReviewPage() {
  const [items, setItems] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>("PENDING");
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [hotspotNames, setHotspotNames] = useState<NameMap>({});
  const [routeNames, setRouteNames] = useState<NameMap>({});

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPosts({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page: 0,
        size: 50,
      });

      setItems(response.content.filter((post) => post.status !== "DELETED"));
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error ? err.message : "Không thể tải hàng đợi duyệt bài đăng.",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  // Bài viết chỉ mang hotspotIds/routeIds, phải tra thêm để hiện tên cho admin.
  useEffect(() => {
    const hotspotIds = [
      ...new Set(items.flatMap((post) => post.hotspotIds ?? [])),
    ].filter((id) => hotspotNames[id] === undefined);
    const routeIds = [
      ...new Set(items.flatMap((post) => post.routeIds ?? [])),
    ].filter((id) => routeNames[id] === undefined);

    if (hotspotIds.length === 0 && routeIds.length === 0) return;

    let cancelled = false;

    async function resolveNames() {
      const [hotspots, routes] = await Promise.all([
        Promise.allSettled(hotspotIds.map((id) => hotspotApi.getHotspotById(id))),
        Promise.allSettled(routeIds.map((id) => routeApi.getRouteById(id))),
      ]);

      if (cancelled) return;

      if (hotspotIds.length > 0) {
        setHotspotNames((prev) => {
          const next = { ...prev };
          hotspotIds.forEach((id, index) => {
            const result = hotspots[index];
            next[id] =
              result.status === "fulfilled"
                ? (result.value.hotspotName?.trim() || "Địa điểm không có tên")
                : "Địa điểm không còn tồn tại";
          });
          return next;
        });
      }

      if (routeIds.length > 0) {
        setRouteNames((prev) => {
          const next = { ...prev };
          routeIds.forEach((id, index) => {
            const result = routes[index];
            next[id] =
              result.status === "fulfilled"
                ? (result.value.routeName?.trim() || "Tuyến không có tên")
                : "Tuyến không còn tồn tại";
          });
          return next;
        });
      }
    }

    void resolveNames();
    return () => {
      cancelled = true;
    };
  }, [items, hotspotNames, routeNames]);

  const filtered = useMemo(() => {
    const visibleItems = items.filter((item) => item.status !== "DELETED");
    if (statusFilter === "ALL") return visibleItems;
    return visibleItems.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING").length,
    [items],
  );

  const selectedItem = dialog ? items.find((item) => item.postId === dialog.itemId) : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove(post: PostItem) {
    setSubmittingId(post.postId);
    try {
      await adminApi.approvePost(post.postId);
      setItems((prev) =>
        statusFilter === "PENDING"
          ? prev.filter((item) => item.postId !== post.postId)
          : prev.map((item) =>
              item.postId === post.postId ? { ...item, status: "APPROVED" } : item,
            ),
      );
      setDialog(null);
      showToast("Đã duyệt bài đăng.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể duyệt bài đăng.");
    } finally {
      setSubmittingId(null);
    }
  }

  function openRejectDialog(post: PostItem) {
    setRejectReason("");
    setDialog({ type: "reject", itemId: post.postId });
  }

  async function handleReject(post: PostItem) {
    const reason = rejectReason.trim() || "Không phù hợp với tiêu chuẩn nội dung";

    setSubmittingId(post.postId);
    try {
      await adminApi.rejectPost(post.postId, reason);
      setItems((prev) =>
        statusFilter === "PENDING"
          ? prev.filter((item) => item.postId !== post.postId)
          : prev.map((item) =>
              item.postId === post.postId ? { ...item, status: "REJECTED", reason } : item,
            ),
      );
      setDialog(null);
      setRejectReason("");
      showToast("Đã từ chối bài đăng.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể từ chối bài đăng.");
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleDelete(post: PostItem) {
    setSubmittingId(post.postId);
    try {
      await adminApi.banPost(post.postId, "Đã xoá bởi admin qua kiểm duyệt nội dung");
      setItems((prev) => prev.filter((item) => item.postId !== post.postId));
      setDialog(null);
      showToast("Đã xoá bài đăng.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xoá bài đăng.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-5 py-5">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Duyệt bài đăng"
        subtitle="Xem chi tiết, duyệt, từ chối hoặc xoá bài đăng do người dùng gửi lên."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{pendingCount} chờ duyệt</span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void loadPosts()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Làm mới
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {filterOptions.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setStatusFilter(item.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === item.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <PageLoading className="min-h-[320px]" />
      ) : filtered.length === 0 ? (
        <div className="cq-admin-panel p-12 text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">Không có bài đăng phù hợp</p>
          <p className="mt-1 text-xs text-slate-400">Tất cả bài đăng trong bộ lọc này đã được xử lý.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((post) => (
            <PostReviewCard
              key={post.postId}
              post={post}
              submitting={submittingId === post.postId}
              onView={() => setDialog({ type: "detail", itemId: post.postId })}
              onApprove={() => setDialog({ type: "approve", itemId: post.postId })}
              onReject={() => openRejectDialog(post)}
              onDelete={() => void handleDelete(post)}
            />
          ))}
        </div>
      )}

      {selectedItem ? (
        <PostReviewModal
          open
          type={dialog?.type ?? "detail"}
          post={selectedItem}
          hotspotNames={hotspotNames}
          routeNames={routeNames}
          reason={rejectReason}
          submitting={submittingId === selectedItem.postId}
          onReasonChange={setRejectReason}
          onClose={() => {
            setDialog(null);
            setRejectReason("");
          }}
          onApprove={() => void handleApprove(selectedItem)}
          onOpenReject={() => openRejectDialog(selectedItem)}
          onReject={() => void handleReject(selectedItem)}
          onDelete={() => void handleDelete(selectedItem)}
        />
      ) : null}
    </div>
  );
}

function PostReviewCard({
  post,
  submitting,
  onView,
  onApprove,
  onReject,
  onDelete,
}: {
  post: PostItem;
  submitting: boolean;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const images = getPostImages(post);
  const isPending = post.status === "PENDING";
  const tags = getPostTags(post);

  return (
    <div className="cq-admin-panel transition-all duration-200 hover:shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
      <button type="button" onClick={onView} className="block w-full text-left">
        <div className="flex gap-3.5 p-4">
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0].fileUrl}
              alt={images[0].fileName ?? "Ảnh bài đăng"}
              className="h-20 w-20 flex-none rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 flex-none place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <MessageSquare className="h-7 w-7" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Bài đăng</span>
              <Clock className="h-3 w-3" />
              <span>Gửi lúc {getCreatedText(post.createdAt)}</span>
            </div>

            <div className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-50">
              {post.content || "Bài đăng không có nội dung"}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <div className="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                {getAuthorName(post).charAt(0).toUpperCase()}
              </div>

              <span className="text-xs text-slate-700 dark:text-slate-300">
                {getAuthorName(post)}
              </span>

              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPostStatusClass(
                  post.status,
                )}`}
              >
                {getPostStatusLabel(post.status)}
              </span>
            </div>

            {tags.length > 0 ? (
              <p className="mt-2 line-clamp-1 text-xs text-blue-600">
                {tags.map((tag) => `#${tag}`).join(" ")}
              </p>
            ) : null}

            {post.reason ? (
              <p className="mt-2 line-clamp-1 text-xs text-amber-700">Lý do: {post.reason}</p>
            ) : null}
          </div>
        </div>
      </button>

      <div className="mx-4 h-px bg-slate-100 dark:bg-zinc-800/70" />

      <div className="grid grid-cols-4 px-2 py-1.5">
        <button
          type="button"
          disabled={submitting}
          onClick={onView}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Xem
        </button>

        <button
          type="button"
          disabled={submitting || !isPending}
          onClick={onReject}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
          Từ chối
        </button>

        <button
          type="button"
          disabled={submitting || !isPending}
          onClick={onApprove}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Duyệt
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Xoá
        </button>
      </div>
    </div>
  );
}

function PostReviewModal({
  open,
  type,
  post,
  hotspotNames,
  routeNames,
  reason,
  submitting,
  onReasonChange,
  onClose,
  onApprove,
  onOpenReject,
  onReject,
  onDelete,
}: {
  open: boolean;
  type: "detail" | "approve" | "reject";
  post: PostItem;
  hotspotNames: NameMap;
  routeNames: NameMap;
  reason: string;
  submitting: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onOpenReject: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  if (!open) return null;

  const title =
    type === "approve"
      ? "Xem trước & duyệt bài đăng"
      : type === "reject"
        ? `Từ chối bài đăng của ${getAuthorName(post)}`
        : "Chi tiết bài đăng";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {type === "reject" ? (
        <RejectPreview post={post} reason={reason} onReasonChange={onReasonChange} />
      ) : (
        <PostDetailPreview post={post} hotspotNames={hotspotNames} routeNames={routeNames} />
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Huỷ
        </Button>

        {type !== "reject" ? (
          <>
            {post.status === "PENDING" ? (
              <>
                <Button
                  disabled={submitting}
                  onClick={onApprove}
                  className="gap-1.5 border-transparent bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Phê duyệt
                </Button>
                <Button variant="outline" disabled={submitting} onClick={onOpenReject} className="gap-1.5">
                  <X className="h-4 w-4" /> Từ chối
                </Button>
              </>
            ) : null}
            <Button variant="destructive" disabled={submitting} onClick={onDelete} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Xoá
            </Button>
          </>
        ) : (
          <Button
            disabled={submitting}
            onClick={onReject}
            className="gap-1.5 border-transparent bg-red-600 text-white hover:bg-red-700"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Gửi từ chối
          </Button>
        )}
      </div>
    </Modal>
  );
}

function PostDetailPreview({
  post,
  hotspotNames,
  routeNames,
}: {
  post: PostItem;
  hotspotNames: NameMap;
  routeNames: NameMap;
}) {
  const images = getPostImages(post);
  const tags = getPostTags(post);
  const hotspots = toNameList(post.hotspotIds, hotspotNames);
  const routes = toNameList(post.routeIds, routeNames);

  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      {images.length > 0 ? (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {images.map((media) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={media.mediaId}
              src={media.fileUrl}
              alt={media.fileName ?? "Ảnh bài đăng"}
              className="max-h-64 w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <UserIcon className="h-3.5 w-3.5" />
        <span>{getAuthorName(post)}</span>
        {post.username ? <span>@{post.username}</span> : null}
        <Clock className="h-3.5 w-3.5" />
        <span>{getCreatedText(post.createdAt)}</span>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nội dung bài đăng</p>
        <p className="mt-1.5 whitespace-pre-wrap leading-6">{post.content || "Không có nội dung."}</p>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <Info label="Người đăng" value={getAuthorName(post)} />
        <Info label="Trạng thái" value={getPostStatusLabel(post.status)} />
        <Info
          label="Địa điểm liên quan"
          value={joinLabels(hotspots, (post.hotspotIds?.length ?? 0) > 0)}
        />
        <Info
          label="Tuyến liên quan"
          value={joinLabels(routes, (post.routeIds?.length ?? 0) > 0)}
        />
      </div>

      {tags.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hashtag</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {post.reason ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" /> Lý do báo cáo / từ chối
          </p>
          <p className="mt-1 text-sm text-amber-800">{post.reason}</p>
        </div>
      ) : null}
    </div>
  );
}

function RejectPreview({
  post,
  reason,
  onReasonChange,
}: {
  post: PostItem;
  reason: string;
  onReasonChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <div className="rounded-2xl bg-surface px-3 py-3">
        <div className="text-[10px] text-muted-foreground">Nội dung bài đăng</div>
        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm">{post.content || "Không có nội dung."}</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Chọn hoặc nhập lý do từ chối. Lý do này sẽ được gửi kèm khi từ chối bài đăng.
      </p>

      <div className="space-y-2">
        {rejectReasons.map((item) => (
          <label key={item} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="postRejectReason"
              className="accent-primary"
              checked={reason === item}
              onChange={() => onReasonChange(item)}
            />
            {item}
          </label>
        ))}
      </div>

      <textarea
        rows={3}
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Ghi chú bổ sung…"
        className="w-full rounded-2xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-zinc-950 dark:text-slate-100"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-950">
        <div className="shrink-0 border-b border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-900 dark:hover:text-slate-100"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
