import type {
  ViewMode,
  Theme,
  CheckSheet,
  CheckState,
  QuizStat,
  SheetExtra,
  SheetItem,
  SheetsState,
} from "../types";

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

/* ------------------------------------------------------------------ */
/* チェックシート・メモ・学習記録                                       */
/* 端末の中だけに保存する。壊れた値・他人が作ったバックアップを読んでも   */
/* 画面が落ちないよう、読み込みは必ず sanitize* を通す。                */
/* ------------------------------------------------------------------ */

const KEY_NOTES = "ids-notes-v1";
const KEY_SHEETS = "ids-sheets-v1";
const KEY_READ = "ids-read-v1";
const KEY_QUIZ = "ids-quiz-v1";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown, max = 4000): string =>
  typeof v === "string" ? v.slice(0, max) : "";

export const sanitizeIdList = (v: unknown): string[] =>
  Array.isArray(v)
    ? Array.from(
        new Set(v.filter((x): x is string => typeof x === "string" && !!x))
      )
    : [];

export const sanitizeNotes = (v: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!isRecord(v)) return out;
  for (const [id, text] of Object.entries(v)) {
    const t = str(text);
    if (id && t.trim()) out[id] = t;
  }
  return out;
};

const CHECK_STATES: CheckState[] = ["ok", "ng", "na"];

const sanitizeSheet = (v: unknown): CheckSheet | null => {
  if (!isRecord(v)) return null;
  const id = str(v.id, 64);
  if (!id) return null;
  const seen = new Set<string>();
  const items: SheetItem[] = [];
  for (const raw of Array.isArray(v.items) ? v.items : []) {
    if (!isRecord(raw)) continue;
    const itemId = str(raw.id, 64);
    if (!itemId || seen.has(itemId)) continue;
    seen.add(itemId);
    const checks: Record<string, CheckState> = {};
    if (isRecord(raw.checks)) {
      for (const [k, s] of Object.entries(raw.checks)) {
        if ((CHECK_STATES as unknown[]).includes(s)) checks[k] = s as CheckState;
      }
    }
    const extras: SheetExtra[] = [];
    for (const e of Array.isArray(raw.extras) ? raw.extras : []) {
      if (!isRecord(e)) continue;
      const key = str(e.key, 64);
      const text = str(e.text, 300).trim();
      if (key && text && !extras.some((x) => x.key === key)) {
        extras.push({ key, text });
      }
    }
    items.push({ id: itemId, checks, extras, note: str(raw.note) });
  }
  return {
    id,
    name: str(v.name, 80) || "チェックシート",
    site: str(v.site, 120),
    date: /^\d{4}-\d{2}-\d{2}$/.test(str(v.date)) ? str(v.date) : "",
    inspector: str(v.inspector, 60),
    items,
  };
};

export const sanitizeSheets = (v: unknown): SheetsState => {
  const rawList = isRecord(v) && Array.isArray(v.sheets) ? v.sheets : [];
  const sheets: CheckSheet[] = [];
  for (const raw of rawList) {
    const s = sanitizeSheet(raw);
    if (s && !sheets.some((x) => x.id === s.id)) sheets.push(s);
  }
  const wanted = isRecord(v) ? str(v.activeId, 64) : "";
  const activeId = sheets.some((s) => s.id === wanted)
    ? wanted
    : sheets[0]?.id ?? null;
  return { sheets, activeId };
};

export const sanitizeQuizStats = (v: unknown): Record<string, QuizStat> => {
  const out: Record<string, QuizStat> = {};
  if (!isRecord(v)) return out;
  const n = (x: unknown): number =>
    typeof x === "number" && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0;
  for (const [key, raw] of Object.entries(v)) {
    if (!key || !isRecord(raw)) continue;
    const stat = { ok: n(raw.ok), ng: n(raw.ng) };
    if (stat.ok + stat.ng > 0) out[key] = stat;
  }
  return out;
};

const loadJson = (key: string): unknown => {
  if (typeof window === "undefined") return null;
  return safeParse<unknown>(getItem(key), null);
};

const saveJson = (key: string, value: unknown): void => {
  if (typeof window === "undefined") return;
  setItem(key, JSON.stringify(value));
};

export const loadNotes = (): Record<string, string> =>
  sanitizeNotes(loadJson(KEY_NOTES));
export const saveNotes = (notes: Record<string, string>): void =>
  saveJson(KEY_NOTES, notes);

export const loadSheets = (): SheetsState => sanitizeSheets(loadJson(KEY_SHEETS));
export const saveSheets = (state: SheetsState): void =>
  saveJson(KEY_SHEETS, state);

/** 一度でも開いた条項（学習の進み具合に使う。「最近見た」と違い消えない） */
export const loadReadIds = (): string[] => sanitizeIdList(loadJson(KEY_READ));
export const saveReadIds = (ids: string[]): void => saveJson(KEY_READ, ids);

export const loadQuizStats = (): Record<string, QuizStat> =>
  sanitizeQuizStats(loadJson(KEY_QUIZ));
export const saveQuizStats = (stats: Record<string, QuizStat>): void =>
  saveJson(KEY_QUIZ, stats);
