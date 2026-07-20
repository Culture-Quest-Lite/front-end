"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app/ui-bits";
import { partnerApi, type VoucherResponse } from "@/services/api/partner/partnerApi";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Percent,
  Plus,
  Ticket,
  TrendingUp,
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function getUsedCount(voucher: VoucherResponse) {
  return Math.max(0, (voucher.quantityTotal ?? 0) - (voucher.quantityRemaining ?? 0));
}

function getUsageRate(voucher: VoucherResponse) {
  const total = voucher.quantityTotal ?? 0;
  if (total <= 0) return 0;
  return Math.round((getUsedCount(voucher) / total) * 100);
}

function getDaysLeft(value?: string | null) {
  if (!value) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(value);
  endDate.setHours(0, 0, 0, 0);

  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoading(true);
        setLoadError(null);

        const voucherResponse = await partnerApi.getVouchers({ page: 0, size: 100 });

        if (cancelled) return;

        setVouchers(voucherResponse.content ?? []);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải dữ liệu tổng quan voucher.",
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

  const visibleVouchers = useMemo(
    () => vouchers.filter((voucher) => voucher.status !== "DELETED"),
    [vouchers],
  );

  const totalVouchers = visibleVouchers.length;
  const activeCount = visibleVouchers.filter((v) => v.status === "ACTIVE").length;
  const inactiveCount = visibleVouchers.filter((v) => v.status === "INACTIVE").length;
  const expiredCount = visibleVouchers.filter((v) => v.status === "EXPIRED").length;
  const pendingCount = visibleVouchers.filter((v) => v.status === "PENDING").length;
  const totalQuantity = visibleVouchers.reduce((sum, v) => sum + (v.quantityTotal ?? 0), 0);
  const totalRemaining = visibleVouchers.reduce((sum, v) => sum + (v.quantityRemaining ?? 0), 0);
  const totalRedeemed = visibleVouchers.reduce((sum, v) => sum + getUsedCount(v), 0);
  const averageUsageRate = totalQuantity > 0 ? Math.round((totalRedeemed / totalQuantity) * 100) : 0;
  const lowStockCount = visibleVouchers.filter(
    (v) => v.status === "ACTIVE" && (v.quantityRemaining ?? 0) <= 5,
  ).length;
  const expiringSoonCount = visibleVouchers.filter((v) => {
    const daysLeft = getDaysLeft(v.endDate);
    return v.status === "ACTIVE" && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  }).length;

  const topUsedVouchers = useMemo(
    () => [...visibleVouchers].sort((a, b) => getUsedCount(b) - getUsedCount(a)).slice(0, 5),
    [visibleVouchers],
  );

  const expiringSoonVouchers = useMemo(
    () =>
      visibleVouchers
        .filter((voucher) => {
          const daysLeft = getDaysLeft(voucher.endDate);
          return voucher.status === "ACTIVE" && daysLeft !== null && daysLeft >= 0 && daysLeft <= 14;
        })
        .sort((a, b) => (getDaysLeft(a.endDate) ?? 999) - (getDaysLeft(b.endDate) ?? 999))
        .slice(0, 5),
    [visibleVouchers],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng số liệu Voucher"
        subtitle="Theo dõi tổng quan hiệu suất voucher, lượt dùng, tồn kho và trạng thái hoạt động."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/partner/vouchers"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Quản lý voucher
            </Link>
            <Link
              href="/partner/setting"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <UserCog className="h-4 w-4" /> Thông tin đối tác
            </Link>
          </div>
        }
      />

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng voucher"
          value={totalVouchers}
          icon={Ticket}
          loading={loading}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Đang hoạt động"
          value={activeCount}
          icon={CheckCircle2}
          loading={loading}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Sắp hết hạn"
          value={expiringSoonCount}
          icon={Clock}
          loading={loading}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Sắp hết số lượng"
          value={lowStockCount}
          icon={AlertTriangle}
          loading={loading}
          accent="bg-rose-50 text-rose-600"
        />
        <StatCard
          label="Tổng lượt sử dụng"
          value={totalRedeemed}
          icon={TrendingUp}
          loading={loading}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Tổng số lượng phát hành"
          value={totalQuantity}
          icon={BarChart3}
          loading={loading}
          accent="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          label="Số lượng còn lại"
          value={totalRemaining}
          icon={Ticket}
          loading={loading}
          accent="bg-slate-100 text-slate-600"
        />
        <StatCard
          label="Tỷ lệ sử dụng TB"
          value={averageUsageRate}
          suffix="%"
          icon={Percent}
          loading={loading}
          accent="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <SectionHeader
            title="Tình trạng voucher"
            subtitle="Bảng tổng hợp số lượng theo từng trạng thái."
          />

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Số lượng</th>
                  <th className="px-4 py-3 font-semibold">Tỷ lệ</th>
                  <th className="px-4 py-3 font-semibold">Mô tả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <StatusStatRow status="ACTIVE" count={activeCount} total={totalVouchers} description="Voucher có thể sử dụng" />
                <StatusStatRow status="INACTIVE" count={inactiveCount} total={totalVouchers} description="Voucher đang bị tắt" />
                <StatusStatRow status="PENDING" count={pendingCount} total={totalVouchers} description="Voucher đang chờ xử lý" />
                <StatusStatRow status="EXPIRED" count={expiredCount} total={totalVouchers} description="Voucher đã quá hạn" />
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader
            title="Cảnh báo nhanh"
            subtitle="Các chỉ số cần xử lý sớm."
          />

          <div className="mt-5 space-y-3">
            <InfoRow label="Voucher sắp hết hạn" value={`${expiringSoonCount} voucher`} />
            <InfoRow label="Voucher sắp hết số lượng" value={`${lowStockCount} voucher`} />
            <InfoRow label="Voucher hết hạn" value={`${expiredCount} voucher`} />
            <InfoRow label="Tỷ lệ sử dụng trung bình" value={`${averageUsageRate}%`} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader
            title="Top voucher được dùng nhiều"
            subtitle="Xếp hạng theo số lượt sử dụng."
          />

          {loading ? (
            <LoadingBox />
          ) : topUsedVouchers.length === 0 ? (
            <EmptyBox text="Chưa có voucher nào." />
          ) : (
            <div className="mt-5 space-y-3">
              {topUsedVouchers.map((voucher, index) => (
                <VoucherRankingCard key={voucher.voucherId} index={index + 1} voucher={voucher} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader
            title="Voucher sắp hết hạn"
            subtitle="Voucher ACTIVE hết hạn trong 14 ngày tới."
          />

          {loading ? (
            <LoadingBox />
          ) : expiringSoonVouchers.length === 0 ? (
            <EmptyBox text="Không có voucher nào sắp hết hạn." />
          ) : (
            <div className="mt-5 space-y-3">
              {expiringSoonVouchers.map((voucher) => (
                <ExpiringVoucherCard key={voucher.voucherId} voucher={voucher} />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            title="Bảng số liệu chi tiết"
            subtitle="Theo dõi lượt dùng, số lượng còn lại, tỷ lệ sử dụng và thời gian hiệu lực."
          />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Tổng voucher: {formatNumber(totalVouchers)}
          </span>
        </div>

        {loading ? (
          <LoadingBox />
        ) : visibleVouchers.length === 0 ? (
          <EmptyBox text="Không có dữ liệu voucher để hiển thị." />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã voucher</th>
                  <th className="px-4 py-3 font-semibold">Tên voucher</th>
                  <th className="px-4 py-3 font-semibold">Ưu đãi</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Phát hành</th>
                  <th className="px-4 py-3 font-semibold">Đã dùng</th>
                  <th className="px-4 py-3 font-semibold">Còn lại</th>
                  <th className="px-4 py-3 font-semibold">Tỷ lệ dùng</th>
                  <th className="px-4 py-3 font-semibold">Hết hạn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {visibleVouchers.map((voucher) => {
                  const used = getUsedCount(voucher);
                  const usageRate = getUsageRate(voucher);

                  return (
                    <tr key={voucher.voucherId} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                        {voucher.voucherCode}
                      </td>
                      <td className="min-w-[180px] px-4 py-4 text-slate-700">
                        {voucher.voucherName}
                      </td>
                      <td className="min-w-[180px] px-4 py-4 text-slate-700">
                        {formatDiscount(voucher)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <StatusBadge status={voucher.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatNumber(voucher.quantityTotal ?? 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatNumber(used)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatNumber(voucher.quantityRemaining ?? 0)}
                      </td>
                      <td className="min-w-[150px] px-4 py-4">
                        <ProgressValue value={usageRate} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatDate(voucher.endDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        statusClasses[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function StatusStatRow({
  status,
  count,
  total,
  description,
}: {
  status: string;
  count: number;
  total: number;
  description: string;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <tr>
      <td className="whitespace-nowrap px-4 py-4">
        <StatusBadge status={status} />
      </td>
      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
        {formatNumber(count)}
      </td>
      <td className="min-w-[160px] px-4 py-4">
        <ProgressValue value={percent} />
      </td>
      <td className="px-4 py-4 text-slate-600">{description}</td>
    </tr>
  );
}

function VoucherRankingCard({ index, voucher }: { index: number; voucher: VoucherResponse }) {
  const used = getUsedCount(voucher);
  const usageRate = getUsageRate(voucher);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">TOP {index}</p>
          <h3 className="mt-1 line-clamp-1 font-semibold text-slate-900">
            {voucher.voucherName}
          </h3>
          <p className="mt-1 text-xs text-slate-500">Mã: {voucher.voucherCode}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{formatNumber(used)}</p>
          <p className="text-xs text-slate-500">lượt dùng</p>
        </div>
      </div>
      <div className="mt-3">
        <ProgressValue value={usageRate} />
      </div>
    </div>
  );
}

function ExpiringVoucherCard({ voucher }: { voucher: VoucherResponse }) {
  const daysLeft = getDaysLeft(voucher.endDate);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
      <div className="min-w-0">
        <h3 className="line-clamp-1 font-semibold text-slate-900">{voucher.voucherName}</h3>
        <p className="mt-1 text-xs text-slate-600">
          {voucher.voucherCode} • Hết hạn: {formatDate(voucher.endDate)}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
        {daysLeft === 0 ? "Hôm nay" : `Còn ${daysLeft} ngày`}
      </span>
    </div>
  );
}

function ProgressValue({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-slate-700">{value}%</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function LoadingBox() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      Đang tải dữ liệu...
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
  suffix = "",
}: {
  label: string;
  value: number;
  icon: typeof Ticket;
  loading: boolean;
  accent: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {loading ? "—" : `${formatNumber(value)}${suffix}`}
          </p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
