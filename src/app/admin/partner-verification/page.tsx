"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  MapPin,
  Maximize2,
  Search,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import {
  adminApi,
  type PartnerAttachment,
  type PartnerSubscription,
  type PartnerSubscriptionStatus,
} from "@/services/api/admin/adminApi";

const PAGE_SIZE = 5;

const statusMeta: Record<
  PartnerSubscriptionStatus,
  { label: string; className: string }
> = {
  PAYMENT_PENDING: {
    label: "Chờ thanh toán",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  PAYMENT_FAILED: {
    label: "Thanh toán lỗi",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  PENDING: {
    label: "Chờ duyệt",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  ACTIVE: {
    label: "Đã duyệt",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  REJECTED: {
    label: "Đã từ chối",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  REFUND: {
    label: "Đã hoàn tiền",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  EXPIRED: {
    label: "Hết hạn",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  CANCELLED: {
    label: "Đã từ chối",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};

const fallbackStatusMeta = {
  label: "Không xác định",
  className: "bg-slate-100 text-slate-600 ring-slate-200",
};

function getStatusMeta(status?: PartnerSubscriptionStatus) {
  if (!status) return statusMeta.PENDING;
  return statusMeta[status] ?? fallbackStatusMeta;
}

/**
 * Khi admin từ chối, backend đặt `InvoiceStatus.CANCELLED` (xem
 * `PartnerSubscriptionServiceImpl#verifiedSubscription`) — không có REJECTED.
 * CANCELLED chỉ do luồng từ chối này sinh ra, nên coi cả hai là "đã từ chối".
 */
function isRejected(status?: PartnerSubscriptionStatus) {
  return status === "REJECTED" || status === "CANCELLED";
}

type StatusFilter = "ALL" | PartnerSubscriptionStatus;

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PartnerVerificationPage() {
  const [items, setItems] = useState<PartnerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PartnerSubscription | null>(null);
  const [preview, setPreview] = useState<PartnerAttachment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const attachments = selected?.attachments ?? [];

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "PENDING").length,
      approved: items.filter((item) => item.status === "ACTIVE").length,
      rejected: items.filter((item) => isRejected(item.status)).length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus =
        status === "ALL" ||
        (status === "REJECTED" ? isRejected(item.status) : item.status === status);
      const matchesSearch =
        !keyword ||
        [item.shopName, item.partnerName, item.subscriptionPlanName, item.address]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPartnerSubscriptions({
        sortBy: "createdAt",
        sortDir: "desc",
      });
      const content = Array.isArray(response)
        ? response
        : Array.isArray(response?.content)
          ? response.content
          : [];
      setItems(content);
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách đăng ký đối tác.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  async function updateStatus(id: number, approved: boolean) {
    setSubmittingId(id);
    setError(null);
    try {
      const updated = await adminApi.verifyPartnerSubscription(id, approved);
      const nextStatus: PartnerSubscriptionStatus = approved ? "ACTIVE" : "CANCELLED";
      const normalized = { ...updated, status: updated.status ?? nextStatus, isVerified: approved };
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...normalized } : item));
      setSelected((current) => current?.id === id ? { ...current, ...normalized } : current);
      setToast(approved ? "Đã duyệt hồ sơ đối tác." : "Đã từ chối hồ sơ đối tác.");
      window.setTimeout(() => setToast(null), 2600);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Không thể cập nhật hồ sơ đối tác.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Duyệt đăng ký đối tác"
        subtitle="Kiểm tra hồ sơ cửa hàng và xác nhận quyền đối tác cho người đăng ký."
        actions={<Button variant="outline" size="sm" onClick={() => void loadSubscriptions()} disabled={loading}>Làm mới</Button>}
      />

      <main className="space-y-5 pt-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Building2} label="Tổng hồ sơ" value={stats.total} />
          <StatCard icon={Clock3} label="Chờ duyệt" value={stats.pending} />
          <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} />
          <StatCard icon={XCircle} label="Đã từ chối" value={stats.rejected} />
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <section className="cq-admin-panel">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo tên cửa hàng, đối tác hoặc địa chỉ..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#E6A8C5] focus:ring-4 focus:ring-[#FCEAF3]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                ["ALL", "PENDING", "ACTIVE", "REJECTED"] as StatusFilter[]
              ).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setStatus(value);
                    setPage(1);
                  }}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    status === value
                      ? "bg-[#FFF0F7] text-[#D94A8D] ring-1 ring-[#F1C9DC]"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {value === "ALL" ? "Tất cả" : statusMeta[value].label}
                </button>
              ))}
            </div>
          </div>

          {/* Cùng class bảng với các trang admin khác; table-layout fixed nên
              nội dung tự xuống dòng, không phải scroll ngang. */}
          <table className="cq-admin-table">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[20%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr>
                <th>Đối tác / cửa hàng</th>
                <th>Gói đăng ký</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Đang tải hồ sơ...</td></tr>
              )}
              {!loading && visibleItems.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Không có hồ sơ phù hợp.</td></tr>
              )}
              {!loading && visibleItems.map((item) => {
                const meta = getStatusMeta(item.status);
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F7] text-[#D94A8D]">
                          <Store className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{item.shopName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.partnerName}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-slate-700">{item.subscriptionPlanName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.billingCycle === "YEARLY" ? "Theo năm" : "Theo tháng"}
                      </p>
                    </td>
                    <td className="text-slate-600">{formatDate(item.startDate)}</td>
                    <td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                          Xem hồ sơ
                        </Button>
                        {item.status === "PENDING" && (
                          <Button size="sm" className="gap-1.5" onClick={() => updateStatus(item.id, true)}>
                            <ShieldCheck className="h-4 w-4" />
                            Duyệt
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <p className="text-xs text-slate-500">
              Hiển thị {visibleItems.length} / {filtered.length} hồ sơ
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="rounded-xl bg-[#FFF0F7] px-3 py-2 text-xs font-semibold text-[#D94A8D] ring-1 ring-[#F1C9DC]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="min-w-0 pr-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#D94A8D]">
                  Hồ sơ đối tác · {formatDate(selected.startDate)}
                </p>
                <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
                  {selected.shopName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard icon={Building2} label="Người đăng ký" value={selected.partnerName} />
                <InfoCard icon={Store} label="Tên cửa hàng" value={selected.shopName} />
                <InfoCard icon={ShieldCheck} label="Gói đăng ký" value={selected.subscriptionPlanName} />
                <InfoCard
                  icon={CalendarDays}
                  label="Chu kỳ thanh toán"
                  value={selected.billingCycle === "YEARLY" ? "Theo năm" : "Theo tháng"}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-[#D94A8D]" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Địa chỉ cửa hàng</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {selected.address ?? "Chưa cung cấp"}
                    </p>
                    {selected.latitude && selected.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#D94A8D] hover:underline"
                      >
                        Xem vị trí trên bản đồ <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Hồ sơ hiển thị ngay trong modal (cùng tab). Ảnh/PDF đi qua
                  proxy same-origin nên không lộ link S3. */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Hồ sơ đính kèm</p>
                    <p className="text-xs text-slate-500">
                      Giấy phép và ảnh chứng minh cửa hàng
                    </p>
                  </div>
                </div>

                {attachments.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                    Hồ sơ này chưa đính kèm tài liệu nào.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {attachments.map((attachment) => (
                      <button
                        key={attachment.index}
                        type="button"
                        onClick={() => setPreview(attachment)}
                        className="group overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-[#D94A8D] hover:shadow-sm"
                      >
                        <div className="grid h-24 place-items-center bg-slate-50">
                          {attachment.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={attachment.previewUrl}
                              alt={attachment.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-7 w-7 text-slate-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-2">
                          <Maximize2 className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-[#D94A8D]" />
                          <span className="truncate text-[11px] font-medium text-slate-600">
                            {attachment.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selected.status === "PENDING" && (
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => void updateStatus(selected.id, false)}
                    disabled={submittingId === selected.id}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Từ chối
                  </Button>
                  <Button
                    className="rounded-xl bg-[#D94A8D] text-white hover:bg-[#C43D7D]"
                    onClick={() => void updateStatus(selected.id, true)}
                    disabled={submittingId === selected.id}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Xác nhận duyệt
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[70] flex flex-col bg-slate-950/85 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 pb-3">
            <p className="truncate text-sm font-medium text-white">{preview.name}</p>
            <div className="flex items-center gap-2">
              {attachments.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      const current = attachments.findIndex(
                        (item) => item.index === preview.index,
                      );
                      setPreview(
                        attachments[
                          (current - 1 + attachments.length) % attachments.length
                        ],
                      );
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      const current = attachments.findIndex(
                        (item) => item.index === preview.index,
                      );
                      setPreview(attachments[(current + 1) % attachments.length]);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center overflow-hidden rounded-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            {preview.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.previewUrl}
                alt={preview.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : preview.kind === "pdf" ? (
              <iframe
                src={preview.previewUrl}
                title={preview.name}
                className="h-full w-full"
              />
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                Định dạng này không xem trực tiếp được trong trình duyệt.
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F7] text-[#D94A8D]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F7] text-[#D94A8D]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}