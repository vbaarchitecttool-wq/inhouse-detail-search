import { describe, test, expect } from "vitest";
import { photoUrlsFromManifest } from "./offline";
import { getDiagramPhoto, diagramPhotoUrl } from "./diagramPhoto";

describe("図解写真のオフライン保存", () => {
  test("マニフェストから写真URLを作る（重複・不正な値は除く）", () => {
    const urls = photoUrlsFromManifest({
      diagrams: [
        { hash: "b8d15871" },
        { hash: "b8d15871" },
        { hash: "../evil" },
        {},
        { hash: "03c0de3f" },
      ],
    });
    expect(urls).toEqual([
      diagramPhotoUrl("b8d15871"),
      diagramPhotoUrl("03c0de3f"),
    ]);
  });

  test("空・壊れたマニフェストでも落ちない", () => {
    expect(photoUrlsFromManifest({})).toEqual([]);
    expect(photoUrlsFromManifest(null as any)).toEqual([]);
  });

  test("保存するURLは、画面が表示に使うURLと完全に同じ文字列になる", () => {
    // aria-label "設計図書の優先順位…" のハッシュは public/diagrams/manifest.json で b8d15871
    const svg =
      '<svg role="img" aria-label="設計図書の優先順位。1 質問回答書、2 現場説明書、3 特記仕様書、4 別冊の図面、5 標準仕様書の順に優先される"></svg>';
    const photo = getDiagramPhoto(svg);
    expect(photo?.src).toBe(diagramPhotoUrl("b8d15871"));
    expect(photoUrlsFromManifest({ diagrams: [{ hash: "b8d15871" }] })).toEqual([
      photo?.src,
    ]);
  });
});
