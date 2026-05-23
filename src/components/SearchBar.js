// File: src/components/SearchBar.js
import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

const SearchBar = forwardRef(({ value, onSearch }, ref) => {
  const [query, setQuery] = useState(value || "");
  const inputRef = useRef(null);

  // 外部から渡された value（URL復元時など）を反映
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // 入力中も検索に反映（150ms デバウンス）
  useEffect(() => {
    const t = setTimeout(() => onSearch(query), 150);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <label htmlFor="search-input" className="sr-only">
        キーワード
      </label>
      <div className="search-input-wrap">
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder="例：RC パラペット、開口部 抱き"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          aria-describedby="search-hint"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            className="search-clear"
            onClick={handleClear}
            aria-label="検索クリア"
            title="クリア"
          >
            ✕
          </button>
        ) : null}
        <kbd className="search-kbd" aria-hidden>
          ⌘K
        </kbd>
      </div>
      <button type="submit" className="search-button">
        🔍 検索
      </button>
    </form>
  );
});

SearchBar.displayName = "SearchBar";
export default SearchBar;
