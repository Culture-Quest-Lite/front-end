"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ChevronDown,
  ImagePlus,
  Save,
  Send,
  Video,
  Volume2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MediaType = "image" | "audio" | "video";
type MediaCollection = Record<MediaType, MediaItem[]>;

type MediaItem = {
  id: string;
  name: string;
  sizeLabel: string;
  type: MediaType;
};

type MediaTypeOption = {
  type: MediaType;
  label: string;
  icon: LucideIcon;
  accept: string;
};

const hotspotOptions = [
  "Chùa Cầu Hội An",
  "Cố đô Hoa Lư",
  "Hoàng thành Thăng Long",
  "Phố cổ Hà Nội",
];

const unlockOptions = [
  "Khi check-in tại hotspot",
  "Khi quét QR tại hotspot",
  "Khi hoàn thành tuyến liên quan",
];

const MAX_MEDIA_TOTAL = 5;

const mediaTypeOptions: MediaTypeOption[] = [
  { type: "audio", label: "Audio", icon: Volume2, accept: "audio/*" },
  { type: "video", label: "Video", icon: Video, accept: "video/*" },
  { type: "image", label: "Hình ảnh", icon: ImagePlus, accept: "image/*" },
];

function countWords(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  return trimmedValue.split(/\s+/).length;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function countMediaItems(mediaByType: MediaCollection) {
  return Object.values(mediaByType).reduce(
    (total, items) => total + items.length,
    0,
  );
}

function getWordStatus(wordCount: number) {
  return wordCount >= 100 && wordCount <= 300 ? "Đạt" : "Chưa đạt";
}

function getMediaSummary(type: MediaType, items: MediaItem[]) {
  if (items.length === 0) {
    return "Chưa tải lên";
  }

  if (type === "image") {
    return `${items.length} ảnh`;
  }

  if (type === "audio") {
    return `${items.length} tệp audio`;
  }

  return `${items.length} video`;
}

function SectionCard({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="cq-section-title">{title}</h2>
        {trailing}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="cq-label mb-2 block">
      {children}
      {required ? <span className="text-[#CF3F34]"> *</span> : null}
    </label>
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-12 w-full appearance-none rounded-3xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-700 outline-none transition",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          !value && "text-slate-400",
        )}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export default function CreateStoryPage() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [hotspot, setHotspot] = useState("");
  const [unlockCondition, setUnlockCondition] = useState(unlockOptions[0]);
  const [content, setContent] = useState("");
  const [mediaByType, setMediaByType] = useState<MediaCollection>({
    image: [],
    audio: [],
    video: [],
  });
  const [activeStoryStep, setActiveStoryStep] = useState(0);

  const wordCount = countWords(content);
  const totalMediaCount = countMediaItems(mediaByType);
  const wordStatus = getWordStatus(wordCount);

  function getInputRef(type: MediaType) {
    if (type === "audio") {
      return audioInputRef;
    }

    if (type === "video") {
      return videoInputRef;
    }

    return imageInputRef;
  }

  function handleMediaButtonClick(type: MediaType) {
    getInputRef(type).current?.click();
  }

  function handleMediaChange(type: MediaType) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextFiles = Array.from(event.target.files ?? []);

      if (nextFiles.length === 0) {
        return;
      }

      setMediaByType((current) => {
        const reservedCount = countMediaItems(current) - current[type].length;
        const availableSlots = Math.max(MAX_MEDIA_TOTAL - reservedCount, 0);
        const limitedFiles = nextFiles.slice(0, availableSlots);
        const nextItems = limitedFiles.map((file) => ({
          id: `${type}-${file.name}-${file.lastModified}`,
          name: file.name,
          sizeLabel: formatFileSize(file.size),
          type,
        }));

        if (type === "image") {
          return {
            ...current,
            image: [...current.image, ...nextItems].slice(0, availableSlots),
          };
        }

        return {
          ...current,
          [type]: nextItems.slice(0, 1),
        };
      });

      event.target.value = "";
    };
  }

  function handleRemoveMedia(type: MediaType, itemId: string) {
    setMediaByType((current) => ({
      ...current,
      [type]: current[type].filter((item) => item.id !== itemId),
    }));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex items-center gap-3 text-slate-700">
        <Link
          href="/curator/stories"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="cq-page-title">Tạo story mới</h1>
          <p className="cq-page-subtitle">
            Soạn một micro-story 100-300 từ cho hotspot.
          </p>
        </div>
      </div>

      <form
        className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        onSubmit={(event) => event.preventDefault()}
      >
        <SectionCard title="Thông tin cơ bản">
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor="story-title" required>
                Tiêu đề story
              </FieldLabel>
              <Input
                id="story-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="VD: Chuyện chiếc cầu Nhật Bản giữa lòng Hội An"
                className="h-12 rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="story-hotspot" required>
                  Gắn vào hotspot
                </FieldLabel>
                <SelectField
                  id="story-hotspot"
                  value={hotspot}
                  onChange={setHotspot}
                  options={hotspotOptions}
                  placeholder="Chọn hotspot..."
                />
              </div>

              <div>
                <FieldLabel htmlFor="story-unlock">
                  Điều kiện mở khoá
                </FieldLabel>
                <SelectField
                  id="story-unlock"
                  value={unlockCondition}
                  onChange={setUnlockCondition}
                  options={unlockOptions}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Nội dung story"
          trailing={
            <p className="cq-page-subtitle text-xs">
              {wordCount} từ · khuyến nghị 100-300
            </p>
          }
        >
          <textarea
            id="story-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Kể câu chuyện về địa điểm này..."
            className="h-32 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </SectionCard>

        <SectionCard title="Media đính kèm">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#F3D49A] bg-[#FFF3DE] px-3 py-1.5 text-xs font-medium text-[#8A6320]">
                {wordCount}/100-300 từ · {wordStatus}
              </span>
              <span className="rounded-full border border-slate-200 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-slate-600">
                Audio: {getMediaSummary("audio", mediaByType.audio)}
              </span>
              <span className="rounded-full border border-slate-200 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-slate-600">
                Giới hạn media: {totalMediaCount}/{MAX_MEDIA_TOTAL}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {mediaTypeOptions.map((option) => {
                const Icon = option.icon;
                const items = mediaByType[option.type];

                return (
                  <div
                    key={option.type}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                  >
                    <input
                      ref={getInputRef(option.type)}
                      type="file"
                      accept={option.accept}
                      multiple={option.type === "image"}
                      className="hidden"
                      onChange={handleMediaChange(option.type)}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFECE7] text-[#D5403A]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950">
                            {option.label}
                          </p>
                          <p className="cq-page-subtitle">
                            {getMediaSummary(option.type, items)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMediaButtonClick(option.type)}
                        className="shrink-0 text-xs font-semibold text-slate-900 transition hover:text-[#CF3F34]"
                      >
                        Đổi
                      </button>
                    </div>

                    {items.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm"
                          >
                            <span className="truncate">
                              {item.name} · {item.sizeLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMedia(option.type, item.id)
                              }
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-700"
                              aria-label={`Xoá ${item.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Button
            asChild
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full px-4 text-sm text-slate-600 hover:bg-transparent hover:text-slate-900"
          >
            <Link href="/curator/stories">Huỷ</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full px-4"
          >
            <Save className="h-4 w-4" />
            Lưu nháp
          </Button>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="rounded-full bg-red-600 px-4 text-white hover:bg-red-700"
          >
            <Send className="h-4 w-4" />
            Gửi duyệt
          </Button>
        </div>
      </form>
    </div>
  );
}
