import type { UrlState, SortType } from "../types";

const KEY_Q = "q";
const KEY_CAT = "cat";
const KEY_TYPE = "type";
const KEY_SORT = "sort";
const KEY_FAV = "fav";
const KEY_ID = "id";

const SORT_VALUES: SortType[] = [
  "category",
  "relevance",
  "name-asc",
  "name-desc",
  "date-desc",
  "date-asc",
];

const toSort = (s: string | null): SortType => {
  if (s && (SORT_VALUES as string[]).includes(s)) return s as SortType;
  return "category";
};

export const readUrlState = (): UrlState => {
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
    sortType: toSort(sp.get(KEY_SORT)),
    favoritesOnly: sp.get(KEY_FAV) === "1",
    detailId: sp.get(KEY_ID) || null,
  };
};

const buildParams = (state: UrlState): URLSearchParams => {
  const sp = new URLSearchParams();
  if (state.query) sp.set(KEY_Q, state.query);
  if (state.categories?.length) sp.set(KEY_CAT, state.categories.join("|"));
  if (state.fileTypes?.length) sp.set(KEY_TYPE, state.fileTypes.join(","));
  if (state.sortType && state.sortType !== "category")
    sp.set(KEY_SORT, state.sortType);
  if (state.favoritesOnly) sp.set(KEY_FAV, "1");
  if (state.detailId) sp.set(KEY_ID, state.detailId);
  return sp;
};

export const writeUrlState = (state: UrlState): void => {
  if (typeof window === "undefined") return;
  const sp = buildParams(state);
  const qs = sp.toString();
  const next = qs ? `?${qs}` : window.location.pathname;
  const cur = window.location.search;
  if (cur !== (qs ? `?${qs}` : "")) {
    window.history.replaceState(null, "", next);
  }
};

export const buildShareUrl = (state: UrlState): string => {
  if (typeof window === "undefined") return "";
  const qs = buildParams(state).toString();
  const { origin, pathname } = window.location;
  return qs ? `${origin}${pathname}?${qs}` : `${origin}${pathname}`;
};
