// Simple offline-first Service Worker (no Workbox dependency)
// 戦略：
//  - HTML: network-first（古いキャッシュで取り残されないように）
//  - 静的アセット (JS/CSS/img/svg): cache-first
//  - PDF/DWG/DXF: cache-first（一度開いたら次回はオフラインでも閲覧可能）
//  - データJSON: stale-while-revalidate
//
// 現場（電波なし）対応:
//  - インストール時に index.html が読み込むアプリ本体（JS/CSS）を先に保存する。
//    これで「一度開いただけ」の端末でも、次からは圏外で起動できる。
//    （以前は2回目の表示までJSが保存されず、初回のあと圏外だと真っ白になった）
//  - 図解の写真は PHOTO_CACHE に分けて持つ。アプリ更新（VERSION 変更）では消さない。
//    画面の「図解の写真も端末に保存する」ボタン（src/utils/offline.ts）もここへ保存する。

const VERSION = "v2.3.2";
const STATIC_CACHE = `ids-static-${VERSION}`;
const ASSET_CACHE = `ids-assets-${VERSION}`;
const FILES_CACHE = `ids-files-${VERSION}`;
const DATA_CACHE = `ids-data-${VERSION}`;
// src/utils/offline.ts の PHOTO_CACHE と同じ名前にすること
const PHOTO_CACHE = "ids-photos-v1";

const STATIC_URLS = ["./", "./index.html", "./manifest.json"];

// ビルド済みの index.html が読み込む JS/CSS（Vite は /assets/ 配下に出力）を一覧にする
const listAppAssets = async () => {
  try {
    const res = await fetch("./index.html", { cache: "no-store" });
    if (!res.ok) return [];
    const html = await res.text();
    const found = new Set();
    const re = /(?:src|href)="([^"]+\.(?:js|css))"/g;
    let m;
    while ((m = re.exec(html))) {
      if (!m[1].endsWith("/sw.js")) found.add(m[1]);
    }
    return [...found];
  } catch {
    return [];
  }
};

const precache = async () => {
  const staticCache = await caches.open(STATIC_CACHE);
  await staticCache.addAll(STATIC_URLS).catch(() => null);

  const assets = await listAppAssets();
  const assetCache = await caches.open(ASSET_CACHE);
  // 1件の失敗で全体を止めない（保存できた分だけでも圏外で役に立つ）
  await Promise.all(
    assets.map((url) => assetCache.add(url).catch(() => null))
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
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
                ![
                  STATIC_CACHE,
                  ASSET_CACHE,
                  FILES_CACHE,
                  DATA_CACHE,
                  PHOTO_CACHE,
                ].includes(k)
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
    if (req.mode === "navigate") {
      // ?id=5.3.2 のような共有リンクを圏外で開いても、保存済みの画面を返す
      const shell =
        (await caches.match("./index.html")) || (await caches.match("./"));
      if (shell) return shell;
    }
    return Response.error();
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

  // Diagram photos are intentionally replaced at stable paths.
  // Always check the network first so a corrected image is not hidden by an
  // older Service Worker cache; retain the cached copy only for offline use.
  if (path.startsWith("/diagrams/") && path.endsWith(".webp")) {
    event.respondWith(networkFirst(req, PHOTO_CACHE));
    return;
  }

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
