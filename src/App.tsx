import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import SearchBar, { SearchBarHandle } from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import ContentFilter from "./components/ContentFilter";
import DetailCard from "./components/DetailCard";
import DetailModal from "./components/DetailModal";
import ActiveFilters from "./components/ActiveFilters";
import RecentlyViewed from "./components/RecentlyViewed";
import ShortcutsHelp from "./components/ShortcutsHelp";
import ThemeToggle from "./components/ThemeToggle";
import { SkeletonGrid } from "./components/SkeletonCard";
import LiveRegion from "./components/LiveRegion";
import UpdateBanner from "./components/UpdateBanner";

import indexDataRaw from "./spec_index.json";
import commentaryMap from "./commentary";
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
import type { Detail, CategoryNode, SortType, ViewMode, Theme } from "./types";
import "./styles.css";

const indexData = indexDataRaw as unknown as {
  details: Detail[];
  categories: CategoryNode[];
};

const App: React.FC = () => {
  const detailsData = useMemo<Detail[]>(() => {
    const raw = Array.isArray(indexData.details) ? indexData.details : [];
    // 原文データ（spec_index.json）に、別管理の「やさしい解説」をマージする
    return raw.map((d) =>
      commentaryMap[d.id] ? { ...d, commentary: commentaryMap[d.id] } : d
    );
  }, []);
  const categoriesData = useMemo<CategoryNode[]>(
    () => (Array.isArray(indexData.categories) ? indexData.categories : []),
    []
  );

  const initial = useMemo(() => readUrlState(), []);

  const [searchQuery, setSearchQuery] = useState<string>(initial.query);
  const [selectedCategoryPaths, setSelectedCategoryPaths] = useState<string[]>(
    initial.categories
  );
  const [selectedContentFlags, setSelectedContentFlags] = useState<string[]>(
    initial.contentFlags
  );
  const [sortType, setSortType] = useState<SortType>(initial.sortType);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(
    initial.favoritesOnly
  );
  const [filteredDetails, setFilteredDetails] = useState<Detail[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(loadFavorites())
  );
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecent());
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadViewMode());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [updateBannerOpen, setUpdateBannerOpen] = useState<boolean>(false);

  const searchRef = useRef<SearchBarHandle>(null);
  const restoredOnce = useRef<boolean>(false);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "auto") {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", theme);
    }
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => {
      let results = searchDetails(
        detailsData,
        searchQuery,
        selectedCategoryPaths,
        selectedContentFlags
      );
      if (favoritesOnly) {
        results = results.filter((d) => favorites.has(d.id));
      }
      results = sortDetails(results, sortType);
      // 条項番号そのもの（例: 5.3.2）で検索されたときは、完全一致の項を先頭に固定する
      const qn = searchQuery.trim();
      if (/^\d{1,2}\.\d{1,2}\.\d{1,2}$/.test(qn)) {
        const idx = results.findIndex((d) => d.number === qn);
        if (idx > 0) {
          results = [
            results[idx],
            ...results.slice(0, idx),
            ...results.slice(idx + 1),
          ];
        }
      }
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
    selectedContentFlags,
    sortType,
    favoritesOnly,
    favorites,
  ]);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<ServiceWorkerRegistration>;
      setSwRegistration(ce.detail);
      setUpdateBannerOpen(true);
    };
    window.addEventListener("sw-update-available", onUpdate as EventListener);
    return () =>
      window.removeEventListener(
        "sw-update-available",
        onUpdate as EventListener
      );
  }, []);

  useEffect(() => {
    writeUrlState({
      query: searchQuery,
      categories: selectedCategoryPaths,
      contentFlags: selectedContentFlags,
      sortType,
      favoritesOnly,
      detailId:
        selectedIndex >= 0 ? filteredDetails[selectedIndex]?.id || null : null,
    });
  }, [
    searchQuery,
    selectedCategoryPaths,
    selectedContentFlags,
    sortType,
    favoritesOnly,
    selectedIndex,
    filteredDetails,
  ]);

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
      const fullIdx = detailsData.findIndex((d) => d.id === initial.detailId);
      if (fullIdx >= 0) {
        setSelectedCategoryPaths([]);
        setSelectedContentFlags([]);
        setFavoritesOnly(false);
      }
      restoredOnce.current = true;
    }
  }, [filteredDetails, initial.detailId, detailsData]);

  const handleSearch = useCallback((q: string) => setSearchQuery(q), []);

  const handleToggleCategoryPath = (payload: string | string[]) => {
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

  const handleToggleContentFlag = (flag: string) => {
    const t = String(flag || "");
    if (!t) return;
    setSelectedContentFlags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(Array.from(next));
      return next;
    });
  };

  const openDetailById = useCallback(
    (id: string) => {
      const idx = filteredDetails.findIndex((d) => d.id === id);
      if (idx >= 0) {
        setSelectedIndex(idx);
        setRecentIds(pushRecent(id));
      } else {
        const fullIdx = detailsData.findIndex((d) => d.id === id);
        if (fullIdx >= 0) {
          setSearchQuery("");
          setSelectedCategoryPaths([]);
          setSelectedContentFlags([]);
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

  const handleCardClick = (detail: Detail) => {
    const idx = filteredDetails.findIndex((d) => d.id === detail.id);
    if (idx >= 0) {
      setSelectedIndex(idx);
      setRecentIds(pushRecent(detail.id));
    }
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedCategoryPaths([]);
    setSelectedContentFlags([]);
    setFavoritesOnly(false);
  };

  const selectedDetail: Detail | null =
    selectedIndex >= 0 && filteredDetails[selectedIndex]
      ? filteredDetails[selectedIndex]
      : null;

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

  const handleSetViewMode = (m: ViewMode) => {
    setViewMode(m);
    saveViewMode(m);
  };

  const shareUrl = useMemo(
    () =>
      buildShareUrl({
        query: searchQuery,
        categories: selectedCategoryPaths,
        contentFlags: selectedContentFlags,
        sortType,
        favoritesOnly,
        detailId: selectedDetail?.id || null,
      }),
    [
      searchQuery,
      selectedCategoryPaths,
      selectedContentFlags,
      sortType,
      favoritesOnly,
      selectedDetail,
    ]
  );

  const liveMessage = isFiltering
    ? "検索中"
    : `${filteredDetails.length}件の条項が見つかりました`;

  return (
    <div className="app">
      <a href="#results-section" className="skip-link">
        本文へスキップ
      </a>
      <header className="app-header">
        <div className="header-row">
          <h1>NA 建築工事標準仕様書</h1>
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
        <p className="header-subtitle">
          公共建築工事標準仕様書（建築工事編）令和7年版ベース ＋
          1年生向けやさしい解説
        </p>
      </header>

      <div className="search-section">
        <SearchBar
          ref={searchRef}
          value={searchQuery}
          onSearch={handleSearch}
        />
        <p id="search-hint" className="search-hint">
          例：かぶり厚さ、山留め、5.3.2　・
          <kbd>⌘K</kbd> または <kbd>/</kbd> で検索フォーカス　・
          <kbd>?</kbd> でショートカット
        </p>

        <ActiveFilters
          query={searchQuery}
          categories={selectedCategoryPaths}
          contentFlags={selectedContentFlags}
          favoritesOnly={favoritesOnly}
          onClearQuery={() => setSearchQuery("")}
          onRemoveCategory={(c) =>
            setSelectedCategoryPaths((p) => p.filter((x) => x !== c))
          }
          onRemoveContentFlag={(t) =>
            setSelectedContentFlags((p) => p.filter((x) => x !== t))
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
          <ContentFilter
            selectedContentFlags={selectedContentFlags}
            onToggleContentFlag={handleToggleContentFlag}
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
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  className="sort-select"
                >
                  <option value="category">条項順</option>
                  {searchQuery ? (
                    <option value="relevance">関連度順</option>
                  ) : null}
                </select>
              </label>
            </div>
          </div>

          {isFiltering && filteredDetails.length === 0 ? (
            <SkeletonGrid count={6} viewMode={viewMode} />
          ) : (
            <div
              className={viewMode === "list" ? "results-list" : "results-grid"}
            >
              {filteredDetails.length > 0 ? (
                filteredDetails.map((detail) => (
                  <DetailCard
                    key={detail.id}
                    detail={detail}
                    query={searchQuery}
                    isFavorite={favorites.has(detail.id)}
                    onToggleFavorite={handleToggleFavorite}
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
                      ? "左の章をチェックするか、キーワードを入力すると条項が表示されます。"
                      : "検索条件に一致する条項が見つかりませんでした。"}
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

      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
};

export default App;
