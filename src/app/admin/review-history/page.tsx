"use client";

import { PageHeader } from "@/components/app/ui-bits";
import { audit, type AuditEntry } from "@/data/demo";
import { Check, X, Pencil, Lock, Filter, ArrowRight } from "lucide-react";

const iconFor = (a: string) =>
  a.includes("Duyệt")
    ? Check
    : a.includes("Từ chối")
      ? X
      : a.includes("Khoá")
        ? Lock
        : Pencil;

const toneFor = (a: string) =>
  a.includes("Duyệt")
    ? "bg-success/15 text-success"
    : a.includes("Từ chối")
      ? "bg-destructive/15 text-destructive"
      : a.includes("Khoá")
        ? "bg-warning/20 text-warning-foreground"
        : "bg-info/15 text-info";

export default function ReviewHistoryPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch sử duyệt &amp; Audit log"
        subtitle="Toàn bộ hoạt động kiểm duyệt và thay đổi nội dung (BR-71)."
        actions={
          <div className="flex gap-2">
            <select className="h-9 px-3 rounded-lg bg-surface-2 border border-border text-sm">
              <option>7 ngày qua</option>
              <option>30 ngày</option>
              <option>Tất cả</option>
            </select>
            <button className="h-9 px-3 rounded-lg bg-surface-2 border border-border text-sm inline-flex items-center gap-1.5">
              <Filter className="w-4 h-4" />
              Lọc
            </button>
          </div>
        }
      />

      <div className="card-elev rounded-2xl p-4">
        <ol className="relative border-l border-border ml-4 space-y-5">
          {audit.map((e: AuditEntry) => {
            const Icon = iconFor(e.action);
            return (
              <li key={e.id} className="ml-4">
                <div
                  className={`absolute -left-3 w-6 h-6 rounded-full grid place-items-center ${toneFor(e.action)}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="card-elev rounded-xl p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">{e.who}</span>
                    <span className="text-muted-foreground">
                      {e.action.toLowerCase()}
                    </span>
                    <span className="font-medium">{e.target}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {new Date(e.at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {(e.before || e.after) && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive line-through">
                        {e.before}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="px-2 py-0.5 rounded bg-success/10 text-success">
                        {e.after}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
