import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div
          className={
            "grid h-11 w-11 place-items-center rounded-2xl " + toneClasses[tone]
          }
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{delta}</p>
    </div>
  );
}

interface StatusPillProps {
  status: "pending" | "approved" | "rejected";
}

const statusClasses: Record<StatusPillProps["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export function StatusPill({ status }: StatusPillProps) {
  const labels: Record<StatusPillProps["status"], string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {labels[status]}
    </span>
  );
}
