"use client";

import { useEffect, useRef, useState } from "react";
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
import { hotspotApi, type BackendHotspot, userApi } from "@/services/api";

const tagColorClasses = [
  "border-red-200 bg-red-50 text-red-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
];

const hotspotActions = [
  { key: "edit", label: "Chỉnh sửa", icon: PencilLine },
  { key: "detail", label: "Xem chi tiết", icon: Eye },
  { key: "submit", label: "Gửi duyệt", icon: Send },
  { key: "archive", label: "Xóa", icon: Trash2, danger: true },
];

const HOTSPOTS_PER_PAGE = 8;
const ALL_STATUS_OPTION = "Mọi trạng thái";
const ALL_CATEGORY_OPTION = "Mọi danh mục";
const CURATOR_VISIBLE_HOTSPOT_STATUSES = new Set(["ACTIVE", "DRAFT"]);
const CURATOR_VISIBLE_FALLBACK_STATUSES = new Set(["Đã xuất bản", "Bản nháp"]);

type HotspotViewItem = HotspotItem & {
  hotspotId?: number;
};

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
    const matchedSegment = reversedSegments.find((segment) => matcher.test(segment));

    if (matchedSegment) {
      return matchedSegment;
    }
  }

  return segments.at(-2) ?? segments.at(-1) ?? "";
}

function buildSubtitle(category: string, address?: string, fallbackSubtitle?: string) {
  const parts = [category.trim(), extractLocationLabel(address)].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : fallbackSubtitle ?? "";
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
    (item) => item.slug === slug || normalizeText(item.title) === normalizedName,
  );
}

function buildTagLabels(tags?: BackendHotspot["tags"], fallback?: HotspotItem) {
  const mappedTags =
    tags
      ?.map((tag) => tag.tagName?.trim())
      .filter((tagName): tagName is string => Boolean(tagName))
      .map((tagName) => `#${tagName}`) ?? [];

  return mappedTags.length > 0 ? mappedTags : fallback?.tags ?? [];
}

function isCuratorVisibleHotspot(hotspot: BackendHotspot) {
  const normalizedStatus = hotspot.status?.trim().toUpperCase();
  return normalizedStatus ? CURATOR_VISIBLE_HOTSPOT_STATUSES.has(normalizedStatus) : false;
}

function isCuratorVisibleFallbackHotspot(hotspot: HotspotItem) {
  return CURATOR_VISIBLE_FALLBACK_STATUSES.has(hotspot.status);
}

function buildHotspotCards(
  apiHotspots: BackendHotspot[],
  creatorDisplayNames: Map<number, string>,
): HotspotViewItem[] {
  const usedSlugs = new Set<string>();

  return apiHotspots.filter(isCuratorVisibleHotspot).map((hotspot) => {
    const fallback = findFallbackHotspot(hotspot);
    const fallbackSlug = fallback?.slug ?? "";
    const category =
      hotspot.tags?.find((tag) => tag.tagName?.trim())?.tagName.trim() ??
      fallback?.category ??
      "";
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
      title: hotspot.hotspotName?.trim() || fallback?.title || `Hotspot ${hotspot.hotspotId}`,
      subtitle: buildSubtitle(category, hotspot.address, fallback?.subtitle),
      author:
        (hotspot.createByUserId
          ? creatorDisplayNames.get(hotspot.createByUserId)
          : undefined) ||
        fallback?.author ||
        (hotspot.createByUserId ? `Curator #${hotspot.createByUserId}` : ""),
      date: formatDateLabel(hotspot.createdAt ?? hotspot.updatedAt) || fallback?.date || "",
      address: hotspot.address?.trim() || fallback?.address || "",
      description: hotspot.description?.trim() || fallback?.description || "",
      category,
      relatedTopics: fallback?.relatedTopics ?? [],
      videoLabel: fallback?.videoLabel,
      videoUrl: fallback?.videoUrl,
      xp:
        typeof hotspot.xp === "number"
          ? `${hotspot.xp} XP`
          : fallback?.xp || "",
      status: statusMeta.label,
      statusStyle: statusMeta.style,
      badge: statusMeta.label,
      gps:
        typeof hotspot.latitude === "number" && typeof hotspot.longitude === "number"
          ? "GPS OK"
          : fallback?.gps || "",
      image: fallback?.image ?? "",
      tags: buildTagLabels(hotspot.tags, fallback),
    };
  });
}

async function loadCreatorDisplayNames(apiHotspots: BackendHotspot[]) {
  const creatorIds = Array.from(
    new Set(
      apiHotspots
        .filter(isCuratorVisibleHotspot)
        .map((hotspot) => hotspot.createByUserId)
        .filter((userId): userId is number => typeof userId === "number"),
    ),
  );
  const creatorEntries = await Promise.allSettled(
    creatorIds.map(async (userId) => {
      const user = await userApi.getUserById(userId);
      return [userId, user?.displayName?.trim() || ""] as const;
    }),
  );
  const creatorDisplayNames = new Map<number, string>();

  for (const entry of creatorEntries) {
    if (entry.status !== "fulfilled") {
      continue;
    }

    const [userId, displayName] = entry.value;

    if (displayName) {
      creatorDisplayNames.set(userId, displayName);
    }
  }

  return creatorDisplayNames;
}

export default function Page() {
  const [hotspots, setHotspots] = useState<HotspotViewItem[]>([]);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUS_OPTION);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_OPTION);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingHotspotId, setDeletingHotspotId] = useState<number | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const hotspotStatusOptions = [
    ALL_STATUS_OPTION,
    ...Array.from(new Set(hotspots.map((item) => item.status).filter(Boolean))),
  ];
  const hotspotCategoryOptions = [
    ALL_CATEGORY_OPTION,
    ...Array.from(new Set(hotspots.map((item) => item.category).filter(Boolean))),
  ];

  const normalizedQuery = normalizeText(searchQuery);
  const filteredHotspots = hotspots.filter((item) => {
    const searchableFields = [
      item.title,
      item.subtitle,
      item.address,
      item.category,
      item.author,
    ].filter(Boolean);
    const matchesQuery =
      normalizedQuery.length === 0 ||
      searchableFields.some((field) => normalizeText(field).includes(normalizedQuery));
    const matchesStatus =
      selectedStatus === ALL_STATUS_OPTION || item.status === selectedStatus;
    const matchesCategory =
      selectedCategory === ALL_CATEGORY_OPTION ||
      item.category === selectedCategory;

    return matchesQuery && matchesStatus && matchesCategory;
  });
  const activeFilterCount =
    Number(selectedStatus !== ALL_STATUS_OPTION) +
    Number(selectedCategory !== ALL_CATEGORY_OPTION);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHotspots.length / HOTSPOTS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedHotspots = filteredHotspots.slice(
    (safeCurrentPage - 1) * HOTSPOTS_PER_PAGE,
    safeCurrentPage * HOTSPOTS_PER_PAGE,
  );
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadHotspots() {
      try {
        const response = await hotspotApi.getHotspots();

        if (isCancelled) {
          return;
        }

        const apiHotspots = Array.isArray(response) ? response : [];
        const creatorDisplayNames = await loadCreatorDisplayNames(apiHotspots);

        if (isCancelled) {
          return;
        }

        setHotspots(buildHotspotCards(apiHotspots, creatorDisplayNames));
        setLoadError(null);
      } catch (error) {
        console.error("Failed to load curator hotspots", error);

        if (isCancelled) {
          return;
        }

        setHotspots(hotspotItems.filter(isCuratorVisibleFallbackHotspot));
        setLoadError(
          "Không tải được danh sách hotspot từ API. Đang hiển thị dữ liệu hiện có.",
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
  }, []);

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

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleStatusChange(option: string) {
    setSelectedStatus(option);
    setCurrentPage(1);
  }

  function handleCategoryChange(option: string) {
    setSelectedCategory(option);
    setCurrentPage(1);
  }

  function handleResetFilters() {
    setSelectedStatus(ALL_STATUS_OPTION);
    setSelectedCategory(ALL_CATEGORY_OPTION);
    setCurrentPage(1);
  }

  async function handleDeleteHotspot(item: HotspotViewItem) {
    if (!item.hotspotId) {
      setOpenMenuKey(null);
      toast.error("Hotspot này chưa có ID backend nên chưa thể xóa.");
      return;
    }

    setDeletingHotspotId(item.hotspotId);
    try {
      const message = await hotspotApi.deleteHotspot(item.hotspotId);

      setHotspots((currentHotspots) =>
        currentHotspots.filter((hotspot) => hotspot.hotspotId !== item.hotspotId),
      );
      setOpenMenuKey(null);
      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa hotspot.",
      );
    } finally {
      setDeletingHotspotId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div>
              <h1 className="cq-page-title">Quản lý Hotspot</h1>
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
              Tạo Hotspot
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => handleSearchQueryChange(event.target.value)}
              placeholder="Tìm theo tên hotspot hoặc địa chỉ..."
              className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div
            ref={filterMenuRef}
            data-hotspot-filter
            className="relative sm:justify-self-end"
          >
            <button
              type="button"
              onClick={() => setIsFilterOpen((open) => !open)}
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
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(24rem,calc(100vw-2rem))] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Danh mục
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hotspotCategoryOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleCategoryChange(option)}
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            selectedCategory === option
                              ? "border-primary/20 bg-primary/10 font-medium text-primary shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-primary/20 hover:text-primary"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Trạng thái
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hotspotStatusOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleStatusChange(option)}
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            selectedStatus === option
                              ? "border-primary/20 bg-primary/10 font-medium text-primary shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-primary/20 hover:text-primary"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      Đặt lại
                    </button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-full px-4 text-white"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Xong
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            Đang tải danh sách hotspot từ API...
          </div>
        ) : null}

        {loadError ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
            {loadError}
          </div>
        ) : null}
      </section>

      <section className="flex flex-1 flex-col gap-4">
        {filteredHotspots.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2">
            {paginatedHotspots.map((item) => {
              const menuKey = String(item.hotspotId ?? item.slug);
              const isMenuOpen = openMenuKey === menuKey;
              const detailHref = item.hotspotId
                ? `/curator/hotspots/${item.hotspotId}`
                : `/curator/hotspot/${item.slug}`;
              const editHref = item.hotspotId
                ? `/curator/hotspot/create?id=${item.hotspotId}`
                : null;
              const isDeleting = deletingHotspotId === item.hotspotId;

              return (
                <article
                  key={item.hotspotId ?? item.slug}
                  className={`group relative flex h-full flex-col overflow-visible rounded-[1.75rem] border border-slate-200/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isMenuOpen ? "z-20" : ""}`}
                >
                  <Link
                    href={detailHref}
                    className="relative block h-40 overflow-hidden rounded-t-[1.75rem] bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(253,224,71,0.35),_rgba(248,250,252,1)_60%)] px-4 text-center text-sm font-medium text-slate-500">
                        Chưa có ảnh hotspot
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <div
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold shadow-lg ring-1 ring-white/30 backdrop-blur-sm ${item.statusStyle}`}
                    >
                      {item.badge}
                    </div>
                    {item.gps ? (
                      <div className="absolute right-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                        {item.gps}
                      </div>
                    ) : null}
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
                                        if (isDeleting) {
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
                                        setOpenMenuKey(null);
                                        toast.error(
                                          "Hotspot này chưa có ID backend nên chưa thể chỉnh sửa.",
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
                                      if (isDeleting) {
                                        return;
                                      }
                                      setOpenMenuKey(null);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                  >
                                    <ActionIcon className="h-4 w-4" />
                                    <span>{action.label}</span>
                                  </Link>
                                ) : action.key === "archive" ? (
                                  <button
                                    key={action.label}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => void handleDeleteHotspot(item)}
                                    disabled={isDeleting}
                                    className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-2.5 pt-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <ActionIcon className="h-4 w-4" />
                                    )}
                                    <span>
                                      {isDeleting ? "Đang xóa..." : action.label}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    key={action.label}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      if (isDeleting) {
                                        return;
                                      }
                                      setOpenMenuKey(null);
                                    }}
                                    disabled={isDeleting}
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
            Không tìm thấy hotspot phù hợp với bộ lọc hiện tại.
          </div>
        )}

        {filteredHotspots.length > 0 ? (
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
  );
}
