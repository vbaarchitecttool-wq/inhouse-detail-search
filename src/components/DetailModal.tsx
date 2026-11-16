import React, { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import RelatedDetails from "./RelatedDetails";
import HighlightText from "./HighlightText";
import SpecText from "./SpecText";
import DiagramZoom from "./DiagramZoom";
import useFocusTrap from "../hooks/useFocusTrap";
import { hasCommentary, countHits } from "../utils/search";
import { reflowSpecText } from "../utils/text";
import { getDiagramPhoto } from "../utils/diagramPhoto";
import { buildDetailUrl } from "../utils/urlSync";
import type { SectionIndex } from "../utils/clauseRefs";
import type { Detail, Diagram } from "../types";

interface Props {
  detail: Detail | null;
  /** 検索結果の中での位置。結果に含まれない条項（参照リンクから開いた等）は -1 */
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  allDetails: Detail[];
  titlesById: Map<string, string>;
  sections?: SectionIndex;
  onOpenById: (id: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  query?: string;
}

const APP_NAME = "NA 建築工事標準仕様書";

const DiagramVisual: React.FC<{ diagram: Diagram }> = ({ diagram }) => {
  const [photoAvailable, setPhotoAvailable] = useState(true);
  const [zoom, setZoom] = useState<"photo" | "svg" | null>(null);
  const photo = useMemo(() => getDiagramPhoto(diagram.svg), [diagram.svg]);
  // 図解SVGは自作コンテンツのみだが、多層防御としてサニタイズする
  const safeSvg = useMemo(
    () =>
      DOMPurify.sanitize(diagram.svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
      }),
    [diagram.svg]
  );
  const label = diagram.caption || "図解";

  return (
    <figure className="spec-diagram">
      {photo && photoAvailable ? (
        <div className="spec-diagram-photo">
          <button
            type="button"
            className="spec-diagram-zoomable"
            onClick={() => setZoom("photo")}
            aria-label="施工イメージを拡大表示"
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              onError={() => setPhotoAvailable(false)}
            />
            <span className="spec-diagram-zoom-hint" aria-hidden="true">
              🔍 タップで拡大
            </span>
          </button>
          <span className="spec-diagram-photo-label">
            施工イメージ（AI生成）
          </span>
        </div>
      ) : null}

      <div className="spec-diagram-explainer">
        <div className="spec-diagram-explainer-title">
          <span aria-hidden="true">↳</span>
          部位・寸法・手順を図で確認
          <button
            type="button"
            className="spec-diagram-zoom-btn"
            onClick={() => setZoom("svg")}
          >
            🔍 図を拡大
          </button>
        </div>
        <div
          className="spec-diagram-svg"
          dangerouslySetInnerHTML={{ __html: safeSvg }}
        />
      </div>

      {diagram.caption ? <figcaption>{diagram.caption}</figcaption> : null}

      {zoom ? (
        <DiagramZoom label={label} onClose={() => setZoom(null)}>
          {zoom === "photo" && photo ? (
            <img className="zoom-photo" src={photo.src} alt={photo.alt} />
          ) : (
            <div
              className="zoom-svg"
              dangerouslySetInnerHTML={{ __html: safeSvg }}
            />
          )}
        </DiagramZoom>
      ) : null}
    </figure>
  );
};

const SOURCE_NOTE = "出典：公共建築工事標準仕様書（建築工事編）令和7年版（国土交通省）";

const DetailModal: React.FC<Props> = ({
  detail,
  index,
  total,
  onPrev,
  onNext,
  onClose,
  allDetails,
  titlesById,
  sections,
  onOpenById,
  isFavorite,
  onToggleFavorite,
  query,
}) => {
  const [toast, setToast] = useState<string>("");
  const containerRef = useFocusTrap<HTMLDivElement>(!!detail);
  const toastTimer = useRef<number | undefined>(undefined);
  const detailId = detail?.id;

  const categoryText = useMemo(() => {
    const arr = Array.isArray(detail?.categoryPath) ? detail!.categoryPath : [];
    return arr.join(" › ");
  }, [detail]);

  const tags = useMemo(() => {
    const t = Array.isArray(detail?.tags) ? detail!.tags : [];
    return t;
  }, [detail]);

  // PDF由来の文中改行を詰めて、原文を枠幅で自然に折り返す
  const originalText = useMemo(
    () => reflowSpecText(detail?.original || ""),
    [detail]
  );

  const originalHits = useMemo(
    () => (query ? countHits(originalText, query) : 0),
    [originalText, query]
  );

  // 条項を切り替えたら、読み始めの位置（先頭）へ戻す
  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
    setToast("");
  }, [detailId, containerRef]);

  // 印刷レイアウトの切替・背面スクロール抑止のための目印
  useEffect(() => {
    if (!detailId) return;
    const html = document.documentElement;
    html.classList.add("detail-open");
    return () => html.classList.remove("detail-open");
  }, [detailId]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  if (!detail) return null;

  const inResults = index >= 0;
  const canPrev = inResults && index > 0;
  const canNext = inResults && index < total - 1;
  const commentary = detail.commentary;
  const commented = hasCommentary(detail);
  const diagrams = commentary?.diagrams || [];
  const glossary = commentary?.glossary || [];
  const points = commentary?.points || [];
  const detailUrl = buildDetailUrl(detail.id);
  const heading = `${detail.number} ${detail.title}`;

  const showToast = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  };

  const copyLink = async () => {
    const text = `${heading}｜${APP_NAME}\n${detailUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("✓ リンクをコピーしました。チャットに貼り付けできます");
    } catch {
      window.prompt("リンクをコピー:", detailUrl);
    }
  };

  const handleShare = async () => {
    // スマホでは OS の共有シート（Teams・LINE・メール等）を直接開く
    const coarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (coarse && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${heading}｜${APP_NAME}`,
          text: heading,
          url: detailUrl,
        });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  const handlePrint = () => {
    // 画面外の写真は遅延読み込みのままだと紙に出ないことがあるので、先に読み込ませる
    containerRef.current
      ?.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')
      .forEach((img) => {
        img.loading = "eager";
      });
    window.print();
  };

  const jumpTo = (selector: string) => {
    const el = containerRef.current?.querySelector<HTMLElement>(selector);
    if (!el) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div
      className="modal-overlay detail-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="modal-content detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-heading">
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
              className="icon-button icon-button-labeled"
              onClick={handleShare}
              aria-label="この条項のリンクを共有"
              title="この条項のリンクを共有（チャットに貼れます）"
            >
              <span aria-hidden="true">🔗</span>
              <span className="icon-button-text">共有</span>
            </button>
            <button
              type="button"
              className="icon-button icon-button-labeled"
              onClick={handlePrint}
              aria-label="印刷・PDF保存"
              title="この条項を印刷・PDF保存"
            >
              <span aria-hidden="true">🖨</span>
              <span className="icon-button-text">印刷</span>
            </button>
            <button
              className="icon-button modal-nav-desktop"
              onClick={onPrev}
              disabled={!canPrev}
              aria-label="前の条項へ"
              title="前へ（←）"
            >
              ‹
            </button>
            <button
              className="icon-button modal-nav-desktop"
              onClick={onNext}
              disabled={!canNext}
              aria-label="次の条項へ"
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
          {/* 印刷時だけ出る見出し（画面では非表示） */}
          <div className="print-only print-head">
            <div className="print-head-app">{APP_NAME}</div>
            <div className="print-head-title">{heading}</div>
            <div className="print-head-cat">{categoryText}</div>
          </div>

          <div className="modal-pageinfo">
            <div className="modal-jump" role="navigation" aria-label="条項内の移動">
              <button
                type="button"
                className="jump-chip"
                onClick={() => jumpTo(".spec-original")}
              >
                📖 原文
              </button>
              {commented ? (
                <button
                  type="button"
                  className="jump-chip"
                  onClick={() => jumpTo(".spec-commentary")}
                >
                  🧑‍🏫 解説
                </button>
              ) : null}
              {diagrams.length > 0 ? (
                <button
                  type="button"
                  className="jump-chip"
                  onClick={() => jumpTo(".spec-diagram")}
                >
                  🖼 図解
                </button>
              ) : null}
              {originalHits > 0 ? (
                <button
                  type="button"
                  className="jump-chip jump-chip-hit"
                  onClick={() => jumpTo(".spec-original mark.search-hit")}
                  title="原文の最初のヒット箇所へ移動"
                >
                  🔍 「{query}」原文に{originalHits}か所
                </button>
              ) : null}
            </div>
            <span className="modal-position">
              {inResults ? `${index + 1} / ${total}` : ""}
            </span>
          </div>

          <div className="copy-toast-slot" role="status" aria-live="polite">
            {toast ? <span className="copy-toast">{toast}</span> : null}
          </div>

          {commentary?.plainSummary ? (
            <div className="spec-summary-box">
              <div className="spec-summary-label">💡 一言でいうと</div>
              <p className="spec-summary-text">
                <HighlightText text={commentary.plainSummary} query={query} />
              </p>
            </div>
          ) : null}

          <section className="spec-section spec-original">
            <h3>📖 原文（標準仕様書より）</h3>
            <div className="spec-original-text">
              <SpecText
                text={originalText}
                query={query}
                selfId={detail.id}
                titlesById={titlesById}
                sections={sections}
                onOpenRef={onOpenById}
              />
            </div>
            <p className="spec-source-note">{SOURCE_NOTE}</p>
          </section>

          {commented ? (
            <section className="spec-section spec-commentary">
              <h3>🧑‍🏫 やさしい解説</h3>

              {commentary?.why ? (
                <div className="spec-block">
                  <h4>🤔 なぜこの規定があるの？</h4>
                  <div className="spec-block-text">
                    <HighlightText text={commentary.why} query={query} />
                  </div>
                </div>
              ) : null}

              {points.length > 0 ? (
                <div className="spec-block">
                  <h4>✅ 現場でのチェックポイント</h4>
                  <ul className="spec-points">
                    {points.map((p, i) => (
                      <li key={i}>
                        <HighlightText text={p} query={query} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {diagrams.length > 0 ? (
                <div className="spec-block">
                  <h4>🖼 図解</h4>
                  {diagrams.map((dg, i) => (
                    <DiagramVisual key={`${detail.id}-${i}`} diagram={dg} />
                  ))}
                </div>
              ) : null}

              {glossary.length > 0 ? (
                <div className="spec-block">
                  <h4>📚 用語ミニ辞典</h4>
                  <dl className="spec-glossary">
                    {glossary.map((g, i) => (
                      <React.Fragment key={i}>
                        <dt>
                          <HighlightText text={g.term} query={query} />
                        </dt>
                        <dd>
                          <HighlightText text={g.meaning} query={query} />
                        </dd>
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

          {/* 印刷時だけ出るフッター（どの画面を刷ったものか後で辿れるように） */}
          <div className="print-only print-foot">
            <div>{SOURCE_NOTE}</div>
            <div>
              解説・図解は社内作成の補足です。実務上の判断は原文及び設計図書によってください。
            </div>
            <div className="print-foot-url">{detailUrl}</div>
          </div>
        </div>

        <div className="modal-footer detail-footer">
          <button
            type="button"
            className="button-secondary footer-nav"
            onClick={onPrev}
            disabled={!canPrev}
          >
            ‹ 前の条項
          </button>
          <button
            type="button"
            className="button-secondary footer-close"
            onClick={onClose}
          >
            閉じる
          </button>
          <button
            type="button"
            className="button-secondary footer-nav"
            onClick={onNext}
            disabled={!canNext}
          >
            次の条項 ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
