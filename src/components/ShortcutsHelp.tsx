import React, { useEffect } from "react";
import useFocusTrap from "../hooks/useFocusTrap";

const shortcuts: { keys: string[]; desc: string }[] = [
  { keys: ["⌘/Ctrl", "K"], desc: "検索フォーカス" },
  { keys: ["/"], desc: "検索フォーカス" },
  { keys: ["?"], desc: "このヘルプを開く" },
  { keys: ["Esc"], desc: "モーダル / ヘルプを閉じる" },
  { keys: ["←", "→"], desc: "前 / 次のディティール（モーダル内）" },
  { keys: ["F"], desc: "お気に入りトグル（モーダル内）" },
  { keys: ["Enter / Space"], desc: "カード選択" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const ShortcutsHelp: React.FC<Props> = ({ open, onClose }) => {
  const containerRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="キーボードショートカット"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="modal-content shortcut-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>キーボードショートカット</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <table className="shortcut-table">
            <tbody>
              {shortcuts.map((s, i) => (
                <tr key={i}>
                  <td className="shortcut-keys">
                    {s.keys.map((k, j) => (
                      <kbd key={j}>{k}</kbd>
                    ))}
                  </td>
                  <td className="shortcut-desc">{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelp;
