import React, { useEffect, useMemo } from "react";

const DetailModal = ({ detail, index, total, onPrev, onNext, onClose }) => {
  if (!detail) return null;

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

  const tags = useMemo(() => {
    const t = Array.isArray(detail?.tags) ? detail.tags : [];
    return t;
  }, [detail]);

  const hasPdf = Boolean(detail?.files?.pdf?.path);
  const canPrev = index > 0;
  const canNext = index < total - 1;

  // ✅ キーボード操作：Escで閉じる、←/→でスライド
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && canPrev) onPrev();
      if (e.key === "ArrowRight" && canNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, canPrev, canNext]);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "grid", gap: 4 }}>
            <h2>{detail.title}</h2>
            <div style={{ fontSize: 12, color: "rgba(107, 114, 128, 0.95)" }}>
              {categoryText}
            </div>
          </div>

          {/* ✅ 右上アクション：Prev / Next / Close */}
          <div className="modal-actions">
            <button
              className="icon-button"
              onClick={onPrev}
              disabled={!canPrev}
              aria-label="前へ"
              title="前へ（←）"
            >
              ‹
            </button>
            <button
              className="icon-button"
              onClick={onNext}
              disabled={!canNext}
              aria-label="次へ"
              title="次へ（→）"
            >
              ›
            </button>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="閉じる"
              title="閉じる（Esc）"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* 小さくページ表示（00-1〜00-3の体感） */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(107,114,128,0.95)" }}>
              {index + 1} / {total}
            </div>
          </div>

          {/* Meta Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(17,24,39,0.10)",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              boxShadow: "0 1px 0 rgba(255,255,255,0.75)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                rowGap: 10,
                columnGap: 12,
                alignItems: "start",
                fontSize: 13,
                color: "rgba(17,24,39,0.78)",
              }}
            >
              <div style={{ color: "rgba(107,114,128,0.95)", fontWeight: 800 }}>
                更新日
              </div>
              <div>{detail.updatedAt}</div>

              <div style={{ color: "rgba(107,114,128,0.95)", fontWeight: 800 }}>
                形式
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {detail.files?.pdf && (
                  <span className="badge badge-pdf">PDF</span>
                )}
                {detail.files?.dwg && (
                  <span className="badge badge-dwg">DWG</span>
                )}
                {detail.files?.dxf && (
                  <span className="badge badge-dxf">DXF</span>
                )}
              </div>

              <div style={{ color: "rgba(107,114,128,0.95)", fontWeight: 800 }}>
                タグ
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {tags.length > 0 ? (
                  tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "rgba(107,114,128,0.95)" }}>—</span>
                )}
              </div>
            </div>
          </div>

          {/* PDF Preview */}
          <div style={{ marginBottom: 18 }}>
            <div
              className="pdf-preview-placeholder"
              style={{
                height: 520,
                borderStyle: "solid",
                borderWidth: 1,
                borderColor: "rgba(17,24,39,0.10)",
                borderRadius: 16,
                overflow: "hidden",
                background: "rgba(255,255,255,0.85)",
              }}
            >
              {hasPdf ? (
                <iframe
                  title="pdf-preview"
                  src={detail.files.pdf.path}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "white",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(107,114,128,0.95)",
                    fontSize: 14,
                  }}
                >
                  PDFファイルがありません
                </div>
              )}
            </div>

            {hasPdf && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <a
                  href={detail.files.pdf.path}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "rgba(37,99,235,0.95)",
                    fontWeight: 800,
                  }}
                >
                  別タブで開く
                </a>
                <span style={{ color: "rgba(107,114,128,0.95)" }}>
                  埋め込み表示が白い場合はこちら
                </span>
              </div>
            )}
          </div>

          {/* Downloads */}
          <div className="modal-downloads">
            <h3>ファイル</h3>

            {detail.files?.pdf && (
              <a
                href={detail.files.pdf.path}
                className="download-button"
                download
              >
                PDF をダウンロード（{formatFileSize(detail.files.pdf.size)}）
              </a>
            )}

            {detail.files?.dwg && (
              <a
                href={detail.files.dwg.path}
                className="download-button"
                download
              >
                DWG をダウンロード（{formatFileSize(detail.files.dwg.size)}）
              </a>
            )}

            {detail.files?.dxf && (
              <a
                href={detail.files.dxf.path}
                className="download-button"
                download
              >
                DXF をダウンロード（{formatFileSize(detail.files.dxf.size)}）
              </a>
            )}
          </div>

          {/* Description */}
          <div className="modal-description">
            <h3>説明</h3>
            <p>{detail.description}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
