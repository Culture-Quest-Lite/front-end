"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/app/page-loading";
import { useAuth } from "@/hooks/use-auth";
import { useTimeGreeting } from "@/hooks/use-time-greeting";
import { getRedirectPathForRole } from "@/lib/access-control";
import { PageHeader, StatCard, StatusPill } from "@/components/app/ui-bits";
import { UserAvatar, roleClasses, roleLabels } from "@/components/admin/UserAvatar";
import {
  adminApi,
  type AdminDashboard,
  type AuditLog,
  type PostItem,
  type PostReportItem,
  type UserProfile,
} from "@/services/api/admin/adminApi";
import {
  getActionLabel,
  getAuditTargetLabel,
} from "@/lib/audit-labels";
import {
  formatChangeLabel,
  formatCompactCurrency,
  formatCount,
  formatRate,
} from "@/lib/dashboard-format";
import {
  bucketCheckInTrend,
  bucketUserGrowth,
  dashboardRangeOptions,
  getCheckInGranularityLabel,
  isUserGrowthRangeExact,
  type DashboardRange,
} from "@/lib/dashboard-range";
import {
  MapPin,
  ShieldCheck,
  Users,
  TrendingUp,
  Activity,
  Clock,
  FileText,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ui/chart-responsive-container";

export default function AdminDashboardPage() {
  const { session, loading } = useAuth();
  const greeting = useTimeGreeting();
  const router = useRouter();
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PostItem[]>([]);
  const [recentReports, setRecentReports] = useState<PostReportItem[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [range, setRange] = useState<DashboardRange>("day");

  const checkInSeries = useMemo(
    () => bucketCheckInTrend(dashboard?.checkInTrend ?? [], range),
    [dashboard?.checkInTrend, range],
  );
  const userGrowthSeries = useMemo(
    () => bucketUserGrowth(dashboard?.userGrowth ?? [], range),
    [dashboard?.userGrowth, range],
  );

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/");
        return;
      }

      if (session.role !== "admin") {
        router.replace(getRedirectPathForRole(session.role) ?? "/");
        return;
      }
    }
  }, [loading, router, session]);

  useEffect(() => {
    if (!session || session.role !== "admin") return;

    // Dashboard tách khỏi 2 list bên dưới: một list lỗi thì không được kéo
    // theo toàn bộ số liệu tổng quan biến mất, và ngược lại.
    void (async () => {
      try {
        setDashboardError(null);
        setDashboard(await adminApi.getDashboard());
      } catch (error) {
        console.error("[admin] Không tải được dashboard", error);
        setDashboard(null);
        setDashboardError(
          error instanceof Error ? error.message : "Không tải được số liệu tổng quan.",
        );
      }
    })();

    void (async () => {
      try {
        const [usersRes, postsRes] = await Promise.all([
          adminApi.getUsers({ page: 0, size: 4, sortBy: "createdAt", sortDir: "desc" }),
          adminApi.getPosts({ status: "PENDING", page: 0, size: 5 }),
        ]);
        setRecentUsers(usersRes.content);
        setPendingPosts(postsRes.content);
      } catch {
        setRecentUsers([]);
        setPendingPosts([]);
      }
    })();

    // Báo cáo mới + hoạt động quản trị: lấy từ API thật (trước đây là dữ liệu
    // giả trong @/data/demo nên hiện tên người dùng và đối tượng không có thật).
    void (async () => {
      try {
        setRecentReports(await adminApi.getPostReports());
      } catch {
        setRecentReports([]);
      }
    })();

    void (async () => {
      try {
        const res = await adminApi.getAuditLogs({
          page: 0,
          size: 4,
          sortBy: "createdAt",
          sortDir: "desc",
        });
        setRecentAudits(res.content ?? []);
      } catch {
        setRecentAudits([]);
      }
    })();
  }, [session, range]);

  if (loading) {
    return <PageLoading className="min-h-[calc(100vh-8rem)]" />;
  }

  if (!session) {
    return (
      <div className="cq-page-subtitle p-8">
        Bạn cần đăng nhập để truy cập trang Admin.
      </div>
    );
  }
  
  if (session.role !== "admin") {
    return (
      <div className="cq-page-subtitle p-8">
        Đang chuyển hướng...
      </div>
    );
  }

  const summary = dashboard?.summary;
  const revenue = dashboard?.revenue;
  const routeEngagement = dashboard?.routeEngagement ?? [];
  const maxRouteStarts = Math.max(1, ...routeEngagement.map((route) => route.views));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${session.name} 👋`}
        subtitle="Tổng quan quyền quản trị Culture Quest Lite hôm nay."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              {dashboardRangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    range === option.value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Link href="/admin/moderation">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Xem báo cáo
              </Button>
            </Link>
          </div>
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
          value={formatCount(summary?.checkInsToday)}
          delta={formatChangeLabel(summary?.checkInsChangePercent, "so với hôm qua")}
          icon={Activity}
          tone="primary"
        />
        <StatCard
          label="Địa điểm đã xuất bản"
          value={formatCount(summary?.publishedHotspots)}
          delta={
            summary
              ? `+${formatCount(summary.publishedHotspotsThisWeek)} tuần này`
              : "—"
          }
          icon={MapPin}
          tone="success"
        />
        <StatCard
          label="Người dùng"
          value={formatCount(summary?.totalUsers)}
          delta={
            summary
              ? `${formatCount(summary.activeUsers)} đang hoạt động · +${formatCount(summary.newUsersThisMonth)} tháng này`
              : "—"
          }
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Chờ duyệt"
          value={formatCount(summary?.pendingPosts)}
          delta="Bài đăng chờ duyệt"
          icon={FileText}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Doanh thu tháng này"
          value={formatCompactCurrency(revenue?.revenueThisMonth)}
          delta={formatChangeLabel(revenue?.revenueChangePercent, "so với tháng trước")}
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Tổng doanh thu"
          value={formatCompactCurrency(revenue?.totalRevenue)}
          delta={
            revenue ? `${formatCount(revenue.paidInvoices)} hoá đơn đã thanh toán` : "—"
          }
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Doanh thu Premium"
          value={formatCompactCurrency(revenue?.premiumRevenue)}
          delta={
            revenue
              ? `${formatCount(revenue.activePremiumSubscriptions)} gói đang hoạt động`
              : "—"
          }
          icon={ShieldCheck}
          tone="info"
        />
        <StatCard
          label="Doanh thu đối tác"
          value={formatCompactCurrency(revenue?.partnerRevenue)}
          delta={
            revenue
              ? `${formatCount(revenue.activePartnerSubscriptions)} gói đang hoạt động`
              : "—"
          }
          icon={Users}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="cq-admin-panel p-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-sm font-semibold">Lượt check-in</div>
              <div className="text-xs text-slate-500">
                {getCheckInGranularityLabel(range)} · Toàn hệ thống
              </div>
            </div>
            {/* Backend luôn trả đúng 7 mốc theo ngày (CHECK_IN_DAYS = 7), nên
                các mốc Tuần/Tháng/Năm là tổng của chính 7 ngày đó. Ghi rõ cửa
                sổ nguồn để không bị hiểu nhầm là số liệu cả tháng/cả năm. */}
            <div className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
              Nguồn: 7 ngày gần nhất
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={checkInSeries}
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
                  dataKey="label"
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
                  dataKey="value"
                  name="Lượt check-in"
                  stroke="rgb(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cq-admin-panel p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="text-sm font-semibold">Tăng trưởng người dùng</div>
              {/* Backend chỉ trả 12 mốc theo THÁNG (GROWTH_MONTHS = 12), không
                  tách nhỏ hơn được nên mốc Ngày/Tuần vẫn vẽ theo tháng. */}
              <div className="text-xs text-slate-500">
                {isUserGrowthRangeExact(range)
                  ? "Nguồn: 12 tháng gần nhất"
                  : "Chỉ có dữ liệu theo tháng · 12 tháng gần nhất"}
              </div>
            </div>
            <TrendingUp className="w-4 h-4 shrink-0 text-emerald-600" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={userGrowthSeries}
                margin={{ left: -16, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
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
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Người dùng mới"
                  stroke="rgb(var(--accent))"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="cq-admin-panel p-4 xl:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-sm font-semibold">Tuyến tương tác nhiều nhất</div>
              <div className="text-xs text-slate-500">
                Top {routeEngagement.length || 5} theo lượt bắt đầu
              </div>
            </div>
          </div>

          {/* Dữ liệu route là bảng xếp hạng 5 dòng có tên dài + một tỉ lệ, nên
              dùng thanh ngang xếp hạng thay cho biểu đồ cột dọc: tên tuyến đọc
              được đủ, và so sánh "bắt đầu vs hoàn thành" nằm ngay trên cùng
              một thanh. */}
          {routeEngagement.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-500">
              Chưa có tuyến nào được bắt đầu.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-full bg-[rgb(var(--chart-3))]" />
                  Lượt bắt đầu
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-full bg-[rgb(var(--primary))]" />
                  Hoàn thành
                </span>
              </div>

              <ol className="mt-3 space-y-3">
                {routeEngagement.map((route, index) => (
                  <li key={route.routeId} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                          {route.r}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">
                          {formatCount(route.completes)}/{formatCount(route.views)}
                        </span>
                      </div>

                      <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        {/* Thanh nền = lượt bắt đầu (so với tuyến cao nhất),
                            thanh đậm bên trong = lượt hoàn thành. */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-[rgb(var(--chart-3))]"
                          style={{
                            width: `${(route.views / maxRouteStarts) * 100}%`,
                          }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-[rgb(var(--primary))]"
                          style={{
                            width: `${(route.completes / maxRouteStarts) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <span className="mt-0.5 w-14 shrink-0 text-right text-sm font-semibold text-slate-900">
                      {formatRate(route.completionRate)}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <div className="cq-admin-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Hàng đợi duyệt</div>
            <Link href="/admin/content-review" className="text-xs text-primary">
              Mở
            </Link>
          </div>
          <ul className="space-y-2.5">
            {pendingPosts.length === 0 ? (
              <li className="py-4 text-center text-xs text-slate-500">Không có bài đăng chờ duyệt.</li>
            ) : (
              pendingPosts.map((post) => (
                <li key={post.postId} className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{post.content}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5">Bài đăng</span>
                      <span>· {post.displayName || post.username}</span>
                      {post.createdAt ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <StatusPill status="pending" />
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="cq-admin-panel p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Người dùng gần đây</div>
            <Link href="/admin/users-manager" className="text-xs text-primary">
              Quản lý
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentUsers.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">Chưa có dữ liệu người dùng.</p>
            ) : (
              recentUsers.map((user) => {
                const name = user.displayName || user.username;
                return (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2.5"
                  >
                    <UserAvatar
                      avatarUrl={user.avatarUrl}
                      displayName={name}
                      className="h-10 w-10"
                      iconClassName="h-5 w-5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleClasses[user.role]}`}
                      >
                        {roleLabels[user.role]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatCount(user.totalPoints)} điểm
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="cq-admin-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Báo cáo mới</div>
            <Link href="/admin/moderation" className="text-xs text-primary">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentReports.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">
                Không có báo cáo nào đang chờ xử lý.
              </p>
            ) : (
              recentReports.slice(0, 3).map((report) => (
                <div
                  key={report.postActionId}
                  className="rounded-2xl border border-slate-100 p-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">Bài đăng bị báo cáo</div>
                      <p className="truncate text-xs text-slate-500">
                        Người báo cáo: {report.createdDisplayName}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                      {new Date(report.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">{report.comment}</p>
                  <div className="mt-2.5 flex items-center justify-end text-[11px] text-slate-500">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                      Chờ xử lý
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="cq-admin-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">
            Hoạt động quản trị gần đây
          </div>
          <Link href="/admin/review-history" className="text-xs text-primary">
            Xem lịch sử
          </Link>
        </div>
        {recentAudits.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            Chưa có hoạt động quản trị nào được ghi lại.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {recentAudits.map((entry) => (
              <div key={entry.logId} className="rounded-2xl border border-slate-100 p-2.5">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
                  <span className="truncate">{getActionLabel(entry.action)}</span>
                </div>
                {/* Đối tượng hiện tên đọc được (lấy từ oldValue/newValue), không hiện recordId. */}
                <p className="mt-2 truncate text-xs text-slate-500">
                  {getAuditTargetLabel(entry)}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="truncate">
                    {entry.actor?.displayName || entry.actor?.username || "Hệ thống"}
                  </span>
                  <span className="shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
