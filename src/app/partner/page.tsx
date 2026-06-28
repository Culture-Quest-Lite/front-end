"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app/ui-bits";
import {
  partnerApi,
  type CurrentUserProfileResponse,
  type VoucherResponse,
} from "@/services/api/partner/partnerApi";
import {
  partnerSubscriptionApi,
  type PartnerSubscriptionResponse,
} from "@/services/api/partner/partnerSubscriptionApi";
import {
  CheckCircle2,
  Clock,
  KeyRound,
  Pencil,
  Plus,
  Store,
  Ticket,
  UserCog,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Tạm ngưng",
  EXPIRED: "Hết hạn",
  DELETED: "Đã xoá",
};

const statusClasses: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-red-100 text-red-700",
  DELETED: "bg-slate-100 text-slate-400",
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

function formatDiscount(voucher: VoucherResponse) {
  if (voucher.discountType === "PERCENTAGE") {
    const max = voucher.maxDiscountAmount
      ? `, tối đa ${formatCurrency(voucher.maxDiscountAmount)}`
      : "";
    return `Giảm ${voucher.discountValue}%${max}`;
  }

  return `Giảm ${formatCurrency(voucher.discountValue)}`;
}

export default function PartnerDashboardPage() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
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

        const [user, voucherResponse, subscriptionResponse] = await Promise.all([
          partnerApi.getCurrentUser(),
          partnerApi.getVouchers({ page: 0, size: 100 }),
          partnerSubscriptionApi
            .getMySubscriptions()
            .catch(() => [] as PartnerSubscriptionResponse[]),
        ]);

        if (cancelled) return;

        setCurrentUser(user);
        setVouchers(voucherResponse.content);
        setSubscriptions(subscriptionResponse);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải dữ liệu tổng quan.",
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

  const activeCount = vouchers.filter((v) => v.status === "ACTIVE").length;
  const expiredCount = vouchers.filter((v) => v.status === "EXPIRED").length;
  const totalRedeemed = vouchers.reduce(
    (sum, v) => sum + Math.max(0, v.quantityTotal - v.quantityRemaining),
    0,
  );

  const latestVouchers = useMemo(
    () => vouchers.slice(0, 6),
    [vouchers],
  );

  const currentSubscription = useMemo(() => {
    const active = subscriptions.find((item) => item.status === "ACTIVE");
    return active ?? subscriptions[0] ?? null;
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan đối tác"
        subtitle="Theo dõi voucher, gói subscription và thông tin tài khoản partner."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/partner/profile"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <UserCog className="h-4 w-4" /> Sửa thông tin
            </Link>
            <Link
              href="/partner/change-password"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <KeyRound className="h-4 w-4" /> Đổi mật khẩu
            </Link>
            <Link
              href="/partner/voucher"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" /> Tạo voucher mới
            </Link>
          </div>
        }
      />

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Voucher đang hoạt động"
          value={activeCount}
          icon={CheckCircle2}
          loading={loading}
          accent="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          label="Voucher đã hết hạn"
          value={expiredCount}
          icon={Clock}
          loading={loading}
          accent="text-slate-500 bg-slate-100"
        />
        <StatCard
          label="Tổng lượt đã đổi"
          value={totalRedeemed}
          icon={Ticket}
          loading={loading}
          accent="text-amber-600 bg-amber-50"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Voucher bạn đã tạo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Xem nhanh các voucher mới nhất của cửa hàng.
              </p>
            </div>

            <Link
              href="/partner/voucher"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              Quản lý tất cả
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Đang tải voucher...
            </div>
          ) : latestVouchers.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Bạn chưa tạo voucher nào.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {latestVouchers.map((voucher) => (
                <VoucherMiniCard key={voucher.voucherId} voucher={voucher} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Subscription plan
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
              <p className="mt-4 text-sm text-slate-500">Đang tải gói...</p>
            ) : currentSubscription ? (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <InfoRow label="Cửa hàng" value={currentSubscription.shopName} />
                <InfoRow
                  label="Trạng thái"
                  value={statusLabels[currentSubscription.status ?? ""] ?? currentSubscription.status ?? "—"}
                />
                <InfoRow
                  label="Chu kỳ"
                  value={currentSubscription.billingCycle ?? "—"}
                />
                <InfoRow
                  label="Ngày bắt đầu"
                  value={formatDate(currentSubscription.startDate)}
                />
                <InfoRow
                  label="Ngày kết thúc"
                  value={formatDate(currentSubscription.endDate)}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Bạn chưa đăng ký gói subscription nào.
              </p>
            )}

            <Link
              href="/partner/subscription"
              className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Xem gói subscription
            </Link>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-600">
                <UserCog className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">
                  {currentUser?.displayName || currentUser?.username || "Partner"}
                </h2>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {currentUser?.email ?? "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Link
                href="/partner/profile"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" /> Cập nhật thông tin
              </Link>
              <Link
                href="/partner/change-password"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <KeyRound className="h-4 w-4" /> Thay đổi mật khẩu
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function VoucherMiniCard({ voucher }: { voucher: VoucherResponse }) {
  const cover = voucher.medias?.[0]?.fileUrl;

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-amber-100 text-amber-600">
        {cover ? (
          <img
            src={cover}
            alt={voucher.voucherName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Ticket className="h-7 w-7" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
            {voucher.voucherName}
          </h3>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              statusClasses[voucher.status] ?? "bg-slate-100 text-slate-600"
            }`}
          >
            {statusLabels[voucher.status] ?? voucher.status}
          </span>
        </div>

        <p className="mt-1 text-xs font-medium text-amber-700">
          {formatDiscount(voucher)}
        </p>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span>Mã: {voucher.voucherCode}</span>
          <span>Còn: {voucher.quantityRemaining}/{voucher.quantityTotal}</span>
          <span>Hết hạn: {formatDate(voucher.endDate)}</span>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Ticket;
  loading: boolean;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {loading ? "—" : value}
          </p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
