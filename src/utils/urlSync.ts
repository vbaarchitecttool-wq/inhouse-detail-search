import type { UrlState, SortType, AppView } from "../types";

const KEY_Q = "q";
const KEY_CAT = "cat";
const KEY_FLAG = "flag";
const KEY_SORT = "sort";
const KEY_FAV = "fav";
const KEY_ID = "id";
const KEY_VIEW = "view";

const VIEW_VALUES: AppView[] = ["search", "sheet", "glossary", "study"];

const toView = (s: string | null): AppView =>
  s && (VIEW_VALUES as string[]).includes(s) ? (s as AppView) : "search";

const SORT_VALUES: SortType[] = ["category", "relevance"];

// 既定は「関連度順」。キーワードが無いときは App 側で条項順として扱う
const DEFAULT_SORT: SortType = "relevance";

const toSort = (s: string | null): SortType => {
  if (s && (SORT_VALUES as string[]).includes(s)) return s as SortType;
  return DEFAULT_SORT;
};

export const readUrlState = (): UrlState => {
  if (typeof window === "undefined") {
    return {
      query: "",
      categories: [],
      contentFlags: [],
      sortType: DEFAULT_SORT,
      favoritesOnly: false,
      detailId: null,
      view: "search",
    };
  }
  const sp = new URLSearchParams(window.location.search);
  return {
    query: sp.get(KEY_Q) || "",
    categories: (sp.get(KEY_CAT) || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
    contentFlags: (sp.get(KEY_FLAG) || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    sortType: toSort(sp.get(KEY_SORT)),
    favoritesOnly: sp.get(KEY_FAV) === "1",
    detailId: sp.get(KEY_ID) || null,
    view: toView(sp.get(KEY_VIEW)),
  };
};

const buildParams = (state: UrlState): URLSearchParams => {
  const sp = new URLSearchParams();
  if (state.query) sp.set(KEY_Q, state.query);
  if (state.categories?.length) sp.set(KEY_CAT, state.categories.join("|"));
  if (state.contentFlags?.length) sp.set(KEY_FLAG, state.contentFlags.join(","));
  if (state.sortType && state.sortType !== DEFAULT_SORT)
    sp.set(KEY_SORT, state.sortType);
  if (state.favoritesOnly) sp.set(KEY_FAV, "1");
  if (state.detailId) sp.set(KEY_ID, state.detailId);
  if (state.view && state.view !== "search") sp.set(KEY_VIEW, state.view);
  return sp;
};

/** 条項を開いている間の履歴エントリに付ける目印（ブラウザの「戻る」で閉じるため） */
export const MODAL_HISTORY_FLAG = "naDetailOpen";

/**
 * 画面の状態をURLに反映する。
 * mode="push" は「条項を開いた」ときだけ使い、履歴を1つ積む。
 * これでスマホの「戻る」操作が、アプリを離れずに条項を閉じる動きになる。
 */
export const writeUrlState = (
  state: UrlState,
  mode: "replace" | "push" = "replace"
): void => {
  if (typeof window === "undefined") return;
  const sp = buildParams(state);
  const qs = sp.toString();
  const next = qs ? `?${qs}` : window.location.pathname;
  try {
    if (mode === "push") {
      window.history.pushState({ [MODAL_HISTORY_FLAG]: true }, "", next);
      return;
    }
    const cur = window.location.search;
    if (cur !== (qs ? `?${qs}` : "")) {
      window.history.replaceState(window.history.state, "", next);
    }
  } catch {
    /* 履歴APIが使えない環境（埋め込み表示など）でも閲覧は続けられるようにする */
  }
};

export const isModalHistoryEntry = (): boolean => {
  if (typeof window === "undefined") return false;
  const st = window.history.state as Record<string, unknown> | null;
  return Boolean(st && st[MODAL_HISTORY_FLAG]);
};

/** チャットに貼る用の、条項1件だけを指す短いURL（検索条件は含めない） */
export const buildDetailUrl = (detailId: string): string => {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  const sp = new URLSearchParams();
  sp.set(KEY_ID, detailId);
  return `${origin}${pathname}?${sp.toString()}`;
};

export const buildShareUrl = (state: UrlState): string => {
  if (typeof window === "undefined") return "";
  const qs = buildParams(state).toString();
  const { origin, pathname } = window.location;
  return qs ? `${origin}${pathname}?${qs}` : `${origin}${pathname}`;
};
