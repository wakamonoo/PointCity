//──────────────── Cache version name and URLs to cache.
const CACHE_NAME = "pointcity-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "https://cdn.tailwindcss.com",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

//──────────────── Event listener for the 'install' event to pre-cache essential assets for offline use.
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("[Service Worker] Failed to cache:", error);
      });
    })
  );
});

//──────────────── Event listener for the 'fetch' event to intercept network requests and serve cached content if available.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("[Service Worker] Serving from cache:", event.request.url);
        return response;
      }

      console.log("[Service Worker] Fetching from network:", event.request.url);
      return fetch(event.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.error(
            "[Service Worker] Fetch failed, attempting fallback:",
            error
          );
          return caches.match("/index.html");
        });
    })
  );
});

//──────────────── Event listener for the 'activate' event to clean up old caches and claim clients.
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});