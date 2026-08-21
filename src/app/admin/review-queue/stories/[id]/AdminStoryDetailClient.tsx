"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Volume2,
} from "lucide-react";

import { PageLoading } from "@/components/app/page-loading";
import { TabTitleMarker } from "@/components/app/TabTitleMarker";
import { cn } from "@/lib/utils";
import {
  hotspotApi,
  routeApi,
  storyApi,
  type BackendStory,
  type BackendStoryMedia,
} from "@/services/api";

const statusLabelMap: Record<string, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Bị từ chối",
  REVIEW: "Chờ duyệt",
  PENDING_REVIEW: "Chờ duyệt",
};

const statusBadgeClasses: Record<string, string> = {
  DRAFT: "border border-slate-200 bg-slate-100 text-slate-700",
  PUBLISHED: "border border-emerald-200 bg-emerald-100 text-emerald-700",
  REJECTED: "border border-red-200 bg-red-50 text-red-700",
  REVIEW: "border border-amber-200 bg-amber-50 text-amber-700",
  PENDING_REVIEW: "border border-amber-200 bg-amber-50 text-amber-700",
};

function isImageMedia(media?: BackendStoryMedia) {
  if (!media?.fileUrl) return false;
  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();

  return (
    mediaType === "IMAGE" ||
    mimeType?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|avif)$/i.test(media.fileUrl)
  );
}

function isVideoMedia(media?: BackendStoryMedia) {
  if (!media?.fileUrl) return false;
  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();

  return (
    mediaType === "VIDEO" ||
    mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov)$/i.test(media.fileUrl)
  );
}

function isAudioMedia(media?: BackendStoryMedia) {
  if (!media?.fileUrl) return false;
  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();

  return (
    mediaType === "AUDIO" ||
    mimeType?.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a)$/i.test(media.fileUrl)
  );
}

function getValidHotspotId(hotspotId?: number | null) {
  if (
    typeof hotspotId !== "number" ||
    !Number.isInteger(hotspotId) ||
    hotspotId <= 0
  ) {
    return null;
  }

  return hotspotId;
}

function getValidRouteId(routeId?: number | null) {
  if (
    typeof routeId !== "number" ||
    !Number.isInteger(routeId) ||
    routeId <= 0
  ) {
    return null;
  }

  return routeId;
}

function getNumberLabel(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Chưa có";
  }

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-700">{value}</p>
    </div>
  );
}

export function AdminStoryDetailClient({ storyId }: { storyId: number }) {
  const [story, setStory] = useState<BackendStory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedHotspot, setResolvedHotspot] = useState<{
    hotspotId: number;
    hotspotName: string;
  } | null>(null);
  const [resolvedRoute, setResolvedRoute] = useState<{
    routeId: number;
    routeName: string;
  } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isLoading = useMemo(
    () => story === null && error === null,
    [story, error],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadStory() {
      try {
        const response = await storyApi.getStoryById(storyId);

        if (cancelled) {
          return;
        }

        setStory(response);
        setError(null);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setStory(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải chi tiết câu chuyện.",
        );
      }
    }

    void loadStory();

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  useEffect(() => {
    const hotspotId = getValidHotspotId(story?.hotspotId);

    if (hotspotId === null) {
      return;
    }

    const resolvedHotspotId = hotspotId;
    let cancelled = false;

    async function loadHotspotName() {
      try {
        const response = await hotspotApi.getHotspotById(resolvedHotspotId);

        if (cancelled) {
          return;
        }

        setResolvedHotspot({
          hotspotId: resolvedHotspotId,
          hotspotName: response.hotspotName?.trim() || "Địa điểm không có tên",
        });
      } catch {
        if (!cancelled) {
          setResolvedHotspot({
            hotspotId: resolvedHotspotId,
            hotspotName: "Địa điểm không còn tồn tại",
          });
        }
      }
    }

    void loadHotspotName();

    return () => {
      cancelled = true;
    };
  }, [story?.hotspotId]);

  useEffect(() => {
    const routeId = getValidRouteId(story?.routeId);

    if (routeId === null) {
      return;
    }

    const resolvedRouteId = routeId;
    let cancelled = false;

    async function loadRouteName() {
      try {
        const response = await routeApi.getRouteById(resolvedRouteId);

        if (cancelled) {
          return;
        }

        setResolvedRoute({
          routeId: resolvedRouteId,
          routeName: response.routeName?.trim() || "Tuyến đường không có tên",
        });
      } catch {
        if (!cancelled) {
          setResolvedRoute({
            routeId: resolvedRouteId,
            routeName: "Tuyến đường không còn tồn tại",
          });
        }
      }
    }

    void loadRouteName();

    return () => {
      cancelled = true;
    };
  }, [story?.routeId]);

  const medias = useMemo(
    () =>
      [...(story?.medias ?? [])].sort((mediaA, mediaB) => {
        const orderDiff =
          (mediaA.displayOrder ?? Number.MAX_SAFE_INTEGER) -
          (mediaB.displayOrder ?? Number.MAX_SAFE_INTEGER);

        if (orderDiff !== 0) {
          return orderDiff;
        }

        return mediaA.mediaId - mediaB.mediaId;
      }),
    [story?.medias],
  );

  const imageMedias = useMemo(() => medias.filter(isImageMedia), [medias]);
  const videoMedias = useMemo(() => medias.filter(isVideoMedia), [medias]);
  const audioMedias = useMemo(() => medias.filter(isAudioMedia), [medias]);

  const imageUrls = useMemo(
    () =>
      imageMedias.map((media) => media.fileUrl?.trim() ?? "").filter(Boolean),
    [imageMedias],
  );

  const safeActiveImageIndex =
    activeImageIndex < imageUrls.length ? activeImageIndex : 0;
  const currentImageUrl = imageUrls[safeActiveImageIndex] ?? imageUrls[0] ?? "";
  const currentHotspotId = getValidHotspotId(story?.hotspotId);
  const currentRouteId = getValidRouteId(story?.routeId);
  const hotspotLabel =
    currentHotspotId === null
      ? "Chưa gắn địa điểm"
      : resolvedHotspot?.hotspotId === currentHotspotId
        ? resolvedHotspot.hotspotName
        : "Đang tải tên địa điểm...";
  const routeLabel =
    currentRouteId === null
      ? "Chưa gắn tuyến"
      : resolvedRoute?.routeId === currentRouteId
        ? resolvedRoute.routeName
        : "Đang tải tên tuyến...";

  const nextImage = () =>
    setActiveImageIndex((index) =>
      imageUrls.length > 0
        ? ((index >= imageUrls.length ? 0 : index) + 1) % imageUrls.length
        : 0,
    );

  const prevImage = () =>
    setActiveImageIndex((index) =>
      imageUrls.length > 0
        ? ((index >= imageUrls.length ? 0 : index) - 1 + imageUrls.length) %
          imageUrls.length
        : 0,
    );

  return (
    <div className="space-y-5 pb-5 pt-2">
      <TabTitleMarker title={story?.title || "Chi tiết câu chuyện"} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/review-queue"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-2.5 w-2.5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-[1.45rem]">
                Chi tiết câu chuyện
              </h1>
              <p className="mt-0.5 text-[13px] leading-5 text-slate-500 sm:text-sm">
                Thông tin chi tiết của câu chuyện trong khu vực kiểm duyệt quản trị.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <PageLoading className="min-h-[320px]" />
      ) : error || !story ? (
        <section className="cq-admin-panel px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Không tải được chi tiết câu chuyện
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {error || "Dữ liệu câu chuyện hiện không khả dụng."}
          </p>
        </section>
      ) : (
        <section className="cq-admin-panel overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Câu chuyện kiểm duyệt
                </p>
                <h1 className="mt-1 text-base font-semibold text-slate-900">
                  {story.title || "Câu chuyện chưa có tiêu đề"}
                </h1>
              </div>

              <div className="flex shrink-0 justify-start sm:justify-end">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                    statusBadgeClasses[story.status] ??
                      "border border-slate-200 bg-slate-100 text-slate-700",
                  )}
                >
                  {statusLabelMap[story.status] ?? story.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
            <DetailCard
              label="Thẻ"
              value={story.tag?.tagName?.trim() || "Chưa gắn thẻ"}
            />
            <DetailCard
              label="Địa điểm"
              value={hotspotLabel}
            />
            <DetailCard label="Tuyến đường" value={routeLabel} />
            <DetailCard
              label="Khoảng cách tới điểm kế"
              value={getNumberLabel(story.distanceToNext)}
            />
            <DetailCard
              label="Đánh giá trung bình"
              value={getNumberLabel(story.averageRating)}
            />
            <DetailCard
              label="Tổng lượt đánh giá"
              value={String(story.totalReviews ?? "0")}
            />
          </div>

          <div className="border-t border-slate-100 px-5 py-5">
            <h2 className="text-sm font-semibold text-slate-900">Nội dung</h2>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">
              {story.content?.trim() || "Câu chuyện không có nội dung."}
            </p>
          </div>

          <div className="border-t border-slate-100 px-5 py-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Đánh giá văn hóa
            </h2>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              {story.cultureReason?.trim() ||
                "Backend chưa trả về lý do đánh giá văn hóa cho câu chuyện này."}
            </p>
          </div>

          <div className="grid gap-4 border-t border-slate-100 px-5 py-5 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Ảnh câu chuyện
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {imageMedias.length} ảnh
                  </p>
                </div>
                <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  {imageUrls.length > 1
                    ? `Ảnh ${safeActiveImageIndex + 1} / ${imageUrls.length}`
                    : imageUrls.length === 1
                      ? "1 ảnh"
                      : "Không có ảnh"}
                </div>
              </div>

              <div className="mt-3 overflow-hidden rounded-[1rem] bg-white shadow-sm">
                <div className="relative h-[200px] w-full overflow-hidden bg-slate-100 sm:h-[230px]">
                  {currentImageUrl ? (
                    <>
                      <Image
                        src={currentImageUrl}
                        alt={`Ảnh ${safeActiveImageIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 640px"
                      />
                      {imageUrls.length > 1 ? (
                        <>
                          <button
                            type="button"
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/55"
                            aria-label="Ảnh trước"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/55"
                            aria-label="Ảnh sau"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-[11px] text-slate-400">
                      <div>
                        <ImageIcon className="mx-auto mb-2 h-5 w-5" />
                        Không có ảnh đính kèm.
                      </div>
                    </div>
                  )}
                </div>

                {imageUrls.length > 1 ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-3">
                    {imageUrls.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={cn(
                          "h-1.5 w-5 rounded-full transition",
                          index === safeActiveImageIndex
                            ? "bg-slate-700"
                            : "bg-slate-300",
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Video câu chuyện
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  {videoMedias.length} video
                </p>

                <div className="mt-3 space-y-3">
                  {videoMedias.length > 0 ? (
                    videoMedias.map((media, index) => (
                      <div key={media.mediaId} className="space-y-2">
                        <p className="text-[11px] font-medium text-slate-700">
                          {media.fileName ?? `Video ${index + 1}`}
                        </p>
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          className="h-[180px] w-full rounded-[1rem] bg-black object-contain"
                        >
                          <source
                            src={media.fileUrl}
                            type={media.mimeType ?? "video/mp4"}
                          />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1rem] bg-white px-4 py-6 text-center text-[11px] text-slate-500 shadow-sm">
                      Không có video đính kèm.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Audio câu chuyện
                  </h3>
                </div>

                <div className="mt-3 space-y-3">
                  {audioMedias.length > 0 ? (
                    audioMedias.map((media) => (
                      <div key={media.mediaId}>
                        <p className="text-[11px] font-medium text-slate-700">
                          {media.fileName ?? "Audio đính kèm"}
                        </p>
                        <audio
                          controls
                          className="mt-2 w-full"
                          src={media.fileUrl}
                        >
                          Trình duyệt của bạn không hỗ trợ audio.
                        </audio>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] leading-5 text-slate-500">
                      Không có audio đính kèm.
                    </p>
                  )}

                  {story.audioScript?.trim() ? (
                    <div className="rounded-[1rem] border border-slate-200 bg-white px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Kịch bản audio
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                        {story.audioScript.trim()}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
