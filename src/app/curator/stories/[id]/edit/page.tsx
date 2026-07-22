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
import {
  hotspotApi,
  storyApi,
  tagApi,
  type BackendStoryMedia,
  type UpdateStoryFields,
} from "@/services/api";
import { toast } from "react-toastify";

const STORY_SUCCESS_TOAST_KEY = "curator-story-success-toast";

type MediaType = "image" | "audio" | "video";
type MediaCollection = Record<MediaType, MediaItem[]>;

type MediaItem = {
  id: string;
  name: string;
  sizeLabel: string;
  type: MediaType;
  file?: File;
  fileUrl?: string;
  mimeType?: string;
  mediaId?: number;
  isExisting?: boolean;
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

const fieldClassName =
  "h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const textareaClassName =
  "w-full resize-y rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

function createEmptyMediaCollection(): MediaCollection {
  return {
    image: [],
    audio: [],
    video: [],
  };
}

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

function getMediaTypeFromStoryMedia(media: BackendStoryMedia): MediaType {
  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();
  const fileUrl = media.fileUrl?.trim() ?? "";

  if (
    mediaType === "VIDEO" ||
    mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov)$/i.test(fileUrl)
  ) {
    return "video";
  }

  if (
    mediaType === "AUDIO" ||
    mimeType?.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a)$/i.test(fileUrl)
  ) {
    return "audio";
  }

  return "image";
}

function extractFileNameFromUrl(fileUrl?: string) {
  const trimmedUrl = fileUrl?.trim();
  if (!trimmedUrl) {
    return null;
  }

  const normalizedPath = trimmedUrl.split("?")[0]?.split("#")[0] ?? "";
  const rawFileName = normalizedPath.split("/").pop()?.trim();

  if (!rawFileName) {
    return null;
  }

  try {
    return decodeURIComponent(rawFileName);
  } catch {
    return rawFileName;
  }
}

function buildExistingMediaName(media: BackendStoryMedia) {
  return (
    media.fileName?.trim() ||
    extractFileNameFromUrl(media.fileUrl) ||
    `Media #${media.mediaId}`
  );
}

function buildMediaItemFromFile(type: MediaType, file: File): MediaItem {
  return {
    id: `${type}-${file.name}-${file.lastModified}-${file.size}`,
    name: file.name,
    sizeLabel: formatFileSize(file.size),
    type,
    file,
    mimeType: file.type || undefined,
    isExisting: false,
  };
}

async function resolveMediaItemToFile(item: MediaItem) {
  if (item.file instanceof File) {
    return item.file;
  }

  if (!item.fileUrl) {
    throw new Error(`Không thể chuẩn bị lại file "${item.name}" để cập nhật.`);
  }

  const response = await fetch(item.fileUrl, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Không thể tải lại file "${item.name}" từ hệ thống để cập nhật.`,
    );
  }

  const blob = await response.blob();

  return new File([blob], item.name, {
    type: blob.type || item.mimeType || undefined,
    lastModified: Date.now(),
  });
}

function appendStoryFields(formData: FormData, fields: UpdateStoryFields) {
  formData.append("title", fields.title);
  formData.append("content", fields.content);
  formData.append("tagId", String(fields.tagId));
  formData.append("hotspotId", String(fields.hotspotId));
  formData.append("audioScript", fields.audioScript ?? "");
}

async function buildStoryUpdateFormData(
  fields: UpdateStoryFields,
  mediaItems?: MediaItem[],
) {
  const formData = new FormData();
  appendStoryFields(formData, fields);

  if (!mediaItems) {
    return formData;
  }

  const files = await Promise.all(mediaItems.map(resolveMediaItemToFile));
  files.forEach((file) => formData.append("files", file));
  return formData;
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
    <section className="p-5 sm:p-6">
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
  const [audioScript, setAudioScript] = useState("");
  const [mediaByType, setMediaByType] = useState<MediaCollection>(
    createEmptyMediaCollection,
  );
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [hotspotOptions, setHotspotOptions] = useState<HotspotOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingStory, setIsLoadingStory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMediaChanges, setHasMediaChanges] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const wordCount = countWords(content);
  const totalMediaCount = countMediaItems(mediaByType);

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
        const availableSlots = Math.max(
          MAX_MEDIA_TOTAL - countMediaItems(current),
          0,
        );
        const limitedFiles = nextFiles.slice(0, availableSlots);
        if (limitedFiles.length === 0) {
          return current;
        }

        const nextItems = limitedFiles.map((file) =>
          buildMediaItemFromFile(type, file),
        );

        return {
          ...current,
          [type]: [...current[type], ...nextItems],
        };
      });
      setHasMediaChanges(true);

      event.target.value = "";
    };
  }

  function handleRemoveMedia(type: MediaType, itemId: string) {
    setHasMediaChanges(true);
    setMediaByType((current) => ({
      ...current,
      [type]: current[type].filter((item) => item.id !== itemId),
    }));
  }

  // Load tags
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
        setHotspotId(String(story.hotspotId ?? ""));
        setAudioScript(story.audioScript ?? "");
        setHasMediaChanges(false);

        const mediaCollection = createEmptyMediaCollection();

        [...(story.medias ?? [])]
          .sort((left, right) => {
            const displayOrderDiff =
              (left.displayOrder ?? Number.MAX_SAFE_INTEGER) -
              (right.displayOrder ?? Number.MAX_SAFE_INTEGER);

            if (displayOrderDiff !== 0) {
              return displayOrderDiff;
            }

            return left.mediaId - right.mediaId;
          })
          .forEach((media) => {
            const mediaType = getMediaTypeFromStoryMedia(media);

            mediaCollection[mediaType].push({
              id: `media-${media.mediaId}`,
              name: buildExistingMediaName(media),
              sizeLabel: media.fileSize
                ? formatFileSize(media.fileSize)
                : "N/A",
              type: mediaType,
              fileUrl: media.fileUrl?.trim() || undefined,
              mimeType: media.mimeType?.trim() || undefined,
              mediaId: media.mediaId,
              isExisting: true,
            });
          });

        setMediaByType(mediaCollection);
      } catch (error) {
        console.error("Unable to load story", error);
        setSubmitError("Không thể tải dữ liệu câu chuyện.");
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
      const fields: UpdateStoryFields = {
        title: trimmedTitle,
        content: trimmedContent,
        tagId: parsedTagId,
        hotspotId: parsedHotspotId,
        audioScript: normalizedAudioScript,
      };
      const mediaItems = hasMediaChanges
        ? Object.values(mediaByType).flat()
        : undefined;
      const payload = await buildStoryUpdateFormData(fields, mediaItems);

      const response = await storyApi.updateStory(storyId, payload);
      setSubmitSuccess("Câu chuyện đã được cập nhật thành công.");
      sessionStorage.setItem(
        STORY_SUCCESS_TOAST_KEY,
        "Cập nhật câu chuyện thành công.",
      );
      router.push("/curator/stories");
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi khi cập nhật câu chuyện.";
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
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-slate-700">
          <Link
            href="/curator/stories"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
              Chỉnh sửa câu chuyện
            </h1>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
              Cập nhật nội dung, media và thông tin liên kết của câu chuyện.
            </p>
          </div>
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

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-200">
              <SectionCard title="Thông tin chung">
                <div>
                  <div className="flex flex-col gap-5">
                    <div>
                      <FieldLabel htmlFor="title" required>
                        Tiêu đề
                      </FieldLabel>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Nhập tiêu đề câu chuyện"
                        className={fieldClassName}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <FieldLabel htmlFor="tagId" required>
                            Thẻ
                          </FieldLabel>
                          <select
                            id="tagId"
                            className={fieldClassName}
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

                        <div>
                          <FieldLabel htmlFor="hotspotId" required>
                            Địa điểm
                          </FieldLabel>
                          <select
                            id="hotspotId"
                            className={fieldClassName}
                            value={hotspotId}
                            onChange={(e) => setHotspotId(e.target.value)}
                            disabled={isSubmitting}
                          >
                            <option value="">Chọn địa điểm...</option>
                            {hotspotOptions.map((option) => (
                              <option key={option.id} value={String(option.id)}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Nội dung"
                trailing={
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-600">
                      {wordCount}/300
                    </div>
                  </div>
                }
              >
                <textarea
                  className={`${textareaClassName} min-h-[18rem] leading-7`}
                  rows={12}
                  placeholder="Nhập nội dung story (100-300 từ)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                />
              </SectionCard>

              <SectionCard title="Kịch bản audio">
                <textarea
                  className={`${textareaClassName} min-h-[10rem] leading-7`}
                  rows={6}
                  placeholder="Nhập audioScript nếu story có lời dẫn hoặc nội dung đọc"
                  value={audioScript}
                  onChange={(e) => setAudioScript(e.target.value)}
                  disabled={isSubmitting}
                />
              </SectionCard>

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
                          <span className="text-xs text-slate-500">
                            {summary}
                          </span>
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
                                  {item.isExisting
                                    ? " (hiện tại)"
                                    : " (mới thêm)"}
                                </div>
                              </div>
                              {item.fileUrl ? (
                                <a
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mr-2 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                                >
                                  Mở file
                                </a>
                              ) : null}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveMedia(typeOption.type, item.id)
                                }
                                className="rounded p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={isSubmitting}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() =>
                              handleMediaButtonClick(typeOption.type)
                            }
                            className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                    multiple
                    onChange={handleMediaChange("audio")}
                    className="hidden"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept={
                      mediaTypeOptions.find((m) => m.type === "video")?.accept
                    }
                    multiple
                    onChange={handleMediaChange("video")}
                    className="hidden"
                  />
                </div>
              </SectionCard>

              <div className="flex gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
                <Link href="/curator/stories" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    Huỷ
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
