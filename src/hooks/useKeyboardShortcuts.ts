import { useEffect } from "react";

export interface ShortcutHandlers {
  isModalOpen?: boolean;
  onFocusSearch?: () => void;
  onOpenHelp?: () => void;
  onCloseHelp?: () => void;
  onCloseModal?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleFavorite?: () => void;
}

export default function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handlers.onFocusSearch?.();
        return;
      }

      if (isTyping) return;

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
