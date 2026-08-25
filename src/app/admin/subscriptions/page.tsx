"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { PageLoading } from "@/components/app/page-loading";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import {
  adminApi,
  type SubscriptionPlan,
  type SubscriptionPlanStatus,
  type SubscriptionPlanType,
} from "@/services/api/admin/adminApi";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Check,
  CreditCard,
  Loader2,
  Crown,
  Briefcase,
  X,
} from "lucide-react";

/**
 * `planType` là field độc lập của SubscriptionPlan.
 * `configLimit` chỉ chứa quyền lợi và giới hạn của gói.
 */
type ConfigValueType = "boolean" | "number" | "text";
type ConfigValue = boolean | number | string;

const LEGACY_CONFIG_KEYS = new Set(["planType"]);

type ConfigItem = {
  id: string;
  key: string;
  type: ConfigValueType;
  value: ConfigValue;
};


const configLabelsVi: Record<string, string> = {
  adFree: "Không hiển thị quảng cáo",
  exclusiveRoutes: "Truy cập tuyến độc quyền",
  prioritySupport: "Hỗ trợ ưu tiên",
  maxOfflineDownloads: "Số lượt tải ngoại tuyến tối đa",
  xpBoostPercent: "Tăng phần trăm XP",
  maxVouchers: "Số voucher tối đa",
  maxActiveHotspots: "Số điểm đến được đăng tối đa",
  maxStaffAccounts: "Số tài khoản nhân viên tối đa",
  featuredPlacement: "Ưu tiên hiển thị",
  analyticsAccess: "Truy cập báo cáo thống kê",
};

const configKeySuggestionsByType: Record<SubscriptionPlanType, { key: string; label: string }[]> = {
  PREMIUM: [
    { key: "adFree", label: "Không hiển thị quảng cáo" },
    { key: "exclusiveRoutes", label: "Truy cập tuyến độc quyền" },
    { key: "prioritySupport", label: "Hỗ trợ ưu tiên" },
    { key: "maxOfflineDownloads", label: "Số lượt tải ngoại tuyến tối đa" },
    { key: "xpBoostPercent", label: "Tăng phần trăm XP" },
  ],
  PARTNER: [
    { key: "maxVouchers", label: "Số voucher tối đa" },
    { key: "maxActiveHotspots", label: "Số điểm đến được đăng tối đa" },
    { key: "maxStaffAccounts", label: "Số tài khoản nhân viên tối đa" },
    { key: "featuredPlacement", label: "Ưu tiên hiển thị" },
    { key: "analyticsAccess", label: "Truy cập báo cáo thống kê" },
  ],
};

const statusLabels: Record<SubscriptionPlanStatus, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  DELETED: "Đã xóa",
};

const statusClasses: Record<SubscriptionPlanStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  DELETED: "bg-red-100 text-red-700",
};

const planTypeLabels: Record<SubscriptionPlanType, string> = {
  PREMIUM: "Gói Premium",
  PARTNER: "Gói đối tác",
};

const planTypeBadgeClasses: Record<SubscriptionPlanType, string> = {
  PREMIUM: "bg-violet-100 text-violet-700",
  PARTNER: "bg-amber-100 text-amber-700",
};

const planTypeBorderClasses: Record<SubscriptionPlanType, string> = {
  PREMIUM: "border-l-4 border-l-violet-400",
  PARTNER: "border-l-4 border-l-amber-400",
};

const planTypeIcons: Record<SubscriptionPlanType, typeof Crown> = {
  PREMIUM: Crown,
  PARTNER: Briefcase,
};

const suggestedPremiumConfigs: ConfigItem[] = [
  createConfigItem("adFree", "boolean", true),
  createConfigItem("exclusiveRoutes", "boolean", true),
  createConfigItem("prioritySupport", "boolean", true),
  createConfigItem("maxOfflineDownloads", "number", 10),
  createConfigItem("xpBoostPercent", "number", 20),
];

const suggestedPartnerConfigs: ConfigItem[] = [
  createConfigItem("maxVouchers", "number", 50),
  createConfigItem("maxActiveHotspots", "number", 10),
  createConfigItem("maxStaffAccounts", "number", 3),
  createConfigItem("featuredPlacement", "boolean", true),
  createConfigItem("analyticsAccess", "boolean", true),
];

const suggestedConfigsByType: Record<SubscriptionPlanType, ConfigItem[]> = {
  PREMIUM: suggestedPremiumConfigs,
  PARTNER: suggestedPartnerConfigs,
};

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createConfigItem(
  key = "",
  type: ConfigValueType = "boolean",
  value?: ConfigValue,
): ConfigItem {
  return {
    id: createId(),
    key,
    type,
    value: value ?? getDefaultValueByType(type),
  };
}

function getDefaultValueByType(type: ConfigValueType): ConfigValue {
  if (type === "boolean") return true;
  if (type === "number") return 0;
  return "";
}

function isSubscriptionPlanType(value: unknown): value is SubscriptionPlanType {
  return value === "PREMIUM" || value === "PARTNER";
}

function valueToConfigType(value: unknown): ConfigValueType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "text";
}

function valueToConfigValue(value: unknown): ConfigValue {
  if (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  )
    return value;
  return JSON.stringify(value ?? "");
}

function prettifyConfigKey(key: string) {
  if (configLabelsVi[key]) return configLabelsVi[key];

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatConfigValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function resolvePlanType(plan: SubscriptionPlan): SubscriptionPlanType {
  if (isSubscriptionPlanType(plan.planType)) return plan.planType;

  // Chỉ dùng cho dữ liệu cũ trước khi backend trả field planType.
  const keys = new Set(Object.keys(plan.configLimit ?? {}));
  const partnerKeys = [
    "maxVouchers",
    "maxActiveHotspots",
    "maxStaffAccounts",
    "featuredPlacement",
    "analyticsAccess",
  ];
  const premiumKeys = [
    "adFree",
    "exclusiveRoutes",
    "prioritySupport",
    "maxOfflineDownloads",
    "xpBoostPercent",
  ];
  const partnerMatches = partnerKeys.filter((key) => keys.has(key)).length;
  const premiumMatches = premiumKeys.filter((key) => keys.has(key)).length;

  return partnerMatches > premiumMatches ? "PARTNER" : "PREMIUM";
}

function configLimitToItems(
  configLimit?: Record<string, unknown> | null,
): ConfigItem[] {
  return Object.entries(configLimit ?? {})
    .filter(([key]) => !LEGACY_CONFIG_KEYS.has(key))
    .map(([key, value]) =>
      createConfigItem(
        key,
        valueToConfigType(value),
        valueToConfigValue(value),
      ),
    );
}

function buildConfigLimit(items: ConfigItem[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const item of items) {
    const key = item.key.trim();
    if (!key) continue;

    if (item.type === "boolean") {
      result[key] = Boolean(item.value);
      continue;
    }

    if (item.type === "number") {
      const numberValue = Number(item.value);
      result[key] = Number.isFinite(numberValue) ? numberValue : 0;
      continue;
    }

    result[key] = String(item.value ?? "").trim();
  }

  return result;
}

function getVisibleConfigEntries(configLimit?: Record<string, unknown> | null) {
  return Object.entries(configLimit ?? {}).filter(
    ([key]) => !LEGACY_CONFIG_KEYS.has(key),
  );
}

type FormData = {
  planType: SubscriptionPlanType;
  subscriptionPlanName: string;
  subscriptionPlanDescription: string;
  priceMonthly: number;
  priceYearly: number;
  configItems: ConfigItem[];
};

const emptyForm: FormData = {
  planType: "PREMIUM",
  subscriptionPlanName: "",
  subscriptionPlanDescription: "",
  priceMonthly: 0,
  priceYearly: 0,
  configItems: [],
};

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<SubscriptionPlanType | "all">(
    "all",
  );

  const requestPlans = useCallback(async () => {
    return adminApi.getSubscriptionPlans({
      page: 0,
      size: 50,
      sortBy: "createdAt",
      sortDir: "desc",
    });
  }, []);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestPlans();
      setPlans(response.content);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách gói dịch vụ.",
      );
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [requestPlans]);

  useEffect(() => {
    let cancelled = false;

    async function syncPlans() {
      try {
        const response = await requestPlans();
        if (cancelled) return;
        setPlans(response.content);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách gói dịch vụ.",
        );
        setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void syncPlans();
    return () => {
      cancelled = true;
    };
  }, [requestPlans]);

  const filteredPlans = useMemo(() => {
    if (typeFilter === "all") return plans;
    return plans.filter((p) => resolvePlanType(p) === typeFilter);
  }, [plans, typeFilter]);

  const stats = useMemo(() => {
    let premium = 0;
    let partner = 0;
    for (const p of plans) {
      if (resolvePlanType(p) === "PARTNER") partner += 1;
      else premium += 1;
    }
    return {
      total: plans.length,
      active: plans.filter((p) => p.status === "ACTIVE").length,
      premium,
      partner,
    };
  }, [plans]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openCreate() {
    setForm({
      ...emptyForm,
      configItems: suggestedConfigsByType.PREMIUM.map((item) => ({
        ...item,
        id: createId(),
      })),
    });
    setEditingId(null);
    setDialog("create");
  }

  function openEdit(plan: SubscriptionPlan) {
    const planType = resolvePlanType(plan);
    setForm({
      planType,
      subscriptionPlanName: plan.subscriptionPlanName,
      subscriptionPlanDescription: plan.subscriptionPlanDescription ?? "",
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      configItems: configLimitToItems(plan.configLimit),
    });
    setEditingId(plan.subscriptionPlanId);
    setDialog("edit");
  }

  function handlePlanTypeChange(nextType: SubscriptionPlanType) {
    setForm((f) => ({
      ...f,
      planType: nextType,
      configItems: suggestedConfigsByType[nextType].map((item) => ({
        ...item,
        id: createId(),
      })),
    }));
  }

  function validateForm() {
    if (!form.subscriptionPlanName.trim()) {
      return "Tên gói không được để trống.";
    }

    const keys = form.configItems
      .map((item) => item.key.trim())
      .filter(Boolean);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      return "Key config không được trùng nhau.";
    }

    const invalidKey = keys.find((key) => !/^[\p{L}\p{N}_ ]+$/u.test(key));
    if (invalidKey) {
      return `Key "${invalidKey}" không hợp lệ. Key chỉ được chứa chữ, số, dấu gạch dưới hoặc khoảng trắng.`;
    }

    return null;
  }

  async function handleSave() {
    const validationError = validateForm();
    if (validationError) {
      showToast(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subscriptionPlanName: form.subscriptionPlanName.trim(),
        subscriptionPlanDescription:
          form.subscriptionPlanDescription.trim() || undefined,
        priceMonthly: form.priceMonthly,
        priceYearly: form.priceYearly,
        planType: form.planType,
        configLimit: buildConfigLimit(form.configItems),
      };

      if (dialog === "create") {
        await adminApi.createSubscriptionPlan(payload);
        showToast("Đã tạo gói đăng ký mới.");
      } else if (editingId) {
        await adminApi.updateSubscriptionPlan(editingId, payload);
        showToast("Đã cập nhật gói đăng ký.");
      }
      setDialog(null);
      await loadPlans();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể lưu gói đăng ký.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setSubmitting(true);
    try {
      await adminApi.deleteSubscriptionPlan(id);
      showToast("Đã xóa gói đăng ký.");
      await loadPlans();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể xóa gói đăng ký.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Quản lý gói đăng ký"
        subtitle="Tạo, chỉnh sửa và quản lý gói Premium cho người dùng và gói đăng ký cho đối tác."
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tạo gói mới
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Tổng gói"
          value={String(stats.total)}
          icon={CreditCard}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Đang hoạt động"
          value={String(stats.active)}
          icon={Check}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Gói Premium"
          value={String(stats.premium)}
          icon={Crown}
          iconClass="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Gói đối tác"
          value={String(stats.partner)}
          icon={Briefcase}
          iconClass="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { value: "all", label: "Tất cả" },
            { value: "PREMIUM", label: "Gói Premium" },
            { value: "PARTNER", label: "Gói đối tác" },
          ] as { value: SubscriptionPlanType | "all"; label: string }[]
        ).map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTypeFilter(item.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              typeFilter === item.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoading className="min-h-[320px]" />
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
          Chưa có gói dịch vụ nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredPlans.map((plan) => {
            const planType = resolvePlanType(plan);
            const PlanTypeIcon = planTypeIcons[planType];
            const visibleConfigs = getVisibleConfigEntries(plan.configLimit);

            return (
              <div
                key={plan.subscriptionPlanId}
                className={`cq-admin-panel flex h-full flex-col transition hover:shadow-md ${planTypeBorderClasses[planType]}`}
              >
                <div className="border-b border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {plan.subscriptionPlanName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {plan.subscriptionPlanDescription}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${planTypeBadgeClasses[planType]}`}
                      >
                        <PlanTypeIcon className="h-3.5 w-3.5" />{" "}
                        {planTypeLabels[planType]}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[plan.status]}`}
                      >
                        {statusLabels[plan.status]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Giá tháng</p>
                      <p className="text-base font-bold text-slate-900">
                        {formatPrice(plan.priceMonthly)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Giá năm</p>
                      <p className="text-base font-bold text-slate-900">
                        {formatPrice(plan.priceYearly)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4">
                  {visibleConfigs.length > 0 ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Quyền lợi / Giới hạn
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {visibleConfigs.map(([key, value]) => (
                          <li
                            key={key}
                            className="flex items-center gap-2 text-sm text-slate-700"
                          >
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <span>
                              {prettifyConfigKey(key)}:{" "}
                              <span className="font-medium">
                                {formatConfigValue(value)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Chưa thiết lập quyền lợi/giới hạn.
                    </p>
                  )}
                  {plan.createdAt ? (
                    <p className="mt-4 text-xs text-slate-500">
                      Tạo {new Date(plan.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  ) : null}
                </div>

                <div className="flex border-t border-slate-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => openEdit(plan)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Pencil className="h-4 w-4" /> Sửa
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleDelete(plan.subscriptionPlanId)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialog ? (
        <SubscriptionFormDialog
          mode={dialog}
          form={form}
          setForm={setForm}
          onPlanTypeChange={handlePlanTypeChange}
          submitting={submitting}
          onCancel={() => setDialog(null)}
          onSubmit={() => void handleSave()}
        />
      ) : null}
    </div>
  );
}

function SubscriptionFormDialog({
  mode,
  form,
  setForm,
  onPlanTypeChange,
  submitting,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  onPlanTypeChange: (type: SubscriptionPlanType) => void;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  function addConfigItem() {
    setForm((f) => ({
      ...f,
      configItems: [...f.configItems, createConfigItem()],
    }));
  }

  function removeConfigItem(id: string) {
    setForm((f) => ({
      ...f,
      configItems: f.configItems.filter((item) => item.id !== id),
    }));
  }

  function updateConfigItem(id: string, patch: Partial<ConfigItem>) {
    setForm((f) => ({
      ...f,
      configItems: f.configItems.map((item) => {
        if (item.id !== id) return item;

        if (patch.type && patch.type !== item.type) {
          return {
            ...item,
            ...patch,
            value: getDefaultValueByType(patch.type),
          };
        }

        return { ...item, ...patch };
      }),
    }));
  }

  function applySuggestedConfigs() {
    setForm((f) => ({
      ...f,
      configItems: suggestedConfigsByType[f.planType].map((item) => ({
        ...item,
        id: createId(),
      })),
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {mode === "create" ? "Tạo gói đăng ký mới" : "Chỉnh sửa gói"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Chọn loại gói, sau đó thêm quyền lợi và giới hạn cho gói bằng tiếng Việt.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <Field label="Loại gói">
              <div className="flex gap-2">
                {(["PREMIUM", "PARTNER"] as SubscriptionPlanType[]).map(
                  (type) => {
                    const Icon = planTypeIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onPlanTypeChange(type)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          form.planType === type
                            ? type === "PREMIUM"
                              ? "border-violet-500 bg-violet-50 text-violet-700"
                              : "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" /> {planTypeLabels[type]}
                      </button>
                    );
                  },
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Loại gói được gửi bằng field planType độc lập; configLimit chỉ lưu quyền lợi và giới hạn.
              </p>
            </Field>

            <Field label="Tên gói">
              <input
                value={form.subscriptionPlanName}
                onChange={(e) =>
                  setForm({ ...form, subscriptionPlanName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ví dụ: Gói Premium, Gói đối tác"
              />
            </Field>

            <Field label="Mô tả">
              <textarea
                value={form.subscriptionPlanDescription}
                onChange={(e) =>
                  setForm({
                    ...form,
                    subscriptionPlanDescription: e.target.value,
                  })
                }
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Mô tả ngắn về quyền lợi của gói"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Giá tháng (VND)">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.priceMonthly === 0 ? "" : form.priceMonthly}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.,]/g, "");
                    const normalized = raw.replace(/,/g, ".");
                    setForm({
                      ...form,
                      priceMonthly: normalized === "" ? 0 : Number(normalized),
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>
              <Field label="Giá năm (VND)">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.priceYearly === 0 ? "" : form.priceYearly}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.,]/g, "");
                    const normalized = raw.replace(/,/g, ".");
                    setForm({
                      ...form,
                      priceYearly: normalized === "" ? 0 : Number(normalized),
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>
            </div>

            <Field label={`Quyền lợi / Giới hạn (${planTypeLabels[form.planType]})`}>
              <div className="rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3">
                  <div className="text-sm text-slate-500">
                    <p>Thêm quyền lợi hoặc giới hạn cho gói ngay trong modal.</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {configKeySuggestionsByType[form.planType].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              configItems: [
                                ...f.configItems,
                                createConfigItem(item.key, valueToConfigType(false), true),
                              ],
                            }))
                          }
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applySuggestedConfigs}
                    >
                      Sử dụng mẫu
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5"
                      onClick={addConfigItem}
                    >
                      <Plus className="h-4 w-4" /> Thêm mục
                    </Button>
                  </div>
                </div>

                {form.configItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Chưa có quyền lợi hoặc giới hạn nào. Dùng nút bên trên để thêm mục mới.
                  </div>
                ) : (
                  <div className="space-y-3 p-3">
                    {form.configItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-[1fr_140px_1fr_36px]"
                      >
                        <input
                          value={item.key}
                          onChange={(e) =>
                            updateConfigItem(item.id, { key: e.target.value })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Tên mục, ví dụ: Số voucher tối đa hoặc Không hiển thị quảng cáo"
                        />

                        <select
                          value={item.type}
                          onChange={(e) =>
                            updateConfigItem(item.id, {
                              type: e.target.value as ConfigValueType,
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="boolean">Có / Không</option>
                          <option value="number">Giá trị số</option>
                          <option value="text">Nội dung văn bản</option>
                        </select>

                        {item.type === "boolean" ? (
                          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(item.value)}
                              onChange={(e) =>
                                updateConfigItem(item.id, {
                                  value: e.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Có quyền lợi này
                          </label>
                        ) : item.type === "number" ? (
                          <input
                            type="number"
                            min={0}
                            value={Number(item.value ?? 0)}
                            onChange={(e) =>
                              updateConfigItem(item.id, {
                                value: Number(e.target.value),
                              })
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Nhập số lượng hoặc giới hạn"
                          />
                        ) : (
                          <input
                            value={String(item.value ?? "")}
                            onChange={(e) =>
                              updateConfigItem(item.id, {
                                value: e.target.value,
                              })
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Nhập nội dung văn bản"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removeConfigItem(item.id)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                          aria-label="Xóa mục"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-3 border-t border-slate-100 p-6">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Huỷ
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "create" ? (
              "Tạo gói"
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}
