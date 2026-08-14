import { apiFetch } from "@/lib/api";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  notificationType?: string;
  referenceId?: number;
}

export interface NotificationPage {
  content: NotificationItem[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  page?: { totalElements: number; totalPages: number; number: number; size: number };
}

/** Backend (Jackson + Lombok) may serialize `boolean isRead` as `read` instead of `isRead`. */
type RawNotificationItem = Omit<NotificationItem, "isRead"> & {
  isRead?: boolean;
  read?: boolean;
};

function normalizeNotificationItem(raw: RawNotificationItem): NotificationItem {
  const { read, ...rest } = raw;
  return {
    ...rest,
    isRead: Boolean(rest.isRead || read),
  };
}

function normalizeNotificationPage(page: NotificationPage & { content?: RawNotificationItem[] }): NotificationPage {
  return {
    ...page,
    content: (page.content ?? []).map(normalizeNotificationItem),
  };
}

export const notificationApi = {
  async getNotifications(page = 0, size = 10) {
    const response = await apiFetch<NotificationPage & { content?: RawNotificationItem[] }>(
      `/api/notifications?page=${page}&size=${size}`,
      {
        method: "GET",
        sameOrigin: true,
      },
    );
    return normalizeNotificationPage(response);
  },
  getUnreadCount() {
    return apiFetch<number>("/api/notifications/unread-count", {
      method: "GET",
      sameOrigin: true,
    });
  },
  markAsRead(id: number) {
    return apiFetch<string>(`/api/notifications/${id}/read`, {
      method: "PATCH",
      sameOrigin: true,
    });
  },

  /**
   * Backend chưa có endpoint đánh dấu đã đọc hàng loạt, nên phải duyệt các trang
   * thông báo để lấy toàn bộ id chưa đọc rồi gọi PATCH /{id}/read cho từng cái.
   */
  async getUnreadIds(size = 100, maxPages = 10) {
    const ids: number[] = [];
    for (let page = 0; page < maxPages; page += 1) {
      const result = await this.getNotifications(page, size);
      const content = result.content ?? [];
      content.forEach((item) => {
        if (!item.isRead) ids.push(item.id);
      });
      const totalPages = result.totalPages ?? result.page?.totalPages ?? 1;
      if (content.length < size || page + 1 >= totalPages) break;
    }
    return ids;
  },

  /** Đăng ký / cập nhật FCM device token cho user hiện tại */
  registerToken(token: string) {
    return apiFetch<{ message: string }>("/api/notifications/token", {
      method: "POST",
      body: { token },
      sameOrigin: true,
    });
  },
};
