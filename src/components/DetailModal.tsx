import React, { useMemo, useState, useEffect } from "react";
import RelatedDetails from "./RelatedDetails";
import useFocusTrap from "../hooks/useFocusTrap";
import type { Detail } from "../types";

type PdfStatus = "checking" | "ok" | "missing";

interface Props {
  detail: Detail | null;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  allDetails: Detail[];
  onOpenById: (id: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  shareUrl: string;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";
  return bytes > 1000000
    ? `${(bytes / 1000000).toFixed(1)} MB`
    : `${(bytes / 1000).toFixed(0)} KB`;
};

const DetailModal: React.FC<Props> = ({
  detail,
  index,
  total,
  onPrev,
  onNext,
  onClose,
  allDetails,
  onOpenById,
  isFavorite,
  onToggleFavorite,
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>("checking");
  const containerRef = useFocusTrap<HTMLDivElement>(!!detail);

  // PDFファイルが本当に存在するか HEAD で確認
  // dev server (CRA) は 404 でも index.html を返すため、content-type で判定する
  useEffect(() => {
    const path = detail?.files?.pdf?.path;
    if (!path) {
      setPdfStatus("missing");
      return;
    }
    let cancelled = false;
    setPdfStatus("checking");
    fetch(path, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (res.ok && (ct.includes("pdf") || ct.includes("octet-stream"))) {
          setPdfStatus("ok");
        } else {
          setPdfStatus("missing");
        }
      })
      .catch(() => {
        if (!cancelled) setPdfStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [detail?.id, detail?.files?.pdf?.path]);

  const categoryText = useMemo(() => {
    const arr = Array.isArray(detail?.categoryPath) ? detail!.categoryPath : [];
    return arr.join(" › ");
  }, [detail]);

  const tags = useMemo(() => {
    const t = Array.isArray(detail?.tags) ? detail!.tags : [];
    return t;
  }, [detail]);

  if (!detail) return null;

  const hasPdf = Boolean(detail.files?.pdf?.path);
  const canPrev = index > 0;
  const canNext = index < total - 1;

  const handleCopyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("URLをコピー:", shareUrl);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
            <h2 className="modal-title" id="detail-modal-title">
              <button
                type="button"
                className={`star-btn star-btn-lg ${isFavorite ? "is-on" : ""}`}
                onClick={() => onToggleFavorite(detail.id)}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? "お気に入り解除" : "お気に入りに追加"}
                title="お気に入り (F)"
              >
                {isFavorite ? "★" : "☆"}
              </button>
              <span>{detail.title}</span>
            </h2>
            <div className="modal-cat">{categoryText}</div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="icon-button"
              onClick={handleCopyShare}
              aria-label="共有URLをコピー"
              title="共有URLをコピー"
            >
              🔗
            </button>
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
          <div className="modal-pageinfo">
            {copied ? (
              <span className="copy-toast">✓ URLをコピーしました</span>
            ) : (
              <span style={{ visibility: "hidden" }}>placeholder</span>
            )}
            <span style={{ fontSize: 12, color: "rgba(107,114,128,0.95)" }}>
              {index + 1} / {total}
            </span>
          </div>

          <div className="modal-meta-card">
            <div className="meta-grid">
              <div className="meta-key">更新日</div>
              <div>{detail.updatedAt}</div>

              <div className="meta-key">形式</div>
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

              <div className="meta-key">タグ</div>
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

          <div style={{ marginBottom: 18 }}>
            <div className="pdf-frame">
              {pdfStatus === "ok" && hasPdf ? (
                <iframe
                  title="pdf-preview"
                  src={`${detail.files.pdf!.path}#view=FitH`}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "white",
                  }}
                />
              ) : pdfStatus === "checking" ? (
                <div className="pdf-empty">
                  <span className="spinner" /> PDFを確認中…
                </div>
              ) : (
                <div className="pdf-empty pdf-missing">
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>
                    PDFが見つかりません
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                    期待パス: <code>{detail.files?.pdf?.path}</code>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                    public/files/ にファイルが配置されていません
                  </div>
                </div>
              )}
            </div>

            {pdfStatus === "ok" && hasPdf && (
              <div className="pdf-subactions">
                <a
                  href={detail.files.pdf!.path}
                  target="_blank"
                  rel="noreferrer"
                  className="link-strong"
                >
                  別タブで全画面表示
                </a>
                <span style={{ color: "rgba(107,114,128,0.95)" }}>
                  埋め込み表示が見にくい場合はこちら
                </span>
              </div>
            )}
          </div>

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

          <div className="modal-description">
            <h3>説明</h3>
            <p>{detail.description}</p>
          </div>

          <RelatedDetails
            detail={detail}
            allDetails={allDetails || []}
            onOpen={onOpenById}
          />
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
