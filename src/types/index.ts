// ドメイン型定義

/** コンテンツフィルタ（解説あり／図解あり） */
export type ContentFlag = "commentary" | "diagram";

export interface Diagram {
  /** インラインSVG文字列（自作の図解のみを格納する） */
  svg: string;
  caption?: string;
}

export interface GlossaryEntry {
  term: string;
  meaning: string;
}

/** 1年生向けのやさしい解説（原文とは明確に区別する） */
export interface Commentary {
  /** 一言でいうと */
  plainSummary?: string;
  /** なぜこの規定があるのか・背景 */
  why?: string;
  /** 現場でのチェックポイント */
  points?: string[];
  diagrams?: Diagram[];
  glossary?: GlossaryEntry[];
}

/** 仕様書の「項」（例: 5.3.2 加工）を1件として扱う */
export interface Detail {
  id: string;
  /** 条項番号（例: "1.1.1"） */
  number: string;
  title: string;
  /** [章名, 節名] */
  categoryPath: string[];
  /** 標準仕様書の原文（改変しない） */
  original: string;
  tags: string[];
  commentary?: Commentary;
  searchText?: string;
  relatedIds?: string[];
  _matchScore?: number;
}

export interface CategoryNode {
  id: string;
  name: string;
  count?: number;
  children?: CategoryNode[];
}

export interface IndexData {
  version: string;
  generatedAt: string;
  source?: string;
  categories: CategoryNode[];
  details: Detail[];
}

export type SortType = "category" | "relevance";

export type ViewMode = "grid" | "list";
export type Theme = "auto" | "light" | "dark";

/** 画面の切替（さがす／チェックシート／用語辞典／学習） */
export type AppView = "search" | "sheet" | "glossary" | "study";

export interface UrlState {
  query: string;
  categories: string[];
  contentFlags: string[];
  sortType: SortType;
  favoritesOnly: boolean;
  detailId: string | null;
  /** 省略時は "search" */
  view?: AppView;
}

/* ------------------------------------------------------------------ */
/* 利用者が端末に持つデータ（チェックシート・メモ・学習記録）           */
/* ------------------------------------------------------------------ */

/** 判定：適合 / 要是正 / 対象外 */
export type CheckState = "ok" | "ng" | "na";

/** 利用者が足した確認項目（特記仕様書の内容など） */
export interface SheetExtra {
  key: string;
  text: string;
}

/** チェックシートに入れた条項1件 */
export interface SheetItem {
  /** 条項ID */
  id: string;
  /** 確認項目キー → 判定 */
  checks: Record<string, CheckState>;
  extras: SheetExtra[];
  /** 備考 */
  note: string;
}

export interface CheckSheet {
  id: string;
  name: string;
  /** 工事名 */
  site: string;
  /** 検査日（YYYY-MM-DD） */
  date: string;
  /** 確認者 */
  inspector: string;
  items: SheetItem[];
}

export interface SheetsState {
  sheets: CheckSheet[];
  activeId: string | null;
}

export interface QuizStat {
  ok: number;
  ng: number;
}

/** バックアップの対象になる、利用者のデータ一式 */
export interface UserData {
  favorites: string[];
  notes: Record<string, string>;
  sheets: SheetsState;
  readIds: string[];
  quizStats: Record<string, QuizStat>;
}
