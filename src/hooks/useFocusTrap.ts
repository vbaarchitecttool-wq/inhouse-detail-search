import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export default function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active: boolean
) {
  const containerRef = useRef<T>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    previouslyFocused.current = document.activeElement;
    const root = containerRef.current;

    const focusables = (): HTMLElement[] =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
      );

    const first = focusables()[0] || root;
    requestAnimationFrame(() => first.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === firstEl || !root.contains(activeEl)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (activeEl === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("keydown", onKey);
      const prev = previouslyFocused.current as HTMLElement | null;
      if (prev && typeof prev.focus === "function") {
        try {
          prev.focus();
        } catch {
          /* noop */
        }
      }
    };
  }, [active]);

  return containerRef;
}
