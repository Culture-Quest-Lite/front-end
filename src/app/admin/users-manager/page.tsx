"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { users, type User } from "@/data/demo";
import { Button } from "@/components/ui/button";
import { Search, Lock, Unlock, ShieldAlert, MoreHorizontal, UserCog } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const roleTone: Record<string, string> = {
  Admin: "bg-destructive/15 text-destructive border-destructive/30",
  Curator: "bg-info/15 text-info border-info/30",
  Explorer: "bg-success/15 text-success border-success/30",
  Guest: "bg-muted text-muted-foreground border-border",
};

const statusTone: Record<string, string> = {
  "Hoạt động": "bg-success/15 text-success",
  "Bị khoá": "bg-destructive/15 text-destructive",
  "Đang xem xét": "bg-warning/20 text-warning-foreground",
};

export default function UsersManagerPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showLockDialog, setShowLockDialog] = useState(false);

  const filtered = users.filter(
    (u) =>
      (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q)) &&
      (role === "all" || u.role === role)
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Người dùng &amp; phân quyền"
        subtitle="Quản lý vai trò RBAC: Guest · Explorer · Curator · Admin (BR-20, BR-23, BR-25)."
      />

      <div className="card-elev rounded-2xl p-3 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên, email…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-2 border border-border text-sm outline-none"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 px-3 rounded-lg bg-surface-2 border border-border text-sm"
        >
          <option value="all">Mọi vai trò</option>
          <option>Admin</option>
          <option>Curator</option>
          <option>Explorer</option>
          <option>Guest</option>
        </select>
      </div>

      <div className="card-elev rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="col-span-4">Người dùng</div>
          <div className="col-span-2">Vai trò</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-2">Check-in</div>
          <div className="col-span-2 text-right">Hành động</div>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((u) => (
            <li key={u.id} className="grid grid-cols-12 px-4 py-3 items-center gap-2 hover:bg-surface-2/60">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="col-span-12 md:col-span-4 flex items-center gap-3 text-left">
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Chi tiết người dùng</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="w-16 h-16 rounded-full" />
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      <div className="mt-2 flex gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleTone[u.role]}`}>
                          {u.role}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusTone[u.status]}`}>
                          {u.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                    <Stat label="Check-in" value={String(u.checkins)} />
                    <Stat label="Đóng góp" value="12" />
                    <Stat label="Báo cáo" value="0" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold">Đổi vai trò</div>
                    <select
                      defaultValue={u.role}
                      className="w-full h-9 px-3 rounded-lg bg-surface-2 border border-border text-sm"
                    >
                      <option>Admin</option>
                      <option>Curator</option>
                      <option>Explorer</option>
                      <option>Guest</option>
                    </select>
                    <div className="text-[11px] text-warning-foreground inline-flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Cảnh báo: hành động này thay đổi quyền truy cập.
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {u.status === "Bị khoá" ? (
                      <Button className="flex-1" variant="outline">
                        <Unlock className="w-4 h-4 mr-1.5" />
                        Mở khoá
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(u);
                          setShowLockDialog(true);
                        }}
                      >
                        <Lock className="w-4 h-4 mr-1.5" />
                        Khoá tài khoản
                      </Button>
                    )}
                    <Button className="flex-1" variant="outline">
                      <UserCog className="w-4 h-4 mr-1.5" />
                      Cảnh cáo
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="col-span-6 md:col-span-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleTone[u.role]}`}>
                  {u.role}
                </span>
              </div>
              <div className="col-span-6 md:col-span-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusTone[u.status]}`}>
                  {u.status}
                </span>
              </div>
              <div className="hidden md:block col-span-2 text-sm">{u.checkins}</div>
              <div className="hidden md:flex col-span-2 justify-end">
                <button className="w-8 h-8 rounded-lg hover:bg-surface-2 grid place-items-center">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showLockDialog && selectedUser && (
        <LockAccountDialog
          user={selectedUser}
          onClose={() => {
            setShowLockDialog(false);
            setSelectedUser(null);
          }}
          onConfirm={() => {
            setShowLockDialog(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-lg">{value}</div>
    </div>
  );
}

function LockAccountDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
          Khoá tài khoản {user.name}?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Người dùng sẽ không thể đăng nhập cho tới khi được mở khoá. Hành động được ghi log audit.
        </p>
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Xác nhận khoá
          </Button>
        </div>
      </div>
    </div>
  );
}
