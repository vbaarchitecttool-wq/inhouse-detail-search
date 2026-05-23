import React from "react";

interface Props {
  message: string;
  polite?: boolean;
}

const LiveRegion: React.FC<Props> = ({ message, polite = true }) => (
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
