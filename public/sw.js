// Cache minimal : seulement les fichiers statiques (images, styles, scripts).
// Jamais les pages ni /api : ils contiennent des données privées.
const CACHE = "obsidian-static-v2";
const SHELL = ["/logo.png", "/manifest.json"];
const STATIC = /\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?|json)$/i;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Supprime l'ancien cache (qui contenait des réponses /api et des pages)
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // jamais de cache pour l'API
  if (!(url.pathname.startsWith("/_next/static/") || STATIC.test(url.pathname))) return; // pages : réseau seul
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone())).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
