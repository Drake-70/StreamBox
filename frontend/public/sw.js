const CACHE = "streambox-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(["/", "/manifest.webmanifest", "/icon.svg"]).catch(() => {})
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for navigation & assets; cache the app shell as an offline
// fallback. API calls are not cached (they need live data + auth).
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never cache API requests.
  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200 && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        return (
          caches.match(e.request).then((hit) => hit) ||
          (e.request.mode === "navigate" ? caches.match("/") : undefined)
        );
      })
  );
});
