"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import {
  adminApi,
  type SubscriptionPlan,
  type SubscriptionPlanStatus,
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
} from "lucide-react";

/**
 * Backend KHÔNG có field `planType` riêng (đã xác nhận qua response thật
 * của GET /api/admin/subscription-plans) — chỉ có `configLimit` là JSON tự
 * do. Vì vậy "loại gói" Premium/Partner ở đây là khái niệm THUẦN PHÍA
 * CLIENT, suy luận bằng cách so khớp các key có trong configLimit với 2
 * danh sách field định nghĩa sẵn (xem detectPlanType bên dưới) — không gửi
 * field này lên backend.
 */
type SubscriptionPlanType = "PREMIUM" | "PARTNER";

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
  PREMIUM: "Premium",
  PARTNER: "Partner",
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

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

/* ----------------------- Danh sách trường giới hạn theo loại gói ----------------------- */
/**
 * Dùng để: (1) hiển thị form chọn trường thay cho JSON tay, và (2) làm
 * "chữ ký" nhận diện loại gói từ configLimit thật (xem detectPlanType).
 * Đổi/thêm/bớt key tuỳ theo field thật mà backend đang dùng — chỉ cần khớp
 * tên key, vì configLimit là Map<String,Object> tự do.
 */
type LimitFieldType = "boolean" | "number";

interface LimitFieldDef {
  key: string;
  label: string;
  type: LimitFieldType;
  hint?: string;
}

const PREMIUM_LIMIT_FIELDS: LimitFieldDef[] = [
  { key: "adFree", label: "Không hiển thị quảng cáo", type: "boolean" },
  { key: "exclusiveRoutes", label: "Truy cập tuyến hành trình độc quyền", type: "boolean" },
  { key: "prioritySupport", label: "Hỗ trợ ưu tiên", type: "boolean" },
  { key: "maxOfflineDownloads", label: "Lượt tải ngoại tuyến tối đa", type: "number", hint: "0 = không giới hạn" },
  { key: "xpBoostPercent", label: "Tăng % điểm XP nhận được", type: "number" },
];

const PARTNER_LIMIT_FIELDS: LimitFieldDef[] = [
  { key: "maxVouchers", label: "Số voucher tối đa được tạo", type: "number", hint: "0 = không giới hạn" },
  { key: "maxActiveHotspots", label: "Số điểm đến tối đa được đăng", type: "number", hint: "0 = không giới hạn" },
  { key: "maxStaffAccounts", label: "Số tài khoản nhân viên tối đa", type: "number", hint: "0 = không giới hạn" },
  { key: "featuredPlacement", label: "Ưu tiên hiển thị (Featured)", type: "boolean" },
  { key: "analyticsAccess", label: "Truy cập báo cáo thống kê", type: "boolean" },
];

const LIMIT_FIELDS_BY_TYPE: Record<SubscriptionPlanType, LimitFieldDef[]> = {
  PREMIUM: PREMIUM_LIMIT_FIELDS,
  PARTNER: PARTNER_LIMIT_FIELDS,
};

/**
 * Suy luận loại gói từ configLimit thật trả về — so khớp key hiện có với
 * 2 danh sách field, bên nào khớp nhiều hơn thì là loại đó. Hoà nhau hoặc
 * configLimit rỗng -> mặc định PREMIUM. Đây là heuristic phía client, không
 * phải dữ liệu tuyệt đối từ backend.
 */
function detectPlanType(configLimit?: Record<string, unknown> | null): SubscriptionPlanType {
  if (!configLimit) return "PREMIUM";
  const keys = new Set(Object.keys(configLimit));
  const premiumMatches = PREMIUM_LIMIT_FIELDS.filter((f) => keys.has(f.key)).length;
  const partnerMatches = PARTNER_LIMIT_FIELDS.filter((f) => keys.has(f.key)).length;
  return partnerMatches > premiumMatches ? "PARTNER" : "PREMIUM";
}

/** Build object configLimit từ giá trị form — chỉ thêm key có giá trị "có nghĩa" (bool=true, số>0), giữ lại các key lạ không nằm trong danh sách field đã định nghĩa để không làm mất dữ liệu cũ khi sửa. */
function buildConfigLimit(
  planType: SubscriptionPlanType,
  values: Record<string, boolean | number>,
  extra: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = { ...extra };
  for (const field of LIMIT_FIELDS_BY_TYPE[planType]) {
    const value = values[field.key];
    if (field.type === "boolean") {
      if (value === true) result[field.key] = true;
    } else if (typeof value === "number" && value > 0) {
      result[field.key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/** Tách configLimit hiện có thành { values (field đã biết), extra (field lạ) } để hiển thị lên form sửa. */
function splitConfigLimit(
  planType: SubscriptionPlanType,
  configLimit: Record<string, unknown> | undefined | null,
): { values: Record<string, boolean | number>; extra: Record<string, unknown> } {
  const knownKeys = new Set(LIMIT_FIELDS_BY_TYPE[planType].map((f) => f.key));
  const values: Record<string, boolean | number> = {};
  const extra: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(configLimit ?? {})) {
    if (knownKeys.has(key) && (typeof value === "boolean" || typeof value === "number")) {
      values[key] = value;
    } else {
      extra[key] = value;
    }
  }

  return { values, extra };
}

type FormData = {
  planType: SubscriptionPlanType;
  subscriptionPlanName: string;
  subscriptionPlanDescription: string;
  priceMonthly: number;
  priceYearly: number;
  configLimitValues: Record<string, boolean | number>;
  extraConfigLimit: Record<string, unknown>;
};

const emptyForm: FormData = {
  planType: "PREMIUM",
  subscriptionPlanName: "",
  subscriptionPlanDescription: "",
  priceMonthly: 0,
  priceYearly: 0,
  configLimitValues: {},
  extraConfigLimit: {},
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
  const [typeFilter, setTypeFilter] = useState<SubscriptionPlanType | "all">("all");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getSubscriptionPlans({
        page: 0,
        size: 50,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setPlans(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách gói dịch vụ.");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const filteredPlans = useMemo(() => {
    if (typeFilter === "all") return plans;
    return plans.filter((p) => detectPlanType(p.configLimit) === typeFilter);
  }, [plans, typeFilter]);

  const stats = useMemo(() => {
    let premium = 0;
    let partner = 0;
    for (const p of plans) {
      if (detectPlanType(p.configLimit) === "PARTNER") partner += 1;
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
    setForm(emptyForm);
    setEditingId(null);
    setDialog("create");
  }

  function openEdit(plan: SubscriptionPlan) {
    const planType = detectPlanType(plan.configLimit);
    const { values, extra } = splitConfigLimit(planType, plan.configLimit);
    setForm({
      planType,
      subscriptionPlanName: plan.subscriptionPlanName,
      subscriptionPlanDescription: plan.subscriptionPlanDescription ?? "",
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      configLimitValues: values,
      extraConfigLimit: extra,
    });
    setEditingId(plan.subscriptionPlanId);
    setDialog("edit");
  }

  function handlePlanTypeChange(nextType: SubscriptionPlanType) {
    setForm((f) => ({
      ...f,
      planType: nextType,
      // Đổi loại gói -> danh sách field giới hạn khác hẳn, reset để tránh
      // gửi nhầm field của loại cũ.
      configLimitValues: {},
      extraConfigLimit: {},
    }));
  }

  async function handleSave() {
    if (!form.subscriptionPlanName.trim()) {
      showToast("Tên gói không được để trống.");
      return;
    }

    setSubmitting(true);
    try {
      // KHÔNG gửi field "planType" — backend không có field này, loại gói
      // chỉ tồn tại ở phía client (suy luận từ configLimit).
      const payload = {
        subscriptionPlanName: form.subscriptionPlanName.trim(),
        subscriptionPlanDescription: form.subscriptionPlanDescription.trim() || undefined,
        priceMonthly: form.priceMonthly,
        priceYearly: form.priceYearly,
        configLimit: buildConfigLimit(form.planType, form.configLimitValues, form.extraConfigLimit),
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
      showToast(err instanceof Error ? err.message : "Không thể lưu gói đăng ký.");
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
      showToast(err instanceof Error ? err.message : "Không thể xóa gói đăng ký.");
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
        subtitle="Tạo, chỉnh sửa và quản lý các gói Premium (người dùng) và Partner (đối tác)."
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tạo gói mới
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Tổng gói" value={String(stats.total)} icon={CreditCard} iconClass="bg-blue-50 text-blue-600" />
        <StatCard label="Đang hoạt động" value={String(stats.active)} icon={Check} iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard label="Premium" value={String(stats.premium)} icon={Crown} iconClass="bg-violet-50 text-violet-600" />
        <StatCard label="Partner" value={String(stats.partner)} icon={Briefcase} iconClass="bg-amber-50 text-amber-600" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { value: "all", label: "Tất cả" },
            { value: "PREMIUM", label: "Premium" },
            { value: "PARTNER", label: "Partner" },
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
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải gói dịch vụ...
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
          Chưa có gói dịch vụ nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredPlans.map((plan) => {
            const planType = detectPlanType(plan.configLimit);
            const PlanTypeIcon = planTypeIcons[planType];
            return (
              <div
                key={plan.subscriptionPlanId}
                className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md ${planTypeBorderClasses[planType]}`}
              >
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{plan.subscriptionPlanName}</h3>
                      <p className="mt-1 text-sm text-slate-500">{plan.subscriptionPlanDescription}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${planTypeBadgeClasses[planType]}`}
                      >
                        <PlanTypeIcon className="h-3.5 w-3.5" /> {planTypeLabels[planType]}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[plan.status]}`}>
                        {statusLabels[plan.status]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Giá tháng</p>
                      <p className="text-lg font-bold text-slate-900">{formatPrice(plan.priceMonthly)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Giá năm</p>
                      <p className="text-lg font-bold text-slate-900">{formatPrice(plan.priceYearly)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {plan.configLimit && Object.keys(plan.configLimit).length > 0 ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quyền lợi / Giới hạn</p>
                      <ul className="mt-2 space-y-1.5">
                        {LIMIT_FIELDS_BY_TYPE[planType]
                          .filter((field) => plan.configLimit?.[field.key] !== undefined)
                          .map((field) => (
                            <li key={field.key} className="flex items-center gap-2 text-sm text-slate-700">
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              {field.type === "boolean"
                                ? field.label
                                : `${field.label}: ${plan.configLimit?.[field.key]}`}
                            </li>
                          ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">Chưa thiết lập quyền lợi/giới hạn.</p>
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
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onPlanTypeChange: (type: SubscriptionPlanType) => void;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const fieldDefs = LIMIT_FIELDS_BY_TYPE[form.planType];

  const previewJson = useMemo(
    () => JSON.stringify(buildConfigLimit(form.planType, form.configLimitValues, form.extraConfigLimit) ?? {}, null, 2),
    [form.planType, form.configLimitValues, form.extraConfigLimit],
  );

  function setBooleanField(key: string, checked: boolean) {
    setForm((f) => ({ ...f, configLimitValues: { ...f.configLimitValues, [key]: checked } }));
  }

  function setNumberField(key: string, raw: string) {
    const num = Number(raw);
    setForm((f) => ({
      ...f,
      configLimitValues: { ...f.configLimitValues, [key]: Number.isFinite(num) ? num : 0 },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-900">
          {mode === "create" ? "Tạo gói đăng ký mới" : "Chỉnh sửa gói"}
        </h2>

        <div className="mt-5 space-y-4">
          <Field label="Loại gói">
            <div className="flex gap-2">
              {(["PREMIUM", "PARTNER"] as SubscriptionPlanType[]).map((type) => {
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
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Chỉ để chọn đúng bộ trường giới hạn bên dưới — backend không lưu field này, hệ
              thống sẽ tự nhận diện lại loại gói dựa vào các key có trong configLimit.
            </p>
          </Field>

          <Field label="Tên gói">
            <input
              value={form.subscriptionPlanName}
              onChange={(e) => setForm({ ...form, subscriptionPlanName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Gói Cơ Bản"
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              value={form.subscriptionPlanDescription}
              onChange={(e) => setForm({ ...form, subscriptionPlanDescription: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá tháng (VND)">
              <input
                type="number"
                min={0}
                value={form.priceMonthly}
                onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </Field>
            <Field label="Giá năm (VND)">
              <input
                type="number"
                min={0}
                value={form.priceYearly}
                onChange={(e) => setForm({ ...form, priceYearly: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </Field>
          </div>

          <Field label={`Quyền lợi / Giới hạn (${planTypeLabels[form.planType]})`}>
            <div className="space-y-3 rounded-xl border border-slate-200 p-3">
              {fieldDefs.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-700">{field.label}</p>
                    {field.hint ? <p className="text-xs text-slate-400">{field.hint}</p> : null}
                  </div>
                  {field.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(form.configLimitValues[field.key])}
                      onChange={(e) => setBooleanField(field.key, e.target.checked)}
                      className="h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={Number(form.configLimitValues[field.key] ?? 0)}
                      onChange={(e) => setNumberField(field.key, e.target.value)}
                      className="w-24 shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  )}
                </div>
              ))}
            </div>
          </Field>

          <details className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-slate-500">
              Xem JSON configLimit sẽ gửi cho backend
            </summary>
            <pre className="mt-2 overflow-x-auto text-xs text-slate-600">{previewJson}</pre>
          </details>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Huỷ
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "create" ? "Tạo gói" : "Lưu thay đổi"}
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
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}