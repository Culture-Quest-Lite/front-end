// Firebase Messaging Service Worker
// Chạy ngầm để nhận push notification kể cả khi tab đóng.
//
// ⚠️  ĐIỀN GIÁ TRỊ THỰC TẾ từ Firebase Console vào bên dưới.
//     Firebase config KHÔNG phải secret — an toàn để commit.
//     Các trường đã điền sẵn lấy từ project ID: culture-quest-lite-bfa6a

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// ⚠️  File này được serve trực tiếp (không qua Next.js bundler),
//     nên process.env không khả dụng — phải hardcode các giá trị public ở đây.
const firebaseConfig = {
  apiKey:            "AIzaSyD0WhP4h04sX3Z2y-lXRde3dQGrhiGVm40",
  authDomain:        "culture-quest-lite-d5fee.firebaseapp.com",
  projectId:         "culture-quest-lite-d5fee",
  storageBucket:     "culture-quest-lite-d5fee.firebasestorage.app",
  messagingSenderId: "272821188601",
  appId:             "1:272821188601:web:dfe58e278f029448f4ef28",
  measurementId:     "G-S9M2N56ZWN",
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
