"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { adminApi, type UserProfile, type UserRole } from "@/services/api/admin/adminApi";
import {
  Search,
  MoreHorizontal,
  Loader2,
  Lock,
  LockOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const PAGE_SIZE = 10;

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  CURATOR: "Curator",
  EXPLORER: "Explorer",
  PARTNER: "Partner",
};

const roleClasses: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-700",
  CURATOR: "bg-sky-100 text-sky-700",
  EXPLORER: "bg-emerald-100 text-emerald-700",
  PARTNER: "bg-violet-100 text-violet-700",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Bị khoá",
  PENDING: "Đang xem xét",
  DELETED: "Đã xóa",
};

const statusClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  DELETED: "bg-slate-100 text-slate-700",
};

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

export default function UsersManagerPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getUsers({
        page: page - 1,
        size: PAGE_SIZE,
        search: query.trim() || undefined,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      const filtered =
        roleFilter === "all"
          ? response.content
          : response.content.filter((user) => user.role === roleFilter);
      setUsers(filtered);
      setTotalItems(response.page?.totalElements ?? 0);
      setTotalPages(Math.max(1, response.page?.totalPages || 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách người dùng.");
      setUsers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, query, roleFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const displayTotal = useMemo(() => {
    if (roleFilter === "all") return totalItems;
    return users.length;
  }, [roleFilter, totalItems, users.length]);

  function handleSearchChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleRoleChange(value: string) {
    setRoleFilter(value as UserRole | "all");
    setPage(1);
  }

  async function handleLockToggle(user: UserProfile) {
    setActionLoadingId(user.userId);
    try {
      if (user.status === "INACTIVE") {
        await adminApi.unlockUser(user.userId);
      } else {
        await adminApi.lockUser(user.userId);
      }
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái tài khoản.");
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
    }
  }

  async function handleRoleUpdate(user: UserProfile, role: UserRole) {
    setActionLoadingId(user.userId);
    try {
      await adminApi.updateUserRole(user.userId, role);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật vai trò.");
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Tìm kiếm, lọc và quản lý người dùng theo vai trò và trạng thái."
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Danh sách người dùng</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full min-w-[220px] md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm tên hoặc email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="ADMIN">Admin</option>
              <option value="CURATOR">Curator</option>
              <option value="EXPLORER">Explorer</option>
              <option value="PARTNER">Partner</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm">
          <div className="hidden min-w-[760px] grid-cols-[3fr_1fr_1fr_0.7fr_1.4fr] gap-4 px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-slate-500 md:grid">
            <div>Người dùng</div>
            <div>Vai trò</div>
            <div>Trạng thái</div>
            <div className="text-center">Điểm</div>
            <div className="text-right">Hành động</div>
          </div>

          <ul className="space-y-3 p-4 md:p-5">
            {loading ? (
              <li className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
              </li>
            ) : users.length === 0 ? (
              <li className="py-10 text-center text-sm text-slate-500">Không tìm thấy người dùng phù hợp.</li>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.userId}
                  user={user}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  actionLoading={actionLoadingId === user.userId}
                  onLockToggle={() => void handleLockToggle(user)}
                  onRoleUpdate={(role) => void handleRoleUpdate(user, role)}
                  onViewDetail={() => setSelectedUser(user)}
                />
              ))
            )}
          </ul>
        </div>

        <div className="mt-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={displayTotal}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {selectedUser ? (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      ) : null}
    </div>
  );
}

function UserRow({
  user,
  openMenuId,
  setOpenMenuId,
  actionLoading,
  onLockToggle,
  onRoleUpdate,
  onViewDetail,
}: {
  user: UserProfile;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  actionLoading: boolean;
  onLockToggle: () => void;
  onRoleUpdate: (role: UserRole) => void;
  onViewDetail: () => void;
}) {
  const displayName = user.displayName || user.username;
  const avatar =
    user.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;
  const isLocked = user.status === "INACTIVE";

  // Phần avatar + tên — bấm vào để mở modal xem chi tiết người dùng
  const userInfoButton = (
    <button
      type="button"
      onClick={onViewDetail}
      className="flex min-w-0 items-center gap-4 rounded-xl text-left transition hover:opacity-75"
    >
      <img src={avatar} alt={displayName} className="h-12 w-12 shrink-0 rounded-full object-cover" />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">{displayName}</div>
        <div className="mt-1 truncate text-sm text-slate-500">{user.email}</div>
      </div>
    </button>
  );

  // Menu "..." — gộp chung: Khoá/Mở khoá + Đổi vai trò
  const actionMenu = (
    <div
      className="relative inline-flex text-left"
      tabIndex={-1}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpenMenuId(null);
        }
      }}
    >
      <button
        type="button"
        disabled={actionLoading}
        onClick={() => setOpenMenuId(openMenuId === user.userId ? null : user.userId)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        aria-expanded={openMenuId === user.userId}
        aria-label="Mở menu hành động"
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </button>
      {openMenuId === user.userId ? (
        <div className="absolute right-0 top-full z-10 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={onLockToggle}
          >
            {isLocked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isLocked ? "Mở khoá tài khoản" : "Khoá tài khoản"}
          </button>

          <div className="border-t border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Đổi vai trò
          </div>
          {(["ADMIN", "CURATOR", "EXPLORER", "PARTNER"] as UserRole[]).map((role) => (
            <button
              key={role}
              type="button"
              className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:text-slate-400"
              disabled={user.role === role}
              onClick={() => onRoleUpdate(role)}
            >
              {roleLabels[role]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  const isMenuOpen = openMenuId === user.userId;

  return (
    <li
      className={`rounded-[16px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:shadow-none md:hover:shadow-sm ${
        isMenuOpen ? "relative z-20 overflow-visible" : "relative z-0 overflow-hidden"
      }`}
    >
      <div className="grid gap-4 p-4 md:grid-cols-[3fr_1fr_1fr_0.7fr_1.4fr] md:items-center md:p-4">
        {userInfoButton}
        <div className="flex items-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${roleClasses[user.role]}`}>
            {roleLabels[user.role]}
          </span>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusClasses[user.status] ?? statusClasses.PENDING}`}>
            {statusLabels[user.status] ?? user.status}
          </span>
        </div>
        <div className="flex items-center justify-center font-medium text-slate-900">
          {user.totalPoints ?? 0}
        </div>
        <div className="flex items-center justify-end">
          {actionMenu}
        </div>
      </div>
      <div className="grid gap-3 border-t border-slate-200 px-4 py-4 md:hidden">
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${roleClasses[user.role]}`}>
            {roleLabels[user.role]}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusClasses[user.status] ?? statusClasses.PENDING}`}>
            {statusLabels[user.status] ?? user.status}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-900">
          <span>{user.totalPoints ?? 0} điểm</span>
          {actionMenu}
        </div>
      </div>
    </li>
  );
}

/**
 * Modal xem chi tiết người dùng — hiện tất cả field trong UserProfile
 * NGOẠI TRỪ backgroundUrl và autoPlayAudio theo yêu cầu.
 *
 * ⚠ Type `UserProfile` (import từ "@/services/api/admin/adminApi") cần có
 * đủ các field: totalXp, isPremium, levelName, totalFollowers,
 * totalFollowing, totalPosts — nếu file adminApi.ts của bạn chưa khai báo,
 * thêm vào interface UserProfile cho khớp, ví dụ:
 *   totalXp: number;
 *   isPremium: boolean;
 *   levelName: string | null;
 *   totalFollowers: number;
 *   totalFollowing: number;
 *   totalPosts: number;
 */
function UserDetailModal({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  const displayName = user.displayName || user.username;
  const avatar =
    user.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 border-b border-slate-100 p-6">
          <img
            src={avatar}
            alt={displayName}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-slate-900">{displayName}</h2>
            <p className="truncate text-sm text-slate-500">@{user.username}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${roleClasses[user.role]}`}
              >
                {roleLabels[user.role]}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${
                  statusClasses[user.status] ?? statusClasses.PENDING
                }`}
              >
                {statusLabels[user.status] ?? user.status}
              </span>
              {user.isPremium ? (
                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[12px] font-semibold text-amber-700">
                  Premium
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 p-6">
          <StatBlock label="Điểm" value={formatNumber(user.totalPoints)} />
          <StatBlock label="XP" value={formatNumber(user.totalXp)} />
          <StatBlock label="Bài viết" value={formatNumber(user.totalPosts)} />
          <StatBlock label="Người theo dõi" value={formatNumber(user.totalFollowers)} />
          <StatBlock label="Đang theo dõi" value={formatNumber(user.totalFollowing)} />
          <StatBlock label="Cấp độ" value={user.levelName ?? "Chưa có"} />
        </div>

        <div className="space-y-2 p-6 text-sm">
          <DetailRow label="ID người dùng" value={String(user.userId)} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Tên đăng nhập" value={user.username} />
          <DetailRow
            label="Ngày tạo"
            value={new Date(user.createdAt).toLocaleString("vi-VN")}
          />
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <p className="truncate text-base font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="truncate font-medium text-slate-900">{value}</span>
    </div>
  );
}

/**
 * Thanh phân trang tự viết — thay cho component cũ đang hiển thị "1–NaN".
 * Luôn ép totalItems/totalPages về số hợp lệ trước khi tính toán, và hiện
 * rõ: khoảng mục đang xem, các nút số trang, nút Trước/Sau có nhãn chữ.
 */
function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const safeTotalItems = Number.isFinite(totalItems) ? Math.max(0, totalItems) : 0;
  const safeTotalPages = Math.max(1, Number.isFinite(totalPages) ? totalPages : 1);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  const from = safeTotalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, safeTotalItems);

  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(1, safePage - Math.floor(windowSize / 2));
    const end = Math.min(safeTotalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const arr: number[] = [];
    for (let i = start; i <= end; i += 1) arr.push(i);
    return arr;
  }, [safePage, safeTotalPages]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-600">
        Hiển thị <span className="font-semibold text-slate-900">{from}</span>
        {"–"}
        <span className="font-semibold text-slate-900">{to}</span> trong tổng số{" "}
        <span className="font-semibold text-slate-900">{safeTotalItems}</span> mục
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers[0] > 1 ? <span className="px-1 text-sm text-slate-400">…</span> : null}
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === safePage}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition ${
                p === safePage
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < safeTotalPages ? (
            <span className="px-1 text-sm text-slate-400">…</span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage >= safeTotalPages}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}