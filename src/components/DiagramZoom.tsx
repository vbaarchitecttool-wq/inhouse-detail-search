import React, { useEffect, useRef, useState } from "react";

interface Props {
  /** 拡大表示する中身の説明（スクリーンリーダー用） */
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}

const STEPS = [1, 1.5, 2, 3];

/**
 * 図解・写真の拡大表示。
 * 現場のスマホでも寸法の数字が読めるよう、画面いっぱいに広げて 1〜3倍に拡大できる。
 * 拡大中は指（またはスクロール）で上下左右に動かせる。
 */
const DiagramZoom: React.FC<Props> = ({ label, onClose, children }) => {
  const [step, setStep] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    // 条項モーダルより先に Esc / 矢印キーを受け取り、背後のモーダルまで閉じないようにする
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        // フォーカスを拡大表示の中に閉じ込める
        const buttons = Array.from(
          overlayRef.current?.querySelectorAll<HTMLButtonElement>(
            "button:not([disabled])"
          ) ?? []
        );
        if (buttons.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        const cur = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.shiftKey
          ? (cur <= 0 ? buttons.length : cur) - 1
          : (cur + 1) % buttons.length;
        buttons[next].focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.stopPropagation();
      } else if (e.key === "+" || e.key === "=") {
        e.stopPropagation();
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
      } else if (e.key === "-") {
        e.stopPropagation();
        setStep((s) => Math.max(0, s - 1));
      } else if (e.key === "f" || e.key === "F") {
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [onClose]);

  const scale = STEPS[step];

  return (
    <div
      ref={overlayRef}
      className="zoom-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`拡大表示：${label}`}
      onClick={onClose}
    >
      <div className="zoom-toolbar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="zoom-btn"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          aria-label="縮小"
          title="縮小（-）"
        >
          −
        </button>
        <span className="zoom-scale" aria-live="polite">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          className="zoom-btn"
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
          aria-label="拡大"
          title="拡大（+）"
        >
          ＋
        </button>
        <button
          ref={closeRef}
          type="button"
          className="zoom-btn zoom-close"
          onClick={onClose}
          aria-label="拡大表示を閉じる"
          title="閉じる（Esc）"
        >
          ✕ 閉じる
        </button>
      </div>
      <div className="zoom-stage" onClick={(e) => e.stopPropagation()}>
        <div className="zoom-canvas" style={{ width: `${scale * 100}%` }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DiagramZoom;
