"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/app/ui-bits";
import { approvals } from "@/data/demo";
import { Check, X, MessageSquare, MapPin, FileText, Route as RouteIcon, Clock, ShieldCheck } from "lucide-react";

const filters = [
  { key: "all", label: "Tất cả" },
  { key: "Hotspot", label: "Hotspot" },
  { key: "Story", label: "Câu chuyện" },
  { key: "Route", label: "Tuyến" },
] as const;

type FilterType = (typeof filters)[number]["key"];

type OpenDialog = { type: "approve" | "reject"; itemId: string } | null;

export default function ContentReviewPage() {
  const [type, setType] = useState<FilterType>("all");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [detailItem, setDetailItem] = useState<(typeof approvals)[number] | null>(null);

  const filtered = useMemo(
    () => approvals.filter((item) => type === "all" || item.type === type),
    [type]
  );

  const counts = useMemo(
    () => ({
      all: approvals.length,
      Hotspot: approvals.filter((item) => item.type === "Hotspot").length,
      Story: approvals.filter((item) => item.type === "Story").length,
      Route: approvals.filter((item) => item.type === "Route").length,
    }),
    []
  );

  const selectedItem = dialog ? approvals.find((item) => item.id === dialog.itemId) : null;

  return (
    <div className="space-y-6 py-6">
      <PageHeader
        title="Duyệt nội dung"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">SLA trung bình: 6h</span>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <div key={item.id} onClick={() => setDetailItem(item)} className="cursor-pointer overflow-hidden rounded-3xl border border-border bg-white shadow-sm dark:bg-zinc-950">
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
              <div className="grid grid-cols-2 border-t border-border">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDialog({ type: "reject", itemId: item.id }) }}
                className="flex items-center justify-center gap-1.5 border-r border-border py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" /> Từ chối
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDialog({ type: "approve", itemId: item.id }) }}
                className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
              >
                <Check className="h-4 w-4" /> Phê duyệt
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedItem ? (
        <Modal open onClose={() => setDialog(null)} title={dialog?.type === "approve" ? "Xem trước & phê duyệt" : `Từ chối: ${selectedItem.title}`}>
          {dialog?.type === "approve" ? (
            <ApprovePreview item={selectedItem} />
          ) : (
            <RejectPreview />
          )}
          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={() => setDialog(null)}>
              Huỷ
            </Button>
            <Button
              onClick={() => setDialog(null)}
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

      {detailItem ? (
        <Modal open onClose={() => setDetailItem(null)} title={`${detailItem.type} — ${detailItem.title}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <img src={detailItem.thumbnail} alt={detailItem.title} className="h-56 w-full rounded-3xl object-cover" />
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">{detailItem.type}</span>
                <span>·</span>
                <span>Gửi lúc {new Date(detailItem.submittedAt).toLocaleString("vi-VN")}</span>
              </div>
              <div className="text-lg font-semibold text-slate-950 dark:text-slate-50">{detailItem.title}</div>
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-primary-soft text-primary text-[10px] font-bold">{detailItem.curator.charAt(0)}</div>
                <div className="text-sm">{detailItem.curator}</div>
                <StatusPill status={detailItem.status} />
              </div>
              <p className="text-sm text-muted-foreground">Mô tả mẫu: Nội dung mô tả chi tiết sẽ hiển thị ở đây. (Dữ liệu demo)</p>
              <div className="mt-3 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDetailItem(null)}>Đóng</Button>
                <Button className="text-emerald-600 hover:bg-emerald-50" onClick={() => { setDialog({ type: 'approve', itemId: detailItem.id }); setDetailItem(null); }}>Phê duyệt</Button>
                <Button className="text-red-600 hover:bg-red-50" onClick={() => { setDialog({ type: 'reject', itemId: detailItem.id }); setDetailItem(null); }}>Từ chối</Button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function ApprovePreview({ item }: { item: (typeof approvals)[number] }) {
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

function RejectPreview() {
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
        ].map((reason) => (
          <label key={reason} className="flex items-center gap-2 text-sm">
            <input type="radio" name="reason" className="accent-primary" />
            {reason}
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
