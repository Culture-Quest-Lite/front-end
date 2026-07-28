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

export const notificationApi = {
  getNotifications(page = 0, size = 10) {
    return apiFetch<NotificationPage>(`/api/notifications?page=${page}&size=${size}`, {
      method: "GET",
      sameOrigin: true,
    });
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
    return apiFetch<NotificationItem>("/api/notifications/test-push", {
      method: "POST",
      sameOrigin: true,
    });
  },
};
