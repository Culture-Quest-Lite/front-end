"use client";

import { PageHeader, StatCard } from "@/components/app/ui-bits";
import { checkinsTrend, userGrowth, routeEngagement, funnel } from "@/data/demo";
import { Activity, MapPin, Users, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, RadialBar, RadialBarChart, Legend } from "recharts";

// lucide alias
import { Route as RIcon } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <PageHeader 
        title="Phân tích nâng cao" 
        subtitle="Hiệu năng nội dung, tuyến và hành vi người dùng (BR-68, BR-70)." 
        actions={
          <div className="flex gap-2">
            {["Ngày","Tuần","Tháng","Năm"].map((t,i)=><button key={t} className={`px-2.5 py-1.5 text-xs rounded-lg ${i===2?"bg-primary text-primary-foreground":"bg-surface-2 text-muted-foreground"}`}>{t}</button>)}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tổng check-in" value="12.840" delta="+22%" icon={Activity} tone="primary"/>
        <StatCard label="Hotspot xuất bản" value="58" delta="+5" icon={MapPin} tone="success"/>
        <StatCard label="Tuyến hoạt động" value="14" delta="+2" icon={RIcon} tone="info"/>
        <StatCard label="Người dùng mới" value="372" delta="+18%" icon={Users} tone="warning"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elev rounded-2xl p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Xu hướng check-in</div>
            <TrendingUp className="w-4 h-4 text-success"/>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={checkinsTrend} margin={{left:-16,right:8,top:8,bottom:0}}>
                <defs>
                  <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45}/>
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ background:"var(--popover)", border:"1px solid var(--border)", borderRadius:10 }}/>
                <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} fill="url(#ga)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elev rounded-2xl p-4">
          <div className="text-sm font-semibold mb-3">Tỉ lệ hoàn thành tuyến</div>
          <div className="h-64">
            <ResponsiveContainer>
              <RadialBarChart 
                innerRadius="35%" 
                outerRadius="100%" 
                data={routeEngagement.map((r,i)=>({ 
                  ...r, 
                  pct: Math.round((r.completes/r.views)*100), 
                  fill: `var(--chart-${(i%5)+1})` 
                }))} 
                startAngle={90} 
                endAngle={-270}
              >
                <RadialBar background dataKey="pct" cornerRadius={8}/>
                <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11 }}/>
                <Tooltip contentStyle={{ background:"var(--popover)", border:"1px solid var(--border)", borderRadius:10 }}/>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elev rounded-2xl p-4 lg:col-span-2">
          <div className="text-sm font-semibold mb-3">Phễu khám phá tuyến</div>
          <ul className="space-y-2">
            {funnel.map((f, i) => {
              const pct = Math.round((f.v/funnel[0].v)*100);
              return (
                <li key={f.stage} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-muted-foreground">{f.stage}</div>
                  <div className="flex-1 h-7 rounded-lg bg-surface-2 overflow-hidden relative">
                    <div className="h-full rounded-lg bg-gradient-to-r from-primary to-warning" style={{ width: `${pct}%` }}/>
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                      {f.v.toLocaleString("vi-VN")} 
                      <span className="ml-2 text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                  {i<funnel.length-1 && (
                    <div className="text-[10px] text-destructive w-10 text-right">
                      −{Math.round((1-funnel[i+1].v/f.v)*100)}%
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card-elev rounded-2xl p-4">
          <div className="text-sm font-semibold mb-3">Tăng trưởng người dùng</div>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={userGrowth} margin={{left:-16,right:8,top:8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ background:"var(--popover)", border:"1px solid var(--border)", borderRadius:10 }}/>
                <Line type="monotone" dataKey="u" stroke="var(--info)" strokeWidth={2.5} dot={{ r: 3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elev rounded-2xl p-4 lg:col-span-2">
          <div className="text-sm font-semibold mb-3">Heatmap khám phá theo quận</div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => {
              const v = Math.floor(Math.random()*100);
              const bg = `color-mix(in oklab, var(--primary) ${10+v*0.7}%, transparent)`;
              return <div key={i} className="aspect-square rounded-md" style={{ background: bg }} title={`${v}`}/>;
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
            <span>Thấp</span>
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-primary/10 to-primary"/>
            <span>Cao</span>
          </div>
        </div>

        <div className="card-elev rounded-2xl p-4">
          <div className="text-sm font-semibold mb-3">Hiệu quả quy trình duyệt</div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart 
                data={[
                  {n:"T2",a:18,r:2},
                  {n:"T3",a:21,r:3},
                  {n:"T4",a:24,r:1},
                  {n:"T5",a:19,r:4},
                  {n:"T6",a:28,r:2},
                  {n:"T7",a:14,r:1},
                  {n:"CN",a:9,r:0}
                ]} 
                margin={{left:-16,right:8,top:8,bottom:0}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="n" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ background:"var(--popover)", border:"1px solid var(--border)", borderRadius:10 }}/>
                <Bar dataKey="a" fill="var(--success)" radius={[6,6,0,0]} name="Duyệt"/>
                <Bar dataKey="r" fill="var(--destructive)" radius={[6,6,0,0]} name="Từ chối"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
