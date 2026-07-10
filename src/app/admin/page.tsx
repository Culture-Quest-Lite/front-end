"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getRedirectPathForRole } from "@/lib/access-control";
import { PageHeader, StatCard, StatusPill } from "@/components/app/ui-bits";
import {
  audit,
  reports,
  checkinsTrend,
  userGrowth,
  routeEngagement,
} from "@/data/demo";
import { adminApi, type PostItem, type UserProfile } from "@/services/api/admin/adminApi";
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

export default function AdminDashboardPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PostItem[]>([]);
  const [userTotal, setUserTotal] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

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
        router.replace("/");
        return;
      }

      if (session.role !== "admin") {
        console.warn("User role not authorized:", session.role, "redirecting to login");
        router.replace(getRedirectPathForRole(session.role) ?? "/");
        return;
      }

      console.log("Admin page: User authorized with role:", session.role);
    }
  }, [loading, router, session]);

  useEffect(() => {
    if (!session || session.role !== "admin") return;

    void (async () => {
      try {
        const [usersRes, postsRes] = await Promise.all([
          adminApi.getUsers({ page: 0, size: 4, sortBy: "createdAt", sortDir: "desc" }),
          adminApi.getPosts({ status: "PENDING", page: 0, size: 5 }),
        ]);
        setRecentUsers(usersRes.content);
        setUserTotal(usersRes.page.totalElements);
        setPendingPosts(postsRes.content);
        setPendingCount(postsRes.content.length);
      } catch {
        setRecentUsers([]);
        setPendingPosts([]);
      }
    })();
  }, [session]);

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

  if (session.role !== "admin") {
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
          value={
            typeof userTotal === "number"
              ? userTotal.toLocaleString("vi-VN")
              : "—"
          }
          delta="Từ API"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Chờ duyệt"
          value={pendingCount !== null ? String(pendingCount) : "—"}
          delta="Bài đăng pending"
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
        <div className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Người dùng gần đây</div>
            <Link href="/admin/users-manager" className="text-xs text-primary">
              Quản lý
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">Chưa có dữ liệu người dùng.</p>
            ) : (
              recentUsers.map((user) => {
                const name = user.displayName || user.username;
                const avatar =
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
                return (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt={name} className="h-11 w-11 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                      <div>{user.role}</div>
                      <div>{user.totalPoints ?? 0} điểm</div>
                    </div>
                  </div>
                );
              })
            )}
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
