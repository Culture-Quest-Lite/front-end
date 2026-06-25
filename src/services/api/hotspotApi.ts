import { apiFetch } from "@/lib/api";

export interface BackendHotspotTag {
  tagId: number;
  tagName: string;
  tagStatus?: string;
  createdAt?: string;
  updatedAt?: string;
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
  createByUserId?: number;
  hotspotName?: string;
  address?: string;
  description?: string;
  historyInformation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  checkInRadius?: number | null;
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
}

export interface CreateHotspotPayload {
  tagIds: number[];
  hotspotName: string;
  address: string;
  description: string;
  historyInformation: string;
  latitude: number;
  longitude: number;
  checkInRadius: number;
  xp: number;
  point: number;
  estimatedDurationMin: number;
  estimatedDurationMax: number;
  startTime: string;
  endTime: string;
  openingTime: string;
  closingTime: string;
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

export const hotspotApi = {
  getHotspots: async () => {
    return apiFetch<BackendHotspot[]>("/api/hotspots", {
      method: "GET",
      sameOrigin: true,
    });
  },

  getHotspotById: async (hotspotId: number) => {
    return apiFetch<BackendHotspot>(`/api/hotspots/${hotspotId}`, {
      method: "GET",
      sameOrigin: true,
    });
  },

  createHotspot: async (payload: CreateHotspotPayload) => {
    return apiFetch<BackendHotspot>("/api/hotspots", {
      method: "POST",
      body: payload,
      sameOrigin: true,
    });
  },

  searchHotspots: async (payload: HotspotSearchRequest) => {
    return apiFetch<HotspotSearchResponse>("/api/hotspots/search", {
      method: "POST",
      body: payload,
      sameOrigin: true,
    });
  },

  updateHotspot: async (hotspotId: number, payload: CreateHotspotPayload) => {
    return apiFetch<BackendHotspot>(`/api/hotspots/${hotspotId}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    });
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
