"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/ui-bits";
import { Pagination } from "@/components/admin/Pagination";
import { audit, type AuditEntry } from "@/data/demo";
import {
  Check,
  X,
  Pencil,
  Lock,
  ArrowRight,
  Info as InfoIcon,
  RefreshCcw,
  Search,
  History,
  ScrollText,
} from "lucide-react";

const PAGE_SIZE = 6;

const iconFor = (a: string) =>
  a.includes("Duyệt") ? Check : a.includes("Từ chối") ? X : a.includes("Khoá") ? Lock : Pencil;

const iconColorFor = (a: string) =>
  a.includes("Duyệt")
    ? "bg-emerald-500 text-white"
    : a.includes("Từ chối")
      ? "bg-red-500 text-white"
      : a.includes("Khoá")
        ? "bg-amber-500 text-white"
        : "bg-blue-500 text-white";

const actionBadgeFor = (action: string) => {
  if (action.includes("Duyệt")) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (action.includes("Từ chối")) return "bg-red-50 text-red-700 ring-red-200";
  if (action.includes("Khoá")) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-blue-50 text-blue-700 ring-blue-200";
};

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

type Tab = "approval" | "audit";
type DateRange = "7" | "30" | "all";

export default function ReviewHistoryPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("approval");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    setEntries(audit);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const now = Date.now();
    const daysMs = dateRange === "7" ? 7 : dateRange === "30" ? 30 : Infinity;

    return entries.filter((e) => {
      const inRange = dateRange === "all" || now - new Date(e.at).getTime() <= daysMs * 86400000;
      const isApproval = e.action.includes("Duyệt") || e.action.includes("Từ chối");
      const matchesTab = tab === "approval" ? isApproval : true;
      const matchesAction = actionFilter === "all" || e.action === actionFilter;
      const matchesSearch =
        !search ||
        e.who.toLowerCase().includes(search.toLowerCase()) ||
        e.target.toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase());
      return inRange && matchesTab && matchesAction && matchesSearch;
    });
  }, [entries, tab, dateRange, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [tab, dateRange, actionFilter, search]);

  const actionTypes = useMemo(() => [...new Set(entries.map((e) => e.action))], [entries]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch sử duyệt & Audit log"
        subtitle="Theo dõi hoạt động kiểm duyệt và thay đổi hệ thống (BR-71)."
        actions={
          <Button variant="outline" size="sm" className="gap-2" onClick={loadEntries}>
            <RefreshCcw className="w-4 h-4" /> Làm mới
          </Button>
        }
      />

      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setTab("approval")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            tab === "approval" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History className="h-4 w-4" /> Lịch sử duyệt
        </button>
        <button
          type="button"
          onClick={() => setTab("audit")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            tab === "audit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ScrollText className="h-4 w-4" /> Audit log
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo người thực hiện, đối tượng, hành động…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="7">7 ngày qua</option>
            <option value="30">30 ngày</option>
            <option value="all">Tất cả</option>
          </select>
          {tab === "audit" ? (
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">Tất cả hành động</option>
              {actionTypes.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {loading ? "Đang tải…" : `${filtered.length} mục`}
        </p>
      </div>

      {tab === "approval" ? (
        <div className="card-elev rounded-2xl p-4">
          {paginated.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Không có lịch sử duyệt phù hợp.</p>
          ) : (
            <ol className="relative ml-4 space-y-5 border-l-2 border-slate-200">
              {paginated.map((e) => {
                const Icon = iconFor(e.action);
                return (
                  <li key={e.id} className="ml-4">
                    <div className={`absolute -left-4 grid h-8 w-8 place-items-center rounded-full shadow-md ${iconColorFor(e.action)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-slate-900">{e.who}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${actionBadgeFor(e.action)}`}>{e.action}</span>
                          <span className="font-medium text-slate-900">{e.target}</span>
                          <span className="ml-auto text-xs text-slate-500">{formatTime(e.at)}</span>
                        </div>
                        {(e.before || e.after) && (
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                            <span className={`rounded-full px-3 py-1 line-through ${statusColorFor(e.before || "")}`}>{e.before}</span>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <span className={`rounded-full px-3 py-1 ${statusColorFor(e.after || "")}`}>{e.after}</span>
                          </div>
                        )}
                        {e.details ? (
                          <p className="text-xs text-slate-500">{e.details}</p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 font-semibold">Người thực hiện</th>
                  <th className="px-4 py-3 font-semibold">Hành động</th>
                  <th className="px-4 py-3 font-semibold">Đối tượng</th>
                  <th className="px-4 py-3 font-semibold">Thay đổi</th>
                  <th className="px-4 py-3 font-semibold text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Không có bản ghi audit phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginated.map((e) => (
                    <tr key={e.id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatTime(e.at)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{e.who}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${actionBadgeFor(e.action)}`}>
                          {e.action}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">{e.target}</td>
                      <td className="px-4 py-3">
                        {e.before || e.after ? (
                          <span className="text-xs text-slate-500">
                            {e.before ?? "—"} → {e.after ?? "—"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(e)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          <InfoIcon className="h-3.5 w-3.5" /> Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {selectedEntry ? (
        <Modal open onClose={() => setSelectedEntry(null)} title="Chi tiết audit log">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={`rounded-full px-2.5 py-1 text-[11px] ring-1 ${actionBadgeFor(selectedEntry.action)}`}>
                  {selectedEntry.action}
                </span>
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
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Trạng thái trước / sau</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Trước</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{selectedEntry.before ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Sau</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{selectedEntry.after ?? "—"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Ghi chú</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {selectedEntry.details ?? "Không có ghi chú chi tiết."}
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedEntry(null)}>Đóng</Button>
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
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
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
