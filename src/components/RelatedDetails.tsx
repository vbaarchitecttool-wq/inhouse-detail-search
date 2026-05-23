import React, { useMemo } from "react";
import type { Detail } from "../types";

interface Props {
  detail: Detail;
  allDetails: Detail[];
  onOpen: (id: string) => void;
}

const RelatedDetails: React.FC<Props> = ({ detail, allDetails, onOpen }) => {
  const items = useMemo(() => {
    const ids = Array.isArray(detail?.relatedIds) ? detail.relatedIds : [];
    if (ids.length === 0) return [];
    const map = new Map<string, Detail>(allDetails.map((d) => [d.id, d]));
    return ids
      .map((id) => map.get(id))
      .filter((d): d is Detail => Boolean(d));
  }, [detail, allDetails]);

  if (items.length === 0) return null;

  return (
    <div className="related-section">
      <h3>関連するディティール</h3>
      <div className="related-list">
        {items.map((d) => (
          <button
            key={d.id}
            type="button"
            className="related-item"
            onClick={() => onOpen(d.id)}
            title={d.title}
          >
            <span className="related-thumb">PDF</span>
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
  );
};

export default RelatedDetails;
