"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import {
  adminApi,
  type UserProfile,
  type UserRole,
  type PermissionGroupResponse,
  type UserPermissionResponse,
  type GrantUserPermissionRequest,
  type RolePermissionMatrixResponse,
} from "@/services/api/admin/adminApi";
import {
  KeyRound,
  Users,
  Loader2,
  Plus,
  Search,
  Trash2,
  Check,
  X,
  Save,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES: UserRole[] = ["EXPLORER", "CURATOR", "PARTNER", "ADMIN"];

const roleLabels: Record<UserRole, string> = {
  EXPLORER: "Người khám phá",
  CURATOR: "Biên tập viên",
  PARTNER: "Đối tác",
  ADMIN: "Quản trị viên",
};

const roleColors: Record<UserRole, string> = {
  EXPLORER: "bg-blue-100 text-blue-700",
  CURATOR: "bg-amber-100 text-amber-700",
  PARTNER: "bg-emerald-100 text-emerald-700",
  ADMIN: "bg-red-100 text-red-700",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const [tab, setTab] = useState<"roles" | "users">("roles");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Quản lý phân quyền"
        subtitle="Quản lý quyền theo role và ngoại lệ quyền cho từng người dùng."
      />

      {/* Tab switcher */}
      <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setTab("roles")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "roles"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <KeyRound className="h-4 w-4" /> Quyền theo vai trò
        </button>
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "users"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="h-4 w-4" /> Quyền cá nhân
        </button>
      </div>

      {tab === "roles" ? (
        <RolePermissionsTab showToast={showToast} />
      ) : (
        <UserPermissionsTab showToast={showToast} />
      )}
    </div>
  );
}

// ─── Tab 1: Role Permissions ──────────────────────────────────────────────────

function RolePermissionsTab({ showToast }: { showToast: (msg: string) => void }) {
  const [data, setData] = useState<RolePermissionMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("EXPLORER");
  const [edits, setEdits] = useState<Record<string, Set<string>>>({});
  const [saving, setSaving] = useState(false);

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPermissionMatrix();
      setData(res);
      const init: Record<string, Set<string>> = {};
      for (const role of ROLES) {
        init[role] = new Set(res.matrix[role] ?? []);
      }
      setEdits(init);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải ma trận phân quyền.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMatrix(); }, [loadMatrix]);

  function togglePerm(code: string) {
    setEdits((prev) => {
      const next = new Set(prev[selectedRole] ?? []);
      if (next.has(code)) next.delete(code); else next.add(code);
      return { ...prev, [selectedRole]: next };
    });
  }

  function toggleGroup(codes: string[], value: boolean) {
    setEdits((prev) => {
      const next = new Set(prev[selectedRole] ?? []);
      for (const c of codes) { if (value) next.add(c); else next.delete(c); }
      return { ...prev, [selectedRole]: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.updateRolePermissions(selectedRole, [...(edits[selectedRole] ?? [])]);
      showToast(`Đã lưu phân quyền cho ${roleLabels[selectedRole]}.`);
      await loadMatrix();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu phân quyền.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const currentCodes = edits[selectedRole] ?? new Set<string>();
  const original = new Set(data.matrix[selectedRole] ?? []);
  const hasChanges =
    currentCodes.size !== original.size ||
    [...currentCodes].some((c) => !original.has(c));
  const allPerms = data.allPermissions.flatMap((g) => g.permissions);

  return (
    <div className="grid grid-cols-[180px_1fr] gap-4">
      {/* Role sidebar */}
      <div className="space-y-1">
        {ROLES.map((role) => {
          const orig = new Set(data.matrix[role] ?? []);
          const cur = edits[role] ?? new Set<string>();
          const dirty = cur.size !== orig.size || [...cur].some((c) => !orig.has(c));
          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                selectedRole === role
                  ? "bg-[#FFF3F8] text-[#D94A8D] ring-1 ring-[#F7DCE8]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{roleLabels[role]}</span>
              {dirty && (
                <span className="h-2 w-2 rounded-full bg-amber-400" title="Có thay đổi chưa lưu" />
              )}
            </button>
          );
        })}
      </div>

      {/* Matrix panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleColors[selectedRole]}`}>
              {roleLabels[selectedRole]}
            </span>
            <span className="text-sm text-slate-500">
              {currentCodes.size} / {allPerms.length} quyền
            </span>
          </div>
          <Button size="sm" className="gap-1.5" disabled={saving || !hasChanges} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu thay đổi
          </Button>
        </div>

        <div className="space-y-3">
          {data.allPermissions.map((group) => {
            const groupCodes = group.permissions.map((p) => p.code);
            const allChecked = groupCodes.every((c) => currentCodes.has(c));
            const someChecked = groupCodes.some((c) => currentCodes.has(c));
            return (
              <GroupCard
                key={group.groupName}
                group={group}
                currentCodes={currentCodes}
                allChecked={allChecked}
                someChecked={someChecked}
                onToggleGroup={(v) => toggleGroup(groupCodes, v)}
                onTogglePerm={togglePerm}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── GroupCard (extracted to avoid inline ref callback warning) ───────────────

function GroupCard({
  group, currentCodes, allChecked, someChecked, onToggleGroup, onTogglePerm,
}: {
  group: PermissionGroupResponse;
  currentCodes: Set<string>;
  allChecked: boolean;
  someChecked: boolean;
  onToggleGroup: (v: boolean) => void;
  onTogglePerm: (code: string) => void;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someChecked && !allChecked;
    }
  }, [someChecked, allChecked]);

  return (
    <div className="cq-admin-panel">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={allChecked}
          onChange={(e) => onToggleGroup(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#D94A8D] focus:ring-[#D94A8D]"
        />
        <span className="text-sm font-semibold text-slate-700">{group.groupName}</span>
        <span className="ml-auto text-xs text-slate-400">
          {group.permissions.filter((p) => currentCodes.has(p.code)).length}/{group.permissions.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
        {group.permissions.map((perm) => {
          const checked = currentCodes.has(perm.code);
          return (
            <label
              key={perm.code}
              className={`flex cursor-pointer items-start gap-3 bg-white p-3 transition hover:bg-slate-50 ${checked ? "bg-[#FFF9FB]" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onTogglePerm(perm.code)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-[#D94A8D] focus:ring-[#D94A8D]"
              />
              <p className={`truncate text-xs font-semibold ${checked ? "text-[#D94A8D]" : "text-slate-700"}`}>
                {perm.code}
              </p>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 2: User Permissions ──────────────────────────────────────────────────

const USER_PAGE_SIZE = 10;

function UserPermissionsTab({ showToast }: { showToast: (msg: string) => void }) {
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [overrides, setOverrides] = useState<UserPermissionResponse[]>([]);
  const [allGroups, setAllGroups] = useState<PermissionGroupResponse[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getPermissions().then(setAllGroups).catch(() => {});
  }, []);

  /**
   * Danh sách người dùng hiện sẵn ngay khi mở tab để admin chọn trực tiếp,
   * ô tìm kiếm chỉ để lọc bớt khi danh sách dài.
   */
  const loadUsers = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await adminApi.getUsers({
        page,
        size: USER_PAGE_SIZE,
        search: search || undefined,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setUsers(res.content);
      setTotalPages(Math.max(1, res.page?.totalPages ?? 1));
    } catch (err) {
      setUsers([]);
      setTotalPages(1);
      setListError(err instanceof Error ? err.message : "Không thể tải danh sách người dùng.");
    } finally {
      setListLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function applySearch() {
    setPage(0);
    setSearch(keyword.trim());
  }

  async function selectUser(user: UserProfile) {
    setSelectedUser(user);
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUserPermissions(user.userId);
      setOverrides(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải quyền người dùng.");
      setOverrides([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(code: string) {
    if (!selectedUser) return;
    setDeleting(code);
    try {
      await adminApi.deleteUserPermission(selectedUser.userId, code);
      setOverrides((prev) => prev.filter((o) => o.code !== code));
      showToast(`Đã xoá ngoại lệ quyền ${code}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xoá quyền.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleUpsert(req: GrantUserPermissionRequest) {
    if (!selectedUser) return;
    await adminApi.upsertUserPermission(selectedUser.userId, req);
    const res = await adminApi.getUserPermissions(selectedUser.userId);
    setOverrides(res);
    showToast(`Đã ${req.granted ? "cấp" : "thu hồi"} quyền ${req.code}.`);
  }

  const selectedName = selectedUser
    ? selectedUser.displayName || selectedUser.username
    : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[460px_1fr] xl:grid-cols-[560px_1fr]">
      {/* Cột trái: danh sách người dùng để chọn */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#D94A8D] focus:ring-2 focus:ring-[#F7DCE8]"
            />
          </div>
          <Button size="sm" onClick={applySearch} disabled={listLoading}>
            {listLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm"}
          </Button>
        </div>

        {listError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{listError}</div>
        ) : null}

        <div className="cq-admin-panel divide-y divide-slate-100">
          {listLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Không tìm thấy người dùng phù hợp.
            </div>
          ) : (
            users.map((user) => {
              const active = selectedUser?.userId === user.userId;
              return (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => void selectUser(user)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                    active ? "bg-[#FFF3F8]" : "hover:bg-[#FFF9FC]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${active ? "text-[#D94A8D]" : "text-slate-800"}`}>
                      {user.displayName || user.username}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0 || listLoading}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              Trước
            </Button>
            <span>
              Trang {page + 1} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1 || listLoading}
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            >
              Sau
            </Button>
          </div>
        ) : null}
      </div>

      {/* Cột phải: ngoại lệ quyền của người đang chọn */}
      <div className="space-y-3">
        {!selectedUser ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">Chọn một người dùng ở danh sách bên trái</p>
            <p className="mt-1 text-xs text-slate-400">
              Ngoại lệ quyền sẽ đè lên quyền mặc định theo vai trò của người đó.
            </p>
          </div>
        ) : (
          <>
            <div className="cq-admin-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{selectedName}</p>
                <p className="truncate text-xs text-slate-500">
                  {selectedUser.email} · Vai trò: {roleLabels[selectedUser.role]}
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" /> Thêm ngoại lệ
              </Button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải quyền cá nhân...
              </div>
            ) : overrides.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
                {selectedName} chưa có ngoại lệ quyền nào — đang dùng đúng quyền của vai trò{" "}
                {roleLabels[selectedUser.role]}.
              </div>
            ) : (
              <div className="cq-admin-panel">
                <table className="cq-admin-table">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[14%]" />
                    <col className="w-[24%]" />
                    <col className="w-[14%]" />
                    <col className="w-[15%]" />
                    <col className="w-[7%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Mã quyền</th>
                      <th>Loại</th>
                      <th>Lý do</th>
                      <th>Hết hạn</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.map((o) => (
                      <tr key={o.code}>
                        <td className="font-mono text-xs font-semibold text-slate-700">{o.code}</td>
                        <td>
                          {o.granted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              <Check className="h-3 w-3" /> Cấp thêm
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                              <X className="h-3 w-3" /> Thu hồi
                            </span>
                          )}
                        </td>
                        <td className="text-slate-500">{o.reason || "—"}</td>
                        <td className="text-slate-500">
                          {o.expiresAt ? new Date(o.expiresAt).toLocaleDateString("vi-VN") : "Vĩnh viễn"}
                        </td>
                        <td>
                          {o.expired ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Đã hết hạn</span>
                          ) : (
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600">Đang hiệu lực</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            disabled={deleting === o.code}
                            onClick={() => void handleDelete(o.code)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                            aria-label="Xoá"
                          >
                            {deleting === o.code ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && selectedUser ? (
        <AddPermissionModal
          allGroups={allGroups}
          onCancel={() => setShowModal(false)}
          onSubmit={async (req) => { await handleUpsert(req); setShowModal(false); }}
        />
      ) : null}
    </div>
  );
}

// ─── Modal: Add User Permission Override ─────────────────────────────────────

function AddPermissionModal({
  allGroups,
  onCancel,
  onSubmit,
}: {
  allGroups: PermissionGroupResponse[];
  onCancel: () => void;
  onSubmit: (req: GrantUserPermissionRequest) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [granted, setGranted] = useState(true);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit() {
    if (!code) { setErr("Vui lòng chọn mã quyền."); return; }
    if (!reason.trim()) { setErr("Phải nhập lý do để audit."); return; }
    setSubmitting(true);
    setErr(null);
    try {
      await onSubmit({
        code,
        granted,
        reason: reason.trim(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể lưu ngoại lệ.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Thêm ngoại lệ quyền</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ngoại lệ sẽ đè lên quyền mặc định của role người dùng.
          </p>
        </div>

        <div className="space-y-4 p-6">
          {err ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Mã quyền</label>
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#D94A8D] focus:ring-2 focus:ring-[#F7DCE8]"
            >
              <option value="">— Chọn quyền —</option>
              {allGroups.map((group) => (
                <optgroup key={group.groupName} label={group.groupName}>
                  {group.permissions.map((p) => (
                    <option key={p.code} value={p.code}>{p.code}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Loại ngoại lệ</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGranted(true)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-medium transition ${
                  granted
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Check className="h-4 w-4" /> Cấp thêm quyền
              </button>
              <button
                type="button"
                onClick={() => setGranted(false)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-medium transition ${
                  !granted
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <X className="h-4 w-4" /> Thu hồi quyền
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Lý do <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ví dụ: Hỗ trợ kiểm duyệt đợt tháng 8..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#D94A8D] focus:ring-2 focus:ring-[#F7DCE8]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Hết hạn <span className="text-slate-400">(để trống = vĩnh viễn)</span>
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#D94A8D] focus:ring-2 focus:ring-[#F7DCE8]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Huỷ</Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu ngoại lệ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
