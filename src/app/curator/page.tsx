"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageLoading } from "@/components/app/page-loading";
import { getRedirectPathForRole } from "@/lib/access-control";
import { PageHeader, StatCard } from "@/components/app/ui-bits";
import { useAuth } from "@/hooks/use-auth";
import { useTimeGreeting } from "@/hooks/use-time-greeting";
import { curatorApi, type CuratorDashboard } from "@/services/api/curator/curatorApi";
import {
  formatChangeLabel,
  formatCount,
  formatRate,
  formatRating,
} from "@/lib/dashboard-format";
import {
  MapPin,
  ShieldCheck,
  Star,
  ArrowUpRight,
  Activity,
  BookOpen,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ui/chart-responsive-container";

export default function CuratorDashboardPage() {
  const { session, loading } = useAuth();
  const greeting = useTimeGreeting();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<CuratorDashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.role !== "curator") return;

    void (async () => {
      try {
        setDashboardError(null);
        setDashboard(await curatorApi.getDashboard());
      } catch (error) {
        console.error("[curator] Không tải được dashboard", error);
        setDashboard(null);
        setDashboardError(
          error instanceof Error ? error.message : "Không tải được số liệu tổng quan.",
        );
      }
    })();
  }, [session]);

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/");
        return;
      }

      if (session.role !== "curator") {
        router.replace(getRedirectPathForRole(session.role) ?? "/");
        return;
      }
    }
  }, [loading, router, session]);

  if (loading) {
    return <PageLoading className="min-h-[calc(100vh-8rem)]" />;
  }

  if (!session) {
    return (
      <div className="cq-page-subtitle p-8">
        Bạn cần đăng nhập để truy cập trang Curator.
      </div>
    );
  }

  if (session.role !== "curator") {
    return (
      <div className="cq-page-subtitle p-8">
        Đang chuyển hướng...
      </div>
    );
  }

  const content = dashboard?.contentSummary;
  const trend = dashboard?.checkInTrend;
  const checkinsTrend = trend?.daily ?? [];
  const topRoutes = dashboard?.topContent.topRoutes ?? [];
  const topHotspots = dashboard?.topContent.topHotspots ?? [];
  const routeCounts = content?.routeCounts;
  const pendingRoutes = routeCounts
    ? normalizeDashboardCount(routeCounts.pending) +
      normalizeDashboardCount(routeCounts.trial)
    : 0;

  // Backend trả đủ 6 trạng thái route; gom lại thành 1 bảng thay cho biểu đồ
  // "Tăng trưởng người dùng" cũ — số liệu đó thuộc dashboard Admin, endpoint
  // curator không trả về và cũng không phải phạm vi của curator.
  const routeStatusRows: {
    label: string;
    value: number;
    barClassName: string;
  }[] = routeCounts
    ? [
        {
          label: "Đã xuất bản",
          value: normalizeDashboardCount(routeCounts.published),
          barClassName: "bg-emerald-500",
        },
        {
          label: "Chờ duyệt",
          value: normalizeDashboardCount(routeCounts.pending),
          barClassName: "bg-amber-500",
        },
        {
          label: "Thử nghiệm",
          value: normalizeDashboardCount(routeCounts.trial),
          barClassName: "bg-sky-500",
        },
        {
          label: "Bản nháp",
          value: normalizeDashboardCount(routeCounts.draft),
          barClassName: "bg-slate-500",
        },
        {
          label: "Đang ghi",
          value: normalizeDashboardCount(routeCounts.recording),
          barClassName: "bg-violet-500",
        },
        {
          label: "Tạm giữ",
          value: normalizeDashboardCount(routeCounts.onHold),
          barClassName: "bg-rose-500",
        },
      ]
    : [];
  const totalRoutes = routeStatusRows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${session.name} 👋`}
        subtitle="Tổng quan nội dung Culture Quest Lite hôm nay."
        actions={
          <Link href="/curator/routes">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ShieldCheck className="w-4 h-4" /> {formatCount(pendingRoutes)} tuyến đường chờ xử lý
            </Button>
          </Link>
        }
      />

      {dashboardError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Không tải được số liệu tổng quan: {dashboardError}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Check-in hôm nay"
          value={formatCount(trend?.checkInsToday)}
          delta={formatChangeLabel(trend?.changePercent, "so với hôm qua")}
          icon={Activity}
          tone="primary"
        />
        <StatCard
          label="Địa điểm xuất bản"
          value={formatCount(content?.publishedHotspots)}
          delta={content ? `${formatCount(content.draftHotspots)} bản nháp` : "—"}
          icon={MapPin}
          tone="success"
        />
        <StatCard
          label="Câu chuyện xuất bản"
          value={formatCount(content?.publishedStories)}
          delta={content ? `${formatCount(content.draftStories)} bản nháp` : "—"}
          icon={BookOpen}
          tone="info"
        />
        <StatCard
          label="Đánh giá trung bình"
          value={formatRating(content?.averageRating)}
          delta={content ? `${formatCount(content.totalReviews)} lượt đánh giá` : "—"}
          icon={Star}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Lượt check-in 7 ngày</div>
              <div className="text-xs text-slate-500">
                Tổng cộng {formatCount(content?.totalCheckIns)} lượt từ trước tới nay
              </div>
            </div>
            {/* Endpoint chỉ trả cố định 7 ngày gần nhất nên bỏ bộ chọn
                Ngày/Tuần/Tháng/Năm cũ — các nút đó không đổi dữ liệu. */}
            <div className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
              7 ngày gần nhất
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={checkinsTrend}
                margin={{ left: -16, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="rgb(var(--primary))"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="d"
                  stroke="rgb(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgb(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--popover))",
                    border: "1px solid rgb(var(--border))",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  name="Check-in"
                  stroke="rgb(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Tuyến đường theo trạng thái</div>
            <Link href="/curator/routes" className="text-xs text-primary">
              Quản lý
            </Link>
          </div>
          {routeStatusRows.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">
              Chưa có dữ liệu tuyến đường.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {routeStatusRows.map((row) => (
                <li key={row.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold text-slate-900">
                      {formatCount(row.value)}
                    </span>
                  </div>
                  <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out ${row.barClassName}`}
                      style={{
                        width:
                          totalRoutes > 0
                            ? `${(row.value / totalRoutes) * 100}%`
                            : "0%",
                        minWidth: row.value > 0 ? "0.375rem" : "0",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">
              Tuyến đường được tương tác nhiều nhất
            </div>
            <Link
              href="/curator/routes"
              className="text-xs text-primary inline-flex items-center gap-0.5"
            >
              Xem tất cả <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {topRoutes.length === 0 ? (
            <p className="py-16 text-center text-xs text-slate-500">
              Chưa có tuyến đường nào được tham gia.
            </p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topRoutes}
                    margin={{ left: -16, right: 8, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="r"
                      stroke="rgb(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={truncateRouteLabel}
                    />
                    <YAxis
                      stroke="rgb(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgb(var(--popover))",
                        border: "1px solid rgb(var(--border))",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="views"
                      name="Lượt bắt đầu"
                      fill="rgb(var(--chart-3))"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="completes"
                      name="Hoàn thành"
                      fill="rgb(var(--primary))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {topRoutes.map((route) => (
                  <li
                    key={route.routeId}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate text-slate-600">
                      {route.r}
                    </span>
                    <span className="text-slate-500">
                      {formatCount(route.completes)}/{formatCount(route.views)}
                    </span>
                    <span className="w-14 text-right font-semibold text-slate-900">
                      {formatRate(route.completionRate)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Địa điểm check-in nhiều</div>
            <Link href="/curator/hotspot" className="text-xs text-primary">
              Xem địa điểm
            </Link>
          </div>
          {topHotspots.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">
              Chưa có lượt check-in nào.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {topHotspots.map((hotspot, index) => (
                <li key={hotspot.hotspotId} className="flex items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{hotspot.h}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{formatCount(hotspot.checkIns)} check-in</span>
                      {hotspot.averageRating !== null ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3" />
                          {formatRating(hotspot.averageRating)} ({formatCount(hotspot.totalReviews)})
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeDashboardCount(value: number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return 0;
}

function truncateRouteLabel(value: string) {
  const compact = value.trim();

  if (compact.length <= 16) {
    return compact;
  }

  return `${compact.slice(0, 16)}...`;
}
