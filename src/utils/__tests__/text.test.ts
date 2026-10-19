import { reflowSpecText } from "../text";

describe("reflowSpecText", () => {
  it("文の途中で折り返された改行を詰める", () => {
    const raw = "建築物等の新\n築及び増築に係る建築工事に適用する。";
    expect(reflowSpecText(raw)).toBe("建築物等の新築及び増築に係る建築工事に適用する。");
  });

  it("句点で終わる行の後の改行は残す", () => {
    const raw = "常温で行う。\n曲げ加工は、所定の形状とする。";
    expect(reflowSpecText(raw)).toBe(raw);
  });

  it("(1) ① 表 図 (注) などで始まる行の前の改行は残す", () => {
    const raw = [
      "(1) 適用範囲",
      "本章は鉄筋工事に",
      "適用する。",
      "(2) 受注者",
      "① 鉄筋の種類",
      "表5.3.5 かぶり厚さ",
      "図 1 断面",
      "(注) 単位はmm",
    ].join("\n");
    expect(reflowSpecText(raw).split("\n")).toEqual([
      // 見出し行の「後ろ」の改行は保護されない（句点で終わらないため本文と連結される）。
      // これは現行の仕様。変える場合はこの期待値も更新すること
      "(1) 適用範囲本章は鉄筋工事に適用する。",
      "(2) 受注者",
      "① 鉄筋の種類",
      "表5.3.5 かぶり厚さ",
      "図 1 断面",
      "(注) 単位はmm",
    ]);
  });

  it("空行は1つの改行に畳まれる（空行の次の行が空行に連結されるため）", () => {
    expect(reflowSpecText("あ\n\nい")).toBe("あ\nい");
  });

  it("連結時に行末・行頭の空白を取り除く", () => {
    expect(reflowSpecText("鉄筋の \n　加工")).toBe("鉄筋の加工");
  });

  it("空文字・CRLF を扱える", () => {
    expect(reflowSpecText("")).toBe("");
    expect(reflowSpecText("あ\r\nい")).toBe("あい");
  });
});
