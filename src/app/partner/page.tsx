"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app/ui-bits";
import { partnerApi, type VoucherResponse } from "@/services/api/partner/partnerApi";
import { Ticket, CheckCircle2, Clock, Plus } from "lucide-react";

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
        // size=100 chỉ để lấy đủ dữ liệu tính tổng quan nhanh trên trang dashboard
        const response = await partnerApi.getVouchers({ page: 0, size: 100 });
        if (!cancelled) setVouchers(response.content);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Không thể tải dữ liệu tổng quan.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = vouchers.filter((v) => v.status === "ACTIVE").length;
  const expiredCount = vouchers.filter((v) => v.status === "EXPIRED").length;
  const totalRedemptions = vouchers.reduce((sum, v) => sum + (v.usedCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan đối tác"
        subtitle="Theo dõi nhanh tình trạng voucher giảm giá của cửa hàng bạn."
        actions={
          <Link
            href="/partner/vouchers"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" /> Tạo voucher mới
          </Link>
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
          label="Tổng lượt sử dụng"
          value={totalRedemptions}
          icon={Ticket}
          loading={loading}
          accent="text-amber-600 bg-amber-50"
        />
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Quản lý chi tiết, tạo mới và chỉnh sửa voucher tại trang{" "}
        <Link href="/partner/vouchers" className="font-medium text-amber-700 underline">
          Voucher giảm giá
        </Link>
        .
      </div>
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