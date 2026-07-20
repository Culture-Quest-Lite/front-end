export interface TagRecord {
  tagId: number;
  tagName: string;
  tagStatus: string;
  routeCount: number;
  hotspotCount: number;
  storyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagPageResponse {
  content: TagRecord[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export const tagColorPalette = [
  "#C84E14",
  "#7C3AED",
  "#0F9D74",
  "#A72222",
  "#F59E0B",
];

export function normalizeTagText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buildTagSlug(value: string) {
  return normalizeTagText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildTagToken(value: string) {
  return normalizeTagText(value).replace(/[^a-z0-9]+/g, "");
}

export function buildTagChipLabel(name: string) {
  return `# ${name.trim().toLowerCase()}`;
}

export function buildTagStatsLabel(name: string) {
  return `#${buildTagToken(name)}`;
}

export function withHexAlpha(color: string, alpha: string) {
  const normalized = color.trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/i.test(normalized)) {
    return `${normalized}${alpha}`;
  }

  return color;
}

export function getTagColorState(color: string) {
  return {
    chipBg: withHexAlpha(color, "14"),
    chipBorder: withHexAlpha(color, "4D"),
  };
}

export function getTagColor(index: number) {
  return tagColorPalette[index % tagColorPalette.length] ?? tagColorPalette[0];
}

export function getTagDetailHref(tagId: number | string) {
  const normalizedId = String(tagId).trim();
  return `/curator/tags/${normalizedId}`;
}

export function buildTagDetailHref(tagId: number | string) {
  return getTagDetailHref(tagId);
}

export function parseTagDetailId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const matchedId = value.trim().match(/^\d+/)?.[0];

  if (!matchedId) {
    return null;
  }

  const tagId = Number(matchedId);
  if (!Number.isInteger(tagId) || tagId <= 0) {
    return null;
  }

  return tagId;
}

export function formatTagStatus(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase();

  switch (normalizedValue) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "INACTIVE":
      return "Ngừng hoạt động";
    default:
      return value?.trim() || "Chưa có dữ liệu";
  }
}

export function getTagStatusTone(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase();

  switch (normalizedValue) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function formatTagDateTime(value: string | null | undefined) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
