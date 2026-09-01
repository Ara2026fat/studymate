/* StudyMate service worker
   ---------------------------------------------------------------------------
   The app is one HTML file, so caching it wrongly is the difference between a
   student getting this week's fixes and staring at last month's build. Two
   rules keep that from happening:

   1. The cache name carries the build stamp. A new build cannot collide with
      an old cache, and every old cache is deleted on activation — so there is
      no way for yesterday's index.html to survive a deploy.

   2. Navigations go to the network first, and fall back to the cache only when
      the network fails. A student with signal always gets the current app; a
      student on a bus with no signal still gets the last one that worked.

   Static assets (fonts, the manifest) are cache-first, because they don't
   change between builds and re-fetching them wastes a student's data.
*/

const BUILD = "2026-09-01-04";
const CACHE = `studymate-${BUILD}`;
const SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event)=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL).catch(()=>{}))
      /* Take over immediately rather than waiting for every tab to close —
         a student who reopens the app expects the update to be there. */
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(
    caches.keys()
      .then(names=>Promise.all(names.filter(n=>n !== CACHE).map(n=>caches.delete(n))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("message", (event)=>{
  /* The app can ask for an immediate handover after it detects a new build. */
  if(event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event)=>{
  const req = event.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // let fonts and CDNs be

  const isNavigation = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if(isNavigation){
    event.respondWith(
      fetch(req)
        .then(res=>{
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
          return res;
        })
        .catch(()=>caches.match(req).then(hit=>hit || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(hit=>{
      if(hit) return hit;
      return fetch(req).then(res=>{
        if(res && res.status === 200 && res.type === "basic"){
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>hit);
    })
  );
});
