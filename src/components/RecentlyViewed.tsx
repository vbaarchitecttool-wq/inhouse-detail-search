import React, { useMemo } from "react";
import type { Detail } from "../types";

interface Props {
  allDetails: Detail[];
  recentIds: string[];
  onOpen: (id: string) => void;
  onClear: () => void;
}

const RecentlyViewed: React.FC<Props> = ({
  allDetails,
  recentIds,
  onOpen,
  onClear,
}) => {
  const items = useMemo(() => {
    const map = new Map<string, Detail>(allDetails.map((d) => [d.id, d]));
    return recentIds
      .map((id) => map.get(id))
      .filter((d): d is Detail => Boolean(d));
  }, [allDetails, recentIds]);

  if (items.length === 0) return null;

  return (
    <div className="recent-strip" aria-label="最近見た条項">
      <div className="recent-header">
        <span className="recent-title">🕘 最近見た</span>
        <button
          type="button"
          className="recent-clear"
          onClick={onClear}
          title="履歴を削除"
        >
          履歴を削除
        </button>
      </div>
      <div className="recent-list">
        {items.map((d) => (
          <button
            key={d.id}
            type="button"
            className="recent-item"
            onClick={() => onOpen(d.id)}
            title={d.title}
          >
            <span className="recent-thumb">{d.number}</span>
            <span className="recent-name">{d.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
