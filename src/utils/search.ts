import Fuse from "fuse.js";
import type { Detail, SortType } from "../types";
import {
  escapeRegExp,
  foldKeepKana,
  foldText,
  foldWithMap,
  kanaFold,
} from "./normalize";
import { TERM_ALIASES } from "./searchTerms";

const safeStr = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

const normalize = (s: unknown): string =>
  safeStr(s).toLowerCase().replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------------ */
/* カテゴリ・コンテンツ絞り込み                                         */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* 検索語のコンパイル                                                   */
/* ------------------------------------------------------------------ */

const KANJI = /[㐀-鿿々〆]/;
const HIRAGANA = /[ぁ-ゖ]/;
const MAX_TERMS = 6;

export interface CompiledTerm {
  /** 入力されたままの語（画面表示用） */
  raw: string;
  /** 畳んだ語 */
  folded: string;
  /** 完全一致として扱う語（入力語＋表記ゆれ・現場用語の読み替え） */
  literals: string[];
  /** 送り仮名の違いを許す照合（取付け／取り付け）。該当しない語は null */
  loose: RegExp | null;
  /** 条項番号としての解釈（"5.3.2" / "5.3"）。該当しなければ null */
  numberParts: string[] | null;
  /** 「5章」「5章3節」としての解釈 */
  chapter: number | null;
  section: number | null;
}

export interface CompiledQuery {
  raw: string;
  terms: CompiledTerm[];
  /** ハイライト用（畳んだ文字列に対して使う。g フラグ付き） */
  highlight: RegExp | null;
}

/**
 * 送り仮名ゆるめ照合の正規表現を作る。
 *   - 入力側の送り仮名（漢字の直後のひらがな1〜2字）は「あってもなくてもよい」
 *   - 漢字が連続する箇所は、原文側にひらがな0〜2字が挟まっていてもよい
 * これで 取付け／取り付け／取付、締固め／締め固め、打継ぎ／打ち継ぎ が互いに当たる。
 * 送り仮名の違いは表記の違いであり、意味（仕様）の違いは生まない。
 */
export const buildLoosePattern = (term: string): string | null => {
  const p = foldKeepKana(term);
  const chars = Array.from(p);
  if (chars.length < 2 || !chars.some((c) => KANJI.test(c))) return null;

  const parts: string[] = [];
  let mandatory = 0;
  let loosened = false;
  let i = 0;
  while (i < chars.length) {
    const c = chars[i];
    if (!KANJI.test(c)) {
      parts.push(escapeRegExp(kanaFold(c)));
      mandatory += 1;
      i += 1;
      continue;
    }
    parts.push(escapeRegExp(c));
    mandatory += 1;
    let j = i + 1;
    while (j < chars.length && HIRAGANA.test(chars[j])) j += 1;
    const runLength = j - (i + 1);
    if (runLength >= 1 && runLength <= 2) {
      parts.push(`(?:${escapeRegExp(chars.slice(i + 1, j).join(""))})?`);
      loosened = true;
      i = j;
    } else if (runLength === 0 && j < chars.length && KANJI.test(chars[j])) {
      parts.push("[ぁ-ゖ]{0,2}");
      loosened = true;
      i = j;
    } else {
      i += 1;
    }
  }
  // 必須の文字が1字しか残らないと何にでも当たってしまうので使わない
  if (!loosened || mandatory < 2) return null;
  return parts.join("");
};

/** 表記ゆれ・現場用語の読み替えを適用した「同じ意味の語」を返す（入力語自身を先頭に含む） */
export const expandTerm = (foldedTerm: string): string[] => {
  const out = new Set<string>([foldedTerm]);
  for (const alias of TERM_ALIASES) {
    for (const fromRaw of alias.from) {
      const from = foldText(fromRaw);
      if (!from) continue;
      const applies = alias.wholeTermOnly
        ? foldedTerm === from
        : foldedTerm.includes(from);
      if (!applies) continue;
      for (const toRaw of alias.to) {
        out.add(foldedTerm.split(from).join(foldText(toRaw)));
      }
    }
  }
  // 語尾の長音の有無（スペーサー／スペーサ、セパレーター／セパレータ）
  if (foldedTerm.length >= 3 && foldedTerm.endsWith("ー")) {
    out.add(foldedTerm.slice(0, -1));
  }
  return Array.from(out).filter(Boolean);
};

const compileTerm = (raw: string): CompiledTerm | null => {
  const folded = foldText(raw);
  if (!folded) return null;

  let numberParts: string[] | null = null;
  let chapter: number | null = null;
  let section: number | null = null;

  // 5.3.2 / 5-3-2 / 5.3 （全角は foldText で半角になっている）
  const num = folded.match(/^(\d{1,2})[.\-‐－](\d{1,2})(?:[.\-‐－](\d{1,2}))?\.?$/);
  if (num) {
    numberParts = [num[1], num[2]];
    if (num[3]) numberParts.push(num[3]);
  }
  // 5章 / 第5章 / 5章3節
  const chap = folded.match(/^第?(\d{1,2})章(?:第?(\d{1,2})節)?$/);
  if (chap) {
    chapter = Number(chap[1]);
    section = chap[2] ? Number(chap[2]) : null;
  }

  const literals = expandTerm(folded);
  const loosePattern = buildLoosePattern(raw);

  return {
    raw,
    folded,
    literals,
    loose: loosePattern ? new RegExp(loosePattern) : null,
    numberParts,
    chapter,
    section,
  };
};

const compileCache = new Map<string, CompiledQuery>();

export const compileQuery = (query: unknown): CompiledQuery => {
  const raw = safeStr(query).trim();
  const cached = compileCache.get(raw);
  if (cached) return cached;

  const seen = new Set<string>();
  const terms: CompiledTerm[] = [];
  for (const piece of raw.split(/[\s\u3000,、，]+/)) {
    if (terms.length >= MAX_TERMS) break;
    const term = compileTerm(piece);
    if (!term || seen.has(term.folded)) continue;
    seen.add(term.folded);
    terms.push(term);
  }

  const patterns: string[] = [];
  for (const t of terms) {
    for (const lit of t.literals) patterns.push(escapeRegExp(lit));
    const loose = buildLoosePattern(t.raw);
    if (loose) patterns.push(loose);
  }
  // 長い候補を先に試す（「かぶり厚さ」と「かぶり」が両方あれば長い方で塗る）
  patterns.sort((a, b) => b.length - a.length);

  const compiled: CompiledQuery = {
    raw,
    terms,
    highlight: patterns.length ? new RegExp(patterns.join("|"), "g") : null,
  };
  if (compileCache.size > 200) compileCache.clear();
  compileCache.set(raw, compiled);
  return compiled;
};

/* ------------------------------------------------------------------ */
/* 検索インデックス（データは不変なので1回だけ作る）                     */
/* ------------------------------------------------------------------ */

interface IndexedDoc {
  detail: Detail;
  numberParts: string[];
  chapter: number;
  section: number;
  title: string;
  category: string;
  summary: string;
  glossaryTerms: string;
  original: string;
  commentary: string;
}

const indexCache = new WeakMap<Detail[], IndexedDoc[]>();

const buildIndex = (details: Detail[]): IndexedDoc[] =>
  details.map((detail) => {
    const c = detail?.commentary;
    const numberParts = safeStr(detail?.number).split(".");
    const commentaryText = c
      ? [
          safeStr(c.why),
          (c.points || []).join("\n"),
          (c.glossary || []).map((g) => safeStr(g.meaning)).join("\n"),
          (c.diagrams || []).map((d) => safeStr(d.caption)).join("\n"),
        ].join("\n")
      : "";
    return {
      detail,
      numberParts,
      chapter: Number(numberParts[0]) || 0,
      section: Number(numberParts[1]) || 0,
      title: foldText(detail?.title),
      category: foldText(
        `${(detail?.categoryPath || []).join("\n")}\n${(detail?.tags || []).join(
          "\n"
        )}`
      ),
      summary: foldText(c?.plainSummary),
      glossaryTerms: foldText(
        (c?.glossary || []).map((g) => safeStr(g.term)).join("\n")
      ),
      original: foldText(detail?.original),
      commentary: foldText(commentaryText),
    };
  });

const getIndex = (details: Detail[]): IndexedDoc[] => {
  let idx = indexCache.get(details);
  if (!idx) {
    idx = buildIndex(details);
    indexCache.set(details, idx);
  }
  return idx;
};

/* ------------------------------------------------------------------ */
/* スコアリング                                                         */
/* ------------------------------------------------------------------ */

const LOOSE_FACTOR = 0.5;

const countOccurrences = (haystack: string, needle: string, cap: number): number => {
  let n = 0;
  let from = 0;
  while (n < cap) {
    const i = haystack.indexOf(needle, from);
    if (i === -1) break;
    n += 1;
    from = i + needle.length;
  }
  return n;
};

/** フィールド内でのヒット強度。1=表記どおり／読み替え、LOOSE_FACTOR=送り仮名ゆるめ、0=なし */
const fieldHit = (field: string, term: CompiledTerm): number => {
  if (!field) return 0;
  for (const lit of term.literals) {
    if (field.includes(lit)) return 1;
  }
  if (term.loose && term.loose.test(field)) return LOOSE_FACTOR;
  return 0;
};

const scoreTerm = (doc: IndexedDoc, term: CompiledTerm): number => {
  // 「5章」「5章3節」は章・節の指定としてだけ解釈する（「15章」に誤って当てない）
  if (term.chapter !== null) {
    if (doc.chapter !== term.chapter) return 0;
    if (term.section !== null && doc.section !== term.section) return 0;
    return term.section !== null ? 300 : 200;
  }

  let score = 0;

  if (term.numberParts) {
    const np = term.numberParts;
    const prefixOk = np.every((p, i) => Number(doc.numberParts[i]) === Number(p));
    // 番号そのものの指定は、その条項（節）を条項順で先頭にまとめる
    if (prefixOk) return np.length === 3 ? 1000 : 500;
  }

  const title = fieldHit(doc.title, term);
  if (title > 0) {
    const exact = term.literals.some((l) => doc.title === l);
    const starts = term.literals.some((l) => doc.title.startsWith(l));
    score += (exact ? 300 : starts ? 160 : 120) * title;
  }
  score += 50 * fieldHit(doc.category, term);
  score += 45 * fieldHit(doc.glossaryTerms, term);
  score += 35 * fieldHit(doc.summary, term);

  const original = fieldHit(doc.original, term);
  if (original > 0) {
    let occurrences = 1;
    if (original === 1) {
      occurrences = Math.max(
        1,
        ...term.literals.map((l) => countOccurrences(doc.original, l, 6))
      );
    }
    score += (25 + occurrences * 3) * original;
  }
  score += 12 * fieldHit(doc.commentary, term);

  return score;
};

/** すべての語に当たった条項だけを返す（AND検索）。スコアは大きいほど関連が高い */
const scoreDoc = (doc: IndexedDoc, query: CompiledQuery): number => {
  let total = 0;
  for (const term of query.terms) {
    const s = scoreTerm(doc, term);
    if (s <= 0) return 0;
    total += s;
  }
  return total;
};

export const searchDetails = (
  details: Detail[],
  query: string,
  selectedCategories: string[],
  selectedContentFlags: string[]
): Detail[] => {
  const list = Array.isArray(details) ? details : [];
  const compiled = compileQuery(query);

  const passesFilters = (detail: Detail): boolean =>
    matchCategory(detail, selectedCategories) &&
    matchContentFlags(detail, selectedContentFlags);

  if (compiled.terms.length === 0) {
    return list.filter(passesFilters).map((d) => ({ ...d, _matchScore: 0 }));
  }

  const out: Detail[] = [];
  for (const doc of getIndex(list)) {
    if (!passesFilters(doc.detail)) continue;
    const score = scoreDoc(doc, compiled);
    if (score > 0) {
      // _matchScore は「小さいほど関連が高い」（sortDetails の既存の約束）
      out.push({ ...doc.detail, _matchScore: 1 / (1 + score) });
    }
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* 並べ替え                                                             */
/* ------------------------------------------------------------------ */

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

  // 条項順（章.節.項の番号順）
  list.sort(compareByNumber);
  return list;
};

/* ------------------------------------------------------------------ */
/* ハイライト・抜粋                                                     */
/* ------------------------------------------------------------------ */

export type HighlightPart = { text: string; hit: boolean };

/** 元の文字列上でのヒット範囲 [start, end) を返す（重なりは結合済み） */
export const findHitRanges = (
  text: string,
  query: unknown
): Array<[number, number]> => {
  const compiled = compileQuery(query);
  if (!compiled.highlight || !text) return [];

  const folded = foldWithMap(text);
  const ranges: Array<[number, number]> = [];
  const re = new RegExp(compiled.highlight.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(folded.text))) {
    if (m[0].length === 0) {
      re.lastIndex += 1;
      continue;
    }
    const start = folded.starts[m.index];
    const end = folded.ends[m.index + m[0].length - 1];
    const last = ranges[ranges.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else ranges.push([start, end]);
  }
  return ranges;
};

export const highlightText = (
  text: unknown,
  query: unknown
): HighlightPart[] | string => {
  const t = safeStr(text);
  if (!t) return t;
  const ranges = findHitRanges(t, query);
  if (ranges.length === 0) return t;

  const parts: HighlightPart[] = [];
  let pos = 0;
  for (const [start, end] of ranges) {
    if (start > pos) parts.push({ text: t.slice(pos, start), hit: false });
    parts.push({ text: t.slice(start, end), hit: true });
    pos = end;
  }
  if (pos < t.length) parts.push({ text: t.slice(pos), hit: false });
  return parts;
};

export const countHits = (text: unknown, query: unknown): number =>
  findHitRanges(safeStr(text), query).length;

export interface Snippet {
  text: string;
  /** true のとき、原文のヒット箇所の前後を抜き出したもの（「一言でいうと」ではない） */
  fromOriginal: boolean;
}

const SNIPPET_LEN = 90;
const SNIPPET_LEAD = 24;

const clip = (s: string): string =>
  s.length > SNIPPET_LEN ? `${s.slice(0, SNIPPET_LEN)}…` : s;

/**
 * カード用の抜粋。ふだんは「一言でいうと」（なければ原文冒頭）。
 * 検索語が見出し・要約に無く原文の途中にだけある場合は、その前後を見せて
 * 「なぜこの条項が出てきたのか」を一目で分かるようにする。
 */
export const makeSnippet = (detail: Detail, query: unknown): Snippet => {
  const summary = safeStr(detail?.commentary?.plainSummary);
  const original = safeStr(detail?.original);
  const base = (summary || original).replace(/\s+/g, " ").trim();
  const compiled = compileQuery(query);
  if (!compiled.highlight) return { text: clip(base), fromOriginal: false };

  const visibleHit =
    findHitRanges(clip(base), query).length > 0 ||
    findHitRanges(safeStr(detail?.title), query).length > 0;
  if (visibleHit) return { text: clip(base), fromOriginal: false };

  const ranges = findHitRanges(original, query);
  if (ranges.length === 0) return { text: clip(base), fromOriginal: false };

  const hitStart = ranges[0][0];
  const from = Math.max(0, hitStart - SNIPPET_LEAD);
  const piece = original
    .slice(from, from + SNIPPET_LEN + SNIPPET_LEAD)
    .replace(/\s+/g, " ")
    .trim();
  return {
    text: `${from > 0 ? "…" : ""}${piece}${
      from + SNIPPET_LEN + SNIPPET_LEAD < original.length ? "…" : ""
    }`,
    fromOriginal: true,
  };
};

/* ------------------------------------------------------------------ */
/* 0件のときの立て直し                                                  */
/* ------------------------------------------------------------------ */

export interface SearchRecovery {
  /** 章・コンテンツ・お気に入りの絞り込みを外したときの件数（絞り込みが無ければ null） */
  withoutFiltersCount: number | null;
  /** 複数語のとき、1語ずつ検索した場合の件数 */
  perTerm: { term: string; count: number }[];
  /** 「もしかして」候補（見出し・用語から、入力に近いもの） */
  suggestions: string[];
}

interface VocabEntry {
  label: string;
  folded: string;
}

const vocabCache = new WeakMap<Detail[], Fuse<VocabEntry>>();

const getVocabulary = (details: Detail[]): Fuse<VocabEntry> => {
  let fuse = vocabCache.get(details);
  if (fuse) return fuse;

  const seen = new Map<string, VocabEntry>();
  const add = (label: string) => {
    const clean = safeStr(label).replace(/\s+/g, " ").trim();
    const folded = foldText(clean);
    if (folded.length < 2 || folded.length > 24 || seen.has(folded)) return;
    seen.set(folded, { label: clean, folded });
  };
  for (const d of details) {
    add(d.title);
    // "3節 加工及び組立" → "加工及び組立"
    for (const name of d.categoryPath || []) add(name.replace(/^\d+[章節]\s*/, ""));
    for (const g of d.commentary?.glossary || []) add(g.term);
  }
  fuse = new Fuse(Array.from(seen.values()), {
    keys: ["folded"],
    threshold: 0.45,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });
  vocabCache.set(details, fuse);
  return fuse;
};

export const buildRecovery = (
  details: Detail[],
  query: string,
  hasFilters: boolean
): SearchRecovery => {
  const list = Array.isArray(details) ? details : [];
  const compiled = compileQuery(query);
  const count = (q: string): number => searchDetails(list, q, [], []).length;

  const withoutFiltersCount =
    hasFilters && compiled.terms.length > 0 ? count(query) : null;

  const perTerm =
    compiled.terms.length > 1
      ? compiled.terms
          .map((t) => ({ term: t.raw, count: count(t.raw) }))
          .filter((t) => t.count > 0)
      : [];

  const suggestions: string[] = [];
  if (compiled.terms.length > 0 && !withoutFiltersCount) {
    const fuse = getVocabulary(list);
    const picked = new Set<string>();
    for (const term of compiled.terms) {
      if (term.folded.length < 2) continue;
      for (const r of fuse.search(term.folded, { limit: 6 })) {
        const label = r.item.label;
        if (picked.has(label) || foldText(label) === term.folded) continue;
        if (count(label) === 0) continue;
        picked.add(label);
        suggestions.push(label);
        if (suggestions.length >= 6) break;
      }
      if (suggestions.length >= 6) break;
    }
  }

  return { withoutFiltersCount, perTerm, suggestions };
};
