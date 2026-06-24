import { apiFetch } from "@/lib/api";

export type UserRole = "EXPLORER" | "CURATOR" | "ADMIN" | "PARTNER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "DELETED";
export type PostStatus = "APPROVED" | "PENDING" | "REJECTED" | "DELETED";
export type SubscriptionPlanStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export interface PageResponse<T> {
  content: T[];
 page: {
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
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

export interface PostItem {
  postId: number;
  userId: number;
  username: string;
  displayName: string;
  content: string;
  visibility?: string;
  status: PostStatus;
  reason?: string;
  isTaggedHotspot?: boolean;
  isTaggedRoute?: boolean;
  hotspotIds?: number[];
  routeIds?: number[];
  tags?: Array<{ tagId: number; tagName: string }>;
  createdAt?: string;
  pointRemaining?: number;
}

export interface SubscriptionPlan {
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  subscriptionPlanDescription?: string;
  priceMonthly: number;
  priceYearly: number;
  configLimit?: Record<string, unknown>;
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
  status?: string;
  startDate?: string;
  endDate?: string;
  isVerified?: boolean;
  documentUrl?: string;
  medias?: Array<{
    mediaId: number;
    fileUrl: string;
    fileName: string;
    mediaType: string;
  }>;
}

export interface MessageResponse {
  message: string;
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
}

export interface SubscriptionPlanPayload {
  subscriptionPlanName: string;
  subscriptionPlanDescription?: string;
  priceMonthly: number;
  priceYearly: number;
  configLimit?: Record<string, unknown>;
}

export interface GetPostsParams {
  status?: PostStatus;
  page?: number;
  size?: number;
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
  getUsers: async (params: GetUsersParams = {}) => {
    const query = buildQuery({
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      search: params.search,
      status: params.status,
    });

    return apiFetch<PageResponse<UserProfile>>(adminPath(`/users${query}`), {
      method: "GET",
      sameOrigin: true,
    });
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

  verifyPartnerSubscription: async (subscriptionId: number, isApproved: boolean) => {
    return apiFetch<PartnerSubscription>(
      adminPath(`/subscription/${subscriptionId}/verify?isApproved=${isApproved}`),
      {
        method: "PATCH",
        sameOrigin: true,
      },
    );
  },

  getSubscriptionPlans: async (params: GetSubscriptionPlansParams = {}) => {
    const query = buildQuery({
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      search: params.search,
      status: params.status,
    });

    return apiFetch<PageResponse<SubscriptionPlan>>(adminPath(`/subscription-plans${query}`), {
      method: "GET",
      sameOrigin: true,
    });
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
};

export default adminApi;
