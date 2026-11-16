import { getDiagramPhoto } from "../diagramPhoto";
import manifest from "../../../public/diagrams/manifest.json";

// 写真ファイル名は aria-label の FNV-1a ハッシュ。アプリ側（diagramPhoto.ts）と
// 生成側（scripts/build_diagram_photo_manifest.mjs）で同じ値にならないと、
// 写真が黙って 404 になり SVG にフォールバックする。

describe("getDiagramPhoto", () => {
  it("aria-label が無い SVG には写真を割り当てない", () => {
    expect(getDiagramPhoto('<svg viewBox="0 0 1 1"></svg>')).toBeNull();
    expect(getDiagramPhoto('<svg aria-label="  "></svg>')).toBeNull();
  });

  it("alt にラベルを含め、src は /diagrams/photo-<hash>.webp", () => {
    const p = getDiagramPhoto('<svg role="img" aria-label="鉄筋の折曲げ"></svg>');
    expect(p).not.toBeNull();
    expect(p!.alt).toContain("鉄筋の折曲げ");
    expect(p!.src).toMatch(/^\/diagrams\/photo-[0-9a-f]{8}\.webp\?v=/);
  });

  it("manifest.json の全図解について、生成側と同じハッシュを出す", () => {
    expect(manifest.diagrams.length).toBeGreaterThan(0);
    for (const d of manifest.diagrams) {
      const p = getDiagramPhoto(`<svg aria-label="${d.ariaLabel}"></svg>`);
      expect(p?.src).toContain(`photo-${d.hash}.webp`);
    }
  });
});
