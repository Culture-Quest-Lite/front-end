"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { CuratorPagination } from "@/components/curator/CuratorPagination";
import { Input } from "@/components/ui/input";
import {
  routeApi,
  type RouteMediaResponse,
  type RouteResponse,
} from "@/services/api/routeApi";
import {
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const ROUTES_PER_PAGE = 4;
const ROUTE_SUCCESS_TOAST_KEY = "curator-route-success-toast";

const difficultyLabels: Record<string, string> = {
  EASY: "Dễ",
  MEDIUM: "Vừa",
  HARD: "Khó",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Bản nháp",
  RECORDING: "Đang ghi",
  TRIAL: "Thử nghiệm",
  PENDING: "Chờ duyệt",
  PUBLISHED: "Công khai",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  DELETED: "Đã xoá",
};

const statusClasses: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
  RECORDING: "border-sky-200 bg-sky-50 text-sky-700",
  TRIAL: "border-violet-200 bg-violet-50 text-violet-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  DELETED: "border-slate-200 bg-slate-50 text-slate-400",
};

type RouteSearchField =
  | "routeName"
  | "difficulty"
  | "status"
  | "tag.tagName"
  | "xp"
  | "point"
  | "estimateTime"
  | "totalDistance"
  | "totalStops"
  | "type";

type RouteSearchFieldKind = "text" | "number" | "status" | "difficulty";
type RouteSortField =
  | "routeName"
  | "xp"
  | "point"
  | "estimateTime"
  | "totalDistance"
  | "totalStops";

type RouteSearchFieldOption = {
  value: RouteSearchField;
  label: string;
  kind: RouteSearchFieldKind;
  operators: Array<
    | "EQUALS"
    | "NOT_EQUALS"
    | "LIKE"
    | "GREATER_THAN"
    | "LESS_THAN"
    | "GREATER_THAN_OR_EQUAL"
    | "LESS_THAN_OR_EQUAL"
    | "IN"
  >;
  defaultOperator:
    | "EQUALS"
    | "NOT_EQUALS"
    | "LIKE"
    | "GREATER_THAN"
    | "LESS_THAN"
    | "GREATER_THAN_OR_EQUAL"
    | "LESS_THAN_OR_EQUAL"
    | "IN";
  placeholder: string;
};

type RouteFilterRowState = {
  id: string;
  field: RouteSearchField;
  operator: RouteSearchFieldOption["defaultOperator"];
  value: string;
};

type RouteAdvancedFilterState = {
  rows: RouteFilterRowState[];
  sortBy: RouteSortField;
  sortDirection: "ASC" | "DESC";
};

const routeStatusValueOptions = [
  { value: "DRAFT", label: "Bản nháp" },
  { value: "RECORDING", label: "Đang ghi" },
  { value: "TRIAL", label: "Thử nghiệm" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "PUBLISHED", label: "Công khai" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "DELETED", label: "Đã xoá" },
] as const;

const routeDifficultyValueOptions = [
  { value: "EASY", label: "Dễ" },
  { value: "MEDIUM", label: "Vừa" },
  { value: "HARD", label: "Khó" },
] as const;

const routeSearchFieldOptions: RouteSearchFieldOption[] = [
  {
    value: "routeName",
    label: "Tên tuyến",
    kind: "text",
    operators: ["LIKE", "EQUALS", "NOT_EQUALS"],
    defaultOperator: "LIKE",
    placeholder: "Ví dụ: Hành trình lịch sử",
  },
  {
    value: "difficulty",
    label: "Độ khó",
    kind: "difficulty",
    operators: ["EQUALS", "NOT_EQUALS", "IN"],
    defaultOperator: "EQUALS",
    placeholder: "",
  },
  {
    value: "status",
    label: "Trạng thái",
    kind: "status",
    operators: ["EQUALS", "NOT_EQUALS", "IN"],
    defaultOperator: "EQUALS",
    placeholder: "",
  },
  {
    value: "tag.tagName",
    label: "Tag",
    kind: "text",
    operators: ["LIKE", "EQUALS"],
    defaultOperator: "LIKE",
    placeholder: "Ví dụ: Lịch sử",
  },
  {
    value: "xp",
    label: "Điểm XP",
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
  },
  {
    value: "point",
    label: "Điểm thưởng",
    kind: "number",
    operators: [
      "GREATER_THAN_OR_EQUAL",
      "GREATER_THAN",
      "EQUALS",
      "LESS_THAN",
      "LESS_THAN_OR_EQUAL",
    ],
    defaultOperator: "GREATER_THAN_OR_EQUAL",
    placeholder: "Ví dụ: 50",
  },
  {
    value: "estimateTime",
    label: "Thời lượng",
    kind: "number",
    operators: [
      "GREATER_THAN_OR_EQUAL",
      "GREATER_THAN",
      "EQUALS",
      "LESS_THAN",
      "LESS_THAN_OR_EQUAL",
    ],
    defaultOperator: "GREATER_THAN_OR_EQUAL",
    placeholder: "Ví dụ: 90",
  },
  {
    value: "totalDistance",
    label: "Khoảng cách",
    kind: "number",
    operators: [
      "GREATER_THAN_OR_EQUAL",
      "GREATER_THAN",
      "EQUALS",
      "LESS_THAN",
      "LESS_THAN_OR_EQUAL",
    ],
    defaultOperator: "GREATER_THAN_OR_EQUAL",
    placeholder: "Ví dụ: 5",
  },
  {
    value: "totalStops",
    label: "Số địa điểm",
    kind: "number",
    operators: [
      "GREATER_THAN_OR_EQUAL",
      "GREATER_THAN",
      "EQUALS",
      "LESS_THAN",
      "LESS_THAN_OR_EQUAL",
    ],
    defaultOperator: "GREATER_THAN_OR_EQUAL",
    placeholder: "Ví dụ: 4",
  },
];

const routeSortFieldOptions: Array<{ value: RouteSortField; label: string }> = [
  { value: "routeName", label: "Tên tuyến" },
  { value: "xp", label: "Điểm XP" },
  { value: "point", label: "Điểm thưởng" },
  { value: "estimateTime", label: "Thời lượng" },
  { value: "totalDistance", label: "Khoảng cách" },
  { value: "totalStops", label: "Số địa điểm" },
];

const routeOperatorLabelMap: Record<
  RouteSearchFieldOption["defaultOperator"],
  string
> = {
  EQUALS: "Trùng khớp",
  NOT_EQUALS: "Khác giá trị",
  LIKE: "Có chứa",
  GREATER_THAN: "Lớn hơn",
  LESS_THAN: "Nhỏ hơn",
  GREATER_THAN_OR_EQUAL: "Từ giá trị này trở lên",
  LESS_THAN_OR_EQUAL: "Tối đa giá trị này",
  IN: "Nằm trong danh sách",
};

function getRouteSearchFieldOption(field: RouteSearchField) {
  return (
    routeSearchFieldOptions.find((option) => option.value === field) ??
    routeSearchFieldOptions[0]
  );
}

function createRouteFilterRow(
  field: RouteSearchField = "status",
): RouteFilterRowState {
  const fieldOption = getRouteSearchFieldOption(field);

  return {
    id: `${field}-${Math.random().toString(36).slice(2, 10)}`,
    field,
    operator: fieldOption.defaultOperator,
    value: "",
  };
}

function createDefaultRouteAdvancedFilters(): RouteAdvancedFilterState {
  return {
    rows: [],
    sortBy: "routeName",
    sortDirection: "DESC",
  };
}

function cloneRouteAdvancedFilters(
  filters: RouteAdvancedFilterState,
): RouteAdvancedFilterState {
  return {
    ...filters,
    rows: filters.rows.map((row) => ({ ...row })),
  };
}

function countActiveRouteAdvancedFilters(filters: RouteAdvancedFilterState) {
  return filters.rows.reduce((count, row) => {
    return row.value.trim() ? count + 1 : count;
  }, 0);
}

function buildRouteSearchFilters(
  quickSearch: string,
  filters: RouteAdvancedFilterState,
  routeType: "OFFICIAL" | "CUSTOM" | null,
) {
  const normalizedQuickSearch = quickSearch.trim();
  const searchFilters: Array<{
    field: RouteSearchField;
    operator: RouteSearchFieldOption["defaultOperator"];
    value: string | number;
  }> = [];

  if (normalizedQuickSearch) {
    searchFilters.push({
      field: "routeName",
      operator: "LIKE",
      value: normalizedQuickSearch,
    });
  }

  for (const row of filters.rows) {
    const fieldOption = getRouteSearchFieldOption(row.field);
    const normalizedValue = row.value.trim();

    if (!normalizedValue) {
      continue;
    }

    if (fieldOption.kind === "number") {
      const parsedValue = Number(normalizedValue);

      if (!Number.isFinite(parsedValue)) {
        continue;
      }

      searchFilters.push({
        field: row.field,
        operator: row.operator,
        value: parsedValue,
      });
      continue;
    }

    searchFilters.push({
      field: row.field,
      operator: row.operator,
      value: normalizedValue,
    });
  }

  if (routeType) {
    searchFilters.push({
      field: "type",
      operator: "EQUALS",
      value: routeType,
    });
  }

  return searchFilters;
}

function getStatusLabel(status?: string) {
  const normalized = status?.trim().toUpperCase() || "DRAFT";
  return statusLabels[normalized] ?? normalized;
}

function getStatusClass(status?: string) {
  const normalized = status?.trim().toUpperCase() || "DRAFT";
  return (
    statusClasses[normalized] ?? "border-slate-200 bg-slate-50 text-slate-600"
  );
}

function getMediaUrl(media?: RouteMediaResponse) {
  return media?.fileUrl || media?.mediaUrl || media?.url || null;
}

function getMediaUrlFromArray(medias?: unknown[]) {
  const mediaItems = Array.isArray(medias) ? medias : [];
  const imageMedia =
    mediaItems.find((media) => {
      if (!media || typeof media !== "object") return false;
      const mediaRecord = media as Record<string, unknown>;
      const mediaType = String(mediaRecord.mediaType ?? "");
      const mimeType = String(mediaRecord.mimeType ?? "");
      return `${mediaType} ${mimeType}`.toLowerCase().includes("image");
    }) ?? mediaItems[0];

  return imageMedia && typeof imageMedia === "object"
    ? getMediaUrl(imageMedia as RouteMediaResponse)
    : null;
}

function getHotspotImage(hotspot?: unknown) {
  if (!hotspot || typeof hotspot !== "object") {
    return null;
  }

  const firstHotspot = hotspot as Record<string, unknown>;
  const url =
    (firstHotspot.thumbnailUrl as string) ||
    (firstHotspot.coverImageUrl as string) ||
    (firstHotspot.imageUrl as string) ||
    (firstHotspot.fileUrl as string) ||
    (firstHotspot.mediaUrl as string) ||
    (firstHotspot.url as string);

  return url?.trim()
    ? url
    : getMediaUrlFromArray(
        (firstHotspot.medias as unknown[]) ?? (firstHotspot.media as unknown[]),
      );
}

function getRouteImage(route: RouteResponse) {
  return (
    route.thumbnailUrl ||
    route.coverImageUrl ||
    route.imageUrl ||
    getMediaUrlFromArray(route.medias ?? route.media ?? []) ||
    getHotspotImage(route.hotspots?.[0]) ||
    null
  );
}

function getHotspotCount(route: RouteResponse) {
  return route.totalStops ?? route.hotspots?.length ?? 0;
}

function isPublished(status?: string) {
  const normalized = status?.trim().toUpperCase();
  return normalized === "PUBLISHED" || normalized === "APPROVED";
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[0.95rem] bg-[#F7F5EF] px-2.5 py-1.5 shadow-sm">
      <div className="flex items-center gap-1 text-[9px] text-slate-500">
        <Icon className="h-3 w-3 text-red-500" />
        <span>{label}</span>
      </div>
      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function renderRouteFilterValueControl(
  row: RouteFilterRowState,
  onChange: (value: string) => void,
) {
  const fieldOption = getRouteSearchFieldOption(row.field);
  const controlClassName =
    "h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  if (fieldOption.kind === "status") {
    return (
      <select
        value={row.value}
        onChange={(event) => onChange(event.target.value)}
        className={controlClassName}
      >
        <option value="">Chọn trạng thái</option>
        {routeStatusValueOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (fieldOption.kind === "difficulty") {
    return (
      <select
        value={row.value}
        onChange={(event) => onChange(event.target.value)}
        className={controlClassName}
      >
        <option value="">Chọn độ khó</option>
        {routeDifficultyValueOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      type={fieldOption.kind === "number" ? "number" : "text"}
      step={fieldOption.kind === "number" ? "any" : undefined}
      value={row.value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={fieldOption.placeholder}
      className={controlClassName}
    />
  );
}

function RouteCard({
  route,
  onDelete,
  onPublish,
  isMenuOpen,
  setOpenMenuRouteId,
  isPublishing,
}: {
  route: RouteResponse;
  onDelete: (route: RouteResponse) => void;
  onPublish: (route: RouteResponse) => void;
  isMenuOpen: boolean;
  setOpenMenuRouteId: (routeId: number | null) => void;
  isPublishing: boolean;
}) {
  const tags = route.tags ?? [];
  const imageUrl = getRouteImage(route);
  const hotspotCount = getHotspotCount(route);
  const normalizedStatus = route.status?.trim().toUpperCase() || "DRAFT";
  const canPublish =
    normalizedStatus !== "PUBLISHED" &&
    normalizedStatus !== "APPROVED" &&
    normalizedStatus !== "DELETED";
  const isBusy = isPublishing;

  return (
    <article
      className={`flex h-full flex-col overflow-visible rounded-[1.25rem] border border-slate-200/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isMenuOpen ? "relative z-20" : ""}`}
    >
      <div className="relative h-36 w-full overflow-hidden rounded-t-[1.25rem] bg-[#F7F5EF]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={route.routeName}
            fill
            sizes="(min-width: 768px) 20rem, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Chưa có hình ảnh
          </div>
        )}

        <span
          className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-sm ${getStatusClass(route.status)}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current/75" />
          {getStatusLabel(route.status)}
        </span>

        {route.routeType ? (
          <span
            className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-sm ${
              route.routeType === "OFFICIAL"
                ? "border-sky-200 bg-sky-50/90 text-sky-700"
                : "border-violet-200 bg-violet-50/90 text-violet-700"
            }`}
          >
            {route.routeType === "OFFICIAL" ? (
              <ShieldCheck className="h-2.5 w-2.5" />
            ) : (
              <PencilLine className="h-2.5 w-2.5" />
            )}
            {route.routeType === "OFFICIAL" ? "Hệ thống" : "Người dùng"}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="min-h-[4.625rem] min-w-0">
          <h2 className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-950">
            {route.routeName}
          </h2>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-slate-500">
            {route.description || "Chưa có mô tả."}
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag.tagId}
                className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700"
              >
                #{tag.tagName}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">Chưa có tag</span>
          )}
        </div>

        <div className="grid gap-1.25 md:grid-cols-3">
          <Metric
            icon={MapPin}
            label="Khoảng cách"
            value={`${route.totalDistance ?? 0} km`}
          />
          <Metric
            icon={Clock3}
            label="Thời lượng"
            value={`${route.estimateTime ?? 0} phút`}
          />
          <Metric
            icon={Sparkles}
            label="Độ khó"
            value={difficultyLabels[route.difficulty] ?? route.difficulty}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600">
          <span>{hotspotCount} địa điểm</span>
          <span>Điểm XP: {route.xp ?? 0}</span>
          <span>Điểm thưởng: {route.point ?? 0}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {isPublished(route.status) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Đang hoạt động
              </span>
            ) : null}

            <Link
              href={`/curator/routes/${route.routeId}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#e35a48] transition hover:text-[#c74735]"
            >
              Mở tuyến
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative shrink-0" data-route-actions>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() =>
                setOpenMenuRouteId(isMenuOpen ? null : route.routeId)
              }
              className={`rounded-full p-1.25 text-slate-600 transition hover:bg-slate-100 ${isMenuOpen ? "bg-slate-100" : "bg-white/90"}`}
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                className="absolute bottom-[calc(100%+0.6rem)] right-0 w-40 rounded-[1.25rem] border border-slate-200 bg-white p-1.5 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
              >
                {canPublish ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenuRouteId(null);
                      onPublish(route);
                    }}
                    disabled={isBusy}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>
                      {isPublishing ? "Đang kiểm tra..." : "Kiểm tra"}
                    </span>
                  </button>
                ) : null}

                <Link
                  href={`/curator/routes/create?id=${route.routeId}`}
                  role="menuitem"
                  onClick={() => {
                    if (isBusy) {
                      return;
                    }
                    setOpenMenuRouteId(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa</span>
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenMenuRouteId(null);
                    onDelete(route);
                  }}
                  disabled={isBusy}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xoá tuyến</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CuratorRoutesPage() {
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [quickSearch, setQuickSearch] = useState("");
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<RouteAdvancedFilterState>(
    () => createDefaultRouteAdvancedFilters(),
  );
  const [appliedFilters, setAppliedFilters] =
    useState<RouteAdvancedFilterState>(() =>
      createDefaultRouteAdvancedFilters(),
    );
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuRouteId, setOpenMenuRouteId] = useState<number | null>(null);
  const [publishingRouteId, setPublishingRouteId] = useState<number | null>(
    null,
  );
  const [pendingPublishRoute, setPendingPublishRoute] =
    useState<RouteResponse | null>(null);
  const [pendingDeleteRoute, setPendingDeleteRoute] =
    useState<RouteResponse | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [routeTypeFilter, setRouteTypeFilter] = useState<"OFFICIAL" | "CUSTOM" | null>(null);
  const activeFilterCount = countActiveRouteAdvancedFilters(appliedFilters);

  useEffect(() => {
    const successMessage = sessionStorage.getItem(ROUTE_SUCCESS_TOAST_KEY);

    if (!successMessage) {
      return;
    }

    sessionStorage.removeItem(ROUTE_SUCCESS_TOAST_KEY);
    toast.success(successMessage);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-route-actions]")) {
        setOpenMenuRouteId(null);
      }

      if (!event.target.closest("[data-route-filter]")) {
        setIsFilterOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuRouteId(null);
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalizedValue = quickSearch.trim();

      setDebouncedQuickSearch((previous) =>
        previous === normalizedValue ? previous : normalizedValue,
      );
      setCurrentPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [quickSearch]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoutes() {
      setIsLoading(true);
      setError(null);

      try {
        const filters = buildRouteSearchFilters(
          debouncedQuickSearch,
          appliedFilters,
          routeTypeFilter,
        );

        const response = await routeApi.searchRoutes({
          filters,
          page: currentPage - 1,
          size: ROUTES_PER_PAGE,
          sortBy: appliedFilters.sortBy,
          sortDirection: appliedFilters.sortDirection,
        });

        const detailedRoutes = await Promise.all(
          response.content.map(async (route) => {
            try {
              return await routeApi.getRouteById(route.routeId);
            } catch {
              return route;
            }
          }),
        );

        if (cancelled) return;
        setRoutes(detailedRoutes);
        setTotalPages(Math.max(1, response.page.totalPages || 1));
      } catch (err) {
        if (cancelled) return;
        setRoutes([]);
        setTotalPages(1);
        setError(
          err instanceof Error ? err.message : "Không thể tải danh sách tuyến.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRoutes();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, currentPage, debouncedQuickSearch, reloadVersion, routeTypeFilter]);

  function handleToggleFilterPanel() {
    setDraftFilters(cloneRouteAdvancedFilters(appliedFilters));
    setIsFilterOpen((current) => !current);
  }

  function handleAddFilterRow() {
    setDraftFilters((current) => ({
      ...current,
      rows: [...current.rows, createRouteFilterRow()],
    }));
  }

  function handleUpdateFilterRow(
    rowId: string,
    updater: (row: RouteFilterRowState) => RouteFilterRowState,
  ) {
    setDraftFilters((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === rowId ? updater(row) : row)),
    }));
  }

  function handleRemoveFilterRow(rowId: string) {
    setDraftFilters((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.id !== rowId),
    }));
  }

  function handleApplyFilters() {
    setAppliedFilters(cloneRouteAdvancedFilters(draftFilters));
    setCurrentPage(1);
    setIsFilterOpen(false);
  }

  function handleResetFilters() {
    const nextFilters = createDefaultRouteAdvancedFilters();
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  }

  function handleRouteTypeFilter(type: "OFFICIAL" | "CUSTOM" | null) {
    setRouteTypeFilter(type);
    setCurrentPage(1);
  }

  function handleDeleteRequest(route: RouteResponse) {
    setOpenMenuRouteId(null);
    setPendingDeleteRoute(route);
  }

  async function handleConfirmDeleteRoute() {
    if (!pendingDeleteRoute) {
      return;
    }

    const routeId = pendingDeleteRoute.routeId;

    setDeletingRouteId(routeId);

    try {
      await routeApi.deleteRoute(routeId);
      setPendingDeleteRoute(null);
      toast.success("Đã xoá tuyến.");
      setReloadVersion((value) => value + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xoá tuyến.");
    } finally {
      setDeletingRouteId(null);
    }
  }

  function handlePublishRequest(route: RouteResponse) {
    setOpenMenuRouteId(null);
    const normalizedStatus = route.status?.trim().toUpperCase();

    if (normalizedStatus === "PUBLISHED" || normalizedStatus === "APPROVED") {
      toast.info("Tuyến này đã ở trạng thái xuất bản.");
      return;
    }

    if (normalizedStatus === "DELETED") {
      toast.error("Không thể kích hoạt tuyến đã bị xóa.");
      return;
    }

    setPendingPublishRoute(route);
  }

  async function handleConfirmPublishRoute() {
    if (!pendingPublishRoute) {
      return;
    }

    const routeId = pendingPublishRoute.routeId;

    setPublishingRouteId(routeId);

    try {
      await routeApi.publishRoute(routeId);
      setPendingPublishRoute(null);
      toast.success("Đã kích hoạt tuyến.");
      setReloadVersion((value) => value + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể kích hoạt tuyến.",
      );
    } finally {
      setPublishingRouteId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <section className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="cq-page-title">Tuyến hành trình</h1>
            <p className="cq-page-subtitle max-w-2xl">
              Xây dựng các tuyến khám phá di sản TP.HCM.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-slate-100 bg-[#F7F5EF] p-1">
            <Link
              href="/curator/routes"
              className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-medium text-slate-950 shadow-sm"
            >
              Danh sách
            </Link>
            <Link
              href="/curator/routes/create"
              className="rounded-full px-3.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-900"
            >
              Trình tạo tuyến
            </Link>
          </div>
        </div>

        {/* Toggle: loại tuyến */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-slate-100 bg-[#F7F5EF] p-1">
            <button
              type="button"
              onClick={() => handleRouteTypeFilter(null)}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium transition ${
                routeTypeFilter === null
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => handleRouteTypeFilter("OFFICIAL")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium transition ${
                routeTypeFilter === "OFFICIAL"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              Tuyến hệ thống
            </button>
            <button
              type="button"
              onClick={() => handleRouteTypeFilter("CUSTOM")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium transition ${
                routeTypeFilter === "CUSTOM"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <PencilLine className="h-3 w-3" />
              Tuyến người dùng
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={quickSearch}
              onChange={(event) => setQuickSearch(event.target.value)}
              placeholder="Tìm kiếm theo tên tuyến"
              className="h-9 rounded-2xl border border-slate-200 bg-white pl-9 pr-3.5 text-[13px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <div data-route-filter className="relative">
            <button
              type="button"
              onClick={handleToggleFilterPanel}
              aria-expanded={isFilterOpen}
              aria-haspopup="dialog"
              className={`group inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                isFilterOpen
                  ? "border-[#F7DCE8] bg-[#FFF1F7] text-[#D94A8D] shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#F7DCE8] hover:bg-[#FFF1F7] hover:text-[#D94A8D]"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Bộ lọc nâng cao
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition ${
                  isFilterOpen
                    ? "rotate-180 text-[#D94A8D]"
                    : "group-hover:text-[#D94A8D]"
                }`}
              />
            </button>

            {isFilterOpen ? (
              <div className="absolute left-0 top-[calc(100%+0.6rem)] z-20 w-[min(34rem,calc(100vw-2rem))] rounded-[1.15rem] border border-slate-100 bg-white p-3 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                  <div className="rounded-[0.95rem] bg-slate-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Điều kiện lọc
                      </p>
                      <button
                        type="button"
                        onClick={handleAddFilterRow}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 shadow-sm transition hover:text-primary"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        Thêm điều kiện
                      </button>
                    </div>

                    {draftFilters.rows.length === 0 ? (
                      <p className="mt-2 text-[11px] text-slate-500">
                        Chưa có điều kiện bổ sung. Bạn có thể lọc theo trạng
                        thái, độ khó, thẻ, điểm số hoặc số địa điểm.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {draftFilters.rows.map((row) => {
                          const fieldOption = getRouteSearchFieldOption(
                            row.field,
                          );

                          return (
                            <div
                              key={row.id}
                              className="grid gap-2 rounded-2xl bg-white p-2.5 shadow-sm lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                            >
                              <select
                                value={row.field}
                                onChange={(event) => {
                                  const nextField = event.target
                                    .value as RouteSearchField;
                                  const nextFieldOption =
                                    getRouteSearchFieldOption(nextField);

                                  handleUpdateFilterRow(row.id, () => ({
                                    ...createRouteFilterRow(nextField),
                                    id: row.id,
                                    operator: nextFieldOption.defaultOperator,
                                  }));
                                }}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                              >
                                {routeSearchFieldOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={row.operator}
                                onChange={(event) =>
                                  handleUpdateFilterRow(
                                    row.id,
                                    (currentRow) => ({
                                      ...currentRow,
                                      operator: event.target
                                        .value as RouteFilterRowState["operator"],
                                    }),
                                  )
                                }
                                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                              >
                                {fieldOption.operators.map((operator) => (
                                  <option key={operator} value={operator}>
                                    {routeOperatorLabelMap[operator]}
                                  </option>
                                ))}
                              </select>

                              {renderRouteFilterValueControl(row, (value) =>
                                handleUpdateFilterRow(row.id, (currentRow) => ({
                                  ...currentRow,
                                  value,
                                })),
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveFilterRow(row.id)}
                                className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-slate-500 transition hover:text-rose-600"
                                aria-label="Xóa điều kiện"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 rounded-[0.95rem] bg-slate-100 p-3 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Sắp xếp theo
                      </span>
                      <select
                        value={draftFilters.sortBy}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            sortBy: event.target.value as RouteSortField,
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        {routeSortFieldOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Chiều sắp xếp
                      </span>
                      <select
                        value={draftFilters.sortDirection}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            sortDirection: event.target.value as "ASC" | "DESC",
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="DESC">Giảm dần</option>
                        <option value="ASC">Tăng dần</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex h-9 items-center rounded-full bg-slate-100 px-3.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                  >
                    Đặt lại
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Áp dụng bộ lọc
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
            Đang tải danh sách tuyến...
          </div>
        ) : routes.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
            {debouncedQuickSearch
              ? "Không tìm thấy tuyến phù hợp."
              : "Chưa có tuyến nào."}
          </div>
        ) : (
          <div className="mt-7 grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
            {routes.map((route) => (
              <div
                key={route.routeId}
                className={`h-full w-full ${publishingRouteId === route.routeId || deletingRouteId === route.routeId ? "pointer-events-none opacity-70" : ""}`}
              >
                <RouteCard
                  route={route}
                  onDelete={handleDeleteRequest}
                  onPublish={handlePublishRequest}
                  isMenuOpen={openMenuRouteId === route.routeId}
                  setOpenMenuRouteId={setOpenMenuRouteId}
                  isPublishing={publishingRouteId === route.routeId}
                />
              </div>
            ))}
          </div>
        )}

        {routes.length > 0 ? (
          <div className="mt-auto flex justify-end pt-6">
            <CuratorPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </section>

      {pendingPublishRoute ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPendingPublishRoute(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[22rem] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-7 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-8">
            <div className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h2 className="text-[1.125rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.25rem]">
                Bạn có chắc muốn kiểm tra?
              </h2>
              <p className="mx-auto max-w-[16.5rem] text-[0.8125rem] leading-5 text-slate-500 sm:text-[0.875rem]">
                Tuyến{" "}
                <span className="font-semibold text-slate-900">
                  {pendingPublishRoute.routeName}
                </span>{" "}
                sẽ được kích hoạt ngay lập tức.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingPublishRoute(null)}
                disabled={publishingRouteId === pendingPublishRoute.routeId}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-[0.8125rem] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmPublishRoute()}
                disabled={publishingRouteId === pendingPublishRoute.routeId}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-500 bg-emerald-500 px-4 text-[0.8125rem] font-semibold text-white transition hover:border-emerald-600 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {publishingRouteId === pendingPublishRoute.routeId
                  ? "Đang kiểm tra..."
                  : "Kiểm tra"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteRoute ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPendingDeleteRoute(null)}
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
                Hành động này không thể hoàn tác. Tuyến{" "}
                <span className="font-semibold text-slate-900">
                  {pendingDeleteRoute.routeName}
                </span>{" "}
                sẽ bị xóa khỏi danh sách hiện tại.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteRoute(null)}
                disabled={deletingRouteId === pendingDeleteRoute.routeId}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-[0.8125rem] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteRoute()}
                disabled={deletingRouteId === pendingDeleteRoute.routeId}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#CF3F34] bg-[#CF3F34] px-4 text-[0.8125rem] font-semibold text-white transition hover:border-[#B9342A] hover:bg-[#B9342A] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {deletingRouteId === pendingDeleteRoute.routeId
                  ? "Đang xóa..."
                  : "Xóa tuyến"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
