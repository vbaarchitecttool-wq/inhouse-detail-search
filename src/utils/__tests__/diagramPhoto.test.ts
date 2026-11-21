import { existsSync } from "node:fs";
import { join } from "node:path";
import { getDiagramPhoto, diagramPhotoUrl } from "../diagramPhoto";
import captions from "../diagramPhotoCaptions.json";
import manifest from "../../../public/diagrams/manifest.json";

describe("図解と施工イメージの対応", () => {
  it("ラベルのない図や掲載対象外の図は画像を表示しない", () => {
    for (const svg of ['<svg/>', '<svg aria-label="  "/>', '<svg aria-label="未確認の図"/>']) {
      expect(getDiagramPhoto(svg)).toBeNull();
    }
  });

  it("掲載対象の写真には画像ファイルと固有の説明がある", () => {
    const photos = manifest.diagrams.filter((d) => d.assetPath);
    expect(Object.keys(captions).sort()).toEqual(photos.map((d) => d.hash).sort());
    for (const d of manifest.diagrams) {
      const photo = getDiagramPhoto(`<svg aria-label="${d.ariaLabel}"/>`);
      if (!d.assetPath) {
        expect(photo).toBeNull();
        continue;
      }
      expect(d.assetPath).toBe(`/diagrams/photo-${d.hash}.webp`);
      expect(photo?.src).toBe(diagramPhotoUrl(d.hash));
      expect(photo?.caption).toBeTruthy();
      expect(existsSync(join(__dirname, "../../../public", d.assetPath))).toBe(true);
    }
  });
});
