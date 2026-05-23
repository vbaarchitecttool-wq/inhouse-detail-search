import React from "react";
import type { Theme } from "../types";

interface Props {
  theme: Theme;
  onChange: (next: Theme) => void;
}

const ThemeToggle: React.FC<Props> = ({ theme, onChange }) => {
  const next: Theme =
    theme === "dark" ? "light" : theme === "light" ? "auto" : "dark";
  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🌓";
  const label =
    theme === "dark" ? "ダーク" : theme === "light" ? "ライト" : "自動";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => onChange(next)}
      title={`テーマ: ${label} (クリックで切替)`}
      aria-label={`テーマを切り替え（現在: ${label}）`}
    >
      <span className="theme-icon" aria-hidden>
        {icon}
      </span>
      <span className="theme-label">{label}</span>
    </button>
  );
};

export default ThemeToggle;
