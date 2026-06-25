import { apiFetch } from "@/lib/api";
import type { BackendHotspotTag } from "./hotspotApi";

export type RouteDifficulty = "EASY" | "MEDIUM" | "HARD";
export type RouteStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DELETED"
  | string;

export interface RouteHotspotPayload {
  hotspotId: number;
  index: number;
}

export interface RoutePayload {
  routeName: string;
  description?: string;
  difficulty: RouteDifficulty;
  estimateTime: number;
  totalDistance: number;
  hotspots: RouteHotspotPayload[];
  tagIds: number[];
  xp: number;
  point: number;
}

export interface RouteHotspotResponse {
  routeHotspotId: number;
  routeId: number;
  hotspotId: number;
  hotspotName: string;
  address: string;
  xp: number;
  index: number;
  distanceToNext?: number | null;
}

export interface RouteResponse {
  routeId: number;
  routeName: string;
  description?: string | null;
  difficulty: RouteDifficulty;
  estimateTime: number;
  totalDistance: number;
  status: RouteStatus;
  xp: number;
  point: number;
  tags?: BackendHotspotTag[];
  hotspots?: RouteHotspotResponse[];
}

export type RouteSearchOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "LIKE"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN_OR_EQUAL"
  | "IN";

type RouteSearchPrimitive = string | number | boolean | null;

export interface RouteSearchFilter {
  field: string;
  operator: RouteSearchOperator;
  value?: RouteSearchPrimitive;
  values?: RouteSearchPrimitive[];
}

export interface RouteSearchRequest {
  filters: RouteSearchFilter[];
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export type RouteSearchResponse = PageResponse<RouteResponse>;

interface RawPageMaybeNested<T> {
  content?: T[];
  page?: Partial<PageResponse<T>["page"]>;
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

export const routeApi = {
  getRouteById: async (routeId: number) => {
    return apiFetch<RouteResponse>(`/api/routes/${routeId}`, {
      method: "GET",
      sameOrigin: true,
    });
  },

  searchRoutes: async (
    payload: RouteSearchRequest,
  ): Promise<RouteSearchResponse> => {
    const raw = await apiFetch<RawPageMaybeNested<RouteResponse>>(
      "/api/routes/search",
      {
        method: "POST",
        body: payload,
        sameOrigin: true,
      },
    );

    return normalizePage<RouteResponse>(raw);
  },

  createRoute: async (payload: RoutePayload) => {
    return apiFetch<RouteResponse>("/api/routes", {
      method: "POST",
      body: payload,
      sameOrigin: true,
    });
  },

  updateRoute: async (routeId: number, payload: RoutePayload) => {
    return apiFetch<RouteResponse>(`/api/routes/${routeId}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    });
  },

  addHotspotToRoute: async (routeId: number, hotspotId: number) => {
    return apiFetch<RouteResponse>(`/api/routes/${routeId}/add/${hotspotId}`, {
      method: "POST",
      sameOrigin: true,
    });
  },

  removeHotspotFromRoute: async (routeId: number, hotspotId: number) => {
    return apiFetch<RouteResponse>(
      `/api/routes/${routeId}/remove/${hotspotId}`,
      {
        method: "DELETE",
        sameOrigin: true,
      },
    );
  },

  deleteRoute: async (routeId: number) => {
    return apiFetch<string>(`/api/routes/${routeId}`, {
      method: "DELETE",
      sameOrigin: true,
    });
  },
};

export default routeApi;