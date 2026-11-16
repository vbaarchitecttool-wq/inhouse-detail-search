import { describe, test, expect } from "@jest/globals";
import indexData from "../spec_index.json";
import { TERM_ALIASES, NEVER_ALIAS_WORDS } from "./searchTerms";
import { foldText } from "./normalize";

const corpus = foldText(
  (indexData as any).details
    .map((d: any) => `${d.title}\n${d.original}`)
    .join("\n")
);

describe("検索語の読み替え表の安全性", () => {
  test("読み替え先は必ず仕様書の原文に存在する語である", () => {
    const missing: string[] = [];
    for (const a of TERM_ALIASES) {
      for (const to of a.to) {
        if (!corpus.includes(foldText(to))) missing.push(to);
      }
    }
    expect(missing).toEqual([]);
  });

  test("区画・耐火・間仕切など、仕様の違いに関わる語は読み替えない", () => {
    const offending: string[] = [];
    for (const a of TERM_ALIASES) {
      for (const word of [...a.from, ...a.to]) {
        if (NEVER_ALIAS_WORDS.some((ng) => word.includes(ng))) offending.push(word);
      }
    }
    expect(offending).toEqual([]);
  });

  test("短い英字略語は完全一致のときだけ読み替える", () => {
    for (const a of TERM_ALIASES) {
      for (const from of a.from) {
        if (/^[a-z0-9]{1,3}$/i.test(from)) expect(a.wholeTermOnly).toBe(true);
      }
    }
  });

  test("すべての行に根拠メモがある", () => {
    for (const a of TERM_ALIASES) expect(a.note.length).toBeGreaterThan(0);
  });
});
