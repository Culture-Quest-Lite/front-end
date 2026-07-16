"use client";

import { useMemo, useState } from "react";
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
  Search,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import type {
  PartnerSubscription,
  PartnerSubscriptionStatus,
} from "@/services/api/admin/adminApi";

/**
 * Trang hiện dùng dữ liệu mẫu để có thể làm UI trước khi backend hoàn thiện.
 * Khi backend có API, đổi thành false và gọi:
 * adminApi.getPartnerSubscriptions(...)
 * adminApi.verifyPartnerSubscription(item.id, true | false)
 */
const USE_MOCK_DATA = true;
const PAGE_SIZE = 5;

const mockSubscriptions: PartnerSubscription[] = [
  {
    id: 1042,
    partnerId: 221,
    partnerName: "Nguyễn Minh Anh",
    subscriptionPlanId: 6,
    subscriptionPlanName: "Partner Pro",
    shopName: "Gốm Việt Heritage",
    address: "28 Nguyễn Thái Học, Ba Đình, Hà Nội",
    latitude: 21.0291,
    longitude: 105.8332,
    billingCycle: "YEARLY",
    status: "PENDING",
    startDate: "2026-07-10T08:30:00",
    documentUrl: "https://example.com/document-1042.pdf",
    medias: [
      {
        mediaId: 1,
        fileUrl: "https://example.com/shop-1042.jpg",
        fileName: "mat-tien-cua-hang.jpg",
        mediaType: "IMAGE",
      },
    ],
  },
  {
    id: 1041,
    partnerId: 218,
    partnerName: "Trần Quốc Bảo",
    subscriptionPlanId: 6,
    subscriptionPlanName: "Partner Pro",
    shopName: "Mây Tre Hội An",
    address: "71 Trần Phú, Hội An, Quảng Nam",
    latitude: 15.8794,
    longitude: 108.334,
    billingCycle: "MONTHLY",
    status: "PENDING",
    startDate: "2026-07-09T14:10:00",
    documentUrl: "https://example.com/document-1041.pdf",
  },
  {
    id: 1038,
    partnerId: 205,
    partnerName: "Lê Thu Hà",
    subscriptionPlanId: 6,
    subscriptionPlanName: "Partner Pro",
    shopName: "Sắc Việt Souvenir",
    address: "15 Lê Lợi, Huế",
    billingCycle: "YEARLY",
    status: "ACTIVE",
    startDate: "2026-07-05T09:00:00",
    endDate: "2027-07-05T09:00:00",
    isVerified: true,
    documentUrl: "https://example.com/document-1038.pdf",
  },
  {
    id: 1035,
    partnerId: 199,
    partnerName: "Phạm Hoàng Long",
    subscriptionPlanId: 6,
    subscriptionPlanName: "Partner Pro",
    shopName: "Đặc Sản Miền Trung",
    address: "102 Võ Nguyên Giáp, Đà Nẵng",
    billingCycle: "MONTHLY",
    status: "REJECTED",
    startDate: "2026-07-02T11:20:00",
    isVerified: false,
    documentUrl: "https://example.com/document-1035.pdf",
  },
  {
    id: 1032,
    partnerId: 188,
    partnerName: "Vũ Thanh Tùng",
    subscriptionPlanId: 6,
    subscriptionPlanName: "Partner Pro",
    shopName: "Thổ Cẩm Tây Bắc",
    address: "36 Fansipan, Sa Pa, Lào Cai",
    billingCycle: "YEARLY",
    status: "PAYMENT_PENDING",
    startDate: "2026-06-28T16:45:00",
  },
  {
    id: 1029,
    partnerId: 180,
    partnerName: "Đỗ Khánh Linh",
    subscriptionPlanId: 6,
    subscriptionPlanName: "Partner Pro",
    shopName: "Làng Nghề Việt",
    address: "Bát Tràng, Gia Lâm, Hà Nội",
    billingCycle: "YEARLY",
    status: "PENDING",
    startDate: "2026-06-25T10:15:00",
    documentUrl: "https://example.com/document-1029.pdf",
  },
];

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
};

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
  const [items, setItems] = useState(mockSubscriptions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PartnerSubscription | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "PENDING").length,
      approved: items.filter((item) => item.status === "ACTIVE").length,
      rejected: items.filter((item) => item.status === "REJECTED").length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === "ALL" || item.status === status;
      const matchesSearch =
        !keyword ||
        [item.shopName, item.partnerName, item.subscriptionPlanName, item.address]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword)) ||
        String(item.id).includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [items, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function updateStatus(id: number, approved: boolean) {
    // Khi backend hoàn thiện, thay phần cập nhật local bằng:
    // await adminApi.verifyPartnerSubscription(id, approved)
    if (!USE_MOCK_DATA) return;

    const nextStatus: PartnerSubscriptionStatus = approved
      ? "ACTIVE"
      : "REJECTED";
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: nextStatus, isVerified: approved }
          : item,
      ),
    );
    setSelected((current) =>
      current?.id === id
        ? { ...current, status: nextStatus, isVerified: approved }
        : current,
    );
    setToast(approved ? "Đã duyệt hồ sơ đối tác." : "Đã từ chối hồ sơ đối tác.");
    window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <PageHeader
        title="Duyệt đăng ký đối tác"
        description="Kiểm tra hồ sơ cửa hàng và xác nhận quyền Partner cho người đăng ký."
      />

      <main className="space-y-5 px-6 pb-8 pt-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Building2} label="Tổng hồ sơ" value={stats.total} />
          <StatCard icon={Clock3} label="Chờ duyệt" value={stats.pending} />
          <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} />
          <StatCard icon={XCircle} label="Đã từ chối" value={stats.rejected} />
        </div>

        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo cửa hàng, đối tác hoặc mã hồ sơ..."
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-5 py-3.5">Đối tác / cửa hàng</th>
                  <th className="px-5 py-3.5">Gói đăng ký</th>
                  <th className="px-5 py-3.5">Ngày gửi</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => {
                  const meta = statusMeta[item.status ?? "PENDING"];
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-[#FFF9FC]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0F7] text-[#D94A8D]">
                            <Store className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{item.shopName}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.partnerName} · #{item.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {item.subscriptionPlanName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.billingCycle === "YEARLY" ? "Theo năm" : "Theo tháng"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(item.startDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="h-9 rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50"
                            onClick={() => setSelected(item)}
                          >
                            Xem hồ sơ
                          </Button>
                          {item.status === "PENDING" && (
                            <Button
                              className="h-9 rounded-xl bg-[#D94A8D] px-3 text-white shadow-sm hover:bg-[#C43D7D]"
                              onClick={() => updateStatus(item.id, true)}
                            >
                              <ShieldCheck className="mr-1.5 h-4 w-4" />
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

            {visibleItems.length === 0 && (
              <div className="px-6 py-14 text-center text-sm text-slate-500">
                Không tìm thấy hồ sơ phù hợp.
              </div>
            )}
          </div>

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
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#D94A8D]">
                  Hồ sơ #{selected.id}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
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

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Giấy tờ xác minh</p>
                      <p className="text-xs text-slate-500">
                        Giấy phép hoặc tài liệu chứng minh cửa hàng
                      </p>
                    </div>
                  </div>
                  {selected.documentUrl ? (
                    <a
                      href={selected.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Mở tài liệu
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-rose-600">Chưa có tài liệu</span>
                  )}
                </div>
              </div>

              {selected.status === "PENDING" && (
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => updateStatus(selected.id, false)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Từ chối
                  </Button>
                  <Button
                    className="rounded-xl bg-[#D94A8D] text-white hover:bg-[#C43D7D]"
                    onClick={() => updateStatus(selected.id, true)}
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
