import { describe, test, expect } from "@jest/globals";
import indexData from "../spec_index.json";
import commentaryMap from "../commentary";
import type { Detail } from "../types";
import {
  searchDetails,
  sortDetails,
  highlightText,
  makeSnippet,
  buildRecovery,
  buildLoosePattern,
  expandTerm,
  compileQuery,
  countHits,
} from "./search";
import { foldText } from "./normalize";

const details: Detail[] = (indexData as any).details.map((d: Detail) =>
  commentaryMap[d.id] ? { ...d, commentary: commentaryMap[d.id] } : d
);

const run = (q: string, cats: string[] = [], flags: string[] = []) =>
  sortDetails(searchDetails(details, q, cats, flags), "relevance");
const numbers = (q: string) => run(q).map((d) => d.number);

describe("検索の順位づけ", () => {
  test("見出しに語がある条項が、本文にだけある条項より上に来る", () => {
    const r = run("かぶり厚さ");
    expect(r[0].number).toBe("5.3.5");
    expect(r[0].title).toContain("かぶり厚さ");
  });

  test("条項番号は完全一致が先頭", () => {
    expect(numbers("5.3.2")[0]).toBe("5.3.2");
    expect(numbers("５．３．２")[0]).toBe("5.3.2");
    expect(numbers("5-3-2")[0]).toBe("5.3.2");
  });

  test("節までの番号（5.3）は、その節の条項を先に並べる", () => {
    const r = numbers("5.3");
    const inSection = details.filter((d) => d.number.startsWith("5.3.")).length;
    expect(inSection).toBeGreaterThan(0);
    expect(r.slice(0, inSection).every((n) => n.startsWith("5.3."))).toBe(true);
    expect(r[0]).toBe("5.3.1");
  });

  test("「樋」で検索してもトイレには当たらない", () => {
    const r = run("樋");
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((d) => d.title.includes("トイレ"))).toBe(false);
  });

  test("原文の見出しの長音が化けていても見出しで見つかる（6.3.1）", () => {
    expect(numbers("コンクリートの材料")[0]).toBe("6.3.1");
  });

  test("「5章」は5章だけ（15章を巻き込まない）", () => {
    const r = numbers("5章");
    expect(r.length).toBe(details.filter((d) => d.number.startsWith("5.")).length);
    expect(r.every((n) => n.startsWith("5."))).toBe(true);
    expect(numbers("5章3節").every((n) => n.startsWith("5.3."))).toBe(true);
  });

  test("空の検索は全件を返す", () => {
    expect(searchDetails(details, "", [], []).length).toBe(details.length);
    expect(searchDetails(details, "   ", [], []).length).toBe(details.length);
  });
});

describe("日本語の入力ゆれ", () => {
  test("全角・半角・カナの違いで結果が変わらない", () => {
    expect(numbers("ＡＬＣ")).toEqual(numbers("alc"));
    expect(numbers("ALC").length).toBeGreaterThan(0);
    expect(numbers("ｼｰﾘﾝｸﾞ")).toEqual(numbers("シーリング"));
    expect(numbers("めっき")).toEqual(numbers("メッキ"));
  });

  test("複数語はAND検索（語順・区切り文字に依存しない）", () => {
    const a = numbers("鉄筋 かぶり");
    expect(a.length).toBeGreaterThan(0);
    expect(new Set(numbers("かぶり　鉄筋"))).toEqual(new Set(a));
    expect(new Set(numbers("鉄筋、かぶり"))).toEqual(new Set(a));
    expect(a.length).toBeLessThanOrEqual(numbers("かぶり").length);
  });

  test("PDFの改行で割れた語にも当たる", () => {
    const broken = details.find((d) => /重ね\n継手/.test(d.original));
    expect(broken).toBeDefined();
    expect(numbers("重ね継手")).toContain(broken!.number);
  });

  test("送り仮名の違いを吸収する", () => {
    expect(new Set(numbers("取り付け"))).toEqual(new Set(numbers("取付け")));
    expect(numbers("締め固め").length).toBeGreaterThan(0);
    expect(new Set(numbers("締め固め"))).toEqual(new Set(numbers("締固め")));
    expect(numbers("打ち継ぎ").length).toBeGreaterThan(0);
    expect(numbers("立ち上がり").length).toBeGreaterThan(0);
    expect(numbers("組み立て").length).toBeGreaterThan(0);
  });

  test("現場の呼び名から仕様書の語に届く", () => {
    expect(
      run("石膏ボード").some((d) =>
        foldText(d.original + d.title).includes("せっこうぼーど")
      )
    ).toBe(true);
    expect(run("コーキング").length).toBeGreaterThan(0);
    expect(run("LGS").length).toBeGreaterThan(0);
    expect(run("ハイテンションボルト").length).toBeGreaterThan(0);
    expect(run("タイル貼り").length).toBeGreaterThan(0);
    expect(run("山止め").length).toBeGreaterThan(0);
  });
});

describe("仕様の違うものを混同しない（区画壁と一般間仕切壁）", () => {
  test("読み替えで区画・耐火・間仕切の語は増えない", () => {
    for (const q of ["区画", "区画壁", "耐火", "間仕切", "間仕切壁", "防火", "不燃"]) {
      expect(expandTerm(foldText(q))).toEqual([foldText(q)]);
    }
  });

  test("「区画」の検索結果は、実際に「区画」と書かれた条項だけ", () => {
    const r = run("区画");
    expect(r.length).toBeGreaterThan(0);
    for (const d of r) {
      expect(foldText(JSON.stringify(d)).includes("区画")).toBe(true);
    }
  });

  test("「間仕切」の検索結果は、実際に「間仕切（り）」と書かれた条項だけ", () => {
    const r = run("間仕切");
    expect(r.length).toBeGreaterThan(0);
    for (const d of r) {
      expect(/間仕切/.test(foldText(JSON.stringify(d)))).toBe(true);
    }
  });
});

describe("送り仮名ゆるめ照合のパターン", () => {
  test("送り仮名を任意にする", () => {
    const re = new RegExp(buildLoosePattern("取り付け")!);
    expect(re.test("取付け")).toBe(true);
    expect(re.test("取り付け")).toBe(true);
    expect(re.test("取付")).toBe(true);
    expect(re.test("取外し")).toBe(false);
  });

  test("漢字1字だけになる語・漢字を含まない語には使わない", () => {
    expect(buildLoosePattern("塗り")).toBeNull();
    expect(buildLoosePattern("かぶり")).toBeNull();
    expect(buildLoosePattern("シーリング")).toBeNull();
  });

  test("カタカナは送り仮名として扱わない", () => {
    const p = buildLoosePattern("捨てコン");
    expect(p).not.toBeNull();
    expect(new RegExp(p!).test(foldText("捨コンクリート"))).toBe(true);
  });
});

describe("ハイライトと抜粋", () => {
  test("全角で書かれた原文に半角の検索語でも色が付く", () => {
    const parts = highlightText("Ａ Ｌ Ｃ パネル工事", "alc");
    expect(Array.isArray(parts)).toBe(true);
    expect(
      (parts as any[]).filter((p) => p.hit).map((p) => p.text)
    ).toEqual(["Ａ Ｌ Ｃ"]);
  });

  test("複数語それぞれに色が付き、文字は欠けない", () => {
    const text = "鉄筋の最小かぶり厚さは、特記による。";
    const parts = highlightText(text, "鉄筋 かぶり") as any[];
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.filter((p) => p.hit).map((p) => p.text)).toEqual([
      "鉄筋",
      "かぶり",
    ]);
  });

  test("送り仮名が違っても該当箇所に色が付く", () => {
    const parts = highlightText("建具の取付けは、次による。", "取り付け") as any[];
    expect(parts.filter((p) => p.hit).map((p) => p.text)).toEqual(["取付け"]);
  });

  test("検索語なし・ヒットなしは文字列のまま返す", () => {
    expect(highlightText("abc", "")).toBe("abc");
    expect(highlightText("abc", "zzz")).toBe("abc");
    expect(countHits("かぶり、かぶり", "かぶり")).toBe(2);
  });

  test("原文の途中にだけ語がある条項は、その前後を抜粋する", () => {
    const d: Detail = {
      id: "x",
      number: "9.9.9",
      title: "一般事項",
      categoryPath: ["a", "b"],
      tags: [],
      original:
        "あ".repeat(200) + "ここに特殊溶接棒を用いる。" + "い".repeat(200),
    };
    const s = makeSnippet(d, "特殊溶接棒");
    expect(s.fromOriginal).toBe(true);
    expect(s.text).toContain("特殊溶接棒");
    expect(makeSnippet(d, "").fromOriginal).toBe(false);
    expect(makeSnippet(d, "一般事項").fromOriginal).toBe(false);
  });
});

describe("0件のときの立て直し", () => {
  test("絞り込みが原因なら、外した場合の件数を返す", () => {
    const cat = details[0].categoryPath.join("/");
    expect(searchDetails(details, "かぶり厚さ", [cat], []).length).toBe(0);
    const rec = buildRecovery(details, "かぶり厚さ", true);
    expect(rec.withoutFiltersCount).toBeGreaterThan(0);
  });

  test("複数語のうち当たる語を1語ずつ示す", () => {
    const q = "かぶり ぜったいにないことばxyz";
    expect(run(q).length).toBe(0);
    const rec = buildRecovery(details, q, false);
    expect(rec.perTerm.map((t) => t.term)).toEqual(["かぶり"]);
  });

  test("打ち間違いには、実際にヒットする候補を示す", () => {
    const q = "アスフアルト防水";
    expect(run(q).length).toBe(0);
    const rec = buildRecovery(details, q, false);
    expect(rec.suggestions.length).toBeGreaterThan(0);
    for (const s of rec.suggestions) expect(run(s).length).toBeGreaterThan(0);
  });

  test("語数は上限で打ち切る", () => {
    expect(compileQuery("a b c d e f g h i j").terms.length).toBeLessThanOrEqual(6);
  });
});

describe("速度（実データ約800条項）", () => {
  test("1回の検索は十分に速い", () => {
    run("かぶり"); // インデックス構築を含む初回
    const t0 = Date.now();
    const queries = ["鉄筋 かぶり", "取り付け", "防水", "5.3", "コンクリート 養生 期間"];
    for (const q of queries) run(q);
    const perQuery = (Date.now() - t0) / queries.length;
    expect(perQuery).toBeLessThan(150);
  });
});
