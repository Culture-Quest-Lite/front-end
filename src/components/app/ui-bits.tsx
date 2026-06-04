import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
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
