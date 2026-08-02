import { apiFetch } from "@/lib/api";
import type { TagPageResponse, TagRecord } from "@/lib/tags";

type GetTagsParams = {
  search?: string;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
};

export const tagApi = {
  getTags: async (params?: GetTagsParams) => {
    const searchParams = new URLSearchParams();

    if (params?.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }

    if (params?.status?.trim()) {
      searchParams.set("status", params.status.trim());
    }

    if (typeof params?.page === "number") {
      searchParams.set("page", params.page.toString());
    }

    if (typeof params?.size === "number") {
      searchParams.set("size", params.size.toString());
    }

    if (params?.sortBy?.trim()) {
      searchParams.set("sortBy", params.sortBy.trim());
    }

    if (params?.sortDir?.trim()) {
      searchParams.set("sortDir", params.sortDir.trim());
    }

    const query = searchParams.toString();
    const path = query ? `/api/tags?${query}` : "/api/tags";

    return apiFetch<TagPageResponse>(path, {
      method: "GET",
      sameOrigin: true,
    });
  },

  getTagById: async (tagId: number) => {
    return apiFetch<TagRecord>(`/api/tags/${tagId}`, {
      method: "GET",
      sameOrigin: true,
    });
  },

  createTag: async (payload: { tagName: string; imageFile?: File | null }) => {
    const formData = new FormData();

    formData.append("tagName", payload.tagName);
    if (payload.imageFile) {
      formData.append("imageFile", payload.imageFile);
    }

    return apiFetch<TagRecord>("/api/tags", {
      method: "POST",
      body: formData,
      sameOrigin: true,
    });
  },

  updateTag: async (
    tagId: number,
    payload: { tagName: string; imageFile?: File | null },
  ) => {
    const formData = new FormData();

    formData.append("tagName", payload.tagName);
    if (payload.imageFile) {
      formData.append("imageFile", payload.imageFile);
    }

    return apiFetch<TagRecord>(`/api/tags/${tagId}`, {
      method: "PUT",
      body: formData,
      sameOrigin: true,
    });
  },

  deleteTag: async (tagId: number) => {
    return apiFetch<void>(`/api/tags/${tagId}`, {
      method: "DELETE",
      sameOrigin: true,
    });
  },
};
