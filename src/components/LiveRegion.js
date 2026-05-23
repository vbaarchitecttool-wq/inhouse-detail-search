// スクリーンリーダーに動的変更を通知する非表示ライブリージョン
import React from "react";

const LiveRegion = ({ message, polite = true }) => (
  <div
    className="sr-only"
    role="status"
    aria-live={polite ? "polite" : "assertive"}
    aria-atomic="true"
  >
    {message}
  </div>
);

export default LiveRegion;
