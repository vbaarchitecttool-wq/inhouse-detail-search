import React from "react";

interface Props {
  selectedContentFlags: string[];
  onToggleContentFlag: (t: string) => void;
}

const ContentFilter: React.FC<Props> = ({
  selectedContentFlags,
  onToggleContentFlag,
}) => {
  const flags = [
    { value: "commentary", label: "💡 やさしい解説あり" },
    { value: "diagram", label: "🖼 図解あり" },
    // 以下の2つは、この端末に保存した自分の記録で絞り込む
    { value: "note", label: "📝 自分のメモあり" },
    { value: "unread", label: "👀 まだ読んでいない" },
  ];

  return (
    <div className="file-type-filter">
      <h3>コンテンツ</h3>
      {flags.map((flag) => (
        <label key={flag.value} className="file-type-label">
          <input
            type="checkbox"
            checked={selectedContentFlags.includes(flag.value)}
            onChange={() => onToggleContentFlag(flag.value)}
          />
          {flag.label}
        </label>
      ))}
    </div>
  );
};

export default ContentFilter;
