import { apiFetch } from "@/lib/api";

export type UserRole = "EXPLORER" | "CURATOR" | "ADMIN" | "PARTNER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "DELETED";
/**
 * Khớp `PostStatus.java`. REPORTING = có báo cáo chưa xử lý, REPORTED = admin
 * đã chấp nhận báo cáo và gỡ bài.
 */
export type PostStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "DELETED"
  | "REPORTING"
  | "REPORTED";

export type PostVisibility = "PUBLIC" | "PRIVATE" | "FRIENDS";
export type SubscriptionPlanStatus = "ACTIVE" | "INACTIVE" | "DELETED";
export type SubscriptionPlanType = "PREMIUM" | "PARTNER";
export type PartnerSubscriptionStatus =
  | "PAYMENT_PENDING"
  | "PAYMENT_FAILED"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "REFUND"
  | "EXPIRED"
  | "CANCELLED";

export interface PageMeta {
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PageResponse<T> {
  content: T[];
  page: PageMeta;
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

interface RawPageMaybeNested<T> {
  content?: T[];
  page?: Partial<PageMeta>;
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

function normalizePage<T>(raw: RawPageMaybeNested<T> | T[]): PageResponse<T> {
  if (Array.isArray(raw)) {
    return {
      content: raw,
      page: {
        totalElements: raw.length,
        totalPages: raw.length > 0 ? 1 : 0,
        number: 0,
        size: raw.length,
      },
    };
  }

  const meta = raw.page ?? raw;

  return {
    content: raw.content ?? [],
    page: {
      totalElements: meta.totalElements ?? 0,
      totalPages: meta.totalPages ?? 1,
      number: meta.number ?? 0,
      size: meta.size ?? 0,
    },
    totalElements: raw.totalElements,
    totalPages: raw.totalPages,
    number: raw.number,
    size: raw.size,
  };
}

export interface SliceResponse<T> {
  content: T[];
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface UserProfile {
  userId: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  totalXp?: number;
  totalPoints?: number;
  autoPlayAudio?: boolean;
  isPremium?: boolean;
  status: UserStatus;
  levelName?: string;
  role: UserRole;
  createdAt: string;
  totalFollowers: number;
  totalFollowing: number;
  totalPosts: number;
}

export interface PostMedia {
  mediaId: number;
  mediaType?: string;
  mimeType?: string;
  fileUrl: string;
  fileName?: string;
  displayOrder?: number;
}

/** Khớp `PostResponse.java`. */
export interface PostItem {
  postId: number;
  userId: number;
  username: string;
  displayName: string;
  content: string;
  visibility?: PostVisibility;
  status: PostStatus;
  reason?: string;
  isTaggedHotspot?: boolean;
  isTaggedRoute?: boolean;
  hotspotIds?: number[];
  routeIds?: number[];
  tags?: Array<{ tagId: number; tagName: string; imageUrl?: string }>;
  medias?: PostMedia[];
  createdAt?: string;
  pointRemaining?: number;
  pointEarned?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  /**
   * Bài gốc khi đây là bài chia sẻ lại (repost). Backend tạo bản ghi Post mới
   * trỏ về bài gốc qua `sharedPost`, nên khi kiểm duyệt cần xem cả hai.
   */
  sharedPost?: PostItem;
}

/** Khớp `ReportPostResponse.java` — một lượt báo cáo của một người dùng. */
export interface PostReportItem {
  postActionId: number;
  postId: number;
  createdUserId: number;
  createdDisplayName: string;
  comment: string;
  createdAt: string;
}

/** Khớp `HandleReportPostRequest.java`. */
export interface HandlePostReportRequest {
  /** Các báo cáo cần đánh dấu đã xử lý — phải cùng thuộc `postId`. */
  postActionIds: number[];
  /** true = chấp nhận báo cáo (bài chuyển REPORTED), false = bác bỏ (bài về APPROVED). */
  isApproveReport: boolean;
  /** Bắt buộc, backend validate @NotBlank. */
  reason: string;
}

export interface SubscriptionPlan {
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  subscriptionPlanDescription?: string;
  priceMonthly: number;
  priceYearly: number;
  configLimit?: Record<string, unknown>;
  planType: SubscriptionPlanType;
  status: SubscriptionPlanStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartnerSubscription {
  id: number;
  partnerId: number;
  partnerName: string;
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  shopName: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  billingCycle?: string;
  status?: PartnerSubscriptionStatus;
  startDate?: string;
  endDate?: string;
  isVerified?: boolean;
  /**
   * Giấy tờ + ảnh cửa hàng đã được proxy `/api/admin/subscriptions` thay link
   * S3 bằng đường dẫn nội bộ, nên `previewUrl` luôn là same-origin và URL AWS
   * không lộ ra trình duyệt. `documentUrl`/`medias[].fileUrl` đã bị loại bỏ.
   */
  attachments?: PartnerAttachment[];
  shopEmail?: string;
  invoiceCode?: string;
  paidAmount?: number;
  paymentStatus?: string;
  paymentGateway?: string;
  paidAt?: string;
  createdAt?: string;
  medias?: Array<{
    mediaId: number;
    fileName: string;
    mediaType: string;
  }>;
}

export interface PartnerAttachment {
  /** Vị trí trong danh sách tệp của hồ sơ, dùng để dựng `previewUrl`. */
  index: number;
  name: string;
  kind: "image" | "pdf" | "other";
  /** Same-origin: `/api/admin/partner-files/{subscriptionId}/{index}`. */
  previewUrl: string;
}


export interface AuditActor {
  userId?: number;
  username?: string;
  displayName?: string;
  role?: string;
}

export interface AuditLog {
  logId: number;
  actor?: AuditActor;
  action: string;
  tableName?: string;
  recordId?: string;
  endpoint?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  createdAt: string;
}

export interface GetAuditLogsParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  search?: string;
  userId?: number;
  action?: string;
  tableName?: string;
  from?: string;
  to?: string;
}

export interface MessageResponse {
  message: string;
}

// ─── Permission Management ────────────────────────────────────────────────────

export interface PermissionResponse {
  id: number;
  code: string;
  groupName: string;
  active: boolean;
}

export interface PermissionGroupResponse {
  groupName: string;
  permissions: PermissionResponse[];
}

/** matrix: role → set of permission codes mà role đó đang có */
export interface RolePermissionMatrixResponse {
  allPermissions: PermissionGroupResponse[];
  matrix: Record<UserRole, string[]>;
}

export interface UserPermissionResponse {
  id: number;
  code: string;
  description: string;
  granted: boolean;
  expiresAt: string | null;
  expired: boolean;
  reason: string;
}

export interface GrantUserPermissionRequest {
  /** Mã quyền, không kèm tiền tố PERM_ */
  code: string;
  /** true = cấp thêm; false = thu hồi */
  granted: boolean;
  /** ISO datetime, null = vĩnh viễn */
  expiresAt?: string | null;
  /** Lý do, bắt buộc để audit */
  reason: string;
}

export interface GetUsersParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  search?: string;
  status?: UserStatus;
}

export interface GetSubscriptionPlansParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  search?: string;
  status?: SubscriptionPlanStatus;
  planType?: SubscriptionPlanType;
}


export interface GetPartnerSubscriptionsParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  search?: string;
  status?: PartnerSubscriptionStatus;
}

export interface SubscriptionPlanPayload {
  subscriptionPlanName: string;
  subscriptionPlanDescription?: string;
  priceMonthly: number;
  priceYearly: number;
  configLimit?: Record<string, unknown>;
  planType: SubscriptionPlanType;
}

export interface GetPostsParams {
  status?: PostStatus;
  page?: number;
  size?: number;
}

/**
 * Dashboard tổng quan của Admin — `GET /api/admin/dashboard`.
 *
 * Tên field viết tắt (`d`/`v`, `m`/`u`, `r`/`views`/`completes`) là do backend
 * chủ động `@JsonProperty` cho khớp với `dataKey` mà các biểu đồ recharts ở
 * trang /admin đang dùng, nên response cắm thẳng vào chart được, không cần map.
 */
export interface AdminDashboardSummary {
  checkInsToday: number;
  checkInsYesterday: number;
  /** `null` khi hôm qua = 0 (không chia được), KHÔNG phải 0%. */
  checkInsChangePercent: number | null;
  publishedHotspots: number;
  publishedHotspotsThisWeek: number;
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  pendingPosts: number;
}

export interface CheckInTrendPoint {
  /** Nhãn thứ trong tuần: T2..T7, CN. */
  d: string;
  v: number;
  date: string;
}

export interface UserGrowthPoint {
  /** Nhãn tháng: "Thg 1".."Thg 12". */
  m: string;
  u: number;
  year: number;
  month: number;
}

export interface RouteEngagementPoint {
  routeId: number;
  r: string;
  /** Số lượt bắt đầu tuyến (RouteParticipant), không phải lượt xem. */
  views: number;
  completes: number;
  /** Phần trăm hoàn thành, `null` khi chưa có lượt bắt đầu nào. */
  completionRate: number | null;
}

export interface AdminRevenueSummary {
  totalRevenue: number;
  partnerRevenue: number;
  premiumRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueChangePercent: number | null;
  paidInvoices: number;
  activePartnerSubscriptions: number;
  activePremiumSubscriptions: number;
}

export interface AdminDashboard {
  summary: AdminDashboardSummary;
  checkInTrend: CheckInTrendPoint[];
  userGrowth: UserGrowthPoint[];
  routeEngagement: RouteEngagementPoint[];
  revenue: AdminRevenueSummary;
}

function adminPath(path: string) {
  return `/api/admin${path}`;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const adminApi = {
  getDashboard: async () => {
    return apiFetch<AdminDashboard>(adminPath("/dashboard"), {
      method: "GET",
      sameOrigin: true,
    });
  },

  getUsers: async (params: GetUsersParams = {}) => {
    const query = buildQuery({
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      search: params.search,
      status: params.status,
    });

    const response = await apiFetch<RawPageMaybeNested<UserProfile> | UserProfile[]>(
      adminPath(`/users${query}`),
      {
        method: "GET",
        sameOrigin: true,
      },
    );

    return normalizePage(response);
  },

  lockUser: async (userId: number) => {
    return apiFetch<MessageResponse>(adminPath(`/${userId}/lock`), {
      method: "PUT",
      sameOrigin: true,
    });
  },

  unlockUser: async (userId: number) => {
    return apiFetch<MessageResponse>(adminPath(`/${userId}/unlock`), {
      method: "PUT",
      sameOrigin: true,
    });
  },

  updateUserRole: async (userId: number, role: UserRole) => {
    return apiFetch<MessageResponse>(adminPath(`/${userId}/role`), {
      method: "PUT",
      body: { roles: role },
      sameOrigin: true,
    });
  },

  getPosts: async (params: GetPostsParams = {}) => {
    const query = buildQuery({
      status: params.status,
      page: params.page,
      size: params.size,
    });

    return apiFetch<SliceResponse<PostItem>>(`/api/posts${query}`, {
      method: "GET",
      sameOrigin: true,
    });
  },

  getPostById: async (postId: number) => {
    return apiFetch<PostItem>(`/api/posts/${postId}`, {
      method: "GET",
      sameOrigin: true,
    });
  },

  approvePost: async (postId: number) => {
    return apiFetch<PostItem>(adminPath(`/post/${postId}/approve`), {
      method: "PUT",
      sameOrigin: true,
    });
  },

  rejectPost: async (postId: number, rejectReason: string) => {
    return apiFetch<PostItem>(adminPath(`/post/${postId}/reject`), {
      method: "PUT",
      body: { rejectReason },
      sameOrigin: true,
    });
  },

  banPost: async (postId: number, reason: string) => {
    return apiFetch<PostItem>(adminPath(`/${postId}/ban`), {
      method: "PUT",
      body: { reason },
      sameOrigin: true,
    });
  },

  /**
   * GET /api/posts/reports — với tài khoản ADMIN trả về TẤT CẢ báo cáo chưa
   * xử lý (isReportResolved = false), sắp xếp postId giảm dần. Một bài viết có
   * thể xuất hiện nhiều dòng nếu bị nhiều người báo cáo.
   */
  getPostReports: async () => {
    return apiFetch<PostReportItem[]>("/api/posts/reports", {
      method: "GET",
      sameOrigin: true,
    });
  },

  /**
   * PUT /api/posts/{id}/reports — xử lý (một lượt) các báo cáo của cùng 1 bài.
   * Backend từ chối nếu bài đã ở trạng thái REPORTED hoặc báo cáo đã xử lý.
   */
  handlePostReport: async (postId: number, request: HandlePostReportRequest) => {
    return apiFetch<PostItem>(`/api/posts/${postId}/reports`, {
      method: "PUT",
      body: request,
      sameOrigin: true,
    });
  },

  /**
   * API dự kiến cho backend trong tương lai.
   * `id` trong mỗi phần tử trả về sẽ được dùng cho API verify bên dưới.
   */
  getPartnerSubscriptions: async (params: GetPartnerSubscriptionsParams = {}) => {
    const query = buildQuery({
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      search: params.search,
      status: params.status,
    });

    const response = await apiFetch<
      RawPageMaybeNested<PartnerSubscription> | PartnerSubscription[]
    >(adminPath(`/subscriptions${query}`), { method: "GET", sameOrigin: true });

    return normalizePage(response);
  },

  /**
   * API duyệt/từ chối đăng ký Partner đã được setup trước ở frontend.
   * Backend dự kiến: PATCH /api/admin/subscription/{id}/verify?isApproved=true|false
   */
  verifyPartnerSubscription: async (subscriptionId: number, isApproved: boolean) => {
    return apiFetch<PartnerSubscription>(
      adminPath(`/subscription/${subscriptionId}/verify?isApproved=${isApproved}`),
      {
        method: "PATCH",
        sameOrigin: true,
      },
    );
  },

  getAuditLogs: async (params: GetAuditLogsParams = {}) => {
    const query = buildQuery({
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      search: params.search,
      userId: params.userId,
      action: params.action,
      tableName: params.tableName,
      from: params.from,
      to: params.to,
    });

    const response = await apiFetch<RawPageMaybeNested<AuditLog> | AuditLog[]>(
      adminPath(`/audit-logs${query}`),
      {
        method: "GET",
        sameOrigin: true,
      },
    );

    return normalizePage(response);
  },

  getSubscriptionPlans: async (params: GetSubscriptionPlansParams = {}) => {
    const query = buildQuery({
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      search: params.search,
      status: params.status,
      planType: params.planType,
    });

    const response = await apiFetch<
      RawPageMaybeNested<SubscriptionPlan> | SubscriptionPlan[]
    >(adminPath(`/subscription-plans${query}`), {
      method: "GET",
      sameOrigin: true,
    });

    return normalizePage(response);
  },

  createSubscriptionPlan: async (payload: SubscriptionPlanPayload) => {
    return apiFetch<SubscriptionPlan>(adminPath("/subscription-plans"), {
      method: "POST",
      body: payload,
      sameOrigin: true,
    });
  },

  updateSubscriptionPlan: async (id: number, payload: SubscriptionPlanPayload) => {
    return apiFetch<SubscriptionPlan>(adminPath(`/subscription-plans/${id}`), {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    });
  },

  deleteSubscriptionPlan: async (id: number) => {
    return apiFetch<void>(adminPath(`/subscription-plans/${id}`), {
      method: "DELETE",
      sameOrigin: true,
    });
  },

  // ─── Permission Management ─────────────────────────────────────────────────

  /** Danh sách tất cả quyền, nhóm theo groupName */
  getPermissions: async () => {
    return apiFetch<PermissionGroupResponse[]>(adminPath("/permissions"), {
      method: "GET",
      sameOrigin: true,
    });
  },

  /** Ma trận role ↔ permission: allPermissions + matrix (role → code[]) */
  getPermissionMatrix: async () => {
    return apiFetch<RolePermissionMatrixResponse>(
      adminPath("/permissions/matrix"),
      { method: "GET", sameOrigin: true },
    );
  },

  /** Bulk replace toàn bộ permission của 1 role */
  updateRolePermissions: async (role: UserRole, codes: string[]) => {
    return apiFetch<MessageResponse>(adminPath(`/permissions/matrix/${role}`), {
      method: "PUT",
      body: { codes },
      sameOrigin: true,
    });
  },

  /** Cấp 1 permission đơn lẻ cho role */
  grantRolePermission: async (role: UserRole, code: string) => {
    return apiFetch<MessageResponse>(
      adminPath(`/permissions/roles/${role}/${code}`),
      { method: "POST", sameOrigin: true },
    );
  },

  /** Thu hồi 1 permission đơn lẻ khỏi role */
  revokeRolePermission: async (role: UserRole, code: string) => {
    return apiFetch<MessageResponse>(
      adminPath(`/permissions/roles/${role}/${code}`),
      { method: "DELETE", sameOrigin: true },
    );
  },

  /** Lấy danh sách ngoại lệ quyền cá nhân của 1 user */
  getUserPermissions: async (userId: number) => {
    return apiFetch<UserPermissionResponse[]>(
      adminPath(`/permissions/users/${userId}`),
      { method: "GET", sameOrigin: true },
    );
  },

  /** Tạo hoặc cập nhật ngoại lệ quyền cho user (granted / revoked) */
  upsertUserPermission: async (
    userId: number,
    request: GrantUserPermissionRequest,
  ) => {
    return apiFetch<MessageResponse>(
      adminPath(`/permissions/users/${userId}`),
      { method: "PUT", body: request, sameOrigin: true },
    );
  },

  /** Xoá hẳn ngoại lệ quyền của user (trả về quyền mặc định của role) */
  deleteUserPermission: async (userId: number, code: string) => {
    return apiFetch<MessageResponse>(
      adminPath(`/permissions/users/${userId}/${code}`),
      { method: "DELETE", sameOrigin: true },
    );
  },
};

export default adminApi;
