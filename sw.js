/* Keeps the site working without internet. Bump VERSION on every release. */
const VERSION = "hateimot-sheli-v23";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./fonts/fonts.css", "./img/avocado.webp", "./img/peanut.webp", "./img/egg.webp", "./img/carrot.webp", "./img/strawberry.webp", "./img/kiwi.webp", "./img/washi-tape.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Pages: try the network first so updates arrive, fall back to the saved copy offline.
  if (req.mode === "navigate") {
    // "no-cache": always ask the server whether the page changed (the browser may otherwise keep it for 10 minutes)
    e.respondWith(fetch(req, { cache: "no-cache" }).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put("./index.html", copy)); return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // Icons and fonts (all from this site): saved copy first, refresh in the background.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
