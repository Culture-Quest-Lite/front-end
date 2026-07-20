"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/ui-bits";
import { adminApi, type PostItem } from "@/services/api/admin/adminApi";
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

type SafeRecord = Record<string, unknown>;

type PostDetail = PostItem & {
  imageUrl?: string;
  imageUrls?: string[];
  mediaUrl?: string;
  mediaUrls?: string[];
  createdAt?: string;
};

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

const DEMO_POSTS: PostDetail[] = [
  {
    postId: -1,
    userId: 101,
    username: "ngoccute",
    displayName: "Nguyễn Thị Ngọc",
    content:
      "Hôm nay mình ghé Dinh Độc Lập vào buổi sáng, không gian rất đẹp và yên tĩnh. Mọi người nên đi trước 8 giờ để chụp hình đẹp hơn.",
    status: "PENDING",
    reason: "Được nhiều người báo cáo vì nghi ngờ nội dung sao chép.",
    isTaggedHotspot: true,
    isTaggedRoute: false,
    createdAt: "2026-06-25T08:30:00",
    imageUrl:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900&q=80",
    tags: [
      { tagId: 1, tagName: "Lịch sử" },
      { tagId: 2, tagName: "Sài Gòn" },
    ],
    hotspots: [{ hotspotId: 12, hotspotName: "Dinh Độc Lập" }],
  } as unknown as PostDetail,
  {
    postId: -2,
    userId: 102,
    username: "hoangpham",
    displayName: "Phạm Hoàng",
    content:
      "Lần đầu tham quan Bưu điện Thành phố Hồ Chí Minh, kiến trúc Pháp rất đẹp. Bên trong vẫn còn hoạt động bình thường.",
    status: "PENDING",
    reason: "Ảnh nghi ngờ vi phạm bản quyền.",
    isTaggedHotspot: true,
    isTaggedRoute: true,
    createdAt: "2026-06-24T15:12:00",
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=900&q=80",
    tags: [
      { tagId: 3, tagName: "Kiến trúc" },
      { tagId: 4, tagName: "Checkin" },
    ],
    hotspots: [{ hotspotId: 18, title: "Bưu điện Thành phố" }],
    routes: [{ routeId: 5, routeName: "Một ngày quanh Quận 1" }],
  } as unknown as PostDetail,
  {
    postId: -3,
    userId: 103,
    username: "minhtravel",
    displayName: "Trần Minh",
    content:
      "Nếu đi chợ Bến Thành thì nên gửi xe phía cổng Đông sẽ thuận tiện hơn rất nhiều.",
    status: "APPROVED",
    isTaggedHotspot: true,
    isTaggedRoute: false,
    createdAt: "2026-06-23T10:20:00",
    imageUrl:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900&q=80",
    tags: ["Du lịch", "Mẹo hay"],
    hotspots: [{ hotspotId: 20, name: "Chợ Bến Thành" }],
  } as unknown as PostDetail,
  {
    postId: -4,
    userId: 104,
    username: "linhcute",
    displayName: "Lê Khánh Linh",
    content:
      "Review quán cà phê gần Nhà thờ Đức Bà nhưng có chèn quá nhiều nội dung quảng cáo.",
    status: "REJECTED",
    reason: "Nội dung quảng cáo không đúng quy định.",
    isTaggedHotspot: false,
    isTaggedRoute: false,
    createdAt: "2026-06-22T18:00:00",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80",
    tags: [{ tagId: 9, tagName: "Cafe" }],
  } as unknown as PostDetail,
];

function getRecordValue(source: unknown, key: string) {
  if (!source || typeof source !== "object") return undefined;
  return (source as SafeRecord)[key];
}

function getAuthorName(post: PostDetail) {
  return post.displayName || post.username || `Người dùng #${post.userId}`;
}

function getPostImage(post: PostDetail) {
  if (post.imageUrl) return post.imageUrl;
  if (post.mediaUrl) return post.mediaUrl;
  if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) return post.imageUrls[0];
  if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) return post.mediaUrls[0];
  return null;
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

function getObjectLabel(value: SafeRecord, preferredKeys: string[]) {
  for (const key of preferredKeys) {
    const found = value[key];
    if (typeof found === "string" && found.trim()) return found.trim();
    if (typeof found === "number") return String(found);
  }
  return "";
}

function normalizeLabelList(value: unknown, preferredKeys: string[]) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (item && typeof item === "object") {
        const label = getObjectLabel(item as SafeRecord, preferredKeys);
        return label || JSON.stringify(item);
      }
      return "";
    })
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPostTags(post: PostDetail) {
  return normalizeLabelList(getRecordValue(post, "tags"), ["tagName", "name", "title", "label", "value"]);
}

function getPostHotspots(post: PostDetail) {
  const objectList = normalizeLabelList(getRecordValue(post, "hotspots"), [
    "hotspotName",
    "name",
    "title",
    "displayName",
  ]);
  const idList = normalizeLabelList(getRecordValue(post, "hotspotIds"), ["hotspotId", "id"]);
  return objectList.length > 0 ? objectList : idList;
}

function getPostRoutes(post: PostDetail) {
  const objectList = normalizeLabelList(getRecordValue(post, "routes"), [
    "routeName",
    "name",
    "title",
    "displayName",
  ]);
  const idList = normalizeLabelList(getRecordValue(post, "routeIds"), ["routeId", "id"]);
  return objectList.length > 0 ? objectList : idList;
}

function joinLabels(labels: string[]) {
  return labels.length > 0 ? labels.join(", ") : "Không có";
}

function isDemoPost(post: PostDetail) {
  return post.postId < 0;
}

export default function ContentReviewPage() {
  const [items, setItems] = useState<PostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>("PENDING");
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPosts({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page: 0,
        size: 50,
      });

      const visiblePosts = response.content.filter((post) => post.status !== "DELETED");
      setItems(visiblePosts.length > 0 ? (visiblePosts as PostDetail[]) : DEMO_POSTS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải hàng đợi duyệt bài đăng. Đang hiển thị dữ liệu mẫu.");
      setItems(DEMO_POSTS);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

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

  async function handleApprove(post: PostDetail) {
    if (isDemoPost(post)) {
      setItems((prev) => prev.map((item) => (item.postId === post.postId ? { ...item, status: "APPROVED" } : item)));
      setDialog(null);
      showToast("Đã duyệt bài đăng mẫu.");
      return;
    }

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

  function openRejectDialog(post: PostDetail) {
    setRejectReason("");
    setDialog({ type: "reject", itemId: post.postId });
  }

  async function handleReject(post: PostDetail) {
    const reason = rejectReason.trim() || "Không phù hợp với tiêu chuẩn nội dung";

    if (isDemoPost(post)) {
      setItems((prev) =>
        prev.map((item) => (item.postId === post.postId ? { ...item, status: "REJECTED", reason } : item)),
      );
      setDialog(null);
      setRejectReason("");
      showToast("Đã từ chối bài đăng mẫu.");
      return;
    }

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

  async function handleSoftDelete(post: PostDetail) {
    if (isDemoPost(post)) {
      setItems((prev) => prev.filter((item) => item.postId !== post.postId));
      setDialog(null);
      showToast("Đã xoá bài đăng mẫu khỏi danh sách.");
      return;
    }

    setSubmittingId(post.postId);
    try {
      await adminApi.banPost(post.postId, "Xóa mềm bởi admin qua kiểm duyệt");
      setItems((prev) => prev.filter((item) => item.postId !== post.postId));
      setDialog(null);
      showToast("Đã xoá mềm bài đăng.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xoá mềm bài đăng.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6 py-6">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Duyệt bài đăng"
        subtitle="Xem chi tiết, duyệt, từ chối hoặc xoá mềm bài post do người dùng gửi lên."
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
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
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
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải hàng đợi duyệt bài đăng...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
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
              onSoftDelete={() => void handleSoftDelete(post)}
            />
          ))}
        </div>
      )}

      {selectedItem ? (
        <PostReviewModal
          open
          type={dialog?.type ?? "detail"}
          post={selectedItem}
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
          onSoftDelete={() => void handleSoftDelete(selectedItem)}
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
  onSoftDelete,
}: {
  post: PostDetail;
  submitting: boolean;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSoftDelete: () => void;
}) {
  const image = getPostImage(post);
  const isPending = post.status === "PENDING";
  const tags = getPostTags(post);

  return (
    <div
      className="
        overflow-hidden
        rounded-[28px]
        border border-slate-200/60
        bg-white
        shadow-[0_2px_10px_rgba(15,23,42,0.04)]
        transition-all duration-200
        hover:border-slate-200/80
        hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]
        dark:border-zinc-800/60
        dark:bg-zinc-950
      "
    >
      <button
        type="button"
        onClick={onView}
        className="block w-full text-left"
      >
        <div className="flex gap-4 p-4">
          {image ? (
            <img
              src={image}
              alt="Ảnh bài đăng"
              className="h-24 w-24 flex-none rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-24 w-24 flex-none place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <MessageSquare className="h-8 w-8" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span>Bài post</span>

              <Clock className="h-3 w-3" />

              <span>
                Gửi lúc {getCreatedText(post.createdAt)}
              </span>

              {isDemoPost(post) ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                  Demo
                </span>
              ) : null}
            </div>

            <div className="line-clamp-2 text-base font-semibold leading-6 text-slate-950 dark:text-slate-50">
              {post.content || "Bài đăng không có nội dung"}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                {getAuthorName(post).charAt(0).toUpperCase()}
              </div>

              <span className="text-xs text-slate-700 dark:text-slate-300">
                {getAuthorName(post)}
              </span>

              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPostStatusClass(
                  post.status
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
              <p className="mt-2 line-clamp-1 text-xs text-amber-700">
                Lý do: {post.reason}
              </p>
            ) : null}
          </div>
        </div>
      </button>

      <div className="mx-4 h-px bg-slate-100 dark:bg-zinc-800/70" />

      <div className="grid grid-cols-4 px-2 py-2">
        <button
          type="button"
          disabled={submitting}
          onClick={onView}
          className="
            flex items-center justify-center gap-1.5
            rounded-xl py-2.5
            text-sm font-medium text-slate-600
            transition-colors
            hover:bg-slate-50
            disabled:opacity-50
          "
        >
          <Eye className="h-4 w-4" />
          Xem
        </button>

        <button
          type="button"
          disabled={submitting || !isPending}
          onClick={onReject}
          className="
            flex items-center justify-center gap-1.5
            rounded-xl py-2.5
            text-sm font-medium text-red-600
            transition-colors
            hover:bg-red-50
            disabled:opacity-40
          "
        >
          <X className="h-4 w-4" />
          Từ chối
        </button>

        <button
          type="button"
          disabled={submitting || !isPending}
          onClick={onApprove}
          className="
            flex items-center justify-center gap-1.5
            rounded-xl py-2.5
            text-sm font-medium text-emerald-600
            transition-colors
            hover:bg-emerald-50
            disabled:opacity-40
          "
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Duyệt
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={onSoftDelete}
          className="
            flex items-center justify-center gap-1.5
            rounded-xl py-2.5
            text-sm font-medium text-slate-500
            transition-colors
            hover:bg-slate-50
            disabled:opacity-50
          "
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
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
  reason,
  submitting,
  onReasonChange,
  onClose,
  onApprove,
  onOpenReject,
  onReject,
  onSoftDelete,
}: {
  open: boolean;
  type: "detail" | "approve" | "reject";
  post: PostDetail;
  reason: string;
  submitting: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onOpenReject: () => void;
  onReject: () => void;
  onSoftDelete: () => void;
}) {
  if (!open) return null;

  const title =
    type === "approve"
      ? "Xem trước & duyệt bài đăng"
      : type === "reject"
        ? `Từ chối bài đăng #${post.postId}`
        : "Chi tiết bài đăng";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {type === "reject" ? (
        <RejectPreview post={post} reason={reason} onReasonChange={onReasonChange} />
      ) : (
        <PostDetailPreview post={post} />
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
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
            <Button variant="destructive" disabled={submitting} onClick={onSoftDelete} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Xoá mềm
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

function PostDetailPreview({ post }: { post: PostDetail }) {
  const image = getPostImage(post);
  const tags = getPostTags(post);
  const hotspots = getPostHotspots(post);
  const routes = getPostRoutes(post);

  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      {image ? (
        <img src={image} alt="Ảnh bài đăng" className="max-h-80 w-full rounded-3xl object-cover" />
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <UserIcon className="h-3.5 w-3.5" />
        <span>{getAuthorName(post)}</span>
        {post.username ? <span>@{post.username}</span> : null}
        <Clock className="h-3.5 w-3.5" />
        <span>{getCreatedText(post.createdAt)}</span>
        {isDemoPost(post) ? (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
            Demo
          </span>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nội dung bài đăng</p>
        <p className="mt-1.5 whitespace-pre-wrap leading-6">{post.content || "Không có nội dung."}</p>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <Info label="Mã bài đăng" value={`#${post.postId}`} />
        <Info label="Trạng thái" value={getPostStatusLabel(post.status)} />
        <Info label="Gắn địa điểm" value={post.isTaggedHotspot ? "Có" : "Không"} />
        <Info label="Gắn tuyến" value={post.isTaggedRoute ? "Có" : "Không"} />
        <Info label="Địa điểm liên quan" value={joinLabels(hotspots)} />
        <Info label="Tuyến liên quan" value={joinLabels(routes)} />
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
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-3">
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
  post: PostDetail;
  reason: string;
  onReasonChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <div className="rounded-3xl bg-surface px-3 py-3">
        <div className="text-[10px] text-muted-foreground">Nội dung bài đăng</div>
        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm">{post.content || "Không có nội dung."}</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Chọn hoặc nhập lý do từ chối. Lý do này sẽ được gửi vào API rejectPost.
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
        className="w-full rounded-3xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-zinc-950 dark:text-slate-100"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-surface px-3 py-2">
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
        <div className="shrink-0 border-b border-border p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
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
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
