"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, Loader2, Send } from "lucide-react";
import { notificationApi, type NotificationItem } from "@/services/api/notificationApi";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const loadSeqRef = useRef(0);
  const readIdsRef = useRef(new Set<number>());

  const applyLoadedNotifications = useCallback((content: NotificationItem[], count: number) => {
    const locallyMarkedUnread = content.filter(
      (item) => !item.isRead && readIdsRef.current.has(item.id),
    ).length;

    const merged = content.map((item) => ({
      ...item,
      isRead: item.isRead || readIdsRef.current.has(item.id),
    }));

    merged.forEach((item) => {
      if (item.isRead) readIdsRef.current.add(item.id);
    });

    setItems(merged);
    setUnread(
      typeof count === "number"
        ? Math.max(0, count - locallyMarkedUnread)
        : merged.filter((item) => !item.isRead).length,
    );
  }, []);

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const [page, count] = await Promise.all([
        notificationApi.getNotifications(0, 10),
        notificationApi.getUnreadCount(),
      ]);
      if (seq !== loadSeqRef.current) return;
      applyLoadedNotifications(page.content ?? [], count);
    } catch {
      if (seq !== loadSeqRef.current) return;
      setItems([]);
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [applyLoadedNotifications]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markRead(item: NotificationItem) {
    if (item.isRead || readIdsRef.current.has(item.id)) return;

    readIdsRef.current.add(item.id);
    setItems((current) =>
      current.map((value) => (value.id === item.id ? { ...value, isRead: true } : value)),
    );
    setUnread((value) => Math.max(0, value - 1));

    try {
      await notificationApi.markAsRead(item.id);
    } catch {
      readIdsRef.current.delete(item.id);
      setItems((current) =>
        current.map((value) => (value.id === item.id ? { ...value, isRead: false } : value)),
      );
      setUnread((value) => value + 1);
    }
  }

  async function sendTestNotification() {
    setTesting(true);
    setTestMessage(null);
    try {
      const result = await notificationApi.testPush();
      const message =
        typeof result === "string"
          ? result
          : result && typeof result === "object" && "message" in result && typeof result.message === "string"
            ? result.message
            : "Đã gửi thông báo test thành công.";
      setTestMessage(message || "Đã gửi thông báo test thành công.");
      await load();
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : "Không thể gửi thông báo test.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-slate-600 transition hover:bg-[#FFF3F8] hover:text-[#D94A8D]"
        aria-label="Thông báo"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Thông báo</p>
              <p className="text-xs text-slate-500">{unread} thông báo chưa đọc</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void sendTestNotification()}
                disabled={testing}
                className="flex items-center gap-1 text-xs font-semibold text-[#D94A8D] disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Gửi test
              </button>
              <button type="button" onClick={() => void load()} className="text-xs font-semibold text-slate-500 hover:text-[#D94A8D]">
                Làm mới
              </button>
            </div>
          </div>

          {testMessage && (
            <div className={`border-b px-4 py-2 text-xs ${testMessage.includes("thành công") ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
              {testMessage}
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải
              </div>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Chưa có thông báo.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void markRead(item)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 ${item.isRead ? "bg-white" : "bg-[#FFF7FB]"}`}
                >
                  <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.isRead ? "bg-slate-100 text-slate-500" : "bg-[#FFE7F2] text-[#D94A8D]"}`}>
                    {item.isRead ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      {!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D94A8D]" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
