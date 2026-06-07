import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck, Tag, User } from "lucide-react";
import { approvals } from "@/data/demo";
import { ApprovalActionsClient } from "./ApprovalActionsClient";

function Badge({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
      <Icon className="h-4 w-4 text-slate-500" />
      {label}
    </span>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="cq-section-title">{title}</h2>
        <p className="cq-page-subtitle">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xl font-semibold text-slate-950">{value}</p>
      <p className="cq-label mt-1 text-slate-600">{label}</p>
    </div>
  );
}

export default async function ApprovalDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const item = approvals.find((a) => a.id === slug) ?? null;

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-8 py-6">
      <section className="-mx-6 overflow-hidden rounded-[2rem] bg-slate-950 shadow-sm sm:-mx-8">
        <div className="relative isolate">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-[42vh] min-h-[280px] w-full object-cover sm:h-[48vh] lg:h-[54vh]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/0" />

          <div className="absolute inset-x-0 top-0 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/admin/content-review"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Badge icon={Tag} label={item.type} />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Chi tiết duyệt nội dung</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {item.title}
                </h1>
                <p className="mt-3 text-sm text-white/80">Loại nội dung: {item.type}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge icon={User} label={item.curator} />
                <Badge icon={Clock3} label={new Date(item.submittedAt).toLocaleDateString("vi-VN")} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard
            title="Mô tả nhanh"
            description="Tổng quan nội dung đang chờ duyệt và các thông tin chính cần biết."
          >
            <p className="text-sm leading-7 text-slate-700">
              Trang này trình bày nội dung phê duyệt theo cấu trúc giống trang hotspot nhưng dành riêng cho duyệt nội dung.
              Bạn có thể xem qua tiêu đề, loại nội dung và thực hiện hành động phê duyệt / từ chối.
            </p>
          </SectionCard>

          <SectionCard
            title="Nội dung xem trước"
            description="Hình ảnh minh hoạ nội dung giúp xác nhận đề xuất."
          >
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full rounded-[1.5rem] object-cover"
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Chi tiết duyệt"
            description="Các thông tin cơ bản dành cho reviewer."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile value={item.type} label="Loại nội dung" />
              <StatTile value={item.curator} label="Người đề xuất" />
              <StatTile value={new Date(item.submittedAt).toLocaleDateString("vi-VN")} label="Ngày gửi" />
              <StatTile value={item.status === "pending" ? "Chờ duyệt" : item.status} label="Trạng thái" />
            </div>
          </SectionCard>

          <SectionCard
            title="Hành động duyệt"
            description="Thực hiện phê duyệt hoặc từ chối nội dung ngay tại đây."
          >
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-muted-foreground">Hành động</p>
              <div className="mt-4">
                <ApprovalActionsClient item={item} />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
