"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/admin/Pagination";
import { adminApi, type AuditLog } from "@/services/api/admin/adminApi";
import { RefreshCcw, Search, User, Server, Clock3, FileText } from "lucide-react";

const PAGE_SIZE = 10;

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function normalizeValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { return value; }
}

function humanizeKey(key: string) {
  const labels: Record<string, string> = {
    subscriptionPlanName: "Tên gói đăng ký",
    subscriptionPlanDescription: "Mô tả",
    priceMonthly: "Giá theo tháng",
    priceYearly: "Giá theo năm",
    configLimit: "Giới hạn gói",
    planType: "Loại gói",
    adFree: "Không quảng cáo",
    exclusiveRoutes: "Hành trình độc quyền",
    prioritySupport: "Hỗ trợ ưu tiên",
    maxOfflineDownloads: "Lượt tải ngoại tuyến tối đa",
    xpBoostPercent: "Phần trăm tăng XP",
    status: "Trạng thái",
    isActive: "Đang hoạt động",
    createdAt: "Ngày tạo",
    updatedAt: "Ngày cập nhật",
  };
  if (labels[key]) return labels[key];
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number") return new Intl.NumberFormat("vi-VN").format(value);
  if (typeof value === "string") {
    const date = new Date(value);
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(date.getTime())) return formatDate(value);
    return value;
  }
  return String(value);
}

export default function ReviewHistoryPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [tableName, setTableName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAuditLogs({
        page: page - 1,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDir: "desc",
        search: search.trim() || undefined,
        action: action || undefined,
        tableName: tableName || undefined,
        from: from ? `${from}T00:00:00` : undefined,
        to: to ? `${to}T23:59:59` : undefined,
      });
      setItems(response.content ?? []);
      setTotalPages(Math.max(1, response.page?.totalPages ?? response.totalPages ?? 1));
      setTotalElements(response.page?.totalElements ?? response.totalElements ?? response.content?.length ?? 0);
    } catch (loadError) {
      setItems([]);
      setTotalPages(1);
      setTotalElements(0);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải audit log.");
    } finally {
      setLoading(false);
    }
  }, [action, from, page, search, tableName, to]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, action, tableName, from, to]);

  const actions = useMemo(() => Array.from(new Set(items.map((item) => item.action).filter(Boolean))), [items]);
  const tables = useMemo(() => Array.from(new Set(items.map((item) => item.tableName).filter(Boolean))) as string[], [items]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch sử duyệt & Audit log"
        subtitle="Theo dõi người thực hiện, hành động và nội dung thay đổi trong hệ thống."
        actions={
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void load()} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </Button>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_180px_150px_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo mã bản ghi..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#E6A8C5] focus:ring-4 focus:ring-[#FCEAF3]" />
          </div>
          <select value={action} onChange={(event) => setAction(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="">Tất cả hành động</option>
            {actions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={tableName} onChange={(event) => setTableName(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="">Tất cả bảng</option>
            {tables.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" />
        </div>
        <p className="mt-3 text-sm text-slate-500">{loading ? "Đang tải..." : `${totalElements} bản ghi`}</p>
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5">Người thực hiện</th>
                <th className="px-5 py-3.5">Hành động</th>
                <th className="px-5 py-3.5">Đối tượng</th>
                <th className="px-5 py-3.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">Đang tải audit log...</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">Không có dữ liệu phù hợp.</td></tr>}
              {!loading && items.map((item) => (
                <tr key={item.logId} className="border-b border-slate-100 last:border-0 hover:bg-[#FFF9FC]">
                  <td className="px-5 py-4 text-sm text-slate-600">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800">{item.actor?.displayName || item.actor?.username || "Hệ thống"}</p>
                    <p className="text-xs text-slate-500">{item.actor?.role || "SYSTEM"}</p>
                  </td>
                  <td className="px-5 py-4"><span className="rounded-full bg-[#FFF0F7] px-2.5 py-1 text-xs font-semibold text-[#D94A8D] ring-1 ring-[#F1C9DC]">{item.action}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-700"><span className="font-medium">{item.tableName || "—"}</span><span className="ml-1 text-slate-400">#{item.recordId || "—"}</span></td>
                  <td className="px-5 py-4 text-right"><Button size="sm" variant="outline" onClick={() => setSelected(item)}>Xem</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-4"><Pagination page={page} totalPages={totalPages} totalItems={totalElements} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-7 sm:py-5">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#D94A8D]">
                  Audit #{selected.logId}
                </p>
                <h2 className="mt-1 truncate text-lg font-semibold text-slate-900 sm:text-xl">
                  {selected.action}
                </h2>
              </div>
              <Button
                variant="outline"
                className="shrink-0 rounded-xl"
                onClick={() => setSelected(null)}
              >
                Đóng
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <Info icon={User} label="Người thực hiện" value={selected.actor?.displayName || selected.actor?.username || "Hệ thống"} />
                  <Info icon={Server} label="IP" value={selected.ipAddress || "—"} />
                  <Info icon={Clock3} label="Thời gian" value={formatDate(selected.createdAt)} />
                </div>

                <div className="grid items-stretch gap-5 lg:grid-cols-2">
                  <DataPanel title="Dữ liệu cũ" value={selected.oldValue} />
                  <DataPanel title="Dữ liệu mới" value={selected.newValue} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        <Icon className="h-4 w-4 text-[#D94A8D]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

function DataPanel({ title, value }: { title: string; value: unknown }) {
  const normalized = normalizeValue(value);

  return (
    <div className="h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <FileText className="h-4 w-4 text-[#D94A8D]" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      <div className="pt-4">
        <ValueView value={normalized} />
      </div>
    </div>
  );
}

function ValueView({ value, level = 0 }: { value: unknown; level?: number }) {
  if (value === null || value === undefined || value === "") {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center rounded-xl bg-slate-50 px-4 text-center">
        <FileText className="h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-600">Không có dữ liệu</p>
        <p className="mt-1 text-xs text-slate-400">Không có nội dung để hiển thị.</p>
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-sm text-slate-500">Danh sách trống</p>;
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-400">Mục {index + 1}</p>
            <ValueView value={item} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="divide-y divide-slate-100">
        {Object.entries(value as Record<string, unknown>).map(([key, child]) => {
          const isNested = child !== null && typeof child === "object";

          if (isNested) {
            return (
              <div key={key} className="py-3 first:pt-0 last:pb-0">
                <p className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                  {humanizeKey(key)}
                </p>
                <div className="pl-1">
                  <ValueView value={child} level={level + 1} />
                </div>
              </div>
            );
          }

          const displayed = formatDisplayValue(child);
          const allowWrap = typeof child === "string" && child.length > 32;

          return (
            <div
              key={key}
              className="grid grid-cols-[minmax(140px,0.9fr)_minmax(0,1.1fr)] items-start gap-4 py-3 first:pt-0 last:pb-0"
            >
              <p className="text-sm leading-5 text-slate-500">{humanizeKey(key)}</p>
              <p
                className={`min-w-0 text-sm font-semibold leading-5 text-slate-800 ${
                  allowWrap ? "break-words" : "whitespace-nowrap"
                }`}
                title={!allowWrap ? displayed : undefined}
              >
                {displayed}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return <p className="text-sm font-medium text-slate-800">{formatDisplayValue(value)}</p>;
}