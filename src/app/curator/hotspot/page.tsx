"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Archive,
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

const statusGroups = [
  { label: "Tất cả", count: hotspotItems.length, active: true },
  {
    label: "Chờ duyệt",
    count: hotspotItems.filter((item) => item.status === "Chờ duyệt").length,
    active: false,
  },
  {
    label: "Đã xuất bản",
    count: hotspotItems.filter((item) => item.status === "Đã xuất bản").length,
    active: false,
  },
  {
    label: "Bản nháp",
    count: hotspotItems.filter((item) => item.status === "Bản nháp").length,
    active: false,
  },
  {
    label: "Từ chối",
    count: hotspotItems.filter((item) => item.status === "Bị từ chối").length,
    active: false,
  },
];

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

export default function Page() {
  const [openMenuTitle, setOpenMenuTitle] = useState<string | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-hotspot-actions]")) {
        setOpenMenuTitle(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuTitle(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {/* <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
              Quản lý Hotspot
            </div> */}
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                Quản lý Hotspot
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Tạo, chỉnh sửa và phát hành các điểm di sản văn hóa TP.HCM.
              </p>
            </div>
          </div>

          <Link
            href="/curator/hotspot/create"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 shadow-sm",
            )}
          >
            <Plus className="h-4 w-4" />
            Tạo Hotspot
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] ">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm địa chỉ..."
              className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select className="h-10 rounded-lg border-0 bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/50 shadow-sm">
              <option>Mọi trạng thái</option>
              <option>Đã xuất bản</option>
              <option>Chờ duyệt</option>
            </select>
            <select className="h-10 rounded-lg border-0 bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/50 shadow-sm">
              <option>Mọi danh mục</option>
              <option>Kiến trúc</option>
              <option>Lịch sử</option>
            </select>
          </div>

          <Button
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border-0 shadow-sm"
          >
            <Filter className="h-4 w-4" />
            Bộ lọc nâng cao
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 ">
          {statusGroups.map((item) => (
            <button
              key={item.label}
              className={`rounded-full shadow-sm border-0 px-4 py-2 text-sm font-medium transition ${item.active ? "bg-foreground text-amber-400" : "bg-white text-slate-700 hover:bg-slate-100"}`}
            >
              {item.label}
              <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2">
        {hotspotItems.map((item) => {
          const isMenuOpen = openMenuTitle === item.title;
          const detailHref = `/curator/hotspot/${item.slug}`;

          return (
            <article
              key={item.title}
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
      </section>
    </div>
  );
}
