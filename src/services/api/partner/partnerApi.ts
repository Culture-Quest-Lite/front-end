import { apiFetch } from "@/lib/api";


export type VoucherDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type VoucherStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "DELETED" | "PENDING";

export interface VoucherMedia {
  mediaId: number;
  mediaType: string;
  mimeType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  duration: number | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherResponse {
  voucherId: number;
  medias: VoucherMedia[];
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

/**
 * voucherCode: CHỈ cần khi UPDATE — phải khớp đúng mã hiện có của voucher,
 * nếu không backend trả lỗi "Không được phép thay đổi mã voucher".
 * Khi CREATE, backend tự sinh mã (hex 8 ký tự) và bỏ qua field này.
 * files: chỉ áp dụng khi CREATE (multipart) — updateVoucher chưa hỗ trợ.
 */
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
  files?: File[];
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

/**
 * Chuẩn hoá response phân trang — đọc được CẢ 2 dạng:
 *  - { content, totalElements, totalPages, number, size }
 *  - { content, page: { totalElements, totalPages, number, size } } (Spring Boot 3.2+ mặc định)
 */
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
  /** GET /api/partner/vouchers (search, status, partnerId, page, size, sortBy, sortDir) */
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

  /** POST /api/partner/vouchers — multipart/form-data, backend tự sinh voucherCode + ép status=PENDING */
  createVoucher: async (payload: Omit<VoucherRequest, "voucherCode">) => {
    const formData = new FormData();

    formData.append("voucherName", payload.voucherName);

    if (payload.description) {
      formData.append("description", payload.description);
    }

    formData.append("discountType", payload.discountType);
    formData.append("discountValue", String(payload.discountValue));

    if (payload.maxDiscountAmount !== undefined) {
      formData.append("maxDiscountAmount", String(payload.maxDiscountAmount));
    }

    if (payload.minOrderAmount !== undefined) {
      formData.append("minOrderAmount", String(payload.minOrderAmount));
    }

    formData.append("pointsRequired", String(payload.pointsRequired));
    formData.append("quantityTotal", String(payload.quantityTotal));
    formData.append("status", payload.status);
    formData.append("startDate", payload.startDate);
    formData.append("endDate", payload.endDate);

    payload.files?.forEach((file) => {
      formData.append("files", file);
    });

    return apiFetch<VoucherResponse>("/api/partner/vouchers", {
      method: "POST",
      body: formData,
      sameOrigin: true,
    });
  },

  /**
   * PUT /api/partner/vouchers/{id} — vẫn là JSON thường (chưa hỗ trợ đổi ảnh).
   * payload.voucherCode PHẢI khớp đúng mã hiện có của voucher.
   */
  updateVoucher: async (id: number, payload: VoucherRequest) =>
    apiFetch<VoucherResponse>(`/api/partner/vouchers/${id}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    }),

  /** DELETE /api/partner/vouchers/{id} — xoá mềm (status=DELETED), trả 204 No Content */
  deleteVoucher: async (id: number) =>
    apiFetch<void>(`/api/partner/vouchers/${id}`, {
      method: "DELETE",
      sameOrigin: true,
    }),

  /**
   * POST /api/partner/vouchers/use?voucherCode=...
   * Dùng khi nhân viên đối tác xác nhận khách đã sử dụng voucher tại điểm bán.
   */
  useVoucher: async (voucherCode: string) =>
    apiFetch<UserVoucherResponse>(
      `/api/partner/vouchers/use${buildQuery({ voucherCode })}`,
      { method: "POST", sameOrigin: true },
    ),
};

export default partnerApi;