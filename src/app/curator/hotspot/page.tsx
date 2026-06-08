"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { hotspotItems } from "@/data/hotspots";

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
const hotspotStatusOptions = [
  ALL_STATUS_OPTION,
  ...Array.from(new Set(hotspotItems.map((item) => item.status))),
];
const hotspotCategoryOptions = [
  ALL_CATEGORY_OPTION,
  ...Array.from(new Set(hotspotItems.map((item) => item.category))),
];

export default function Page() {
  const [openMenuTitle, setOpenMenuTitle] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUS_OPTION);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_OPTION);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredHotspots = hotspotItems.filter((item) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [item.title, item.subtitle, item.address, item.category, item.author].some(
        (field) => field.toLowerCase().includes(normalizedQuery),
      );
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
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-hotspot-actions]")) {
        setOpenMenuTitle(null);
      }

      if (!event.target.closest("[data-hotspot-filter]")) {
        setIsFilterOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuTitle(null);
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
      </section>

      <section className="flex flex-1 flex-col gap-4">
        {filteredHotspots.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2">
            {paginatedHotspots.map((item) => {
              const isMenuOpen = openMenuTitle === item.title;
              const detailHref = `/curator/hotspot/${item.slug}`;

              return (
                <article
                  key={item.slug}
                  className={`group relative flex h-full flex-col overflow-visible rounded-[1.75rem] border border-slate-200/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isMenuOpen ? "z-20" : ""}`}
                >
                  <Link
                    href={detailHref}
                    className="relative block h-40 overflow-hidden rounded-t-[1.75rem] bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <div
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold shadow-lg ring-1 ring-white/30 backdrop-blur-sm ${item.statusStyle}`}
                    >
                      {item.badge}
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      {item.gps}
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
                            {item.author.charAt(0)}
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
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.xp}
                        </span>
                        <div className="relative" data-hotspot-actions>
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                            onClick={() =>
                              setOpenMenuTitle(isMenuOpen ? null : item.title)
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

                                return action.key === "detail" ? (
                                  <Link
                                    key={action.label}
                                    href={detailHref}
                                    role="menuitem"
                                    onClick={() => setOpenMenuTitle(null)}
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
                                    onClick={() => setOpenMenuTitle(null)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                                      action.danger
                                        ? "mt-1 border-t border-slate-100 pt-3 text-red-500 hover:bg-red-50"
                                        : "text-slate-700 hover:bg-slate-100"
                                    }`}
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
                          key={tag}
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
                  setOpenMenuTitle(null);
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
                    setOpenMenuTitle(null);
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
                  setOpenMenuTitle(null);
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
