// 用語辞典と用語クイズ。
//
// 各条項の解説にある「用語ミニ辞典」を全章ぶん集めて、1冊の辞典として引けるようにする。
// クイズの問題・選択肢もここから作る（新しい文章は足さない。出どころは必ず条項の解説）。

import { foldText } from "./normalize";
import type { Detail, QuizStat } from "../types";

export interface GlossaryItem {
  /** 学習記録のキー（条項ID＋用語） */
  key: string;
  term: string;
  meaning: string;
  clauseId: string;
  clauseNumber: string;
  clauseTitle: string;
  /** 章名（例: "5章 鉄筋工事"） */
  chapter: string;
  /** 検索用に畳んだ「用語＋意味」 */
  folded: string;
  foldedTerm: string;
}

export const buildGlossary = (details: Detail[]): GlossaryItem[] => {
  const out: GlossaryItem[] = [];
  for (const d of details) {
    for (const g of d.commentary?.glossary ?? []) {
      const term = (g.term || "").trim();
      const meaning = (g.meaning || "").trim();
      if (!term || !meaning) continue;
      out.push({
        key: `${d.id}:${term}`,
        term,
        meaning,
        clauseId: d.id,
        clauseNumber: d.number,
        clauseTitle: d.title,
        chapter: d.categoryPath?.[0] ?? "",
        folded: foldText(`${term} ${meaning}`),
        foldedTerm: foldText(term),
      });
    }
  }
  return out;
};

/** 用語に当たったものを先、意味だけに当たったものを後に並べる */
export const filterGlossary = (
  items: GlossaryItem[],
  query: string,
  chapter: string
): GlossaryItem[] => {
  const terms = query
    .split(/[\s　]+/)
    .map((t) => foldText(t))
    .filter(Boolean);
  const pool = chapter ? items.filter((it) => it.chapter === chapter) : items;
  if (terms.length === 0) return pool;
  const hits = pool.filter((it) => terms.every((t) => it.folded.includes(t)));
  const inTerm = (it: GlossaryItem) =>
    terms.every((t) => it.foldedTerm.includes(t)) ? 0 : 1;
  return [...hits].sort((a, b) => inTerm(a) - inTerm(b));
};

export const glossaryChapters = (items: GlossaryItem[]): string[] =>
  Array.from(new Set(items.map((it) => it.chapter).filter(Boolean)));

/* ------------------------------------------------------------------ */
/* クイズ                                                               */
/* ------------------------------------------------------------------ */

export interface QuizQuestion {
  item: GlossaryItem;
  /** 選択肢（意味の文章）。正解を含む */
  choices: string[];
  answerIndex: number;
}

export type Rng = () => number;

export const shuffle = <T,>(list: T[], rng: Rng = Math.random): T[] => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** まちがいが正解より多い用語＝苦手 */
export const isWeak = (stat?: QuizStat): boolean =>
  !!stat && stat.ng > 0 && stat.ng >= stat.ok;

export const weakItems = (
  items: GlossaryItem[],
  stats: Record<string, QuizStat>
): GlossaryItem[] => items.filter((it) => isWeak(stats[it.key]));

export const CHOICE_COUNT = 4;

/**
 * 出題を作る。
 *   - 同じ用語は1回だけ出す（別の条項で同じ語が解説されていることがある）
 *   - まちがいの選択肢は、なるべく同じ章から選ぶ（章が違うと消去法で当たってしまうため）
 *   - 選択肢が4つ揃わない用語は出さない
 */
export const buildQuiz = (
  pool: GlossaryItem[],
  all: GlossaryItem[],
  count: number,
  rng: Rng = Math.random
): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  const asked = new Set<string>();
  for (const item of shuffle(pool, rng)) {
    if (questions.length >= count) break;
    if (asked.has(item.foldedTerm)) continue;

    const usedMeanings = new Set<string>([item.meaning]);
    const usedTerms = new Set<string>([item.foldedTerm]);
    const wrong: string[] = [];
    const take = (candidates: GlossaryItem[]) => {
      for (const c of shuffle(candidates, rng)) {
        if (wrong.length >= CHOICE_COUNT - 1) return;
        if (usedTerms.has(c.foldedTerm) || usedMeanings.has(c.meaning)) continue;
        usedTerms.add(c.foldedTerm);
        usedMeanings.add(c.meaning);
        wrong.push(c.meaning);
      }
    };
    take(all.filter((c) => c.chapter === item.chapter));
    take(all);
    if (wrong.length < CHOICE_COUNT - 1) continue;

    const choices = shuffle([item.meaning, ...wrong], rng);
    asked.add(item.foldedTerm);
    questions.push({ item, choices, answerIndex: choices.indexOf(item.meaning) });
  }
  return questions;
};

export const recordAnswer = (
  stats: Record<string, QuizStat>,
  key: string,
  correct: boolean
): Record<string, QuizStat> => {
  const cur = stats[key] ?? { ok: 0, ng: 0 };
  return {
    ...stats,
    [key]: correct ? { ...cur, ok: cur.ok + 1 } : { ...cur, ng: cur.ng + 1 },
  };
};

/* ------------------------------------------------------------------ */
/* 章ごとの読んだ数                                                     */
/* ------------------------------------------------------------------ */

export interface ChapterProgress {
  chapter: string;
  total: number;
  read: number;
}

export const chapterProgress = (
  details: Detail[],
  readIds: Set<string>
): ChapterProgress[] => {
  const map = new Map<string, ChapterProgress>();
  for (const d of details) {
    const chapter = d.categoryPath?.[0] ?? "";
    if (!chapter) continue;
    let row = map.get(chapter);
    if (!row) {
      row = { chapter, total: 0, read: 0 };
      map.set(chapter, row);
    }
    row.total++;
    if (readIds.has(d.id)) row.read++;
  }
  return Array.from(map.values());
};
