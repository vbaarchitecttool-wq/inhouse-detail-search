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

export interface UrlState {
  query: string;
  categories: string[];
  contentFlags: string[];
  sortType: SortType;
  favoritesOnly: boolean;
  detailId: string | null;
}
