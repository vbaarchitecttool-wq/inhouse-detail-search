export interface SwCallbacks {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onReady?: (registration: ServiceWorkerRegistration) => void;
}

export const register = (callbacks: SwCallbacks = {}): void => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  // 開発時（npm run dev）はSWを登録しない。既存があれば解除する。
  // Codespaces等の認証プロキシ配下ではSWがfetchを横取りして失敗し、
  // 画面が真っ黒になるため。SWは本番ビルドでのみ有効化する。
  if (!import.meta.env.PROD) {
    unregister();
    return;
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]";

  if (isLocalhost) {
    unregister();
    return;
  }

  window.addEventListener("load", () => {
    // BASE_URL は既定 "/"。サブパス配信にした場合もここで追従する
    const swUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/sw.js`;
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

export const unregister = (): void => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  // 登録が無い環境でも確実に処理できるよう getRegistrations で全解除する
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((reg) => reg.unregister()))
    .catch(() => null);
};
