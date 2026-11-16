import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import commentaryMap from "../commentary";
import indexDataRaw from "../spec_index.json";
import manifest from "../../public/diagrams/manifest.json";
import type { IndexData } from "../types";

// やさしい解説（src/commentary/ch*.ts）の「無言の失敗」を止める。
// .claude/hooks/validate-commentary.mjs が編集時に行う検査と同じ観点を、
// CI でも必ず通るようにここに置く。
//   1. 条項番号キーが spec_index.json に無い → 解説が永久に表示されない
//   2. 章ファイル間でキーが重複 → index.ts の spread で後勝ちし片方が消える
//   3. 章ファイルが index.ts に登録されていない → 章まるごと消える
//   4. SVG が DESIGN.md の規約違反 → ダークテーマで破綻／非視覚利用者に届かない
//   5. aria-label が manifest.json と食い違う → 写真が 404 になり黙って消える

const COMMENTARY_DIR = join(__dirname, "..", "commentary");
const ENTRY_RE = /^[ \t]*"(\d+\.\d+\.\d+)"\s*:\s*\{/gm;
const PAINT_RE = /\b(fill|stroke)="([^"]*)"/g;
const ALLOWED_PAINT = new Set(["currentcolor", "none", "inherit", "transparent"]);

const specIds = new Set((indexDataRaw as unknown as IndexData).details.map((d) => d.id));

const chapterFiles = readdirSync(COMMENTARY_DIR)
  .filter((f) => /^ch\d{2}\.ts$/.test(f))
  .sort();

type Entry = { id: string; file: string };
const entries: Entry[] = chapterFiles.flatMap((file) => {
  const src = readFileSync(join(COMMENTARY_DIR, file), "utf8");
  return [...src.matchAll(ENTRY_RE)].map((m) => ({ id: m[1], file }));
});

describe("やさしい解説と原文の対応", () => {
  it("章ファイルが1つ以上あり、解説が入っている", () => {
    expect(chapterFiles.length).toBeGreaterThan(0);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("すべての解説キーが spec_index.json の条項として存在する（孤立なし）", () => {
    const orphaned = Object.keys(commentaryMap).filter((id) => !specIds.has(id));
    expect(orphaned).toEqual([]);
  });

  it("解説キーは自分の章のファイルに置かれている", () => {
    const misplaced = entries.filter(
      ({ id, file }) => Number(id.split(".")[0]) !== Number(file.slice(2, 4))
    );
    expect(misplaced).toEqual([]);
  });

  it("章ファイル間で条項番号が重複していない", () => {
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const { id, file } of entries) {
      const prev = seen.get(id);
      if (prev) dups.push(`${id} (${prev} と ${file})`);
      else seen.set(id, file);
    }
    expect(dups).toEqual([]);
  });

  it("すべての章ファイルが index.ts に取り込まれている", () => {
    // ソース上の件数と、マージ後のキー数が一致すれば、取り込み漏れも重複もない
    expect(Object.keys(commentaryMap)).toHaveLength(entries.length);
    const indexSrc = readFileSync(join(COMMENTARY_DIR, "index.ts"), "utf8");
    for (const file of chapterFiles) {
      const name = file.replace(/\.ts$/, "");
      expect(indexSrc).toMatch(new RegExp(`import\\s+${name}\\s+from\\s+"\\./${name}"`));
      expect(indexSrc).toMatch(new RegExp(`\\.\\.\\.${name}\\s*,`));
    }
  });

  it("解説の型が壊れていない（points / glossary は配列）", () => {
    for (const [id, c] of Object.entries(commentaryMap)) {
      if (c.points !== undefined) expect({ id, ok: Array.isArray(c.points) }).toEqual({ id, ok: true });
      if (c.glossary !== undefined) expect({ id, ok: Array.isArray(c.glossary) }).toEqual({ id, ok: true });
      if (c.diagrams !== undefined) expect({ id, ok: Array.isArray(c.diagrams) }).toEqual({ id, ok: true });
    }
  });
});

describe("図解SVGの規約（DESIGN.md）", () => {
  const diagrams = Object.entries(commentaryMap).flatMap(([id, c]) =>
    (c.diagrams ?? []).map((d, i) => ({ where: `${id}#${i}`, svg: d.svg }))
  );

  it("図解が1つ以上ある", () => {
    expect(diagrams.length).toBeGreaterThan(0);
  });

  it("viewBox・role=\"img\"・aria-label を持つ", () => {
    const bad = diagrams
      .filter(
        ({ svg }) =>
          !/\bviewBox="/.test(svg) || !/\brole="img"/.test(svg) || !/\baria-label="[^"]+"/.test(svg)
      )
      .map((d) => d.where);
    expect(bad).toEqual([]);
  });

  it("色は currentColor / none / inherit / transparent / url(#...) のみ（テーマ追従）", () => {
    const bad: string[] = [];
    for (const { where, svg } of diagrams) {
      for (const m of svg.matchAll(PAINT_RE)) {
        const v = m[2].trim();
        if (ALLOWED_PAINT.has(v.toLowerCase()) || /^url\(/.test(v)) continue;
        bad.push(`${where} ${m[1]}="${v}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("aria-label は図ごとに異なる（写真ファイル名のハッシュ元のため）", () => {
    const labels = diagrams.map(({ svg }) => svg.match(/\baria-label="([^"]*)"/)?.[1].trim());
    const dup = labels.filter((l, i) => labels.indexOf(l) !== i);
    expect(dup).toEqual([]);
  });

  it("すべての aria-label が public/diagrams/manifest.json に登録されている", () => {
    // 未登録＝ aria-label を直した後に node scripts/build_diagram_photo_manifest.mjs を
    // 実行していない。写真は aria-label のハッシュで引くため、この状態では 404 になる。
    const known = new Set(manifest.diagrams.map((d) => d.ariaLabel.trim()));
    const unregistered = diagrams
      .map(({ where, svg }) => ({ where, label: svg.match(/\baria-label="([^"]*)"/)?.[1].trim() ?? "" }))
      .filter(({ label }) => !known.has(label))
      .map(({ where, label }) => `${where}: ${label.slice(0, 40)}`);
    expect(unregistered).toEqual([]);
  });
});
