import type { ViewMode, Theme } from "../types";

const KEY_FAVORITES = "ids-favorites-v1";
const KEY_RECENT = "ids-recent-v1";
const KEY_VIEW_MODE = "ids-view-mode-v1";
const KEY_THEME = "ids-theme-v1";

const RECENT_MAX = 10;

// localStorage はプライベートブラウズや容量超過で例外を投げることがある。
// 保存できなくても閲覧は続けられるよう、読み書きは必ずここを通す。
const getItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setItem = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 保存できない環境では何もしない */
  }
};

const removeItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
};

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (raw === null) return fallback;
  try {
    const v = JSON.parse(raw);
    // 配列を期待している箇所に壊れた値が入っていても落とさない
    if (Array.isArray(fallback) && !Array.isArray(v)) return fallback;
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
};

export const loadFavorites = (): string[] => {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(getItem(KEY_FAVORITES), []);
};

export const saveFavorites = (ids: string[]): void => {
  if (typeof window === "undefined") return;
  setItem(KEY_FAVORITES, JSON.stringify(ids));
};

export const loadRecent = (): string[] => {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(getItem(KEY_RECENT), []);
};

export const pushRecent = (id: string): string[] => {
  if (!id || typeof window === "undefined") return [];
  const cur = loadRecent().filter((x) => x !== id);
  const next = [id, ...cur].slice(0, RECENT_MAX);
  setItem(KEY_RECENT, JSON.stringify(next));
  return next;
};

export const clearRecent = (): void => {
  if (typeof window === "undefined") return;
  removeItem(KEY_RECENT);
};

export const loadViewMode = (): ViewMode => {
  if (typeof window === "undefined") return "grid";
  const v = getItem(KEY_VIEW_MODE);
  return v === "list" ? "list" : "grid";
};

export const saveViewMode = (mode: ViewMode): void => {
  if (typeof window === "undefined") return;
  setItem(KEY_VIEW_MODE, mode);
};

export const loadTheme = (): Theme => {
  // 既定はライト（明るい背景）。ユーザーはトグルで自動/ダークにも切替できる
  if (typeof window === "undefined") return "light";
  const v = getItem(KEY_THEME);
  if (v === "dark" || v === "light" || v === "auto") return v;
  return "light";
};

export const saveTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;
  setItem(KEY_THEME, theme);
};

const KEY_OFFLINE_PHOTOS = "ids-offline-photos-v1";

/** 図解写真を一括保存した時点の写真リビジョン（未保存なら null） */
export const loadOfflinePhotosRevision = (): string | null => {
  if (typeof window === "undefined") return null;
  return getItem(KEY_OFFLINE_PHOTOS);
};

export const saveOfflinePhotosRevision = (revision: string): void => {
  if (typeof window === "undefined") return;
  setItem(KEY_OFFLINE_PHOTOS, revision);
};
