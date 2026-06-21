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
  X,
  CreditCard,
  Loader2,
} from "lucide-react";

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

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

type FormData = {
  subscriptionPlanName: string;
  subscriptionPlanDescription: string;
  priceMonthly: number;
  priceYearly: number;
  configLimitText: string;
};

const emptyForm: FormData = {
  subscriptionPlanName: "",
  subscriptionPlanDescription: "",
  priceMonthly: 0,
  priceYearly: 0,
  configLimitText: "",
};

function parseConfigLimit(text: string): Record<string, unknown> | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getSubscriptionPlans({ page: 0, size: 50, sortBy: "createdAt", sortDir: "desc" });
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

  const stats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((p) => p.status === "ACTIVE").length,
    }),
    [plans],
  );

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
    setForm({
      subscriptionPlanName: plan.subscriptionPlanName,
      subscriptionPlanDescription: plan.subscriptionPlanDescription ?? "",
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      configLimitText: plan.configLimit ? JSON.stringify(plan.configLimit, null, 2) : "",
    });
    setEditingId(plan.subscriptionPlanId);
    setDialog("edit");
  }

  async function handleSave() {
    if (!form.subscriptionPlanName.trim()) return;

    const configLimit = parseConfigLimit(form.configLimitText);
    if (form.configLimitText.trim() && !configLimit) {
      showToast("Cấu hình giới hạn phải là JSON hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subscriptionPlanName: form.subscriptionPlanName.trim(),
        subscriptionPlanDescription: form.subscriptionPlanDescription.trim() || undefined,
        priceMonthly: form.priceMonthly,
        priceYearly: form.priceYearly,
        configLimit,
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
        subtitle="Tạo, chỉnh sửa và quản lý các gói subscription cho đối tác."
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tạo gói mới
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="Tổng gói" value={String(stats.total)} icon={CreditCard} />
        <StatCard label="Đang hoạt động" value={String(stats.active)} icon={Check} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải gói dịch vụ...
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
          Chưa có gói dịch vụ nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.subscriptionPlanId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{plan.subscriptionPlanName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{plan.subscriptionPlanDescription}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[plan.status]}`}>
                    {statusLabels[plan.status]}
                  </span>
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
                {plan.configLimit ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Giới hạn</p>
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                      {JSON.stringify(plan.configLimit, null, 2)}
                    </pre>
                  </>
                ) : null}
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
          ))}
        </div>
      )}

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">
              {dialog === "create" ? "Tạo gói đăng ký mới" : "Chỉnh sửa gói"}
            </h2>
            <div className="mt-5 space-y-4">
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
                    value={form.priceMonthly}
                    onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Giá năm (VND)">
                  <input
                    type="number"
                    value={form.priceYearly}
                    onChange={(e) => setForm({ ...form, priceYearly: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
              </div>
              <Field label="Giới hạn (JSON)">
                <textarea
                  value={form.configLimitText}
                  onChange={(e) => setForm({ ...form, configLimitText: e.target.value })}
                  rows={3}
                  placeholder='{"maxPosts": 20}'
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
                Huỷ
              </Button>
              <Button onClick={() => void handleSave()} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : dialog === "create" ? "Tạo gói" : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
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
