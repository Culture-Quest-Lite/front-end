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
  orderIndex?: number | null;
  title: string;
  content: string;
  status: string;
  distanceToNext?: number | null;
  medias?: BackendStoryMedia[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendStorySummary {
  storyId: number;
  tag?: BackendStoryTag | null;
  orderIndex?: number | null;
  title: string;
  content: string;
  status: string;
  distanceToNext?: number | null;
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

export interface UpdateStoryPayload {
  files: string[];
  tagId: number;
  title: string;
  content: string;
}

export const storyApi = {
  getStories: async (params: {
    page: number;
    size: number;
    sortBy: string;
    sortDir: string;
    keyword?: string;
    status?: string;
    tagId?: number;
    hotspotId?: number;
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(params.page));
    searchParams.set("size", String(params.size));
    searchParams.set("sortBy", params.sortBy);
    searchParams.set("sortDir", params.sortDir);

    const filter: Record<string, unknown> = {};
    if (params.keyword?.trim()) {
      filter.keyword = params.keyword.trim();
    }

    if (params.status?.trim()) {
      filter.status = params.status.trim();
    }

    if (typeof params.tagId === "number") {
      filter.tagId = params.tagId;
    }

    if (typeof params.hotspotId === "number") {
      filter.hotspotId = params.hotspotId;
    }

    if (Object.keys(filter).length > 0) {
      searchParams.set("filter", JSON.stringify(filter));
    }

    return apiFetch<StoryPageResponse>(
      `/api/stories?${searchParams.toString()}`,
      {
        sameOrigin: true,
      },
    );
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

function safeParseStoryResponse<T = { message?: unknown; error?: unknown }>(
  value: string,
) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
