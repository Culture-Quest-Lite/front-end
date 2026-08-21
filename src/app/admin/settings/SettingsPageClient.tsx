"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, PencilLine, RefreshCw, Save, X } from "lucide-react";
import { toast } from "react-toastify";

import { PageLoading } from "@/components/app/page-loading";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import {
  configApi,
  type CheckInRadiusConfig,
  type UpdateCheckInRadiusPayload,
} from "@/services/api";

type RadiusFormState = {
  minRadius: string;
  maxRadius: string;
  defaultRadius: string;
};

type RadiusFormErrors = Partial<Record<keyof RadiusFormState, string>>;

function createEmptyForm(): RadiusFormState {
  return {
    minRadius: "",
    maxRadius: "",
    defaultRadius: "",
  };
}

function createFormFromConfig(config: CheckInRadiusConfig): RadiusFormState {
  return {
    minRadius: String(config.minRadius),
    maxRadius: String(config.maxRadius),
    defaultRadius: String(config.defaultRadius),
  };
}

function formatRadiusLabel(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} m`;
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatUpdatedByLabel(value?: string | null) {
  return value?.trim() ? value.trim() : "Chưa có";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
}

function parseIntegerField(
  value: string,
  fieldLabel: string,
): { value?: number; error?: string } {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { error: `${fieldLabel} là bắt buộc.` };
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || !Number.isInteger(parsedValue)) {
    return { error: `${fieldLabel} phải là số nguyên.` };
  }

  if (parsedValue < 0) {
    return { error: `${fieldLabel} không được âm.` };
  }

  return { value: parsedValue };
}

function validateRadiusForm(form: RadiusFormState): {
  errors: RadiusFormErrors;
  payload?: UpdateCheckInRadiusPayload;
} {
  const errors: RadiusFormErrors = {};

  const minRadiusResult = parseIntegerField(
    form.minRadius,
    "Bán kính tối thiểu",
  );
  const maxRadiusResult = parseIntegerField(form.maxRadius, "Bán kính tối đa");
  const defaultRadiusResult = parseIntegerField(
    form.defaultRadius,
    "Bán kính mặc định",
  );

  if (minRadiusResult.error) {
    errors.minRadius = minRadiusResult.error;
  }

  if (maxRadiusResult.error) {
    errors.maxRadius = maxRadiusResult.error;
  }

  if (defaultRadiusResult.error) {
    errors.defaultRadius = defaultRadiusResult.error;
  }

  if (
    typeof minRadiusResult.value === "number" &&
    typeof maxRadiusResult.value === "number" &&
    minRadiusResult.value > maxRadiusResult.value
  ) {
    errors.maxRadius =
      "Bán kính tối đa phải lớn hơn hoặc bằng bán kính tối thiểu.";
  }

  if (
    typeof minRadiusResult.value === "number" &&
    typeof maxRadiusResult.value === "number" &&
    typeof defaultRadiusResult.value === "number" &&
    (defaultRadiusResult.value < minRadiusResult.value ||
      defaultRadiusResult.value > maxRadiusResult.value)
  ) {
    errors.defaultRadius =
      "Bán kính mặc định phải nằm trong khoảng tối thiểu và tối đa.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    payload: {
      minRadius: minRadiusResult.value!,
      maxRadius: maxRadiusResult.value!,
      defaultRadius: defaultRadiusResult.value!,
    },
  };
}

function doesConfigMatchPayload(
  config: CheckInRadiusConfig,
  payload: UpdateCheckInRadiusPayload,
) {
  return (
    config.minRadius === payload.minRadius &&
    config.maxRadius === payload.maxRadius &&
    config.defaultRadius === payload.defaultRadius
  );
}

export default function SettingsPageClient() {
  const [config, setConfig] = useState<CheckInRadiusConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form, setForm] = useState<RadiusFormState>(createEmptyForm);
  const [formErrors, setFormErrors] = useState<RadiusFormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadCheckInRadiusConfig(options?: { keepContent?: boolean }) {
    const keepContent = options?.keepContent ?? false;

    setLoadError("");

    if (keepContent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await configApi.getCheckInRadius();
      setConfig(response);
    } catch (error) {
      const message = getErrorMessage(error);
      setLoadError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function initializeCheckInRadiusConfig() {
      try {
        const response = await configApi.getCheckInRadius();

        if (!isMounted) {
          return;
        }

        setConfig(response);
        setLoadError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(getErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initializeCheckInRadiusConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleRefresh() {
    void loadCheckInRadiusConfig({ keepContent: config !== null });
  }

  function handleOpenEditModal() {
    if (!config) {
      return;
    }

    setForm(createFormFromConfig(config));
    setFormErrors({});
    setSubmitError("");
    setIsEditModalOpen(true);
  }

  function handleCloseEditModal() {
    if (isSubmitting) {
      return;
    }

    setIsEditModalOpen(false);
    setFormErrors({});
    setSubmitError("");
  }

  function handleInputChange(field: keyof RadiusFormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      setForm((current) => ({
        ...current,
        [field]: nextValue,
      }));
      setFormErrors((current) => ({
        ...current,
        [field]: "",
      }));
      setSubmitError("");
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { errors, payload } = validateRadiusForm(form);
    setFormErrors(errors);

    if (!payload) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const updatedConfig = await configApi.updateCheckInRadius(payload);
      setConfig(updatedConfig);
      setIsEditModalOpen(false);
      toast.success("Đã cập nhật bán kính địa điểm.");
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;

      if (typeof status === "number" && status >= 500) {
        try {
          const latestConfig = await configApi.getCheckInRadius();

          if (doesConfigMatchPayload(latestConfig, payload)) {
            setConfig(latestConfig);
            setIsEditModalOpen(false);
            setSubmitError("");
            toast.success(
              "Đã cập nhật bán kính địa điểm. Backend trả lỗi 5xx nhưng dữ liệu đã được lưu.",
            );
            return;
          }
        } catch {
          // Giữ nguyên lỗi PUT gốc nếu GET xác nhận lại cũng thất bại.
        }
      }

      const message = getErrorMessage(error);
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Bán kính địa điểm"
          subtitle="Phạm vi check-in được áp dụng theo cài đặt hệ thống."
        />

        {isLoading && !config ? (
          <PageLoading className="border border-slate-200 bg-[#FCFCFD]" />
        ) : loadError && !config ? (
          <section className="cq-admin-panel p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Không tải được cấu hình bán kính.
                </p>
                <p className="mt-1 text-sm text-slate-500">{loadError}</p>
              </div>
              <Button type="button" onClick={handleRefresh} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </div>
          </section>
        ) : config ? (
          <section className="cq-admin-panel overflow-hidden p-0">
            {loadError ? (
              <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
                {loadError}
              </div>
            ) : null}

            <table className="cq-admin-table">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr>
                  <th>Cấu hình</th>
                  <th>Tối thiểu</th>
                  <th>Tối đa</th>
                  <th>Mặc định</th>
                  <th>Ngày cập nhật</th>
                  <th>Cập nhật bởi</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <p className="text-slate-700">
                      Bán kính check-in
                    </p>
                  </td>
                  <td>
                    <p className="text-slate-700">
                      {formatRadiusLabel(config.minRadius)}
                    </p>
                  </td>
                  <td>
                    <p className="text-slate-700">
                      {formatRadiusLabel(config.maxRadius)}
                    </p>
                  </td>
                  <td>
                    <p className="text-slate-700">
                      {formatRadiusLabel(config.defaultRadius)}
                    </p>
                  </td>
                  <td>
                    <p className="text-slate-700">
                      {formatDateTimeLabel(config.updatedAt)}
                    </p>
                  </td>
                  <td>
                    <p className="text-slate-700">
                      {formatUpdatedByLabel(config.updatedBy)}
                    </p>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenEditModal}
                        disabled={isRefreshing || isSubmitting}
                        className="gap-1.5"
                      >
                        <PencilLine className="h-4 w-4" />
                        Chỉnh sửa
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}
      </div>

      {isEditModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={handleCloseEditModal}
            aria-label="Đóng modal"
          />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-slate-900">
                  Chỉnh sửa bán kính
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cập nhật giới hạn và bán kính mặc định cho cấu hình check-in.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <RadiusInputField
                    id="minRadius"
                    label="Bán kính tối thiểu"
                    value={form.minRadius}
                    error={formErrors.minRadius}
                    onChange={handleInputChange("minRadius")}
                  />

                  <RadiusInputField
                    id="maxRadius"
                    label="Bán kính tối đa"
                    value={form.maxRadius}
                    error={formErrors.maxRadius}
                    onChange={handleInputChange("maxRadius")}
                  />

                  <RadiusInputField
                    id="defaultRadius"
                    label="Bán kính mặc định"
                    value={form.defaultRadius}
                    error={formErrors.defaultRadius}
                    onChange={handleInputChange("defaultRadius")}
                  />
                </div>

                {submitError ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 flex justify-end gap-3 border-t border-slate-100 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function RadiusInputField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-slate-600"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={onChange}
          aria-invalid={error ? "true" : "false"}
          className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            error
              ? "border-red-300 focus:border-red-300 focus:ring-red-100"
              : ""
          }`}
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
          m
        </span>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
