"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { hotspotItems, type HotspotItem } from "@/data/hotspots";
import {
  hotspotApi,
  type BackendHotspot,
  type HotspotSearchFilter,
  type HotspotSearchOperator,
  type HotspotSearchRequest,
  type HotspotSearchResponse,
  userApi,
} from "@/services/api";

const tagColorClasses = [
  "border-red-200 bg-red-50 text-red-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
];

const hotspotActions = [
  { key: "edit", label: "Chỉnh sửa", icon: PencilLine },
  { key: "detail", label: "Xem chi tiết", icon: Eye },
  { key: "submit", label: "Duyệt bài", icon: Send },
  { key: "archive", label: "Xóa", icon: Trash2, danger: true },
];

const HOTSPOTS_PER_PAGE = 8;

type HotspotViewItem = HotspotItem & {
  hotspotId?: number;
  creatorUsername?: string;
  rawStatus?: string;
  rawXp?: number | null;
  rawPoint?: number | null;
  rawCheckInRadius?: number | null;
  rawIsCheckIn?: boolean | null;
  rawCreatedAt?: string;
  rawHistoryInformation?: string;
  rawTagNames: string[];
};

type CreatorProfile = {
  displayName: string;
  username: string;
};

type SearchField =
  | "hotspotName"
  | "status"
  | "tags.tagName"
  | "xp"
  | "address"
  | "description"
  | "historyInformation"
  | "point"
  | "checkInRadius"
  | "createdAt"
  | "createdBy.username";

type SearchFieldKind = "text" | "status" | "number" | "numberList" | "datetime";
type SortField = "createdAt" | "hotspotName" | "xp" | "point" | "checkInRadius";
type SortDirection = "ASC" | "DESC";

type SearchFieldOption = {
  value: SearchField;
  label: string;
  kind: SearchFieldKind;
  operators: HotspotSearchOperator[];
  defaultOperator: HotspotSearchOperator;
  placeholder: string;
  description: string;
  warning?: string;
};

type QuickSearchState = {
  field: SearchField;
  operator: HotspotSearchOperator;
  value: string;
};

type FilterConditionState = {
  id: string;
  field: SearchField;
  operator: HotspotSearchOperator;
  value: string;
};

type AdvancedFilterState = {
  rows: FilterConditionState[];
  sortBy: SortField;
  sortDirection: SortDirection;
};

const hotspotStatusValueOptions: Array<{
  value: string;
  label: string;
}> = [
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PUBLISHED", label: "Đã xuất bản" },
];

const VISIBLE_HOTSPOT_STATUSES = ["DRAFT", "PUBLISHED"] as const;

const searchFieldOptions: SearchFieldOption[] = [
  {
    value: "hotspotName",
    label: "Tên địa điểm",
    kind: "text",
    operators: ["LIKE", "EQUALS", "NOT_EQUALS"],
    defaultOperator: "LIKE",
    placeholder: "Tìm theo tên địa điểm...",
    description: "Tìm theo tên địa điểm.",
  },
  {
    value: "status",
    label: "Trạng thái",
    kind: "status",
    operators: ["EQUALS", "NOT_EQUALS"],
    defaultOperator: "EQUALS",
    placeholder: "",
    description: "Lọc theo trạng thái nháp hoặc cộng đồng.",
  },
  {
    value: "tags.tagName",
    label: "Nhãn/Thẻ",
    kind: "text",
    operators: ["LIKE", "EQUALS"],
    defaultOperator: "LIKE",
    placeholder: "Ví dụ: Lịch sử",
    description: "Tìm theo tên thẻ liên kết với địa điểm.",
  },
  {
    value: "xp",
    label: "XP",
    kind: "number",
    operators: [
      "GREATER_THAN_OR_EQUAL",
      "GREATER_THAN",
      "EQUALS",
      "LESS_THAN",
      "LESS_THAN_OR_EQUAL",
    ],
    defaultOperator: "GREATER_THAN_OR_EQUAL",
    placeholder: "Ví dụ: 100",
    description: "Lọc theo điểm  điểm XP.",
  },
  {
    value: "address",
    label: "Địa chỉ",
    kind: "text",
    operators: ["LIKE", "EQUALS"],
    defaultOperator: "LIKE",
    placeholder: "Ví dụ: Hà Nội",
    description: "Tìm theo địa chỉ của địa điểm.",
  },
  {
    value: "description",
    label: "Mô tả",
    kind: "text",
    operators: ["LIKE", "EQUALS"],
    defaultOperator: "LIKE",
    placeholder: "Ví dụ: Cổ kính",
    description: "Tìm theo nội dung mô tả.",
  },
  {
    value: "historyInformation",
    label: "Thông tin lịch sử",
    kind: "text",
    operators: ["LIKE", "EQUALS"],
    defaultOperator: "LIKE",
    placeholder: "Ví dụ: thời Pháp thuộc",
    description: "Tìm theo nội dung thông tin lịch sử của địa điểm.",
  },
  {
    value: "point",
    label: "Point",
    kind: "number",
    operators: [
      "GREATER_THAN_OR_EQUAL",
      "GREATER_THAN",
      "EQUALS",
      "LESS_THAN",
      "LESS_THAN_OR_EQUAL",
    ],
    defaultOperator: "GREATER_THAN",
    placeholder: "Ví dụ: 50",
    description: "Lọc theo số điểm thưởng.",
  },
  {
    value: "checkInRadius",
    label: "Bán kính check-in",
    kind: "number",
    operators: [
      "GREATER_THAN_OR_EQUAL",
      "GREATER_THAN",
      "EQUALS",
      "LESS_THAN",
      "LESS_THAN_OR_EQUAL",
    ],
    defaultOperator: "LESS_THAN_OR_EQUAL",
    placeholder: "Ví dụ: 50",
    description: "Lọc theo bán kính check-in.",
    warning:
      "Backend live ngày 24/06/2026 hiện có thể trả lỗi 500 với field này. Payload vẫn sẽ được gửi đúng format.",
  },
  {
    value: "createdAt",
    label: "Ngày tạo",
    kind: "datetime",
    operators: [
      "GREATER_THAN",
      "GREATER_THAN_OR_EQUAL",
      "EQUALS",
      "LESS_THAN",
      "LESS_THAN_OR_EQUAL",
    ],
    defaultOperator: "GREATER_THAN",
    placeholder: "",
    description: "Lọc theo thời điểm tạo địa điểm.",
    warning:
      "Backend live ngày 24/06/2026 hiện có thể trả lỗi 500 với field này. Payload vẫn sẽ được gửi đúng format.",
  },
  {
    value: "createdBy.username",
    label: "Người tạo (username)",
    kind: "text",
    operators: ["LIKE", "EQUALS"],
    defaultOperator: "LIKE",
    placeholder: "Ví dụ: admin",
    description: "Tìm địa điểm theo username của người tạo.",
  },
];

const operatorLabelMap: Record<HotspotSearchOperator, string> = {
  EQUALS: "Trùng khớp",
  NOT_EQUALS: "Khác giá trị",
  LIKE: "Có chứa",
  GREATER_THAN: "Lớn hơn",
  LESS_THAN: "Nhỏ hơn",
  GREATER_THAN_OR_EQUAL: "Từ giá trị này trở lên",
  LESS_THAN_OR_EQUAL: "Tối đa giá trị này",
  IN: "Nằm trong danh sách",
};

const sortFieldOptions: Array<{ value: SortField; label: string }> = [
  { value: "createdAt", label: "Ngày tạo" },
  { value: "hotspotName", label: "Tên địa điểm" },
  { value: "xp", label: "XP" },
  { value: "point", label: "Point" },
  { value: "checkInRadius", label: "Bán kính check-in" },
];

const sortDirectionOptions: Array<{ value: SortDirection; label: string }> = [
  { value: "ASC", label: "Tăng dần" },
  { value: "DESC", label: "Giảm dần" },
];

const AUTO_SYNC_ADVANCED_FILTER_FIELDS: SearchField[] = [
  "status",
  "tags.tagName",
  "address",
  "description",
  "historyInformation",
  "createdBy.username",
];

const HOTSPOT_STATUS_META: Record<string, { label: string; style: string }> = {
  ACTIVE: {
    label: "Đã xuất bản",
    style: "bg-emerald-600/95 text-white",
  },
  APPROVED: {
    label: "Đã xuất bản",
    style: "bg-emerald-600/95 text-white",
  },
  ARCHIVED: {
    label: "Đã lưu trữ",
    style: "bg-slate-500/95 text-white",
  },
  DELETED: {
    label: "Đã lưu trữ",
    style: "bg-slate-500/95 text-white",
  },
  DRAFT: {
    label: "Bản nháp",
    style: "bg-slate-500/95 text-white",
  },
  INACTIVE: {
    label: "Đã lưu trữ",
    style: "bg-slate-500/95 text-white",
  },
  PENDING: {
    label: "Chờ duyệt",
    style: "bg-amber-500/95 text-slate-900",
  },
  PUBLISHED: {
    label: "Đã xuất bản",
    style: "bg-emerald-600/95 text-white",
  },
  REJECTED: {
    label: "Bị từ chối",
    style: "bg-red-600/95 text-white",
  },
  SUBMITTED: {
    label: "Chờ duyệt",
    style: "bg-amber-500/95 text-slate-900",
  },
};

function stripVietnameseAccents(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeText(value: string) {
  return stripVietnameseAccents(value).toLowerCase().trim();
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function extractLocationLabel(address?: string) {
  if (!address?.trim()) {
    return "";
  }

  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const reversedSegments = [...segments].reverse();
  const prioritizedMatchers = [
    /quận/i,
    /huyện/i,
    /thành phố thủ đức/i,
    /tp\./i,
    /thành phố/i,
    /phường/i,
  ];

  for (const matcher of prioritizedMatchers) {
    const matchedSegment = reversedSegments.find((segment) =>
      matcher.test(segment),
    );

    if (matchedSegment) {
      return matchedSegment;
    }
  }

  return segments.at(-2) ?? segments.at(-1) ?? "";
}

function buildSubtitle(
  category: string,
  address?: string,
  fallbackSubtitle?: string,
) {
  const parts = [category.trim(), extractLocationLabel(address)].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" · ") : (fallbackSubtitle ?? "");
}

function buildStatusMeta(status?: string, fallback?: HotspotItem) {
  const normalizedStatus = status?.trim().toUpperCase();

  if (normalizedStatus && HOTSPOT_STATUS_META[normalizedStatus]) {
    return HOTSPOT_STATUS_META[normalizedStatus];
  }

  if (fallback) {
    return {
      label: fallback.status,
      style: fallback.statusStyle,
    };
  }

  return {
    label: status?.trim() ? formatEnumLabel(status.trim()) : "Chưa rõ",
    style: "bg-slate-500/95 text-white",
  };
}

function findFallbackHotspot(hotspot: BackendHotspot) {
  const normalizedName = normalizeText(hotspot.hotspotName ?? "");
  const slug = slugify(hotspot.hotspotName ?? "");

  return hotspotItems.find(
    (item) =>
      item.slug === slug || normalizeText(item.title) === normalizedName,
  );
}

function buildTagLabels(tags?: BackendHotspot["tags"], fallback?: HotspotItem) {
  const mappedTags =
    tags
      ?.map((tag) => tag.tagName?.trim())
      .filter((tagName): tagName is string => Boolean(tagName))
      .map((tagName) => `#${tagName}`) ?? [];

  return mappedTags.length > 0 ? mappedTags : (fallback?.tags ?? []);
}

function getSearchFieldOption(field: SearchField) {
  return (
    searchFieldOptions.find((option) => option.value === field) ??
    searchFieldOptions[0]
  );
}

function createQuickSearchState(
  field: SearchField = "hotspotName",
): QuickSearchState {
  const fieldOption = getSearchFieldOption(field);

  return {
    field,
    operator: fieldOption.defaultOperator,
    value: "",
  };
}

function createFilterConditionState(
  field: SearchField = "status",
): FilterConditionState {
  const fieldOption = getSearchFieldOption(field);

  return {
    id: `${field}-${Math.random().toString(36).slice(2, 10)}`,
    field,
    operator: fieldOption.defaultOperator,
    value: "",
  };
}

function cloneAdvancedFilters(
  filters: AdvancedFilterState,
): AdvancedFilterState {
  return {
    ...filters,
    rows: filters.rows.map((row) => ({ ...row })),
  };
}

function createDefaultAdvancedFilters(): AdvancedFilterState {
  return {
    rows: [],
    sortBy: "createdAt",
    sortDirection: "DESC",
  };
}

function isAutoSyncAdvancedFilterField(field: SearchField) {
  return AUTO_SYNC_ADVANCED_FILTER_FIELDS.includes(field);
}

function canAutoApplyAdvancedFilters(
  draftFilters: AdvancedFilterState,
  appliedFilters: AdvancedFilterState,
) {
  if (
    draftFilters.sortBy !== appliedFilters.sortBy ||
    draftFilters.sortDirection !== appliedFilters.sortDirection
  ) {
    return false;
  }

  const draftRowsById = new Map(draftFilters.rows.map((row) => [row.id, row]));
  const appliedRowsById = new Map(
    appliedFilters.rows.map((row) => [row.id, row]),
  );
  const changedDraftRows = draftFilters.rows.filter((row) => {
    const appliedRow = appliedRowsById.get(row.id);

    return (
      !appliedRow ||
      appliedRow.field !== row.field ||
      appliedRow.operator !== row.operator ||
      appliedRow.value !== row.value
    );
  });
  const removedRows = appliedFilters.rows.filter(
    (row) => !draftRowsById.has(row.id),
  );

  if (changedDraftRows.length === 0 && removedRows.length === 0) {
    return false;
  }

  return [...changedDraftRows, ...removedRows].every((row) =>
    isAutoSyncAdvancedFilterField(row.field),
  );
}

function countActiveAdvancedFilters(filters: AdvancedFilterState) {
  return filters.rows.reduce((count, row) => {
    return buildFilterFromState(row) ? count + 1 : count;
  }, 0);
}

function parseNumericValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseListValue(value: string) {
  return value
    .split(/[,\n]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => Number(segment))
    .filter((segment) => Number.isFinite(segment));
}

function normalizeDateTimeValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmedValue)) {
    return `${trimmedValue}:00`;
  }

  return trimmedValue;
}

function buildFilterFromState(
  filterState: Pick<FilterConditionState, "field" | "operator" | "value">,
): HotspotSearchFilter | null {
  const fieldOption = getSearchFieldOption(filterState.field);
  const trimmedValue = filterState.value.trim();

  if (!trimmedValue) {
    return null;
  }

  switch (fieldOption.kind) {
    case "number": {
      const parsedValue = parseNumericValue(trimmedValue);
      if (parsedValue === null) {
        return null;
      }

      return {
        field: filterState.field,
        operator: filterState.operator,
        value: parsedValue,
      };
    }
    case "numberList": {
      if (filterState.operator === "IN") {
        const parsedValues = parseListValue(trimmedValue);
        if (parsedValues.length === 0) {
          return null;
        }

        return {
          field: filterState.field,
          operator: filterState.operator,
          values: parsedValues,
        };
      }

      const parsedValue = parseNumericValue(trimmedValue);
      if (parsedValue === null) {
        return null;
      }

      return {
        field: filterState.field,
        operator: filterState.operator,
        value: parsedValue,
      };
    }
    case "datetime": {
      const normalizedDateTimeValue = normalizeDateTimeValue(trimmedValue);
      if (!normalizedDateTimeValue) {
        return null;
      }

      return {
        field: filterState.field,
        operator: filterState.operator,
        value: normalizedDateTimeValue,
      };
    }
    case "status":
    case "text":
    default:
      return {
        field: filterState.field,
        operator: filterState.operator,
        value: trimmedValue,
      };
  }
}

function normalizeHotspotStatus(status?: string | null) {
  return status?.trim().toUpperCase() || "";
}

function isVisibleHotspotStatus(status?: string | null) {
  return VISIBLE_HOTSPOT_STATUSES.includes(
    normalizeHotspotStatus(status) as (typeof VISIBLE_HOTSPOT_STATUSES)[number],
  );
}

function createVisibleHotspotStatusFilter(): HotspotSearchFilter {
  return {
    field: "status",
    operator: "IN",
    values: [...VISIBLE_HOTSPOT_STATUSES],
  };
}

function filterVisibleHotspots(hotspots: BackendHotspot[]) {
  return hotspots.filter((hotspot) => isVisibleHotspotStatus(hotspot.status));
}

function buildHotspotSearchFilters(
  quickSearch: QuickSearchState,
  filters: AdvancedFilterState,
) {
  const builtFilters: HotspotSearchFilter[] = [
    createVisibleHotspotStatusFilter(),
  ];
  const quickFilter = buildFilterFromState(quickSearch);

  if (quickFilter) {
    builtFilters.push(quickFilter);
  }

  for (const row of filters.rows) {
    const mappedFilter = buildFilterFromState(row);

    if (mappedFilter) {
      builtFilters.push(mappedFilter);
    }
  }

  return builtFilters;
}

function buildHotspotSearchPayload(
  quickSearch: QuickSearchState,
  filters: AdvancedFilterState,
  currentPage: number,
): HotspotSearchRequest {
  return {
    filters: buildHotspotSearchFilters(quickSearch, filters),
    page: Math.max(0, currentPage - 1),
    size: HOTSPOTS_PER_PAGE,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  };
}

function formatFilterValue(field: SearchField, value: string) {
  if (field === "status") {
    return (
      hotspotStatusValueOptions.find((option) => option.value === value)
        ?.label ?? value
    );
  }

  return value;
}

function formatFilterSummary(
  filterState: Pick<FilterConditionState, "field" | "operator" | "value">,
) {
  const filter = buildFilterFromState(filterState);

  if (!filter) {
    return null;
  }

  const fieldLabel = getSearchFieldOption(filterState.field).label;
  const operatorLabel = operatorLabelMap[filter.operator];

  if (filter.operator === "IN") {
    return `${fieldLabel}: ${operatorLabel.toLowerCase()} [${filter.values?.join(", ")}]`;
  }

  return `${fieldLabel}: ${operatorLabel.toLowerCase()} "${formatFilterValue(filterState.field, filterState.value.trim())}"`;
}

function formatQuickSearchSummary(quickSearch: QuickSearchState) {
  const quickFilter = buildFilterFromState(quickSearch);

  if (!quickFilter) {
    return null;
  }

  return `${getSearchFieldOption(quickSearch.field).label}: "${formatFilterValue(
    quickSearch.field,
    quickSearch.value.trim(),
  )}"`;
}

function buildAppliedFilterSummary(
  quickSearch: QuickSearchState,
  filters: AdvancedFilterState,
) {
  const summary: string[] = [];
  const quickSearchSummary = formatQuickSearchSummary(quickSearch);

  if (quickSearchSummary) {
    summary.push(quickSearchSummary);
  }

  for (const row of filters.rows) {
    const rowSummary = formatFilterSummary(row);

    if (rowSummary) {
      summary.push(rowSummary);
    }
  }

  if (
    summary.length > 0 ||
    filters.sortBy !== "createdAt" ||
    filters.sortDirection !== "DESC"
  ) {
    summary.push(
      `Sắp xếp: ${
        sortFieldOptions.find((option) => option.value === filters.sortBy)
          ?.label ?? filters.sortBy
      } ${filters.sortDirection === "ASC" ? "tăng dần" : "giảm dần"}`,
    );
  }

  return summary;
}

function resolveHotspotImageUrl(medias?: BackendHotspot["medias"]) {
  const sortedImageMedias =
    medias
      ?.filter((media) => {
        const mediaType = media.mediaType?.trim().toUpperCase();
        const mimeType = media.mimeType?.trim().toLowerCase();

        return (
          Boolean(media.fileUrl?.trim()) &&
          (mediaType === "IMAGE" || mimeType?.startsWith("image/"))
        );
      })
      .sort((leftMedia, rightMedia) => {
        return (
          (leftMedia.displayOrder ?? Number.MAX_SAFE_INTEGER) -
          (rightMedia.displayOrder ?? Number.MAX_SAFE_INTEGER)
        );
      }) ?? [];

  return sortedImageMedias[0]?.fileUrl?.trim() || "";
}

function compareNormalizedText(
  leftValue: string | undefined,
  rightValue: string | undefined,
) {
  return normalizeText(leftValue ?? "").localeCompare(
    normalizeText(rightValue ?? ""),
  );
}

function compareNumericValues(
  leftValue: number | null | undefined,
  rightValue: number | null | undefined,
) {
  return (
    (leftValue ?? Number.NEGATIVE_INFINITY) -
    (rightValue ?? Number.NEGATIVE_INFINITY)
  );
}

function parseDateTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function matchesTextOperator(
  actualValue: string | undefined,
  operator: HotspotSearchOperator,
  expectedValue: string,
) {
  const normalizedActualValue = normalizeText(actualValue ?? "");
  const normalizedExpectedValue = normalizeText(expectedValue);

  switch (operator) {
    case "EQUALS":
      return normalizedActualValue === normalizedExpectedValue;
    case "NOT_EQUALS":
      return normalizedActualValue !== normalizedExpectedValue;
    case "LIKE":
    default:
      return normalizedActualValue.includes(normalizedExpectedValue);
  }
}

function matchesNumericOperator(
  actualValue: number | null | undefined,
  operator: HotspotSearchOperator,
  expectedValue: number,
) {
  if (typeof actualValue !== "number") {
    return false;
  }

  switch (operator) {
    case "EQUALS":
      return actualValue === expectedValue;
    case "NOT_EQUALS":
      return actualValue !== expectedValue;
    case "GREATER_THAN":
      return actualValue > expectedValue;
    case "GREATER_THAN_OR_EQUAL":
      return actualValue >= expectedValue;
    case "LESS_THAN":
      return actualValue < expectedValue;
    case "LESS_THAN_OR_EQUAL":
      return actualValue <= expectedValue;
    default:
      return false;
  }
}

function matchesDateOperator(
  actualValue: string | undefined,
  operator: HotspotSearchOperator,
  expectedValue: string,
) {
  const actualTimestamp = parseDateTimestamp(actualValue);
  const expectedTimestamp = parseDateTimestamp(expectedValue);

  if (actualTimestamp === null || expectedTimestamp === null) {
    return false;
  }

  switch (operator) {
    case "EQUALS":
      return actualTimestamp === expectedTimestamp;
    case "GREATER_THAN":
      return actualTimestamp > expectedTimestamp;
    case "GREATER_THAN_OR_EQUAL":
      return actualTimestamp >= expectedTimestamp;
    case "LESS_THAN":
      return actualTimestamp < expectedTimestamp;
    case "LESS_THAN_OR_EQUAL":
      return actualTimestamp <= expectedTimestamp;
    default:
      return false;
  }
}

function matchesHotspotFilter(
  hotspot: HotspotViewItem,
  filter: HotspotSearchFilter,
) {
  switch (filter.field) {
    case "hotspotName":
      return matchesTextOperator(
        hotspot.title,
        filter.operator,
        String(filter.value ?? ""),
      );
    case "status":
      if (filter.operator === "IN") {
        return (filter.values ?? []).some((value) =>
          matchesTextOperator(hotspot.rawStatus, "EQUALS", String(value ?? "")),
        );
      }

      return matchesTextOperator(
        hotspot.rawStatus,
        filter.operator,
        String(filter.value ?? ""),
      );
    case "tags.tagName":
      return hotspot.rawTagNames.some((tagName) =>
        matchesTextOperator(
          tagName,
          filter.operator,
          String(filter.value ?? ""),
        ),
      );
    case "xp":
      return matchesNumericOperator(
        hotspot.rawXp,
        filter.operator,
        Number(filter.value),
      );
    case "address":
      return matchesTextOperator(
        hotspot.address,
        filter.operator,
        String(filter.value ?? ""),
      );
    case "description":
      return matchesTextOperator(
        hotspot.description,
        filter.operator,
        String(filter.value ?? ""),
      );
    case "historyInformation":
      return matchesTextOperator(
        hotspot.rawHistoryInformation,
        filter.operator,
        String(filter.value ?? ""),
      );
    case "point":
      return matchesNumericOperator(
        hotspot.rawPoint,
        filter.operator,
        Number(filter.value),
      );
    case "checkInRadius":
      return matchesNumericOperator(
        hotspot.rawCheckInRadius,
        filter.operator,
        Number(filter.value),
      );
    case "createdAt":
      return matchesDateOperator(
        hotspot.rawCreatedAt,
        filter.operator,
        String(filter.value ?? ""),
      );
    case "createdBy.username":
      return matchesTextOperator(
        hotspot.creatorUsername,
        filter.operator,
        String(filter.value ?? ""),
      );
    default:
      return true;
  }
}

function sortHotspotItems(
  hotspots: HotspotViewItem[],
  filters: AdvancedFilterState,
) {
  const sortedHotspots = [...hotspots];

  sortedHotspots.sort((leftHotspot, rightHotspot) => {
    let comparedValue = 0;

    switch (filters.sortBy) {
      case "hotspotName":
        comparedValue = compareNormalizedText(
          leftHotspot.title,
          rightHotspot.title,
        );
        break;
      case "xp":
        comparedValue = compareNumericValues(
          leftHotspot.rawXp,
          rightHotspot.rawXp,
        );
        break;
      case "point":
        comparedValue = compareNumericValues(
          leftHotspot.rawPoint,
          rightHotspot.rawPoint,
        );
        break;
      case "checkInRadius":
        comparedValue = compareNumericValues(
          leftHotspot.rawCheckInRadius,
          rightHotspot.rawCheckInRadius,
        );
        break;
      case "createdAt":
      default:
        comparedValue = compareNumericValues(
          parseDateTimestamp(leftHotspot.rawCreatedAt),
          parseDateTimestamp(rightHotspot.rawCreatedAt),
        );
        break;
    }

    return filters.sortDirection === "ASC" ? comparedValue : comparedValue * -1;
  });

  return sortedHotspots;
}

function buildHotspotCards(
  apiHotspots: BackendHotspot[],
  creatorProfiles: Map<number, CreatorProfile>,
): HotspotViewItem[] {
  const usedSlugs = new Set<string>();

  return apiHotspots.map((hotspot) => {
    const fallback = findFallbackHotspot(hotspot);
    const fallbackSlug = fallback?.slug ?? "";
    const backendImageUrl = resolveHotspotImageUrl(hotspot.medias);
    const creatorProfile = hotspot.createByUserId
      ? creatorProfiles.get(hotspot.createByUserId)
      : undefined;
    const rawTagNames =
      hotspot.tags
        ?.map((tag) => tag.tagName?.trim())
        .filter((tagName): tagName is string => Boolean(tagName)) ?? [];
    const category = rawTagNames[0] ?? fallback?.category ?? "";
    const statusMeta = buildStatusMeta(hotspot.status, fallback);
    const candidateSlug =
      fallbackSlug ||
      slugify(hotspot.hotspotName ?? "") ||
      `hotspot-${hotspot.hotspotId}`;
    const slug = usedSlugs.has(candidateSlug)
      ? `${candidateSlug}-${hotspot.hotspotId}`
      : candidateSlug;

    usedSlugs.add(slug);

    return {
      hotspotId: hotspot.hotspotId,
      slug,
      title:
        hotspot.hotspotName?.trim() ||
        fallback?.title ||
        `Hotspot ${hotspot.hotspotId}`,
      subtitle: buildSubtitle(category, hotspot.address, fallback?.subtitle),
      author:
        creatorProfile?.displayName ||
        creatorProfile?.username ||
        fallback?.author ||
        (hotspot.createByUserId ? `Curator #${hotspot.createByUserId}` : ""),
      creatorUsername: creatorProfile?.username || "",
      date:
        formatDateLabel(hotspot.createdAt ?? hotspot.updatedAt) ||
        fallback?.date ||
        "",
      address: hotspot.address?.trim() || fallback?.address || "",
      description: hotspot.description?.trim() || fallback?.description || "",
      rawHistoryInformation: hotspot.historyInformation?.trim() || "",
      category,
      relatedTopics: fallback?.relatedTopics ?? [],
      videoLabel: fallback?.videoLabel,
      videoUrl: fallback?.videoUrl,
      rawXp: hotspot.xp,
      xp:
        typeof hotspot.xp === "number"
          ? `${hotspot.xp} XP`
          : fallback?.xp || "",
      rawStatus: hotspot.status?.trim() || "",
      status: statusMeta.label,
      statusStyle: statusMeta.style,
      badge: statusMeta.label,
      rawPoint: hotspot.point,
      rawCheckInRadius: hotspot.checkInRadius,
      rawIsCheckIn: hotspot.isCheckIn,
      rawCreatedAt: hotspot.createdAt ?? hotspot.updatedAt ?? "",
      gps:
        typeof hotspot.latitude === "number" &&
        typeof hotspot.longitude === "number"
          ? "GPS OK"
          : fallback?.gps || "",
      image: backendImageUrl || fallback?.image || "",
      rawTagNames,
      tags: buildTagLabels(hotspot.tags, fallback),
    };
  });
}

const creatorProfileCache = new Map<number, CreatorProfile>();

async function loadCreatorProfiles(apiHotspots: BackendHotspot[]) {
  const creatorIds = Array.from(
    new Set(
      apiHotspots
        .map((hotspot) => hotspot.createByUserId)
        .filter((userId): userId is number => typeof userId === "number"),
    ),
  );

  // Filter out already cached IDs
  const uncachedIds = creatorIds.filter((id) => !creatorProfileCache.has(id));

  if (uncachedIds.length > 0) {
    // Limit concurrent requests to 3 at a time
    const CONCURRENCY_LIMIT = 3;
    const results = await Promise.allSettled(
      uncachedIds.map(async (userId) => {
        const user = await userApi.getUserById(userId);
        const profile: CreatorProfile = {
          displayName: user?.displayName?.trim() || "",
          username: user?.username?.trim() || "",
        };

        if (profile.displayName || profile.username) {
          creatorProfileCache.set(userId, profile);
        }

        return [userId, profile] as const;
      }),
    );

    // Process results (already cached above)
    for (const entry of results) {
      if (entry.status !== "fulfilled") {
        continue;
      }
    }
  }

  // Return from cache
  const creatorProfiles = new Map<number, CreatorProfile>();
  for (const creatorId of creatorIds) {
    const cached = creatorProfileCache.get(creatorId);
    if (cached) {
      creatorProfiles.set(creatorId, cached);
    }
  }

  return creatorProfiles;
}

export default function Page() {
  const [hotspots, setHotspots] = useState<HotspotViewItem[]>([]);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [quickSearch, setQuickSearch] = useState<QuickSearchState>(() =>
    createQuickSearchState(),
  );
  const [debouncedQuickSearch, setDebouncedQuickSearch] =
    useState<QuickSearchState>(() => createQuickSearchState());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AdvancedFilterState>(() =>
    createDefaultAdvancedFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilterState>(
    () => createDefaultAdvancedFilters(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishingHotspotId, setPublishingHotspotId] = useState<number | null>(
    null,
  );
  const [pendingPublishHotspot, setPendingPublishHotspot] =
    useState<HotspotViewItem | null>(null);
  const [pendingDeleteHotspot, setPendingDeleteHotspot] =
    useState<HotspotViewItem | null>(null);
  const [deletingHotspotId, setDeletingHotspotId] = useState<number | null>(
    null,
  );
  const [serverPageInfo, setServerPageInfo] = useState<
    HotspotSearchResponse["page"] | null
  >(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const activeFilterCount = countActiveAdvancedFilters(appliedFilters);
  const quickSearchFieldOption = getSearchFieldOption(quickSearch.field);
  const quickSearchWarning = quickSearchFieldOption.warning;
  const appliedFilterSummary = buildAppliedFilterSummary(
    quickSearch,
    appliedFilters,
  );
  const activeSearchFilters = buildHotspotSearchFilters(
    debouncedQuickSearch,
    appliedFilters,
  );
  const isRemoteSearchActive =
    debouncedQuickSearch.value.trim() !== "" ||
    countActiveAdvancedFilters(appliedFilters) > 0;

  const localFilteredHotspots = sortHotspotItems(
    hotspots.filter((hotspot) =>
      activeSearchFilters.every((filter) =>
        matchesHotspotFilter(hotspot, filter),
      ),
    ),
    appliedFilters,
  );

  const displayedHotspots = serverPageInfo ? hotspots : localFilteredHotspots;
  const totalPages = serverPageInfo
    ? Math.max(1, serverPageInfo.totalPages)
    : Math.max(1, Math.ceil(displayedHotspots.length / HOTSPOTS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedHotspots = serverPageInfo
    ? hotspots
    : displayedHotspots.slice(
        (safeCurrentPage - 1) * HOTSPOTS_PER_PAGE,
        safeCurrentPage * HOTSPOTS_PER_PAGE,
      );
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextQuickSearch = {
        ...quickSearch,
        value: quickSearch.value.trim(),
      };

      setDebouncedQuickSearch((previous) =>
        previous.field === nextQuickSearch.field &&
        previous.operator === nextQuickSearch.operator &&
        previous.value === nextQuickSearch.value
          ? previous
          : nextQuickSearch,
      );
      setCurrentPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [quickSearch]);

  useEffect(() => {
    if (!isFilterOpen) {
      return;
    }

    if (!canAutoApplyAdvancedFilters(draftFilters, appliedFilters)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAppliedFilters(cloneAdvancedFilters(draftFilters));
      setCurrentPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appliedFilters, draftFilters, isFilterOpen]);

  useEffect(() => {
    let isCancelled = false;

    async function loadHotspots() {
      console.debug("[hotspot] loadHotspots start", {
        debouncedQuickSearch,
        appliedFilters,
        currentPage,
        isRemoteSearchActive,
        reloadVersion,
      });
      setIsLoading(true);

      try {
        if (isRemoteSearchActive) {
          const payload = buildHotspotSearchPayload(
            debouncedQuickSearch,
            appliedFilters,
            currentPage,
          );
          const response = await hotspotApi.searchHotspots(payload);

          if (isCancelled) {
            return;
          }

          const apiHotspots = filterVisibleHotspots(
            Array.isArray(response.content) ? response.content : [],
          );

          // Render hotspots immediately without waiting for creator profiles
          setHotspots(buildHotspotCards(apiHotspots, new Map()));
          setServerPageInfo(response.page ?? null);

          // Load creator profiles in background and update cards when ready
          void loadCreatorProfiles(apiHotspots).then((creatorProfiles) => {
            if (isCancelled) return;
            setHotspots(buildHotspotCards(apiHotspots, creatorProfiles));
          });
        } else {
          const response = await hotspotApi.getHotspots();
          console.debug("[hotspot] getHotspots response", { response });

          if (isCancelled) {
            return;
          }

          const apiHotspots = filterVisibleHotspots(
            Array.isArray(response) ? response : [],
          );

          // Render hotspots immediately without waiting for creator profiles
          setHotspots(buildHotspotCards(apiHotspots, new Map()));
          setServerPageInfo(null);

          // Load creator profiles in background and update cards when ready
          void loadCreatorProfiles(apiHotspots).then((creatorProfiles) => {
            if (isCancelled) return;
            console.debug("[hotspot] built hotspots", {
              count: apiHotspots.length,
              apiHotspots,
              creatorProfiles: Array.from(creatorProfiles.entries()),
            });
            setHotspots(buildHotspotCards(apiHotspots, creatorProfiles));
          });
        }

        setLoadError(null);
      } catch (error) {
        console.error("Failed to load curator hotspots", error);

        if (isCancelled) {
          return;
        }

        setHotspots([]);
        setServerPageInfo(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách địa điểm từ dữ liệu trả về.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHotspots();

    return () => {
      isCancelled = true;
    };
  }, [
    appliedFilters,
    currentPage,
    debouncedQuickSearch,
    isRemoteSearchActive,
    reloadVersion,
  ]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-hotspot-actions]")) {
        setOpenMenuKey(null);
      }

      if (!event.target.closest("[data-hotspot-filter]")) {
        setIsFilterOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuKey(null);
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleQuickSearchValueChange(value: string) {
    setQuickSearch((currentSearch) => ({
      ...currentSearch,
      value,
    }));
    setCurrentPage(1);
  }

  function updateDraftFilter<Key extends keyof AdvancedFilterState>(
    key: Key,
    value: AdvancedFilterState[Key],
  ) {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  function handleAddFilterRow(field: SearchField = "status") {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      rows: [...currentFilters.rows, createFilterConditionState(field)],
    }));
  }

  function updateDraftRow(
    rowId: string,
    updater: (row: FilterConditionState) => FilterConditionState,
  ) {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      rows: currentFilters.rows.map((row) =>
        row.id === rowId ? updater(row) : row,
      ),
    }));
  }

  function handleDraftRowFieldChange(rowId: string, field: SearchField) {
    const fieldOption = getSearchFieldOption(field);

    updateDraftRow(rowId, (row) => ({
      ...row,
      field,
      operator: fieldOption.defaultOperator,
      value: "",
    }));
  }

  function handleDraftRowOperatorChange(
    rowId: string,
    operator: HotspotSearchOperator,
  ) {
    updateDraftRow(rowId, (row) => ({
      ...row,
      operator,
      value: "",
    }));
  }

  function handleDraftRowValueChange(rowId: string, value: string) {
    updateDraftRow(rowId, (row) => ({
      ...row,
      value,
    }));
  }

  function handleRemoveDraftRow(rowId: string) {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      rows: currentFilters.rows.filter((row) => row.id !== rowId),
    }));
  }

  function handleApplyFilters() {
    setAppliedFilters(cloneAdvancedFilters(draftFilters));
    setCurrentPage(1);
    setIsFilterOpen(false);
  }

  function handleResetFilters() {
    const nextFilters = createDefaultAdvancedFilters();

    setDraftFilters(nextFilters);
    setAppliedFilters(createDefaultAdvancedFilters());
    setCurrentPage(1);
  }

  function handleToggleFilterPanel() {
    if (!isFilterOpen) {
      setDraftFilters(cloneAdvancedFilters(appliedFilters));
    }

    setIsFilterOpen((open) => !open);
  }

  function handleDeleteRequest(item: HotspotViewItem) {
    if (!item.hotspotId) {
      setOpenMenuKey(null);
      toast.error("Địa điểm này chưa có ID backend nên chưa thể xóa.");
      return;
    }

    setOpenMenuKey(null);
    setPendingDeleteHotspot(item);
  }

  async function handleConfirmDeleteHotspot() {
    if (!pendingDeleteHotspot?.hotspotId) {
      setPendingDeleteHotspot(null);
      return;
    }

    const hotspotId = pendingDeleteHotspot.hotspotId;

    setDeletingHotspotId(hotspotId);
    try {
      const message = await hotspotApi.deleteHotspot(hotspotId);

      setHotspots((currentHotspots) =>
        currentHotspots.filter((hotspot) => hotspot.hotspotId !== hotspotId),
      );
      setPendingDeleteHotspot(null);
      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa địa điểm.",
      );
    } finally {
      setDeletingHotspotId(null);
    }
  }

  async function handlePublishHotspot(item: HotspotViewItem) {
    if (!item.hotspotId) {
      setOpenMenuKey(null);
      toast.error("Địa điểm này chưa có ID backend nên chưa thể duyệt.");
      return;
    }

    const normalizedStatus = item.rawStatus?.trim().toUpperCase();

    if (
      normalizedStatus === "PUBLISHED" ||
      normalizedStatus === "ACTIVE" ||
      normalizedStatus === "APPROVED"
    ) {
      setOpenMenuKey(null);
      toast.info("Địa điểm này đã ở trạng thái xuất bản.");
      return;
    }

    if (normalizedStatus && normalizedStatus !== "DRAFT") {
      setOpenMenuKey(null);
      toast.error("Chỉ có thể duyệt địa điểm đang ở trạng thái bản nháp.");
      return;
    }

    setOpenMenuKey(null);
    setPendingPublishHotspot(item);
  }

  async function handleConfirmPublishHotspot() {
    if (!pendingPublishHotspot?.hotspotId) {
      setPendingPublishHotspot(null);
      return;
    }

    const hotspotId = pendingPublishHotspot.hotspotId;

    setPublishingHotspotId(hotspotId);

    try {
      await hotspotApi.updateHotspotStatus(hotspotId, "PUBLISHED");

      const publishedStatusMeta = buildStatusMeta(
        "PUBLISHED",
        pendingPublishHotspot,
      );

      setHotspots((currentHotspots) =>
        currentHotspots.map((hotspot) =>
          hotspot.hotspotId === hotspotId
            ? {
                ...hotspot,
                rawStatus: "PUBLISHED",
                status: publishedStatusMeta.label,
                statusStyle: publishedStatusMeta.style,
                badge: publishedStatusMeta.label,
              }
            : hotspot,
        ),
      );
      setPendingPublishHotspot(null);
      setReloadVersion((currentVersion) => currentVersion + 1);
      toast.success("Đã duyệt địa điểm và chuyển sang trạng thái xuất bản.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể duyệt địa điểm.",
      );
    } finally {
      setPublishingHotspotId(null);
    }
  }

  function renderFilterValueControl(
    filterState: Pick<FilterConditionState, "field" | "value">,
    onChange: (value: string) => void,
    className: string,
  ) {
    const fieldOption = getSearchFieldOption(filterState.field);

    if (fieldOption.kind === "status") {
      return (
        <select
          value={filterState.value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        >
          <option value="">Chọn trạng thái</option>
          {hotspotStatusValueOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (fieldOption.kind === "datetime") {
      return (
        <Input
          type="datetime-local"
          value={filterState.value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      );
    }

    if (fieldOption.kind === "number" || fieldOption.kind === "numberList") {
      return (
        <Input
          type={fieldOption.kind === "number" ? "number" : "text"}
          value={filterState.value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={fieldOption.placeholder}
          className={className}
        />
      );
    }

    return (
      <Input
        value={filterState.value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={fieldOption.placeholder}
        className={className}
      />
    );
  }

  return (
    <>
      <div className="flex min-h-full flex-col gap-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div>
                <h1 className="cq-page-title">Quản lý địa điểm</h1>
                <p className="cq-page-subtitle max-w-2xl">
                  Tạo, chỉnh sửa và phát hành các điểm di sản văn hóa TP.HCM.
                </p>
              </div>
            </div>

            <Button
              asChild
              variant="secondary"
              size="lg"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-white shadow-sm"
            >
              <Link href="/curator/hotspot/create">
                <Plus className="h-4 w-4" />
                Tạo địa điểm mới
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              {renderFilterValueControl(
                quickSearch,
                handleQuickSearchValueChange,
                "h-11 rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400/70 focus:border-primary focus:ring-2 focus:ring-primary/20",
              )}
            </div>

            <div data-hotspot-filter className="relative sm:justify-self-end">
              <button
                type="button"
                onClick={handleToggleFilterPanel}
                aria-expanded={isFilterOpen}
                aria-haspopup="dialog"
                className={`group relative inline-flex h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                  isFilterOpen
                    ? "border-[#F7DCE8] bg-[#FFF1F7] text-[#D94A8D] shadow-md"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#F7DCE8] hover:bg-[#FFF1F7] hover:text-[#D94A8D]"
                }`}
              >
                <Filter className="h-4 w-4" />
                Bộ lọc nâng cao
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition ${
                    isFilterOpen
                      ? "rotate-180 text-[#D94A8D]"
                      : "group-hover:text-[#D94A8D]"
                  }`}
                />
              </button>

              {isFilterOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(40rem,calc(100vw-2rem))] rounded-[1.35rem] border border-slate-200 bg-white p-3.5 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                  <div className="max-h-[75vh] space-y-3.5 overflow-y-auto pr-1">
                    <div className="rounded-[1.1rem] border border-slate-200/80 bg-white p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Điều kiện bổ sung
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddFilterRow()}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-primary/20 hover:text-primary"
                        >
                          <Plus className="h-3 w-3" />
                          Thêm điều kiện
                        </button>
                      </div>

                      {draftFilters.rows.length === 0 ? (
                        <p className="mt-2.5 text-xs text-slate-500">
                          Chưa có điều kiện bổ sung. Dùng các nút thêm nhanh ở
                          trên để tạo bộ lọc mới.
                        </p>
                      ) : (
                        <div className="mt-2.5 space-y-2.5">
                          {draftFilters.rows.map((row) => {
                            const rowFieldOption = getSearchFieldOption(
                              row.field,
                            );
                            const usesAutoSyncField =
                              isAutoSyncAdvancedFilterField(row.field);

                            return (
                              <div
                                key={row.id}
                                className="rounded-[1rem] border border-slate-200 bg-slate-50/70 p-2.5"
                              >
                                <div
                                  className={`grid gap-1.5 ${
                                    usesAutoSyncField
                                      ? "xl:grid-cols-[10.5rem_minmax(0,1fr)_auto]"
                                      : "xl:grid-cols-[10.5rem_10.5rem_minmax(0,1fr)_auto]"
                                  }`}
                                >
                                  <select
                                    value={row.field}
                                    onChange={(event) =>
                                      handleDraftRowFieldChange(
                                        row.id,
                                        event.target.value as SearchField,
                                      )
                                    }
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                  >
                                    {searchFieldOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>

                                  {usesAutoSyncField ? null : (
                                    <select
                                      value={row.operator}
                                      onChange={(event) =>
                                        handleDraftRowOperatorChange(
                                          row.id,
                                          event.target
                                            .value as HotspotSearchOperator,
                                        )
                                      }
                                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    >
                                      {rowFieldOption.operators.map(
                                        (operator) => (
                                          <option
                                            key={operator}
                                            value={operator}
                                          >
                                            {operatorLabelMap[operator]}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  )}

                                  {renderFilterValueControl(
                                    row,
                                    (value) =>
                                      handleDraftRowValueChange(row.id, value),
                                    "h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400/70 focus:border-primary focus:ring-2 focus:ring-primary/20",
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDraftRow(row.id)}
                                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                                  >
                                    Xóa
                                  </button>
                                </div>

                                <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                                  {rowFieldOption.description}
                                  {usesAutoSyncField
                                    ? " Hệ thống sẽ tự lọc khi bạn nhập hoặc chọn giá trị."
                                    : ""}
                                </p>
                                {rowFieldOption.warning ? (
                                  <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                                    {rowFieldOption.warning}
                                  </p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-[1.1rem] border border-slate-200/80 bg-white p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Sắp xếp kết quả
                      </p>
                      <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                        <select
                          value={draftFilters.sortBy}
                          onChange={(event) =>
                            updateDraftFilter(
                              "sortBy",
                              event.target.value as SortField,
                            )
                          }
                          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {sortFieldOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={draftFilters.sortDirection}
                          onChange={(event) =>
                            updateDraftFilter(
                              "sortDirection",
                              event.target.value as SortDirection,
                            )
                          }
                          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {sortDirectionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
                      >
                        Đặt lại
                      </button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 rounded-full px-3 text-[11px] text-white"
                        onClick={handleApplyFilters}
                      >
                        Áp dụng bộ lọc
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {appliedFilterSummary.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {appliedFilterSummary.map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full border border-[#F7DCE8] bg-[#FFF7FA] px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Nhập tên địa điểm ở thanh tìm kiếm phía trên. Hệ thống sẽ tự lọc
              theo kiểu chứa nội dung bạn nhập. Nếu cần thêm điều kiện khác, mở
              `Bộ lọc nâng cao`.
            </p>
          )}

          {quickSearchWarning ? (
            <p className="text-xs font-medium text-amber-700">
              {quickSearchWarning}
            </p>
          ) : null}

          {isLoading ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              Đang tải danh sách địa điểm...
            </div>
          ) : null}

          {loadError ? (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              {loadError}
            </div>
          ) : null}
        </section>

        <section className="flex flex-1 flex-col gap-4">
          {displayedHotspots.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2">
              {paginatedHotspots.map((item) => {
                const menuKey = String(item.hotspotId ?? item.slug);
                const isMenuOpen = openMenuKey === menuKey;
                const detailHref = item.hotspotId
                  ? `/curator/hotspot/${item.hotspotId}`
                  : `/curator/hotspot/${item.slug}`;
                const editHref = item.hotspotId
                  ? `/curator/hotspot/create?id=${item.hotspotId}`
                  : null;
                const isDeleting = deletingHotspotId === item.hotspotId;
                const isPublishing = publishingHotspotId === item.hotspotId;
                const isBusy = isDeleting || isPublishing;

                return (
                  <article
                    key={item.hotspotId ?? item.slug}
                    className={`group relative flex h-full flex-col overflow-visible rounded-[0.65rem] border border-slate-200/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isMenuOpen ? "z-20" : ""}`}
                  >
                    <Link
                      href={detailHref}
                      className="relative block h-40 overflow-hidden rounded-t-[0.65rem] bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(253,224,71,0.35),_rgba(248,250,252,1)_60%)] px-4 text-center text-sm font-medium text-slate-500">
                          Chưa có ảnh địa điểm
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div
                        className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold shadow-lg ring-1 ring-white/30 backdrop-blur-sm ${item.statusStyle}`}
                      >
                        {item.badge}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <h2 className="text-base font-semibold line-clamp-1">
                          {item.title}
                        </h2>
                        <p className="text-xs text-white/80 line-clamp-1">
                          {item.subtitle}
                        </p>
                      </div>
                    </Link>
                    <div className="flex flex-col gap-2 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                              {(item.author.charAt(0) || "?").toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium leading-tight text-slate-900">
                                {item.author}
                              </p>
                              <p className="mt-0.5 text-xs leading-tight text-slate-500">
                                {item.date}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.xp ? (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-orange-100 px-3 py-1 text-[11px] font-semibold leading-none text-slate-700">
                              {item.xp}
                            </span>
                          ) : null}
                          <div className="relative" data-hotspot-actions>
                            <button
                              type="button"
                              aria-haspopup="menu"
                              aria-expanded={isMenuOpen}
                              onClick={() =>
                                setOpenMenuKey(isMenuOpen ? null : menuKey)
                              }
                              className={`rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 ${isMenuOpen ? "bg-slate-100" : "bg-white/90"}`}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>

                            {isMenuOpen ? (
                              <div
                                role="menu"
                                className="absolute right-0 top-[calc(100%+0.6rem)] w-40 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
                              >
                                {hotspotActions.map((action) => {
                                  const ActionIcon = action.icon;

                                  return action.key === "edit" ? (
                                    editHref ? (
                                      <Link
                                        key={action.label}
                                        href={editHref}
                                        role="menuitem"
                                        onClick={() => {
                                          if (isBusy) {
                                            return;
                                          }
                                          setOpenMenuKey(null);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                      >
                                        <ActionIcon className="h-4 w-4" />
                                        <span>{action.label}</span>
                                      </Link>
                                    ) : (
                                      <button
                                        key={action.label}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                          if (isBusy) {
                                            return;
                                          }
                                          setOpenMenuKey(null);
                                          toast.error(
                                            "Địa điểm này chưa có ID backend nên chưa thể chỉnh sửa.",
                                          );
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                                      >
                                        <ActionIcon className="h-4 w-4" />
                                        <span>{action.label}</span>
                                      </button>
                                    )
                                  ) : action.key === "detail" ? (
                                    <Link
                                      key={action.label}
                                      href={detailHref}
                                      role="menuitem"
                                      onClick={() => {
                                        if (isBusy) {
                                          return;
                                        }
                                        setOpenMenuKey(null);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                    >
                                      <ActionIcon className="h-4 w-4" />
                                      <span>{action.label}</span>
                                    </Link>
                                  ) : action.key === "submit" ? (
                                    <button
                                      key={action.label}
                                      type="button"
                                      role="menuitem"
                                      onClick={() =>
                                        void handlePublishHotspot(item)
                                      }
                                      disabled={isBusy}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isPublishing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <ActionIcon className="h-4 w-4" />
                                      )}
                                      <span>
                                        {isPublishing
                                          ? "Đang duyệt..."
                                          : action.label}
                                      </span>
                                    </button>
                                  ) : action.key === "archive" ? (
                                    <button
                                      key={action.label}
                                      type="button"
                                      role="menuitem"
                                      onClick={() => handleDeleteRequest(item)}
                                      disabled={isBusy}
                                      className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-2.5 pt-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <ActionIcon className="h-4 w-4" />
                                      )}
                                      <span>
                                        {isDeleting
                                          ? "Đang xóa..."
                                          : action.label}
                                      </span>
                                    </button>
                                  ) : (
                                    <button
                                      key={action.label}
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        if (isBusy) {
                                          return;
                                        }
                                        setOpenMenuKey(null);
                                      }}
                                      disabled={isBusy}
                                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                                        action.danger
                                          ? "mt-1 border-t border-slate-100 pt-3 text-red-500 hover:bg-red-50"
                                          : "text-slate-700 hover:bg-slate-100"
                                      } disabled:cursor-not-allowed disabled:opacity-60`}
                                    >
                                      <ActionIcon className="h-4 w-4" />
                                      <span>{action.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag, index) => (
                          <span
                            key={`${item.hotspotId ?? item.slug}-${tag}-${index}`}
                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold shadow-sm ${tagColorClasses[index % tagColorClasses.length]}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-[#faf9f6] px-6 py-10 text-center text-sm text-slate-500">
              {quickSearch.value.trim() || appliedFilterSummary.length > 0
                ? "Không có địa điểm phù hợp với từ khóa hoặc bộ lọc hiện tại."
                : "Chưa có địa điểm để hiển thị."}
            </div>
          )}

          {displayedHotspots.length > 0 ? (
            <div className="mt-auto flex justify-end pt-6">
              <div className="inline-flex items-end justify-center gap-1 sm:gap-2">
                <button
                  type="button"
                  aria-label="Trang trước"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:text-[rgb(var(--primary))] disabled:pointer-events-none disabled:opacity-40"
                  onClick={() => {
                    setOpenMenuKey(null);
                    setCurrentPage((page) => Math.max(1, page - 1));
                  }}
                  disabled={safeCurrentPage === 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => {
                      setOpenMenuKey(null);
                      setCurrentPage(pageNumber);
                    }}
                    className={`relative inline-flex h-9 min-w-[2.25rem] items-center justify-center px-3 pb-2 text-lg font-medium transition ${
                      safeCurrentPage === pageNumber
                        ? "font-semibold text-[rgb(var(--primary))] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-[rgb(var(--primary))]"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  aria-label="Trang sau"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:text-[rgb(var(--primary))] disabled:pointer-events-none disabled:opacity-40"
                  onClick={() => {
                    setOpenMenuKey(null);
                    setCurrentPage((page) => Math.min(totalPages, page + 1));
                  }}
                  disabled={safeCurrentPage === totalPages}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {pendingPublishHotspot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPendingPublishHotspot(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[22rem] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-7 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-8">
            <div className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Send className="h-10 w-10" />
              </div>
              <h2 className="text-[1.125rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.25rem]">
                Bạn có chắc muốn duyệt bài?
              </h2>
              <p className="mx-auto max-w-[16.5rem] text-[0.8125rem] leading-5 text-slate-500 sm:text-[0.875rem]">
                Địa điểm{" "}
                <span className="font-semibold text-slate-900">
                  {pendingPublishHotspot.title}
                </span>{" "}
                sẽ được xuất bản ngay lập tức.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setPendingPublishHotspot(null)}
                disabled={
                  publishingHotspotId === pendingPublishHotspot.hotspotId
                }
                className="h-11 rounded-2xl border-slate-200 bg-slate-100 text-[0.8125rem] font-semibold text-slate-600 shadow-none hover:border-slate-300 hover:bg-slate-200 hover:text-slate-700 sm:text-sm"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void handleConfirmPublishHotspot()}
                disabled={
                  publishingHotspotId === pendingPublishHotspot.hotspotId
                }
                className="h-11 rounded-2xl border-emerald-500 bg-emerald-500 text-[0.8125rem] font-semibold text-white shadow-none hover:border-emerald-600 hover:bg-emerald-600 hover:text-white sm:text-sm"
              >
                {publishingHotspotId === pendingPublishHotspot.hotspotId
                  ? "Đang duyệt..."
                  : "Duyệt bài"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteHotspot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPendingDeleteHotspot(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[22rem] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-7 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-8">
            <div className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF1F0] text-[#CF3F34]">
                <Trash2 className="h-10 w-10" />
              </div>
              <h2 className="text-[1.125rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.25rem]">
                Bạn có chắc muốn xóa?
              </h2>
              <p className="mx-auto max-w-[16.5rem] text-[0.8125rem] leading-5 text-slate-500 sm:text-[0.875rem]">
                Hành động này không thể hoàn tác. Địa điểm{" "}
                <span className="font-semibold text-slate-900">
                  {pendingDeleteHotspot.title}
                </span>{" "}
                sẽ bị xóa khỏi danh sách hiện tại.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setPendingDeleteHotspot(null)}
                disabled={deletingHotspotId === pendingDeleteHotspot.hotspotId}
                className="h-11 rounded-2xl border-slate-200 bg-slate-100 text-[0.8125rem] font-semibold text-slate-600 shadow-none hover:bg-slate-200 hover:text-slate-700 sm:text-sm"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void handleConfirmDeleteHotspot()}
                disabled={deletingHotspotId === pendingDeleteHotspot.hotspotId}
                className="h-11 rounded-2xl border-[#CF3F34] bg-[#CF3F34] text-[0.8125rem] font-semibold text-white shadow-none hover:border-[#B9342A] hover:bg-[#B9342A] sm:text-sm"
              >
                {deletingHotspotId === pendingDeleteHotspot.hotspotId
                  ? "Đang xóa..."
                  : "Xóa địa điểm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
