"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import {
  partnerApi,
  type VoucherResponse,
  type VoucherRequest,
  type VoucherDiscountType,
  type VoucherStatus,
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
  Dices,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 8;

const STATUS_FILTERS: { value: VoucherStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Tạm ngưng" },
  { value: "EXPIRED", label: "Hết hạn" },
];

const statusLabels: Record<VoucherStatus, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Tạm ngưng",
  EXPIRED: "Hết hạn",
};

const statusClasses: Record<VoucherStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-red-100 text-red-700",
};

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

function generateVoucherCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm: 0/O, 1/I
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function todayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type FormState = {
  code: string;
  title: string;
  description: string;
  discountType: VoucherDiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  usageLimit: string;
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
  usageLimit: "",
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

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | "all">("all");

  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVouchers() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await partnerApi.getVouchers({
          page: page - 1,
          size: PAGE_SIZE,
          search: query.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        });

        if (cancelled) return;

        setVouchers(response.content);
        setTotalItems(response.page?.totalElements ?? 0);
        setTotalPages(Math.max(1, response.page?.totalPages || 1));
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
    setForm({ ...emptyForm, code: generateVoucherCode() });
    setEditingId(null);
    setFormError(null);
    setDialog("create");
  }

  function openEdit(voucher: VoucherResponse) {
    setForm({
      code: voucher.code,
      title: voucher.title,
      description: voucher.description ?? "",
      discountType: voucher.discountType,
      discountValue: String(voucher.discountValue),
      maxDiscountAmount: voucher.maxDiscountAmount ? String(voucher.maxDiscountAmount) : "",
      minOrderAmount: voucher.minOrderAmount ? String(voucher.minOrderAmount) : "",
      usageLimit: voucher.usageLimit ? String(voucher.usageLimit) : "",
      startDate: toDateInputValue(voucher.startDate),
      endDate: toDateInputValue(voucher.endDate),
    });
    setEditingId(voucher.voucherId);
    setFormError(null);
    setDialog("edit");
  }

  function buildPayload(): VoucherRequest | null {
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();

    if (!code) {
      setFormError("Mã voucher không được để trống.");
      return null;
    }
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

    if (!form.startDate || !form.endDate) {
      setFormError("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
      return null;
    }
    if (form.startDate > form.endDate) {
      setFormError("Ngày kết thúc phải sau ngày bắt đầu.");
      return null;
    }

    const maxDiscountAmount =
      form.discountType === "PERCENTAGE" && form.maxDiscountAmount.trim()
        ? Number(form.maxDiscountAmount)
        : undefined;
    const minOrderAmount = form.minOrderAmount.trim() ? Number(form.minOrderAmount) : undefined;
    const usageLimit = form.usageLimit.trim() ? Number(form.usageLimit) : undefined;

    if (maxDiscountAmount !== undefined && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount < 0)) {
      setFormError("Giảm tối đa phải là số >= 0.");
      return null;
    }
    if (minOrderAmount !== undefined && (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)) {
      setFormError("Đơn hàng tối thiểu phải là số >= 0.");
      return null;
    }
    if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
      setFormError("Số lượt sử dụng tối đa phải là số nguyên >= 1.");
      return null;
    }

    return {
      code,
      title,
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      usageLimit,
      startDate: `${form.startDate}T00:00:00`,
      endDate: `${form.endDate}T23:59:59`,
    };
  }

  async function handleSave() {
    const payload = buildPayload();
    if (!payload) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (dialog === "create") {
        await partnerApi.createVoucher(payload);
      } else if (editingId) {
        await partnerApi.updateVoucher(editingId, payload);
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
      await partnerApi.setVoucherStatus(voucher.voucherId, nextStatus);
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
        subtitle="Tạo và quản lý voucher giảm giá áp dụng cho cửa hàng/dịch vụ của bạn."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" /> Tạo voucher mới
          </button>
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
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                statusFilter === item.value
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
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...
        </div>
      ) : vouchers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
          Chưa có voucher nào phù hợp. Bấm &quot;Tạo voucher mới&quot; để bắt đầu.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {vouchers.map((voucher) => (
            <VoucherCard
              key={voucher.voucherId}
              voucher={voucher}
              isStatusLoading={statusLoadingId === voucher.voucherId}
              onEdit={() => openEdit(voucher)}
              onDelete={() => setPendingDeleteId(voucher.voucherId)}
              onToggleStatus={() => void handleToggleStatus(voucher)}
            />
          ))}
        </div>
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
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
          onCancel={() => setDialog(null)}
          onSubmit={handleSave}
          onRegenerateCode={() => setForm((f) => ({ ...f, code: generateVoucherCode() }))}
        />
      ) : null}

      {pendingDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Xoá voucher</h2>
            <p className="mt-2 text-sm text-slate-500">
              Voucher đã xoá sẽ không thể khôi phục. Người dùng đang giữ voucher này sẽ không thể
              sử dụng được nữa.
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
    </div>
  );
}

function VoucherCard({
  voucher,
  isStatusLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  voucher: VoucherResponse;
  isStatusLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const usageText =
    voucher.usageLimit !== undefined && voucher.usageLimit !== null
      ? `${voucher.usedCount}/${voucher.usageLimit} lượt`
      : `${voucher.usedCount} lượt (không giới hạn)`;

  return (
    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 border-r border-dashed border-amber-200 bg-amber-50 px-3 py-5 text-center">
        <Ticket className="h-5 w-5 text-amber-600" />
        <span className="break-all font-mono text-sm font-bold tracking-wide text-amber-700">
          {voucher.code}
        </span>
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{voucher.title}</h3>
            <p className="mt-0.5 text-sm font-medium text-amber-700">{formatDiscount(voucher)}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[voucher.status]}`}
          >
            {statusLabels[voucher.status]}
          </span>
        </div>

        {voucher.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">{voucher.description}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            Hiệu lực: {formatDate(voucher.startDate)} – {formatDate(voucher.endDate)}
          </span>
          <span>Đã dùng: {usageText}</span>
          {voucher.minOrderAmount ? (
            <span>Đơn tối thiểu: {formatCurrency(voucher.minOrderAmount)}</span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Sửa
          </button>
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={isStatusLoading || voucher.status === "EXPIRED"}
            title={voucher.status === "EXPIRED" ? "Voucher đã hết hạn" : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStatusLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : voucher.status === "ACTIVE" ? (
              <PowerOff className="h-3.5 w-3.5" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            {voucher.status === "ACTIVE" ? "Tạm ngưng" : "Bật lại"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

function VoucherFormDialog({
  mode,
  form,
  setForm,
  formError,
  isSubmitting,
  onCancel,
  onSubmit,
  onRegenerateCode,
}: {
  mode: "create" | "edit";
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  formError: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onRegenerateCode: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-900">
          {mode === "create" ? "Tạo voucher mới" : "Chỉnh sửa voucher"}
        </h2>

        <div className="mt-5 space-y-4">
          <Field label="Mã voucher">
            <div className="flex gap-2">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2026"
                maxLength={20}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              <button
                type="button"
                onClick={onRegenerateCode}
                title="Tạo mã ngẫu nhiên"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Dices className="h-4 w-4" /> Ngẫu nhiên
              </button>
            </div>
          </Field>

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
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  form.discountType === "PERCENTAGE"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Theo % (VD: 10%)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, discountType: "FIXED_AMOUNT" })}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  form.discountType === "FIXED_AMOUNT"
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
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </Field>
            )}
          </div>

          {form.discountType === "PERCENTAGE" ? (
            <Field label="Đơn tối thiểu (VNĐ, tuỳ chọn)">
              <input
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </Field>
          ) : null}

          <Field label="Số lượt sử dụng tối đa (để trống = không giới hạn)">
            <input
              type="number"
              min={1}
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
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

        <div className="mt-6 flex justify-end gap-3">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

/**
 * Thanh phân trang tự viết — cùng cách làm như ở users-manager/page.tsx,
 * luôn ép totalItems/totalPages về số hợp lệ để không bao giờ ra "NaN".
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
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition ${
                p === safePage ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
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