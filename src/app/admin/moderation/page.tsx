"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { reports } from "@/data/demo";
import { Button } from "@/components/ui/button";
import { adminApi, type PostItem } from "@/services/api/admin/adminApi";
import {
  Flag,
  Trash2,
  RotateCcw,
  ShieldAlert,
  MessageSquare,
  Image as ImageIcon,
  User,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const statusTone: Record<string, string> = {
  Mới: "bg-destructive/15 text-destructive border-destructive/30",
  "Đang xử lý": "bg-warning/20 text-warning-foreground border-warning/30",
  "Đã xử lý": "bg-success/15 text-success border-success/30",
};

export default function ModerationPage() {
  const [flaggedPosts, setFlaggedPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadFlaggedPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const response = await adminApi.getPosts({ status: "REJECTED", page: 0, size: 20 });
      setFlaggedPosts(response.content);
    } catch {
      setFlaggedPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    void loadFlaggedPosts();
  }, [loadFlaggedPosts]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleBanPost(postId: number) {
    setActionId(postId);
    try {
      await adminApi.banPost(postId, "Xóa mềm bởi admin qua kiểm duyệt");
      setFlaggedPosts((prev) => prev.filter((p) => p.postId !== postId));
      showToast("Đã xóa mềm bài đăng.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xóa bài đăng.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Kiểm duyệt nội dung"
        subtitle="Xử lý báo cáo, xoá mềm và phục hồi (BR-54, BR-69, BR-72)."
        actions={
          <Button size="sm" variant="outline" className="gap-1.5">
            <ShieldAlert className="w-4 h-4" />Cấu hình bộ lọc
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Mini label="Báo cáo mới" value={String(reports.filter((r) => r.status === "Mới").length)} tone="destructive" />
        <Mini label="Bài bị từ chối" value={String(flaggedPosts.length)} tone="warning" />
        <Mini label="Đã xử lý" value={String(reports.filter((r) => r.status === "Đã xử lý").length)} tone="muted" />
      </div>

      <div className="card-elev rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">Bài đăng bị từ chối</div>
          <Button size="sm" variant="outline" onClick={() => void loadFlaggedPosts()}>
            {loadingPosts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Làm mới"}
          </Button>
        </div>

        <ul className="divide-y divide-border">
          {loadingPosts ? (
            <li className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </li>
          ) : flaggedPosts.length === 0 ? (
            <li className="p-8 text-center text-sm text-muted-foreground">Không có bài đăng bị từ chối.</li>
          ) : (
            flaggedPosts.map((post) => (
              <li key={post.postId} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{post.content}</div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    {post.reason ?? "Bị từ chối"} · {post.displayName || post.username}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-warning/20 text-warning-foreground border-warning/30">
                  {post.status}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="gap-1.5" type="button" disabled={actionId === post.postId} onClick={() => void handleBanPost(post.postId)}>
                    {actionId === post.postId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Xoá mềm
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="card-elev rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold">Hàng đợi báo cáo (demo)</div>
        </div>

        <ul className="divide-y divide-border">
          {reports.map((r) => {
            const Icon =
              r.type === "Bình luận"
                ? MessageSquare
                : r.type === "Hình ảnh"
                  ? ImageIcon
                  : User;
            return (
              <li key={r.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.target}</div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    {r.reason} · Báo cáo bởi {r.reporter}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusTone[r.status]}`}>
                  {r.status}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" type="button">
                    <ShieldCheck className="w-4 h-4" />Bỏ qua
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="card-elev rounded-2xl p-4">
          <div className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
            <Flag className="w-4 h-4" />Bộ lọc từ ngữ thô tục
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {["xxx1", "xxx2", "xxx3", "xxx4", "xxx5", "spam", "đểu", "lừa đảo"].map((w) => (
              <span
                key={w}
                className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/30"
              >
                {w} ×
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Thêm từ khoá…"
              className="flex-1 h-9 px-3 rounded-lg bg-surface-2 border border-border text-sm outline-none"
            />
            <Button size="sm" type="button">
              Thêm
            </Button>
          </div>
        </section>

        <section className="card-elev rounded-2xl p-4">
          <div className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />Thùng rác (xoá mềm)
          </div>
          <ul className="text-sm divide-y divide-border">
            {["Review của user_4821", "Ảnh upload Chợ Bến Thành", "Bình luận tại Dinh Độc Lập"].map((t, i) => (
              <li key={t} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{t}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Xoá cách đây {i + 1} ngày · còn {29 - i} ngày
                  </div>
                </div>
                <Button size="sm" variant="outline" type="button">
                  Phục hồi
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "destructive" | "warning" | "muted";
}) {
  const cls =
    tone === "destructive"
      ? "from-destructive/15 to-destructive/0 text-destructive"
      : tone === "warning"
        ? "from-warning/20 to-warning/0 text-warning-foreground"
        : "from-muted to-muted/0 text-muted-foreground";

  return (
    <div className={`card-elev rounded-2xl p-3 bg-gradient-to-br ${cls}`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-2xl">{value}</div>
    </div>
  );
}
