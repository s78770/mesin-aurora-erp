// Aurora ERP 서비스워커: 오프라인에서도 앱 셸을 열 수 있도록 캐싱합니다.
// 주의: 서비스워커는 HTTPS(또는 localhost)에서만 등록됩니다. IP로 http 접속 중이라면
// 브라우저가 등록을 건너뛰므로, 나머지 기능(로딩)에는 영향 없이 캐싱만 비활성 상태가 됩니다.
const CACHE_NAME = 'aurora-erp-v2';
const APP_SHELL = [
  'index.html',
  'company.html',
  'rewards.html',
  'timeline.html',
  'settings.html',
  'ppt.html',
  'manifest.json',
  'assets/style.css',
  'assets/sidebar.js',
  'assets/calculator.js',
  'assets/ppt-viewer.js',
  'assets/logo-mark.png',
  'assets/logo-wordmark.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
