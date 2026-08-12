"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck, Tag, User, Loader2 } from "lucide-react";
import { adminApi, type PostItem } from "@/services/api/admin/adminApi";
import { ApprovalActionsClient } from "./ApprovalActionsClient";

const postStatusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  REPORTING: "Đang bị báo cáo",
  REPORTED: "Đã gỡ do báo cáo",
  DELETED: "Đã xoá",
};

function Badge({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
      <Icon className="h-4 w-4 text-slate-500" />
      {label}
    </span>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
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

export default function ApprovalDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const postId = Number(params.slug);
  const [item, setItem] = useState<PostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(postId)) {
      setError("ID bài đăng không hợp lệ.");
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const post = await adminApi.getPostById(postId);
        setItem(post);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tìm thấy bài đăng.");
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải chi tiết...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-sm text-red-600">{error ?? "Không tìm thấy bài đăng."}</p>
        <button
          type="button"
          onClick={() => router.push("/admin/content-review")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Quay lại hàng đợi duyệt
        </button>
      </div>
    );
  }

  const author = item.displayName || item.username;

  return (
    <div className="space-y-6 py-5">
      <section className="overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-sm">
        <div className="relative isolate min-h-[240px] bg-gradient-to-br from-slate-800 to-slate-950 p-5">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/0" />

          <div className="relative flex items-center justify-between gap-3">
            <Link
              href="/admin/content-review"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Badge icon={Tag} label="Bài đăng" />
          </div>

          <div className="relative mt-12 max-w-3xl text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Chi tiết duyệt nội dung</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Bài đăng của {author}
            </h1>
            <p className="mt-3 line-clamp-3 text-sm text-white/80">{item.content}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Badge icon={User} label={author} />
              <Badge
                icon={Clock3}
                label={
                  item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                    : "—"
                }
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard
            title="Nội dung bài đăng"
            description="Nội dung do người dùng gửi cần được xem xét trước khi xuất bản."
          >
            <p className="text-sm leading-7 text-slate-700">{item.content}</p>
          </SectionCard>

          {item.tags && item.tags.length > 0 ? (
            <SectionCard title="Thẻ" description="Các thẻ được gắn kèm bài đăng.">
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag.tagId}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {tag.tagName}
                  </span>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <SectionCard title="Chi tiết duyệt" description="Các thông tin cơ bản dành cho reviewer.">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile value="Bài đăng" label="Loại nội dung" />
              <StatTile value={author} label="Người đề xuất" />
              <StatTile
                value={
                  item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                    : "—"
                }
                label="Ngày gửi"
              />
              <StatTile
                value={postStatusLabels[item.status] ?? item.status}
                label="Trạng thái"
              />
            </div>
          </SectionCard>

          <SectionCard title="Hành động duyệt" description="Thực hiện phê duyệt hoặc từ chối nội dung ngay tại đây.">
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
