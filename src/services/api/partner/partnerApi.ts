import { apiFetch } from "@/lib/api";

export type VoucherDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type VoucherStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "DELETED" | "PENDING";
export type UserRole = "EXPLORER" | "CURATOR" | "ADMIN" | "PARTNER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "DELETED" | "PENDING";

export interface CurrentUserProfileResponse {
  userId: number;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  backgroundUrl?: string | null;
  totalXp?: number | null;
  totalPoints?: number | null;
  autoPlayAudio?: boolean | null;
  isPremium?: boolean | null;
  status: UserStatus;
  levelName?: string | null;
  role: UserRole;
  createdAt?: string;
  totalFollowers?: number;
  totalFollowing?: number;
  totalPosts?: number;
}

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
  status?: VoucherStatus;
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

/** Voucher mà 1 user cụ thể đã đổi — dùng cho API "use". */
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

/**
 * Endpoint Swagger mới:
 * GET /api/partner/{id}/vouchers
 *
 * Trong đó {id} sẽ lấy từ GET /api/users/me -> userId.
 */
export const partnerApi = {
  /**
   * GET /api/users/me
   * Backend lấy Keycloak subject từ token rồi trả về userId nội bộ.
   */
  getCurrentUser: async () =>
    apiFetch<CurrentUserProfileResponse>("/api/users/me", {
      method: "GET",
      sameOrigin: true,
    }),

  getCurrentUserId: async () => {
    const user = await partnerApi.getCurrentUser();

    if (!user.userId) {
      throw new Error("Không tìm thấy userId của tài khoản đang đăng nhập.");
    }

    return user.userId;
  },

  /**
   * GET /api/partner/{id}/vouchers
   *
   * Dùng khi bạn đã có id.
   * id này hiện đang truyền bằng userId lấy từ /api/users/me.
   */
  getVouchersByUserId: async (id: number, params?: Omit<VoucherFilterParams, "partnerId">) => {
    const query = buildQuery({
      search: params?.search?.trim() || undefined,
      status: params?.status,
      page: params?.page,
      size: params?.size,
      sortBy: params?.sortBy ?? "createdAt",
      sortDir: params?.sortDir ?? "desc",
    });

    const raw = await apiFetch<RawPageMaybeNested<VoucherResponse>>(
      `/api/partner/${id}/vouchers${query}`,
      {
        method: "GET",
        sameOrigin: true,
      },
    );

    return normalizePage(raw);
  },

  /**
   * Hàm chính nên dùng trong trang Partner Voucher.
   * Tự lấy userId hiện tại rồi gọi GET /api/partner/{id}/vouchers.
   */
  getMyVouchers: async (params?: Omit<VoucherFilterParams, "partnerId">) => {
    const userId = await partnerApi.getCurrentUserId();

    return partnerApi.getVouchersByUserId(userId, params);
  },

  /**
   * Giữ lại hàm cũ để tránh vỡ code nơi khác.
   * Nếu có params.partnerId thì dùng partnerId làm path id.
   * Nếu không có partnerId thì tự lấy userId hiện tại.
   */
  getVouchers: async (params?: VoucherFilterParams) => {
    const id = params?.partnerId ?? (await partnerApi.getCurrentUserId());

    return partnerApi.getVouchersByUserId(id, {
      search: params?.search,
      status: params?.status,
      page: params?.page,
      size: params?.size,
      sortBy: params?.sortBy,
      sortDir: params?.sortDir,
    });
  },

  /**
   * Nếu backend có endpoint GET /api/partner/vouchers/{id}, có thể dùng hàm này.
   */
  getVoucherById: async (voucherId: number) =>
    apiFetch<VoucherResponse>(`/api/partner/vouchers/${voucherId}`, {
      method: "GET",
      sameOrigin: true,
    }),

  /**
   * Tìm voucher theo id trong danh sách voucher của user/partner hiện tại.
   * Dùng khi backend chưa có GET detail riêng hoặc muốn đảm bảo chỉ lấy voucher của user hiện tại.
   */
  getVoucherByIdOfCurrentPartner: async (voucherId: number) => {
    const response = await partnerApi.getMyVouchers({
      page: 0,
      size: 100,
      sortBy: "createdAt",
      sortDir: "desc",
    });

    return response.content.find((voucher) => voucher.voucherId === voucherId) ?? null;
  },

  /**
   * POST /api/partner/vouchers
   * Multipart form-data.
   *
   * Có 2 cách tạo mã:
   * - Không truyền voucherCode: backend tự tạo.
   * - Có truyền voucherCode: backend dùng mã người dùng nhập, nếu backend đã hỗ trợ.
   *
   * Không bắt buộc truyền status khi create.
   */
  createVoucher: async (payload: VoucherRequest) => {
    const formData = new FormData();

    if (payload.voucherCode?.trim()) {
      formData.append("voucherCode", payload.voucherCode.trim().toUpperCase());
    }

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

    if (payload.status) {
      formData.append("status", payload.status);
    }

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
   * PUT /api/partner/vouchers/{id}
   * JSON thường, chưa hỗ trợ đổi ảnh.
   */
  updateVoucher: async (id: number, payload: VoucherRequest) =>
    apiFetch<VoucherResponse>(`/api/partner/vouchers/${id}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    }),

  /**
   * DELETE /api/partner/vouchers/{id}
   */
  deleteVoucher: async (id: number) =>
    apiFetch<void>(`/api/partner/vouchers/${id}`, {
      method: "DELETE",
      sameOrigin: true,
    }),

  /**
   * POST /api/partner/vouchers/use?voucherCode=...
   */
  useVoucher: async (voucherCode: string) =>
    apiFetch<UserVoucherResponse>(
      `/api/partner/vouchers/use${buildQuery({ voucherCode })}`,
      {
        method: "POST",
        sameOrigin: true,
      },
    ),
};

export default partnerApi;
