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
import LiveRegion from "./components/LiveRegion";
import UpdateBanner from "./components/UpdateBanner";
import SearchRecovery from "./components/SearchRecovery";
import OfflineTools from "./components/OfflineTools";
import ViewTabs from "./components/ViewTabs";
import SheetView from "./components/SheetView";
import GlossaryView from "./components/GlossaryView";
import StudyView from "./components/StudyView";

import indexDataRaw from "./spec_index.json";
import commentaryMap from "./commentary";
import { searchDetails, sortDetails, buildRecovery } from "./utils/search";
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
  loadNotes,
  saveNotes,
  loadReadIds,
  saveReadIds,
  loadQuizStats,
  saveQuizStats,
} from "./utils/storage";
import {
  readUrlState,
  writeUrlState,
  isModalHistoryEntry,
} from "./utils/urlSync";
import { buildSectionIndex } from "./utils/clauseRefs";
import { buildGlossary, recordAnswer } from "./utils/glossary";
import { todayIso } from "./utils/sheet";
import {
  downloadText,
  parseBackup,
  serializeBackup,
  summarizeUserData,
} from "./utils/backup";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useCheckSheets from "./hooks/useCheckSheets";
import type {
  Detail,
  CategoryNode,
  SortType,
  ViewMode,
  Theme,
  AppView,
  QuizStat,
  UserData,
} from "./types";
import "./styles.css";

const indexData = indexDataRaw as unknown as {
  details: Detail[];
  categories: CategoryNode[];
  generatedAt?: string;
};

const APP_NAME = "NA 建築工事標準仕様書";
const PAGE_SIZE = 120;
/** 検索欄の下に出す「押すだけで試せる」例 */
const EXAMPLE_QUERIES = ["かぶり厚さ", "山留め", "石膏ボード", "5.3.2"];
/** 原文データではなく、この端末の記録（メモ・既読）で絞り込むフラグ */
const PERSONAL_FLAGS = ["note", "unread"];

const formatDataDate = (iso?: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : "";
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
  const detailsById = useMemo(
    () => new Map<string, Detail>(detailsData.map((d) => [d.id, d])),
    [detailsData]
  );
  const titlesById = useMemo(
    () => new Map<string, string>(detailsData.map((d) => [d.id, d.title])),
    [detailsData]
  );

  const sectionIndex = useMemo(
    () => buildSectionIndex(detailsData),
    [detailsData]
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
  // 開いている条項は「検索結果の何番目か」ではなく条項番号で持つ。
  // 共有リンク・参照リンク・最近見た から開いても、いまの検索条件を壊さずに済む。
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    initial.detailId && detailsById.has(initial.detailId)
      ? initial.detailId
      : null
  );
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(loadFavorites())
  );
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecent());
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadViewMode());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [updateBannerOpen, setUpdateBannerOpen] = useState<boolean>(false);
  // 一度に描画するカード数の上限（大量ヒット時のDOM肥大を防ぐ）。フィルタ更新でリセット
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  // スマホでは章ツリーを畳んでおき、ボタンで開く
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine !== false
  );
  const [showToTop, setShowToTop] = useState<boolean>(false);
  const [view, setView] = useState<AppView>(initial.view ?? "search");
  const [notes, setNotes] = useState<Record<string, string>>(() => loadNotes());
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const ids = new Set(loadReadIds());
    // 共有リンクで直接開いた条項も「読んだ」に数える
    if (initial.detailId && detailsById.has(initial.detailId)) {
      ids.add(initial.detailId);
    }
    return ids;
  });
  const [quizStats, setQuizStats] = useState<Record<string, QuizStat>>(() =>
    loadQuizStats()
  );
  const [appToast, setAppToast] = useState<string>("");
  const sheets = useCheckSheets();
  const toastTimer = useRef<number | undefined>(undefined);

  const glossary = useMemo(() => buildGlossary(detailsData), [detailsData]);

  useEffect(() => saveNotes(notes), [notes]);
  useEffect(() => saveReadIds(Array.from(readIds)), [readIds]);
  useEffect(() => saveQuizStats(quizStats), [quizStats]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = useCallback((message: string) => {
    setAppToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setAppToast(""), 3200);
  }, []);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const searchRef = useRef<SearchBarHandle>(null);
  const lastSelectedRef = useRef<string | null>(selectedId);
  const skipHistoryPushRef = useRef<boolean>(false);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "auto") {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", theme);
    }
    saveTheme(theme);

    // モバイルのアドレスバー色（theme-color）を実効テーマの背景色に合わせる
    const prefersDark =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effectiveDark = theme === "dark" || (theme === "auto" && prefersDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", effectiveDark ? "#0b1020" : "#f9fafb");
    }
  }, [theme]);

  const hasQuery = searchQuery.trim().length > 0;
  // キーワードがあるときは「関連度順」が既定（探している条項が先頭に来る）。
  // キーワードが無いときは仕様書の目次どおり「条項順」。
  const effectiveSort: SortType = hasQuery ? sortType : "category";

  const dataFlags = useMemo(
    () => selectedContentFlags.filter((f) => !PERSONAL_FLAGS.includes(f)),
    [selectedContentFlags]
  );

  // 検索は実データ（約800条項）で数ミリ秒なので、待ち時間なしでその場で計算する
  const searchedDetails = useMemo<Detail[]>(() => {
    let results = sortDetails(
      searchDetails(
        detailsData,
        searchQuery,
        selectedCategoryPaths,
        dataFlags
      ),
      effectiveSort
    );
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
    return results;
  }, [
    detailsData,
    searchQuery,
    selectedCategoryPaths,
    dataFlags,
    effectiveSort,
  ]);

  const noteOnly = selectedContentFlags.includes("note");
  const unreadOnly = selectedContentFlags.includes("unread");

  const filteredDetails = useMemo<Detail[]>(() => {
    if (!favoritesOnly && !noteOnly && !unreadOnly) return searchedDetails;
    return searchedDetails.filter(
      (d) =>
        (!favoritesOnly || favorites.has(d.id)) &&
        (!noteOnly || !!notes[d.id]) &&
        // 開いた瞬間に既読になるので、いま開いている条項は一覧に残す（前後移動を保つ）
        (!unreadOnly || !readIds.has(d.id) || d.id === selectedId)
    );
  }, [
    searchedDetails,
    favoritesOnly,
    favorites,
    noteOnly,
    notes,
    unreadOnly,
    readIds,
    selectedId,
  ]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchedDetails, favoritesOnly, noteOnly, unreadOnly]);

  const hasFilters =
    selectedCategoryPaths.length > 0 ||
    selectedContentFlags.length > 0 ||
    favoritesOnly;

  const recovery = useMemo(
    () =>
      filteredDetails.length === 0 && hasQuery
        ? buildRecovery(detailsData, searchQuery, hasFilters)
        : null,
    [filteredDetails.length, hasQuery, detailsData, searchQuery, hasFilters]
  );

  const selectedIndex = useMemo(
    () =>
      selectedId ? filteredDetails.findIndex((d) => d.id === selectedId) : -1,
    [filteredDetails, selectedId]
  );
  const selectedDetail: Detail | null = selectedId
    ? detailsById.get(selectedId) || null
    : null;

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
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setShowToTop(window.scrollY > 700);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // URL と画面の同期。条項を「開いた」ときだけ履歴を1つ積み、
  // ブラウザ／スマホの「戻る」で条項を閉じられるようにする。
  useEffect(() => {
    const prev = lastSelectedRef.current;
    lastSelectedRef.current = selectedId;
    const opening = !prev && !!selectedId && !skipHistoryPushRef.current;
    skipHistoryPushRef.current = false;
    writeUrlState(
      {
        query: searchQuery,
        categories: selectedCategoryPaths,
        contentFlags: selectedContentFlags,
        sortType,
        favoritesOnly,
        detailId: selectedId,
        view,
      },
      opening ? "push" : "replace"
    );
  }, [
    view,
    searchQuery,
    selectedCategoryPaths,
    selectedContentFlags,
    sortType,
    favoritesOnly,
    selectedId,
  ]);

  useEffect(() => {
    const onPop = () => {
      const id = readUrlState().detailId;
      const next = id && detailsById.has(id) ? id : null;
      if (next !== lastSelectedRef.current) {
        skipHistoryPushRef.current = true;
        setSelectedId(next);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [detailsById]);

  // 共有リンクで直接開いた条項も「最近見た」に残す
  useEffect(() => {
    if (initial.detailId && detailsById.has(initial.detailId)) {
      setRecentIds(pushRecent(initial.detailId));
    }
  }, [initial.detailId, detailsById]);

  // チェックシートを開いている間だけ、印刷をシート用の表に切り替える
  useEffect(() => {
    const html = document.documentElement;
    const on = view === "sheet" && !selectedId;
    html.classList.toggle("sheet-open", on);
    return () => html.classList.remove("sheet-open");
  }, [view, selectedId]);

  // タブ名・履歴・印刷ヘッダーに条項名が出るようにする
  useEffect(() => {
    document.title = selectedDetail
      ? `${selectedDetail.number} ${selectedDetail.title}｜${APP_NAME}`
      : APP_NAME;
  }, [selectedDetail]);

  const handleSearch = useCallback((q: string) => setSearchQuery(q), []);

  const handleToggleCategoryPath = useCallback((payload: string | string[]) => {
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
  }, []);

  const handleToggleContentFlag = useCallback((flag: string) => {
    const t = String(flag || "");
    if (!t) return;
    setSelectedContentFlags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(Array.from(next));
      return next;
    });
  }, []);

  const openDetailById = useCallback(
    (id: string) => {
      if (!detailsById.has(id)) return;
      setSelectedId(id);
      setRecentIds(pushRecent(id));
      markRead(id);
    },
    [detailsById, markRead]
  );

  const changeView = useCallback((next: AppView) => {
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  const toggleSheetClause = sheets.toggleClause;
  const handleToggleSheet = useCallback(
    (id: string) => {
      const added = toggleSheetClause(id);
      const d = detailsById.get(id);
      const label = d ? `${d.number} ${d.title}` : id;
      notify(
        added
          ? `✓ ${label} をチェックシートに入れました`
          : `${label} をチェックシートから外しました`
      );
    },
    [toggleSheetClause, detailsById, notify]
  );

  const handleChangeNote = useCallback((id: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (text.trim()) next[id] = text;
      else delete next[id];
      return next;
    });
  }, []);

  const handleQuizAnswer = useCallback(
    (key: string, correct: boolean) =>
      setQuizStats((prev) => recordAnswer(prev, key, correct)),
    []
  );

  // 学習画面の章 →「さがす」で、その章のまだ読んでいない条項だけを並べる
  const showUnreadOfChapter = useCallback(
    (chapter: string) => {
      const node = categoriesData.find((c) => c.name === chapter);
      const leaves = (node?.children ?? []).map((ch) => `${chapter}/${ch.name}`);
      setSearchQuery("");
      setFavoritesOnly(false);
      setSelectedCategoryPaths(leaves.length > 0 ? leaves : [chapter]);
      setSelectedContentFlags(["unread"]);
      changeView("search");
    },
    [categoriesData, changeView]
  );

  const handleExport = () => {
    const data = {
      favorites: Array.from(favorites),
      notes,
      sheets: sheets.state,
      readIds: Array.from(readIds),
      quizStats,
    };
    downloadText(
      `NA標準仕様書_自分のデータ_${todayIso()}.json`,
      serializeBackup(data),
      "application/json"
    );
    notify(`✓ 書き出しました（${summarizeUserData(data)}）`);
  };

  const handleImport = async (file: File) => {
    let data: UserData | null;
    try {
      data = parseBackup(await file.text());
    } catch {
      data = null;
    }
    if (!data) {
      notify(
        "このファイルは読み込めません。このアプリで書き出したファイルを選んでください"
      );
      return;
    }
    if (
      !window.confirm(
        `ファイルの内容（${summarizeUserData(
          data
        )}）で、この端末のデータを置き換えます。いまのお気に入り・メモ・チェックシート・学習の記録は消えます。よろしいですか？`
      )
    ) {
      return;
    }
    setFavorites(new Set(data.favorites));
    saveFavorites(data.favorites);
    setNotes(data.notes);
    sheets.replaceAll(data.sheets);
    setReadIds(new Set(data.readIds));
    setQuizStats(data.quizStats);
    notify("✓ 読み込みました");
  };

  const handleCardClick = useCallback(
    (detail: Detail) => openDetailById(detail.id),
    [openDetailById]
  );

  const closeDetail = useCallback(() => {
    // 条項を開くときに積んだ履歴があれば、それを戻す（＝閉じる）。
    // 共有リンクから直接開いた場合は履歴が無いので、その場で閉じる。
    if (isModalHistoryEntry()) window.history.back();
    else setSelectedId(null);
  }, []);

  const stepDetail = useCallback(
    (delta: number) => {
      if (selectedIndex < 0) return;
      const next = filteredDetails[selectedIndex + delta];
      if (next) openDetailById(next.id);
    },
    [selectedIndex, filteredDetails, openDetailById]
  );
  const goPrev = useCallback(() => stepDetail(-1), [stepDetail]);
  const goNext = useCallback(() => stepDetail(1), [stepDetail]);

  const clearFilters = useCallback(() => {
    setSelectedCategoryPaths([]);
    setSelectedContentFlags([]);
    setFavoritesOnly(false);
  }, []);

  const handleClearAll = () => {
    setSearchQuery("");
    clearFilters();
  };

  useKeyboardShortcuts({
    isModalOpen: !!selectedDetail || helpOpen,
    onFocusSearch: () => {
      if (view !== "search") {
        changeView("search");
        window.setTimeout(() => searchRef.current?.focus(), 0);
      } else {
        searchRef.current?.focus();
      }
    },
    onOpenHelp: () => setHelpOpen(true),
    onCloseHelp: () => setHelpOpen(false),
    onCloseModal: () => {
      if (helpOpen) setHelpOpen(false);
      else closeDetail();
    },
    onPrev: goPrev,
    onNext: goNext,
    onToggleFavorite: () => {
      if (selectedDetail) handleToggleFavorite(selectedDetail.id);
    },
  });

  const handleSetViewMode = (m: ViewMode) => {
    setViewMode(m);
    saveViewMode(m);
  };

  const scrollToSearch = () => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    searchRef.current?.focus();
  };

  const liveMessage = `${filteredDetails.length}件の条項が見つかりました`;
  const activeFilterCount =
    selectedCategoryPaths.length + selectedContentFlags.length;
  const dataDate = formatDataDate(indexData.generatedAt);

  return (
    <div className="app">
      <a href="#results-section" className="skip-link">
        本文へスキップ
      </a>
      <header className="app-header">
        <div className="header-row">
          <h1>{APP_NAME}</h1>
          <div className="header-actions">
            {!isOnline ? (
              <span className="offline-chip" role="status">
                📴 オフライン
                <span className="offline-chip-sub">（保存済みの内容を表示中）</span>
              </span>
            ) : null}
            <button
              type="button"
              className={`toggle-btn ${favoritesOnly ? "is-on" : ""}`}
              onClick={() => {
                if (view !== "search") {
                  setFavoritesOnly(true);
                  changeView("search");
                } else {
                  setFavoritesOnly((v) => !v);
                }
              }}
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
              className="toggle-btn help-btn"
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
        <ViewTabs
          view={view}
          onChange={changeView}
          sheetCount={sheets.active?.items.length ?? 0}
        />
      </header>

      {view === "search" ? (
        <>
      <div className="search-section">
        <SearchBar
          ref={searchRef}
          value={searchQuery}
          onSearch={handleSearch}
        />
        <div id="search-hint" className="search-hint">
          <span className="search-examples">
            <span className="search-examples-label">例：</span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                className="example-chip"
                onClick={() => setSearchQuery(q)}
              >
                {q}
              </button>
            ))}
          </span>
          <span className="search-hint-keys">
            <kbd>⌘K</kbd> または <kbd>/</kbd> で検索フォーカス　・
            <kbd>?</kbd> でショートカット
          </span>
        </div>

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
        <button
          type="button"
          className="filter-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
        >
          <span>
            📁 章・節で絞り込む
            {activeFilterCount > 0 ? (
              <span className="count-pill">{activeFilterCount}</span>
            ) : null}
          </span>
          <span aria-hidden="true">{filtersOpen ? "▴" : "▾"}</span>
        </button>

        <aside
          id="filter-panel"
          className={`sidebar ${filtersOpen ? "is-open" : ""}`}
          aria-label="章・節・コンテンツで絞り込み"
        >
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
            <h2>
              {hasQuery || hasFilters ? "検索結果" : "すべての条項"}：
              {filteredDetails.length}件
            </h2>
            <div className="results-controls">
              <div className="view-switch" role="group" aria-label="表示モード">
                <button
                  type="button"
                  className={`view-btn ${viewMode === "grid" ? "is-on" : ""}`}
                  onClick={() => handleSetViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  aria-label="グリッド表示"
                  title="グリッド表示"
                >
                  <span aria-hidden="true">▦</span>
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === "list" ? "is-on" : ""}`}
                  onClick={() => handleSetViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  aria-label="リスト表示"
                  title="リスト表示"
                >
                  <span aria-hidden="true">☰</span>
                </button>
              </div>
              <label>
                ソート：
                <select
                  value={effectiveSort}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  className="sort-select"
                >
                  {hasQuery ? (
                    <option value="relevance">関連度順</option>
                  ) : null}
                  <option value="category">条項順</option>
                </select>
              </label>
            </div>
          </div>

          <div className={viewMode === "list" ? "results-list" : "results-grid"}>
            {filteredDetails.length > 0 ? (
              filteredDetails
                .slice(0, visibleCount)
                .map((detail) => (
                  <DetailCard
                    key={detail.id}
                    detail={detail}
                    query={searchQuery}
                    isFavorite={favorites.has(detail.id)}
                    onToggleFavorite={handleToggleFavorite}
                    inSheet={sheets.activeIds.has(detail.id)}
                    onToggleSheet={handleToggleSheet}
                    hasNote={!!notes[detail.id]}
                    isRead={readIds.has(detail.id)}
                    viewMode={viewMode}
                    onClick={handleCardClick}
                  />
                ))
            ) : recovery ? (
              <SearchRecovery
                query={searchQuery.trim()}
                recovery={recovery}
                onSearch={setSearchQuery}
                onClearFilters={clearFilters}
              />
            ) : (
              <div className="no-results">
                <p>
                  {favoritesOnly && favorites.size === 0
                    ? "★ お気に入りはまだありません。カード右上の☆をタップして追加できます。"
                    : "絞り込み条件に一致する条項が見つかりませんでした。"}
                </p>
                {hasFilters ? (
                  <button
                    type="button"
                    className="recovery-primary"
                    onClick={clearFilters}
                  >
                    絞り込みを外す
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {filteredDetails.length > visibleCount ? (
            <div className="load-more">
              <button
                type="button"
                className="load-more-btn"
                onClick={() => setVisibleCount((c) => c + 200)}
              >
                残り{filteredDetails.length - visibleCount}件を表示
              </button>
            </div>
          ) : null}
        </main>
      </div>
        </>
      ) : (
        <main
          className="results-section view-panel"
          id="results-section"
          tabIndex={-1}
        >
          {view === "sheet" ? (
            <SheetView
              api={sheets}
              allDetails={detailsData}
              detailsById={detailsById}
              onOpenClause={openDetailById}
              onGoSearch={() => changeView("search")}
              notify={notify}
            />
          ) : view === "glossary" ? (
            <GlossaryView items={glossary} onOpenClause={openDetailById} />
          ) : (
            <StudyView
              allDetails={detailsData}
              glossary={glossary}
              readIds={readIds}
              quizStats={quizStats}
              onAnswer={handleQuizAnswer}
              onOpenClause={openDetailById}
              onShowUnread={showUnreadOfChapter}
              onExport={handleExport}
              onImport={handleImport}
            />
          )}
        </main>
      )}

      <footer className="app-footer">
        <OfflineTools />
        <p className="app-footer-source">
          原文：公共建築工事標準仕様書（建築工事編）令和7年版（国土交通省大臣官房官庁営繕部）
          {dataDate ? `／原文データ取込日：${dataDate}` : ""}
          ／全{detailsData.length}条項
        </p>
        <p className="app-footer-source">
          解説・図解は社内作成の補足です。実務上の判断は原文と設計図書（特記仕様書等）を正としてください。
        </p>
      </footer>

      {appToast ? (
        <div className="app-toast" role="status" aria-live="polite">
          {appToast}
        </div>
      ) : null}

      {showToTop && !selectedDetail && view === "search" ? (
        <button
          type="button"
          className="to-search-fab"
          onClick={scrollToSearch}
          aria-label="検索欄へ戻る"
          title="検索欄へ戻る"
        >
          <span aria-hidden="true">🔍</span> 検索へ
        </button>
      ) : null}

      <LiveRegion message={view === "search" ? liveMessage : ""} />

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
          titlesById={titlesById}
          sections={sectionIndex}
          onOpenById={openDetailById}
          isFavorite={favorites.has(selectedDetail.id)}
          onToggleFavorite={handleToggleFavorite}
          inSheet={sheets.activeIds.has(selectedDetail.id)}
          onToggleSheet={sheets.toggleClause}
          note={notes[selectedDetail.id] ?? ""}
          onChangeNote={handleChangeNote}
          query={view === "search" ? searchQuery : ""}
          onPrev={goPrev}
          onNext={goNext}
          onClose={closeDetail}
        />
      )}

      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
};

export default App;
