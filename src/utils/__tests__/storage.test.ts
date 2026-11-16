import {
  loadFavorites,
  saveFavorites,
  loadRecent,
  pushRecent,
  clearRecent,
  loadViewMode,
  saveViewMode,
  loadTheme,
  saveTheme,
} from "../storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("お気に入り", () => {
  it("保存した順序のまま読み戻せる", () => {
    saveFavorites(["5.3.2", "1.1.1"]);
    expect(loadFavorites()).toEqual(["5.3.2", "1.1.1"]);
  });

  it("未保存なら空配列", () => {
    expect(loadFavorites()).toEqual([]);
  });

  it("壊れたJSONが入っていても落ちずに既定値へ戻す", () => {
    window.localStorage.setItem("ids-favorites-v1", "{not json");
    expect(loadFavorites()).toEqual([]);
  });
});

describe("最近見た条項", () => {
  it("先頭に追加され、同じIDは重複せず先頭へ移動する", () => {
    pushRecent("1.1.1");
    pushRecent("5.3.2");
    expect(pushRecent("1.1.1")).toEqual(["1.1.1", "5.3.2"]);
    expect(loadRecent()).toEqual(["1.1.1", "5.3.2"]);
  });

  it("最大10件で古いものから落ちる", () => {
    for (let i = 1; i <= 12; i++) pushRecent(`1.1.${i}`);
    const r = loadRecent();
    expect(r).toHaveLength(10);
    expect(r[0]).toBe("1.1.12");
    expect(r).not.toContain("1.1.1");
    expect(r).not.toContain("1.1.2");
  });

  it("空IDは無視する", () => {
    expect(pushRecent("")).toEqual([]);
    expect(loadRecent()).toEqual([]);
  });

  it("clearRecent で消える", () => {
    pushRecent("1.1.1");
    clearRecent();
    expect(loadRecent()).toEqual([]);
  });
});

describe("表示モードとテーマ", () => {
  it("表示モードの既定は grid、不正値も grid", () => {
    expect(loadViewMode()).toBe("grid");
    window.localStorage.setItem("ids-view-mode-v1", "table");
    expect(loadViewMode()).toBe("grid");
    saveViewMode("list");
    expect(loadViewMode()).toBe("list");
  });

  it("テーマの既定は light、auto/dark/light 以外は light", () => {
    expect(loadTheme()).toBe("light");
    saveTheme("dark");
    expect(loadTheme()).toBe("dark");
    saveTheme("auto");
    expect(loadTheme()).toBe("auto");
    window.localStorage.setItem("ids-theme-v1", "sepia");
    expect(loadTheme()).toBe("light");
  });
});
