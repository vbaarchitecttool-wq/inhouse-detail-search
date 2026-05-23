import React, { useMemo } from "react";
import HighlightText from "./HighlightText";
import PdfThumbnail from "./PdfThumbnail";

const DetailCard = ({
  detail,
  onClick,
  query,
  isFavorite,
  onToggleFavorite,
  isSelected,
  onToggleSelect,
  viewMode = "grid",
}) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    return bytes > 1000000
      ? `${(bytes / 1000000).toFixed(1)} MB`
      : `${(bytes / 1000).toFixed(0)} KB`;
  };

  const categoryText = useMemo(() => {
    const arr = Array.isArray(detail?.categoryPath) ? detail.categoryPath : [];
    return arr.join(" › ");
  }, [detail]);

  const fileMeta = useMemo(() => {
    const parts = [];
    if (detail?.files?.pdf?.size)
      parts.push(`PDF ${formatFileSize(detail.files.pdf.size)}`);
    if (detail?.files?.dwg?.size)
      parts.push(`DWG ${formatFileSize(detail.files.dwg.size)}`);
    if (detail?.files?.dxf?.size)
      parts.push(`DXF ${formatFileSize(detail.files.dxf.size)}`);
    return parts.join(" · ");
  }, [detail]);

  const tags = useMemo(() => {
    const t = Array.isArray(detail?.tags) ? detail.tags : [];
    return t.slice(0, 3);
  }, [detail]);

  const handleStar = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(detail.id);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onToggleSelect?.(detail.id);
  };

  const cardClass = [
    "detail-card",
    viewMode === "list" ? "detail-card-list" : "",
    isSelected ? "detail-card-selected" : "",
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
      aria-label={`${detail?.title ?? "ディティール"} を開く`}
      title={detail?.title ?? ""}
    >
      <div className="detail-card-thumbnail" aria-hidden="true">
        {detail?.files?.pdf?.path ? (
          <PdfThumbnail
            path={detail.files.pdf.path}
            cacheKey={detail.id}
            alt={`${detail.title} のサムネイル`}
          />
        ) : (
          <span className="thumb-text">PDF</span>
        )}
      </div>

      <div className="detail-card-body">
        <div className="detail-card-top">
          <h3 className="detail-card-title">
            <HighlightText text={detail.title} query={query} />
          </h3>
          <div className="detail-card-quick-actions">
            <button
              type="button"
              className={`star-btn ${isFavorite ? "is-on" : ""}`}
              onClick={handleStar}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "お気に入り解除" : "お気に入りに追加"}
              title={isFavorite ? "お気に入り解除" : "お気に入りに追加"}
            >
              {isFavorite ? "★" : "☆"}
            </button>
            <input
              type="checkbox"
              className="select-checkbox"
              checked={!!isSelected}
              onChange={handleSelect}
              onClick={(e) => e.stopPropagation()}
              aria-label="一括ダウンロード対象に追加"
              title="一括DL選択"
            />
          </div>
        </div>

        <div className="detail-card-meta">
          <p className="detail-card-category">
            <HighlightText text={categoryText} query={query} />
          </p>
          <p className="detail-card-date">
            更新：{detail.updatedAt}
            {fileMeta ? <span style={{ marginLeft: 10 }}>· {fileMeta}</span> : null}
          </p>
        </div>

        <div className="detail-card-badges">
          {detail.files?.pdf && <span className="badge badge-pdf">PDF</span>}
          {detail.files?.dwg && <span className="badge badge-dwg">DWG</span>}
          {detail.files?.dxf && <span className="badge badge-dxf">DXF</span>}
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
