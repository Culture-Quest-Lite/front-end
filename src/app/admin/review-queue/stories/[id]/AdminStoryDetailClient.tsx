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

function TagChip({ tagName }: { tagName?: string }) {
  if (!tagName) {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
        Chưa chọn
      </span>
    );
  }

  return (
    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {tagName}
    </span>
  );
}

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="cq-label">{label}</p>
      <p className="text-[13px] font-normal text-slate-900">{value}</p>
    </div>
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

export function AdminStoryDetailClient({ storyId }: { storyId: number }) {
  const [story, setStory] = useState<BackendStory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedHotspot, setResolvedHotspot] = useState<{
    hotspotId: number;
    hotspotName: string;
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
  const normalizedAudioScript = story?.audioScript?.trim() ?? "";
  const currentHotspotId = getValidHotspotId(story?.hotspotId);
  const hotspotLabel =
    currentHotspotId === null
      ? "Chưa liên kết hotspot"
      : resolvedHotspot?.hotspotId === currentHotspotId
        ? resolvedHotspot.hotspotName
        : "Đang tải tên địa điểm...";

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

  const mediaViewportClassName =
    "relative h-[220px] w-full overflow-hidden rounded-[1.15rem] bg-slate-100 sm:h-[260px] lg:h-[320px]";

  return (
    <div className="space-y-5">
      <TabTitleMarker
        title={error ? "Không tìm thấy câu chuyện" : story?.title}
      />

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
              <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
                Chi tiết câu chuyện
              </h1>
              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
                Xem chi tiết câu chuyện đang nằm trong hàng chờ kiểm duyệt quản
                trị.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <PageLoading
          className="min-h-[320px] rounded-[1.25rem] border border-slate-200 shadow-none"
          spinnerClassName="h-6 w-6"
        />
      ) : error ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-5 py-7 text-center text-[13px] text-rose-700">
          <p>{error}</p>
          <div className="mt-4">
            <Link
              href="/admin/review-queue"
              className="inline-flex h-10 items-center justify-center rounded-full border border-rose-200 bg-white px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
            >
              Quay lại hàng chờ duyệt
            </Link>
          </div>
        </div>
      ) : !story ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-7 text-center text-[13px] text-slate-600">
          <p>Câu chuyện không có dữ liệu.</p>
          <div className="mt-4">
            <Link
              href="/admin/review-queue"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Quay lại hàng chờ duyệt
            </Link>
          </div>
        </div>
      ) : (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="cq-kicker text-yellow-900">Câu chuyện kiểm duyệt</p>
              <h2 className="cq-page-title mt-2 text-slate-900">
                {story.title || "Câu chuyện chưa có tiêu đề"}
              </h2>
              <p className="mt-1.5 text-[13px] text-slate-600">
                Địa điểm:{" "}
                <span className="font-medium text-slate-900">
                  {hotspotLabel}
                </span>
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                  statusBadgeClasses[story.status] ??
                    "border border-slate-200 bg-slate-100 text-slate-700",
                )}
              >
                {statusLabelMap[story.status] ?? story.status}
              </span>
              <TagChip tagName={story.tag?.tagName} />
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
            <div className="grid max-w-5xl gap-x-5 gap-y-4 px-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">
              <MetaItem
                label="Ảnh câu chuyện"
                value={`${imageMedias.length} ảnh`}
              />
              <MetaItem
                label="Video câu chuyện"
                value={`${videoMedias.length} video`}
              />
              <MetaItem
                label="Audio câu chuyện"
                value={`${audioMedias.length} audio`}
              />
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
            <div className="rounded-[1.15rem] bg-slate-50/80 px-3.5 py-3 sm:px-4">
              <p className="cq-label">Nội dung</p>
              <div className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                {typeof story.content === "string" && story.content.trim()
                  ? story.content
                  : "Câu chuyện không có nội dung."}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
            <div className="rounded-[1.15rem] bg-slate-50/80 px-3.5 py-3 sm:px-4">
              <p className="cq-label">Đánh giá văn hóa</p>
              <div className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                {story.cultureReason?.trim() ||
                  "Backend chưa trả về lý do đánh giá văn hóa cho câu chuyện này."}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
              <div className="rounded-[1.15rem] bg-slate-50/80 p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="cq-label">Ảnh câu chuyện</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {imageMedias.length} ảnh
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">
                    {imageUrls.length > 1
                      ? `Ảnh ${safeActiveImageIndex + 1} / ${imageUrls.length}`
                      : imageUrls.length === 1
                        ? "1 ảnh"
                        : "Không có ảnh"}
                  </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-[1.15rem] bg-white text-slate-900 shadow-sm">
                  <div className={mediaViewportClassName}>
                    {imageUrls.length > 0 ? (
                      <>
                        <div className="relative h-full w-full">
                          <Image
                            src={currentImageUrl}
                            alt={`Ảnh ${safeActiveImageIndex + 1}`}
                            fill
                            className="rounded-[1.15rem] object-cover"
                            sizes="(max-width: 640px) 100vw, 640px"
                          />
                        </div>
                        {imageUrls.length > 1 ? (
                          <>
                            <button
                              type="button"
                              onClick={prevImage}
                              aria-label="Ảnh trước"
                              className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/50"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={nextImage}
                              aria-label="Ảnh sau"
                              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/50"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-950/80 p-8 text-center text-xs text-slate-300">
                        <div>
                          <ImageIcon className="mx-auto mb-2.5 h-6 w-6" />
                          Không có ảnh đính kèm.
                        </div>
                      </div>
                    )}
                  </div>

                  {imageUrls.length > 1 ? (
                    <div className="mt-3 flex items-center justify-center gap-2 pb-1">
                      {imageUrls.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={cn(
                            "h-1.5 w-6 rounded-full transition",
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

              <div className="rounded-[1.15rem] bg-slate-50/80 p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="cq-label">Video câu chuyện</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {videoMedias.length} video
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {videoMedias.length > 0 ? (
                    videoMedias.map((media, index) => (
                      <div key={media.mediaId} className="space-y-2">
                        {index === 0 ? null : (
                          <p className="text-[11px] font-medium text-slate-700">
                            {media.fileName ?? `Video ${index + 1}`}
                          </p>
                        )}
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          className="h-[220px] w-full rounded-[1.15rem] bg-black object-contain sm:h-[260px] lg:h-[320px]"
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
                    <div className="flex h-[220px] items-center justify-center rounded-[1.15rem] bg-white px-4 py-5 text-center text-[11px] text-slate-500 shadow-sm sm:h-[260px] lg:h-[320px]">
                      Không có video đính kèm.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
            <div className="rounded-[1.15rem] bg-slate-50/80 p-3.5 sm:p-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-slate-600" />
                <p className="cq-label">Audio câu chuyện</p>
              </div>
              {audioMedias.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {audioMedias.map((media) => (
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
                  ))}
                  {normalizedAudioScript ? (
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Kịch bản câu chuyện
                      </p>
                      <div className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                        {normalizedAudioScript}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-[13px] text-slate-500">
                    Không có audio đính kèm.
                  </p>
                  {normalizedAudioScript ? (
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Audio script
                      </p>
                      <div className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                        {normalizedAudioScript}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
