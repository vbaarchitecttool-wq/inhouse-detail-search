import React, { useEffect, useState } from "react";
import {
  canSaveOffline,
  saveAllDiagramPhotos,
  SaveProgress,
} from "../utils/offline";
import { DIAGRAM_PHOTO_CACHE_REVISION } from "../utils/diagramPhoto";
import {
  loadOfflinePhotosRevision,
  saveOfflinePhotosRevision,
} from "../utils/storage";

type Phase = "idle" | "saving" | "done" | "partial" | "error";

/**
 * 画面下部の「現場で使う準備」。
 *   - 条文・解説がオフラインで使える状態かどうかを表示
 *   - 図解の写真（約12MB）をワンタップで端末に保存
 */
const OfflineTools: React.FC = () => {
  const [appReady, setAppReady] = useState(false);
  const [phase, setPhase] = useState<Phase>(() =>
    loadOfflinePhotosRevision() === DIAGRAM_PHOTO_CACHE_REVISION
      ? "done"
      : "idle"
  );
  const [progress, setProgress] = useState<SaveProgress>({ done: 0, total: 0 });
  const [failed, setFailed] = useState(0);

  // 「オフラインでも使える」と表示するのは、実際にアプリ本体が端末へ保存されたことを
  // 確かめられたときだけにする（Service Worker が有効 ＋ 今動いているJSが保存済み）
  useEffect(() => {
    if (!canSaveOffline()) return;
    let alive = true;
    const verify = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        await navigator.serviceWorker.ready;
        const script = document.querySelector<HTMLScriptElement>(
          'script[src*="/assets/"]'
        );
        if (!script) return;
        const saved = await caches.match(script.src);
        if (alive && saved) setAppReady(true);
      } catch {
        /* 確認できない環境では何も表示しない */
      }
    };
    verify();
    const onReady = () => {
      verify();
    };
    window.addEventListener("sw-ready", onReady);
    return () => {
      alive = false;
      window.removeEventListener("sw-ready", onReady);
    };
  }, []);

  if (!appReady) return null;

  const handleSave = async () => {
    setPhase("saving");
    setFailed(0);
    try {
      const result = await saveAllDiagramPhotos(setProgress);
      if (result.failed === 0) {
        saveOfflinePhotosRevision(DIAGRAM_PHOTO_CACHE_REVISION);
        setPhase("done");
      } else {
        setFailed(result.failed);
        setPhase("partial");
      }
    } catch {
      setPhase("error");
    }
  };

  return (
    <div className="offline-tools">
      <p className="offline-line">
        <span className="offline-ok" aria-hidden="true">
          ✓
        </span>
        条文と解説は、電波のない現場でもこの端末で開けます。
      </p>

      {phase === "done" ? (
        <p className="offline-line">
          <span className="offline-ok" aria-hidden="true">
            ✓
          </span>
          図解の写真も保存済みです。
        </p>
      ) : (
        <div className="offline-action">
          <button
            type="button"
            className="offline-btn"
            onClick={handleSave}
            disabled={phase === "saving"}
          >
            {phase === "saving"
              ? `保存中… ${progress.done} / ${progress.total}`
              : phase === "idle"
              ? "📥 図解の写真も端末に保存する"
              : "📥 もう一度保存する"}
          </button>
          <span className="offline-note" role="status" aria-live="polite">
            {phase === "idle" || phase === "saving"
              ? "約12MB。Wi-Fi のある場所での保存をおすすめします。"
              : phase === "partial"
              ? `${failed}枚を保存できませんでした。電波の良い場所でもう一度お試しください。`
              : "保存できませんでした。電波の良い場所でもう一度お試しください。"}
          </span>
        </div>
      )}
    </div>
  );
};

export default OfflineTools;
