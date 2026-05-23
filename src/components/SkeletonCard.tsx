import React from "react";
import type { ViewMode } from "../types";

interface Props {
  viewMode?: ViewMode;
}

const SkeletonCard: React.FC<Props> = ({ viewMode = "grid" }) => (
  <div
    className={`detail-card skeleton-card ${
      viewMode === "list" ? "detail-card-list" : ""
    }`}
    aria-hidden="true"
  >
    <div className="detail-card-thumbnail skeleton-thumb" />
    <div className="detail-card-body">
      <div className="skeleton-bar skeleton-bar-title" />
      <div className="skeleton-bar skeleton-bar-meta" />
      <div className="skeleton-bar skeleton-bar-meta short" />
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
      </div>
    </div>
  </div>
);

interface GridProps {
  count?: number;
  viewMode?: ViewMode;
}

export const SkeletonGrid: React.FC<GridProps> = ({
  count = 6,
  viewMode = "grid",
}) => (
  <div
    className={viewMode === "list" ? "results-list" : "results-grid"}
    aria-busy="true"
    aria-label="読み込み中"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} viewMode={viewMode} />
    ))}
  </div>
);

export default SkeletonCard;
