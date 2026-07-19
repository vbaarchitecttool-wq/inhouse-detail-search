import Fuse from "fuse.js";
import type { Detail, SortType } from "../types";

const safeStr = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

const normalize = (s: unknown): string =>
  safeStr(s).toLowerCase().replace(/\s+/g, " ").trim();

const buildSearchBlob = (detail: Detail): string => {
  const number = safeStr(detail?.number);
  const title = safeStr(detail?.title);
  const original = safeStr(detail?.original);
  const tags = Array.isArray(detail?.tags) ? detail.tags.join(" ") : "";
  const category = Array.isArray(detail?.categoryPath)
    ? detail.categoryPath.join(" ")
    : "";
  const c = detail?.commentary;
  const commentaryText = c
    ? `${safeStr(c.plainSummary)} ${safeStr(c.why)} ${(c.points || []).join(
        " "
      )} ${(c.glossary || []).map((g) => `${g.term} ${g.meaning}`).join(" ")}`
    : "";
  return normalize(
    `${number} ${title} ${category} ${tags} ${original} ${commentaryText}`
  );
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

export const hasCommentary = (detail: Detail): boolean => {
  const c = detail?.commentary;
  if (!c) return false;
  return Boolean(
    safeStr(c.plainSummary) ||
      safeStr(c.why) ||
      (c.points && c.points.length > 0)
  );
};

export const hasDiagram = (detail: Detail): boolean =>
  Boolean(detail?.commentary?.diagrams && detail.commentary.diagrams.length > 0);

const matchContentFlags = (
  detail: Detail,
  selectedFlags: string[]
): boolean => {
  if (!Array.isArray(selectedFlags) || selectedFlags.length === 0) return true;

  return selectedFlags.some((f) => {
    const key = safeStr(f).toLowerCase();
    if (key === "commentary") return hasCommentary(detail);
    if (key === "diagram") return hasDiagram(detail);
    return false;
  });
};

const buildFuse = (details: Detail[]): Fuse<Detail> =>
  new Fuse(details, {
    keys: [
      { name: "number", weight: 4 },
      { name: "title", weight: 3 },
      { name: "tags", weight: 2 },
      { name: "categoryPath", weight: 1.5 },
      { name: "commentary.plainSummary", weight: 1 },
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
  selectedContentFlags: string[]
): Detail[] => {
  const list = Array.isArray(details) ? details : [];
  const q = normalize(query);

  const baseFiltered = list.filter((detail) => {
    if (!matchCategory(detail, selectedCategories)) return false;
    if (!matchContentFlags(detail, selectedContentFlags)) return false;
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

/** 条項番号 "1.2.3" → [1, 2, 3]。数値でない場合は大きな値で末尾へ */
const numberKey = (detail: Detail): number[] => {
  const parts = safeStr(detail?.number).split(".");
  if (parts.length !== 3) return [999, 999, 999];
  return parts.map((p) => {
    const n = parseInt(p, 10);
    return Number.isFinite(n) ? n : 999;
  });
};

const compareByNumber = (a: Detail, b: Detail): number => {
  const ka = numberKey(a);
  const kb = numberKey(b);
  for (let i = 0; i < 3; i++) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return 0;
};

export const sortDetails = (details: Detail[], sortType: SortType): Detail[] => {
  const list = Array.isArray(details) ? [...details] : [];

  if (safeStr(sortType) === "relevance") {
    list.sort((a, b) => {
      const c = (a._matchScore ?? 1) - (b._matchScore ?? 1);
      if (c !== 0) return c;
      return compareByNumber(a, b);
    });
    return list;
  }

  // 既定: 条項順（章.節.項の番号順）
  list.sort(compareByNumber);
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
