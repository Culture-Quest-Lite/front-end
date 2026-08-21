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
import {
  ArrowLeft,
  FileText,
  ImagePlus,
  Save,
  Send,
  ShieldCheck,
  Video,
  Volume2,
  X,
} from "lucide-react";

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

type CreateStoryFormPayload = {
  title: string;
  tagId: number;
  hotspotId: number;
  content: string;
  audioScript: string;
  files: File[];
};

type ApiErrorWithResponse = Error & {
  responseBody?: unknown;
};

const MAX_MEDIA_TOTAL = 10;
const STORY_SUCCESS_TOAST_KEY = "curator-story-success-toast";

const mediaTypeOptions: MediaTypeOption[] = [
  { type: "audio", label: "Audio", icon: Volume2, accept: "audio/*" },
  { type: "video", label: "Video", icon: Video, accept: "video/*" },
  { type: "image", label: "Hình ảnh", icon: ImagePlus, accept: "image/*" },
];

function getStoryApiErrorCode(error: unknown) {
  const responseBody = (error as ApiErrorWithResponse | null)?.responseBody;

  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  const errorCode =
    "errorCode" in responseBody ? responseBody.errorCode : undefined;

  return typeof errorCode === "string" ? errorCode : null;
}

function getStorySubmitErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
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
    <section className="space-y-2.5">
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
    <label htmlFor={htmlFor} className="cq-label mb-1.5 block">
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
  const [pendingCultureReviewPayload, setPendingCultureReviewPayload] =
    useState<CreateStoryFormPayload | null>(null);

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
        const availableSlots = Math.max(
          MAX_MEDIA_TOTAL - countMediaItems(current),
          0,
        );
        const limitedFiles = nextFiles.slice(0, availableSlots);
        if (limitedFiles.length === 0) {
          return current;
        }

        const nextItems = limitedFiles.map((file) => ({
          id: `${type}-${file.name}-${file.lastModified}`,
          name: file.name,
          sizeLabel: formatFileSize(file.size),
          type,
          file,
        }));

        return {
          ...current,
          [type]: [...current[type], ...nextItems],
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

  async function handleCreateStory(
    payload: CreateStoryFormPayload,
    options?: { confirmCultural?: boolean; allowCultureReviewPrompt?: boolean },
  ) {
    try {
      await storyApi.createStory({
        title: payload.title,
        content: payload.content,
        tagId: payload.tagId,
        hotspotId: payload.hotspotId,
        audioScript: payload.audioScript,
        files: payload.files,
        confirmCultural: options?.confirmCultural,
      });

      setSubmitSuccess("Câu chuyện đã được lưu nháp thành công.");
      sessionStorage.setItem(
        STORY_SUCCESS_TOAST_KEY,
        "Tạo câu chuyện thành công.",
      );
      router.push("/curator/stories");
      return true;
    } catch (error) {
      if (
        options?.allowCultureReviewPrompt &&
        getStoryApiErrorCode(error) === "CULTURE_REVIEW_REQUIRED"
      ) {
        setPendingCultureReviewPayload(payload);
        return false;
      }

      throw error;
    }
  }

  async function handleConfirmCultureReview() {
    if (!pendingCultureReviewPayload || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await handleCreateStory(pendingCultureReviewPayload, {
        confirmCultural: true,
      });
    } catch (error) {
      setPendingCultureReviewPayload(null);
      setSubmitError(
        getStorySubmitErrorMessage(
          error,
          "Không thể lưu nháp câu chuyện. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
      await handleCreateStory(
        {
          title: trimmedTitle,
          content: trimmedContent,
          tagId: parsedTagId,
          hotspotId: parsedHotspotId,
          audioScript: normalizedAudioScript,
          files: Object.values(mediaByType)
            .flat()
            .map((item) => item.file),
        },
        {
          allowCultureReviewPrompt: true,
        },
      );
    } catch (error) {
      setSubmitError(
        getStorySubmitErrorMessage(
          error,
          "Không thể lưu nháp câu chuyện. Vui lòng thử lại.",
        ),
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
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <div className="flex items-center gap-2 text-slate-700">
        <Link
          href="/curator/stories"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-2.5 w-2.5" />
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
        className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        onSubmit={handleSubmit}
      >
        <SectionCard title="Thông tin cơ bản">
          <div className="grid gap-3">
            <div>
              <FieldLabel htmlFor="story-title" required>
                Tiêu đề câu chuyện
              </FieldLabel>
              <Input
                id="story-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="VD: Chuyện chiếc cầu Nhật Bản giữa lòng Hội An"
                className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-[13px] text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                    "h-10 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-[13px] text-slate-700 shadow-sm outline-none transition",
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
                    "h-10 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-[13px] text-slate-700 shadow-sm outline-none transition",
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
            <p className="cq-page-subtitle">
              {wordCount} từ · khuyến nghị 100-300
            </p>
          }
        >
          <textarea
            id="story-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Kể câu chuyện về địa điểm này..."
            className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white p-3.5 text-[13px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </SectionCard>

        <SectionCard title="Kịch bản audio">
          <textarea
            id="story-audio-script"
            value={audioScript}
            onChange={(event) => setAudioScript(event.target.value)}
            placeholder="Nhập kịch bản audio nếu câu chuyện có lời dẫn hoặc nội dung đọc..."
            className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white p-3.5 text-[13px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </SectionCard>

        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-[13px] text-red-700">
            {submitError}
          </div>
        ) : null}

        {submitSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-[13px] text-emerald-700">
            {submitSuccess}
          </div>
        ) : null}

        <SectionCard title="Media đính kèm">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#F3D49A] bg-[#FFF3DE] px-2.5 py-1 text-[11px] font-medium text-[#8A6320]">
                {wordCount}/100-300 từ · {wordStatus}
              </span>
              <span className="rounded-full border border-slate-200 bg-[#F8F6F0] px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Audio: {getMediaSummary("audio", mediaByType.audio)}
              </span>
              <span className="rounded-full border border-slate-200 bg-[#F8F6F0] px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Giới hạn media: {totalMediaCount}/{MAX_MEDIA_TOTAL}
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {mediaTypeOptions.map((option) => {
                const Icon = option.icon;
                const items = mediaByType[option.type];

                return (
                  <div
                    key={option.type}
                    className="rounded-[1.15rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.35)]"
                  >
                    <input
                      ref={getInputRef(option.type)}
                      type="file"
                      accept={option.accept}
                      multiple
                      className="hidden"
                      onChange={handleMediaChange(option.type)}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1ED] text-[#D5403A] shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-950">
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
                        className="shrink-0 text-[11px] font-semibold text-slate-900 transition hover:text-[#CF3F34]"
                      >
                        Thêm
                      </button>
                    </div>

                    {items.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
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
            className="rounded-full px-4 text-[12px] text-slate-600 hover:bg-transparent hover:text-slate-900"
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
            <Save className="h-3.5 w-3.5" />
            {isSubmitting ? "Đang lưu..." : "Lưu nháp"}
          </Button>
        </div>
      </form>

      {pendingCultureReviewPayload ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPendingCultureReviewPayload(null)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-culture-review-title"
            className="relative z-10 w-full max-w-[26rem] overflow-hidden rounded-[1.6rem] border border-[#F1E4E9] bg-[radial-gradient(circle_at_top,_rgba(255,240,247,0.9),_rgba(255,255,255,1)_38%)] px-5 py-6 shadow-[0_24px_56px_rgba(15,23,42,0.18)] sm:px-6 sm:py-7"
          >
            <button
              type="button"
              onClick={() => setPendingCultureReviewPayload(null)}
              disabled={isSubmitting}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Đóng xác nhận"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,_rgba(252,231,243,0.95),_rgba(255,255,255,1))] shadow-[0_16px_32px_rgba(236,72,153,0.16)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white text-pink-500 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#EC4899,#F59E0B)] text-white shadow-[0_8px_18px_rgba(236,72,153,0.24)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>

              <h2
                id="story-culture-review-title"
                className="mt-5 text-base font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.0625rem]"
              >
                Xác nhận gửi để duyệt nội dung văn hóa
              </h2>
              <div className="mt-2.5 h-1 w-10 rounded-full bg-[linear-gradient(90deg,#F472B6,#EC4899)]" />
              <p className="mt-3.5 max-w-[20rem] text-xs leading-5 text-slate-500 sm:text-[0.8125rem]">
                Hệ thống cần xác nhận thêm trước khi gửi câu chuyện này vào
                luồng duyệt nội dung văn hóa của quản trị viên.
              </p>
            </div>

            <div className="mt-6 rounded-[1.1rem] border border-[#E9E3EA] bg-white/85 p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-500">
                  <Send className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 sm:text-[0.8125rem]">
                    Lưu ý quan trọng
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-[0.8125rem]">
                    Sau khi gửi, câu chuyện sẽ chờ quản trị viên kiểm duyệt
                    trước khi hiển thị trong hệ thống.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPendingCultureReviewPayload(null)}
                disabled={isSubmitting}
                className="rounded-2xl border-slate-200 bg-slate-100 px-4 text-xs font-semibold text-slate-500 shadow-none hover:bg-slate-200 hover:text-slate-700"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleConfirmCultureReview()}
                disabled={isSubmitting}
                className="rounded-2xl border-0 bg-[linear-gradient(90deg,#EC4899,#F59E0B)] px-4 text-xs font-semibold text-white shadow-[0_14px_28px_rgba(236,72,153,0.26)] hover:opacity-95"
              >
                <span className="inline-flex items-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting
                    ? "Đang gửi lại..."
                    : "Xác nhận và gửi để duyệt"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
