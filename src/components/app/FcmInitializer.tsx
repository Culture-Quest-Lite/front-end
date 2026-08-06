"use client";

import { useFcm } from "@/hooks/use-fcm";

/**
 * Component không render UI — chỉ khởi động FCM khi user đã login.
 * Đặt trong AdminLayout để chạy 1 lần khi vào khu vực admin.
 */
export function FcmInitializer() {
  useFcm();
  return null;
}
