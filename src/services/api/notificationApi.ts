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
    return apiFetch<NotificationItem>(`/api/notifications/${id}/read`, {
      method: "PATCH",
      sameOrigin: true,
    });
  },
  testPush() {
    return apiFetch<NotificationItem | string | { message?: string }>("/api/notifications/test-push", {
      method: "POST",
      sameOrigin: true,
    });
  },
};
