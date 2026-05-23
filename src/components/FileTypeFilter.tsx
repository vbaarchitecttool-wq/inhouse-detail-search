import React from "react";

interface Props {
  selectedFileTypes: string[];
  onToggleFileType: (t: string) => void;
}

const FileTypeFilter: React.FC<Props> = ({
  selectedFileTypes,
  onToggleFileType,
}) => {
  const fileTypes = [
    { value: "pdf", label: "PDF" },
    { value: "dwg", label: "DWG" },
    { value: "dxf", label: "DXF" },
  ];

  return (
    <div className="file-type-filter">
      <h3>ファイル種別</h3>
      {fileTypes.map((type) => (
        <label key={type.value} className="file-type-label">
          <input
            type="checkbox"
            checked={selectedFileTypes.includes(type.value)}
            onChange={() => onToggleFileType(type.value)}
          />
          {type.label}
        </label>
      ))}
    </div>
  );
};

export default FileTypeFilter;
