// ==========================================
// 우리집 라이프 OS - 통합 Service Worker
// ==========================================
// 역할: PWA + Firebase Cloud Messaging (FCM) 통합 처리
// - PWA 오프라인 캐싱
// - 백그라운드 푸시 알림 수신

// ==========================================
// Firebase Messaging 설정
// ==========================================
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

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

// 백그라운드 FCM 푸시 메시지 수신
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] FCM 백그라운드 메시지:', payload);
  const notif = payload.notification || {};
  const data = payload.data || {};

  const title = notif.title || data.title || '🔔 라이프 OS';
  const options = {
    body: notif.body || data.body || '새 알림이 있어요',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.eventId || 'lifeos-' + Date.now(),
    data: { url: data.url || './index.html', eventId: data.eventId, ...data },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };
  return self.registration.showNotification(title, options);
});

// ==========================================
// PWA 캐싱
// ==========================================
const CACHE_VERSION = 'lifeos-v2';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const PRECACHE_URLS = [
  './',
  './index.html',
  './gagebu.html',
  './travel.html',
  './kids.html',
  './home.html',
  './health.html',
  './maintenance.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(
        PRECACHE_URLS.map(url => cache.add(url).catch(err => {
          console.warn(`[SW] Failed to cache ${url}:`, err.message);
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('cloudfunctions.net') ||
    url.hostname.includes('kakao.com') ||
    url.hostname.includes('generativelanguage') ||
    url.pathname.startsWith('/__/')
  ) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, respClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
        return new Response('오프라인 상태입니다', { status: 503 });
      }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ==========================================
// 알림 클릭 처리
// ==========================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/lifeos/') && 'focus' in client) {
          try { client.navigate(targetUrl); } catch (e) {}
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
