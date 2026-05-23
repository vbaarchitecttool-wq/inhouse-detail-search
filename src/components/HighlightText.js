// src/components/HighlightText.js
import React from "react";
import { highlightText } from "../utils/search";

const HighlightText = ({ text, query }) => {
  const parts = highlightText(text, query);
  if (typeof parts === "string") return <>{parts}</>;
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="search-hit">
            {p.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        )
      )}
    </>
  );
};

export default HighlightText;
