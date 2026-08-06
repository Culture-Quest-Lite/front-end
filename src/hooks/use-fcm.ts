/**
 * Hook tự động đăng ký FCM token với backend sau khi user login,
 * và lắng nghe foreground push notifications.
 */
"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { requestFcmToken, onForegroundMessage } from "@/lib/firebase";
import { notificationApi } from "@/services/api/notificationApi";
import { useAuth } from "@/hooks/use-auth";

const FCM_TOKEN_KEY = "cql_fcm_token";

export function useFcm() {
  const { session } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!session || registeredRef.current) return;

    async function init() {
      try {
        const token = await requestFcmToken();
        if (!token) {
          console.log("[FCM] No token — user declined or browser unsupported");
          return;
        }

        // Chỉ gọi backend nếu token thay đổi (tránh spam mỗi lần mount)
        const stored = localStorage.getItem(FCM_TOKEN_KEY);
        if (stored !== token) {
          await notificationApi.registerToken(token);
          localStorage.setItem(FCM_TOKEN_KEY, token);
          console.log("[FCM] Token registered:", token.slice(0, 20) + "...");
        }

        registeredRef.current = true;
      } catch (err) {
        console.error("[FCM] Init failed:", err);
      }
    }

    void init();

    // Lắng nghe foreground messages (tab đang mở)
    const unsubscribe = onForegroundMessage((payload) => {
      const { notification } = payload;
      if (notification?.title) {
        toast.info(notification.body || notification.title, {
          position: "top-right",
          autoClose: 5000,
        });
      }
      // Dispatch event → NotificationBell reload ngay lập tức
      window.dispatchEvent(new CustomEvent("cql:new-notification"));
    });

    return unsubscribe;
  }, [session]);
}
