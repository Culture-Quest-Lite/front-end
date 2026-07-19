"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRedirectPathForRole } from "@/lib/access-control";
import { PageHeader, StatCard, StatusPill } from "@/components/app/ui-bits";
import { useAuth } from "@/hooks/use-auth";
import {
  hotspots,
  approvals,
  checkinsTrend,
  userGrowth,
  routeEngagement,
} from "@/data/demo";
import {
  MapPin,
  ShieldCheck,
  Users,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Clock,
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
  Line,
  LineChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ui/chart-responsive-container";

export default function CuratorDashboardPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("Curator page - useEffect triggered", { 
      loading, 
      hasSession: !!session,
      sessionRole: session?.role,
      sessionEmail: session?.email 
    });

    if (!loading) {
      // Check if user has session
      if (!session) {
        console.warn("No session found, redirecting to login");
        router.replace("/");
        return;
      }

      if (session.role !== "curator") {
        console.warn("User role not authorized:", session.role, "redirecting to login");
        router.replace(getRedirectPathForRole(session.role) ?? "/");
        return;
      }

      console.log("Curator page: User authorized");
    }
  }, [loading, router, session]);

  if (loading) {
    return null;
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chào buổi sáng, ${session.name} 👋`}
        subtitle="Tổng quan hoạt động hệ thống Culture Quest Lite hôm nay."
        actions={
          <Link href="/approvals">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 4 chờ duyệt
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
          label="Chờ duyệt"
          value="4"
          delta="2 hotspot · 1 story · 1 route"
          icon={ShieldCheck}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Lượt check-in 7 ngày</div>
              <div className="text-xs text-slate-500">Toàn TP.HCM</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">
              Tuyến hành trình được tương tác nhiều nhất
            </div>
            <Link
              href="/analytics"
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
            <Link href="/approvals" className="text-xs text-primary">
              Mở
            </Link>
          </div>
          <ul className="space-y-2.5">
            {approvals.map((a) => (
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

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Hotspot xem nhiều</div>
          <Link href="/hotspots" className="text-xs text-primary">
            Xem hotspot
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {hotspots.slice(0, 4).map((h) => (
            <div key={h.id} className="overflow-hidden rounded-xl bg-slate-50">
              <div
                className="aspect-4/3 bg-cover bg-center"
                style={{ backgroundImage: `url(${h.cover})` }}
              />
              <div className="p-2.5">
                <div className="text-xs font-semibold truncate">{h.name}</div>
                <div className="text-[10px] text-slate-500">
                  {h.district} · {h.xp} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
