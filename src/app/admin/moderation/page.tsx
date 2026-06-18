import { PageHeader } from "@/components/app/ui-bits";
import { reports } from "@/data/demo";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export const metadata = {
  title: "Kiểm duyệt",
};

const statusTone: Record<string, string> = {
  Mới: "bg-destructive/15 text-destructive border-destructive/30",
  "Đang xử lý": "bg-warning/20 text-warning-foreground border-warning/30",
  "Đã xử lý": "bg-success/15 text-success border-success/30",
};

export default function ModerationPage() {
  return (
    <div className="space-y-5">
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
        <Mini label="Báo cáo mới" value="3" tone="destructive" />
        <Mini label="Đang xử lý" value="2" tone="warning" />
        <Mini label="Đã xoá tuần này" value="11" tone="muted" />
      </div>

      <div className="card-elev rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">Hàng đợi báo cáo</div>
          <div className="flex gap-1 text-xs">
            {['Tất cả', 'Bình luận', 'Hình ảnh', 'Tài khoản'].map((t, i) => (
              <button
                key={t}
                className={`px-2.5 py-1 rounded-md ${
                  i === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-surface-2'
                }`}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-border">
          {reports.map((r) => {
            const Icon =
              r.type === 'Bình luận'
                ? MessageSquare
                : r.type === 'Hình ảnh'
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
                  <Button size="sm" variant="destructive" className="gap-1.5" type="button">
                    <Trash2 className="w-4 h-4" />Xoá mềm
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
            {['xxx1', 'xxx2', 'xxx3', 'xxx4', 'xxx5', 'spam', 'đểu', 'lừa đảo'].map((w) => (
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
            {['Review của user_4821', 'Ảnh upload Chợ Bến Thành', 'Bình luận tại Dinh Độc Lập'].map((t, i) => (
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
