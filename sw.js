/* ALONE CODE STUDIO v9 — Service Worker | Offline-First | Zero Error Screens */
const CACHE = 'acs-v10-v1';
const CORE  = [
  './', './index.html', './app.js', './style.css', './manifest.json',
  './icons/icon-16.png','./icons/icon-32.png','./icons/icon-48.png',
  './icons/icon-96.png','./icons/icon-144.png','./icons/icon-192.png',
  './icons/icon-512.png','./icons/favicon.ico',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(CORE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  /* External CDN / API — try network, fail silently */
  const external = [
    'anthropic.com','emkc.org','fonts.googleapis.com','fonts.gstatic.com',
    'esm.sh','unpkg.com','cdnjs.cloudflare.com'
  ];
  if (external.some(h => url.hostname.includes(h))) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response('', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      )
    );
    return;
  }

  /* App shell — cache-first, stale-while-revalidate */
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
      return cached || fresh;
    })
  );
});

/* v10: Accept skipWaiting message from client */
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
