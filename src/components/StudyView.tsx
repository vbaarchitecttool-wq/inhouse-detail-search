import React, { useMemo, useRef, useState } from "react";
import {
  buildQuiz,
  chapterProgress,
  glossaryChapters,
  weakItems,
  GlossaryItem,
  QuizQuestion,
} from "../utils/glossary";
import type { Detail, QuizStat } from "../types";

interface Props {
  allDetails: Detail[];
  glossary: GlossaryItem[];
  readIds: Set<string>;
  quizStats: Record<string, QuizStat>;
  onAnswer: (key: string, correct: boolean) => void;
  onOpenClause: (id: string) => void;
  /** 章の「まだ読んでいない条項」を「さがす」で開く */
  onShowUnread: (chapter: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const QUIZ_LENGTH = 10;
const WEAK = "__weak__";

interface Session {
  questions: QuizQuestion[];
  index: number;
  /** いまの問題で選んだ選択肢（未回答は null） */
  picked: number | null;
  wrong: GlossaryItem[];
  correct: number;
}

const StudyView: React.FC<Props> = ({
  allDetails,
  glossary,
  readIds,
  quizStats,
  onAnswer,
  onOpenClause,
  onShowUnread,
  onExport,
  onImport,
}) => {
  const [scope, setScope] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const chapters = useMemo(() => glossaryChapters(glossary), [glossary]);
  const weak = useMemo(
    () => weakItems(glossary, quizStats),
    [glossary, quizStats]
  );
  const progress = useMemo(
    () => chapterProgress(allDetails, readIds),
    [allDetails, readIds]
  );

  const readTotal = progress.reduce((n, p) => n + p.read, 0);
  const answered = Object.values(quizStats).reduce(
    (acc, s) => ({ ok: acc.ok + s.ok, ng: acc.ng + s.ng }),
    { ok: 0, ng: 0 }
  );
  const learned = Object.values(quizStats).filter((s) => s.ok > 0).length;

  const start = (pool: GlossaryItem[]) => {
    const questions = buildQuiz(pool, glossary, QUIZ_LENGTH);
    if (questions.length === 0) return;
    setSession({ questions, index: 0, picked: null, wrong: [], correct: 0 });
  };

  const startScoped = () => {
    if (scope === WEAK) start(weak);
    else start(scope ? glossary.filter((g) => g.chapter === scope) : glossary);
  };

  const pick = (choice: number) => {
    if (!session || session.picked !== null) return;
    const q = session.questions[session.index];
    const ok = choice === q.answerIndex;
    onAnswer(q.item.key, ok);
    setSession({
      ...session,
      picked: choice,
      correct: session.correct + (ok ? 1 : 0),
      wrong: ok ? session.wrong : [...session.wrong, q.item],
    });
  };

  const next = () => {
    if (!session) return;
    setSession({ ...session, index: session.index + 1, picked: null });
  };

  const finished = !!session && session.index >= session.questions.length;
  const current =
    session && !finished ? session.questions[session.index] : null;

  return (
    <div className="study-view">
      <div className="view-head">
        <h2 className="view-title">🎓 学習</h2>
      </div>

      <div className="study-stats">
        <div className="study-stat">
          <span className="study-stat-num">
            {readTotal}
            <small> / {allDetails.length}</small>
          </span>
          <span className="study-stat-label">読んだ条項</span>
        </div>
        <div className="study-stat">
          <span className="study-stat-num">
            {learned}
            <small> / {glossary.length}</small>
          </span>
          <span className="study-stat-label">クイズで正解した用語</span>
        </div>
        <div className="study-stat">
          <span className="study-stat-num">{weak.length}</span>
          <span className="study-stat-label">苦手な用語</span>
        </div>
      </div>

      <section className="study-card" aria-label="用語クイズ">
        <h3>用語クイズ</h3>

        {!session ? (
          <>
            <p className="study-lead">
              仕様書に出てくる用語の意味を4択で確かめます。1回{QUIZ_LENGTH}
              問。まちがえた用語は「苦手」に入り、あとでまとめて復習できます。
            </p>
            <div className="study-start">
              <label className="sr-only" htmlFor="quiz-scope">
                出題範囲
              </label>
              <select
                id="quiz-scope"
                className="sheet-input"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="">すべての章から</option>
                {weak.length > 0 ? (
                  <option value={WEAK}>苦手な用語だけ（{weak.length}語）</option>
                ) : null}
                {chapters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="recovery-primary"
                onClick={startScoped}
              >
                クイズを始める
              </button>
            </div>
            {answered.ok + answered.ng > 0 ? (
              <p className="study-sub">
                これまでの回答：{answered.ok + answered.ng}問（正解{" "}
                {answered.ok}問）
              </p>
            ) : null}
          </>
        ) : current ? (
          <div className="quiz">
            <div className="quiz-count">
              {session.index + 1} / {session.questions.length} 問目
            </div>
            <p className="quiz-question">
              「<strong>{current.item.term}</strong>」の意味は？
            </p>
            <div className="quiz-choices">
              {current.choices.map((choice, i) => {
                const answeredNow = session.picked !== null;
                const cls = !answeredNow
                  ? ""
                  : i === current.answerIndex
                  ? "is-correct"
                  : i === session.picked
                  ? "is-wrong"
                  : "is-dim";
                return (
                  <button
                    key={i}
                    type="button"
                    className={`quiz-choice ${cls}`}
                    onClick={() => pick(i)}
                    disabled={answeredNow}
                  >
                    <span className="quiz-choice-mark" aria-hidden="true">
                      {answeredNow && i === current.answerIndex
                        ? "◯"
                        : answeredNow && i === session.picked
                        ? "×"
                        : String.fromCharCode(65 + i)}
                    </span>
                    <span>{choice}</span>
                  </button>
                );
              })}
            </div>
            {session.picked !== null ? (
              <div className="quiz-feedback" role="status">
                <p
                  className={
                    session.picked === current.answerIndex
                      ? "quiz-result-ok"
                      : "quiz-result-ng"
                  }
                >
                  {session.picked === current.answerIndex
                    ? "◯ 正解です"
                    : "× ちがいます。正解は ◯ の付いた説明です"}
                </p>
                <div className="quiz-feedback-actions">
                  <button
                    type="button"
                    className="sheet-btn"
                    onClick={() => onOpenClause(current.item.clauseId)}
                  >
                    {current.item.clauseNumber} {current.item.clauseTitle}{" "}
                    を読む
                  </button>
                  <button
                    type="button"
                    className="recovery-primary"
                    onClick={next}
                  >
                    {session.index + 1 < session.questions.length
                      ? "次の問題へ"
                      : "結果を見る"}
                  </button>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className="study-quit"
              onClick={() => setSession(null)}
            >
              クイズをやめる
            </button>
          </div>
        ) : (
          <div className="quiz">
            <p className="quiz-score">
              {session.questions.length}問中{" "}
              <strong>{session.correct}</strong>問 正解
            </p>
            {session.wrong.length > 0 ? (
              <>
                <p className="study-sub">まちがえた用語（押すと条項を開きます）</p>
                <ul className="quiz-wrong">
                  {session.wrong.map((it) => (
                    <li key={it.key}>
                      <button
                        type="button"
                        className="glossary-source"
                        onClick={() => onOpenClause(it.clauseId)}
                      >
                        <strong>{it.term}</strong>
                        <span className="spec-number">{it.clauseNumber}</span>
                        {it.clauseTitle}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="study-sub">全問正解です。</p>
            )}
            <div className="quiz-feedback-actions">
              <button
                type="button"
                className="recovery-primary"
                onClick={startScoped}
              >
                もう一度
              </button>
              <button
                type="button"
                className="sheet-btn"
                onClick={() => setSession(null)}
              >
                終わる
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="study-card" aria-label="章ごとの進み具合">
        <h3>章ごとの進み具合</h3>
        <p className="study-lead">
          一度開いた条項を「読んだ」と数えます。章を押すと、まだ読んでいない条項だけを一覧にします。
        </p>
        <ul className="chapter-progress">
          {progress.map((p) => (
            <li key={p.chapter}>
              <button
                type="button"
                className="chapter-progress-row"
                onClick={() => onShowUnread(p.chapter)}
                title={`${p.chapter} のまだ読んでいない条項を見る`}
              >
                <span className="chapter-progress-name">{p.chapter}</span>
                <span className="progress-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${p.total ? (p.read / p.total) * 100 : 0}%`,
                    }}
                  />
                </span>
                <span className="chapter-progress-num">
                  {p.read} / {p.total}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="study-card" aria-label="データの引っ越し">
        <h3>自分のデータを持ち出す</h3>
        <p className="study-lead">
          お気に入り・メモ・チェックシート・学習の記録は、この端末のブラウザの中だけにあります。
          ファイルに書き出しておくと、機種変更やPCの入替えのあとも続きから使えます。
        </p>
        <div className="quiz-feedback-actions">
          <button type="button" className="sheet-btn" onClick={onExport}>
            ⬇ ファイルに書き出す
          </button>
          <button
            type="button"
            className="sheet-btn"
            onClick={() => fileRef.current?.click()}
          >
            ⬆ ファイルから読み込む
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = "";
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default StudyView;
