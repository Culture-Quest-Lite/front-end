"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { adminApi, type PostItem } from "@/services/api/admin/adminApi";
import {
  Trash2,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Check,
  X,
  Eye,
  User as UserIcon,
} from "lucide-react";

type PostStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

/**
 * ⚠ GIẢ ĐỊNH: 3 trạng thái PENDING/APPROVED/REJECTED dựa theo quy trình
 * duyệt nội dung thông thường của app — cần đối chiếu lại đúng enum thật
 * trong PostItem.status.
 */
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

/**
 * ⚠ Mở rộng PostItem với field optional CHƯA XÁC NHẬN trong adminApi.ts
 * thật (imageUrl, createdAt). Vì là optional nên PostItem thật (không có 2
 * field này) vẫn gán được vào PostDetail[] bình thường, không lỗi type —
 * chỉ là khi render mình dùng optional chaining để không vỡ nếu thiếu.
 * Nếu backend trả tên field khác (vd "mediaUrl"), đổi lại tên ở đây.
 */
type PostDetail = PostItem & {
  imageUrl?: string;
  createdAt?: string;
};

/**
 * Dữ liệu MẪU — chỉ để xem trước giao diện "xem chi tiết bài đăng" ngay cả
 * khi danh sách thật đang trống. postId âm để phân biệt với dữ liệu thật;
 * mọi hành động duyệt/từ chối/xoá đều bị chặn cho mục này (xem isDemo).
 */
const DEMO_POST: PostDetail = {
  postId: -1,
  content:
    "Hôm nay mình ghé Dinh Độc Lập vào sáng sớm, không gian rất đẹp và yên tĩnh. Mọi người nên đi sớm để tránh đông và có ánh sáng đẹp để chụp ảnh nha! Có ai biết quán cà phê nào gần đây ngồi chill không? 📸☕",
  reason: "Bị báo cáo nội dung trùng lặp với bài viết khác trong cùng tuần",
  displayName: "Nguyễn Thị Ngọc",
  username: "ngoccute",
  status: "PENDING",
  imageUrl: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900&q=80",
  createdAt: new Date().toISOString(),
} as PostDetail;

export default function ModerationPage() {
  const [posts, setPosts] = useState<PostDetail[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>("PENDING");
  const [actionId, setActionId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PostDetail | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailPost, setDetailPost] = useState<PostDetail | null>(null);

  const requestPosts = useCallback(async () => {
    const response = await adminApi.getPosts({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page: 0,
      size: 20,
    });
    return response.content;
  }, [statusFilter]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const nextPosts = await requestPosts();
      setPosts(nextPosts);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [requestPosts]);

  useEffect(() => {
    let cancelled = false;

    async function syncPosts() {
      try {
        const nextPosts = await requestPosts();
        if (cancelled) return;
        setPosts(nextPosts);
      } catch {
        if (cancelled) return;
        setPosts([]);
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    }

    void syncPosts();
    return () => {
      cancelled = true;
    };
  }, [requestPosts]);

  function handleStatusFilterChange(nextStatus: PostStatusFilter) {
    if (nextStatus === statusFilter) return;
    setLoadingPosts(true);
    setStatusFilter(nextStatus);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove(post: PostDetail) {
    if (post.postId < 0) return; // bài demo — không gọi API thật
    setActionId(post.postId);
    try {
      // ⚠ GIẢ ĐỊNH: adminApi.approvePost(id) tương ứng PUT /api/admin/post/{id}/approve
      await adminApi.approvePost(post.postId);
      setPosts((prev) => prev.filter((p) => p.postId !== post.postId));
      setDetailPost(null);
      showToast("Đã duyệt bài đăng.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể duyệt bài đăng.");
    } finally {
      setActionId(null);
    }
  }

  function openRejectDialog(post: PostDetail) {
    if (post.postId < 0) return;
    setDetailPost(null);
    setRejectTarget(post);
    setRejectReason("");
  }

  async function handleConfirmReject() {
    if (!rejectTarget) return;
    setActionId(rejectTarget.postId);
    try {
      // ⚠ GIẢ ĐỊNH: adminApi.rejectPost(id, reason) tương ứng PUT /api/admin/post/{id}/reject
      await adminApi.rejectPost(
        rejectTarget.postId,
        rejectReason.trim() || "Không phù hợp với tiêu chuẩn nội dung",
      );
      setPosts((prev) => prev.filter((p) => p.postId !== rejectTarget.postId));
      showToast("Đã từ chối bài đăng.");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể từ chối bài đăng.");
    } finally {
      setActionId(null);
    }
  }

  async function handleBanPost(postId: number) {
    if (postId < 0) return;
    setActionId(postId);
    try {
      await adminApi.banPost(postId, "Xóa mềm bởi admin qua kiểm duyệt");
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
      setDetailPost(null);
      showToast("Đã xóa mềm bài đăng.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xóa bài đăng.");
    } finally {
      setActionId(null);
    }
  }

  const displayedPosts: PostDetail[] = [DEMO_POST, ...posts];

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Kiểm duyệt bài đăng"
        subtitle="Xem chi tiết, duyệt, từ chối và xoá mềm bài đăng của người dùng."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { value: "PENDING", label: "Chờ duyệt" },
              { value: "APPROVED", label: "Đã duyệt" },
              { value: "REJECTED", label: "Bị từ chối" },
              { value: "ALL", label: "Tất cả" },
            ] as { value: PostStatusFilter; label: string }[]
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleStatusFilterChange(item.value)}
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
        <Button size="sm" variant="outline" onClick={() => void loadPosts()}>
          {loadingPosts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Làm mới"}
        </Button>
      </div>

      <div className="card-elev rounded-2xl overflow-hidden">
        <ul className="divide-y divide-border">
          {loadingPosts ? (
            <li className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </li>
          ) : (
            displayedPosts.map((post) => (
              <PostRow
                key={post.postId}
                post={post}
                actionLoading={actionId === post.postId}
                onView={() => setDetailPost(post)}
                onApprove={() => void handleApprove(post)}
                onReject={() => openRejectDialog(post)}
                onBan={() => void handleBanPost(post.postId)}
              />
            ))
          )}
        </ul>
      </div>

      {detailPost ? (
        <PostDetailModal
          post={detailPost}
          actionLoading={actionId === detailPost.postId}
          onClose={() => setDetailPost(null)}
          onApprove={() => void handleApprove(detailPost)}
          onReject={() => openRejectDialog(detailPost)}
          onBan={() => void handleBanPost(detailPost.postId)}
        />
      ) : null}

      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Từ chối bài đăng</h2>
            <p className="mt-1 truncate text-sm text-slate-500">{rejectTarget.content}</p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Lý do từ chối</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Không phù hợp với tiêu chuẩn nội dung"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmReject()}
                disabled={actionId === rejectTarget.postId}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionId === rejectTarget.postId ? "Đang gửi..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PostRow({
  post,
  actionLoading,
  onView,
  onApprove,
  onReject,
  onBan,
}: {
  post: PostDetail;
  actionLoading: boolean;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onBan: () => void;
}) {
  const isDemo = post.postId < 0;

  return (
    <li className="p-4 flex flex-col md:flex-row md:items-center gap-3">
      <button
        type="button"
        onClick={onView}
        className="w-10 h-10 shrink-0 rounded-xl bg-destructive/10 text-destructive grid place-items-center transition hover:bg-destructive/20"
        aria-label="Xem chi tiết"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <button type="button" onClick={onView} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{post.content}</span>
          {isDemo ? (
            <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              Demo
            </span>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          {post.reason ?? "Chưa có lý do"} · {post.displayName || post.username}
        </div>
      </button>

      <span
        className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${
          postStatusClasses[post.status] ?? "bg-slate-100 text-slate-600 border-slate-200"
        }`}
      >
        {postStatusLabels[post.status] ?? post.status}
      </span>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" type="button" onClick={onView}>
          <Eye className="w-4 h-4" /> Xem
        </Button>
        {!isDemo && post.status === "PENDING" ? (
          <>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              type="button"
              disabled={actionLoading}
              onClick={onApprove}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Duyệt
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              type="button"
              disabled={actionLoading}
              onClick={onReject}
            >
              <X className="w-4 h-4" />
              Từ chối
            </Button>
          </>
        ) : null}
        {!isDemo ? (
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            type="button"
            disabled={actionLoading}
            onClick={onBan}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Xoá mềm
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function PostDetailModal({
  post,
  actionLoading,
  onClose,
  onApprove,
  onReject,
  onBan,
}: {
  post: PostDetail;
  actionLoading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onBan: () => void;
}) {
  const isDemo = post.postId < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Chi tiết bài đăng</h2>
              {isDemo ? (
                <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                  Dữ liệu mẫu
                </span>
              ) : null}
            </div>
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

        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="Ảnh bài đăng" className="max-h-72 w-full object-cover" />
        ) : null}

        <div className="space-y-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nội dung</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{post.content}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                postStatusClasses[post.status] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {postStatusLabels[post.status] ?? post.status}
            </span>
            {post.createdAt ? (
              <span className="text-xs text-slate-400">
                Đăng lúc {new Date(post.createdAt).toLocaleString("vi-VN")}
              </span>
            ) : null}
          </div>

          {post.reason ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Lý do báo cáo / từ chối
              </p>
              <p className="mt-1 text-sm text-amber-800">{post.reason}</p>
            </div>
          ) : null}

          {isDemo ? (
            <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-700">
              Đây chỉ là dữ liệu mẫu để xem trước giao diện — không phải bài đăng thật, các hành
              động duyệt/từ chối/xoá đã bị tắt cho mục này.
            </p>
          ) : null}
        </div>

        {!isDemo ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 p-6 pt-4">
            {post.status === "PENDING" ? (
              <>
                <Button
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  disabled={actionLoading}
                  onClick={onApprove}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Duyệt bài
                </Button>
                <Button variant="outline" className="gap-1.5" disabled={actionLoading} onClick={onReject}>
                  <X className="h-4 w-4" /> Từ chối
                </Button>
              </>
            ) : null}
            <Button variant="destructive" className="gap-1.5" disabled={actionLoading} onClick={onBan}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Xoá mềm
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
