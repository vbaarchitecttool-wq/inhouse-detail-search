// ドメイン型定義

export type FileType = "pdf" | "dwg" | "dxf";

export interface FileInfo {
  path: string;
  size?: number;
}

export interface DetailFiles {
  pdf?: FileInfo;
  dwg?: FileInfo;
  dxf?: FileInfo;
}

export interface Detail {
  id: string;
  title: string;
  categoryPath: string[];
  files: DetailFiles;
  tags: string[];
  description: string;
  updatedAt: string;
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
  categories: CategoryNode[];
  details: Detail[];
}

export type SortType =
  | "category"
  | "relevance"
  | "name-asc"
  | "name-desc"
  | "date-desc"
  | "date-asc";

export type ViewMode = "grid" | "list";
export type Theme = "auto" | "light" | "dark";

export interface UrlState {
  query: string;
  categories: string[];
  fileTypes: string[];
  sortType: SortType;
  favoritesOnly: boolean;
  detailId: string | null;
}
