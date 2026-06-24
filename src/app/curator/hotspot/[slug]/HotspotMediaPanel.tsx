"use client";

import { useState } from "react";
import { Image as ImageIcon, Video } from "lucide-react";

import { cn } from "@/lib/utils";

type MediaView = "image" | "video";

export function HotspotMediaPanel({
  title,
  imageUrl,
  videoUrl,
}: {
  title: string;
  imageUrl: string;
  videoUrl?: string;
}) {
  const [activeView, setActiveView] = useState<MediaView>(
    videoUrl ? "video" : "image",
  );

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
        <MediaToggleButton
          isActive={activeView === "image"}
          onClick={() => setActiveView("image")}
          icon={ImageIcon}
          label="Ảnh hotspot"
        />
        <MediaToggleButton
          isActive={activeView === "video"}
          onClick={() => setActiveView("video")}
          icon={Video}
          label="Video hotspot"
        />
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950">
        {activeView === "image" ? (
          <div className="bg-slate-100">
            <img
              src={imageUrl}
              alt={title}
              className="h-[320px] w-full object-cover lg:h-[520px]"
            />
          </div>
        ) : videoUrl ? (
          <video
            controls
            playsInline
            preload="metadata"
            poster={imageUrl}
            className="h-[320px] w-full bg-black object-cover lg:h-[520px]"
          >
            <source src={videoUrl} type="video/mp4" />
            Trình duyệt của bạn chưa hỗ trợ phát video.
          </video>
        ) : (
          <div className="relative h-[320px] lg:h-[520px]">
            <img
              src={imageUrl}
              alt={`${title} preview`}
              className="h-full w-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/15" />
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
              <div className="max-w-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/12 backdrop-blur">
                  <Video className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-normal">
                  Hotspot này chưa có video giới thiệu
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
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
        isActive
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
