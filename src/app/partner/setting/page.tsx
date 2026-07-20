"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import {
  partnerApi,
  type CurrentUserProfileResponse,
} from "@/services/api/partner/partnerApi";
import {
  partnerSubscriptionApi,
  type PartnerSubscriptionResponse,
} from "@/services/api/partner/partnerSubscriptionApi";
import { Store, UserCog } from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Tạm ngưng",
  EXPIRED: "Hết hạn",
  DELETED: "Đã xoá",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatCurrency(value?: number | null) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function PartnerSettingPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUserProfileResponse | null>(null);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoading(true);
        setLoadError(null);

        const [user, subscriptionResponse] = await Promise.all([
          partnerApi.getCurrentUser(),
          partnerSubscriptionApi.getMySubscriptions(),
        ]);

        if (cancelled) return;

        setCurrentUser(user);
        setSubscriptions(subscriptionResponse);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Không thể tải thông tin đối tác.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentSubscription = useMemo(() => {
    const active = subscriptions.find((item) => item.status === "ACTIVE");
    return active ?? subscriptions[0] ?? null;
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông tin đối tác"
        subtitle="Xem thông tin đối tác và gói subscription của bạn."
      />

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Hồ sơ đối tác</h2>
              <p className="mt-1 text-sm text-slate-500">
                Thông tin đăng nhập và liên hệ của đối tác.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <InfoRow label="Tên đối tác" value={currentUser?.displayName || currentUser?.username || "—"} />
              <InfoRow label="Email" value={currentUser?.email || "—"} />
              <InfoRow label="Vai trò" value={currentUser?.role || "—"} />
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Subscription
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {currentSubscription?.subscriptionPlanName ?? "Chưa có gói"}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm">
              <Store className="h-5 w-5" />
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Đang tải gói subscription...</p>
          ) : currentSubscription ? (
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <InfoRow label="Trạng thái" value={statusLabels[currentSubscription.status ?? ""] ?? currentSubscription.status ?? "—"} />
              <InfoRow label="Chu kỳ" value={currentSubscription.billingCycle ?? "—"} />
              <InfoRow label="Ngày bắt đầu" value={formatDate(currentSubscription.startDate)} />
              <InfoRow label="Ngày kết thúc" value={formatDate(currentSubscription.endDate)} />
              <InfoRow label="Cửa hàng" value={currentSubscription.shopName || "—"} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Bạn chưa đăng ký gói subscription nào.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
