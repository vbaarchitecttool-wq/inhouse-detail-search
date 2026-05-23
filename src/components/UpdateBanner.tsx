import React from "react";

interface Props {
  open: boolean;
  registration: ServiceWorkerRegistration | null;
  onClose: () => void;
}

const UpdateBanner: React.FC<Props> = ({ open, registration, onClose }) => {
  if (!open) return null;

  const handleReload = () => {
    const waiting = registration?.waiting;
    if (waiting) {
      waiting.postMessage({ type: "SKIP_WAITING" });
      const onCtrlChange = () => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onCtrlChange
        );
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener("controllerchange", onCtrlChange);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <span>新しいバージョンがあります</span>
      <button type="button" className="update-banner-btn" onClick={handleReload}>
        更新
      </button>
      <button
        type="button"
        className="update-banner-close"
        onClick={onClose}
        aria-label="閉じる"
      >
        ✕
      </button>
    </div>
  );
};

export default UpdateBanner;
