import indexDataRaw from "../spec_index.json";
import type { IndexData } from "../types";

// src/spec_index.json は scripts/extract_spec.py が PDF から生成する成果物。
// 抽出器は連番一致で見出しを判定するため、版が変わると節が丸ごと消えることがある。
// ここでは「再生成後も必ず成り立つ構造」だけを検査する（件数そのものは固定しない）。

const index = indexDataRaw as unknown as IndexData;

describe("spec_index.json の構造", () => {
  it("23章そろっている", () => {
    expect(index.categories).toHaveLength(23);
    index.categories.forEach((c, i) => {
      expect(c.name.startsWith(`${i + 1}章`)).toBe(true);
    });
  });

  it("条項IDは一意で、number と一致し、章.節.項の3つ組", () => {
    const ids = new Set<string>();
    for (const d of index.details) {
      expect(d.id).toBe(d.number);
      expect(d.id).toMatch(/^\d{1,2}\.\d{1,2}\.\d{1,3}$/);
      expect(ids.has(d.id)).toBe(false);
      ids.add(d.id);
    }
  });

  it("各条項の categoryPath は [章名, 節名] で、categories に実在する", () => {
    const sections = new Map(
      index.categories.map((c) => [c.name, new Set((c.children ?? []).map((s) => s.name))])
    );
    for (const d of index.details) {
      expect(d.categoryPath).toHaveLength(2);
      const [chapter, section] = d.categoryPath;
      expect(sections.has(chapter)).toBe(true);
      expect(sections.get(chapter)!.has(section)).toBe(true);
      expect(chapter.startsWith(`${d.id.split(".")[0]}章`)).toBe(true);
    }
  });

  it("categories の count は実際の条項数と一致する（節が消えると検知できる）", () => {
    const perSection = new Map<string, number>();
    for (const d of index.details) {
      const key = d.categoryPath.join("/");
      perSection.set(key, (perSection.get(key) ?? 0) + 1);
    }
    for (const c of index.categories) {
      let chapterTotal = 0;
      for (const s of c.children ?? []) {
        const n = perSection.get(`${c.name}/${s.name}`) ?? 0;
        expect({ section: s.name, count: s.count }).toEqual({ section: s.name, count: n });
        chapterTotal += n;
      }
      expect({ chapter: c.name, count: c.count }).toEqual({ chapter: c.name, count: chapterTotal });
    }
  });

  it("原文（original）が空の条項はない", () => {
    const empty = index.details.filter((d) => !d.original || !d.original.trim());
    expect(empty.map((d) => d.id)).toEqual([]);
  });
});
