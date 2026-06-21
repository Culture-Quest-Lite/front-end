import { apiFetch } from "@/lib/api";

export type VoucherDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type VoucherStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export interface VoucherResponse {
  voucherId: number;
  code: string;
  title: string;
  description?: string;
  discountType: VoucherDiscountType;
  /** % nếu discountType = PERCENTAGE, số tiền (VNĐ) nếu FIXED_AMOUNT */
  discountValue: number;
  /** Chỉ áp dụng khi discountType = PERCENTAGE — giới hạn số tiền giảm tối đa */
  maxDiscountAmount?: number;
  /** Giá trị đơn hàng tối thiểu để áp dụng voucher */
  minOrderAmount?: number;
  /** Tổng số lần được sử dụng, để trống = không giới hạn */
  usageLimit?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: VoucherStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherRequest {
  code: string;
  title: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
}

export interface VoucherFilterParams {
  page?: number;
  size?: number;
  search?: string;
  status?: VoucherStatus;
}

export interface PageMeta {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  content: T[];
  page: PageMeta;
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const partnerApi = {
  /** GET /api/partner/vouchers — danh sách voucher của partner hiện tại (lọc + phân trang) */
  getVouchers: async (params?: VoucherFilterParams) => {
    const query = buildQuery({
      page: params?.page,
      size: params?.size,
      search: params?.search?.trim() || undefined,
      status: params?.status,
    });

    return apiFetch<PageResponse<VoucherResponse>>(
      `/api/partner/vouchers${query}`,
      { method: "GET", sameOrigin: true },
    );
  },

  /** POST /api/partner/vouchers — tạo voucher mới */
  createVoucher: async (payload: VoucherRequest) =>
    apiFetch<VoucherResponse>("/api/partner/vouchers", {
      method: "POST",
      body: payload,
      sameOrigin: true,
    }),

  /** PUT /api/partner/vouchers/{id} — cập nhật voucher */
  updateVoucher: async (id: number, payload: VoucherRequest) =>
    apiFetch<VoucherResponse>(`/api/partner/vouchers/${id}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    }),

  /** PATCH /api/partner/vouchers/{id}/status — bật/tắt voucher (ACTIVE ⇄ INACTIVE) */
  setVoucherStatus: async (id: number, status: VoucherStatus) =>
    apiFetch<VoucherResponse>(`/api/partner/vouchers/${id}/status`, {
      method: "PATCH",
      body: { status },
      sameOrigin: true,
    }),

  /** DELETE /api/partner/vouchers/{id} — xoá voucher */
  deleteVoucher: async (id: number) =>
    apiFetch<void>(`/api/partner/vouchers/${id}`, {
      method: "DELETE",
      sameOrigin: true,
    }),
};

export default partnerApi;