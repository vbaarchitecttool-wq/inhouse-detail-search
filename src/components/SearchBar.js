// File: src/components/SearchBar.js
// After
import React, { useEffect, useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  // 入力中も検索に反映（150ms デバウンス）
  useEffect(() => {
    const t = setTimeout(() => onSearch(query), 150);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      {/* 視覚的には非表示だが、スクリーンリーダーに伝えるラベル */}
      <label htmlFor="search-input" className="sr-only">
        キーワード
      </label>
      <input
        id="search-input"
        type="text"
        placeholder="例：RC パラペット、開口部 抱き"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
        aria-describedby="search-hint"
      />
      <button type="submit" className="search-button">
        🔍 検索
      </button>
    </form>
  );
};

export default SearchBar;
