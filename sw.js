/* ──────────  pointcity service-worker  ────────── */
const CACHE_VERSION = 'v2';                     // bump on each deploy
const CACHE_NAME    = `pointcity-${CACHE_VERSION}`;

const ASSETS = [
  '/', '/index.html', '/manifest.json',
  'https://cdn.tailwindcss.com',
  '/icons/icon-192x192.png', '/icons/icon-512x512.png'
];

/* install – precache app shell */
self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
});

/* activate – clear out old caches */
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k!==CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* fetch – network-first fallback-to-cache */
self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;

  evt.respondWith(
    fetch(evt.request)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(evt.request, copy));
        return resp;
      })
      .catch(() =>
        caches.match(evt.request).then(r => r || caches.match('/index.html'))
      )
  );
});
