// react-scripts test が全テストの前に読み込む共通セットアップ。
// jest-dom のマッチャ（toBeInTheDocument 等）と、jsdom に無いブラウザAPIの代替をここに置く。

import "@testing-library/jest-dom";

// App.tsx は実効テーマの判定に matchMedia を使うが、jsdom には実装がない。
// CRA の jest 設定は resetMocks: true のため、jest.fn() で作ると各テスト前に
// 実装が消えて undefined を返す。素の関数で定義する。
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
