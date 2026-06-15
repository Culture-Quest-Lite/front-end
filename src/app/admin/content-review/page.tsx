"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/app/ui-bits";
import { approvals as initialApprovals, type ApprovalItem } from "@/data/demo";
import { Check, X, MessageSquare, MapPin, FileText, Route as RouteIcon, Clock, ShieldCheck, Trash2 } from "lucide-react";

const filters = [
  { key: "all", label: "Tất cả" },
  { key: "Hotspot", label: "Hotspot" },
  { key: "Story", label: "Câu chuyện" },
  { key: "Route", label: "Tuyến" },
] as const;

type FilterType = (typeof filters)[number]["key"];
type OpenDialog = { type: "approve" | "reject"; itemId: string } | null;

export default function ContentReviewPage() {
  const [items, setItems] = useState<ApprovalItem[]>(initialApprovals);
  const [type, setType] = useState<FilterType>("all");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(
    () => items.filter((item) => (type === "all" || item.type === type) && item.status === "pending"),
    [items, type]
  );

  const counts = useMemo(
    () => ({
      all: items.filter((i) => i.status === "pending").length,
      Hotspot: items.filter((i) => i.type === "Hotspot" && i.status === "pending").length,
      Story: items.filter((i) => i.type === "Story" && i.status === "pending").length,
      Route: items.filter((i) => i.type === "Route" && i.status === "pending").length,
    }),
    [items]
  );

  const selectedItem = dialog ? items.find((item) => item.id === dialog.itemId) : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleApprove(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: "approved" as const } : item)));
    setDialog(null);
    showToast("Đã phê duyệt và xuất bản nội dung.");
  }

  function handleReject(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: "rejected" as const } : item)));
    setDialog(null);
    setRejectReason("");
    showToast("Đã từ chối nội dung. Curator sẽ nhận thông báo.");
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Đã xóa nội dung khỏi hàng đợi.");
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
        subtitle="Phê duyệt, từ chối hoặc xóa nội dung do Curator gửi."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{counts.all} chờ duyệt · SLA trung bình: 6h</span>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Quy tắc kiểm duyệt
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setType(filter.key)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
              type === filter.key
                ? "bg-red-50 text-red-700 border-red-100"
                : "bg-surface border-border text-muted-foreground"
            }`}
          >
            {filter.label} · {counts[filter.key]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">Không có nội dung chờ duyệt</p>
          <p className="mt-1 text-xs text-slate-400">Tất cả đề xuất đã được xử lý.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm dark:bg-zinc-950">
              <Link href={`/admin/content-review/${item.id}`} className="block">
                <div className="flex gap-3 p-3">
                  <img src={item.thumbnail} alt={item.title} className="h-24 w-24 flex-none rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {item.type === "Hotspot" ? <MapPin className="h-3 w-3" /> : item.type === "Story" ? <FileText className="h-3 w-3" /> : <RouteIcon className="h-3 w-3" />}
                      <span>{item.type}</span>
                      <Clock className="h-3 w-3" />
                      <span>Gửi lúc {new Date(item.submittedAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="truncate text-lg font-semibold text-slate-950 dark:text-slate-50">{item.title}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-primary text-[10px] font-bold">{item.curator.charAt(0)}</div>
                      <span className="text-xs text-slate-700 dark:text-slate-300">{item.curator}</span>
                      <StatusPill status={item.status} />
                    </div>
                  </div>
                </div>
              </Link>
              <div className="grid grid-cols-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDialog({ type: "reject", itemId: item.id })}
                  className="flex items-center justify-center gap-1.5 border-r border-border py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" /> Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => setDialog({ type: "approve", itemId: item.id })}
                  className="flex items-center justify-center gap-1.5 border-r border-border py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                >
                  <Check className="h-4 w-4" /> Duyệt
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
                >
                  <Trash2 className="h-4 w-4" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem ? (
        <Modal open onClose={() => setDialog(null)} title={dialog?.type === "approve" ? "Xem trước & phê duyệt" : `Từ chối: ${selectedItem.title}`}>
          {dialog?.type === "approve" ? (
            <ApprovePreview item={selectedItem} />
          ) : (
            <RejectPreview reason={rejectReason} onReasonChange={setRejectReason} />
          )}
          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={() => setDialog(null)}>
              Huỷ
            </Button>
            <Button
              onClick={() => dialog?.type === "approve" ? handleApprove(selectedItem.id) : handleReject(selectedItem.id)}
              className={
                dialog?.type === "approve"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent gap-1.5"
                  : "bg-red-600 text-white hover:bg-red-700 border-transparent gap-1.5"
              }
            >
              {dialog?.type === "approve" ? (
                <><Check className="h-4 w-4 mr-1.5" /> Phê duyệt & xuất bản</>
              ) : (
                <><MessageSquare className="h-4 w-4 mr-1.5" /> Gửi từ chối</>
              )}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function ApprovePreview({ item }: { item: ApprovalItem }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <img src={item.thumbnail} alt="Preview" className="h-56 w-full rounded-3xl object-cover" />
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
        <div className="text-xs text-muted-foreground">{item.type} · {item.curator}</div>
        <div className="text-lg font-semibold text-slate-950 dark:text-slate-50">{item.title}</div>
        <p className="text-sm text-muted-foreground">Nội dung do Curator gửi cần xem xét tính chính xác về thông tin lịch sử, kiểm tra ranh giới GPS và đảm bảo phương tiện đính kèm phù hợp.</p>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          <Info label="GPS" value="✓ Trong TP.HCM" />
          <Info label="Phương tiện" value="3 ảnh · 1 video" />
          <Info label="Mô tả" value="248 ký tự" />
          <Info label="Thẻ" value="3 thẻ" />
        </div>
      </div>
    </div>
  );
}

function RejectPreview({ reason, onReasonChange }: { reason: string; onReasonChange: (v: string) => void }) {
  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <p className="text-xs text-muted-foreground">Lý do bắt buộc theo BR-09. Curator sẽ nhận được thông báo.</p>
      <div className="space-y-2">
        {[
          "Thiếu thông tin GPS chính xác",
          "Mô tả chưa đủ chi tiết",
          "Ảnh chất lượng thấp",
          "Nội dung không đúng sự kiện lịch sử",
          "Khác",
        ].map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input type="radio" name="reason" className="accent-primary" checked={reason === r} onChange={() => onReasonChange(r)} />
            {r}
          </label>
        ))}
      </div>
      <textarea rows={3} placeholder="Ghi chú bổ sung…" className="w-full rounded-3xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-zinc-950 dark:text-slate-100" />
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
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
