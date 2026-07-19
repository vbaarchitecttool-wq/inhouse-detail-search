import React, { useMemo } from "react";
import HighlightText from "./HighlightText";
import { hasCommentary, hasDiagram } from "../utils/search";
import type { Detail, ViewMode } from "../types";

interface Props {
  detail: Detail;
  onClick: (d: Detail) => void;
  query?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  viewMode?: ViewMode;
}

const SNIPPET_LEN = 90;

const DetailCard: React.FC<Props> = ({
  detail,
  onClick,
  query,
  isFavorite,
  onToggleFavorite,
  viewMode = "grid",
}) => {
  const categoryText = useMemo(() => {
    const arr = Array.isArray(detail?.categoryPath) ? detail.categoryPath : [];
    return arr.join(" › ");
  }, [detail]);

  const snippet = useMemo(() => {
    const summary = detail?.commentary?.plainSummary || "";
    const src = summary || detail?.original || "";
    const oneLine = src.replace(/\s+/g, " ").trim();
    return oneLine.length > SNIPPET_LEN
      ? `${oneLine.slice(0, SNIPPET_LEN)}…`
      : oneLine;
  }, [detail]);

  const commented = hasCommentary(detail);
  const diagrammed = hasDiagram(detail);

  const tags = useMemo(() => {
    const t = Array.isArray(detail?.tags) ? detail.tags : [];
    return t.slice(0, 3);
  }, [detail]);

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(detail.id);
  };

  const cardClass = [
    "detail-card",
    viewMode === "list" ? "detail-card-list" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClass}
      onClick={() => onClick(detail)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(detail);
        }
      }}
      aria-label={`${detail?.number ?? ""} ${detail?.title ?? "条項"} を開く`}
      title={`${detail?.number ?? ""} ${detail?.title ?? ""}`}
    >
      <div className="detail-card-body">
        <div className="detail-card-top">
          <h3 className="detail-card-title">
            <span className="spec-number">
              <HighlightText text={detail.number} query={query} />
            </span>
            <HighlightText text={detail.title} query={query} />
          </h3>
          <div className="detail-card-quick-actions">
            <button
              type="button"
              className={`star-btn ${isFavorite ? "is-on" : ""}`}
              onClick={handleStar}
              aria-pressed={!!isFavorite}
              aria-label={isFavorite ? "お気に入り解除" : "お気に入りに追加"}
              title={isFavorite ? "お気に入り解除" : "お気に入りに追加"}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          </div>
        </div>

        <div className="detail-card-meta">
          <p className="detail-card-category">
            <HighlightText text={categoryText} query={query} />
          </p>
        </div>

        {snippet ? (
          <p className="detail-card-snippet">
            <HighlightText text={snippet} query={query} />
          </p>
        ) : null}

        <div className="detail-card-badges">
          {commented && <span className="badge badge-commentary">💡 解説</span>}
          {diagrammed && <span className="badge badge-diagram">🖼 図解</span>}
        </div>

        {tags.length > 0 && (
          <div className="detail-card-tags">
            {tags.map((tag, idx) => (
              <span key={idx} className="tag">
                #<HighlightText text={tag} query={query} />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailCard;
