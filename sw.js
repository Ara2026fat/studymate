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
*/

const CACHE_NAME = "studymate-shell-v1";
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

      // Serve from cache instantly if we have it, update cache in background;
      // otherwise wait for the network.
      return cached || networkFetch;
    })
  );
});
