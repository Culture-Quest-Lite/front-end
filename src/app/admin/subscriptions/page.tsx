"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import {
  subscriptions as initialPlans,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/data/demo";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Check,
  X,
  CreditCard,
} from "lucide-react";

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Đang hoạt động",
  inactive: "Ngừng hoạt động",
  draft: "Bản nháp",
};

const statusClasses: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  draft: "bg-amber-100 text-amber-700",
};

function formatPrice(price: number, currency: string) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(price);
}

type FormData = Omit<SubscriptionPlan, "id" | "subscribers" | "createdAt">;

const emptyForm: FormData = {
  name: "",
  description: "",
  price: 0,
  currency: "VND",
  durationDays: 30,
  features: [""],
  status: "draft",
};

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((p) => p.status === "active").length,
      subscribers: plans.reduce((sum, p) => sum + p.subscribers, 0),
    }),
    [plans]
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
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      durationDays: plan.durationDays,
      features: [...plan.features],
      status: plan.status,
    });
    setEditingId(plan.id);
    setDialog("edit");
  }

  function handleSave() {
    if (!form.name.trim()) return;

    if (dialog === "create") {
      const newPlan: SubscriptionPlan = {
        ...form,
        id: `sub-${Date.now()}`,
        subscribers: 0,
        createdAt: new Date().toISOString(),
        features: form.features.filter((f) => f.trim()),
      };
      setPlans((prev) => [...prev, newPlan]);
      showToast("Đã tạo gói đăng ký mới.");
    } else if (editingId) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, ...form, features: form.features.filter((f) => f.trim()) }
            : p
        )
      );
      showToast("Đã cập nhật gói đăng ký.");
    }
    setDialog(null);
  }

  function handleDelete(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    showToast("Đã xóa gói đăng ký.");
  }

  function toggleStatus(id: string) {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "active" ? "inactive" : "active" }
          : p
      )
    );
    showToast("Đã cập nhật trạng thái gói.");
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
        subtitle="Tạo, chỉnh sửa và quản lý các gói subscription cho người dùng."
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tạo gói mới
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Tổng gói" value={String(stats.total)} icon={CreditCard} />
        <StatCard label="Đang hoạt động" value={String(stats.active)} icon={Check} />
        <StatCard label="Người đăng ký" value={stats.subscribers.toLocaleString("vi-VN")} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[plan.status]}`}>
                  {statusLabels[plan.status]}
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                {plan.price > 0 ? (
                  <span className="text-sm text-slate-500">/ {plan.durationDays} ngày</span>
                ) : null}
              </div>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tính năng</p>
              <ul className="mt-3 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                {plan.subscribers.toLocaleString("vi-VN")} người đăng ký · Tạo {new Date(plan.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>

            <div className="flex border-t border-slate-100">
              <button
                type="button"
                onClick={() => openEdit(plan)}
                className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" /> Sửa
              </button>
              <button
                type="button"
                onClick={() => toggleStatus(plan.id)}
                className="flex flex-1 items-center justify-center gap-1.5 border-x border-slate-100 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                {plan.status === "active" ? "Tạm ngưng" : "Kích hoạt"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(plan.id)}
                className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">
              {dialog === "create" ? "Tạo gói đăng ký mới" : "Chỉnh sửa gói"}
            </h2>
            <div className="mt-5 space-y-4">
              <Field label="Tên gói">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Explorer Pro"
                />
              </Field>
              <Field label="Mô tả">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Giá (VND)">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Thời hạn (ngày)">
                  <input
                    type="number"
                    value={form.durationDays}
                    onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
              </div>
              <Field label="Trạng thái">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as SubscriptionStatus })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </Field>
              <Field label="Tính năng">
                <div className="space-y-2">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={f}
                        onChange={(e) => {
                          const next = [...form.features];
                          next[i] = e.target.value;
                          setForm({ ...form, features: next });
                        }}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Tính năng..."
                      />
                      {form.features.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, features: form.features.filter((_, j) => j !== i) })}
                          className="rounded-xl border border-slate-200 px-2 text-slate-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, features: [...form.features, ""] })}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    + Thêm tính năng
                  </button>
                </div>
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialog(null)}>Huỷ</Button>
              <Button onClick={handleSave}>
                {dialog === "create" ? "Tạo gói" : "Lưu thay đổi"}
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
