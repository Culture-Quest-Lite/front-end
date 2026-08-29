import { apiFetch } from "@/lib/api";
import type { TagUsageRecord } from "@/lib/tags";
import type { BackendStory } from "./storyApi";

export type HotspotContentType = "TEMP" | "PERMANENT" | (string & {});

export interface BackendHotspotTag {
  tagId: number;
  tagName: string;
  imageUrl?: string | null;
  tagStatus?: string;
  routeCount?: number | null;
  hotspotCount?: number | null;
  storyCount?: number | null;
  cultureScore?: number | null;
  cultureReason?: string | null;
  rejectReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  usages?: TagUsageRecord[] | null;
}

export interface BackendHotspotMedia {
  mediaId: number;
  mediaType?: string;
  mimeType?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number | null;
  duration?: number | null;
  displayOrder?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendHotspot {
  hotspotId: number;
  tags?: BackendHotspotTag[];
  medias?: BackendHotspotMedia[];
  stories?: BackendStory[];
  createByUserId?: number;
  hotspotName?: string;
  address?: string;
  description?: string;
  historyInformation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  checkInRadius?: number | null;
  /** GeoJSON Polygon; backend chỉ trả ở màn chi tiết để tránh N+1. */
  boundaryGeoJson?: string | null;
  createdAt?: string;
  updatedAt?: string;
  xp?: number | null;
  point?: number | null;
  estimatedDurationMin?: number | null;
  estimatedDurationMax?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
  status?: string;
  isCheckIn?: boolean | null;
  averageRating?: number | null;
  totalReviews?: number | null;
  contentType?: HotspotContentType | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface CreateHotspotPayload {
  hotspotName: string;
  address?: string;
  description?: string;
  historyInformation?: string;
  latitude: number;
  longitude: number;
  /** Bán kính vùng check-in (mét), 20-5000. Bỏ trống backend dùng 50m. */
  checkInRadius?: number;
  /** GeoJSON Polygon đã stringify. Có polygon thì backend ưu tiên polygon hơn bán kính. */
  boundaryGeoJson?: string;
  estimatedDurationMin: number;
  estimatedDurationMax: number;
  startTime: string;
  endTime: string;
  openingTime?: string;
  closingTime?: string;
  contentType?: HotspotContentType;
  validFrom?: string;
  validTo?: string;
}

export type HotspotSearchOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "LIKE"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN_OR_EQUAL"
  | "IN";

type HotspotSearchPrimitive = string | number | boolean | null;

export interface HotspotSearchFilter {
  field: string;
  operator: HotspotSearchOperator;
  value?: HotspotSearchPrimitive;
  values?: HotspotSearchPrimitive[];
}

export interface HotspotSearchRequest {
  filters: HotspotSearchFilter[];
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface HotspotSearchResponse {
  content: BackendHotspot[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

type HotspotStatus =
  | "ACTIVE"
  | "APPROVED"
  | "ARCHIVED"
  | "DELETED"
  | "DRAFT"
  | "INACTIVE"
  | "PENDING"
  | "PUBLISHED"
  | "REJECTED"
  | "SUBMITTED";

const PUBLISHED_HOTSPOT_STATUS = "PUBLISHED";

export function isPublishedHotspotStatus(status?: string | null) {
  return status?.trim().toUpperCase() === PUBLISHED_HOTSPOT_STATUS;
}

export function filterPublishedHotspots<T extends { status?: string | null }>(
  hotspots: T[],
) {
  return hotspots.filter((hotspot) => isPublishedHotspotStatus(hotspot.status));
}

export const hotspotApi = {
  getHotspots: async () => {
    return apiFetch<BackendHotspot[]>("/api/hotspots", {
      method: "GET",
      sameOrigin: true,
      cache: "no-store",
    });
  },

  getHotspotById: async (hotspotId: number) => {
    return apiFetch<BackendHotspot>(`/api/hotspots/${hotspotId}`, {
      method: "GET",
      sameOrigin: true,
      cache: "no-store",
    });
  },

  createHotspot: async (payload: CreateHotspotPayload | FormData) => {
    return apiFetch<BackendHotspot>("/api/hotspots", {
      method: "POST",
      body: payload,
      sameOrigin: true,
    });
  },

  searchHotspots: async (payload: HotspotSearchRequest) => {
    const searchParams = new URLSearchParams();

    searchParams.set("page", String(payload.page));
    searchParams.set("size", String(payload.size));

    if (payload.sortBy?.trim()) {
      searchParams.set("sortBy", payload.sortBy.trim());
    }

    if (payload.sortDirection?.trim()) {
      searchParams.set("sortDirection", payload.sortDirection.trim());
    }

    payload.filters.forEach((filter, filterIndex) => {
      const filterKey = `filters[${filterIndex}]`;

      searchParams.set(`${filterKey}.field`, filter.field);
      searchParams.set(`${filterKey}.operator`, filter.operator);

      if (filter.value !== undefined && filter.value !== null) {
        searchParams.set(`${filterKey}.value`, String(filter.value));
      }

      filter.values?.forEach((value, valueIndex) => {
        if (value === undefined || value === null) {
          return;
        }

        searchParams.set(`${filterKey}.values[${valueIndex}]`, String(value));
      });
    });

    return apiFetch<HotspotSearchResponse>(
      `/api/hotspots/search?${searchParams.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        sameOrigin: true,
      },
    );
  },

  updateHotspot: async (
    hotspotId: number,
    payload: CreateHotspotPayload | FormData,
  ) => {
    return apiFetch<BackendHotspot>(`/api/hotspots/${hotspotId}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    });
  },

  updateHotspotStatus: async (hotspotId: number, status: HotspotStatus) => {
    const searchParams = new URLSearchParams({ status });

    return apiFetch<BackendHotspot | string>(
      `/api/hotspots/${hotspotId}?${searchParams.toString()}`,
      {
        method: "PUT",
        headers: {
          "x-hotspot-subresource": "status",
        },
        sameOrigin: true,
      },
    );
  },

  deleteHotspot: async (hotspotId: number) => {
    const response = await fetch(`/api/hotspots/${hotspotId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        accept: "text/plain, application/json",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const responseText = await response.text();
    const parsedBody = contentType.includes("application/json")
      ? safeParseJson(responseText)
      : null;
    const message =
      typeof parsedBody?.message === "string"
        ? parsedBody.message
        : typeof parsedBody?.error === "string"
          ? parsedBody.error
          : responseText.trim();

    if (!response.ok) {
      throw new Error(message || "Không thể xóa hotspot.");
    }

    return message || "Hotspot deleted successfully";
  },
};

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as { message?: unknown; error?: unknown };
  } catch {
    return null;
  }
}
