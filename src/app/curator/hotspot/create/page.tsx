"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildTagToken, type TagRecord } from "@/lib/tags";
import {
  hotspotApi,
  tagApi,
  type BackendHotspot,
  type CreateHotspotPayload,
} from "@/services/api";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Save,
  Send,
  Video,
} from "lucide-react";

type HotspotFormState = {
  hotspotName: string;
  address: string;
  description: string;
  historyInformation: string;
  latitude: string;
  longitude: string;
  checkInRadius: string;
  xp: string;
  point: string;
  estimatedDurationMin: string;
  estimatedDurationMax: string;
  startTime: string;
  endTime: string;
  openingTime: string;
  closingTime: string;
};

const defaultHotspotForm: HotspotFormState = {
  hotspotName: "",
  address: "",
  description: "",
  historyInformation: "",
  latitude: "",
  longitude: "",
  checkInRadius: "",
  xp: "",
  point: "",
  estimatedDurationMin: "",
  estimatedDurationMax: "",
  startTime: "",
  endTime: "",
  openingTime: "",
  closingTime: "",
};

export default function Page() {
  return (
    <Suspense fallback={<HotspotCreatePageFallback />}>
      <HotspotCreatePageContent />
    </Suspense>
  );
}

function HotspotCreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingHotspotId = parseHotspotId(searchParams.get("id"));
  const isEditMode = editingHotspotId !== null;
  const [formState, setFormState] = useState(defaultHotspotForm);
  const [availableTags, setAvailableTags] = useState<TagRecord[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagSelectValue, setTagSelectValue] = useState("");
  const [isLoadingHotspot, setIsLoadingHotspot] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [tagError, setTagError] = useState<string | null>(null);
  const [loadHotspotError, setLoadHotspotError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [createdHotspot, setCreatedHotspot] = useState<BackendHotspot | null>(
    null,
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadTags() {
      setIsLoadingTags(true);
      setTagError(null);

      try {
        const response = await tagApi.getTags({
          page: 0,
          size: 100,
          status: "ACTIVE",
        });

        if (isCancelled) {
          return;
        }

        setAvailableTags(response.content);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error("Failed to load hotspot tags", error);
        setAvailableTags([]);
        setSelectedTagIds([]);
        setTagError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách thẻ từ API.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingTags(false);
        }
      }
    }

    void loadTags();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || editingHotspotId === null) {
      return;
    }

    const hotspotId = editingHotspotId;
    let isCancelled = false;

    async function loadHotspotForEdit() {
      setIsLoadingHotspot(true);
      setLoadHotspotError(null);

      try {
        const response = await hotspotApi.getHotspotById(hotspotId);

        if (isCancelled) {
          return;
        }

        setFormState(syncFormStateWithResponse(defaultHotspotForm, response));
        setSelectedTagIds(response.tags?.map((tag) => tag.tagId) ?? []);
        setCreatedHotspot(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setLoadHotspotError(
          error instanceof Error
            ? error.message
            : "Không tải được dữ liệu hotspot cần chỉnh sửa.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingHotspot(false);
        }
      }
    }

    void loadHotspotForEdit();

    return () => {
      isCancelled = true;
    };
  }, [editingHotspotId, isEditMode]);

  const selectedTags = availableTags.filter((tag) =>
    selectedTagIds.includes(tag.tagId),
  );

  function updateField<Key extends keyof HotspotFormState>(
    field: Key,
    value: HotspotFormState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleToggleTag(tagId: number) {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((item) => item !== tagId)
        : [...current, tagId],
    );
  }

  function handleTagSelectChange(value: string) {
    setTagSelectValue(value);

    const nextTagId = Number(value);
    if (!Number.isInteger(nextTagId) || nextTagId <= 0) {
      return;
    }

    setSelectedTagIds((current) =>
      current.includes(nextTagId) ? current : [...current, nextTagId],
    );
    setTagSelectValue("");
  }

  async function handleSubmitHotspot(intent: "draft" | "review") {
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const payload = buildCreatePayload(formState, selectedTagIds);

      setIsSubmitting(true);
      const response =
        isEditMode && editingHotspotId !== null
          ? await hotspotApi.updateHotspot(editingHotspotId, payload)
          : await hotspotApi.createHotspot(payload);

      setCreatedHotspot(response);
      setSelectedTagIds(
        response.tags?.map((tag) => tag.tagId) ?? selectedTagIds,
      );
      setFormState((current) => syncFormStateWithResponse(current, response));

      const normalizedStatus = response.status?.trim().toUpperCase();
      const successMessage =
        isEditMode
          ? "Hotspot đã được cập nhật thành công."
          : intent === "review" && normalizedStatus === "DRAFT"
            ? "Hotspot đã được tạo thành công. Vui lòng chờ admin duyệt!"
            : "Hotspot đã được tạo thành công.";

      toast.success(successMessage);
      router.push("/curator/hotspot");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Không thể cập nhật hotspot."
            : "Không thể tạo hotspot.",
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
            href="/curator/hotspot"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="cq-page-title">
              {isEditMode ? "Chỉnh sửa Hotspot" : "Tạo Hotspot mới"}
            </h1>
            <p className="cq-page-subtitle">
              {isEditMode
                ? "Cập nhật thông tin chi tiết của hotspot."
                : "Nhập thông tin chi tiết và phương tiện."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full px-4"
            onClick={() => void handleSubmitHotspot("draft")}
            disabled={isSubmitting || isLoadingHotspot || !!loadHotspotError}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting
              ? isEditMode
                ? "Đang cập nhật..."
                : "Đang lưu..."
              : isEditMode
                ? "Lưu cập nhật"
                : "Lưu nháp"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full text-white"
            onClick={() => void handleSubmitHotspot("review")}
            disabled={isSubmitting || isLoadingHotspot || !!loadHotspotError}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting
              ? isEditMode
                ? "Đang cập nhật..."
                : "Đang gửi..."
              : isEditMode
                ? "Cập nhật hotspot"
                : "Gửi duyệt"}
          </Button>
        </div>
      </div>

      {isLoadingHotspot ? (
        <div className="rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-700">
          Đang tải dữ liệu hotspot để chỉnh sửa...
        </div>
      ) : null}

      {loadHotspotError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {loadHotspotError}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {submitMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {submitMessage}
        </div>
      ) : null}

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div
          className={`grid gap-4 ${
            createdHotspot ? "md:grid-cols-[1.8fr_1fr]" : ""
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="cq-section-title">Thông tin cơ bản</h2>
              <div className="mt-5 grid gap-4">
                <div>
                  <label className="cq-label mb-2 block">Tên hotspot</label>
                  <Input
                    value={formState.hotspotName}
                    onChange={(event) =>
                      updateField("hotspotName", event.target.value)
                    }
                    placeholder="Hãy nhập tên địa điểm"
                    className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="cq-label mb-2 block">Địa chỉ</label>
                  <Input
                    value={formState.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    placeholder="Hãy nhập địa chỉ"
                    className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Địa chỉ này sẽ dùng để định vị hotspot trên bản đồ.
                  </p>
                </div>
                <div>
                  <label className="cq-label mb-2 block">Mô tả</label>
                  <textarea
                    value={formState.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Hãy nhập mô tả ngắn cho địa điểm"
                    className="h-24 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="cq-label mb-2 block">
                    Thông tin lịch sử
                  </label>
                  <textarea
                    value={formState.historyInformation}
                    onChange={(event) =>
                      updateField("historyInformation", event.target.value)
                    }
                    placeholder="Hãy nhập thông tin lịch sử của địa điểm"
                    className="h-28 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="cq-label mb-2 block">XP thưởng</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.xp}
                      onChange={(event) =>
                        updateField("xp", event.target.value)
                      }
                      placeholder="Hãy nhập XP thưởng"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">Point thưởng</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.point}
                      onChange={(event) =>
                        updateField("point", event.target.value)
                      }
                      placeholder="Hãy nhập point thưởng"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="cq-label mb-2 block">Thẻ</label>
                  <select
                    value={tagSelectValue}
                    onChange={(event) =>
                      handleTagSelectChange(event.target.value)
                    }
                    disabled={isLoadingTags || availableTags.length === 0}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    <option value="" disabled>
                      {isLoadingTags
                        ? "Đang tải danh sách thẻ..."
                        : availableTags.length > 0
                          ? "Hãy chọn thẻ"
                          : "Chưa có thẻ nào khả dụng"}
                    </option>
                    {availableTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.tagId);

                      return (
                        <option
                          key={tag.tagId}
                          value={tag.tagId}
                          disabled={isSelected}
                        >
                          {tag.tagName}
                          {isSelected ? " - đã chọn" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {selectedTags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <button
                          key={tag.tagId}
                          type="button"
                          onClick={() => handleToggleTag(tag.tagId)}
                          className="rounded-full border border-[#F7DCE8] bg-[#FFF1F7] px-3 py-1.5 text-xs font-semibold text-[#D94A8D] shadow-sm transition hover:border-rose-200 hover:bg-rose-50"
                        >
                          #{buildTagToken(tag.tagName)} ×
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {selectedTags.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedTagIds([])}
                      className="mt-3 text-xs font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      Xóa tất cả thẻ đã chọn
                    </button>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    Chọn một hoặc nhiều thẻ nội dung cho hotspot này.
                  </p>
                  {tagError ? (
                    <p className="mt-2 text-xs font-medium text-rose-700">
                      {tagError}
                    </p>
                  ) : null}
                  {selectedTags.length > 0 ? (
                    <p className="mt-2 text-xs font-medium text-[#D94A8D]">
                      Đã chọn:{" "}
                      {selectedTags
                        .map((tag) => `#${buildTagToken(tag.tagName)}`)
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Chưa chọn thẻ nào.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="cq-section-title">Thông số trải nghiệm</h2>
              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="cq-label mb-2 block">Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={formState.latitude}
                      onChange={(event) =>
                        updateField("latitude", event.target.value)
                      }
                      placeholder="Hãy nhập vĩ độ"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={formState.longitude}
                      onChange={(event) =>
                        updateField("longitude", event.target.value)
                      }
                      placeholder="Hãy nhập kinh độ"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      Bán kính check-in
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.checkInRadius}
                      onChange={(event) =>
                        updateField("checkInRadius", event.target.value)
                      }
                      placeholder="Hãy nhập bán kính check-in"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời lượng tối thiểu (phút)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.estimatedDurationMin}
                      onChange={(event) =>
                        updateField("estimatedDurationMin", event.target.value)
                      }
                      placeholder="Hãy nhập thời lượng tối thiểu"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời lượng tối đa (phút)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.estimatedDurationMax}
                      onChange={(event) =>
                        updateField("estimatedDurationMax", event.target.value)
                      }
                      placeholder="Hãy nhập thời lượng tối đa"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời gian bắt đầu
                    </label>
                    <Input
                      type="time"
                      step="1"
                      value={formState.startTime}
                      onChange={(event) =>
                        updateField("startTime", event.target.value)
                      }
                      placeholder="Hãy nhập thời gian bắt đầu"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời gian kết thúc
                    </label>
                    <Input
                      type="time"
                      step="1"
                      value={formState.endTime}
                      onChange={(event) =>
                        updateField("endTime", event.target.value)
                      }
                      placeholder="Hãy nhập thời gian kết thúc"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">Giờ mở cửa</label>
                    <Input
                      type="time"
                      step="1"
                      value={formState.openingTime}
                      onChange={(event) =>
                        updateField("openingTime", event.target.value)
                      }
                      placeholder="Hãy nhập giờ mở cửa"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">Giờ đóng cửa</label>
                    <Input
                      type="time"
                      step="1"
                      value={formState.closingTime}
                      onChange={(event) =>
                        updateField("closingTime", event.target.value)
                      }
                      placeholder="Hãy nhập giờ đóng cửa"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="cq-section-title">Phương tiện</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                  <ImagePlus className="mx-auto mb-3 h-6 w-6" />
                  <p className="text-sm font-medium">Ảnh bìa</p>
                  <p className="text-xs text-slate-400">
                    JPG, PNG · tối đa 5 MB
                  </p>
                </div>
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                  <Video className="mx-auto mb-3 h-6 w-6" />
                  <p className="text-sm font-medium">Video giới thiệu</p>
                  <p className="text-xs text-slate-400">MP4 · tối đa 50 MB</p>
                </div>
              </div>
            </div>
          </div>

          {createdHotspot ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="cq-card-title">Kết quả từ API</p>
                    <p className="text-xs text-slate-500">
                      Đồng bộ các field backend vừa trả về sau khi tạo hotspot.
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-700">
                  <ResultRow
                    label="Hotspot ID"
                    value={
                      createdHotspot.hotspotId
                        ? String(createdHotspot.hotspotId)
                        : ""
                    }
                  />
                  <ResultRow
                    label="Trạng thái"
                    value={createdHotspot.status?.trim() || "Chưa có dữ liệu"}
                  />
                  <ResultRow
                    label="Tạo bởi user"
                    value={
                      typeof createdHotspot.createByUserId === "number"
                        ? String(createdHotspot.createByUserId)
                        : "Chưa có dữ liệu"
                    }
                  />
                  <ResultRow
                    label="Tạo lúc"
                    value={formatDateTime(createdHotspot.createdAt)}
                  />
                  <ResultRow
                    label="Cập nhật lúc"
                    value={formatDateTime(createdHotspot.updatedAt)}
                  />
                  <ResultRow
                    label="Toạ độ"
                    value={buildCoordinatesLabel(createdHotspot)}
                  />
                  <ResultRow
                    label="Thời lượng"
                    value={buildDurationLabel(createdHotspot)}
                  />
                  <ResultRow
                    label="Khung giờ"
                    value={buildTimeWindowLabel(createdHotspot)}
                  />
                  <ResultRow
                    label="Giờ mở cửa"
                    value={buildOpeningHoursLabel(createdHotspot)}
                  />
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tags trả về
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {createdHotspot.tags && createdHotspot.tags.length > 0 ? (
                        createdHotspot.tags.map((tag) => (
                          <span
                            key={tag.tagId}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            #{buildTagToken(tag.tagName)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          Chưa có dữ liệu tags.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HotspotCreatePageFallback() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
      Đang tải trình tạo hotspot...
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function buildCreatePayload(
  formState: HotspotFormState,
  selectedTagIds: number[],
): CreateHotspotPayload {
  if (selectedTagIds.length === 0) {
    throw new Error("Vui lòng chọn ít nhất một thẻ trước khi lưu hotspot.");
  }

  const hotspotName = formState.hotspotName.trim();
  const address = formState.address.trim();
  const description = formState.description.trim();
  const historyInformation = formState.historyInformation.trim();

  if (!hotspotName) {
    throw new Error("Vui lòng nhập tên hotspot.");
  }

  if (!address) {
    throw new Error("Vui lòng nhập địa chỉ hotspot.");
  }

  if (!description) {
    throw new Error("Vui lòng nhập mô tả hotspot.");
  }

  if (!historyInformation) {
    throw new Error("Vui lòng nhập thông tin lịch sử.");
  }

  const estimatedDurationMin = parseIntegerField(
    "thời lượng tối thiểu",
    formState.estimatedDurationMin,
  );
  const estimatedDurationMax = parseIntegerField(
    "thời lượng tối đa",
    formState.estimatedDurationMax,
  );

  if (estimatedDurationMin > estimatedDurationMax) {
    throw new Error(
      "Thời lượng tối thiểu không được lớn hơn thời lượng tối đa.",
    );
  }

  return {
    tagIds: selectedTagIds,
    hotspotName,
    address,
    description,
    historyInformation,
    latitude: parseDecimalField("latitude", formState.latitude),
    longitude: parseDecimalField("longitude", formState.longitude),
    checkInRadius: parseIntegerField(
      "bán kính check-in",
      formState.checkInRadius,
    ),
    xp: parseIntegerField("XP thưởng", formState.xp),
    point: parseIntegerField("point thưởng", formState.point),
    estimatedDurationMin,
    estimatedDurationMax,
    startTime: normalizeTimeForApi("thời gian bắt đầu", formState.startTime),
    endTime: normalizeTimeForApi("thời gian kết thúc", formState.endTime),
    openingTime: normalizeTimeForApi("giờ mở cửa", formState.openingTime),
    closingTime: normalizeTimeForApi("giờ đóng cửa", formState.closingTime),
  };
}

function parseDecimalField(label: string, value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`Vui lòng nhập ${label}.`);
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    throw new Error(`${label} không hợp lệ.`);
  }

  return parsedValue;
}

function parseIntegerField(label: string, value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`Vui lòng nhập ${label}.`);
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isInteger(parsedValue)) {
    throw new Error(`${label} phải là số nguyên.`);
  }

  return parsedValue;
}

function normalizeTimeForApi(label: string, value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`Vui lòng nhập ${label}.`);
  }

  if (/^\d{2}:\d{2}$/.test(normalizedValue)) {
    return `${normalizedValue}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  throw new Error(`${label} không đúng định dạng HH:mm hoặc HH:mm:ss.`);
}

function syncFormStateWithResponse(
  current: HotspotFormState,
  response: BackendHotspot,
): HotspotFormState {
  return {
    ...current,
    hotspotName: response.hotspotName?.trim() || current.hotspotName,
    address: response.address?.trim() || current.address,
    description: response.description?.trim() || current.description,
    historyInformation:
      response.historyInformation?.trim() || current.historyInformation,
    latitude: formatNumberInputValue(response.latitude, current.latitude),
    longitude: formatNumberInputValue(response.longitude, current.longitude),
    checkInRadius: formatNumberInputValue(
      response.checkInRadius,
      current.checkInRadius,
    ),
    xp: formatNumberInputValue(response.xp, current.xp),
    point: formatNumberInputValue(response.point, current.point),
    estimatedDurationMin: formatNumberInputValue(
      response.estimatedDurationMin,
      current.estimatedDurationMin,
    ),
    estimatedDurationMax: formatNumberInputValue(
      response.estimatedDurationMax,
      current.estimatedDurationMax,
    ),
    startTime: formatTimeInputValue(response.startTime, current.startTime),
    endTime: formatTimeInputValue(response.endTime, current.endTime),
    openingTime: formatTimeInputValue(
      response.openingTime,
      current.openingTime,
    ),
    closingTime: formatTimeInputValue(
      response.closingTime,
      current.closingTime,
    ),
  };
}

function formatNumberInputValue(
  value: number | null | undefined,
  fallback: string,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : fallback;
}

function formatTimeInputValue(
  value: string | null | undefined,
  fallback: string,
) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return fallback;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(normalizedValue)) {
    return normalizedValue.slice(0, 5);
  }

  if (/^\d{2}:\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  return fallback;
}

function formatDateTime(value: string | undefined) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function buildCoordinatesLabel(hotspot: BackendHotspot) {
  if (
    typeof hotspot.latitude !== "number" ||
    !Number.isFinite(hotspot.latitude) ||
    typeof hotspot.longitude !== "number" ||
    !Number.isFinite(hotspot.longitude)
  ) {
    return "Chưa có dữ liệu";
  }

  return `${hotspot.latitude}, ${hotspot.longitude}`;
}

function buildDurationLabel(hotspot: BackendHotspot) {
  if (
    typeof hotspot.estimatedDurationMin !== "number" ||
    typeof hotspot.estimatedDurationMax !== "number"
  ) {
    return "Chưa có dữ liệu";
  }

  return `${hotspot.estimatedDurationMin} - ${hotspot.estimatedDurationMax} phút`;
}

function buildTimeWindowLabel(hotspot: BackendHotspot) {
  if (!hotspot.startTime || !hotspot.endTime) {
    return "Chưa có dữ liệu";
  }

  return `${hotspot.startTime} - ${hotspot.endTime}`;
}

function buildOpeningHoursLabel(hotspot: BackendHotspot) {
  if (!hotspot.openingTime || !hotspot.closingTime) {
    return "Chưa có dữ liệu";
  }

  return `${hotspot.openingTime} - ${hotspot.closingTime}`;
}

function parseHotspotId(value: string | null) {
  if (!value) {
    return null;
  }

  const hotspotId = Number(value.trim());
  if (!Number.isInteger(hotspotId) || hotspotId <= 0) {
    return null;
  }

  return hotspotId;
}
