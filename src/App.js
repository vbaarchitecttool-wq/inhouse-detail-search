// File: src/App.js
// After
import React, { useState, useEffect, useMemo } from "react";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import FileTypeFilter from "./components/FileTypeFilter";
import DetailCard from "./components/DetailCard";
import DetailModal from "./components/DetailModal";

import indexData from "./detail_index.json";

import { searchDetails, sortDetails } from "./utils/search";
import "./styles.css";

function App() {
  const detailsData = useMemo(
    () => (Array.isArray(indexData.details) ? indexData.details : []),
    []
  );
  const categoriesData = useMemo(
    () => (Array.isArray(indexData.categories) ? indexData.categories : []),
    []
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryPaths, setSelectedCategoryPaths] = useState([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);
  const [sortType, setSortType] = useState("category");
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    let results = searchDetails(
      detailsData,
      searchQuery,
      selectedCategoryPaths,
      selectedFileTypes
    );
    results = sortDetails(results, sortType);
    setFilteredDetails(results);
    setSelectedIndex((prev) => {
      if (prev < 0) return prev;
      if (prev >= results.length) return -1;
      return prev;
    });
  }, [
    detailsData,
    searchQuery,
    selectedCategoryPaths,
    selectedFileTypes,
    sortType,
  ]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleToggleCategoryPath = (payload) => {
    setSelectedCategoryPaths((prev) => {
      if (Array.isArray(payload)) {
        const allExist = payload.every((p) => prev.includes(p));
        if (allExist) {
          return prev.filter((p) => !payload.includes(p));
        }
        const set = new Set(prev);
        payload.forEach((p) => set.add(p));
        return Array.from(set);
      }
      const path = String(payload || "");
      if (!path) return prev;
      return prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path];
    });
  };

  const handleToggleFileType = (fileType) => {
    const t = String(fileType || "");
    if (!t) return;
    setSelectedFileTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const selectedDetail =
    selectedIndex >= 0 && filteredDetails[selectedIndex]
      ? filteredDetails[selectedIndex]
      : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>社内ディティール検索</h1>
      </header>

      <div className="search-section">
        <SearchBar onSearch={handleSearch} />
        {/* ヒントに ID を追加して SearchBar の aria-describedby と連携 */}
        <p id="search-hint" className="search-hint">
          例：RC パラペット、開口部 抱き
        </p>
      </div>

      <div className="main-content">
        <aside className="sidebar">
          <CategoryFilter
            categories={categoriesData}
            selectedCategoryPaths={selectedCategoryPaths}
            onToggleCategoryPath={handleToggleCategoryPath}
          />
          <FileTypeFilter
            selectedFileTypes={selectedFileTypes}
            onToggleFileType={handleToggleFileType}
          />
        </aside>

        <main className="results-section">
          <div className="results-header">
            <h2>検索結果：{filteredDetails.length}件</h2>
            <div className="results-controls">
              <label>
                ソート：
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  className="sort-select"
                >
                  <option value="category">カテゴリ順</option>
                  <option value="name-asc">名称（昇順）</option>
                  <option value="name-desc">名称（降順）</option>
                  <option value="date-desc">更新日（新しい順）</option>
                  <option value="date-asc">更新日（古い順）</option>
                </select>
              </label>
            </div>
          </div>

          <div className="results-grid">
            {filteredDetails.length > 0 ? (
              filteredDetails.map((detail, idx) => (
                <DetailCard
                  key={detail.id}
                  detail={detail}
                  onClick={() => setSelectedIndex(idx)}
                />
              ))
            ) : (
              <div className="no-results">
                <p>
                  {selectedCategoryPaths.length === 0
                    ? "カテゴリをチェックすると検索結果が表示されます。"
                    : "検索条件に一致するディティールが見つかりませんでした。"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedDetail && (
        <DetailModal
          detail={selectedDetail}
          index={selectedIndex}
          total={filteredDetails.length}
          onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
          onNext={() =>
            setSelectedIndex((i) => Math.min(filteredDetails.length - 1, i + 1))
          }
          onClose={() => setSelectedIndex(-1)}
        />
      )}
    </div>
  );
}

export default App;
