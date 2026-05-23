// File: src/App.js
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import FileTypeFilter from "./components/FileTypeFilter";
import DetailCard from "./components/DetailCard";
import DetailModal from "./components/DetailModal";
import ActiveFilters from "./components/ActiveFilters";
import RecentlyViewed from "./components/RecentlyViewed";
import BulkDownloadBar from "./components/BulkDownloadBar";
import ShortcutsHelp from "./components/ShortcutsHelp";
import ThemeToggle from "./components/ThemeToggle";
import { SkeletonGrid } from "./components/SkeletonCard";
import LiveRegion from "./components/LiveRegion";
import UpdateBanner from "./components/UpdateBanner";

import indexData from "./detail_index.json";
import { searchDetails, sortDetails } from "./utils/search";
import {
  loadFavorites,
  saveFavorites,
  loadRecent,
  pushRecent,
  clearRecent,
  loadViewMode,
  saveViewMode,
  loadTheme,
  saveTheme,
} from "./utils/storage";
import { readUrlState, writeUrlState, buildShareUrl } from "./utils/urlSync";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
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

  const initial = useMemo(() => readUrlState(), []);

  const [searchQuery, setSearchQuery] = useState(initial.query);
  const [selectedCategoryPaths, setSelectedCategoryPaths] = useState(
    initial.categories
  );
  const [selectedFileTypes, setSelectedFileTypes] = useState(initial.fileTypes);
  const [sortType, setSortType] = useState(initial.sortType);
  const [favoritesOnly, setFavoritesOnly] = useState(initial.favoritesOnly);
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [favorites, setFavorites] = useState(() => new Set(loadFavorites()));
  const [recentIds, setRecentIds] = useState(() => loadRecent());
  const [viewMode, setViewMode] = useState(() => loadViewMode());
  const [theme, setTheme] = useState(() => loadTheme());
  const [helpOpen, setHelpOpen] = useState(false);
  const [bulkSelected, setBulkSelected] = useState(() => new Set());
  const [isFiltering, setIsFiltering] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [updateBannerOpen, setUpdateBannerOpen] = useState(false);

  const searchRef = useRef(null);
  const restoredOnce = useRef(false);

  // テーマ反映
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "auto") {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", theme);
    }
    saveTheme(theme);
  }, [theme]);

  // 検索・絞り込み・ソート実行（スケルトン表示用に短い isFiltering を立てる）
  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => {
      let results = searchDetails(
        detailsData,
        searchQuery,
        selectedCategoryPaths,
        selectedFileTypes
      );
      if (favoritesOnly) {
        results = results.filter((d) => favorites.has(d.id));
      }
      results = sortDetails(results, sortType);
      setFilteredDetails(results);
      setSelectedIndex((prev) => {
        if (prev < 0) return prev;
        if (prev >= results.length) return -1;
        return prev;
      });
      setIsFiltering(false);
    }, 80);
    return () => clearTimeout(t);
  }, [
    detailsData,
    searchQuery,
    selectedCategoryPaths,
    selectedFileTypes,
    sortType,
    favoritesOnly,
    favorites,
  ]);

  // SW 更新検知
  useEffect(() => {
    const onUpdate = (e) => {
      setSwRegistration(e.detail);
      setUpdateBannerOpen(true);
    };
    window.addEventListener("sw-update-available", onUpdate);
    return () => window.removeEventListener("sw-update-available", onUpdate);
  }, []);

  // URL同期（出力）
  useEffect(() => {
    writeUrlState({
      query: searchQuery,
      categories: selectedCategoryPaths,
      fileTypes: selectedFileTypes,
      sortType,
      favoritesOnly,
      detailId:
        selectedIndex >= 0 ? filteredDetails[selectedIndex]?.id || null : null,
    });
  }, [
    searchQuery,
    selectedCategoryPaths,
    selectedFileTypes,
    sortType,
    favoritesOnly,
    selectedIndex,
    filteredDetails,
  ]);

  // 初回ロード時に URL の detailId を復元
  useEffect(() => {
    if (restoredOnce.current) return;
    if (!initial.detailId) {
      restoredOnce.current = true;
      return;
    }
    const idx = filteredDetails.findIndex((d) => d.id === initial.detailId);
    if (idx >= 0) {
      setSelectedIndex(idx);
      restoredOnce.current = true;
    } else if (filteredDetails.length > 0) {
      // フィルタ変わって居場所が無い場合は全件から開く
      const fullIdx = detailsData.findIndex((d) => d.id === initial.detailId);
      if (fullIdx >= 0) {
        setSelectedCategoryPaths([]);
        setSelectedFileTypes([]);
        setFavoritesOnly(false);
      }
      restoredOnce.current = true;
    }
  }, [filteredDetails, initial.detailId, detailsData]);

  // ハンドラ群
  const handleSearch = useCallback((query) => setSearchQuery(query), []);

  const handleToggleCategoryPath = (payload) => {
    setSelectedCategoryPaths((prev) => {
      if (Array.isArray(payload)) {
        const allExist = payload.every((p) => prev.includes(p));
        if (allExist) return prev.filter((p) => !payload.includes(p));
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

  const handleToggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(Array.from(next));
      return next;
    });
  };

  const handleToggleBulkSelect = (id) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearBulk = () => setBulkSelected(new Set());

  const openDetailById = useCallback(
    (id) => {
      const idx = filteredDetails.findIndex((d) => d.id === id);
      if (idx >= 0) {
        setSelectedIndex(idx);
        setRecentIds(pushRecent(id));
      } else {
        // 結果外なら全件から開く（フィルタを一旦無視）
        const fullIdx = detailsData.findIndex((d) => d.id === id);
        if (fullIdx >= 0) {
          setSearchQuery("");
          setSelectedCategoryPaths([]);
          setSelectedFileTypes([]);
          setFavoritesOnly(false);
          setTimeout(() => {
            const i = detailsData.findIndex((d) => d.id === id);
            setSelectedIndex(i);
            setRecentIds(pushRecent(id));
          }, 0);
        }
      }
    },
    [filteredDetails, detailsData]
  );

  const handleCardClick = (detail) => {
    const idx = filteredDetails.findIndex((d) => d.id === detail.id);
    if (idx >= 0) {
      setSelectedIndex(idx);
      setRecentIds(pushRecent(detail.id));
    }
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedCategoryPaths([]);
    setSelectedFileTypes([]);
    setFavoritesOnly(false);
  };

  const selectedDetail =
    selectedIndex >= 0 && filteredDetails[selectedIndex]
      ? filteredDetails[selectedIndex]
      : null;

  // キーボードショートカット
  useKeyboardShortcuts({
    isModalOpen: !!selectedDetail || helpOpen,
    onFocusSearch: () => searchRef.current?.focus(),
    onOpenHelp: () => setHelpOpen(true),
    onCloseHelp: () => setHelpOpen(false),
    onCloseModal: () => {
      if (helpOpen) setHelpOpen(false);
      else setSelectedIndex(-1);
    },
    onPrev: () => setSelectedIndex((i) => Math.max(0, i - 1)),
    onNext: () =>
      setSelectedIndex((i) => Math.min(filteredDetails.length - 1, i + 1)),
    onToggleFavorite: () => {
      if (selectedDetail) handleToggleFavorite(selectedDetail.id);
    },
  });

  const handleSetViewMode = (m) => {
    setViewMode(m);
    saveViewMode(m);
  };

  const shareUrl = useMemo(
    () =>
      buildShareUrl({
        query: searchQuery,
        categories: selectedCategoryPaths,
        fileTypes: selectedFileTypes,
        sortType,
        favoritesOnly,
        detailId: selectedDetail?.id || null,
      }),
    [
      searchQuery,
      selectedCategoryPaths,
      selectedFileTypes,
      sortType,
      favoritesOnly,
      selectedDetail,
    ]
  );

  const liveMessage = isFiltering
    ? "検索中"
    : `${filteredDetails.length}件のディティールが見つかりました`;

  return (
    <div className="app">
      <a href="#results-section" className="skip-link">
        本文へスキップ
      </a>
      <header className="app-header">
        <div className="header-row">
          <h1>社内ディティール検索</h1>
          <div className="header-actions">
            <button
              type="button"
              className={`toggle-btn ${favoritesOnly ? "is-on" : ""}`}
              onClick={() => setFavoritesOnly((v) => !v)}
              aria-pressed={favoritesOnly}
              title="お気に入りのみ表示"
            >
              ★ お気に入り{favoritesOnly ? "ON" : ""}
              {favorites.size > 0 ? (
                <span className="count-pill">{favorites.size}</span>
              ) : null}
            </button>
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setHelpOpen(true)}
              aria-label="キーボードショートカット"
              title="ショートカット (?)"
            >
              ⌨ ヘルプ
            </button>
            <ThemeToggle theme={theme} onChange={setTheme} />
          </div>
        </div>
      </header>

      <div className="search-section">
        <SearchBar
          ref={searchRef}
          value={searchQuery}
          onSearch={handleSearch}
        />
        <p id="search-hint" className="search-hint">
          例：RC パラペット、開口部 抱き　・
          <kbd>⌘K</kbd> または <kbd>/</kbd> で検索フォーカス　・
          <kbd>?</kbd> でショートカット
        </p>

        <ActiveFilters
          query={searchQuery}
          categories={selectedCategoryPaths}
          fileTypes={selectedFileTypes}
          favoritesOnly={favoritesOnly}
          onClearQuery={() => setSearchQuery("")}
          onRemoveCategory={(c) =>
            setSelectedCategoryPaths((p) => p.filter((x) => x !== c))
          }
          onRemoveFileType={(t) =>
            setSelectedFileTypes((p) => p.filter((x) => x !== t))
          }
          onClearFavoritesOnly={() => setFavoritesOnly(false)}
          onClearAll={handleClearAll}
        />

        <RecentlyViewed
          allDetails={detailsData}
          recentIds={recentIds}
          onOpen={openDetailById}
          onClear={() => {
            clearRecent();
            setRecentIds([]);
          }}
        />
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

        <main className="results-section" id="results-section" tabIndex={-1}>
          <div className="results-header">
            <h2>検索結果：{filteredDetails.length}件</h2>
            <div className="results-controls">
              <div className="view-switch" role="group" aria-label="表示モード">
                <button
                  type="button"
                  className={`view-btn ${viewMode === "grid" ? "is-on" : ""}`}
                  onClick={() => handleSetViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  title="グリッド表示"
                >
                  ▦
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === "list" ? "is-on" : ""}`}
                  onClick={() => handleSetViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  title="リスト表示"
                >
                  ☰
                </button>
              </div>
              <label>
                ソート：
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  className="sort-select"
                >
                  <option value="category">カテゴリ順</option>
                  {searchQuery ? (
                    <option value="relevance">関連度順</option>
                  ) : null}
                  <option value="name-asc">名称（昇順）</option>
                  <option value="name-desc">名称（降順）</option>
                  <option value="date-desc">更新日（新しい順）</option>
                  <option value="date-asc">更新日（古い順）</option>
                </select>
              </label>
            </div>
          </div>

          {isFiltering && filteredDetails.length === 0 ? (
            <SkeletonGrid count={6} viewMode={viewMode} />
          ) : (
          <div
            className={
              viewMode === "list" ? "results-list" : "results-grid"
            }
          >
            {filteredDetails.length > 0 ? (
              filteredDetails.map((detail) => (
                <DetailCard
                  key={detail.id}
                  detail={detail}
                  query={searchQuery}
                  isFavorite={favorites.has(detail.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isSelected={bulkSelected.has(detail.id)}
                  onToggleSelect={handleToggleBulkSelect}
                  viewMode={viewMode}
                  onClick={handleCardClick}
                />
              ))
            ) : (
              <div className="no-results">
                <p>
                  {favoritesOnly && favorites.size === 0
                    ? "★ お気に入りはまだありません。カード右上の☆をタップして追加できます。"
                    : selectedCategoryPaths.length === 0 && !searchQuery
                    ? "カテゴリをチェックするか、キーワードを入力すると検索結果が表示されます。"
                    : "検索条件に一致するディティールが見つかりませんでした。"}
                </p>
              </div>
            )}
          </div>
          )}
        </main>
      </div>

      <LiveRegion message={liveMessage} />

      <UpdateBanner
        open={updateBannerOpen}
        registration={swRegistration}
        onClose={() => setUpdateBannerOpen(false)}
      />

      {selectedDetail && (
        <DetailModal
          detail={selectedDetail}
          index={selectedIndex}
          total={filteredDetails.length}
          allDetails={detailsData}
          onOpenById={openDetailById}
          isFavorite={favorites.has(selectedDetail.id)}
          onToggleFavorite={handleToggleFavorite}
          shareUrl={shareUrl}
          onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
          onNext={() =>
            setSelectedIndex((i) =>
              Math.min(filteredDetails.length - 1, i + 1)
            )
          }
          onClose={() => setSelectedIndex(-1)}
        />
      )}

      <BulkDownloadBar
        selectedIds={Array.from(bulkSelected)}
        allDetails={detailsData}
        onClear={handleClearBulk}
      />

      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default App;
