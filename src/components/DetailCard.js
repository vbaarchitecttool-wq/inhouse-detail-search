import React, { useMemo } from "react";

const DetailCard = ({ detail, onClick }) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    return bytes > 1000000
      ? `${(bytes / 1000000).toFixed(1)} MB`
      : `${(bytes / 1000).toFixed(0)} KB`;
  };

  // ✅ 表示用メタ（Appleっぽく「控えめ・情報をまとめる」）
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

  return (
    <div
      className="detail-card"
      onClick={() => onClick(detail)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(detail);
      }}
      aria-label={`${detail?.title ?? "ディティール"} を開く`}
      title={detail?.title ?? ""}
    >
      {/* ===== Thumbnail / Icon ===== */}
      <div className="detail-card-thumbnail" aria-hidden="true">
        {/* 絵文字よりも「シンプルな記号」に寄せた方がApple寄り */}
        <span style={{ fontSize: 18, fontWeight: 900, opacity: 0.75 }}>
          PDF
        </span>
      </div>

      {/* ===== Title ===== */}
      <h3 className="detail-card-title">{detail.title}</h3>

      {/* ===== Meta (Category + Updated + File sizes) ===== */}
      <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
        <p className="detail-card-category">{categoryText}</p>

        <p className="detail-card-date" style={{ marginBottom: 0 }}>
          更新：{detail.updatedAt}
          {fileMeta ? (
            <span style={{ marginLeft: 10 }}>· {fileMeta}</span>
          ) : null}
        </p>
      </div>

      {/* ===== Badges ===== */}
      <div className="detail-card-badges">
        {detail.files?.pdf && <span className="badge badge-pdf">PDF</span>}
        {detail.files?.dwg && <span className="badge badge-dwg">DWG</span>}
        {detail.files?.dxf && <span className="badge badge-dxf">DXF</span>}
      </div>

      {/* ===== Tags ===== */}
      {tags.length > 0 && (
        <div className="detail-card-tags">
          {tags.map((tag, idx) => (
            <span key={idx} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetailCard;
