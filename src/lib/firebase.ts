/**
 * Firebase client-side init + FCM helpers.
 * Chỉ chạy trên browser — tất cả hàm đều guard typeof window.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

/** Trả về Messaging instance. null nếu đang SSR hoặc browser không hỗ trợ. */
export function getFcmMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  try {
    return getMessaging(getFirebaseApp());
  } catch {
    return null;
  }
}

/**
 * Xin quyền notification → đăng ký service worker → lấy FCM token.
 * Trả về token string hoặc null nếu user từ chối / lỗi.
 */
export async function requestFcmToken(): Promise<string | null> {
  const messaging = getFcmMessaging();
  if (!messaging) return null;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" },
    );
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.error("[FCM] getToken failed:", err);
    return null;
  }
}

/**
 * Lắng nghe foreground messages (tab đang mở).
 * Trả về hàm unsubscribe.
 */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): () => void {
  const messaging = getFcmMessaging();
  if (!messaging) return () => undefined;
  return onMessage(messaging, callback);
}
