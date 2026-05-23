// src/utils/storage.js
// localStorage の薄いラッパー。お気に入り・履歴・設定を扱う。

const KEY_FAVORITES = "ids-favorites-v1";
const KEY_RECENT = "ids-recent-v1";
const KEY_VIEW_MODE = "ids-view-mode-v1";
const KEY_THEME = "ids-theme-v1";

const RECENT_MAX = 10;

const safeParse = (raw, fallback) => {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

export const loadFavorites = () => {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY_FAVORITES), []);
};

export const saveFavorites = (ids) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_FAVORITES, JSON.stringify(ids));
};

export const loadRecent = () => {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY_RECENT), []);
};

export const pushRecent = (id) => {
  if (!id || typeof window === "undefined") return [];
  const cur = loadRecent().filter((x) => x !== id);
  const next = [id, ...cur].slice(0, RECENT_MAX);
  window.localStorage.setItem(KEY_RECENT, JSON.stringify(next));
  return next;
};

export const clearRecent = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_RECENT);
};

export const loadViewMode = () => {
  if (typeof window === "undefined") return "grid";
  return window.localStorage.getItem(KEY_VIEW_MODE) || "grid";
};

export const saveViewMode = (mode) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_VIEW_MODE, mode);
};

export const loadTheme = () => {
  if (typeof window === "undefined") return "auto";
  return window.localStorage.getItem(KEY_THEME) || "auto";
};

export const saveTheme = (theme) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_THEME, theme);
};
