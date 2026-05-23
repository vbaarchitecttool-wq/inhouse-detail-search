// Service Worker 登録
// 開発時は登録しない（localhost のみ可）

export const register = (callbacks = {}) => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  // CRA dev server (localhost:3000) では SW を切る
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]";

  // 開発時は登録解除のみ行う
  if (isLocalhost) {
    unregister();
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = `${process.env.PUBLIC_URL || ""}/sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.onstatechange = () => {
            if (installing.state === "installed") {
              if (navigator.serviceWorker.controller) {
                callbacks.onUpdate?.(reg);
              } else {
                callbacks.onReady?.(reg);
              }
            }
          };
        };
      })
      .catch((err) => {
        console.warn("[SW] registration failed:", err);
      });
  });
};

export const unregister = () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => reg.unregister())
    .catch(() => null);
};
