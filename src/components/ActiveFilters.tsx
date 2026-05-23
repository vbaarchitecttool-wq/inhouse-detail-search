import React from "react";

interface Props {
  query: string;
  categories: string[];
  fileTypes: string[];
  favoritesOnly: boolean;
  onClearQuery: () => void;
  onRemoveCategory: (c: string) => void;
  onRemoveFileType: (t: string) => void;
  onClearFavoritesOnly: () => void;
  onClearAll: () => void;
}

const ActiveFilters: React.FC<Props> = ({
  query,
  categories,
  fileTypes,
  favoritesOnly,
  onClearQuery,
  onRemoveCategory,
  onRemoveFileType,
  onClearFavoritesOnly,
  onClearAll,
}) => {
  const hasAny =
    (query && query.length > 0) ||
    (categories && categories.length > 0) ||
    (fileTypes && fileTypes.length > 0) ||
    favoritesOnly;

  if (!hasAny) return null;

  const total =
    (query ? 1 : 0) +
    (categories?.length || 0) +
    (fileTypes?.length || 0) +
    (favoritesOnly ? 1 : 0);

  return (
    <div className="active-filters" role="region" aria-label="絞り込み条件">
      <span className="active-filters-label">絞り込み {total}件：</span>

      {query ? (
        <button
          type="button"
          className="chip chip-query"
          onClick={onClearQuery}
          title="キーワードを解除"
        >
          🔍 “{query}” <span className="chip-x">×</span>
        </button>
      ) : null}

      {favoritesOnly ? (
        <button
          type="button"
          className="chip chip-fav"
          onClick={onClearFavoritesOnly}
          title="お気に入り絞り込みを解除"
        >
          ★ お気に入りのみ <span className="chip-x">×</span>
        </button>
      ) : null}

      {fileTypes?.map((t) => (
        <button
          key={`type-${t}`}
          type="button"
          className={`chip chip-type chip-${t}`}
          onClick={() => onRemoveFileType(t)}
          title={`${t.toUpperCase()} 絞り込みを解除`}
        >
          {t.toUpperCase()} <span className="chip-x">×</span>
        </button>
      ))}

      {categories?.map((c) => {
        const short = c.split("/").slice(-1)[0] || c;
        return (
          <button
            key={`cat-${c}`}
            type="button"
            className="chip chip-cat"
            onClick={() => onRemoveCategory(c)}
            title={c}
          >
            📁 {short} <span className="chip-x">×</span>
          </button>
        );
      })}

      <button
        type="button"
        className="chip chip-clear-all"
        onClick={onClearAll}
        title="すべて解除"
      >
        すべて解除
      </button>
    </div>
  );
};

export default ActiveFilters;
