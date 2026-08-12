"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="cq-page-title">{title}</h1>
        <p className="cq-page-subtitle mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "info" | "warning";
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-100 text-emerald-700",
  info: "bg-sky-100 text-sky-700",
  warning: "bg-amber-100 text-amber-700",
};

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
}: StatCardProps) {
  return (
    <div className="cq-admin-panel p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="cq-label">
            {label}
          </p>
          <p className="mt-2.5 text-xl font-semibold text-slate-900">{value}</p>
        </div>
        <div
          className={
            "grid h-10 w-10 place-items-center rounded-2xl " + toneClasses[tone]
          }
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="cq-page-subtitle mt-3">{delta}</p>
    </div>
  );
}

interface StatusPillProps {
  status: "pending" | "approved" | "rejected";
}

export function StatusPill({ status }: StatusPillProps) {
  const label = status === "pending" ? "Chờ duyệt" : status === "approved" ? "Đã duyệt" : "Từ chối";
  const classes =
    status === "pending"
      ? "bg-amber-100 text-amber-700"
      : status === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}>{label}</span>;
}
// export function StatCard({ label, value, delta, icon: Icon, tone = "primary" }: { label: string; value: string; delta?: string; icon: LucideIcon; tone?: "primary" | "success" | "warning" | "info" }) {
//   const toneMap: Record<string, string> = {
//     primary: "from-primary/15 to-primary/0 text-primary",
//     success: "from-success/15 to-success/0 text-success",
//     warning: "from-warning/20 to-warning/0 text-warning",
//     info: "from-info/15 to-info/0 text-info",
//   };
//   return (
//     <motion.div whileHover={{ y: -2 }} className="card-elev rounded-2xl p-4 relative overflow-hidden">
//       <div className={`absolute inset-0 bg-gradient-to-br ${toneMap[tone]} opacity-60 pointer-events-none`} />
//       <div className="relative">
//         <div className="flex items-center justify-between">
//           <div className="text-xs text-muted-foreground">{label}</div>
//           <div className="w-8 h-8 rounded-lg bg-surface-2 grid place-items-center"><Icon className="w-4 h-4"/></div>
//         </div>
//         <div className="mt-2 text-2xl font-display font-bold">{value}</div>
//         {delta && <div className="text-[11px] mt-1 text-success">{delta}</div>}
//       </div>
//     </motion.div>
//   );
// }
