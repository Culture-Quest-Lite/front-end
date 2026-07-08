"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, MoreHorizontal, Tag } from "lucide-react";

import { CuratorPagination } from "@/components/curator/CuratorPagination";
import {
  buildTagChipLabel,
  formatTagDateTime,
  formatTagStatus,
  getTagStatusTone,
  getTagColor,
  getTagColorState,
  type TagRecord,
} from "@/lib/tags";
import { hotspotApi, tagApi, type BackendHotspot } from "@/services/api";

const pendingTagDetailRequests = new Map<number, Promise<TagRecord>>();
let pendingHotspotsRequest: Promise<BackendHotspot[]> | null = null;
const HOTSPOTS_PER_PAGE = 4;

function loadTagDetailOnce(tagId: number) {
  const existingRequest = pendingTagDetailRequests.get(tagId);

  if (existingRequest) {
    return existingRequest;
  }

  const request = tagApi.getTagById(tagId).finally(() => {
    pendingTagDetailRequests.delete(tagId);
  });

  pendingTagDetailRequests.set(tagId, request);
  return request;
}

function loadHotspotsOnce() {
  if (pendingHotspotsRequest) {
    return pendingHotspotsRequest;
  }

  pendingHotspotsRequest = hotspotApi.getHotspots().finally(() => {
    pendingHotspotsRequest = null;
  });

  return pendingHotspotsRequest;
}

function formatHotspotYear(
  value: string | null | undefined,
  fallback?: string | null | undefined,
) {
  const resolvedValue = value || fallback;

  if (!resolvedValue) {
    return "Chưa có năm";
  }

  const date = new Date(resolvedValue);
  if (Number.isNaN(date.getTime())) {
    return "Chưa có năm";
  }

  return String(date.getFullYear());
}

function getHotspotPreviewImageUrl(hotspot: BackendHotspot) {
  return hotspot.medias
    ?.find((media) => media.fileUrl?.trim())
    ?.fileUrl?.trim();
}

function getReadableAccentTextColor(color: string) {
  const normalized = color.trim();

  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
    return "#334155";
  }

  const [, red, green, blue] = normalized.match(/^#(..)(..)(..)$/) ?? [];

  if (!red || !green || !blue) {
    return "#334155";
  }

  const darkenChannel = (channel: string) =>
    Math.max(0, Math.round(parseInt(channel, 16) * 0.58));

  const toHex = (value: number) => value.toString(16).padStart(2, "0");

  return `#${toHex(darkenChannel(red))}${toHex(darkenChannel(green))}${toHex(darkenChannel(blue))}`;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <span className="cq-label">{label}</span>
        <div className="cq-card-title text-right">{value}</div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-center gap-3 text-slate-700">
      <Link
        href="/curator/tags"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div>
        <h1 className="cq-page-title">Chi tiết thẻ</h1>
        <p className="cq-page-subtitle">
          Thông tin thẻ và các địa điểm đang sử dụng.
        </p>
      </div>
    </div>
  );
}

export function TagDetailClient({ tagId }: { tagId: number }) {
  const [backendTag, setBackendTag] = useState<TagRecord | null>(null);
  const [allBackendHotspots, setAllBackendHotspots] = useState<
    BackendHotspot[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentHotspotPage, setCurrentHotspotPage] = useState(1);
  const [openHotspotMenuId, setOpenHotspotMenuId] = useState<number | null>(
    null,
  );

  const hotspotsUsingTag = backendTag
    ? allBackendHotspots.filter((hotspot) =>
        hotspot.tags?.some((tag) => tag.tagId === backendTag.tagId),
      )
    : [];
  const hotspotTotalPages = Math.max(
    1,
    Math.ceil(hotspotsUsingTag.length / HOTSPOTS_PER_PAGE),
  );
  const safeCurrentHotspotPage = Math.min(
    currentHotspotPage,
    hotspotTotalPages,
  );
  const paginatedHotspots = hotspotsUsingTag.slice(
    (safeCurrentHotspotPage - 1) * HOTSPOTS_PER_PAGE,
    safeCurrentHotspotPage * HOTSPOTS_PER_PAGE,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTagDetail() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [tag, hotspots] = await Promise.all([
          loadTagDetailOnce(tagId),
          loadHotspotsOnce().catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        setCurrentHotspotPage(1);
        setOpenHotspotMenuId(null);
        setBackendTag(tag);
        setAllBackendHotspots(hotspots);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBackendTag(null);
        setAllBackendHotspots([]);
        setLoadError(
          error instanceof Error ? error.message : "Không thể tải dữ liệu thẻ.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTagDetail();

    return () => {
      cancelled = true;
    };
  }, [tagId]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (!event.target.closest("[data-hotspot-actions]")) {
        setOpenHotspotMenuId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenHotspotMenuId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm sm:px-6">
          <p className="cq-card-title sm:text-base">Đang tải chi tiết thẻ</p>
          <p className="cq-page-subtitle mt-2">Đang lấy dữ liệu</p>
        </section>
      </div>
    );
  }

  if (!backendTag) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm sm:px-6">
          <p className="cq-card-title sm:text-base">
            Không tải được chi tiết thẻ
          </p>
          <p className="cq-page-subtitle mt-2">
            Kiểm tra lại phản hồi từ máy chủ hoặc thử tải lại trang.
          </p>
          {loadError ? (
            <p className="mt-3 text-sm font-medium text-[#CF3F34]">
              {loadError}
            </p>
          ) : null}
          <div className="mt-5">
            <Link
              href="/curator/tags"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Quay lại danh sách thẻ
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const tagColor = getTagColor(backendTag.tagId - 1);
  const colorState = getTagColorState(tagColor);
  const createdAtLabel = formatTagDateTime(backendTag.createdAt);
  const updatedAtLabel = formatTagDateTime(backendTag.updatedAt);
  const hotspotNameColor = getReadableAccentTextColor(tagColor);

  return (
    <div className="space-y-6">
      <PageHeader />

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="cq-kicker">Tổng quan thẻ</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                style={{
                  color: tagColor,
                  backgroundColor: colorState.chipBg,
                  borderColor: colorState.chipBorder,
                }}
              >
                <Tag className="h-4 w-4" />
                <span>{buildTagChipLabel(backendTag.tagName)}</span>
              </div>
              <h2
                className="cq-page-title"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {backendTag.tagName}
              </h2>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailRow
            label="Trạng thái"
            value={
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getTagStatusTone(backendTag.tagStatus)}`}
              >
                {formatTagStatus(backendTag.tagStatus)}
              </span>
            }
          />
          <DetailRow label="Số địa điểm" value={backendTag.hotspotCount} />
          <DetailRow label="Cập nhật thẻ" value={updatedAtLabel} />
          <DetailRow label="Ngày tạo" value={createdAtLabel} />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="cq-section-title">Địa điểm đang sử dụng thẻ</h2>
            <p className="cq-page-subtitle">
              Cung cấp danh sách các địa điểm liên kết với thẻ, bao gồm ảnh đại
              diện, năm và các tùy chọn thao tác.
            </p>
          </div>

          <span className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600">
            {hotspotsUsingTag.length} địa điểm
          </span>
        </div>

        {hotspotsUsingTag.length > 0 ? (
          <div className="mt-5 space-y-2.5">
            {paginatedHotspots.map((hotspot) => {
              const hotspotYear = formatHotspotYear(
                hotspot.createdAt,
                hotspot.updatedAt,
              );
              const imageUrl = getHotspotPreviewImageUrl(hotspot);

              return (
                <div
                  key={hotspot.hotspotId}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-3.5 py-3 shadow-sm transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-100">
                    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-500">
                      <MapPin className="h-4 w-4" />
                    </div>
                    {imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={
                            hotspot.hotspotName ??
                            `Hotspot ${hotspot.hotspotId}`
                          }
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      </>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-semibold sm:text-[0.95rem]"
                      style={{ color: hotspotNameColor }}
                    >
                      {hotspot.hotspotName ?? `Hotspot #${hotspot.hotspotId}`}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                        {hotspotYear}
                      </span>
                    </div>
                  </div>

                  <div
                    className="relative flex justify-end"
                    data-hotspot-actions
                  >
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openHotspotMenuId === hotspot.hotspotId}
                      onClick={() =>
                        setOpenHotspotMenuId(
                          openHotspotMenuId === hotspot.hotspotId
                            ? null
                            : hotspot.hotspotId,
                        )
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label={`Tác vụ cho ${hotspot.hotspotName ?? `hotspot ${hotspot.hotspotId}`}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {openHotspotMenuId === hotspot.hotspotId ? (
                      <div
                        role="menu"
                        className="absolute right-0 top-[calc(100%+0.4rem)] z-30 w-40 rounded-[1.25rem] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
                      >
                        <Link
                          href={`/curator/hotspot/${hotspot.hotspotId}`}
                          role="menuitem"
                          onClick={() => setOpenHotspotMenuId(null)}
                          className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {hotspotsUsingTag.length > 0 ? (
              <div className="mt-auto flex justify-end pt-4">
                <CuratorPagination
                  currentPage={safeCurrentHotspotPage}
                  totalPages={hotspotTotalPages}
                  onPageChange={(page) => {
                    setOpenHotspotMenuId(null);
                    setCurrentHotspotPage(page);
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="cq-card-title sm:text-base">
              Chưa có địa điểm nào dùng thẻ này
            </p>
            <p className="cq-page-subtitle mt-2">
              Khi có địa điểm được gắn thẻ, chúng sẽ hiển thị ở đây.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
