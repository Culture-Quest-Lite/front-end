"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/app/ui-bits";
import {
  partnerApi,
  type VoucherResponse,
  type VoucherRequest,
} from "@/services/api/partner/partnerApi";
import { Check, X, Ticket, Clock, ShieldCheck, Trash2, Loader2 } from "lucide-react";

type OpenDialog = { type: "approve" | "reject"; itemId: number } | null;


function toVoucherRequest(
  voucher: VoucherResponse,
  overrides?: Partial<VoucherRequest>,
): VoucherRequest {
  return {
    voucherCode: voucher.voucherCode,
    voucherName: voucher.voucherName,
    description: voucher.description ?? undefined,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    maxDiscountAmount: voucher.maxDiscountAmount ?? undefined,
    minOrderAmount: voucher.minOrderAmount ?? undefined,
    pointsRequired: voucher.pointsRequired,
    quantityTotal: voucher.quantityTotal,
    status: voucher.status,
    startDate: voucher.startDate,
    endDate: voucher.endDate,
    ...overrides,
  };
}

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

export default function ContentReviewPage() {
  const [items, setItems] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await partnerApi.getVouchers({ status: "PENDING", page: 0, size: 50 });
      setItems(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải hàng đợi duyệt voucher.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  const filtered = useMemo(
    () => items.filter((item) => item.status === "PENDING"),
    [items],
  );

  const selectedItem = dialog ? items.find((item) => item.voucherId === dialog.itemId) : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove(voucher: VoucherResponse) {
    setSubmitting(true);
    try {
      await partnerApi.updateVoucher(voucher.voucherId, toVoucherRequest(voucher, { status: "ACTIVE" }));
      setItems((prev) => prev.filter((item) => item.voucherId !== voucher.voucherId));
      setDialog(null);
      showToast("Đã phê duyệt và kích hoạt voucher.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể duyệt voucher.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(voucher: VoucherResponse) {
    if (!rejectReason.trim()) {
      showToast("Vui lòng chọn hoặc nhập lý do từ chối.");
      return;
    }
    setSubmitting(true);
    try {
      // Lý do CHỈ hiện trong toast bên dưới — backend không có field lưu
      // lý do từ chối voucher, nên không gửi kèm trong payload.
      await partnerApi.updateVoucher(
        voucher.voucherId,
        toVoucherRequest(voucher, { status: "PENDING" }),
      );
      setItems((prev) => prev.filter((item) => item.voucherId !== voucher.voucherId));
      setDialog(null);
      const reason = rejectReason.trim();
      setRejectReason("");
      showToast(`Đã từ chối voucher. Lý do: ${reason}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể từ chối voucher.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(voucherId: number) {
    setSubmitting(true);
    try {
      await partnerApi.deleteVoucher(voucherId);
      setItems((prev) => prev.filter((item) => item.voucherId !== voucherId));
      showToast("Đã xoá voucher khỏi hàng đợi.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xoá voucher.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 py-6">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Duyệt voucher đối tác"
        subtitle="Phê duyệt, từ chối hoặc xoá voucher do đối tác (partner) gửi lên."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} chờ duyệt</span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void loadVouchers()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Làm mới
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải hàng đợi duyệt voucher...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">Không có voucher chờ duyệt</p>
          <p className="mt-1 text-xs text-slate-400">Tất cả voucher đã được xử lý.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((voucher) => (
            <div
              key={voucher.voucherId}
              className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm dark:bg-zinc-950"
            >
              <button
                type="button"
                onClick={() => setDialog({ type: "approve", itemId: voucher.voucherId })}
                className="block w-full text-left"
              >
                <div className="flex gap-3 p-3">
                  <div className="grid h-24 w-24 flex-none place-items-center rounded-2xl bg-amber-50 text-amber-600">
                    <Ticket className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Voucher</span>
                      <Clock className="h-3 w-3" />
                      <span>
                        Gửi lúc{" "}
                        {voucher.createdAt
                          ? new Date(voucher.createdAt).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                    <div className="line-clamp-1 text-lg font-semibold text-slate-950 dark:text-slate-50">
                      {voucher.voucherName}
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-amber-700">{formatDiscount(voucher)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-primary text-[10px] font-bold">
                        {voucher.partnerName.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300">{voucher.partnerName}</span>
                      <StatusPill status="pending" />
                    </div>
                  </div>
                </div>
              </button>
              <div className="grid grid-cols-3 border-t border-border">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDialog({ type: "reject", itemId: voucher.voucherId })}
                  className="flex items-center justify-center gap-1.5 border-r border-border py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Từ chối
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDialog({ type: "approve", itemId: voucher.voucherId })}
                  className="flex items-center justify-center gap-1.5 border-r border-border py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Duyệt
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleDelete(voucher.voucherId)}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem ? (
        <Modal
          open
          onClose={() => setDialog(null)}
          title={
            dialog?.type === "approve"
              ? "Xem trước & phê duyệt voucher"
              : `Từ chối voucher #${selectedItem.voucherId}`
          }
        >
          {dialog?.type === "approve" ? (
            <ApprovePreview item={selectedItem} />
          ) : (
            <RejectPreview reason={rejectReason} onReasonChange={setRejectReason} />
          )}
          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
              Huỷ
            </Button>
            <Button
              disabled={submitting}
              onClick={() =>
                dialog?.type === "approve"
                  ? void handleApprove(selectedItem)
                  : void handleReject(selectedItem)
              }
              className={
                dialog?.type === "approve"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent gap-1.5"
                  : "bg-red-600 text-white hover:bg-red-700 border-transparent gap-1.5"
              }
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : dialog?.type === "approve" ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" /> Phê duyệt & kích hoạt
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-1.5" /> Gửi từ chối
                </>
              )}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function ApprovePreview({ item }: { item: VoucherResponse }) {
  return (
    <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
      <div className="text-xs text-muted-foreground">Voucher · {item.partnerName}</div>
      <p className="text-sm leading-6">{item.description || "Không có mô tả"}</p>
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <Info label="Mã voucher" value={item.voucherCode} />
        <Info label="Hình thức giảm" value={formatDiscount(item)} />
        <Info label="Điểm yêu cầu" value={`${item.pointsRequired} điểm`} />
        <Info label="Số lượng" value={`${item.quantityRemaining}/${item.quantityTotal}`} />
        <Info
          label="Hiệu lực"
          value={`${new Date(item.startDate).toLocaleDateString("vi-VN")} – ${new Date(
            item.endDate,
          ).toLocaleDateString("vi-VN")}`}
        />
        <Info label="Trạng thái hiện tại" value={item.status} />
      </div>
    </div>
  );
}

function RejectPreview({
  reason,
  onReasonChange,
}: {
  reason: string;
  onReasonChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <p className="text-xs text-muted-foreground">
        Lý do bắt buộc. Lý do chỉ hiển thị trong thông báo cho admin — backend chưa có field lưu
        lý do từ chối voucher, nên cần thông báo trực tiếp cho đối tác qua kênh khác.
      </p>
      <div className="space-y-2">
        {[
          "Thông tin giảm giá không hợp lý / gây nhầm lẫn",
          "Tên hoặc mô tả vi phạm tiêu chuẩn nội dung",
          "Thời hạn hiệu lực không hợp lệ",
          "Số lượng/điểm yêu cầu bất thường, nghi gian lận",
          "Khác",
        ].map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="reason"
              className="accent-primary"
              checked={reason === r}
              onChange={() => onReasonChange(r)}
            />
            {r}
          </label>
        ))}
      </div>
      <textarea
        rows={3}
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Ghi chú bổ sung…"
        className="w-full rounded-3xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-zinc-950 dark:text-slate-100"
      />
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
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}