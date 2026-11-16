import React from "react";
import type { AppView } from "../types";

interface Props {
  view: AppView;
  onChange: (view: AppView) => void;
  /** 使用中のチェックシートに入っている条項数 */
  sheetCount: number;
}

const TABS: { value: AppView; icon: string; label: string }[] = [
  { value: "search", icon: "🔍", label: "さがす" },
  { value: "sheet", icon: "📋", label: "チェックシート" },
  { value: "glossary", icon: "📚", label: "用語辞典" },
  { value: "study", icon: "🎓", label: "学習" },
];

/** 画面の切替。PC はヘッダー内、スマホは画面下端に固定する（styles.css） */
const ViewTabs: React.FC<Props> = ({ view, onChange, sheetCount }) => (
  <nav className="view-tabs" aria-label="画面の切替">
    {TABS.map((tab) => (
      <button
        key={tab.value}
        type="button"
        className={`view-tab ${view === tab.value ? "is-on" : ""}`}
        aria-current={view === tab.value ? "page" : undefined}
        onClick={() => onChange(tab.value)}
      >
        <span className="view-tab-icon" aria-hidden="true">
          {tab.icon}
        </span>
        <span className="view-tab-label">{tab.label}</span>
        {tab.value === "sheet" && sheetCount > 0 ? (
          <span className="count-pill" aria-label={`${sheetCount}条項`}>
            {sheetCount}
          </span>
        ) : null}
      </button>
    ))}
  </nav>
);

export default ViewTabs;
