import React, { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import RelatedDetails from "./RelatedDetails";
import useFocusTrap from "../hooks/useFocusTrap";
import { hasCommentary } from "../utils/search";
import type { Detail } from "../types";

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

const SOURCE_NOTE = "出典：公共建築工事標準仕様書（建築工事編）令和7年版（国土交通省）";

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
  const containerRef = useFocusTrap<HTMLDivElement>(!!detail);

  const categoryText = useMemo(() => {
    const arr = Array.isArray(detail?.categoryPath) ? detail!.categoryPath : [];
    return arr.join(" › ");
  }, [detail]);

  const tags = useMemo(() => {
    const t = Array.isArray(detail?.tags) ? detail!.tags : [];
    return t;
  }, [detail]);

  if (!detail) return null;

  const canPrev = index > 0;
  const canNext = index < total - 1;
  const commentary = detail.commentary;
  const commented = hasCommentary(detail);
  const diagrams = commentary?.diagrams || [];
  const glossary = commentary?.glossary || [];
  const points = commentary?.points || [];

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
              <span>
                <span className="spec-number spec-number-lg">
                  {detail.number}
                </span>
                {detail.title}
              </span>
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

          {commentary?.plainSummary ? (
            <div className="spec-summary-box">
              <div className="spec-summary-label">💡 一言でいうと</div>
              <p className="spec-summary-text">{commentary.plainSummary}</p>
            </div>
          ) : null}

          <section className="spec-section spec-original">
            <h3>📖 原文（標準仕様書より）</h3>
            <div className="spec-original-text">{detail.original}</div>
            <p className="spec-source-note">{SOURCE_NOTE}</p>
          </section>

          {commented ? (
            <section className="spec-section spec-commentary">
              <h3>🧑‍🏫 やさしい解説</h3>

              {commentary?.why ? (
                <div className="spec-block">
                  <h4>🤔 なぜこの規定があるの？</h4>
                  <div className="spec-block-text">{commentary.why}</div>
                </div>
              ) : null}

              {points.length > 0 ? (
                <div className="spec-block">
                  <h4>✅ 現場でのチェックポイント</h4>
                  <ul className="spec-points">
                    {points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {diagrams.length > 0 ? (
                <div className="spec-block">
                  <h4>🖼 図解</h4>
                  {diagrams.map((dg, i) => (
                    <figure key={i} className="spec-diagram">
                      <div
                        className="spec-diagram-svg"
                        // 図解SVGは自作コンテンツのみだが、多層防御としてサニタイズする
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(dg.svg, {
                            USE_PROFILES: { svg: true, svgFilters: true },
                          }),
                        }}
                      />
                      {dg.caption ? (
                        <figcaption>{dg.caption}</figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              ) : null}

              {glossary.length > 0 ? (
                <div className="spec-block">
                  <h4>📚 用語ミニ辞典</h4>
                  <dl className="spec-glossary">
                    {glossary.map((g, i) => (
                      <React.Fragment key={i}>
                        <dt>{g.term}</dt>
                        <dd>{g.meaning}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
              ) : null}

              <p className="spec-commentary-note">
                ※ この解説は理解を助けるための補足です。実務上の判断は必ず原文
                及び設計図書（特記仕様書等）によってください。
              </p>
            </section>
          ) : (
            <div className="spec-commentary-pending">
              🧑‍🏫 この条項のやさしい解説は準備中です。上の原文をご覧ください。
            </div>
          )}

          {tags.length > 0 ? (
            <div className="detail-card-tags" style={{ marginBottom: 16 }}>
              {tags.map((tag, idx) => (
                <span key={idx} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

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
