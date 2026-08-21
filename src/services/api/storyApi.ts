import { apiFetch } from "@/lib/api";
import type { TagUsageRecord } from "@/lib/tags";

export interface BackendStoryTag {
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

export interface BackendStoryMedia {
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

export interface BackendStory {
  storyId: number;
  tag?: BackendStoryTag | null;
  hotspotId?: number | null;
  routeId?: number | null;
  orderIndex?: number | null;
  title: string;
  content: string;
  status: string;
  distanceToNext?: number | null;
  audioScript?: string | null;
  medias?: BackendStoryMedia[];
  cultureScore?: number | null;
  cultureReason?: string | null;
  rejectReason?: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendStorySummary {
  storyId: number;
  tag?: BackendStoryTag | null;
  hotspotId?: number | null;
  routeId?: number | null;
  orderIndex?: number | null;
  title: string;
  content: string;
  status: string;
  distanceToNext?: number | null;
  audioScript?: string | null;
  medias?: BackendStoryMedia[];
  cultureScore?: number | null;
  cultureReason?: string | null;
  rejectReason?: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateStoryResponse = BackendStorySummary;

export interface StoryPageResponse {
  content: BackendStorySummary[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

type GetStoriesResponse = StoryPageResponse | BackendStorySummary[];

export interface GetStoriesParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  keyword?: string;
  status?: string;
  tagId?: number;
  hotspotId?: number;
  routeId?: number;
}

export interface UpdateStoryFields {
  tagId: number;
  hotspotId: number;
  title: string;
  content: string;
  audioScript?: string;
}

export interface CreateStoryPayload extends UpdateStoryFields {
  files?: File[];
  confirmCultural?: boolean;
}

export type UpdateStoryPayload =
  | FormData
  | (UpdateStoryFields & {
      files?: string[];
    });

export const storyApi = {
  getStories: async (params: GetStoriesParams) => {
    const searchParams = new URLSearchParams();

    if (typeof params.page === "number") {
      searchParams.set("page", String(params.page));
    }

    if (typeof params.size === "number") {
      searchParams.set("size", String(params.size));
    }

    if (params.sortBy?.trim()) {
      searchParams.set("sortBy", params.sortBy.trim());
    }

    if (params.sortDir?.trim()) {
      searchParams.set("sortDir", params.sortDir.trim());
    }

    if (params.keyword?.trim()) {
      searchParams.set("keyword", params.keyword.trim());
    }

    if (params.status?.trim()) {
      searchParams.set("status", params.status.trim());
    }

    if (typeof params.tagId === "number") {
      searchParams.set("tagId", String(params.tagId));
    }

    if (typeof params.hotspotId === "number") {
      searchParams.set("hotspotId", String(params.hotspotId));
    }

    if (typeof params.routeId === "number") {
      searchParams.set("routeId", String(params.routeId));
    }

    const queryString = searchParams.toString();
    const response = await apiFetch<GetStoriesResponse>(
      queryString ? `/api/stories?${queryString}` : "/api/stories",
      {
        sameOrigin: true,
      },
    );

    return normalizeStoryPageResponse(response, params);
  },

  createStory: async (payload: FormData | CreateStoryPayload) => {
    const body = isFormDataPayload(payload)
      ? payload
      : buildCreateStoryFormData(payload);

    return apiFetch<CreateStoryResponse>("/api/stories", {
      method: "POST",
      body,
      sameOrigin: true,
    });
  },

  deleteStory: async (storyId: number) => {
    const response = await fetch(`/api/stories/${storyId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        accept: "text/plain, application/json",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const responseText = await response.text();
    const parsedBody = contentType.includes("application/json")
      ? safeParseStoryResponse(responseText)
      : null;
    const message =
      typeof parsedBody?.message === "string"
        ? parsedBody.message
        : typeof parsedBody?.error === "string"
          ? parsedBody.error
          : responseText.trim();

    if (!response.ok) {
      throw new Error(message || "Không thể xóa story.");
    }

    return message || "Story deleted successfully";
  },

  getStoryById: async (storyId: number) => {
    return apiFetch<BackendStory>(`/api/stories/${storyId}`, {
      sameOrigin: true,
    });
  },

  updateStory: async (
    storyId: number,
    payload: UpdateStoryPayload,
  ) => {
    return apiFetch<BackendStory | string>(`/api/stories/${storyId}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    });
  },

  updateStoryStatus: async (storyId: number, status: string) => {
    const searchParams = new URLSearchParams({ status });
    const response = await fetch(
      `/api/stories/${storyId}/status?${searchParams.toString()}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          accept: "application/json, text/plain",
        },
      },
    );
    const contentType = response.headers.get("content-type") ?? "";
    const responseText = await response.text();
    const parsedBody = contentType.includes("application/json")
      ? safeParseStoryResponse<BackendStory | { message?: unknown; error?: unknown }>(
          responseText,
        )
      : null;
    const message =
      parsedBody &&
      typeof parsedBody === "object" &&
      !Array.isArray(parsedBody) &&
      ("message" in parsedBody || "error" in parsedBody)
        ? typeof parsedBody.message === "string"
          ? parsedBody.message
          : typeof parsedBody.error === "string"
            ? parsedBody.error
            : responseText.trim()
        : responseText.trim();

    if (!response.ok) {
      throw new Error(message || "Không thể cập nhật trạng thái story.");
    }

    return (parsedBody ?? responseText) as BackendStory | string;
  },
};

function normalizeStoryPageResponse(
  response: GetStoriesResponse,
  params: GetStoriesParams,
): StoryPageResponse {
  if (!Array.isArray(response)) {
    return response;
  }

  const fallbackSize =
    typeof params.size === "number" && params.size > 0
      ? params.size
      : response.length;

  return {
    content: response,
    page: {
      size: fallbackSize,
      number: typeof params.page === "number" ? params.page : 0,
      totalElements: response.length,
      totalPages: response.length > 0 ? 1 : 0,
    },
  };
}

function safeParseStoryResponse<T = { message?: unknown; error?: unknown }>(
  value: string,
) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isFormDataPayload(
  payload: FormData | CreateStoryPayload,
): payload is FormData {
  return typeof FormData !== "undefined" && payload instanceof FormData;
}

function buildCreateStoryFormData(payload: CreateStoryPayload) {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("content", payload.content);
  formData.append("tagId", String(payload.tagId));
  formData.append("hotspotId", String(payload.hotspotId));
  formData.append("audioScript", payload.audioScript ?? "");

  payload.files?.forEach((file) => {
    formData.append("files", file);
  });

  if (typeof payload.confirmCultural === "boolean") {
    formData.append("confirmCultural", String(payload.confirmCultural));
  }

  return formData;
}
