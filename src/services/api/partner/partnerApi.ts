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

export interface VoucherResponse {
  voucherId: number;
  /**
   * Backend (VoucherResponse.java) chỉ trả về MỘT ảnh duy nhất dưới dạng
   * `imageUrl`, không phải mảng `medias` như các module content khác.
   */
  imageUrl: string | null;
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
 * Khớp 1-1 với `VoucherRequest.java`. Cả POST lẫn PUT đều là
 * `multipart/form-data`, ảnh nằm ở field `imageFile` (MỘT file, không phải
 * mảng `files`).
 */
export interface VoucherRequest {
  /**
   * Bắt buộc khi PUT — backend từ chối ("Không được phép thay đổi mã voucher")
   * nếu giá trị gửi lên khác mã hiện tại. Khi POST thì bị bỏ qua vì backend
   * tự sinh mã hex 8 ký tự.
   */
  voucherCode?: string;
  voucherName: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  pointsRequired: number;
  quantityTotal: number;
  /** Khi PUT: bỏ trống = giữ nguyên status cũ. Khi POST: backend luôn ép PENDING. */
  status?: VoucherStatus;
  startDate: string;
  endDate: string;
  /** Bỏ trống khi PUT = giữ nguyên ảnh cũ. */
  imageFile?: File | null;
}

export type CreateVoucherRequest = Omit<VoucherRequest, "voucherCode" | "status">;

export interface VoucherFilterParams {
  search?: string;
  status?: VoucherStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/**
 * Khớp `VoucherUsageResponse.java` — bản ghi 1 lượt đổi voucher của user.
 * Khoá chính là `voucherUsageId` (không phải `userVoucherId`).
 */
export interface VoucherUsageResponse {
  voucherUsageId: number;
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
 * Dựng body multipart cho POST/PUT voucher. Chỉ append field khác `undefined`
 * để backend nhận đúng `null` cho các field tuỳ chọn (maxDiscountAmount,
 * minOrderAmount, description, status, imageFile).
 */
function buildVoucherFormData(payload: VoucherRequest) {
  const formData = new FormData();

  if (payload.voucherCode) {
    formData.append("voucherCode", payload.voucherCode);
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

  if (payload.imageFile) {
    formData.append("imageFile", payload.imageFile);
  }

  return formData;
}

/**
 * Backend không có endpoint riêng để đổi status, nên phải PUT lại toàn bộ
 * voucher. Hàm này map 1 VoucherResponse đang có về VoucherRequest đầy đủ để
 * gửi kèm, tránh việc PUT thiếu field làm mất dữ liệu.
 */
export function toVoucherRequest(
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

export interface PartnerDashboardResponse {
  totalVouchers?: number | null;
  activeVouchers?: number | null;
  inactiveVouchers?: number | null;
  expiredVouchers?: number | null;
  pendingVouchers?: number | null;
  totalQuantityIssued?: number | null;
  totalQuantityRemaining?: number | null;
  totalRedeemed?: number | null;
  usageRate?: number | null;
  totalRevenue?: number | null;
  shopName?: string | null;
  partnerName?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPlanName?: string | null;
  [key: string]: unknown;
}

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
   * id nằm trên path, không phải query partnerId.
   * Ví dụ:
   * /api/partner/22/vouchers?page=0&size=8&sortBy=createdAt&sortDir=desc
   */
  getVouchersByUserId: async (id: number, params?: VoucherFilterParams) => {
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
   * Hàm chính nên dùng ở Partner dashboard / Partner voucher page.
   * Tự lấy userId từ /api/users/me rồi truyền vào path {id}.
   */
  getVouchers: async (params?: VoucherFilterParams) => {
    const userId = await partnerApi.getCurrentUserId();
    return partnerApi.getVouchersByUserId(userId, params);
  },

  /**
   * GET /api/vouchers/{id} — endpoint nằm ở VoucherController (module
   * gamification), KHÔNG phải dưới /api/partner.
   */
  getVoucherById: async (voucherId: number) =>
    apiFetch<VoucherResponse>(`/api/vouchers/${voucherId}`, {
      method: "GET",
      sameOrigin: true,
    }),

  /**
   * Tìm 1 voucher theo voucherId trong danh sách voucher của user hiện tại.
   */
  getVoucherByIdOfCurrentPartner: async (voucherId: number) => {
    const response = await partnerApi.getVouchers({
      page: 0,
      size: 100,
      sortBy: "createdAt",
      sortDir: "desc",
    });

    return response.content.find((voucher) => voucher.voucherId === voucherId) ?? null;
  },

  /**
   * POST /api/partner/vouchers — multipart/form-data.
   *
   * Không gửi voucherCode/status: backend tự sinh mã và luôn ép PENDING.
   */
  createVoucher: async (payload: CreateVoucherRequest) =>
    apiFetch<VoucherResponse>("/api/partner/vouchers", {
      method: "POST",
      body: buildVoucherFormData(payload),
      sameOrigin: true,
    }),

  /**
   * PUT /api/partner/vouchers/{id} — cũng là multipart/form-data (không phải
   * JSON), và bắt buộc gửi lại đầy đủ các field @NotNull của VoucherRequest.
   */
  updateVoucher: async (id: number, payload: VoucherRequest) =>
    apiFetch<VoucherResponse>(`/api/partner/vouchers/${id}`, {
      method: "PUT",
      body: buildVoucherFormData(payload),
      sameOrigin: true,
    }),

  /**
   * Đổi trạng thái voucher. Backend không có endpoint riêng nên thực chất là
   * PUT lại toàn bộ voucher với status mới.
   */
  changeVoucherStatus: async (voucher: VoucherResponse, status: VoucherStatus) =>
    partnerApi.updateVoucher(voucher.voucherId, toVoucherRequest(voucher, { status })),

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
    apiFetch<VoucherUsageResponse>(
      `/api/partner/vouchers/use${buildQuery({ voucherCode })}`,
      {
        method: "POST",
        sameOrigin: true,
      },
    ),

  /**
   * GET /api/partner/dashboard
   * Trả về số liệu tổng hợp phía backend cho partner hiện tại.
   */
  getDashboard: async () =>
    apiFetch<PartnerDashboardResponse>("/api/partner/dashboard", {
      method: "GET",
      sameOrigin: true,
    }),
};

export default partnerApi;
