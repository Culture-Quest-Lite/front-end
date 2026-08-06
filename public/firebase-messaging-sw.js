// Firebase Messaging Service Worker
// Chạy ngầm để nhận push notification kể cả khi tab đóng.
//
// ⚠️  ĐIỀN GIÁ TRỊ THỰC TẾ từ Firebase Console vào bên dưới.
//     Firebase config KHÔNG phải secret — an toàn để commit.
//     Các trường đã điền sẵn lấy từ project ID: culture-quest-lite-bfa6a

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Xử lý push notification khi trình duyệt đang chạy ngầm (tab không active hoặc đóng)
messaging.onBackgroundMessage(function (payload) {
  console.log('[SW] Background message received:', payload);

  const title = payload.notification?.title ?? 'CultureQuest Lite';
  const body  = payload.notification?.body  ?? '';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon-logo3.png',
    badge: '/favicon-logo3.png',
    data: {
      type:        payload.data?.type,
      referenceId: payload.data?.referenceId,
      url:         '/admin',
    },
  });
});

// Click vào notification → mở / focus tab trang admin
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/admin';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    }),
  );
});
