import {
  searchDetails,
  sortDetails,
  highlightText,
  hasCommentary,
  hasDiagram,
} from "../search";
import type { Detail } from "../../types";

const mk = (over: Partial<Detail> & Pick<Detail, "number">): Detail => ({
  id: over.number,
  title: "",
  categoryPath: ["1章 各章共通事項", "1節 共通事項"],
  original: "",
  tags: [],
  ...over,
});

const details: Detail[] = [
  mk({
    number: "5.3.2",
    title: "加工",
    categoryPath: ["5章 鉄筋工事", "3節 加工及び組立"],
    original: "鉄筋の加工は、常温で行う。",
    commentary: { plainSummary: "鉄筋は冷えたまま曲げる", points: ["熱を加えない"] },
  }),
  mk({
    number: "5.3.5",
    title: "かぶり厚さ及び間隔",
    categoryPath: ["5章 鉄筋工事", "3節 加工及び組立"],
    original: "鉄筋のかぶり厚さは、表5.3.5による。",
    commentary: {
      plainSummary: "コンクリートの厚みで鉄筋を守る",
      diagrams: [{ svg: '<svg viewBox="0 0 10 10" role="img" aria-label="かぶり"></svg>' }],
    },
  }),
  mk({
    number: "9.2.3",
    title: "アスファルト防水の施工",
    categoryPath: ["9章 防水工事", "2節 アスファルト防水"],
    original: "ルーフィング類の張付けは、空隙、気泡、しわ等が生じないように行う。",
  }),
  mk({
    number: "1.1.1",
    title: "一般事項",
    original: "標準仕様書は、建築物等の新築及び増築に係る建築工事に適用する。",
  }),
];

describe("searchDetails", () => {
  it("空のクエリでは全件を条項順そのまま返し、_matchScore は 0", () => {
    const r = searchDetails(details, "", [], []);
    expect(r.map((d) => d.number)).toEqual(["5.3.2", "5.3.5", "9.2.3", "1.1.1"]);
    expect(r.every((d) => d._matchScore === 0)).toBe(true);
  });

  it("条項番号の完全一致を先頭に返す", () => {
    const r = searchDetails(details, "5.3.2", [], []);
    expect(r[0].number).toBe("5.3.2");
    expect(r[0]._matchScore).toBe(0);
  });

  it("原文の本文に含まれる語でもヒットする（部分一致）", () => {
    const r = searchDetails(details, "ルーフィング", [], []);
    expect(r.map((d) => d.number)).toContain("9.2.3");
  });

  it("やさしい解説の本文でもヒットする", () => {
    const r = searchDetails(details, "冷えたまま", [], []);
    expect(r.map((d) => d.number)).toEqual(["5.3.2"]);
  });

  it("大文字小文字と空白の揺れを無視する", () => {
    const a = searchDetails(details, "  かぶり厚さ ", [], []).map((d) => d.number);
    const b = searchDetails(details, "かぶり厚さ", [], []).map((d) => d.number);
    expect(a).toEqual(b);
    expect(a[0]).toBe("5.3.5");
  });

  it("章名（カテゴリ名）で絞り込める", () => {
    const r = searchDetails(details, "", ["5章 鉄筋工事"], []);
    expect(r.map((d) => d.number).sort()).toEqual(["5.3.2", "5.3.5"]);
  });

  it("章/節のパス指定で絞り込める", () => {
    const r = searchDetails(details, "", ["9章 防水工事/2節 アスファルト防水"], []);
    expect(r.map((d) => d.number)).toEqual(["9.2.3"]);
  });

  it("「解説あり」「図解あり」フラグで絞り込める", () => {
    expect(
      searchDetails(details, "", [], ["commentary"]).map((d) => d.number).sort()
    ).toEqual(["5.3.2", "5.3.5"]);
    expect(searchDetails(details, "", [], ["diagram"]).map((d) => d.number)).toEqual([
      "5.3.5",
    ]);
  });

  it("絞り込みとクエリは同時に効く（該当なしなら空）", () => {
    expect(searchDetails(details, "ルーフィング", ["5章 鉄筋工事"], [])).toEqual([]);
  });

  it("details が配列でなくても落ちない", () => {
    expect(searchDetails(undefined as unknown as Detail[], "x", [], [])).toEqual([]);
  });
});

describe("sortDetails", () => {
  it("条項順は章.節.項を数値として比較する（1.10.1 は 1.2.1 の後）", () => {
    const list = [mk({ number: "1.10.1" }), mk({ number: "1.2.1" }), mk({ number: "1.1.12" })];
    expect(sortDetails(list, "category").map((d) => d.number)).toEqual([
      "1.1.12",
      "1.2.1",
      "1.10.1",
    ]);
  });

  it("関連度順は _matchScore 昇順、同点なら条項順", () => {
    const list = [
      mk({ number: "2.1.1", _matchScore: 0.4 }),
      mk({ number: "1.1.1", _matchScore: 0.4 }),
      mk({ number: "9.9.9", _matchScore: 0 }),
    ];
    expect(sortDetails(list, "relevance").map((d) => d.number)).toEqual([
      "9.9.9",
      "1.1.1",
      "2.1.1",
    ]);
  });

  it("元の配列を変更しない", () => {
    const list = [mk({ number: "2.1.1" }), mk({ number: "1.1.1" })];
    sortDetails(list, "category");
    expect(list.map((d) => d.number)).toEqual(["2.1.1", "1.1.1"]);
  });
});

describe("highlightText", () => {
  it("クエリが無ければ文字列のまま返す", () => {
    expect(highlightText("かぶり厚さ", "")).toBe("かぶり厚さ");
  });

  it("一致部分を hit=true で分割する（複数箇所・大文字小文字無視）", () => {
    expect(highlightText("SD295 と sd345", "sd")).toEqual([
      { text: "SD", hit: true },
      { text: "295 と ", hit: false },
      { text: "sd", hit: true },
      { text: "345", hit: false },
    ]);
  });

  it("一致しなければ全体が hit=false の1要素", () => {
    expect(highlightText("鉄筋", "防水")).toEqual([{ text: "鉄筋", hit: false }]);
  });
});

describe("hasCommentary / hasDiagram", () => {
  it("中身が空の commentary は「解説あり」と見なさない", () => {
    expect(hasCommentary(mk({ number: "1.1.1", commentary: {} }))).toBe(false);
    expect(hasCommentary(mk({ number: "1.1.1", commentary: { points: [] } }))).toBe(false);
    expect(hasCommentary(mk({ number: "1.1.1", commentary: { why: "理由" } }))).toBe(true);
  });

  it("diagrams が空配列なら「図解あり」ではない", () => {
    expect(hasDiagram(mk({ number: "1.1.1", commentary: { diagrams: [] } }))).toBe(false);
  });
});
