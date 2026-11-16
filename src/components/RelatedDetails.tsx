import React, { useMemo } from "react";
import type { Detail } from "../types";

interface Props {
  detail: Detail;
  allDetails: Detail[];
  onOpen: (id: string) => void;
}

const sameSection = (a: Detail, b: Detail): boolean => {
  const pa = a.categoryPath || [];
  const pb = b.categoryPath || [];
  return pa.length > 0 && pa.length === pb.length && pa.every((v, i) => v === pb[i]);
};

/**
 * 条項の下に出す「次に見る先」。
 *   1. データで明示された関連条項（relatedIds）
 *   2. 同じ節の条項一覧（仕様書の目次どおりの並び）
 *
 * ここは「仕様書の構成上となり合う条項」を並べるだけで、内容が似ている・
 * 代わりに使える、という意味は持たせない（区画壁と一般の間仕切壁のように、
 * 似て見えても別仕様のものを機械的に結び付けないため）。
 */
const RelatedDetails: React.FC<Props> = ({ detail, allDetails, onOpen }) => {
  const related = useMemo(() => {
    const ids = Array.isArray(detail?.relatedIds) ? detail.relatedIds : [];
    if (ids.length === 0) return [];
    const map = new Map<string, Detail>(allDetails.map((d) => [d.id, d]));
    return ids
      .map((id) => map.get(id))
      .filter((d): d is Detail => Boolean(d));
  }, [detail, allDetails]);

  const siblings = useMemo(
    () => allDetails.filter((d) => sameSection(d, detail)),
    [detail, allDetails]
  );

  const sectionName = (detail.categoryPath || []).slice(-1)[0] || "";

  if (related.length === 0 && siblings.length <= 1) return null;

  return (
    <>
      {related.length > 0 ? (
        <div className="related-section">
          <h3>関連する条項</h3>
          <div className="related-list">
            {related.map((d) => (
              <button
                key={d.id}
                type="button"
                className="related-item"
                onClick={() => onOpen(d.id)}
                title={d.title}
              >
                <span className="related-thumb">{d.number}</span>
                <div className="related-meta">
                  <div className="related-title">{d.title}</div>
                  <div className="related-cat">
                    {(d.categoryPath || []).join(" › ")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {siblings.length > 1 ? (
        <nav className="related-section" aria-label="同じ節の条項">
          <h3>
            同じ節の条項
            <span className="related-section-sub">
              {sectionName}（{siblings.length}項）
            </span>
          </h3>
          <ol className="section-toc">
            {siblings.map((d) => {
              const current = d.id === detail.id;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    className={`section-toc-item ${current ? "is-current" : ""}`}
                    onClick={() => onOpen(d.id)}
                    aria-current={current ? "true" : undefined}
                    disabled={current}
                  >
                    <span className="spec-number">{d.number}</span>
                    <span className="section-toc-title">{d.title}</span>
                    {current ? (
                      <span className="section-toc-now">表示中</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
    </>
  );
};

export default RelatedDetails;
