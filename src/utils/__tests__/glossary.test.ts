import {
  buildGlossary,
  buildQuiz,
  chapterProgress,
  filterGlossary,
  glossaryChapters,
  isWeak,
  recordAnswer,
  weakItems,
  CHOICE_COUNT,
} from "../glossary";
import indexData from "../../spec_index.json";
import commentaryMap from "../../commentary";
import type { Detail } from "../../types";

const mk = (
  id: string,
  chapter: string,
  glossary: { term: string; meaning: string }[]
): Detail => ({
  id,
  number: id,
  title: `条項${id}`,
  categoryPath: [chapter, "1節"],
  original: "",
  tags: [],
  commentary: { glossary },
});

const sample: Detail[] = [
  mk("5.1.1", "5章 鉄筋工事", [
    { term: "かぶり厚さ", meaning: "鉄筋の表面からコンクリート表面までの距離" },
    { term: "スペーサー", meaning: "かぶり厚さを保つための部品" },
  ]),
  mk("5.1.2", "5章 鉄筋工事", [
    { term: "帯筋", meaning: "柱の主筋を囲む鉄筋" },
    { term: "あばら筋", meaning: "梁の主筋を囲む鉄筋" },
    { term: "カブリ厚さ", meaning: "同じ語の別表記（重複）" },
  ]),
  mk("6.1.1", "6章 コンクリート工事", [
    { term: "スランプ", meaning: "生コンのやわらかさを表す値" },
    { term: "空の用語", meaning: "  " },
  ]),
];

// 乱数を固定して、並びを毎回同じにする
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe("用語辞典", () => {
  const items = buildGlossary(sample);

  it("全条項の用語を集める。意味が空のものは入れない", () => {
    expect(items).toHaveLength(6);
    expect(items[0]).toMatchObject({
      key: "5.1.1:かぶり厚さ",
      clauseId: "5.1.1",
      chapter: "5章 鉄筋工事",
    });
    expect(glossaryChapters(items)).toEqual(["5章 鉄筋工事", "6章 コンクリート工事"]);
  });

  it("ひらがな・カタカナのゆれを吸収してさがす。用語に当たったものが先", () => {
    const hits = filterGlossary(items, "カブリ", "");
    expect(hits.map((h) => h.term)).toEqual(["かぶり厚さ", "カブリ厚さ", "スペーサー"]);
  });

  it("章で絞り込める。条件なしなら全件", () => {
    expect(filterGlossary(items, "", "6章 コンクリート工事")).toHaveLength(1);
    expect(filterGlossary(items, "", "")).toHaveLength(6);
    expect(filterGlossary(items, "鉄筋", "6章 コンクリート工事")).toHaveLength(0);
  });
});

describe("用語クイズ", () => {
  const items = buildGlossary(sample);

  it("4択で、正解が必ず1つ入り、選択肢は重ならない", () => {
    const quiz = buildQuiz(items, items, 10, seeded());
    expect(quiz.length).toBeGreaterThan(0);
    for (const q of quiz) {
      expect(q.choices).toHaveLength(CHOICE_COUNT);
      expect(new Set(q.choices).size).toBe(CHOICE_COUNT);
      expect(q.choices[q.answerIndex]).toBe(q.item.meaning);
    }
  });

  it("同じ用語（表記ゆれ）は1回しか出さず、その用語の別の説明を誤答にしない", () => {
    const quiz = buildQuiz(items, items, 10, seeded(7));
    const kaburi = quiz.filter((q) => q.item.foldedTerm === "かぶり厚さ");
    expect(kaburi.length).toBeLessThanOrEqual(1);
    for (const q of kaburi) {
      const other = items.find(
        (it) => it.foldedTerm === q.item.foldedTerm && it.key !== q.item.key
      )!;
      expect(q.choices).not.toContain(other.meaning);
    }
  });

  it("選択肢が4つ揃わなければ出題しない", () => {
    const few = buildGlossary(sample.slice(0, 1));
    expect(buildQuiz(few, few, 10, seeded())).toEqual([]);
  });

  it("出題数の上限を守る", () => {
    expect(buildQuiz(items, items, 2, seeded())).toHaveLength(2);
  });

  it("まちがいが正解以上の用語を苦手として集める", () => {
    let stats = recordAnswer({}, "5.1.1:かぶり厚さ", false);
    expect(isWeak(stats["5.1.1:かぶり厚さ"])).toBe(true);
    expect(weakItems(items, stats).map((w) => w.term)).toEqual(["かぶり厚さ"]);

    stats = recordAnswer(stats, "5.1.1:かぶり厚さ", true);
    stats = recordAnswer(stats, "5.1.1:かぶり厚さ", true);
    expect(stats["5.1.1:かぶり厚さ"]).toEqual({ ok: 2, ng: 1 });
    expect(weakItems(items, stats)).toEqual([]);
    expect(isWeak(undefined)).toBe(false);
  });
});

describe("章ごとの進み具合", () => {
  it("章ごとに条項数と読んだ数を数える", () => {
    expect(chapterProgress(sample, new Set(["5.1.2", "9.9.9"]))).toEqual([
      { chapter: "5章 鉄筋工事", total: 2, read: 1 },
      { chapter: "6章 コンクリート工事", total: 1, read: 0 },
    ]);
  });
});

describe("実データ", () => {
  const raw = (indexData as unknown as { details: Detail[] }).details;
  const real = buildGlossary(
    raw.map((d) =>
      commentaryMap[d.id] ? { ...d, commentary: commentaryMap[d.id] } : d
    )
  );

  it("辞典のキーが重ならない（学習記録が混ざらない）", () => {
    expect(real.length).toBeGreaterThan(100);
    expect(new Set(real.map((r) => r.key)).size).toBe(real.length);
  });

  it("どの章でも10問のクイズが作れる", () => {
    for (const chapter of glossaryChapters(real)) {
      const pool = real.filter((r) => r.chapter === chapter);
      const quiz = buildQuiz(pool, real, 10, seeded(3));
      expect(quiz.length).toBeGreaterThan(0);
      for (const q of quiz) {
        expect(q.choices[q.answerIndex]).toBe(q.item.meaning);
        expect(new Set(q.choices).size).toBe(CHOICE_COUNT);
      }
    }
  });
});
