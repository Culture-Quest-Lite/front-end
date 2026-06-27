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
  status?: RouteStatus;
  files?: File[];
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
  filters?: RouteSearchFilter[];
  page?: number;
  size?: number;
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

const ROUTE_BASE_URL = "/api/routes";

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
 * Backend create:
 *
 * @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
 * public ResponseEntity<RouteResponse> create(@Valid @ModelAttribute RouteRequest routeRequest)
 *
 * Vì backend dùng @ModelAttribute, KHÔNG gửi hotspots/tagIds bằng JSON string.
 * Phải gửi dạng indexed fields:
 *
 * hotspots[0].hotspotId = 1
 * hotspots[0].index = 0
 * hotspots[1].hotspotId = 2
 * hotspots[1].index = 1
 *
 * tagIds = 1
 * tagIds = 2
 */
function buildRouteFormData(payload: RoutePayload) {
  const formData = new FormData();

  payload.files?.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("routeName", payload.routeName);

  if (payload.description?.trim()) {
    formData.append("description", payload.description.trim());
  }

  formData.append("difficulty", payload.difficulty);
  formData.append("estimateTime", String(payload.estimateTime));
  formData.append("totalDistance", String(payload.totalDistance));

  payload.hotspots.forEach((hotspot, index) => {
    formData.append(`hotspots[${index}].hotspotId`, String(hotspot.hotspotId));
    formData.append(`hotspots[${index}].index`, String(hotspot.index));
  });

  payload.tagIds.forEach((tagId) => {
    formData.append("tagIds", String(tagId));
  });

  formData.append("xp", String(payload.xp));
  formData.append("point", String(payload.point));

  if (payload.status) {
    formData.append("status", payload.status);
  }

  return formData;
}

function buildSearchQuery(payload: RouteSearchRequest) {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(payload.page ?? 0));
  searchParams.set("size", String(payload.size ?? 10));

  if (payload.sortBy) {
    searchParams.set("sortBy", payload.sortBy);
  }

  if (payload.sortDirection) {
    searchParams.set("sortDirection", payload.sortDirection);
  }

  payload.filters?.forEach((filter, index) => {
    searchParams.set(`filters[${index}].field`, filter.field);
    searchParams.set(`filters[${index}].operator`, filter.operator);

    if (filter.value !== undefined && filter.value !== null) {
      searchParams.set(`filters[${index}].value`, String(filter.value));
    }

    filter.values?.forEach((value) => {
      if (value !== null) {
        searchParams.append(`filters[${index}].values`, String(value));
      }
    });
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const routeApi = {
  getRouteById: async (routeId: number) => {
    return apiFetch<RouteResponse>(`${ROUTE_BASE_URL}/${routeId}`, {
      method: "GET",
      sameOrigin: true,
    });
  },

  /**
   * Backend:
   * @GetMapping("/search")
   * filterRoutes(@ModelAttribute SearchRequest request)
   *
   * Vì vậy không gửi body trong GET.
   */
  searchRoutes: async (
    payload: RouteSearchRequest,
  ): Promise<RouteSearchResponse> => {
    const raw = await apiFetch<RawPageMaybeNested<RouteResponse>>(
      `${ROUTE_BASE_URL}/search${buildSearchQuery(payload)}`,
      {
        method: "GET",
        sameOrigin: true,
      },
    );

    return normalizePage<RouteResponse>(raw);
  },

  createRoute: async (payload: RoutePayload) => {
    return apiFetch<RouteResponse>(ROUTE_BASE_URL, {
      method: "POST",
      body: buildRouteFormData(payload),
      sameOrigin: true,
    });
  },


  updateRoute: async (routeId: number, payload: RoutePayload) => {
    const { files: _files, ...jsonPayload } = payload;

    return apiFetch<RouteResponse>(`${ROUTE_BASE_URL}/${routeId}`, {
      method: "PUT",
      body: jsonPayload,
      sameOrigin: true,
    });
  },

  addHotspotToRoute: async (routeId: number, hotspotId: number) => {
    return apiFetch<RouteResponse>(
      `${ROUTE_BASE_URL}/${routeId}/add/${hotspotId}`,
      {
        method: "POST",
        sameOrigin: true,
      },
    );
  },

  removeHotspotFromRoute: async (routeId: number, hotspotId: number) => {
    return apiFetch<RouteResponse>(
      `${ROUTE_BASE_URL}/${routeId}/remove/${hotspotId}`,
      {
        method: "DELETE",
        sameOrigin: true,
      },
    );
  },

  deleteRoute: async (routeId: number) => {
    return apiFetch<string>(`${ROUTE_BASE_URL}/${routeId}`, {
      method: "DELETE",
      sameOrigin: true,
    });
  },
};

export default routeApi;
