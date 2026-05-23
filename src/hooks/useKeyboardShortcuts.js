// src/hooks/useKeyboardShortcuts.js
import { useEffect } from "react";

// グローバルなキーボードショートカットを束ねる
// handlers: { onFocusSearch, onOpenHelp, onCloseModal, onPrev, onNext, onToggleFavorite, isModalOpen }
export default function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Cmd/Ctrl + K → 検索フォーカス（入力中でも有効）
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handlers.onFocusSearch?.();
        return;
      }

      if (isTyping) return;

      // モーダル中
      if (handlers.isModalOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          handlers.onCloseModal?.();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlers.onPrev?.();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handlers.onNext?.();
        } else if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          handlers.onToggleFavorite?.();
        }
        return;
      }

      // モーダル外
      if (e.key === "/") {
        e.preventDefault();
        handlers.onFocusSearch?.();
      } else if (e.key === "?") {
        e.preventDefault();
        handlers.onOpenHelp?.();
      } else if (e.key === "Escape") {
        handlers.onCloseHelp?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers]);
}
