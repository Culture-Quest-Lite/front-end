"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import { users, type User } from "@/data/demo";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal } from "lucide-react";

const roleClasses: Record<string, string> = {
  Admin: "bg-red-100 text-red-700",
  Curator: "bg-sky-100 text-sky-700",
  Explorer: "bg-emerald-100 text-emerald-700",
  Guest: "bg-slate-100 text-slate-700",
};

const statusClasses: Record<string, string> = {
  "Hoạt động": "bg-emerald-100 text-emerald-700",
  "Đang xem xét": "bg-amber-100 text-amber-700",
  "Bị khoá": "bg-red-100 text-red-700",
};

export default function UsersManagerPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (user) =>
      (!query || user.name.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase())) &&
      (roleFilter === "all" || user.role === roleFilter)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Bố cục dashboard quản trị hiện đại cho vai trò, trạng thái và hành động hàng loạt."
      />

      <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Danh sách người dùng</h2>
            <p className="mt-1 text-sm text-slate-500">Tìm kiếm và sắp xếp người dùng trước khi thực hiện hành động.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full min-w-[220px] md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên hoặc email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="Admin">Quản trị viên</option>
              <option value="Curator">Người quản lý nội dung</option>
              <option value="Explorer">Người khám phá</option>
              <option value="Guest">Khách</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm">
          <div className="hidden min-w-[720px] grid-cols-[3.5fr_1fr_1fr_0.8fr_0.8fr] gap-4 px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-slate-500 md:grid">
            <div>Người dùng</div>
            <div>Vai trò</div>
            <div>Trạng thái</div>
            <div className="text-center">Lần check-in</div>
            <div className="text-right">Hành động</div>
          </div>

          <ul className="space-y-3 p-4 md:p-5">
            {filteredUsers.map((user) => (
              <li key={user.id} className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:shadow-none md:hover:shadow-sm">
                <div className="grid gap-4 p-4 md:grid-cols-[3.5fr_1fr_1fr_0.8fr_0.8fr] md:items-center md:p-4">
                  <div className="flex items-center gap-4">
                    <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                      <div className="mt-1 text-sm text-slate-500 truncate">{user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${roleClasses[user.role]}`}>
                      {user.role}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusClasses[user.status]}`}>
                      {user.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-center font-medium text-slate-900">{user.checkins}</div>

                  <div className="flex justify-end">
                    <div className="relative inline-flex text-left" tabIndex={-1} onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setOpenMenuId(null);
                      }
                    }}>
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                        aria-expanded={openMenuId === user.id}
                        aria-label="Mở menu hành động"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenuId === user.id ? (
                        <div className="absolute right-0 top-full z-10 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                          <button className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50">Xem chi tiết</button>
                          <button className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50">Chỉnh sửa</button>
                          <button className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50">Khoá tài khoản</button>
                          <button className="w-full px-4 py-3 text-left text-sm text-red-600 transition hover:bg-slate-50">Xóa người dùng</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 border-t border-slate-200 px-4 py-4 md:hidden">
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${roleClasses[user.role]}`}>
                      {user.role}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusClasses[user.status]}`}>
                      {user.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-900">
                    <span>{user.checkins} check-ins</span>
                    <div className="relative inline-flex text-left" tabIndex={-1} onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setOpenMenuId(null);
                      }
                    }}>
                      <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                          aria-expanded={openMenuId === user.id}
                          aria-label="Mở menu hành động"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenuId === user.id ? (
                          <div className="absolute right-0 top-full z-10 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                            <button className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50">Xem chi tiết</button>
                            <button className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50">Chỉnh sửa</button>
                            <button className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50">Khoá tài khoản</button>
                            <button className="w-full px-4 py-3 text-left text-sm text-red-600 transition hover:bg-slate-50">Xóa người dùng</button>
                          </div>
                        ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
