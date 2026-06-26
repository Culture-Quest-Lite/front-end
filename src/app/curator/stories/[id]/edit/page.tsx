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
import { useRouter, useParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ImagePlus, Save, Video, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  storyApi,
  tagApi,
  hotspotApi,
  type BackendStory,
} from "@/services/api";
import { toast } from "react-toastify";

type MediaType = "image" | "audio" | "video";
type MediaCollection = Record<MediaType, MediaItem[]>;

type MediaItem = {
  id: string;
  name: string;
  sizeLabel: string;
  type: MediaType;
  file?: File;
  isExisting?: boolean;
};

type MediaTypeOption = {
  type: MediaType;
  label: string;
  icon: LucideIcon;
  accept: string;
};

type HotspotOption = {
  id: number;
  label: string;
};

type TagOption = {
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

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = Number(params.id);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [tagId, setTagId] = useState("");
  const [hotspotId, setHotspotId] = useState("");
  const [content, setContent] = useState("");
  const [mediaByType, setMediaByType] = useState<MediaCollection>({
    image: [],
    audio: [],
    video: [],
  });
  const [hotspotOptions, setHotspotOptions] = useState<HotspotOption[]>([]);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingStory, setIsLoadingStory] = useState(true);
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
          isExisting: false,
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

  // Load hotspots, tags, and story data
  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true);
      try {
        const [hotspots, tags] = await Promise.all([
          hotspotApi.getHotspots(),
          tagApi.getTags({
            page: 0,
            size: 100,
            sortBy: "tagName",
            sortDir: "ASC",
          }),
        ]);

        setHotspotOptions(
          hotspots.map((hotspot) => ({
            id: hotspot.hotspotId,
            label: hotspot.hotspotName ?? `Hotspot #${hotspot.hotspotId}`,
          })),
        );
        setTagOptions(
          tags.content.map((tag) => ({
            id: tag.tagId,
            label: tag.tagName,
          })),
        );
      } catch (error) {
        console.error("Unable to load hotspot/tag options", error);
      } finally {
        setIsLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  // Load story data
  useEffect(() => {
    async function loadStory() {
      if (!storyId) return;
      setIsLoadingStory(true);
      try {
        const story = await storyApi.getStoryById(storyId);
        setTitle(story.title);
        setContent(story.content);
        setTagId(String(story.tag?.tagId ?? ""));
        setHotspotId(String(story.hotspotId));

        // Populate existing media
        if (story.medias && story.medias.length > 0) {
          const mediaCollection: MediaCollection = {
            image: [],
            audio: [],
            video: [],
          };

          story.medias.forEach((media) => {
            let mediaType: MediaType = "image";
            const mediaTypeStr = media.mediaType?.trim().toUpperCase();
            const mimeType = media.mimeType?.trim().toLowerCase();

            if (
              mediaTypeStr === "VIDEO" ||
              mimeType?.startsWith("video/") ||
              /\.(mp4|webm|ogg|mov)$/i.test(media.fileUrl ?? "")
            ) {
              mediaType = "video";
            } else if (
              mediaTypeStr === "AUDIO" ||
              mimeType?.startsWith("audio/") ||
              /\.(mp3|wav|ogg|m4a)$/i.test(media.fileUrl ?? "")
            ) {
              mediaType = "audio";
            }

            mediaCollection[mediaType].push({
              id: `media-${media.mediaId}`,
              name: media.fileName ?? `Media #${media.mediaId}`,
              sizeLabel: media.fileSize
                ? formatFileSize(media.fileSize)
                : "N/A",
              type: mediaType,
              isExisting: true,
            });
          });

          setMediaByType(mediaCollection);
        }
      } catch (error) {
        console.error("Unable to load story", error);
        setSubmitError("Không thể tải dữ liệu story.");
      } finally {
        setIsLoadingStory(false);
      }
    }

    loadStory();
  }, [storyId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const parsedHotspotId = Number(hotspotId);
    const parsedTagId = Number(tagId);

    if (!trimmedTitle || !trimmedContent || !parsedHotspotId || !parsedTagId) {
      setSubmitError(
        "Vui lòng điền đầy đủ tiêu đề, tagId, hotspotId và nội dung.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Try JSON format first (without files)
      const payload = {
        title: trimmedTitle,
        content: trimmedContent,
        hotspotId: parsedHotspotId,
        tagId: parsedTagId,
      };

      console.log("[updateStory] Sending payload:", payload);

      const response = await storyApi.updateStory(storyId, payload);
      setSubmitSuccess("Story đã được cập nhật thành công.");
      toast.success("Story đã được cập nhật thành công.");
      router.push(`/curator/stories/${storyId}`);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi khi cập nhật story.";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isLoadingOptions || isLoadingStory;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/curator/stories"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="cq-heading-1">Chỉnh sửa Story</h1>
        </div>
      </header>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-slate-600">Đang tải...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-10">
          {/* Error and Success Messages */}
          {submitError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-700">
              {submitSuccess}
            </div>
          )}

          {/* General Info Section */}
          <SectionCard title="Thông tin chung">
            <div className="flex flex-col gap-5">
              <div>
                <FieldLabel htmlFor="title" required>
                  Tiêu đề
                </FieldLabel>
                <Input
                  id="title"
                  type="text"
                  placeholder="Nhập tiêu đề story"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="hotspotId" required>
                    Hotspot
                  </FieldLabel>
                  <select
                    id="hotspotId"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={hotspotId}
                    onChange={(e) => setHotspotId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Chọn hotspot...</option>
                    {hotspotOptions.map((option) => (
                      <option key={option.id} value={String(option.id)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="tagId" required>
                    Tag
                  </FieldLabel>
                  <select
                    id="tagId"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Chọn tag...</option>
                    {tagOptions.map((option) => (
                      <option key={option.id} value={String(option.id)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Content Section */}
          <SectionCard
            title="Nội dung"
            trailing={
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-600">
                  {wordCount}/300
                </div>
                <div
                  className={cn("text-xs font-semibold", {
                    "text-emerald-600": wordStatus === "Đạt",
                    "text-orange-600": wordStatus === "Chưa đạt",
                  })}
                >
                  {wordStatus}
                </div>
              </div>
            }
          >
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder="Nhập nội dung story (100-300 từ)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </SectionCard>

          {/* Media Section */}
          <SectionCard
            title="Media"
            trailing={
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-600">
                  {totalMediaCount}/{MAX_MEDIA_TOTAL}
                </div>
              </div>
            }
          >
            <div className="flex flex-col gap-5">
              {mediaTypeOptions.map((typeOption) => {
                const Icon = typeOption.icon;
                const items = mediaByType[typeOption.type];
                const summary = getMediaSummary(typeOption.type, items);

                return (
                  <div key={typeOption.type}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700">
                          {typeOption.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{summary}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-700">
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.sizeLabel}
                              {item.isExisting && " (hiện tại)"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveMedia(typeOption.type, item.id)
                            }
                            className="p-1 hover:bg-slate-200 rounded"
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleMediaButtonClick(typeOption.type)}
                        className="rounded-lg border border-dashed border-slate-300 py-2 px-3 text-center text-sm font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                        disabled={
                          isSubmitting || totalMediaCount >= MAX_MEDIA_TOTAL
                        }
                      >
                        + Thêm {typeOption.label}
                      </button>
                    </div>
                  </div>
                );
              })}

              <input
                ref={imageInputRef}
                type="file"
                accept={
                  mediaTypeOptions.find((m) => m.type === "image")?.accept
                }
                multiple
                onChange={handleMediaChange("image")}
                className="hidden"
              />
              <input
                ref={audioInputRef}
                type="file"
                accept={
                  mediaTypeOptions.find((m) => m.type === "audio")?.accept
                }
                onChange={handleMediaChange("audio")}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept={
                  mediaTypeOptions.find((m) => m.type === "video")?.accept
                }
                onChange={handleMediaChange("video")}
                className="hidden"
              />
            </div>
          </SectionCard>

          {/* Submit Button */}
          <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-5 py-4">
            <Link href="/curator/stories" className="flex-1">
              <Button
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
              >
                Huỷ
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
