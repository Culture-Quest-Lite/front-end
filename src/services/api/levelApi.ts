import { apiFetch } from "@/lib/api";

export type BackendLevelRecord = Record<string, unknown> & {
  levelId?: number | string;
  id?: number | string;
  code?: string;
  levelNumber?: number | string;
  level?: number | string;
  rank?: number | string;
  levelName?: string;
  name?: string;
  title?: string;
  label?: string;
  requiredXp?: number | string;
  minXp?: number | string;
  maxXp?: number | string;
  rewardPoints?: number | string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
};

export type CreateLevelPayload = {
  name: string;
  requiredXp: number;
  description: string;
};

const LEVEL_COLLECTION_KEYS = [
  "data",
  "content",
  "levels",
  "items",
  "result",
  "results",
] as const;

export const levelApi = {
  getLevels: async () => {
    const response = await apiFetch<unknown>("/api/levels", {
      method: "GET",
      sameOrigin: true,
    });

    return extractLevelRecords(response);
  },

  getLevelById: async (levelId: number) => {
    const response = await apiFetch<unknown>(`/api/levels/${levelId}`, {
      method: "GET",
      sameOrigin: true,
    });

    return extractLevelRecord(response);
  },

  createLevel: async (payload: CreateLevelPayload) => {
    return apiFetch<unknown>("/api/levels", {
      method: "POST",
      body: payload,
      sameOrigin: true,
    });
  },

  updateLevel: async (levelId: number, payload: CreateLevelPayload) => {
    return apiFetch<unknown>(`/api/levels/${levelId}`, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    });
  },

  deleteLevel: async (levelId: number) => {
    return apiFetch<void>(`/api/levels/${levelId}`, {
      method: "DELETE",
      sameOrigin: true,
    });
  },
};

export function extractLevelRecords(payload: unknown): BackendLevelRecord[] {
  const extracted = extractLevelCollection(payload, 0);
  if (extracted) {
    return extracted;
  }

  if (payload === null || payload === undefined) {
    return [];
  }

  throw new Error("Level API trả về dữ liệu không đúng định dạng mong đợi.");
}

export function extractLevelRecord(payload: unknown): BackendLevelRecord {
  if (isBackendLevelRecord(payload)) {
    return payload;
  }

  const extractedCollection = extractLevelCollection(payload, 0);
  if (extractedCollection && extractedCollection.length > 0) {
    return extractedCollection[0];
  }

  const extractedObject = extractLevelObject(payload, 0);
  if (extractedObject) {
    return extractedObject;
  }

  throw new Error("Không thể đọc chi tiết cấp bậc từ Level API.");
}

function extractLevelCollection(
  value: unknown,
  depth: number,
): BackendLevelRecord[] | null {
  if (depth > 3) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.filter(isBackendLevelRecord);
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of LEVEL_COLLECTION_KEYS) {
    const nested = extractLevelCollection(value[key], depth + 1);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function extractLevelObject(
  value: unknown,
  depth: number,
): BackendLevelRecord | null {
  if (depth > 3 || !isRecord(value)) {
    return null;
  }

  if (looksLikeLevelRecord(value)) {
    return value;
  }

  for (const key of LEVEL_COLLECTION_KEYS) {
    const nestedValue = value[key];
    if (Array.isArray(nestedValue)) {
      continue;
    }

    const nestedObject = extractLevelObject(nestedValue, depth + 1);
    if (nestedObject) {
      return nestedObject;
    }
  }

  return null;
}

function isBackendLevelRecord(value: unknown): value is BackendLevelRecord {
  return isRecord(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksLikeLevelRecord(value: Record<string, unknown>) {
  return [
    "levelId",
    "id",
    "name",
    "levelName",
    "requiredXp",
    "description",
    "minXp",
    "maxXp",
  ].some((key) => value[key] !== undefined && value[key] !== null);
}
