import type { ViewMode, Theme } from "../types";

const KEY_FAVORITES = "ids-favorites-v1";
const KEY_RECENT = "ids-recent-v1";
const KEY_VIEW_MODE = "ids-view-mode-v1";
const KEY_THEME = "ids-theme-v1";

const RECENT_MAX = 10;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (raw === null) return fallback;
  try {
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
};

export const loadFavorites = (): string[] => {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(window.localStorage.getItem(KEY_FAVORITES), []);
};

export const saveFavorites = (ids: string[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_FAVORITES, JSON.stringify(ids));
};

export const loadRecent = (): string[] => {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(window.localStorage.getItem(KEY_RECENT), []);
};

export const pushRecent = (id: string): string[] => {
  if (!id || typeof window === "undefined") return [];
  const cur = loadRecent().filter((x) => x !== id);
  const next = [id, ...cur].slice(0, RECENT_MAX);
  window.localStorage.setItem(KEY_RECENT, JSON.stringify(next));
  return next;
};

export const clearRecent = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_RECENT);
};

export const loadViewMode = (): ViewMode => {
  if (typeof window === "undefined") return "grid";
  const v = window.localStorage.getItem(KEY_VIEW_MODE);
  return v === "list" ? "list" : "grid";
};

export const saveViewMode = (mode: ViewMode): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_VIEW_MODE, mode);
};

export const loadTheme = (): Theme => {
  // 既定はライト（明るい背景）。ユーザーはトグルで自動/ダークにも切替できる
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(KEY_THEME);
  if (v === "dark" || v === "light" || v === "auto") return v;
  return "light";
};

export const saveTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_THEME, theme);
};
