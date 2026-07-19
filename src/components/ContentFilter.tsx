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
