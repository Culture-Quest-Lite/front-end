import type { AuditLog } from "@/services/api/admin/adminApi";

/** Khớp `AuditAction.java` — hiển thị tiếng Việt thay cho tên enum. */
export const auditActionLabels: Record<string, string> = {
  LOCK_USER: "Khoá người dùng",
  UNLOCK_USER: "Mở khoá người dùng",
  UPDATE_USER_ROLE: "Đổi vai trò người dùng",
  APPROVE_POST: "Duyệt bài đăng",
  REJECT_POST: "Từ chối bài đăng",
  BAN_POST: "Xoá bài đăng",
  VERIFY_SUBSCRIPTION: "Xác minh hồ sơ đối tác",
  CREATE_SUBSCRIPTION_PLAN: "Tạo gói đăng ký",
  UPDATE_SUBSCRIPTION_PLAN: "Cập nhật gói đăng ký",
  DELETE_SUBSCRIPTION_PLAN: "Xoá gói đăng ký",
  UPDATE_ROLE_PERMISSION: "Cập nhật quyền vai trò",
  UPDATE_USER_PERMISSION: "Cập nhật quyền cá nhân",
  UNKNOWN: "Không xác định",
};

export function getActionLabel(action?: string) {
  if (!action) return "Không xác định";
  return auditActionLabels[action] ?? action;
}

/** Tên bảng trong audit log → tên đối tượng bằng tiếng Việt. */
export const auditTableLabels: Record<string, string> = {
  users: "Người dùng",
  posts: "Bài đăng",
  hotspots: "Địa điểm",
  routes: "Tuyến hành trình",
  stories: "Câu chuyện",
  tags: "Thẻ",
  levels: "Cấp độ",
  vouchers: "Voucher",
  invoice: "Hoá đơn đối tác",
  invoices: "Hoá đơn đối tác",
  subscription_plans: "Gói đăng ký",
  subscriptionplan: "Gói đăng ký",
  permissions: "Quyền",
  role_permissions: "Quyền theo vai trò",
  user_permissions: "Quyền cá nhân",
};

export function getTableLabel(tableName?: string) {
  if (!tableName) return "Không rõ đối tượng";
  return auditTableLabels[tableName.toLowerCase()] ?? tableName;
}

/**
 * Khoá có thể dùng làm tên đối tượng, xếp theo mức độ dễ hiểu với người đọc.
 * Audit log không trả kèm tên nên phải lấy từ oldValue/newValue.
 */
const recordNameKeys = [
  "displayName",
  "shopName",
  "subscriptionPlanName",
  "hotspotName",
  "routeName",
  "storyName",
  "tagName",
  "levelName",
  "voucherName",
  "title",
  "name",
  "username",
  "code",
  "email",
  "content",
];

/** Chuỗi JSON trong oldValue/newValue được parse để đọc field bên trong. */
export function normalizeAuditValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

/** Tên đối tượng đọc được, thay cho việc hiện thẳng recordId. */
export function getRecordName(item: AuditLog) {
  for (const source of [item.newValue, item.oldValue]) {
    const parsed = normalizeAuditValue(source);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;

    const record = parsed as Record<string, unknown>;
    for (const key of recordNameKeys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        const text = value.trim();
        return text.length > 60 ? `${text.slice(0, 60)}…` : text;
      }
    }
  }
  return null;
}

/** Nhãn đối tượng đầy đủ: "Bài đăng · Tên đối tượng" (không có id). */
export function getAuditTargetLabel(item: AuditLog) {
  const table = getTableLabel(item.tableName);
  const name = getRecordName(item);
  return name ? `${table} · ${name}` : table;
}
