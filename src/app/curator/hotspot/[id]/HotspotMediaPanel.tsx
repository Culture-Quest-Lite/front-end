"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

type MediaView = "image" | "video";

export function HotspotMediaPanel({
  title,
  imageUrl,
  imageUrls,
  videoUrl,
}: {
  title: string;
  imageUrl: string;
  imageUrls?: string[];
  videoUrl?: string;
}) {
  const [activeView, setActiveView] = useState<MediaView>(
    videoUrl ? "video" : "image",
  );
  const images =
    (imageUrls && imageUrls.filter(Boolean)) || (imageUrl ? [imageUrl] : []);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const prev = () =>
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIndex((i) => (i + 1) % images.length);
  const mediaViewportClassName =
    "relative h-[280px] w-full overflow-hidden bg-slate-100 sm:h-[360px] lg:h-[430px]";

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
        <MediaToggleButton
          isActive={activeView === "image"}
          onClick={() => setActiveView("image")}
          icon={ImageIcon}
          label="Ảnh địa điểm"
        />
        <MediaToggleButton
          isActive={activeView === "video"}
          onClick={() => setActiveView("video")}
          icon={Video}
          label="Video địa điểm"
        />
      </div>

      <div className="overflow-hidden rounded-[1.15rem] border border-slate-200 bg-slate-950 relative">
        {activeView === "image" ? (
          <div className={mediaViewportClassName}>
            {images.length > 0 ? (
              <img
                src={images[activeIndex]}
                alt={`${title} ${activeIndex + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-slate-100" />
            )}

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-white/95 hover:opacity-90"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-white/95 hover:opacity-90"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute left-1/2 bottom-3 -translate-x-1/2 flex items-center gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`h-1.5 w-6 rounded-full ${idx === activeIndex ? "bg-white" : "bg-white/40"}`}
                      aria-label={`Select image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : videoUrl ? (
          <div className={mediaViewportClassName}>
            <video
              controls
              playsInline
              preload="metadata"
              poster={imageUrl}
              className="h-full w-full bg-black object-contain"
            >
              <source src={videoUrl} type="video/mp4" />
              Trình duyệt của bạn chưa hỗ trợ phát video.
            </video>
          </div>
        ) : (
          <div className={mediaViewportClassName}>
            <img
              src={imageUrl}
              alt={`${title} preview`}
              className="h-full w-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/15" />
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
              <div className="max-w-sm">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/12 backdrop-blur">
                  <Video className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[13px] font-normal">
                  Địa điểm này chưa có video giới thiệu
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MediaToggleButton({
  isActive,
  onClick,
  icon: Icon,
  label,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: typeof ImageIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition",
        isActive
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
