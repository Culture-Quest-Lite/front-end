import { apiFetch } from "@/lib/api";

export type VoucherDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type VoucherStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "DELETED";

export interface VoucherResponse {
  voucherId: number;
  partnerId: number;
  partnerName: string;
  voucherCode: string;
  voucherName: string;
  description: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  pointsRequired: number;
  quantityTotal: number;
  quantityRemaining: number;
  status: VoucherStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface VoucherRequest {
  voucherCode?: string;
  voucherName: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  pointsRequired: number;
  quantityTotal: number;
  status: VoucherStatus;
  startDate: string;
  endDate: string;
}

export interface VoucherFilterParams {
  search?: string;
  status?: VoucherStatus;
  partnerId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/** Voucher mà 1 user cụ thể đã đổi (bảng user_vouchers) — dùng cho API "use". */
export interface UserVoucherResponse {
  userVoucherId: number;
  voucherId: number;
  voucherCode: string;
  voucherName: string;
  description: string | null;
  pointsRequired: number;
  redeemedAt: string;
  usedAt: string | null;
  expiredAt: string | null;
  isUsed: boolean;
}

export interface PageMeta {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  content: T[];
  page: PageMeta;
}

interface RawPageMaybeNested<T> {
  content?: T[];
  page?: Partial<PageMeta>;
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

function normalizePage<T>(raw: RawPageMaybeNested<T>): PageResponse<T> {
  const meta = raw.page ?? raw;
  return {
    content: raw.content ?? [],
    page: {
      number: meta.number ?? 0,
      size: meta.size ?? 0,
      totalElements: meta.totalElements ?? 0,
      totalPages: meta.totalPages ?? 1,
    },
  };
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
  /** 1.1 — GET /api/partner/vouchers (search, status, partnerId, page, size, sortBy, sortDir) */
  getVouchers: async (params?: VoucherFilterParams) => {
    const query = buildQuery({
      search: params?.search?.trim() || undefined,
      status: params?.status,
      partnerId: params?.partnerId,
      page: params?.page,
      size: params?.size,
      sortBy: params?.sortBy ?? "createdAt",
      sortDir: params?.sortDir ?? "desc",
    });

    const raw = await apiFetch<RawPageMaybeNested<VoucherResponse>>(
      `/api/partner/vouchers${query}`,
      { method: "GET", sameOrigin: true },
    );
    return normalizePage(raw);
  },

  /** 1.2 — POST /api/partner/vouchers — backend tự sinh voucherCode, KHÔNG gửi field này lên */
  createVoucher: async (payload: Omit<VoucherRequest, "voucherCode">) =>
    apiFetch<VoucherResponse>("/api/partner/vouchers", {
      method: "POST",
      body: payload,
      sameOrigin: true,
    }),

  /**
   * 1.3 — PUT /api/partner/vouchers/{id}
   * payload.voucherCode PHẢI khớp đúng mã hiện có của voucher (lấy từ GET trước đó).
   */
  updateVoucher: async (id: number, payload: VoucherRequest) =>
    apiFetch<VoucherResponse>(`/api/partner/vouchers/${id}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    }),

  /** 1.4 — DELETE /api/partner/vouchers/{id} — xoá mềm (status=DELETED), trả 204 No Content */
  deleteVoucher: async (id: number) =>
    apiFetch<void>(`/api/partner/vouchers/${id}`, {
      method: "DELETE",
      sameOrigin: true,
    }),

  /**
   * 1.5 — POST /api/partner/vouchers/use?voucherCode=...
   * Dùng khi nhân viên đối tác xác nhận khách đã sử dụng voucher tại điểm bán.
   */
  useVoucher: async (voucherCode: string) =>
    apiFetch<UserVoucherResponse>(
      `/api/partner/vouchers/use${buildQuery({ voucherCode })}`,
      { method: "POST", sameOrigin: true },
    ),
};

export default partnerApi;