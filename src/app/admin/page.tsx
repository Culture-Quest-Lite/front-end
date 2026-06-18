"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, StatCard, StatusPill } from "@/components/app/ui-bits";
import {
  hotspots,
  approvals,
  audit,
  reports,
  checkinsTrend,
  userGrowth,
  routeEngagement,
  users,
} from "@/data/demo";
import {
  MapPin,
  ShieldCheck,
  Users,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Clock,
  FileText,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("Admin page - useEffect triggered", { 
      loading, 
      hasSession: !!session,
      sessionRole: session?.role,
      sessionEmail: session?.email 
    });

    if (!loading) {
      // Check if user has session
      if (!session) {
        console.warn("No session found, redirecting to login");
        router.push("/");
        return;
      }

      // Allow both admin and curator to access admin page (tạm thời)
      if (session.role !== "admin" && session.role !== "curator") {
        console.warn("User role not authorized:", session.role, "redirecting to login");
        router.push("/");
        return;
      }

      console.log("Admin page: User authorized with role:", session.role);
    }
  }, [loading, router, session]);

  if (loading) {
    return (
      <div className="cq-page-subtitle p-8">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="cq-page-subtitle p-8">
        Bạn cần đăng nhập để truy cập trang Admin.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chào buổi sáng, ${session.name} 👋`}
        subtitle="Tổng quan quyền quản trị Culture Quest Lite hôm nay."
        actions={
          <Link href="/admin/moderation">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Xem báo cáo
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Check-in hôm nay"
          value="1.024"
          delta="+18% so với hôm qua"
          icon={Activity}
          tone="primary"
        />
        <StatCard
          label="Hotspot xuất bản"
          value="58"
          delta="+3 tuần này"
          icon={MapPin}
          tone="success"
        />
        <StatCard
          label="Người dùng"
          value="4.280"
          delta="+372 tháng này"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Báo cáo mới"
          value="3"
          delta="Chờ xử lý"
          icon={FileText}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Lượt check-in 7 ngày</div>
              <div className="text-xs text-slate-500">Toàn hệ thống</div>
            </div>
            <div className="flex gap-1 text-xs">
              {["Ngày", "Tuần", "Tháng", "Năm"].map((t, i) => (
                <button
                  key={t}
                  className={`px-2.5 py-1 rounded-md ${i === 1 ? "bg-primary text-primary-foreground" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {t}
                </button>
              ))}
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
            <div className="text-sm font-semibold">Tăng trưởng người dùng</div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={userGrowth}
                margin={{ left: -16, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="m"
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
                  dataKey="u"
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
        <div className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">
              Tuyến tương tác nhiều nhất
            </div>
            <Link
              href="/admin/analytics"
              className="text-xs text-primary inline-flex items-center gap-0.5"
            >
              Xem tất cả <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={routeEngagement}
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
                  fill="rgb(var(--chart-3))"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="completes"
                  fill="rgb(var(--primary))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Hàng đợi duyệt</div>
            <Link href="/admin/content-review" className="text-xs text-primary">
              Mở
            </Link>
          </div>
          <ul className="space-y-2.5">
            {approvals.filter((a) => a.status === "pending").map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <img
                  src={a.thumbnail}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5">
                      {a.type}
                    </span>
                    <span>· {a.curator}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 2h
                    </span>
                  </div>
                </div>
                <StatusPill status="pending" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Người dùng gần đây</div>
            <Link href="/admin/users-manager" className="text-xs text-primary">
              Quản lý
            </Link>
          </div>
          <div className="space-y-3">
            {users.slice(0, 4).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-3"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="text-xs text-slate-500 text-right">
                  <div>{user.role}</div>
                  <div>{user.checkins} check-ins</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Báo cáo mới</div>
            <Link href="/admin/moderation" className="text-xs text-primary">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {reports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-slate-200/70 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{report.type}</div>
                    <p className="text-xs text-slate-500">{report.target}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {new Date(report.at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">{report.reason}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{report.reporter}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    {report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">
            Hoạt động quản trị gần đây
          </div>
          <Link href="/admin/review-history" className="text-xs text-primary">
            Xem lịch sử
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {audit.slice(0, 4).map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-slate-200/70 p-3"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{entry.action}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{entry.target}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>{entry.who}</span>
                <span>{new Date(entry.at).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
