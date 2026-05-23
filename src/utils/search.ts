import Fuse from "fuse.js";
import type { Detail, SortType } from "../types";

const safeStr = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

const normalize = (s: unknown): string =>
  safeStr(s).toLowerCase().replace(/\s+/g, " ").trim();

const buildSearchBlob = (detail: Detail): string => {
  const title = safeStr(detail?.title);
  const desc = safeStr(detail?.description);
  const tags = Array.isArray(detail?.tags) ? detail.tags.join(" ") : "";
  const category = Array.isArray(detail?.categoryPath)
    ? detail.categoryPath.join(" ")
    : "";
  const searchText = safeStr(detail?.searchText);
  const blob =
    searchText.length > 0 ? searchText : `${title} ${desc} ${tags} ${category}`;
  return normalize(blob);
};

const buildCategoryPathKey = (detail: Detail): string => {
  if (!Array.isArray(detail?.categoryPath)) return "";
  return detail.categoryPath.join("/");
};

const matchCategory = (detail: Detail, selectedCategories: string[]): boolean => {
  if (!Array.isArray(selectedCategories) || selectedCategories.length === 0)
    return true;

  const detailPath = buildCategoryPathKey(detail);
  const detailPathNorm = normalize(detailPath);
  const detailNames = Array.isArray(detail?.categoryPath)
    ? detail.categoryPath
    : [];
  const detailNamesNorm = detailNames.map((n) => normalize(n));

  return selectedCategories.some((selRaw) => {
    const sel = safeStr(selRaw);
    if (!sel) return false;
    if (sel.includes("/")) {
      const selNorm = normalize(sel);
      return (
        detailPathNorm === selNorm || detailPathNorm.startsWith(selNorm + "/")
      );
    }
    const selNorm = normalize(sel);
    return detailNamesNorm.includes(selNorm);
  });
};

const matchFileType = (detail: Detail, selectedFileTypes: string[]): boolean => {
  if (!Array.isArray(selectedFileTypes) || selectedFileTypes.length === 0)
    return true;

  const files = detail?.files || {};
  const hasPdf = !!files.pdf?.path;
  const hasDwg = !!files.dwg?.path;
  const hasDxf = !!files.dxf?.path;

  return selectedFileTypes.some((t) => {
    const key = safeStr(t).toLowerCase();
    if (key === "pdf") return hasPdf;
    if (key === "dwg") return hasDwg;
    if (key === "dxf") return hasDxf;
    return false;
  });
};

const buildFuse = (details: Detail[]): Fuse<Detail> =>
  new Fuse(details, {
    keys: [
      { name: "title", weight: 3 },
      { name: "tags", weight: 2 },
      { name: "categoryPath", weight: 1.5 },
      { name: "description", weight: 1 },
      { name: "searchText", weight: 2 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeMatches: true,
    minMatchCharLength: 1,
    useExtendedSearch: false,
  });

export const searchDetails = (
  details: Detail[],
  query: string,
  selectedCategories: string[],
  selectedFileTypes: string[]
): Detail[] => {
  const list = Array.isArray(details) ? details : [];
  const q = normalize(query);

  const baseFiltered = list.filter((detail) => {
    if (!matchCategory(detail, selectedCategories)) return false;
    if (!matchFileType(detail, selectedFileTypes)) return false;
    return true;
  });

  if (!q) {
    return baseFiltered.map((d) => ({ ...d, _matchScore: 0 }));
  }

  const exactHits = baseFiltered.filter((d) => buildSearchBlob(d).includes(q));

  if (exactHits.length >= 1) {
    const exactIds = new Set(exactHits.map((d) => d.id));
    const fuse = buildFuse(baseFiltered);
    const fuzzy = fuse.search(q);
    const additional = fuzzy
      .filter((r) => !exactIds.has(r.item.id))
      .map((r) => ({ ...r.item, _matchScore: r.score ?? 0.5 }));

    return [
      ...exactHits.map((d) => ({ ...d, _matchScore: 0 })),
      ...additional,
    ];
  }

  const fuse = buildFuse(baseFiltered);
  return fuse.search(q).map((r) => ({ ...r.item, _matchScore: r.score ?? 0.5 }));
};

export const sortDetails = (details: Detail[], sortType: SortType): Detail[] => {
  const list = Array.isArray(details) ? [...details] : [];
  const type = safeStr(sortType);

  if (type === "relevance") {
    list.sort((a, b) => (a._matchScore ?? 1) - (b._matchScore ?? 1));
    return list;
  }
  if (type === "name-asc") {
    list.sort((a, b) =>
      safeStr(a?.title).localeCompare(safeStr(b?.title), "ja")
    );
    return list;
  }
  if (type === "name-desc") {
    list.sort((a, b) =>
      safeStr(b?.title).localeCompare(safeStr(a?.title), "ja")
    );
    return list;
  }
  if (type === "date-desc") {
    list.sort((a, b) =>
      safeStr(b?.updatedAt).localeCompare(safeStr(a?.updatedAt))
    );
    return list;
  }
  if (type === "date-asc") {
    list.sort((a, b) =>
      safeStr(a?.updatedAt).localeCompare(safeStr(b?.updatedAt))
    );
    return list;
  }

  list.sort((a, b) => {
    const ap = safeStr(buildCategoryPathKey(a));
    const bp = safeStr(buildCategoryPathKey(b));
    const c = ap.localeCompare(bp, "ja");
    if (c !== 0) return c;
    return safeStr(a?.title).localeCompare(safeStr(b?.title), "ja");
  });
  return list;
};

export type HighlightPart = { text: string; hit: boolean };

export const highlightText = (
  text: unknown,
  query: unknown
): HighlightPart[] | string => {
  const t = safeStr(text);
  const q = normalize(query);
  if (!q || !t) return t;

  const lowerT = t.toLowerCase();
  const parts: HighlightPart[] = [];
  let i = 0;
  while (i < t.length) {
    const idx = lowerT.indexOf(q, i);
    if (idx === -1) {
      parts.push({ text: t.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ text: t.slice(i, idx), hit: false });
    parts.push({ text: t.slice(idx, idx + q.length), hit: true });
    i = idx + q.length;
  }
  return parts;
};
