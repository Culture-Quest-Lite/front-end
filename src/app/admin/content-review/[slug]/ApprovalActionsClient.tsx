"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ApprovalItem } from "@/data/demo";
import { Check, X, Trash2 } from "lucide-react";

export function ApprovalActionsClient({ item }: { item: ApprovalItem }) {
  const router = useRouter();
  const [status, setStatus] = useState(item.status);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleApprove() {
    setStatus("approved");
    showToast("Đã phê duyệt và xuất bản.");
    setTimeout(() => router.push("/admin/content-review"), 1500);
  }

  function handleReject() {
    setStatus("rejected");
    showToast("Đã từ chối nội dung.");
    setTimeout(() => router.push("/admin/content-review"), 1500);
  }

  function handleDelete() {
    showToast("Đã xóa nội dung.");
    setTimeout(() => router.push("/admin/content-review"), 1000);
  }

  if (status !== "pending") {
    const label = status === "approved" ? "Đã duyệt" : "Đã từ chối";
    const cls = status === "approved" ? "text-emerald-600" : "text-red-600";
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
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
          <Check className="w-4 h-4" /> Phê duyệt & xuất bản
        </Button>
        <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50" onClick={handleReject}>
          <X className="w-4 h-4" /> Từ chối
        </Button>
        <Button variant="outline" className="gap-2 text-slate-500" onClick={handleDelete}>
          <Trash2 className="w-4 h-4" /> Xóa nội dung
        </Button>
      </div>
    </>
  );
}
