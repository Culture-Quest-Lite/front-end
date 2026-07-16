import { apiFetch } from "@/lib/api";
import type { BackendHotspotTag } from "./hotspotApi";

export type RouteDifficulty = "EASY" | "MEDIUM" | "HARD";

export type RouteStatus =
  | "DRAFT"
  | "RECORDING"
  | "TRIAL"
  | "PENDING"
  | "PUBLISHED"
  | "DELETED";

export interface RoutePayload {
  routeName: string;
  description?: string;
  difficulty: RouteDifficulty;
  estimateTime: number;
  totalDistance: number;
  hotspotIds: number[];
  tagId: number;
  xp: number;
  point: number;
  status?: RouteStatus;
  files?: File[];
}

export interface RouteHotspotResponse {
  routeHotspotId?: number;
  routeId?: number;
  hotspotId: number;
  hotspotName?: string;
  address?: string;
  xp?: number;
  index?: number;
  orderIndex?: number;
  distanceToNext?: number | null;
}

export interface RouteMediaResponse {
  mediaId?: number;
  mediaType?: string;
  mimeType?: string;
  fileUrl?: string;
  mediaUrl?: string;
  url?: string;
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
  totalStops?: number | null;
  tag?: BackendHotspotTag | null;
  tags?: BackendHotspotTag[];
  hotspots?: RouteHotspotResponse[];
  medias?: RouteMediaResponse[];
  media?: RouteMediaResponse[];
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
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

/** Build multipart payload matching backend RouteRequest.hotspotIds. */
function buildRouteFormData(payload: RoutePayload) {
  const formData = new FormData();

  payload.files?.forEach((file) => formData.append("files", file));
  formData.append("routeName", payload.routeName);
  if (payload.description?.trim()) {
    formData.append("description", payload.description.trim());
  }
  formData.append("difficulty", payload.difficulty);
  formData.append("estimateTime", String(payload.estimateTime));
  formData.append("totalDistance", String(payload.totalDistance));
  payload.hotspotIds.forEach((hotspotId) => {
    formData.append("hotspotIds", String(hotspotId));
  });
  formData.append("tagId", String(payload.tagId));
  formData.append("xp", String(payload.xp));
  formData.append("point", String(payload.point));
  if (payload.status) formData.append("status", payload.status);
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


function normalizeRouteResponse(route: RouteResponse): RouteResponse {
  const normalizedTags =
    route.tags && route.tags.length > 0
      ? route.tags
      : route.tag
        ? [route.tag]
        : [];

  return {
    ...route,
    tag: route.tag ?? normalizedTags[0] ?? null,
    tags: normalizedTags,
  };
}

function toRoutePayload(route: RouteResponse, status?: RouteStatus): RoutePayload {
  return {
    routeName: route.routeName,
    description: route.description ?? "",
    difficulty: route.difficulty,
    estimateTime: route.estimateTime ?? 0,
    totalDistance: route.totalDistance ?? 0,
    hotspotIds: (route.hotspots ?? []).map((hotspot) => hotspot.hotspotId),
    tagId:
      route.tag?.tagId ??
      route.tags?.[0]?.tagId ??
      (() => {
        throw new Error("Route không có tagId để cập nhật.");
      })(),
    xp: route.xp ?? 0,
    point: route.point ?? 0,
    status: status ?? route.status,
  };
}

export const routeApi = {
  getRouteById: async (routeId: number) => {
    const route = await apiFetch<RouteResponse>(`${ROUTE_BASE_URL}/${routeId}`, {
      method: "GET",
      sameOrigin: true,
    });

    return normalizeRouteResponse(route);
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

    const page = normalizePage<RouteResponse>(raw);

    return {
      ...page,
      content: page.content.map(normalizeRouteResponse),
    };
  },

  createRoute: async (payload: RoutePayload) => {
    const route = await apiFetch<RouteResponse>(ROUTE_BASE_URL, {
      method: "POST",
      body: buildRouteFormData(payload),
      sameOrigin: true,
    });

    return normalizeRouteResponse(route);
  },

  updateRoute: async (routeId: number, payload: RoutePayload) => {
    const { files: _files, ...jsonPayload } = payload;

    const route = await apiFetch<RouteResponse>(`${ROUTE_BASE_URL}/${routeId}`, {
      method: "PUT",
      body: jsonPayload,
      sameOrigin: true,
    });

    return normalizeRouteResponse(route);
  },

  publishRoute: async (routeId: number) => {
    const route = await routeApi.getRouteById(routeId);
    const payload = toRoutePayload(route, "PUBLISHED");

    if (!payload.routeName.trim()) throw new Error("Tuyến chưa có tên.");
    if (!payload.tagId) throw new Error("Tuyến chưa có tag.");
    if (payload.hotspotIds.length < 4) {
      throw new Error("Tuyến phải có ít nhất 4 hotspot trước khi publish.");
    }
    if (payload.estimateTime <= 0 || payload.totalDistance <= 0) {
      throw new Error("Thời lượng và khoảng cách phải lớn hơn 0.");
    }

    return routeApi.updateRoute(routeId, payload);
  },

  addHotspotToRoute: async (routeId: number, hotspotId: number) => {
    const route = await routeApi.getRouteById(routeId);
    const payload = toRoutePayload(route);
    if (!payload.hotspotIds.includes(hotspotId)) payload.hotspotIds.push(hotspotId);
    return routeApi.updateRoute(routeId, payload);
  },

  removeHotspotFromRoute: async (routeId: number, hotspotId: number) => {
    const route = await routeApi.getRouteById(routeId);
    const payload = toRoutePayload(route);
    payload.hotspotIds = payload.hotspotIds.filter((id) => id !== hotspotId);
    if (payload.hotspotIds.length < 4) {
      throw new Error("Tuyến phải giữ tối thiểu 4 hotspot.");
    }
    return routeApi.updateRoute(routeId, payload);
  },

  deleteRoute: async (routeId: number) => {
    return apiFetch<string>(`${ROUTE_BASE_URL}/${routeId}`, {
      method: "DELETE",
      sameOrigin: true,
    });
  },
};

export default routeApi;
