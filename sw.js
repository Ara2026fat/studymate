/* StudyMate — Service Worker
   Purpose:
   1) Satisfies Chrome/Android's PWA installability criteria (a registered
      service worker with a fetch handler) so the native "install app"
      prompt actually fires — index.html already has the manifest and the
      beforeinstallprompt handling ready; this was the missing piece.
   2) Gives real offline-first behavior for the app shell, matching
      StudyMate's existing offline-first philosophy (all data is already
      local via localStorage — this just makes the app itself load
      instantly and work with no connection too).

   v2 change: the app shell (the HTML page itself) now uses a NETWORK-FIRST
   strategy instead of cache-first. The old cache-first approach served the
   stale cached page immediately on every load and only updated the cache
   silently in the background — meaning the person was always one reload
   behind, and had to delete + reinstall the app to ever see updates.
   Network-first fixes that: every load tries to fetch the latest version
   first, and only falls back to the cached copy if there's no connection
   at all. Other (non-navigation) requests keep the old cache-first
   behavior, since this is a single-file app and it barely matters there.
*/

const CACHE_NAME = "studymate-shell-v3";
const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // never block install on a caching failure
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    // Network-first: always try to get the latest page. Only fall back to
    // whatever's cached if the network request fails (e.g. offline).
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Non-navigation requests: cache-first with a background refresh, as before.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached); // offline fallback to whatever was cached

      return cached || networkFetch;
    })
  );
});
