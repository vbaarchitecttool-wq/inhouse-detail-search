// vitest が全テストの前に読み込む共通セットアップ（vite.config.ts の test.setupFiles）。
// jest-dom のマッチャ（toBeInTheDocument 等）と、jsdom に無いブラウザAPIの代替をここに置く。

import "@testing-library/jest-dom/vitest";

// App.tsx は実効テーマの判定に matchMedia を使うが、jsdom には実装がない。
// モック化の設定に左右されないよう、素の関数で定義する。
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}
