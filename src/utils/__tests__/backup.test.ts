import { parseBackup, serializeBackup, summarizeUserData } from "../backup";
import {
  loadNotes,
  loadQuizStats,
  loadReadIds,
  loadSheets,
  saveNotes,
  saveQuizStats,
  saveReadIds,
  saveSheets,
  sanitizeSheets,
} from "../storage";
import type { UserData } from "../../types";

const data: UserData = {
  favorites: ["5.3.2", "1.1.1"],
  notes: { "5.3.2": "先輩メモ：フックの向きに注意" },
  sheets: {
    activeId: "s1",
    sheets: [
      {
        id: "s1",
        name: "配筋検査",
        site: "テスト工事",
        date: "2026-11-16",
        inspector: "確認者A",
        items: [
          {
            id: "5.3.2",
            checks: { p0: "ok", x1: "ng" },
            extras: [{ key: "x1", text: "特記の確認" }],
            note: "写真 No.3",
          },
        ],
      },
    ],
  },
  readIds: ["5.3.2"],
  quizStats: { "5.3.2:フック": { ok: 2, ng: 1 } },
};

beforeEach(() => window.localStorage.clear());

describe("バックアップ", () => {
  it("書き出したものを読み込むと元に戻る", () => {
    expect(parseBackup(serializeBackup(data))).toEqual(data);
  });

  it("このアプリのファイルでなければ読み込まない", () => {
    expect(parseBackup("{not json")).toBeNull();
    expect(parseBackup("[1,2,3]")).toBeNull();
    expect(parseBackup(JSON.stringify({ app: "other", data: {} }))).toBeNull();
    expect(parseBackup(JSON.stringify({ app: "na-spec-viewer" }))).toBeNull();
  });

  it("壊れた項目・知らない値は捨てて、読める分だけ取り込む", () => {
    const broken = JSON.stringify({
      app: "na-spec-viewer",
      version: 1,
      data: {
        favorites: ["5.3.2", 42, "", "5.3.2"],
        notes: { "5.3.2": "残す", "1.1.1": "   ", "2.2.2": 5 },
        sheets: {
          activeId: "zzz",
          sheets: [
            null,
            { name: "IDなし" },
            {
              id: "s1",
              date: "きのう",
              items: [
                { id: "5.3.2", checks: { p0: "ok", p1: "maybe" }, extras: [{ key: "x", text: " " }] },
                { id: "5.3.2" },
                "x",
              ],
            },
          ],
        },
        readIds: "5.3.2",
        quizStats: { a: { ok: 1, ng: -3 }, b: { ok: 0, ng: 0 }, c: "x" },
      },
    });
    expect(parseBackup(broken)).toEqual({
      favorites: ["5.3.2"],
      notes: { "5.3.2": "残す" },
      sheets: {
        activeId: "s1",
        sheets: [
          {
            id: "s1",
            name: "チェックシート",
            site: "",
            date: "",
            inspector: "",
            items: [{ id: "5.3.2", checks: { p0: "ok" }, extras: [], note: "" }],
          },
        ],
      },
      readIds: [],
      quizStats: { a: { ok: 1, ng: 0 } },
    });
  });

  it("件数の要約", () => {
    expect(summarizeUserData(data)).toBe(
      "お気に入り 2件・メモ 1件・チェックシート 1枚・読んだ条項 1件"
    );
  });
});

describe("端末への保存", () => {
  it("メモ・シート・既読・クイズ記録を保存して読み戻せる", () => {
    saveNotes(data.notes);
    saveSheets(data.sheets);
    saveReadIds(data.readIds);
    saveQuizStats(data.quizStats);
    expect(loadNotes()).toEqual(data.notes);
    expect(loadSheets()).toEqual(data.sheets);
    expect(loadReadIds()).toEqual(data.readIds);
    expect(loadQuizStats()).toEqual(data.quizStats);
  });

  it("未保存・壊れた値でも既定値で始まる", () => {
    expect(loadSheets()).toEqual({ sheets: [], activeId: null });
    window.localStorage.setItem("ids-sheets-v1", "{broken");
    window.localStorage.setItem("ids-notes-v1", "[1,2]");
    expect(loadSheets()).toEqual({ sheets: [], activeId: null });
    expect(loadNotes()).toEqual({});
    expect(sanitizeSheets(null)).toEqual({ sheets: [], activeId: null });
  });
});
