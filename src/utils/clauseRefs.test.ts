import { describe, test, expect } from "@jest/globals";
import { splitClauseRefs, buildSectionIndex } from "./clauseRefs";
import indexData from "../spec_index.json";
import { reflowSpecText } from "./text";
import type { Detail } from "../types";

const titles = new Map<string, string>([
  ["7.2.5", "溶接材料"],
  ["5.3.2", "加工"],
  ["6.3.1", "コンクリートの材料"],
  ["11.4.2", "材料"],
  ["18.2.2", "何か"],
]);

const refs = (text: string, self?: string) =>
  splitClauseRefs(text, titles, self)
    .filter((s) => s.refId)
    .map((s) => s.refId);

describe("splitClauseRefs（原文中の条項参照）", () => {
  test("見出しつきの参照をリンクにする", () => {
    expect(refs("溶接は、7.2.5[溶接材料]の溶接材料を使用して行う。")).toEqual(["7.2.5"]);
    expect(refs("セメントは、6.3.1［コンクリートの材料］(1)による。")).toEqual(["6.3.1"]);
  });

  test("見出しなしの参照もリンクにする", () => {
    expect(refs("これにより難い場合は5.3.2 による。")).toEqual(["5.3.2"]);
  });

  test("表・図の番号はリンクにしない", () => {
    expect(refs("重ね継手の長さは、表5.3.2［鉄筋の重ね継手の長さ］による。")).toEqual([]);
    expect(refs("L3 は表 5.3.2 による")).toEqual([]);
    expect(refs("図7.2.5 による")).toEqual([]);
  });

  test("他の図書の条項番号はリンクにしない", () => {
    expect(refs("「公共建築木造工事標準仕様書」11.4.2［材料］(3)による。")).toEqual([]);
  });

  test("JIS の箇条番号・寸法の続きはリンクにしない", () => {
    expect(refs("JIS A 4722 の5.3.2e)による")).toEqual([]);
    expect(refs("(注)1 18.2.2 による。")).toEqual([]);
    expect(refs("7.2.5.1 とする")).toEqual([]);
  });

  test("見出しが参照先と食い違う場合はリンクにしない", () => {
    expect(refs("7.2.5［まったく別の見出し］による。")).toEqual([]);
  });

  test("存在しない条項・自分自身はリンクにしない", () => {
    expect(refs("99.9.9 による")).toEqual([]);
    expect(refs("5.3.2 による", "5.3.2")).toEqual([]);
  });

  test("区切っても原文の文字は1字も変わらない", () => {
    const text = "溶接は、7.2.5[溶接材料]により、表5.3.2 及び 5.3.2 による。";
    const joined = splitClauseRefs(text, titles)
      .map((s) => s.text)
      .join("");
    expect(joined).toBe(text);
  });
});

describe("章・節への参照（５章２節［材料］）", () => {
  const details = (indexData as any).details as Detail[];
  const sections = buildSectionIndex(details);
  const allTitles = new Map<string, string>(details.map((d) => [d.id, d.title]));
  const linked = (text: string, self?: string) =>
    splitClauseRefs(text, allTitles, self, sections).filter((s) => s.refId);

  test("節への参照は、その節の先頭の条項を指す", () => {
    const r = linked("鉄筋は、５章２節［材料］による。");
    expect(r.map((s) => s.refId)).toEqual(["5.2.1"]);
    expect(r[0].text).toBe("５章２節［材料］");
    expect(r[0].refLabel).toBe("5章 鉄筋工事 › 2節 材料");
  });

  test("章への参照は、その章の先頭の条項を指す", () => {
    expect(linked("(ｱ)及び(ｲ)以外は、５章［鉄筋工事］による。").map((s) => s.refId)).toEqual(["5.1.1"]);
  });

  test("見出しが章名・節名と一致しない、または見出しが無いものはリンクにしない", () => {
    expect(linked("５章２節［まったく別の名前］による。")).toEqual([]);
    expect(linked("５章２節による。")).toEqual([]);
    expect(linked("5 節又は6 節による。")).toEqual([]);
  });

  test("他の図書の章・節はリンクにしない", () => {
    expect(linked("「公共建築木造工事標準仕様書」５章２節［材料］による。")).toEqual([]);
  });

  test("索引に無い索引指定（sections 省略）では従来どおり条項番号だけ", () => {
    expect(
      splitClauseRefs("５章２節［材料］による。", allTitles).filter((s) => s.refId)
    ).toEqual([]);
  });

  test("実データ全件：区切っても原文は1字も変わらず、参照先はすべて実在する", () => {
    let count = 0;
    for (const d of details) {
      const text = reflowSpecText(d.original);
      const segs = splitClauseRefs(text, allTitles, d.id, sections);
      expect(segs.map((s) => s.text).join("")).toBe(text);
      for (const s of segs) {
        if (!s.refId) continue;
        count += 1;
        expect(allTitles.has(s.refId)).toBe(true);
        expect(s.refId).not.toBe(d.id);
      }
    }
    expect(count).toBeGreaterThan(400);
  });
});
