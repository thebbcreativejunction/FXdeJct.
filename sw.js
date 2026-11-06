/* FX de Jct service worker: the app opens instantly and works offline.
   Change VERSION on every release so users get the new files. */
const VERSION = "fxdejct-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png",
  "maskable-192.png", "maskable-512.png", "icon-180.png", "apple-touch-icon.png", "favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  /* only our own files; live prices, sign-in (Supabase) and fonts always go straight to the network */
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate") {                       /* pages: network first, cached copy when offline */
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {   /* files: cache first */
    if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
    return r;
  })));
});
