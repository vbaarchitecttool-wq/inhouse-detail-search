import { describe, test, expect } from "vitest";
import { foldText, foldWithMap, foldKeepKana, kanaFold } from "./normalize";

describe("foldText（文字のゆれの吸収）", () => {
  test("全角英数を半角・小文字にする", () => {
    expect(foldText("ＡＬＣパネル")).toBe("alcぱねる");
    expect(foldText("５．３．２")).toBe("5.3.2");
  });

  test("カタカナとひらがなを同一視する", () => {
    expect(foldText("メッキ")).toBe(foldText("めっき"));
    expect(foldText("コンクリート")).toBe("こんくりーと");
  });

  test("半角カナ（濁点つき）を全角相当に畳む", () => {
    expect(foldText("ｶﾞﾗｽ")).toBe(foldText("ガラス"));
    expect(foldText("(ｱ)")).toBe("(あ)");
  });

  test("空白・改行・全角空白を取り除く（PDFの折り返し対策）", () => {
    expect(foldText("重ね\n継手の　長さ")).toBe("重ね継手の長さ");
    expect(foldText("JIS A 5308")).toBe("jisa5308");
  });

  test("PDF抽出で化けた長音（コンクリ－ト）を長音として扱う", () => {
    expect(foldText("コンクリ－トの材料")).toBe(foldText("コンクリートの材料"));
    expect(foldText("ル－フィング")).toBe(foldText("ルーフィング"));
    // マイナスや規格名の区切りは長音にしない
    expect(foldText("気温が－５℃未満")).toContain("気温が-5");
    expect(foldText("加硫ゴム－引張特性")).toBe("加硫ごむ-引張特性");
  });

  test("null / undefined は空文字", () => {
    expect(foldText(null)).toBe("");
    expect(foldText(undefined)).toBe("");
  });
});

describe("foldWithMap（元の位置との対応）", () => {
  test("畳んだ範囲から元の文字列を切り出せる", () => {
    const src = "鉄筋の 重ね\n継手は、ＪＩＳによる";
    const f = foldWithMap(src);
    const i = f.text.indexOf("重ね継手");
    expect(i).toBeGreaterThanOrEqual(0);
    expect(src.slice(f.starts[i], f.ends[i + 3])).toBe("重ね\n継手");
    const j = f.text.indexOf("jis");
    expect(src.slice(f.starts[j], f.ends[j + 2])).toBe("ＪＩＳ");
  });

  test("半角カナの濁点合成でも位置がずれない", () => {
    const src = "aｶﾞb";
    const f = foldWithMap(src);
    expect(f.text).toBe("aがb");
    expect(src.slice(f.starts[1], f.ends[1])).toBe("ｶﾞ");
    expect(f.starts.length).toBe(f.text.length);
    expect(f.ends.length).toBe(f.text.length);
  });

  test("1文字が複数文字に展開される合字でも長さが揃う", () => {
    const f = foldWithMap("厚さ9㎜以上");
    expect(f.text).toBe("厚さ9mm以上");
    expect(f.starts.length).toBe(f.text.length);
  });
});

describe("foldKeepKana", () => {
  test("カナ変換以外は foldText と同じ結果になる", () => {
    for (const s of ["取り付け", "スペーサー", "ＡＬＣ パネル", "捨てコン", "ｶﾞﾗｽ"]) {
      expect(kanaFold(foldKeepKana(s))).toBe(foldText(s));
    }
  });
});
