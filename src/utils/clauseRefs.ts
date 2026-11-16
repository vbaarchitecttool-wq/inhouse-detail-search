// 原文中の「他の条項への参照」を見つける。
//   - 条項番号:  7.2.5[溶接材料]による
//   - 章・節:    ５章２節［材料］による ／ ５章［鉄筋工事］による
//
// 原文の文字は一切変えない。参照の部分を「押せる」ようにするための位置情報だけを返す。
// 誤ったリンクは誤読につながるので、少しでも怪しいものはリンクにしない:
//   - 「表5.3.2」「図7.2.1」は表・図の番号であって条項ではない
//   - 「…木造工事標準仕様書」11.4.2 のように、他の図書を指す番号
//   - JIS 規格の箇条番号（JIS A 4722 の5.5.8e)）
//   - 番号の直後に［見出し］があるのに、参照先の見出しと一致しないもの
//   - 章・節の参照は、［見出し］が付いていて、かつ章名・節名と一致するものだけ

import { foldText } from "./normalize";
import type { Detail } from "../types";

export interface TextSegment {
  text: string;
  /** 参照なら、開く条項の番号（＝id）。章・節への参照では、その先頭の条項 */
  refId?: string;
  /** 章・節への参照のときの説明（例: "5章 鉄筋工事 › 2節 材料"） */
  refLabel?: string;
}

export interface SectionTarget {
  /** 章名または節名から「5章 」「2節 」を除いたもの */
  name: string;
  /** 表示用（例: "5章 鉄筋工事 › 2節 材料"） */
  label: string;
  /** その章・節の先頭の条項 */
  firstId: string;
}

/** "5" → 章、"5/2" → 節 */
export type SectionIndex = Map<string, SectionTarget>;

const stripPrefix = (name: string): string =>
  String(name || "").replace(/^\s*\d+\s*[章節]\s*/, "");

/** 条項一覧（条項順）から、章・節 → 先頭条項 の索引を作る */
export const buildSectionIndex = (details: Detail[]): SectionIndex => {
  const index: SectionIndex = new Map();
  for (const d of details) {
    const parts = String(d.number || "").split(".");
    const path = d.categoryPath || [];
    if (parts.length !== 3 || path.length < 2) continue;
    const chapterKey = String(Number(parts[0]));
    const sectionKey = `${chapterKey}/${Number(parts[1])}`;
    if (!index.has(chapterKey)) {
      index.set(chapterKey, {
        name: stripPrefix(path[0]),
        label: path[0],
        firstId: d.id,
      });
    }
    if (!index.has(sectionKey)) {
      index.set(sectionKey, {
        name: stripPrefix(path[1]),
        label: `${path[0]} › ${path[1]}`,
        firstId: d.id,
      });
    }
  }
  return index;
};

const REF_PATTERN = /(\d{1,2})\.(\d{1,2})\.(\d{1,2})/g;
// ５章２節［材料］ ／ 5 章［鉄筋工事］（全角・半角、間の空白を許す。［見出し］は必須）
const SECTION_PATTERN =
  /([0-9０-９]{1,2})[ \t\u3000]*章(?:[ \t\u3000]*([0-9０-９]{1,2})[ \t\u3000]*節)?[ \t\u3000]*[[［]([^\]］]{1,40})[\]］]/g;
const SPACE = /[ \t\u3000\r\n]/;
/** 番号の直前（空白を除く）がこれらなら条項参照ではない */
const BLOCKING_PREV = /[0-9０-９.．表図式」』]/;
const BRACKET = /^[ \t\u3000]*[[［]([^\]］]{1,40})[\]］]/;

interface Found {
  start: number;
  end: number;
  refId: string;
  refLabel?: string;
}

const prevVisibleChar = (text: string, start: number): string => {
  let i = start - 1;
  while (i >= 0 && SPACE.test(text[i])) i -= 1;
  return i >= 0 ? text[i] : "";
};

const findClauseRefs = (
  text: string,
  titlesById: Map<string, string>,
  selfId?: string
): Found[] => {
  const found: Found[] = [];
  const re = new RegExp(REF_PATTERN.source, "g");
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    const id = `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`;
    const start = m.index;
    const end = start + m[0].length;
    if (id === selfId || !titlesById.has(id)) continue;

    const prev = prevVisibleChar(text, start);
    if (prev && BLOCKING_PREV.test(prev)) continue;

    // 直後が数字・英字・小数点の続きなら、条項番号ではない（寸法やJISの箇条）
    const next = text[end] ?? "";
    if (/[0-9０-９a-zA-Z]/.test(next)) continue;
    if (next === "." && /[0-9]/.test(text[end + 1] ?? "")) continue;

    // JIS 等の規格番号の文脈
    if (
      /(JIS|ＪＩＳ|JAS|ISO)[^。\n]{0,24}$/.test(
        text.slice(Math.max(0, start - 30), start)
      )
    )
      continue;

    // 直後に［見出し］があれば、参照先の見出しと一致することを確認する
    const bracket = text.slice(end, end + 48).match(BRACKET);
    if (bracket) {
      const cited = foldText(bracket[1]);
      const actual = foldText(titlesById.get(id));
      if (cited !== actual) continue;
    }

    found.push({ start, end, refId: id });
  }
  return found;
};

const findSectionRefs = (
  text: string,
  sections: SectionIndex,
  selfId?: string
): Found[] => {
  const found: Found[] = [];
  const re = new RegExp(SECTION_PATTERN.source, "g");
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    const chapter = Number(m[1].normalize("NFKC"));
    const section = m[2] ? Number(m[2].normalize("NFKC")) : null;
    const key = section === null ? String(chapter) : `${chapter}/${section}`;
    const target = sections.get(key);
    if (!target || target.firstId === selfId) continue;

    // 他の図書（「…標準仕様書」５章…）や、数字の続きは対象外
    const prev = prevVisibleChar(text, m.index);
    if (prev && /[0-9０-９.．」』]/.test(prev)) continue;

    // ［見出し］が章名・節名と一致するものだけ
    if (foldText(m[3]) !== foldText(target.name)) continue;

    found.push({
      start: m.index,
      end: m.index + m[0].length,
      refId: target.firstId,
      refLabel: target.label,
    });
  }
  return found;
};

export const splitClauseRefs = (
  text: string,
  titlesById: Map<string, string>,
  selfId?: string,
  sections?: SectionIndex
): TextSegment[] => {
  if (!text) return [];

  const found = findClauseRefs(text, titlesById, selfId);
  if (sections) found.push(...findSectionRefs(text, sections, selfId));
  found.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let pos = 0;
  for (const f of found) {
    if (f.start < pos) continue; // 重なりは先に見つけた方を優先
    if (f.start > pos) segments.push({ text: text.slice(pos, f.start) });
    const seg: TextSegment = {
      text: text.slice(f.start, f.end),
      refId: f.refId,
    };
    if (f.refLabel) seg.refLabel = f.refLabel;
    segments.push(seg);
    pos = f.end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos) });
  return segments;
};
