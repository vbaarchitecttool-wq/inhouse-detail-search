// 現場（電波の弱い場所）で使うためのオフライン保存。
//
// 条文・解説はアプリ本体に含まれており、Service Worker（public/sw.js）が
// 初回表示時にまとめて端末へ保存する。図解の写真（約12MB）は通信量が大きいので
// 自動では取らず、利用者がボタンを押したときだけ一括保存する。

import { DIAGRAM_PHOTO_CACHE_REVISION, diagramPhotoUrl } from "./diagramPhoto";

/** public/sw.js の PHOTO_CACHE と同じ名前にすること（SW がここから写真を返す） */
export const PHOTO_CACHE = "ids-photos-v1";

export interface SaveProgress {
  done: number;
  total: number;
}

export interface SaveResult {
  total: number;
  failed: number;
}

interface DiagramManifest {
  diagrams?: { hash?: string; assetPath?: string | null }[];
}

export const canSaveOffline = (): boolean =>
  typeof window !== "undefined" &&
  "caches" in window &&
  "serviceWorker" in navigator;

/** 写真URLの一覧（manifest.json から）。重複は除く */
export const photoUrlsFromManifest = (manifest: DiagramManifest): string[] => {
  const hashes = new Set<string>();
  for (const d of manifest?.diagrams || []) {
    if (d && d.assetPath !== null && typeof d.hash === "string" && /^[0-9a-f]{8}$/.test(d.hash)) {
      hashes.add(d.hash);
    }
  }
  return Array.from(hashes).map(diagramPhotoUrl);
};

const CONCURRENCY = 4;

export const saveAllDiagramPhotos = async (
  onProgress: (p: SaveProgress) => void
): Promise<SaveResult> => {
  const res = await fetch(`/diagrams/manifest.json?v=${DIAGRAM_PHOTO_CACHE_REVISION}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  const urls = photoUrlsFromManifest((await res.json()) as DiagramManifest);
  const cache = await caches.open(PHOTO_CACHE);

  let done = 0;
  let failed = 0;
  let cursor = 0;
  onProgress({ done, total: urls.length });

  const worker = async () => {
    while (cursor < urls.length) {
      const url = urls[cursor];
      cursor += 1;
      try {
        if (!(await cache.match(url))) {
          const r = await fetch(url);
          if (!r.ok) throw new Error(String(r.status));
          await cache.put(url, r);
        }
      } catch {
        failed += 1;
      }
      done += 1;
      onProgress({ done, total: urls.length });
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { total: urls.length, failed };
};
