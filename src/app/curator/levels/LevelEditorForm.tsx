"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "react-toastify";

import { PageLoading } from "@/components/app/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type BackendLevelRecord, levelApi } from "@/services/api";

type LevelEditorFormProps = {
  mode: "create" | "edit";
  levelId?: number;
};

function pickFirstValue(
  record: BackendLevelRecord,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return null;
}

function pickString(
  record: BackendLevelRecord,
  keys: readonly string[],
): string | null {
  const value = pickFirstValue(record, keys);

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function pickNumber(
  record: BackendLevelRecord,
  keys: readonly string[],
): number | null {
  const value = pickFirstValue(record, keys);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.replace(/,/g, "").trim();
    if (!normalizedValue) {
      return null;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function mapLevelRecordToFormValues(record: BackendLevelRecord) {
  return {
    name: pickString(record, ["levelName", "name", "title", "label"]) ?? "",
    requiredXp:
      pickNumber(record, [
        "requiredXp",
        "xpRequired",
        "experienceRequired",
        "requiredExperience",
        "pointsRequired",
        "pointRequired",
        "xp",
      ])?.toString() ?? "",
    description:
      pickString(record, ["description", "details", "summary", "note"]) ?? "",
  };
}

export function LevelEditorForm({ mode, levelId }: LevelEditorFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const [name, setName] = useState("");
  const [requiredXp, setRequiredXp] = useState("");
  const [description, setDescription] = useState("");
  const [isLoadingLevel, setIsLoadingLevel] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode || !levelId) {
      return;
    }

    const currentLevelId = levelId;
    let cancelled = false;

    async function loadLevel() {
      try {
        setIsLoadingLevel(true);
        setLoadError(null);

        const response = await levelApi.getLevelById(currentLevelId);
        if (cancelled) {
          return;
        }

        const nextValues = mapLevelRecordToFormValues(response);
        setName(nextValues.name);
        setRequiredXp(nextValues.requiredXp);
        setDescription(nextValues.description);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu cấp bậc.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingLevel(false);
        }
      }
    }

    void loadLevel();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, levelId]);

  function handleCancel() {
    if (isSubmitting) {
      return;
    }

    router.push("/curator/levels");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedRequiredXp = Number(requiredXp);

    if (!trimmedName) {
      setSubmitError("Tên cấp bậc không được để trống.");
      return;
    }

    if (!requiredXp.trim()) {
      setSubmitError("XP yêu cầu không được để trống.");
      return;
    }

    if (!Number.isInteger(parsedRequiredXp) || parsedRequiredXp < 0) {
      setSubmitError("XP yêu cầu phải là số nguyên lớn hơn hoặc bằng 0.");
      return;
    }

    if (!trimmedDescription) {
      setSubmitError("Mô tả không được để trống.");
      return;
    }

    if (isEditMode && !levelId) {
      setSubmitError("Không tìm thấy ID cấp bậc để cập nhật.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        name: trimmedName,
        requiredXp: parsedRequiredXp,
        description: trimmedDescription,
      };

      if (isEditMode && levelId) {
        await levelApi.updateLevel(levelId, payload);
      } else {
        await levelApi.createLevel(payload);
      }

      toast.success(
        isEditMode ? "Cập nhật cấp bậc thành công." : "Tạo cấp bậc thành công.",
      );
      router.push("/curator/levels");
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Không thể cập nhật cấp bậc. Vui lòng thử lại."
            : "Không thể tạo cấp bậc. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-slate-700">
          <Link
            href="/curator/levels"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
              {isEditMode ? "Chỉnh sửa cấp bậc" : "Tạo cấp bậc mới"}
            </h1>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
              {isEditMode
                ? "Cập nhật thông tin cấp bậc trong hệ thống."
                : "Thêm cấp bậc mới cho hệ thống ."}
            </p>
          </div>
        </div>
      </div>

      {isEditMode && isLoadingLevel ? (
        <PageLoading className="min-h-[140px] rounded-3xl border border-slate-200 shadow-none" spinnerClassName="h-6 w-6" />
      ) : null}

      {isEditMode && loadError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <div className="p-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF1F7] text-[#D94A8D]">
              {isEditMode ? (
                <Pencil className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2 className="cq-section-title">Thông tin cấp bậc</h2>
              <p className="mt-1 text-xs text-slate-500">
                {isEditMode
                  ? "Chỉnh sửa các trường bắt buộc để cập nhật cấp bậc người dùng."
                  : "Điền các trường bắt buộc để tạo mới một cấp bậc người dùng."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label htmlFor="level-name" className="cq-label mb-2 block">
                Tên cấp bậc
              </label>
              <Input
                id="level-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ví dụ: 1, 2, 3"
                className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isSubmitting || isLoadingLevel || !!loadError}
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="level-required-xp"
                className="cq-label mb-2 block"
              >
                Điểm XP yêu cầu
              </label>
              <Input
                id="level-required-xp"
                type="number"
                min="0"
                step="1"
                value={requiredXp}
                onChange={(event) => setRequiredXp(event.target.value)}
                placeholder="Ví dụ: 100"
                className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isSubmitting || isLoadingLevel || !!loadError}
              />
            </div>

            <div>
              <label
                htmlFor="level-description"
                className="cq-label mb-2 block"
              >
                Mô tả
              </label>
              <textarea
                id="level-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả ngắn về ý nghĩa và điều kiện đạt cấp bậc này"
                rows={5}
                disabled={isSubmitting || isLoadingLevel || !!loadError}
                className="w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {submitError ? (
              <p className="text-xs font-medium text-rose-700">{submitError}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="rounded-full px-5 shadow-sm"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            disabled={isSubmitting || isLoadingLevel || !!loadError}
            className="rounded-full px-5 text-white shadow-sm"
          >
            {isSubmitting
              ? isEditMode
                ? "Đang cập nhật..."
                : "Đang tạo..."
              : isEditMode
                ? "Cập nhật cấp bậc"
                : "Tạo cấp bậc"}
          </Button>
        </div>
      </form>
    </div>
  );
}
