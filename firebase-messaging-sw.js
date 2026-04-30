// ==========================================
// Firebase Messaging Service Worker
// ==========================================
// 역할: 라이프OS 닫혀있을 때도 푸시 알림 수신
// 이 파일은 반드시 firebase-messaging-sw.js 라는 이름으로
// 사이트 루트(/lifeos/ 폴더)에 있어야 합니다.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정 (lifeos-family-11ec3)
const firebaseConfig = {
  apiKey: "AIzaSyC7GREdSOqKskc1qbShtlHRIWzDPnQrcUo",
  authDomain: "lifeos-family-11ec3.firebaseapp.com",
  projectId: "lifeos-family-11ec3",
  storageBucket: "lifeos-family-11ec3.firebasestorage.app",
  messagingSenderId: "1043105849530",
  appId: "1:1043105849530:web:770c575b3c0ca27f142283"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 백그라운드에서 푸시 메시지 수신
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] 백그라운드 메시지 수신:', payload);

  const notif = payload.notification || {};
  const data = payload.data || {};

  const title = notif.title || data.title || '🔔 라이프 OS';
  const options = {
    body: notif.body || data.body || '새 알림이 있어요',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.eventId || data.tag || 'lifeos-' + Date.now(),
    data: {
      url: data.url || './index.html',
      eventId: data.eventId,
      ...data
    },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(title, options);
});

// 알림 클릭 시 라이프OS 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 이미 열려있는 라이프OS 탭이 있으면 그걸로 포커스
      for (const client of windowClients) {
        if (client.url.includes('/lifeos/')) {
          if ('focus' in client) {
            try { client.navigate(targetUrl); } catch (e) {}
            return client.focus();
          }
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
