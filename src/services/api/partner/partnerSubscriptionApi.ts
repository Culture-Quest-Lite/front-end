import { apiFetch } from "@/lib/api";

export type UserRole = "EXPLORER" | "CURATOR" | "ADMIN" | "PARTNER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "DELETED" | "PENDING";

export type PartnerSubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "INACTIVE"
  | "EXPIRED"
  | "REJECTED"
  | "DELETED"
  | string;

export type BillingCycle = "MONTHLY" | "YEARLY" | string;
export type SubscriptionPlanType = "PREMIUM" | "PARTNER";

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

export interface SubscriptionPlanResponse {
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  subscriptionPlanDescription?: string | null;
  priceMonthly: number;
  priceYearly: number;
  configLimit?: Record<string, unknown> | null;
  planType: SubscriptionPlanType;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PartnerSubscriptionMedia {
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

export interface PartnerSubscriptionResponse {
  id: number;
  partnerId: number;
  partnerName: string;
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  shopName: string;
  address?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  billingCycle?: BillingCycle | null;
  status?: PartnerSubscriptionStatus | null;
  startDate?: string | null;
  endDate?: string | null;
  isVerified?: boolean | null;
  documentUrl?: string | null;
  medias?: PartnerSubscriptionMedia[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PartnerSubscriptionRegisterRequest {
  subscriptionPlanId: number;
  shopName: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  billingCycle?: BillingCycle;
  document?: File;
  files?: File[];
}

function appendIfDefined(formData: FormData, key: string, value: string | number | boolean | undefined | null) {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, String(value));
}

function buildRegisterSubscriptionFormData(payload: PartnerSubscriptionRegisterRequest) {
  const formData = new FormData();

  formData.append("subscriptionPlanId", String(payload.subscriptionPlanId));
  formData.append("shopName", payload.shopName);

  appendIfDefined(formData, "address", payload.address);
  appendIfDefined(formData, "longitude", payload.longitude);
  appendIfDefined(formData, "latitude", payload.latitude);
  appendIfDefined(formData, "billingCycle", payload.billingCycle);

  if (payload.document) {
    formData.append("document", payload.document);
  }

  payload.files?.forEach((file) => {
    formData.append("files", file);
  });

  return formData;
}

export const partnerSubscriptionApi = {
  getCurrentUser: async () =>
    apiFetch<CurrentUserProfileResponse>("/api/users/me", {
      method: "GET",
      sameOrigin: true,
    }),

  getCurrentUserId: async () => {
    const user = await partnerSubscriptionApi.getCurrentUser();

    if (!user.userId) {
      throw new Error("Không tìm thấy userId của tài khoản đang đăng nhập.");
    }

    return user.userId;
  },
  registerSubscription: async (payload: PartnerSubscriptionRegisterRequest) =>
    apiFetch<PartnerSubscriptionResponse>("/api/partner/subscriptions/register", {
      method: "POST",
      body: buildRegisterSubscriptionFormData(payload),
      sameOrigin: true,
    }),
  getMySubscriptions: async () =>
    apiFetch<PartnerSubscriptionResponse[]>("/api/partner/subscriptions/my", {
      method: "GET",
      sameOrigin: true,
    }),


  getSubscriptionPlanDetail: async (subscriptionPlanId: number) =>
    apiFetch<SubscriptionPlanResponse>(
      `/api/partner/subscriptions/${subscriptionPlanId}`,
      {
        method: "GET",
        sameOrigin: true,
      },
    ),


  getSubscriptionsByPartnerId: async (partnerId: number) =>
    apiFetch<PartnerSubscriptionResponse[]>(
      `/api/partner/${partnerId}/subscriptions`,
      {
        method: "GET",
        sameOrigin: true,
      },
    ),


  getMySubscriptionsByCurrentUserId: async () => {
    const userId = await partnerSubscriptionApi.getCurrentUserId();
    return partnerSubscriptionApi.getSubscriptionsByPartnerId(userId);
  },
};

export default partnerSubscriptionApi;
