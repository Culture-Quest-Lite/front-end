"use client";

import { useState } from "react";
import { User as UserIcon } from "lucide-react";
import type { UserRole } from "@/services/api/admin/adminApi";

/** Vai trò hiển thị bằng tiếng Việt, dùng chung cho mọi trang admin. */
export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  CURATOR: "Biên tập viên",
  EXPLORER: "Người khám phá",
  PARTNER: "Đối tác",
};

export const roleClasses: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-700",
  CURATOR: "bg-sky-100 text-sky-700",
  EXPLORER: "bg-emerald-100 text-emerald-700",
  PARTNER: "bg-violet-100 text-violet-700",
};

/**
 * Ảnh đại diện thật của người dùng (`avatarUrl`). Người dùng chưa có ảnh — hoặc
 * link ảnh lỗi — thì dùng icon User thay vì ảnh sinh tự động.
 */
export function UserAvatar({
  avatarUrl,
  displayName,
  className,
  iconClassName,
}: {
  avatarUrl?: string;
  displayName: string;
  className: string;
  iconClassName: string;
}) {
  const [failed, setFailed] = useState(false);
  const canShowImage = !!avatarUrl?.trim() && !failed;

  if (!canShowImage) {
    return (
      <div
        className={`grid shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 ${className}`}
        aria-label={displayName}
      >
        <UserIcon className={iconClassName} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={displayName}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
