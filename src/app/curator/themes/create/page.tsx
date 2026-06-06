"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Landmark,
  MapPinned,
  Palette,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildRouteThemeId,
  getRouteThemeStatusLabel,
  readStoredRouteThemes,
  writeStoredRouteThemes,
  type RouteTheme,
} from "@/data/route-themes";
import { cn } from "@/lib/utils";

type ThemeVisualOptionKey =
  | "timeline"
  | "geo"
  | "culture"
  | "character"
  | "story"
  | "architecture";

type ThemeVisualOption = {
  key: ThemeVisualOptionKey;
  label: string;
  icon: LucideIcon;
};

const DEFAULT_ACCENT_COLOR = "#C2410C";

const themeVisualOptions: ThemeVisualOption[] = [
  { key: "timeline", label: "Thời gian", icon: Clock3 },
  { key: "geo", label: "Địa lý", icon: MapPinned },
  { key: "culture", label: "Văn hóa", icon: Palette },
  { key: "character", label: "Nhân vật", icon: UserRound },
  { key: "story", label: "Câu chuyện", icon: BookOpenText },
  { key: "architecture", label: "Kiến trúc", icon: Landmark },
];

function normalizeHexColorInput(value: string) {
  const hex = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
  return `#${hex}`;
}

function isValidHexColor(value: string) {
  return /^#[0-9A-F]{6}$/.test(value);
}

function buildUniqueThemeId(title: string, themes: RouteTheme[]) {
  const baseId = buildRouteThemeId(title);

  if (!themes.some((theme) => theme.id === baseId)) {
    return baseId;
  }

  let nextSuffix = 2;

  while (themes.some((theme) => theme.id === `${baseId}-${nextSuffix}`)) {
    nextSuffix += 1;
  }

  return `${baseId}-${nextSuffix}`;
}

export default function CreateThemePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [visualKey, setVisualKey] = useState<ThemeVisualOptionKey>("timeline");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    isValidHexColor(accentColor) &&
    !isSubmitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const currentThemes = readStoredRouteThemes();
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      const formattedDate = new Intl.DateTimeFormat("vi-VN").format(new Date());
      const nextTheme: RouteTheme = {
        id: buildUniqueThemeId(trimmedTitle, currentThemes),
        title: trimmedTitle,
        description: trimmedDescription,
        visualKey,
        accentColor,
        createdAt: formattedDate,
        distance: "~1.8 km",
        duration: "~75 phút",
        distanceOffsetKm: 0.25,
        durationOffsetMinutes: 14,
        status: "draft",
        statusLabel: getRouteThemeStatusLabel("draft"),
        routeCount: 0,
        curator: "Bạn",
        lastUpdated: formattedDate,
        insight: trimmedDescription,
      };

      writeStoredRouteThemes([nextTheme, ...currentThemes]);
      router.push("/curator/themes");
    } catch {
      setSubmitError("Không thể tạo chủ đề lúc này. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-slate-700">
          <Link
            href="/curator/themes"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="cq-page-title">
              Tạo chủ đề mới
            </h1>
            <p className="cq-page-subtitle">
              Thêm chủ đề phân loại cho tuyến hành trình.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="cq-section-title">
            Thông tin chủ đề
          </h2>

          <div className="mt-5 grid gap-4">
            <div>
              <label
                htmlFor="theme-title"
                className="cq-label mb-2 block"
              >
                Tên chủ đề
              </label>
              <Input
                id="theme-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Dòng thời gian lịch sử"
                className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="theme-description"
                className="cq-label mb-2 block"
              >
                Mô tả
              </label>
              <textarea
                id="theme-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả ngắn về cách chủ đề này sắp xếp tuyến..."
                className="h-24 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div>
                <label className="cq-label mb-2 block">
                  Màu sắc
                </label>

                <div className="flex items-center gap-3">
                  <label className="relative block h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <span
                      className="absolute inset-[3px] rounded-[0.8rem]"
                      style={{
                        backgroundColor: isValidHexColor(accentColor)
                          ? accentColor
                          : DEFAULT_ACCENT_COLOR,
                      }}
                    />
                    <input
                      type="color"
                      value={
                        isValidHexColor(accentColor)
                          ? accentColor
                          : DEFAULT_ACCENT_COLOR
                      }
                      onChange={(event) =>
                        setAccentColor(event.target.value.toUpperCase())
                      }
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Chọn màu chủ đề"
                    />
                  </label>

                  <Input
                    value={accentColor}
                    onChange={(event) =>
                      setAccentColor(normalizeHexColorInput(event.target.value))
                    }
                    className={cn(
                      "h-12 rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm uppercase text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                      !isValidHexColor(accentColor) &&
                        "border-[#DE4C3D] focus:border-[#DE4C3D] focus:ring-[#DE4C3D]/15",
                    )}
                    placeholder="#C2410C"
                    aria-label="Mã màu chủ đề"
                  />
                </div>

                {!isValidHexColor(accentColor) ? (
                  <p className="mt-2 text-xs text-[#D9483B]">
                    Nhập mã màu dạng `#RRGGBB`.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="cq-label mb-2 block">
                  Biểu tượng
                </label>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {themeVisualOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = option.key === visualKey;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setVisualKey(option.key)}
                        className={cn(
                          "flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-3xl border px-3 py-3 text-center text-xs font-medium transition",
                          selected
                            ? "border-red-300 bg-red-50 text-red-600"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="leading-4">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {submitError ? (
          <p className="mt-4 text-sm font-medium text-[#D9483B]">
            {submitError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button asChild variant="outline" size="sm" className="rounded-full px-4">
            <Link href="/curator/themes">Hủy</Link>
          </Button>

          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={!canSubmit}
            className="rounded-full bg-red-600 px-4 text-white hover:bg-red-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isSubmitting ? "Đang tạo..." : "Tạo chủ đề"}
          </Button>
        </div>
      </form>
    </div>
  );
}
