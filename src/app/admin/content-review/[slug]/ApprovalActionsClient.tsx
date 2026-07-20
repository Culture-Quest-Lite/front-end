"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminApi, type PostItem } from "@/services/api/admin/adminApi";
import { Check, X, Trash2, Loader2 } from "lucide-react";

export function ApprovalActionsClient({ item }: { item: PostItem }) {
  const router = useRouter();
  const [status, setStatus] = useState(item.status);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove() {
    setLoading(true);
    try {
      await adminApi.approvePost(item.postId);
      setStatus("APPROVED");
      showToast("Đã phê duyệt và xuất bản.");
      setTimeout(() => router.push("/admin/content-review"), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể duyệt bài đăng.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    const reason = rejectReason.trim() || "Nội dung không đạt yêu cầu duyệt";
    setLoading(true);
    try {
      await adminApi.rejectPost(item.postId, reason);
      setStatus("REJECTED");
      showToast("Đã từ chối nội dung.");
      setTimeout(() => router.push("/admin/content-review"), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể từ chối bài đăng.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await adminApi.banPost(item.postId, "Xóa bởi admin");
      showToast("Đã xóa nội dung.");
      setTimeout(() => router.push("/admin/content-review"), 1000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xóa bài đăng.");
    } finally {
      setLoading(false);
    }
  }

  if (status !== "PENDING") {
    const label = status === "APPROVED" ? "Đã duyệt" : "Đã từ chối";
    const cls = status === "APPROVED" ? "text-emerald-600" : "text-red-600";
    return (
      <p className={`text-sm font-medium ${cls}`}>
        Nội dung này đã được xử lý: {label}
      </p>
    );
  }

  return (
    <>
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <textarea
          rows={2}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Lý do từ chối (tuỳ chọn)..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <Button
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => void handleApprove()}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Phê duyệt & xuất bản
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-red-600 hover:bg-red-50"
          onClick={() => void handleReject()}
          disabled={loading}
        >
          <X className="w-4 h-4" /> Từ chối
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-slate-500"
          onClick={() => void handleDelete()}
          disabled={loading}
        >
          <Trash2 className="w-4 h-4" /> Xóa nội dung
        </Button>
      </div>
    </>
  );
}
