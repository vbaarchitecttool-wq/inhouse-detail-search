import React, { useMemo, useState } from "react";
import HighlightText from "./HighlightText";
import {
  filterGlossary,
  glossaryChapters,
  GlossaryItem,
} from "../utils/glossary";

interface Props {
  items: GlossaryItem[];
  onOpenClause: (id: string) => void;
}

const PAGE = 80;

/** 全章の「用語ミニ辞典」を1冊にまとめた辞典 */
const GlossaryView: React.FC<Props> = ({ items, onOpenClause }) => {
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const chapters = useMemo(() => glossaryChapters(items), [items]);
  const hits = useMemo(
    () => filterGlossary(items, query, chapter),
    [items, query, chapter]
  );
  const shown = hits.slice(0, limit);

  return (
    <div className="glossary-view">
      <div className="view-head">
        <h2 className="view-title">📚 用語辞典</h2>
        <span className="view-count" role="status">
          {hits.length} / {items.length} 語
        </span>
      </div>

      <div className="glossary-tools">
        <input
          type="search"
          className="sheet-input glossary-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="用語をさがす（例：かぶり、スランプ、養生）"
          aria-label="用語をさがす"
        />
        <label className="sr-only" htmlFor="glossary-chapter">
          章で絞り込む
        </label>
        <select
          id="glossary-chapter"
          className="sheet-input"
          value={chapter}
          onChange={(e) => {
            setChapter(e.target.value);
            setLimit(PAGE);
          }}
        >
          <option value="">すべての章</option>
          {chapters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {shown.length > 0 ? (
        <dl className="glossary-list">
          {shown.map((it) => (
            <div key={it.key} className="glossary-entry">
              <dt>
                <HighlightText text={it.term} query={query} />
              </dt>
              <dd>
                <p>
                  <HighlightText text={it.meaning} query={query} />
                </p>
                <button
                  type="button"
                  className="glossary-source"
                  onClick={() => onOpenClause(it.clauseId)}
                  title="この用語が出てくる条項を開く"
                >
                  <span className="spec-number">{it.clauseNumber}</span>
                  {it.clauseTitle}
                  <span aria-hidden="true"> ›</span>
                </button>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="view-empty">
          <p className="view-empty-lead">
            「{query}」に当たる用語は辞典にありません。「さがす」で原文と解説の全文を検索できます。
          </p>
        </div>
      )}

      {hits.length > limit ? (
        <div className="load-more">
          <button
            type="button"
            className="load-more-btn"
            onClick={() => setLimit((n) => n + 200)}
          >
            残り{hits.length - limit}語を表示
          </button>
        </div>
      ) : null}

      <p className="view-note">
        用語の説明は、各条項のやさしい解説（社内作成の補足）から集めたものです。正確な定義は原文によってください。
      </p>
    </div>
  );
};

export default GlossaryView;
