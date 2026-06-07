"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Clock3,
  Eye,
  Landmark,
  MapPinned,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Search,
  Shapes,
  Trash2,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  curatorRouteThemes,
  getStoredRouteThemesSnapshot,
  subscribeStoredRouteThemes,
  writeStoredRouteThemes,
  type RouteTheme,
} from "@/data/route-themes";
import { cn } from "@/lib/utils";

type ThemeVisual = {
  icon: LucideIcon;
  description: string;
  order: number;
  iconWrapClass: string;
  iconClass: string;
};

type ThemeAction = {
  key: "preview" | "edit" | "delete";
  label: string;
  icon: LucideIcon;
  danger?: boolean;
};

const architectureTheme: RouteTheme = {
  id: "architecture",
  title: "Kiến trúc đặc sắc",
  description: "Logic sắp xếp tự động dựa trên lớp di sản kiến trúc đô thị.",
  distance: "~2.0 km",
  duration: "~85 phút",
  distanceOffsetKm: 0.35,
  durationOffsetMinutes: 16,
  status: "active",
  statusLabel: "Đang dùng",
  routeCount: 1,
  curator: "Phương Linh",
  lastUpdated: "28/5/2025",
  insight:
    "Phù hợp các tuyến khám phá công trình tiêu biểu theo từng lớp kiến trúc và niên đại.",
};

const themeVisuals: Record<string, ThemeVisual> = {
  timeline: {
    icon: Clock3,
    description:
      "Sắp xếp các điểm đến theo trình tự thời gian lịch sử, từ quá khứ đến hiện tại.",
    order: 1,
    iconWrapClass: "bg-[#F8E4D9]",
    iconClass: "text-[#D4550D]",
  },
  geo: {
    icon: MapPinned,
    description:
      "Tự động tối ưu hóa lộ trình đi lại giữa các điểm đến theo khoảng cách ngắn nhất.",
    order: 2,
    iconWrapClass: "bg-[#D6EEF9]",
    iconClass: "text-[#1F9BE2]",
  },
  culture: {
    icon: Palette,
    description:
      "Tập trung vào một chủ đề văn hóa cụ thể như ẩm thực, nghệ thuật, tín ngưỡng.",
    order: 3,
    iconWrapClass: "bg-[#E2D4FB]",
    iconClass: "text-[#7A3AED]",
  },
  character: {
    icon: UserRound,
    description:
      "Theo dấu chân các nhân vật lịch sử nổi tiếng tại thành phố qua chuỗi điểm dừng tiêu biểu.",
    order: 4,
    iconWrapClass: "bg-[#D3EEE9]",
    iconClass: "text-[#129C76]",
  },
  story: {
    icon: BookOpenText,
    description:
      "Các điểm đến được kết nối bởi một mạch chuyện liên tục, tạo trải nghiệm kể chuyện.",
    order: 5,
    iconWrapClass: "bg-[#FBE9C8]",
    iconClass: "text-[#F59E0B]",
  },
  architecture: {
    icon: Landmark,
    description:
      "Khám phá các công trình kiến trúc tiêu biểu từ nhiều thời kỳ khác nhau.",
    order: 6,
    iconWrapClass: "bg-[#F8D6EA]",
    iconClass: "text-[#EC4899]",
  },
};

const fallbackThemeVisual: ThemeVisual = {
  icon: Shapes,
  description:
    "Nhóm các tuyến theo logic biên tập mới, có thể tùy biến thêm tiêu chí nội dung và trải nghiệm.",
  order: 99,
  iconWrapClass: "bg-[#E7E5FF]",
  iconClass: "text-[#5B4AE6]",
};

const themeActions: ThemeAction[] = [
  { key: "preview", label: "Xem chi tiết", icon: Eye },
  { key: "edit", label: "Chỉnh sửa", icon: Pencil },
  { key: "delete", label: "Xóa", icon: Trash2, danger: true },
];

function buildThemeCatalog(input: RouteTheme[]) {
  const merged = [...input];

  if (!merged.some((theme) => theme.id === architectureTheme.id)) {
    merged.push(architectureTheme);
  }

  return merged.sort(
    (left, right) =>
      resolveThemeVisual(left).order - resolveThemeVisual(right).order,
  );
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveThemeVisual(theme: RouteTheme) {
  if (theme.visualKey && theme.visualKey in themeVisuals) {
    return themeVisuals[theme.visualKey];
  }

  if (theme.id in themeVisuals) {
    return themeVisuals[theme.id];
  }

  return fallbackThemeVisual;
}

function isHexColor(value: string | undefined): value is string {
  return typeof value === "string" && /^#[0-9A-F]{6}$/i.test(value);
}

function toRgba(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function ThemeCard({
  theme,
  editing,
  menuOpen,
  onEdit,
  onDelete,
  onToggleMenu,
  onCloseMenu,
}: {
  theme: RouteTheme;
  editing: boolean;
  menuOpen: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}) {
  const visual = resolveThemeVisual(theme);
  const Icon = visual.icon;
  const usageLabel =
    theme.routeCount === 1
      ? "1 tuyến sử dụng"
      : `${theme.routeCount} tuyến sử dụng`;
  const accentColor = isHexColor(theme.accentColor) ? theme.accentColor : null;

  return (
    <article
      className={cn(
        "relative overflow-visible rounded-[1.75rem] border border-slate-200/80 bg-card p-4 shadow-sm transition sm:p-5",
        editing
          ? "border-[#E8B2A8] ring-2 ring-[#F8D1CA]"
          : "hover:-translate-y-0.5 hover:shadow-lg",
        menuOpen ? "z-20" : "",
      )}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem]",
              visual.iconWrapClass,
            )}
            style={
              accentColor
                ? { backgroundColor: toRgba(accentColor, 0.16) }
                : undefined
            }
          >
            <Icon
              className={cn(
                "h-6 w-6",
                accentColor ? undefined : visual.iconClass,
              )}
              style={accentColor ? { color: accentColor } : undefined}
            />
          </div>

          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/curator/themes/${theme.id}`}
                  className="cq-card-title leading-tight text-slate-900 transition hover:text-[#C94534]"
                >
                  {theme.title}
                </Link>
                {editing ? (
                  <span className="rounded-full bg-[#FFF2EE] px-2.5 py-1 text-xs font-semibold text-[#C94534]">
                    Đang sửa
                  </span>
                ) : null}
              </div>
              <p className="mt-1 cq-card-copy text-slate-500">{usageLabel}</p>
            </div>

            <div className="relative shrink-0" data-theme-actions>
              <button
                type="button"
                aria-label={`Mở thao tác cho ${theme.title}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={onToggleMenu}
                className={cn(
                  "rounded-full p-2 text-slate-600 transition hover:bg-slate-100",
                  menuOpen ? "bg-slate-100" : "bg-white/90",
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.6rem)] w-40 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
                >
                  {themeActions.map((action) => {
                    const ActionIcon = action.icon;

                    const handleClick = () => {
                      onCloseMenu();

                      if (action.key === "edit") {
                        onEdit();
                        return;
                      }

                      onDelete();
                    };

                    return action.key === "preview" ? (
                      <Link
                        key={action.key}
                        href={`/curator/themes/${theme.id}`}
                        role="menuitem"
                        onClick={onCloseMenu}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <ActionIcon className="h-4 w-4" />
                        <span>{action.label}</span>
                      </Link>
                    ) : (
                      <button
                        key={action.key}
                        type="button"
                        role="menuitem"
                        onClick={handleClick}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                          action.danger
                            ? "mt-1 border-t border-slate-100 pt-3 text-red-500 hover:bg-red-50"
                            : editing
                              ? "bg-[#FFF2EE] text-[#C94534]"
                              : "text-slate-700 hover:bg-slate-100",
                        )}
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

        <p className="line-clamp-2 cq-card-copy leading-5 text-slate-500">
          {theme.description}
        </p>
      </div>
    </article>
  );
}

export default function CuratorThemesPage() {
  const storedThemes = useSyncExternalStore(
    subscribeStoredRouteThemes,
    getStoredRouteThemesSnapshot,
    () => curatorRouteThemes,
  );
  const themes = buildThemeCatalog(storedThemes);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [openMenuThemeId, setOpenMenuThemeId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (!event.target.closest("[data-theme-actions]")) {
        setOpenMenuThemeId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuThemeId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const normalizedQuery = normalizeText(deferredSearch);
  const filteredThemes = themes.filter((theme) => {
    if (!normalizedQuery) {
      return true;
    }

    const content = normalizeText(
      `${theme.title} ${theme.description} ${resolveThemeVisual(theme).description} ${theme.insight}`,
    );

    return content.includes(normalizedQuery);
  });

  const handleDeleteTheme = (themeId: string) => {
    const nextThemes = themes.filter((theme) => theme.id !== themeId);
    writeStoredRouteThemes(nextThemes);
    setOpenMenuThemeId((current) => (current === themeId ? null : current));

    if (editingThemeId === themeId) {
      setEditingThemeId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div>
              <h1 className="cq-page-title">
                Chủ đề tuyến
              </h1>
              <p className="cq-page-subtitle max-w-2xl">
                Quản lý các chủ đề phân loại tuyến hành trình khám phá di sản.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="secondary"
            size="default"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 shadow-sm"
          >
            <Link href="/curator/themes/create">
              <Plus className="h-4 w-4" />
              Tạo mới
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm chủ đề..."
              className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-500 shadow-sm">
            {filteredThemes.length} chủ đề
          </div>
        </div>
      </section>

      {filteredThemes.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              editing={editingThemeId === theme.id}
              menuOpen={openMenuThemeId === theme.id}
              onEdit={() =>
                setEditingThemeId((current) =>
                  current === theme.id ? null : theme.id,
                )
              }
              onDelete={() => handleDeleteTheme(theme.id)}
              onToggleMenu={() =>
                setOpenMenuThemeId((current) =>
                  current === theme.id ? null : theme.id,
                )
              }
              onCloseMenu={() => setOpenMenuThemeId(null)}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-card px-6 py-12 text-center shadow-sm">
          <p className="cq-section-title">
            Không tìm thấy chủ đề phù hợp
          </p>
          <p className="cq-page-subtitle mt-2">
            Thử đổi từ khóa hoặc tạo một chủ đề mới để bắt đầu.
          </p>
        </section>
      )}
    </div>
  );
}
