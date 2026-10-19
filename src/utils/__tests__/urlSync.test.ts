import { readUrlState, writeUrlState, buildShareUrl } from "../urlSync";
import type { UrlState } from "../../types";

const setSearch = (qs: string) => {
  window.history.replaceState(null, "", `/${qs}`);
};

beforeEach(() => setSearch(""));

describe("readUrlState", () => {
  it("パラメータが無ければ既定値", () => {
    expect(readUrlState()).toEqual({
      query: "",
      categories: [],
      contentFlags: [],
      sortType: "category",
      favoritesOnly: false,
      detailId: null,
    });
  });

  it("各パラメータを読み取る（cat は | 区切り、flag は , 区切り）", () => {
    setSearch(
      "?q=%E3%81%8B%E3%81%B6%E3%82%8A&cat=5%E7%AB%A0%7C9%E7%AB%A0&flag=Commentary,diagram&sort=relevance&fav=1&id=5.3.2"
    );
    expect(readUrlState()).toEqual({
      query: "かぶり",
      categories: ["5章", "9章"],
      contentFlags: ["commentary", "diagram"],
      sortType: "relevance",
      favoritesOnly: true,
      detailId: "5.3.2",
    });
  });

  it("不正な sort は category に倒す", () => {
    setSearch("?sort=price");
    expect(readUrlState().sortType).toBe("category");
  });
});

describe("writeUrlState / buildShareUrl", () => {
  const state: UrlState = {
    query: "かぶり厚さ",
    categories: ["5章 鉄筋工事/3節 加工及び組立"],
    contentFlags: ["diagram"],
    sortType: "relevance",
    favoritesOnly: true,
    detailId: "5.3.5",
  };

  it("書き込んだ状態を読み戻すと一致する（往復）", () => {
    writeUrlState(state);
    expect(readUrlState()).toEqual(state);
  });

  it("既定値のパラメータは URL に出さない", () => {
    writeUrlState({
      query: "",
      categories: [],
      contentFlags: [],
      sortType: "category",
      favoritesOnly: false,
      detailId: null,
    });
    expect(window.location.search).toBe("");
  });

  it("共有URLは origin + pathname + クエリ", () => {
    const url = buildShareUrl(state);
    expect(url.startsWith(`${window.location.origin}/?`)).toBe(true);
    expect(new URL(url).searchParams.get("id")).toBe("5.3.5");
    expect(new URL(url).searchParams.get("q")).toBe("かぶり厚さ");
  });
});
