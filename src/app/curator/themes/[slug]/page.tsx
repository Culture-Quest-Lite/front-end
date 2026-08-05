"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpenText,
  Clock3,
  Landmark,
  MapPinned,
  Palette,
  Pencil,
  Shapes,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  curatorRouteThemes,
  getStoredRouteThemesSnapshot,
  subscribeStoredRouteThemes,
  type RouteTheme,
} from "@/data/route-themes";
import { cn } from "@/lib/utils";

type ThemeVisual = {
  icon: LucideIcon;
  accentColor: string;
  iconWrapClass: string;
  iconClass: string;
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
    accentColor: "#C2410C",
    iconWrapClass: "bg-[#FFF1E8]",
    iconClass: "text-[#C2410C]",
  },
  geo: {
    icon: MapPinned,
    accentColor: "#0EA5E9",
    iconWrapClass: "bg-[#E9F7FE]",
    iconClass: "text-[#0EA5E9]",
  },
  culture: {
    icon: Palette,
    accentColor: "#7C3AED",
    iconWrapClass: "bg-[#F1EBFF]",
    iconClass: "text-[#7C3AED]",
  },
  character: {
    icon: UserRound,
    accentColor: "#10A57A",
    iconWrapClass: "bg-[#E9F8F3]",
    iconClass: "text-[#10A57A]",
  },
  story: {
    icon: BookOpenText,
    accentColor: "#D08A00",
    iconWrapClass: "bg-[#FFF6DE]",
    iconClass: "text-[#D08A00]",
  },
  architecture: {
    icon: Landmark,
    accentColor: "#E84BA2",
    iconWrapClass: "bg-[#FEEAF4]",
    iconClass: "text-[#E84BA2]",
  },
};

const fallbackThemeVisual: ThemeVisual = {
  icon: Shapes,
  accentColor: "#5B4AE6",
  iconWrapClass: "bg-[#ECEAFE]",
  iconClass: "text-[#5B4AE6]",
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <span className="cq-label">
          {label}
        </span>
        <div className="cq-card-title text-right">
          {value}
        </div>
      </div>
    </div>
  );
}

function buildThemeCatalog(input: RouteTheme[]) {
  const merged = [...input];

  if (!merged.some((theme) => theme.id === architectureTheme.id)) {
    merged.push(architectureTheme);
  }

  return merged;
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

export default function ThemeDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const storedThemes = useSyncExternalStore(
    subscribeStoredRouteThemes,
    getStoredRouteThemesSnapshot,
    () => curatorRouteThemes,
  );
  const themes = buildThemeCatalog(storedThemes);
  const theme = themes.find((item) => item.id === slug);

  if (!theme) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-slate-700">
          <Link
            href="/curator/themes"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="cq-page-title">
              Không tìm thấy chủ đề
            </h1>
            <p className="cq-page-subtitle">
              Chủ đề này không còn tồn tại trong dữ liệu hiện tại.
            </p>
          </div>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex justify-end">
            <Button asChild variant="secondary" size="lg" className="rounded-full px-5">
              <Link href="/curator/themes">Đóng</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const visual = resolveThemeVisual(theme);
  const Icon = visual.icon;
  const accentColor = isHexColor(theme.accentColor)
    ? theme.accentColor.toUpperCase()
    : visual.accentColor;
  const createdAt = theme.createdAt ?? theme.lastUpdated;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-slate-700">
        <Link
          href="/curator/themes"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="cq-page-title">
            Chi tiết chủ đề
          </h1>
          <p className="cq-page-subtitle">
            Thông tin chi tiết chủ đề tuyến.
          </p>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="cq-kicker">
              Tổng quan chủ đề
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem]",
                  visual.iconWrapClass,
                )}
              >
                <Icon className={cn("h-6 w-6", visual.iconClass)} />
              </div>
              <h2
                className="cq-detail-title"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {theme.title}
              </h2>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Thông tin chi tiết chủ đề tuyến
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
            <Button asChild variant="outline" size="sm" className="rounded-full px-4">
              <Link href="/curator/themes">Đóng</Link>
            </Button>

            <Button
              asChild
              variant="secondary"
              size="sm"
              className="rounded-full text-white"
            >
              <Link href={`/curator/themes/create?theme=${theme.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Sửa chủ đề
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="grid gap-3">
            <DetailRow label="ID" value={theme.id} />
            <DetailRow
              label="Màu chủ đạo"
              value={
                <span className="inline-flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>{accentColor}</span>
                </span>
              }
            />
            <DetailRow label="Số tuyến" value={theme.routeCount} />
            <DetailRow label="Ngày tạo" value={createdAt} />
            <DetailRow label="Cập nhật" value={theme.lastUpdated} />
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <p className="cq-label">
              Mô tả
            </p>
            <p className="cq-body-copy mt-3">
              {theme.description}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
