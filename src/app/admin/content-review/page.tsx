"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/app/ui-bits";
import { adminApi, type PostItem } from "@/services/api/admin/adminApi";
import { Check, X, MessageSquare, Clock, ShieldCheck, Trash2, Loader2 } from "lucide-react";

type OpenDialog = { type: "approve" | "reject"; itemId: number } | null;

export default function ContentReviewPage() {
  const [items, setItems] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPosts({ status: "PENDING", page: 0, size: 50 });
      setItems(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải hàng đợi duyệt.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const filtered = useMemo(
    () => items.filter((item) => item.status === "PENDING"),
    [items],
  );

  const selectedItem = dialog ? items.find((item) => item.postId === dialog.itemId) : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove(id: number) {
    setSubmitting(true);
    try {
      await adminApi.approvePost(id);
      setItems((prev) => prev.filter((item) => item.postId !== id));
      setDialog(null);
      showToast("Đã phê duyệt và xuất bản nội dung.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể duyệt bài đăng.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(id: number) {
    if (!rejectReason.trim()) {
      showToast("Vui lòng chọn hoặc nhập lý do từ chối.");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.rejectPost(id, rejectReason.trim());
      setItems((prev) => prev.filter((item) => item.postId !== id));
      setDialog(null);
      setRejectReason("");
      showToast("Đã từ chối nội dung. Curator sẽ nhận thông báo.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể từ chối bài đăng.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBan(id: number) {
    const reason = "Xóa bởi admin khỏi hàng đợi duyệt";
    setSubmitting(true);
    try {
      await adminApi.banPost(id, reason);
      setItems((prev) => prev.filter((item) => item.postId !== id));
      showToast("Đã xóa nội dung khỏi hàng đợi.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xóa bài đăng.");
    } finally {
      setSubmitting(false);
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
        title="Duyệt nội dung"
        subtitle="Phê duyệt, từ chối hoặc xóa bài đăng do người dùng gửi."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} chờ duyệt</span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void loadPosts()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Làm mới
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải hàng đợi duyệt...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">Không có nội dung chờ duyệt</p>
          <p className="mt-1 text-xs text-slate-400">Tất cả bài đăng đã được xử lý.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <div key={item.postId} className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm dark:bg-zinc-950">
              <Link href={`/admin/content-review/${item.postId}`} className="block">
                <div className="flex gap-3 p-3">
                  <div className="grid h-24 w-24 flex-none place-items-center rounded-2xl bg-slate-100 text-slate-500">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Bài đăng</span>
                      <Clock className="h-3 w-3" />
                      <span>
                        Gửi lúc{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                    <div className="line-clamp-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                      {item.content || "Không có nội dung"}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-primary text-[10px] font-bold">
                        {(item.displayName || item.username).charAt(0)}
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {item.displayName || item.username}
                      </span>
                      <StatusPill status="pending" />
                    </div>
                  </div>
                </div>
              </Link>
              <div className="grid grid-cols-3 border-t border-border">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDialog({ type: "reject", itemId: item.postId })}
                  className="flex items-center justify-center gap-1.5 border-r border-border py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Từ chối
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDialog({ type: "approve", itemId: item.postId })}
                  className="flex items-center justify-center gap-1.5 border-r border-border py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Duyệt
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleBan(item.postId)}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem ? (
        <Modal
          open
          onClose={() => setDialog(null)}
          title={dialog?.type === "approve" ? "Xem trước & phê duyệt" : `Từ chối bài đăng #${selectedItem.postId}`}
        >
          {dialog?.type === "approve" ? (
            <ApprovePreview item={selectedItem} />
          ) : (
            <RejectPreview reason={rejectReason} onReasonChange={setRejectReason} />
          )}
          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
              Huỷ
            </Button>
            <Button
              disabled={submitting}
              onClick={() =>
                dialog?.type === "approve"
                  ? void handleApprove(selectedItem.postId)
                  : void handleReject(selectedItem.postId)
              }
              className={
                dialog?.type === "approve"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent gap-1.5"
                  : "bg-red-600 text-white hover:bg-red-700 border-transparent gap-1.5"
              }
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : dialog?.type === "approve" ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" /> Phê duyệt & xuất bản
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-1.5" /> Gửi từ chối
                </>
              )}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function ApprovePreview({ item }: { item: PostItem }) {
  return (
    <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
      <div className="text-xs text-muted-foreground">
        Bài đăng · {item.displayName || item.username}
      </div>
      <p className="text-sm leading-6">{item.content}</p>
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <Info label="Hotspot" value={item.isTaggedHotspot ? "Có gắn thẻ" : "Không"} />
        <Info label="Tuyến" value={item.isTaggedRoute ? "Có gắn thẻ" : "Không"} />
        <Info label="Thẻ" value={`${item.tags?.length ?? 0} thẻ`} />
        <Info label="Trạng thái" value={item.status} />
      </div>
    </div>
  );
}

function RejectPreview({
  reason,
  onReasonChange,
}: {
  reason: string;
  onReasonChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <p className="text-xs text-muted-foreground">Lý do bắt buộc. Curator sẽ nhận được thông báo.</p>
      <div className="space-y-2">
        {[
          "Thiếu thông tin GPS chính xác",
          "Mô tả chưa đủ chi tiết",
          "Ảnh chất lượng thấp",
          "Nội dung không đúng sự kiện lịch sử",
          "Khác",
        ].map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="reason"
              className="accent-primary"
              checked={reason === r}
              onChange={() => onReasonChange(r)}
            />
            {r}
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
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
