import { apiFetch } from "@/lib/api";

export interface BackendStoryTag {
  tagId: number;
  tagName: string;
  tagStatus?: string;
  createdAt?: string;
  updatedAt?: string;
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

  createStory: async (payload: FormData) => {
    return apiFetch<CreateStoryResponse>("/api/stories", {
      method: "POST",
      body: payload,
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
