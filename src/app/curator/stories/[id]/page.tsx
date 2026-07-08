"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Pencil,
  Volume2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getTagColor, getTagColorState } from "@/lib/tags";
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
};

const statusBadgeClasses: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  REVIEW: "bg-amber-100 text-amber-700",
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

function TagChip({ tagName, tagId }: { tagName?: string; tagId?: number }) {
  if (!tagName) {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
        Chưa chọn
      </span>
    );
  }

  const color = getTagColor(tagId ?? 0);
  const { chipBg, chipBorder } = getTagColorState(color);

  return (
    <span
      className="rounded-full border px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: chipBg,
        borderColor: chipBorder,
        color,
      }}
    >
      {tagName}
    </span>
  );
}

export default function StoryDetailPage() {
  const params = useParams();
  const storyId = useMemo(() => {
    const parsedId = Number(params?.id ?? "");
    return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  }, [params?.id]);

  const hasInvalidId = storyId === null;
  const [story, setStory] = useState<BackendStory | null>(null);
  const [hotspotName, setHotspotName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    hasInvalidId ? "ID story không hợp lệ." : null,
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isLoading = useMemo(
    () => !hasInvalidId && story === null && error === null,
    [hasInvalidId, story, error],
  );

  useEffect(() => {
    if (hasInvalidId) {
      return;
    }

    void storyApi
      .getStoryById(storyId as number)
      .then((response) => {
        setStory(response);
        setHotspotName(null);
      })
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Không thể tải story.",
        );
      });
  }, [hasInvalidId, storyId]);

  useEffect(() => {
    if (!story) {
      return;
    }

    void hotspotApi
      .getHotspotById(story.hotspotId)
      .then((hotspot) => {
        setHotspotName(hotspot.hotspotName ?? `#${story.hotspotId}`);
      })
      .catch(() => {
        setHotspotName(`#${story.hotspotId}`);
      });
  }, [story]);

  const medias = useMemo(() => story?.medias ?? [], [story?.medias]);
  const imageMedias = useMemo(() => medias.filter(isImageMedia), [medias]);
  const videoMedias = useMemo(() => medias.filter(isVideoMedia), [medias]);
  const audioMedias = useMemo(() => medias.filter(isAudioMedia), [medias]);

  const imageUrls = useMemo(
    () =>
      imageMedias
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((media) => media.fileUrl?.trim() ?? "")
        .filter(Boolean),
    [imageMedias],
  );

  const currentImageUrl = imageUrls[activeImageIndex] ?? imageUrls[0] ?? "";

  const nextImage = () =>
    setActiveImageIndex((index) =>
      imageUrls.length > 0 ? (index + 1) % imageUrls.length : 0,
    );
  const prevImage = () =>
    setActiveImageIndex((index) =>
      imageUrls.length > 0
        ? (index - 1 + imageUrls.length) % imageUrls.length
        : 0,
    );
  const mediaViewportClassName =
    "relative h-[320px] w-full overflow-hidden rounded-[1.5rem] bg-slate-100 sm:h-[360px] lg:h-[420px]";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="flex items-center gap-3">
            <Link
              href="/curator/stories"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-2.5 w-2.5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
                Chi tiết story
              </h1>
              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
                Xem nội dung, trạng thái và media đính kèm của story.
              </p>
            </div>
          </div>
        </div>

        {storyId ? (
          <Link
            href={`/curator/stories/${storyId}/edit`}
            className="inline-flex items-center gap-2 self-start rounded-full bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 sm:text-sm"
          >
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">
          Đang tải story...
        </div>
      ) : error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-8 text-center text-sm text-rose-700">
          {error}
        </div>
      ) : !story ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">
          Story không có dữ liệu.
        </div>
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Tổng quan story
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-2xl">
                {story.title}
              </h2>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                  statusBadgeClasses[story.status] ?? "bg-slate-100 text-slate-700",
                )}
              >
                {statusLabelMap[story.status] ?? story.status}
              </span>
              <TagChip tagName={story.tag?.tagName} tagId={story.tag?.tagId} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-dashed border-slate-200 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="cq-label">Hotspot</p>
              <p className="text-sm font-normal text-slate-900">
                {hotspotName ?? `#${story.hotspotId}`}
              </p>
            </div>
            <div className="space-y-1">
              <p className="cq-label">Ảnh story</p>
              <p className="text-sm font-normal text-slate-900">
                {imageMedias.length} ảnh
              </p>
            </div>
            <div className="space-y-1">
              <p className="cq-label">Video story</p>
              <p className="text-sm font-normal text-slate-900">
                {videoMedias.length} video
              </p>
            </div>
            <div className="space-y-1">
              <p className="cq-label">Audio story</p>
              <p className="text-sm font-normal text-slate-900">
                {audioMedias.length} audio
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-dashed border-slate-200 pt-6">
            <div className="rounded-[1.5rem] bg-slate-50/80 px-4 py-4 sm:px-5">
              <p className="cq-label">Nội dung</p>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {typeof story.content === "string" && story.content.trim()
                  ? story.content
                  : "Story không có nội dung."}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-dashed border-slate-200 pt-6">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
              <div className="rounded-[1.5rem] bg-slate-50/80 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="cq-label">Ảnh story</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {imageMedias.length} ảnh
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {imageUrls.length > 1
                      ? `Ảnh ${activeImageIndex + 1} / ${imageUrls.length}`
                      : imageUrls.length === 1
                        ? "1 ảnh"
                        : "Không có ảnh"}
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white text-slate-900 shadow-sm">
                  <div className={mediaViewportClassName}>
                    {imageUrls.length > 0 ? (
                      <>
                        <div className="relative h-full w-full">
                          <Image
                            src={currentImageUrl}
                            alt={`Ảnh ${activeImageIndex + 1}`}
                            fill
                            className="rounded-[1.5rem] object-cover"
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
                          <ImageIcon className="mx-auto mb-3 h-7 w-7" />
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
                            "h-2 w-7 rounded-full transition",
                            index === activeImageIndex ? "bg-slate-700" : "bg-slate-300",
                          )}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-slate-50/80 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="cq-label">Video story</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {videoMedias.length} video
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {videoMedias.length > 0 ? (
                    videoMedias.map((media, index) => (
                      <div key={media.mediaId} className="space-y-2">
                        {index === 0 ? null : (
                          <p className="text-xs font-medium text-slate-700">
                            {media.fileName ?? `Video ${index + 1}`}
                          </p>
                        )}
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          className="h-[320px] w-full rounded-[1.5rem] bg-black object-contain sm:h-[360px] lg:h-[420px]"
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
                    <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] bg-white px-4 py-5 text-center text-xs text-slate-500 shadow-sm sm:h-[360px] lg:h-[420px]">
                      Không có video đính kèm.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-dashed border-slate-200 pt-6">
            <div className="rounded-[1.5rem] bg-slate-50/80 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-slate-600" />
              <p className="cq-label">Audio story</p>
            </div>
            {audioMedias.length > 0 ? (
              <div className="mt-3 space-y-4">
                {audioMedias.map((media) => (
                  <div key={media.mediaId}>
                    <p className="text-xs font-medium text-slate-700">
                      {media.fileName ?? "Audio đính kèm"}
                    </p>
                    <audio controls className="mt-2 w-full" src={media.fileUrl}>
                      Trình duyệt của bạn không hỗ trợ audio.
                    </audio>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Không có audio đính kèm.
              </p>
            )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
