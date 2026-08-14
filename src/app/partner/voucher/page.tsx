"use client";

import { useEffect, useMemo, useState } from "react";
import { PageLoading } from "@/components/app/page-loading";
import { PageHeader } from "@/components/app/ui-bits";
import {
  partnerApi,
  type VoucherResponse,
  type VoucherRequest,
  type CreateVoucherRequest,
  type VoucherDiscountType,
  type VoucherStatus,
  type VoucherUsageResponse,
} from "@/services/api/partner/partnerApi";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Ticket,
  Power,
  PowerOff,
  Loader2,
  ScanLine,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  ImageOff,
} from "lucide-react";

const PAGE_SIZE = 8;

const STATUS_FILTERS: { value: VoucherStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Tạm ngưng" },
  { value: "EXPIRED", label: "Hết hạn" },
];

// Record<VoucherStatus, ...> cần đủ cả 5 khoá kể cả DELETED (voucher xoá
// mềm thường không xuất hiện trong danh sách mặc định, nhưng vẫn cần khai
// báo đủ để khớp type).
const statusLabels: Record<VoucherStatus, string> = {
  PENDING: "Chờ duyệt",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Tạm ngưng",
  EXPIRED: "Hết hạn",
  DELETED: "Đã xoá",
};

const statusClasses: Record<VoucherStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-red-100 text-red-700",
  DELETED: "bg-slate-100 text-slate-400",
};

const DEMO_VOUCHERS: VoucherResponse[] = [
  {
    voucherId: 1001,
    imageUrl: null,
    partnerId: 501,
    partnerName: "Đối tác demo",
    voucherCode: "DEMO2026",
    voucherName: "Giảm giá mùa hè",
    description: "Dữ liệu demo giúp bạn nhìn giao diện quản lý voucher.",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxDiscountAmount: 100000,
    minOrderAmount: 200000,
    pointsRequired: 120,
    quantityTotal: 120,
    quantityRemaining: 54,
    status: "ACTIVE",
    startDate: "2026-07-01T00:00:00",
    endDate: "2026-07-31T23:59:59",
    createdAt: "2026-06-20T10:00:00",
    updatedAt: "2026-06-20T10:00:00",
  },
  {
    voucherId: 1002,
    imageUrl: null,
    partnerId: 501,
    partnerName: "Đối tác demo",
    voucherCode: "WELCOME50",
    voucherName: "Voucher chào mừng",
    description: "Giảm 50k cho đơn hàng đầu tiên.",
    discountType: "FIXED_AMOUNT",
    discountValue: 50000,
    maxDiscountAmount: null,
    minOrderAmount: 150000,
    pointsRequired: 80,
    quantityTotal: 80,
    quantityRemaining: 12,
    status: "INACTIVE",
    startDate: "2026-06-15T00:00:00",
    endDate: "2026-08-15T23:59:59",
    createdAt: "2026-06-18T08:30:00",
    updatedAt: "2026-06-18T08:30:00",
  },
  {
    voucherId: 1003,
    imageUrl: null,
    partnerId: 501,
    partnerName: "Đối tác demo",
    voucherCode: "HOTDEAL10",
    voucherName: "Giảm trực tiếp 10%",
    description: "Voucher mẫu dùng để minh họa giao diện quản lý.",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscountAmount: 50000,
    minOrderAmount: 100000,
    pointsRequired: 60,
    quantityTotal: 60,
    quantityRemaining: 0,
    status: "EXPIRED",
    startDate: "2026-05-01T00:00:00",
    endDate: "2026-06-01T23:59:59",
    createdAt: "2026-04-20T11:45:00",
    updatedAt: "2026-06-01T23:59:59",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatDiscount(voucher: VoucherResponse) {
  if (voucher.discountType === "PERCENTAGE") {
    const max = voucher.maxDiscountAmount
      ? ` (tối đa ${formatCurrency(voucher.maxDiscountAmount)})`
      : "";
    return `Giảm ${voucher.discountValue}%${max}`;
  }
  return `Giảm ${formatCurrency(voucher.discountValue)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function todayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type SaveVoucherPayload = VoucherRequest | CreateVoucherRequest;

/**
 * Tạo voucher KHÔNG truyền status/voucherCode: backend tự sinh mã và luôn ép
 * PENDING. Sau khi tạo xong, hàng voucher vẫn có nút cập nhật trạng thái.
 */

type FormState = {
  code: string; // chỉ hiển thị/dùng khi sửa — KHÔNG cho phép chỉnh sửa
  title: string;
  description: string;
  discountType: VoucherDiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  pointsRequired: string;
  quantityTotal: string;
  status: VoucherStatus;
  startDate: string;
  endDate: string;
};

const emptyForm: FormState = {
  code: "",
  title: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "10",
  maxDiscountAmount: "",
  minOrderAmount: "",
  pointsRequired: "100",
  quantityTotal: "100",
  // Chỉ dùng khi sửa voucher. Khi tạo mới không truyền status lên backend.
  status: "PENDING",
  startDate: todayPlusDays(0),
  endDate: todayPlusDays(30),
};

export default function PartnerVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | "all">("all");

  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDemoMode = !isLoading && vouchers.length === 0;
  const visibleVouchers = isDemoMode ? DEMO_VOUCHERS : vouchers.filter((voucher) => voucher.status !== "DELETED");
  const displayVouchers = visibleVouchers;
  const displayTotalItems = visibleVouchers.length;
  const displayTotalPages = isDemoMode ? 1 : totalPages;

  // Backend nhận đúng MỘT ảnh ở field `imageFile`, dùng chung cho cả tạo mới
  // lẫn chỉnh sửa. Bỏ trống khi sửa = giữ nguyên ảnh cũ.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Ảnh hiện tại của voucher đang sửa, chỉ để xem trước.
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [useDialogOpen, setUseDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadVouchers() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const userId = await partnerApi.getCurrentUserId();

        const response = await partnerApi.getVouchersByUserId(userId, {
          page: page - 1,
          size: PAGE_SIZE,
          search: query.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        });

        if (cancelled) return;

        setCurrentUserId(userId);
        setVouchers(response.content);
        setTotalItems(response.page.totalElements);
        setTotalPages(Math.max(1, response.page.totalPages || 1));
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Không thể tải danh sách voucher.",
        );
        setVouchers([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadVouchers();
    return () => {
      cancelled = true;
    };
  }, [page, query, statusFilter, reloadVersion]);

  function refresh() {
    setReloadVersion((v) => v + 1);
  }

  function handleSearchChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleStatusFilterChange(value: VoucherStatus | "all") {
    setStatusFilter(value);
    setPage(1);
  }

  function openCreate() {
    setPendingDeleteId(null);
    setUseDialogOpen(false);
    setForm(emptyForm);
    setSelectedFile(null);
    setExistingImageUrl(null);
    setEditingId(null);
    setFormError(null);
    setDialog("create");
  }

  function openEdit(voucher: VoucherResponse) {
    setPendingDeleteId(null);
    setUseDialogOpen(false);
    setForm({
      code: voucher.voucherCode,
      title: voucher.voucherName,
      description: voucher.description ?? "",
      discountType: voucher.discountType,
      discountValue: String(voucher.discountValue),
      maxDiscountAmount: voucher.maxDiscountAmount ? String(voucher.maxDiscountAmount) : "",
      minOrderAmount: voucher.minOrderAmount ? String(voucher.minOrderAmount) : "",
      pointsRequired: String(voucher.pointsRequired),
      quantityTotal: String(voucher.quantityTotal),
      status: voucher.status,
      startDate: toDateInputValue(voucher.startDate),
      endDate: toDateInputValue(voucher.endDate),
    });
    setSelectedFile(null);
    setExistingImageUrl(voucher.imageUrl ?? null);
    setEditingId(voucher.voucherId);
    setFormError(null);
    setDialog("edit");
  }

  function buildPayload(): SaveVoucherPayload | null {
    const title = form.title.trim();
    if (!title) {
      setFormError("Tên voucher không được để trống.");
      return null;
    }

    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setFormError("Giá trị giảm phải lớn hơn 0.");
      return null;
    }
    if (form.discountType === "PERCENTAGE" && discountValue > 100) {
      setFormError("Giảm theo % không được vượt quá 100%.");
      return null;
    }

    const pointsRequired = Number(form.pointsRequired);
    if (!Number.isFinite(pointsRequired) || pointsRequired < 0) {
      setFormError("Điểm yêu cầu để đổi phải là số >= 0.");
      return null;
    }

    const quantityTotal = Number(form.quantityTotal);
    if (!Number.isInteger(quantityTotal) || quantityTotal < 1) {
      setFormError("Số lượng voucher phải là số nguyên >= 1.");
      return null;
    }

    if (!form.startDate || !form.endDate) {
      setFormError("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
      return null;
    }
    if (form.startDate > form.endDate) {
      setFormError("Ngày bắt đầu phải trước ngày kết thúc.");
      return null;
    }

    const maxDiscountAmount =
      form.discountType === "PERCENTAGE" && form.maxDiscountAmount.trim()
        ? Number(form.maxDiscountAmount)
        : undefined;
    const minOrderAmount = form.minOrderAmount.trim() ? Number(form.minOrderAmount) : undefined;

    if (maxDiscountAmount !== undefined && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount < 0)) {
      setFormError("Giảm tối đa phải là số >= 0.");
      return null;
    }
    if (minOrderAmount !== undefined && (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)) {
      setFormError("Đơn hàng tối thiểu phải là số >= 0.");
      return null;
    }
    const basePayload: CreateVoucherRequest = {
      voucherName: title,
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      pointsRequired,
      quantityTotal,
      startDate: `${form.startDate}T00:00:00`,
      endDate: `${form.endDate}T23:59:59`,
      imageFile: selectedFile,
    };

    if (dialog === "edit") {
      return {
        ...basePayload,
        // Backend so sánh voucherCode gửi lên với mã hiện tại, sai là báo lỗi.
        voucherCode: form.code,
        status: form.status,
      };
    }

    return basePayload;
  }

  async function handleSave() {
    const payload = buildPayload();
    if (!payload) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (dialog === "create") {
        await partnerApi.createVoucher(payload as CreateVoucherRequest);
      } else if (editingId) {
        await partnerApi.updateVoucher(editingId, payload as VoucherRequest);
      }
      setDialog(null);
      refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể lưu voucher.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(voucher: VoucherResponse) {
    setActionError(null);
    setStatusLoadingId(voucher.voucherId);
    try {
      const nextStatus: VoucherStatus = voucher.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      // Không có endpoint riêng đổi status — changeVoucherStatus sẽ PUT lại
      // toàn bộ voucher kèm voucherCode khớp mã hiện tại.
      await partnerApi.changeVoucherStatus(voucher, nextStatus);
      refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Không thể cập nhật trạng thái voucher.",
      );
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await partnerApi.deleteVoucher(pendingDeleteId);
      setPendingDeleteId(null);
      refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể xoá voucher.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voucher giảm giá"
        subtitle={
          currentUserId
            ? `Tạo và quản lý voucher của tài khoản hiện tại (userId: ${currentUserId}).`
            : "Tạo và quản lý voucher đổi bằng điểm cho khách hàng của bạn."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDialog(null);
                setPendingDeleteId(null);
                setUseDialogOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              <ScanLine className="h-4 w-4" /> Xác nhận sử dụng
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" /> Tạo voucher mới
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo mã hoặc tên voucher"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleStatusFilterChange(item.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${statusFilter === item.value
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      ) : null}

      {isLoading ? (
        <PageLoading className="min-h-[320px] rounded-2xl border border-slate-200 shadow-none" spinnerClassName="h-6 w-6" />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Bảng quản lý voucher</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isDemoMode
                  ? "Hiển thị dữ liệu demo khi danh sách voucher thực tế đang trống."
                  : "Duyệt và quản lý voucher hiện có của cửa hàng."
                }
              </p>
            </div>
            {isDemoMode ? (
              <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 sm:mt-0">
                Dữ liệu demo
              </span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã</th>
                  <th className="px-4 py-3 font-semibold">Ảnh</th>
                  <th className="px-4 py-3 font-semibold">Tên voucher</th>
                  <th className="px-4 py-3 font-semibold">Giảm</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Còn / Tổng</th>
                  <th className="px-4 py-3 font-semibold">Hết hạn</th>
                  <th className="px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayVouchers.map((voucher) => {
                  const used = Math.max(0, voucher.quantityTotal - voucher.quantityRemaining);
                  const isDemoRow = isDemoMode;
                  return (
                    <VoucherTableRow
                      key={voucher.voucherId}
                      voucher={voucher}
                      used={used}
                      isDemo={isDemoRow}
                      isStatusLoading={statusLoadingId === voucher.voucherId}
                      onEdit={() => (isDemoRow ? undefined : openEdit(voucher))}
                      onDelete={() => (isDemoRow ? undefined : setPendingDeleteId(voucher.voucherId))}
                      onToggleStatus={() => (isDemoRow ? undefined : void handleToggleStatus(voucher))}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <PaginationBar
        page={page}
        totalPages={displayTotalPages}
        totalItems={displayTotalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {dialog ? (
        <VoucherFormDialog
          mode={dialog}
          form={form}
          setForm={setForm}
          formError={formError}
          isSubmitting={isSubmitting}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          existingImageUrl={existingImageUrl}
          onCancel={() => setDialog(null)}
          onSubmit={handleSave}
        />
      ) : null}

      {pendingDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Xoá voucher</h2>
            <p className="mt-2 text-sm text-slate-500">
              Voucher sẽ được đánh dấu là đã xoá (xoá mềm) và không còn hiển thị cho khách hàng.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                disabled={isDeleting}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? "Đang xoá..." : "Xoá voucher"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {useDialogOpen ? <UseVoucherDialog onClose={() => setUseDialogOpen(false)} /> : null}
    </div>
  );
}

function VoucherTableRow({
  voucher,
  used,
  isDemo,
  isStatusLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  voucher: VoucherResponse;
  used: number;
  isDemo: boolean;
  isStatusLoading: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
}) {
  return (
    <tr>
      <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900">
        {voucher.voucherCode}
      </td>
      <td className="px-4 py-4">
        {voucher.imageUrl ? (
          <img
            src={voucher.imageUrl}
            alt={voucher.voucherName}
            loading="lazy"
            className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="font-semibold text-slate-900">{voucher.voucherName}</div>
        <div className="mt-1 text-xs text-slate-500">{voucher.description ?? "-"}</div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-700">{formatDiscount(voucher)}</td>
      <td className="whitespace-nowrap px-4 py-4">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[voucher.status]}`}>
          {statusLabels[voucher.status]}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
        {voucher.quantityRemaining}/{voucher.quantityTotal}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-700">{formatDate(voucher.endDate)}</td>
      <td className="whitespace-nowrap px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={isDemo}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Sửa
          </button>
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={isDemo || isStatusLoading || voucher.status === "EXPIRED" || voucher.status === "DELETED"}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStatusLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : voucher.status === "ACTIVE" ? (
              <PowerOff className="h-3.5 w-3.5" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            {voucher.status === "ACTIVE"
              ? "Tạm ngưng"
              : voucher.status === "PENDING"
                ? "Kích hoạt"
                : "Bật lại"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDemo}
            className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xoá
          </button>
        </div>
      </td>
    </tr>
  );
}

function VoucherFormDialog({
  mode,
  form,
  setForm,
  formError,
  isSubmitting,
  selectedFile,
  setSelectedFile,
  existingImageUrl,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  formError: string | null;
  isSubmitting: boolean;
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  existingImageUrl: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  // URL preview phải được revoke khi đổi/bỏ ảnh, nếu không sẽ rò rỉ blob.
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {mode === "create" ? "Tạo voucher mới" : "Chỉnh sửa voucher"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Nhập thông tin voucher. Phần nội dung có thể cuộn bên trong modal.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
          {mode === "edit" ? (
            <Field label="Mã voucher (không thể chỉnh sửa)">
              <input
                value={form.code}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-500"
              />
            </Field>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Mã voucher sẽ được hệ thống tự tạo sau khi lưu. Khi tạo mới, hệ thống không gửi
              trạng thái lên backend; backend sẽ tự set trạng thái ban đầu. Sau khi tạo xong,
              bạn có thể dùng nút <strong>Kích hoạt / Tạm ngưng</strong> trên card voucher.
            </p>
          )}

          <Field label="Tên voucher">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Giảm giá mùa hè"
              maxLength={150}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </Field>

          <Field label="Mô tả (tuỳ chọn)">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              maxLength={300}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </Field>

          <Field label="Hình thức giảm giá">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, discountType: "PERCENTAGE" })}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${form.discountType === "PERCENTAGE"
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                Theo % (VD: 10%)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, discountType: "FIXED_AMOUNT" })}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${form.discountType === "FIXED_AMOUNT"
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                Số tiền cố định (VNĐ)
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={form.discountType === "PERCENTAGE" ? "Giá trị giảm (%)" : "Giá trị giảm (VNĐ)"}>
              <input
                type="number"
                min={0}
                max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "PERCENTAGE" ? "10" : "10000"}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </Field>
            {form.discountType === "PERCENTAGE" ? (
              <Field label="Giảm tối đa (VNĐ, tuỳ chọn)">
                <input
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount}
                  onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                  placeholder="100000"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </Field>
            ) : (
              <Field label="Đơn tối thiểu (VNĐ, tuỳ chọn)">
                <input
                  type="number"
                  min={0}
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="25000"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Điểm yêu cầu để đổi">
              <input
                type="number"
                min={0}
                value={form.pointsRequired}
                onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </Field>
            <Field label="Số lượng voucher">
              <input
                type="number"
                min={1}
                value={form.quantityTotal}
                onChange={(e) => setForm({ ...form, quantityTotal: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </Field>
          </div>
          {mode === "edit" ? (
            <p className="text-xs text-slate-400">
              Lưu ý: thay đổi &quot;Số lượng voucher&quot; sẽ tự động cộng/trừ vào số lượng còn lại theo
              chênh lệch so với giá trị cũ.
            </p>
          ) : null}

          {/* Khi tạo mới không truyền status. Khi sửa mới cho chọn trạng thái để PUT cập nhật voucher. */}
          {mode === "edit" ? (
            <Field label="Trạng thái">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as VoucherStatus })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              >
                <option value="PENDING">Chờ duyệt</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm ngưng</option>
                <option value="EXPIRED">Hết hạn</option>
              </select>
            </Field>
          ) : null}

          {/* Backend chỉ lưu 1 ảnh (`imageFile`), dùng chung cho tạo mới và sửa. */}
          <Field label="Hình ảnh voucher (tuỳ chọn)">
            {mode === "edit" && !selectedFile ? (
              existingImageUrl ? (
                <div className="mb-3 flex items-center gap-3">
                  <img
                    src={existingImageUrl}
                    alt=""
                    className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                  />
                  <span className="text-xs text-slate-400">
                    Ảnh hiện tại. Chọn ảnh mới để thay thế, bỏ trống để giữ nguyên.
                  </span>
                </div>
              ) : (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-400">
                  <ImageOff className="h-4 w-4" /> Voucher này chưa có ảnh.
                </div>
              )
            ) : null}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 transition hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-700">
              <Upload className="h-4 w-4" />
              {selectedFile ? "Chọn ảnh khác" : "Chọn ảnh để tải lên"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>

            {previewUrl ? (
              <div className="relative mt-3 w-20">
                <img
                  src={previewUrl}
                  alt={selectedFile?.name ?? ""}
                  className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày bắt đầu">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </Field>
            <Field label="Ngày kết thúc">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </Field>
          </div>

          {formError ? <p className="text-sm font-medium text-red-600">{formError}</p> : null}
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-3 border-t border-slate-100 p-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {isSubmitting ? "Đang lưu..." : mode === "create" ? "Tạo voucher" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal "Xác nhận sử dụng voucher" — tương ứng mục 1.5 tài liệu:
 * POST /api/partner/vouchers/use?voucherCode=... — dùng khi nhân viên đối
 * tác xác nhận khách đã sử dụng voucher tại điểm bán.
 */
function UseVoucherDialog({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoucherUsageResponse | null>(null);

  async function handleConfirm() {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Vui lòng nhập mã voucher khách hàng cung cấp.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await partnerApi.useVoucher(trimmed);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xác nhận sử dụng voucher.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-slate-900">Xác nhận sử dụng voucher</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Nhập mã voucher mà khách hàng cung cấp tại điểm bán để xác nhận đã sử dụng.
        </p>

        <div className="mt-4">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setResult(null);
              setError(null);
            }}
            placeholder="Nhập mã voucher của khách"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        {result ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Xác nhận thành công
            </div>
            <p className="mt-1">{result.voucherName}</p>
            {result.voucherUsageCode ? (
              <p className="mt-0.5 font-mono text-xs">Mã lượt đổi: {result.voucherUsageCode}</p>
            ) : null}
            {result.usedAt ? <p className="mt-0.5 text-xs">Đã dùng lúc: {formatDate(result.usedAt)}</p> : null}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {isSubmitting ? "Đang xác nhận..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

/**
 * Thanh phân trang tự viết — luôn ép totalItems/totalPages về số hợp lệ để
 * không bao giờ ra "NaN" (đã từng gặp ở users-manager).
 */
function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const safeTotalItems = Number.isFinite(totalItems) ? Math.max(0, totalItems) : 0;
  const safeTotalPages = Math.max(1, Number.isFinite(totalPages) ? totalPages : 1);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  const from = safeTotalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, safeTotalItems);

  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(1, safePage - Math.floor(windowSize / 2));
    const end = Math.min(safeTotalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const arr: number[] = [];
    for (let i = start; i <= end; i += 1) arr.push(i);
    return arr;
  }, [safePage, safeTotalPages]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-600">
        Hiển thị <span className="font-semibold text-slate-900">{from}</span>
        {"–"}
        <span className="font-semibold text-slate-900">{to}</span> trong tổng số{" "}
        <span className="font-semibold text-slate-900">{safeTotalItems}</span> voucher
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers[0] > 1 ? <span className="px-1 text-sm text-slate-400">…</span> : null}
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === safePage}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition ${p === safePage ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {p}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < safeTotalPages ? (
            <span className="px-1 text-sm text-slate-400">…</span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage >= safeTotalPages}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
