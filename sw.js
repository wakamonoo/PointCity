const CACHE_NAME = "pointcity-cache-v1"; // Cache version name
const urlsToCache = [
  "/", // Root path
  "/index.html", // Main HTML file
  "/manifest.json", // Web App Manifest
  "https://cdn.tailwindcss.com", // Tailwind CSS CDN
  // Add paths to your icons here. Make sure these paths are correct!
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

/**
 * Event listener for the 'install' event.
 * This is where we pre-cache all the essential assets for offline use.
 */
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

/**
 * Event listener for the 'fetch' event.
 * This intercepts network requests and serves cached content if available.
 */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the cached response
      if (response) {
        console.log("[Service Worker] Serving from cache:", event.request.url);
        return response;
      }

      // No cache hit - try to fetch from the network
      console.log("[Service Worker] Fetching from network:", event.request.url);
      return fetch(event.request)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
          // We must clone it so that the browser can consume the original response and we can consume the clone.
          const responseToCache = response.clone();

          // Cache the fetched response for future offline use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          // If network fetch fails (e.g., offline), try to return the cached index.html
          console.error("[Service Worker] Fetch failed, attempting fallback:", error);
          return caches.match("/index.html"); // Fallback to the main HTML file
        });
    })
  );
});

/**
 * Event listener for the 'activate' event.
 * This is where we clean up old caches.
 */
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache version
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName); // Delete old caches
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of the page immediately
  return self.clients.claim();
});
