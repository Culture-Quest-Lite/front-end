"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/ui-bits";
import { audit, type AuditEntry } from "@/data/demo";
// Temporarily disabled remote fetch due to network/CORS errors
// import { fetchAuditHistory } from "@/lib/api";
import { Check, X, Pencil, Lock, Filter, ArrowRight, Info as InfoIcon, RefreshCcw } from "lucide-react";

const iconFor = (a: string) =>
  a.includes("Duyệt")
    ? Check
    : a.includes("Từ chối")
      ? X
      : a.includes("Khoá")
        ? Lock
        : Pencil;

const iconColorFor = (a: string) =>
  a.includes("Duyệt")
    ? "bg-emerald-500 text-white"
    : a.includes("Từ chối")
      ? "bg-red-500 text-white"
      : a.includes("Khoá")
        ? "bg-amber-500 text-white"
        : "bg-blue-500 text-white";

const statusColorFor = (status: string) => {
  if (status.includes("pending")) return "bg-amber-50 text-amber-700 border border-amber-200";
  if (status.includes("published")) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (status.includes("rejected")) return "bg-red-50 text-red-700 border border-red-200";
  if (status.includes("draft")) return "bg-slate-100 text-slate-700 border border-slate-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

export default function ReviewHistoryPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    setError(null);

    // Tạm thời bỏ gọi API bên ngoài (fetchAuditHistory) vì lỗi 'Failed to fetch'.
    // Sử dụng dữ liệu mẫu cục bộ `audit` để hiển thị giao diện và tránh lỗi runtime.
    setEntries(audit);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch sử duyệt &amp; Audit log"
        subtitle="Toàn bộ hoạt động kiểm duyệt và thay đổi nội dung (BR-71)."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select className="h-9 px-3 rounded-lg bg-surface-2 border border-border text-sm">
              <option>7 ngày qua</option>
              <option>30 ngày</option>
              <option>Tất cả</option>
            </select>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadEntries}>
              <RefreshCcw className="w-4 h-4" /> Làm mới
            </Button>
          </div>
        }
      />

      <div className="card-elev rounded-2xl p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {loading ? "Đang tải lịch sử..." : error ?? `${entries.length} mục đã tải`}
          </p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <ol className="relative border-l-2 border-slate-200 ml-4 space-y-5">
          {(loading ? audit : entries).map((e: AuditEntry) => {
            const Icon = iconFor(e.action);
            return (
              <li key={e.id} className="ml-4">
                <div
                  className={`absolute -left-4 w-8 h-8 rounded-full grid place-items-center ${iconColorFor(e.action)} shadow-md`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-900">{e.who}</span>
                      <span className="text-slate-500 text-xs">{e.action}</span>
                      <span className="font-medium text-slate-900">{e.target}</span>
                      <span className="ml-auto text-xs text-slate-500">{formatTime(e.at)}</span>
                    </div>
                    {(e.before || e.after) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className={`px-3 py-1 rounded-full line-through ${statusColorFor(e.before || "")}`}>{e.before}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className={`px-3 py-1 rounded-full ${statusColorFor(e.after || "")}`}>{e.after}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">{e.details ? e.details.slice(0, 80) + (e.details.length > 80 ? "…" : "") : "Không có ghi chú chi tiết."}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(e)}
                        className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <InfoIcon className="w-3.5 h-3.5" /> Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {selectedEntry ? (
        <Modal open onClose={() => setSelectedEntry(null)} title="Chi tiết audit log">
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusColorFor(selectedEntry.action)}`}>{selectedEntry.action}</span>
                <span>·</span>
                <span>{formatTime(selectedEntry.at)}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Người thực hiện</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedEntry.who}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Đối tượng</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedEntry.target}</p>
                </div>
              </div>
            </div>

            {(selectedEntry.before || selectedEntry.after) && (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Trạng thái trước / sau</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Trước</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{selectedEntry.before}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Sau</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{selectedEntry.after}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Ghi chú kiểm duyệt</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{selectedEntry.details ?? "Không có ghi chú chi tiết cho mục này."}</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
