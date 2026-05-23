// src/utils/urlSync.js
// 検索条件・選択中ディティールを URL クエリパラメータと同期させる

const KEY_Q = "q";
const KEY_CAT = "cat";
const KEY_TYPE = "type";
const KEY_SORT = "sort";
const KEY_FAV = "fav";
const KEY_ID = "id";

export const readUrlState = () => {
  if (typeof window === "undefined") {
    return {
      query: "",
      categories: [],
      fileTypes: [],
      sortType: "category",
      favoritesOnly: false,
      detailId: null,
    };
  }
  const sp = new URLSearchParams(window.location.search);
  return {
    query: sp.get(KEY_Q) || "",
    categories: (sp.get(KEY_CAT) || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
    fileTypes: (sp.get(KEY_TYPE) || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    sortType: sp.get(KEY_SORT) || "category",
    favoritesOnly: sp.get(KEY_FAV) === "1",
    detailId: sp.get(KEY_ID) || null,
  };
};

export const writeUrlState = (state) => {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams();
  if (state.query) sp.set(KEY_Q, state.query);
  if (state.categories?.length) sp.set(KEY_CAT, state.categories.join("|"));
  if (state.fileTypes?.length) sp.set(KEY_TYPE, state.fileTypes.join(","));
  if (state.sortType && state.sortType !== "category")
    sp.set(KEY_SORT, state.sortType);
  if (state.favoritesOnly) sp.set(KEY_FAV, "1");
  if (state.detailId) sp.set(KEY_ID, state.detailId);

  const qs = sp.toString();
  const next = qs ? `?${qs}` : window.location.pathname;
  const cur = window.location.search;
  if (cur !== (qs ? `?${qs}` : "")) {
    window.history.replaceState(null, "", next);
  }
};

export const buildShareUrl = (state) => {
  if (typeof window === "undefined") return "";
  const sp = new URLSearchParams();
  if (state.query) sp.set(KEY_Q, state.query);
  if (state.categories?.length) sp.set(KEY_CAT, state.categories.join("|"));
  if (state.fileTypes?.length) sp.set(KEY_TYPE, state.fileTypes.join(","));
  if (state.sortType && state.sortType !== "category")
    sp.set(KEY_SORT, state.sortType);
  if (state.favoritesOnly) sp.set(KEY_FAV, "1");
  if (state.detailId) sp.set(KEY_ID, state.detailId);
  const qs = sp.toString();
  const { origin, pathname } = window.location;
  return qs ? `${origin}${pathname}?${qs}` : `${origin}${pathname}`;
};
