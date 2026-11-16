import React, { useMemo } from "react";
import HighlightText from "./HighlightText";
import { splitClauseRefs } from "../utils/clauseRefs";
import type { SectionIndex } from "../utils/clauseRefs";

interface Props {
  /** 原文（整形済み）。文字は一切変えずに表示する */
  text: string;
  query?: string;
  selfId: string;
  titlesById: Map<string, string>;
  /** 章・節への参照（５章２節［材料］）をリンクにするための索引 */
  sections?: SectionIndex;
  onOpenRef: (id: string) => void;
}

/**
 * 原文の表示。文字はそのまま、次の2つだけを重ねる:
 *   - 検索語のハイライト
 *   - 「7.2.5[溶接材料]による」「５章２節［材料］による」のような他条項・章節への
 *     参照を、押せるリンクにする
 */
const SpecText: React.FC<Props> = ({
  text,
  query,
  selfId,
  titlesById,
  sections,
  onOpenRef,
}) => {
  const segments = useMemo(
    () => splitClauseRefs(text, titlesById, selfId, sections),
    [text, titlesById, selfId, sections]
  );

  const describe = (refId: string, refLabel?: string): string => {
    const target = `${refId} ${titlesById.get(refId) ?? ""}`;
    // 章・節への参照は、その先頭の条項を開く（そこから「同じ節の条項」で全体をたどれる）
    return refLabel
      ? `${refLabel} の先頭の条項（${target}）を開く`
      : `${target} を開く`;
  };

  return (
    <>
      {segments.map((seg, i) =>
        seg.refId ? (
          <button
            key={i}
            type="button"
            className="spec-ref"
            onClick={() => onOpenRef(seg.refId as string)}
            title={describe(seg.refId, seg.refLabel)}
            aria-label={describe(seg.refId, seg.refLabel)}
          >
            {seg.text}
          </button>
        ) : (
          <HighlightText key={i} text={seg.text} query={query} />
        )
      )}
    </>
  );
};

export default SpecText;
