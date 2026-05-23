// Simple offline-first Service Worker (no Workbox dependency)
// 戦略：
//  - HTML: network-first（古いキャッシュで取り残されないように）
//  - 静的アセット (JS/CSS/img/svg): cache-first
//  - PDF/DWG/DXF: cache-first（一度開いたら次回はオフラインでも閲覧可能）
//  - データJSON: stale-while-revalidate

const VERSION = "v1.1.0";
const STATIC_CACHE = `ids-static-${VERSION}`;
const ASSET_CACHE = `ids-assets-${VERSION}`;
const FILES_CACHE = `ids-files-${VERSION}`;
const DATA_CACHE = `ids-data-${VERSION}`;

const STATIC_URLS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_URLS).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                ![STATIC_CACHE, ASSET_CACHE, FILES_CACHE, DATA_CACHE].includes(k)
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

const networkFirst = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    return cache.match("./index.html");
  }
};

const cacheFirst = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return cached || Response.error();
  }
};

const staleWhileRevalidate = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
};

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, STATIC_CACHE));
    return;
  }

  const dest = req.destination;
  const path = url.pathname.toLowerCase();

  if (path.endsWith(".json")) {
    event.respondWith(staleWhileRevalidate(req, DATA_CACHE));
    return;
  }

  if (
    path.endsWith(".pdf") ||
    path.endsWith(".dwg") ||
    path.endsWith(".dxf") ||
    path.startsWith("/files/")
  ) {
    event.respondWith(cacheFirst(req, FILES_CACHE));
    return;
  }

  if (
    dest === "script" ||
    dest === "style" ||
    dest === "image" ||
    dest === "font"
  ) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(req, ASSET_CACHE));
});

// 手動更新トリガ：クライアントから { type: "SKIP_WAITING" } が来たら即適用
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
