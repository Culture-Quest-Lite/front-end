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
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
        Chưa chọn
      </span>
    );
  }

  const color = getTagColor(tagId ?? 0);
  const { chipBg, chipBorder } = getTagColorState(color);

  return (
    <span
      className="rounded-full border px-3 py-1 text-sm font-semibold"
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

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/curator/stories"
            className="inline-flex items-center gap-2 text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </div>
        <div className="space-y-2">
          <h1 className="cq-page-title">Chi tiết story</h1>
          <p className="cq-page-subtitle max-w-2xl">
            Xem nội dung, trạng thái và media đính kèm của story.
          </p>
        </div>
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
        <div className="flex flex-col gap-6">
          <section className="space-y-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
              <div className="space-y-4">
                <h2 className="text-3xl font-normal tracking-tight text-slate-900 sm:text-4xl">
                  {story.title}
                </h2>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                      statusBadgeClasses[story.status] ??
                        "bg-slate-100 text-slate-700",
                    )}
                  >
                    {statusLabelMap[story.status] ?? story.status}
                  </span>
                  <TagChip
                    tagName={story.tag?.tagName}
                    tagId={story.tag?.tagId}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 w-full">
              <p className="cq-label text-slate-500">Hotspot</p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {hotspotName ?? `#${story.hotspotId}`}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="cq-label mb-3">Nội dung</p>
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {typeof story.content === "string" && story.content.trim()
                  ? story.content
                  : "Story không có nội dung."}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="cq-label">Ảnh story</p>
                    <p className="text-sm text-slate-500">
                      {imageMedias.length} ảnh
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {imageUrls.length > 1
                      ? `Ảnh ${activeImageIndex + 1} / ${imageUrls.length}`
                      : imageUrls.length === 1
                        ? "1 ảnh"
                        : "Không có ảnh"}
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-0 text-slate-900">
                  <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-50">
                    {imageUrls.length > 0 ? (
                      <>
                        <div className="relative h-80 sm:h-96 w-full">
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
                              className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/50"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={nextImage}
                              aria-label="Ảnh sau"
                              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/50"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex min-h-65 items-center justify-center bg-slate-950/80 p-8 text-center text-sm text-slate-300">
                        <div>
                          <ImageIcon className="mx-auto mb-3 h-8 w-8" />
                          Không có ảnh đính kèm.
                        </div>
                      </div>
                    )}
                  </div>

                  {imageUrls.length > 1 ? (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {imageUrls.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={cn(
                            "h-2.5 w-8 rounded-full transition",
                            index === activeImageIndex
                              ? "bg-white"
                              : "bg-white/30",
                          )}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="cq-label">Video story</p>
                    <p className="text-sm text-slate-500">
                      {videoMedias.length} video
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {videoMedias.length > 0 ? (
                    videoMedias.map((media, index) => (
                      <div key={media.mediaId} className="space-y-2">
                        {index === 0 ? null : (
                          <p className="text-sm font-semibold text-slate-700">
                            {media.fileName ?? `Video ${index + 1}`}
                          </p>
                        )}
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full rounded-[1.25rem] bg-black"
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
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Không có video đính kèm.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {audioMedias.length > 0 ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-slate-600" />
                  <p className="cq-label">Audio story</p>
                </div>
                <div className="mt-4 space-y-4">
                  {audioMedias.map((media) => (
                    <div
                      key={media.mediaId}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {media.fileName ?? "Audio đính kèm"}
                      </p>
                      <audio
                        controls
                        className="mt-3 w-full"
                        src={media.fileUrl}
                      >
                        Trình duyệt của bạn không hỗ trợ audio.
                      </audio>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">
                  Không có audio đính kèm.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
