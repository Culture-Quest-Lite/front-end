"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ImagePlus, Save, Video, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { hotspotApi, storyApi, tagApi } from "@/services/api";

type MediaType = "image" | "audio" | "video";
type MediaCollection = Record<MediaType, MediaItem[]>;

type MediaItem = {
  id: string;
  name: string;
  sizeLabel: string;
  type: MediaType;
  file: File;
};

type MediaTypeOption = {
  type: MediaType;
  label: string;
  icon: LucideIcon;
  accept: string;
};

type TagOption = {
  id: number;
  label: string;
};

type HotspotOption = {
  id: number;
  label: string;
};

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
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="cq-section-title">{title}</h2>
        {trailing}
      </div>
      <div className="mt-2">{children}</div>
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

export default function CreateStoryPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [tagId, setTagId] = useState("");
  const [hotspotId, setHotspotId] = useState("");
  const [content, setContent] = useState("");
  const [audioScript, setAudioScript] = useState("");
  const [mediaByType, setMediaByType] = useState<MediaCollection>({
    image: [],
    audio: [],
    video: [],
  });
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [hotspotOptions, setHotspotOptions] = useState<HotspotOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

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
          file,
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

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [tagsResult, hotspotsResult] = await Promise.allSettled([
          tagApi.getTags({
            page: 0,
            size: 100,
            sortBy: "tagName",
            sortDir: "ASC",
          }),
          hotspotApi.getHotspots(),
        ]);

        if (tagsResult.status === "fulfilled") {
          setTagOptions(
            tagsResult.value.content.map((tag) => ({
              id: tag.tagId,
              label: tag.tagName,
            })),
          );
        } else {
          console.error("Unable to load tag options", tagsResult.reason);
          setTagOptions([]);
        }

        if (hotspotsResult.status === "fulfilled") {
          setHotspotOptions(
            [...hotspotsResult.value]
              .map((hotspot) => ({
                id: hotspot.hotspotId,
                label:
                  hotspot.hotspotName?.trim() ||
                  `Hotspot #${hotspot.hotspotId}`,
              }))
              .sort((left, right) => left.label.localeCompare(right.label)),
          );
        } else {
          console.error(
            "Unable to load hotspot options",
            hotspotsResult.reason,
          );
          setHotspotOptions([]);
        }
      } catch (error) {
        console.error("Unable to load story form options", error);
      } finally {
        setIsLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const normalizedAudioScript = audioScript.trim();
    const parsedTagId = Number(tagId);
    const parsedHotspotId = Number(hotspotId);

    if (!trimmedTitle || !trimmedContent || !parsedTagId || !parsedHotspotId) {
      setSubmitError(
        "Vui lòng điền đầy đủ tiêu đề, thẻ, địa điểm và nội dung.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", trimmedTitle);
      formData.append("content", trimmedContent);
      formData.append("tagId", String(parsedTagId));
      formData.append("hotspotId", String(parsedHotspotId));
      formData.append("audioScript", normalizedAudioScript);

      Object.values(mediaByType)
        .flat()
        .forEach((item) => {
          formData.append("files", item.file);
        });

      const response = await storyApi.createStory(formData);
      setSubmitSuccess("Câu chuyện đã được lưu nháp thành công.");
      router.push("/curator/stories");
      return response;
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Không thể lưu nháp câu chuyện. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            Tạo câu chuyện mới
          </h1>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
            Soạn một câu chuyện 100-300 từ theo thẻ đã chọn.
          </p>
        </div>
      </div>

      <form
        className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        onSubmit={handleSubmit}
      >
        <SectionCard title="Thông tin cơ bản">
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor="story-title" required>
                Tiêu đề câu chuyện
              </FieldLabel>
              <Input
                id="story-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="VD: Chuyện chiếc cầu Nhật Bản giữa lòng Hội An"
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="story-tag-id" required>
                  Thẻ
                </FieldLabel>
                <select
                  id="story-tag-id"
                  value={tagId}
                  onChange={(event) => setTagId(event.target.value)}
                  disabled={isLoadingOptions}
                  className={cn(
                    "h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    !tagId && "text-slate-400",
                    isLoadingOptions && "cursor-wait",
                  )}
                >
                  <option value="" disabled>
                    {isLoadingOptions ? "Đang tải thẻ..." : "Chọn thẻ..."}
                  </option>
                  {tagOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="story-hotspot-id" required>
                  Địa điểm
                </FieldLabel>
                <select
                  id="story-hotspot-id"
                  value={hotspotId}
                  onChange={(event) => setHotspotId(event.target.value)}
                  disabled={isLoadingOptions}
                  className={cn(
                    "h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    !hotspotId && "text-slate-400",
                    isLoadingOptions && "cursor-wait",
                  )}
                >
                  <option value="" disabled>
                    {isLoadingOptions
                      ? "Đang tải địa điểm..."
                      : "Chọn địa điểm..."}
                  </option>
                  {hotspotOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Nội dung câu chuyện"
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
            className="h-32 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </SectionCard>

        <SectionCard title="Kịch bản audio">
          <textarea
            id="story-audio-script"
            value={audioScript}
            onChange={(event) => setAudioScript(event.target.value)}
            placeholder="Nhập kịch bản audio nếu câu chuyện có lời dẫn hoặc nội dung đọc..."
            className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </SectionCard>

        {submitError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        {submitSuccess ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {submitSuccess}
          </div>
        ) : null}

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
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.35)]"
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
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF1ED] text-[#D5403A] shadow-sm">
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
                        Thêm
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

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
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
            type="submit"
            variant="secondary"
            size="sm"
            className="rounded-full px-4 text-white"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Đang lưu..." : "Lưu nháp"}
          </Button>
        </div>
      </form>
    </div>
  );
}
