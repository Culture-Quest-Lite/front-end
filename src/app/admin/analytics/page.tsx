"use client";

import { PageHeader, StatCard } from "@/components/app/ui-bits";
import { checkinsTrend, userGrowth, routeEngagement, funnel } from "@/data/demo";
import { Activity, MapPin, Users, TrendingUp } from "lucide-react";
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
  RadialBar,
  RadialBarChart,
  Legend,
} from "recharts";
import { ResponsiveContainer } from "@/components/ui/chart-responsive-container";

// lucide alias
import { Route as RIcon } from "lucide-react";

const approvalData = [
  { n: "T2", a: 18, r: 2 },
  { n: "T3", a: 21, r: 3 },
  { n: "T4", a: 24, r: 1 },
  { n: "T5", a: 19, r: 4 },
  { n: "T6", a: 28, r: 2 },
  { n: "T7", a: 14, r: 1 },
  { n: "CN", a: 9, r: 0 },
];

const activityColors = ["#0ea5e9", "#22c55e", "#f59e0b"];

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Phân tích nâng cao"
        subtitle="Hiệu năng nội dung, tuyến và hành vi người dùng (BR-68, BR-70)."
        actions={
          <div className="flex gap-2">
            {["Ngày", "Tuần", "Tháng", "Năm"].map((t, i) => (
              <button
                key={t}
                className={`px-2.5 py-1.5 text-xs rounded-lg ${
                  i === 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tổng check-in" value="12.840" delta="+22%" icon={Activity} tone="primary" />
        <StatCard label="Địa điểm đã xuất bản" value="58" delta="+5" icon={MapPin} tone="success" />
        <StatCard label="Tuyến hoạt động" value="14" delta="+2" icon={RIcon} tone="info" />
        <StatCard label="Người dùng mới" value="372" delta="+18%" icon={Users} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Xu hướng check-in</div>
              <p className="text-[11px] text-slate-500">Biểu đồ thể hiện số check-in theo ngày.</p>
            </div>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={checkinsTrend} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="d" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="v" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#ga)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold mb-3">Tỉ lệ hoàn thành tuyến</div>
          <p className="text-[11px] text-slate-500 mb-3">Phần trăm người dùng hoàn tất mỗi tuyến so với lượt xem.</p>
          <div className="h-64">
            <ResponsiveContainer>
              <RadialBarChart
                innerRadius="35%"
                outerRadius="100%"
                data={routeEngagement.map((r, i) => ({
                  ...r,
                  pct: Math.round((r.completes / r.views) * 100),
                  fill: activityColors[i] ?? "#0ea5e9",
                }))}
                startAngle={90}
                endAngle={-270}
              >
                <defs>
                  <linearGradient id="radialGradient" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <RadialBar background dataKey="pct" cornerRadius={8} />
                <Legend
                  iconSize={8}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold mb-3">Phễu khám phá tuyến</div>
          <p className="text-[11px] text-slate-500 mb-3">Số lượng người dùng giảm dần qua từng giai đoạn hành trình.</p>
          <ul className="space-y-2">
            {funnel.map((f, i) => {
              const pct = Math.round((f.v / funnel[0].v) * 100);
              return (
                <li key={f.stage} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-500">{f.stage}</div>
                  <div className="flex-1 h-7 rounded-lg bg-slate-100 overflow-hidden relative">
                    <div className="h-full rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: `${pct}%` }} />
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white drop-shadow-sm">
                      {f.v.toLocaleString("vi-VN")}
                      <span className="ml-2 text-slate-100/90">({pct}%)</span>
                    </div>
                  </div>
                  {i < funnel.length - 1 && (
                    <div className="text-[10px] text-red-500 w-10 text-right">
                      −{Math.round((1 - funnel[i + 1].v / f.v) * 100)}%
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold mb-3">Tăng trưởng người dùng</div>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={userGrowth} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="m" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="u" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: "#0ea5e9" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold mb-3">Phễu khám phá tuyến</div>
          <p className="text-[11px] text-slate-500 mb-3">Số lượng người dùng giảm dần qua từng giai đoạn hành trình.</p>
          <ul className="space-y-2">
            {funnel.map((f, i) => {
              const pct = Math.round((f.v / funnel[0].v) * 100);
              return (
                <li key={f.stage} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-500">{f.stage}</div>
                  <div className="flex-1 h-7 rounded-lg bg-slate-100 overflow-hidden relative">
                    <div className="h-full rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: `${pct}%` }} />
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white drop-shadow-sm">
                      {f.v.toLocaleString("vi-VN")}
                      <span className="ml-2 text-slate-100/90">({pct}%)</span>
                    </div>
                  </div>
                  {i < funnel.length - 1 && (
                    <div className="text-[10px] text-red-500 w-10 text-right">
                      −{Math.round((1 - funnel[i + 1].v / f.v) * 100)}%
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold mb-3">Tăng trưởng người dùng</div>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={userGrowth} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="m" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="u" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: "#0ea5e9" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold mb-3">Hiệu quả quy trình duyệt</div>
        <p className="text-[11px] text-slate-500 mb-3">So sánh số nội dung được duyệt và từ chối theo ngày trong tuần.</p>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={approvalData} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="n" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="a" fill="#22c55e" radius={[6, 6, 0, 0]} name="Duyệt" />
              <Bar dataKey="r" fill="#f97316" radius={[6, 6, 0, 0]} name="Từ chối" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
