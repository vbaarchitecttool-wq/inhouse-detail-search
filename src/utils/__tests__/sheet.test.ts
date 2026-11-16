import {
  BASE_KEY,
  addExtra,
  addSheet,
  buildGroups,
  countProgress,
  createSheet,
  getActiveSheet,
  moveClause,
  nextSheetName,
  removeExtra,
  removeSheet,
  resetChecks,
  safeFileName,
  setCheck,
  setItemNote,
  sheetToCsv,
  sheetToText,
  todayIso,
  toggleClause,
} from "../sheet";
import type { Detail, SheetsState } from "../../types";

const detail = (id: string, title: string, points?: string[]): Detail => ({
  id,
  number: id,
  title,
  categoryPath: ["5章 鉄筋工事", "3節 加工及び組立"],
  original: "",
  tags: [],
  commentary: points ? { points } : undefined,
});

const details = new Map<string, Detail>([
  ["5.3.2", detail("5.3.2", "加工", ["折曲げ寸法を確認", "加工は常温で行う"])],
  ["5.3.5", detail("5.3.5", "かぶり厚さ")],
]);

const empty: SheetsState = { sheets: [], activeId: null };
const fallback = () => createSheet("s1", "チェックシート 1", [], "2026-11-16");

const withTwo = (): SheetsState =>
  toggleClause(toggleClause(empty, "5.3.2", fallback()), "5.3.5", fallback());

describe("シートの作成と条項の出し入れ", () => {
  it("シートが無いときに条項を入れると、シートを作って入れる", () => {
    const s = toggleClause(empty, "5.3.2", fallback());
    expect(s.sheets).toHaveLength(1);
    expect(s.activeId).toBe("s1");
    expect(getActiveSheet(s)?.items.map((i) => i.id)).toEqual(["5.3.2"]);
  });

  it("同じ条項をもう一度入れると外れる", () => {
    const s = toggleClause(withTwo(), "5.3.2", fallback());
    expect(getActiveSheet(s)?.items.map((i) => i.id)).toEqual(["5.3.5"]);
  });

  it("元の状態は書き換えない", () => {
    const before = withTwo();
    const snapshot = JSON.stringify(before);
    setCheck(before, "5.3.2", "p0", "ok");
    moveClause(before, "5.3.5", -1);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("シートを消すと、残ったシートが使用中になる", () => {
    const two = addSheet(withTwo(), createSheet("s2", "別のシート"));
    expect(two.activeId).toBe("s2");
    const one = removeSheet(two, "s2");
    expect(one.activeId).toBe("s1");
    expect(removeSheet(one, "s1")).toEqual({ sheets: [], activeId: null });
  });

  it("シート名は重ならない番号を付ける", () => {
    const s = withTwo();
    expect(nextSheetName(s.sheets)).toBe("チェックシート 2");
    expect(nextSheetName([])).toBe("チェックシート 1");
  });

  it("並び順を入れ替える。端を超える移動は何もしない", () => {
    const s = moveClause(withTwo(), "5.3.5", -1);
    expect(getActiveSheet(s)?.items.map((i) => i.id)).toEqual(["5.3.5", "5.3.2"]);
    const same = moveClause(s, "5.3.5", -1);
    expect(getActiveSheet(same)?.items.map((i) => i.id)).toEqual(["5.3.5", "5.3.2"]);
  });
});

describe("確認項目と判定", () => {
  it("解説のチェックポイントが確認項目になる。無い条項は既定の1項目", () => {
    const groups = buildGroups(getActiveSheet(withTwo())!, details);
    expect(groups[0].rows.map((r) => r.text)).toEqual([
      "折曲げ寸法を確認",
      "加工は常温で行う",
    ]);
    expect(groups[1].rows.map((r) => r.key)).toEqual([BASE_KEY]);
  });

  it("判定を付け、同じ判定をもう一度押すと未確認に戻る", () => {
    let s = setCheck(withTwo(), "5.3.2", "p0", "ok");
    s = setCheck(s, "5.3.2", "p1", "ng");
    let p = countProgress(buildGroups(getActiveSheet(s)!, details));
    expect(p).toEqual({ total: 3, done: 2, ng: 1 });

    s = setCheck(s, "5.3.2", "p1", "ng");
    p = countProgress(buildGroups(getActiveSheet(s)!, details));
    expect(p).toEqual({ total: 3, done: 1, ng: 0 });
  });

  it("自分で足した項目は末尾に並び、消すと判定も消える", () => {
    let s = addExtra(withTwo(), "5.3.5", "x1", "  特記：屋外は 50mm  ");
    s = setCheck(s, "5.3.5", "x1", "ok");
    const rows = buildGroups(getActiveSheet(s)!, details)[1].rows;
    expect(rows[1]).toMatchObject({ text: "特記：屋外は 50mm", custom: true, state: "ok" });

    s = removeExtra(s, "5.3.5", "x1");
    const item = getActiveSheet(s)!.items[1];
    expect(item.extras).toEqual([]);
    expect(item.checks).toEqual({});
  });

  it("空の項目は足さない", () => {
    const before = withTwo();
    expect(addExtra(before, "5.3.5", "x1", "   ")).toBe(before);
  });

  it("使い回し：判定と備考だけ消し、条項と足した項目は残す", () => {
    let s = addExtra(withTwo(), "5.3.2", "x1", "追加項目");
    s = setCheck(s, "5.3.2", "p0", "ok");
    s = setItemNote(s, "5.3.2", "写真 No.12");
    s = resetChecks(s);
    const item = getActiveSheet(s)!.items[0];
    expect(item.checks).toEqual({});
    expect(item.note).toBe("");
    expect(item.extras).toHaveLength(1);
  });

  it("原文データから消えた条項が入っていても落ちない", () => {
    const s = toggleClause(empty, "99.9.9", fallback());
    const groups = buildGroups(getActiveSheet(s)!, details);
    expect(groups[0].detail).toBeNull();
    expect(groups[0].rows).toHaveLength(1);
    expect(sheetToText(getActiveSheet(s)!, groups)).toContain("99.9.9");
  });
});

describe("書き出し", () => {
  const filled = (): SheetsState => {
    let s = setCheck(withTwo(), "5.3.2", "p0", "ok");
    s = setCheck(s, "5.3.2", "p1", "ng");
    s = setItemNote(s, "5.3.2", '径 "D13" を再加工');
    return s;
  };

  it("テキスト：判定の記号と備考が入る", () => {
    const sheet = { ...getActiveSheet(filled())!, site: "テスト工事", inspector: "確認者A" };
    const text = sheetToText(sheet, buildGroups(sheet, details));
    expect(text).toContain("■ チェックシート 1");
    expect(text).toContain("工事名：テスト工事");
    expect(text).toContain("検査日：2026年11月16日");
    expect(text).toContain("【5.3.2 加工】");
    expect(text).toContain("[○] 折曲げ寸法を確認");
    expect(text).toContain("[×] 加工は常温で行う");
    expect(text).toContain("確認 2/3 項目（要是正 1）");
  });

  it("CSV：BOM つき・CRLF・引用符を二重にする", () => {
    const sheet = getActiveSheet(filled())!;
    const csv = sheetToCsv(sheet, buildGroups(sheet, details));
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"1","5.3.2","加工","折曲げ寸法を確認","適合","径 ""D13"" を再加工"\r\n');
    expect(csv).toContain('"2","5.3.2","加工","加工は常温で行う","要是正",""\r\n');
    expect(csv).toContain('"3","5.3.5","かぶり厚さ"');
  });

  it("CSV：= で始まる値は式として解釈させない", () => {
    let s = addExtra(withTwo(), "5.3.5", "x1", "=1+1");
    s = setItemNote(s, "5.3.5", "-要確認");
    const sheet = getActiveSheet(s)!;
    const csv = sheetToCsv(sheet, buildGroups(sheet, details));
    expect(csv).toContain(`"'=1+1"`);
    expect(csv).toContain(`"'-要確認"`);
  });

  it("ファイル名に使えない文字を除く", () => {
    expect(safeFileName('5章/鉄筋 "検査":1')).toBe("5章_鉄筋_検査_1");
    expect(safeFileName("")).toBe("チェックシート");
  });

  it("日付は端末の現地日付", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
