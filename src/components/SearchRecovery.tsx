import React from "react";
import type { SearchRecovery as Recovery } from "../utils/search";

interface Props {
  query: string;
  recovery: Recovery;
  onSearch: (q: string) => void;
  onClearFilters: () => void;
}

/**
 * 検索が0件だったときの立て直し。
 * 「見つかりません」で終わらせず、次の一手をボタンで用意する。
 */
const SearchRecovery: React.FC<Props> = ({
  query,
  recovery,
  onSearch,
  onClearFilters,
}) => {
  const { withoutFiltersCount, perTerm, suggestions } = recovery;
  const hasFilterFix = !!withoutFiltersCount && withoutFiltersCount > 0;

  return (
    <div className="no-results search-recovery" role="status">
      <p className="recovery-title">
        「{query}」に一致する条項は見つかりませんでした。
      </p>

      {hasFilterFix ? (
        <div className="recovery-block">
          <p>章やコンテンツの絞り込みが原因のようです。</p>
          <button
            type="button"
            className="recovery-primary"
            onClick={onClearFilters}
          >
            絞り込みを外して表示（{withoutFiltersCount}件）
          </button>
        </div>
      ) : null}

      {perTerm.length > 0 ? (
        <div className="recovery-block">
          <p>語を減らすと見つかります。</p>
          <div className="recovery-chips">
            {perTerm.map((t) => (
              <button
                key={t.term}
                type="button"
                className="chip chip-query"
                onClick={() => onSearch(t.term)}
              >
                「{t.term}」だけで検索（{t.count}件）
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="recovery-block">
          <p>もしかして：</p>
          <div className="recovery-chips">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="chip chip-query"
                onClick={() => onSearch(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="recovery-tip">
        短い語（例：「防水」）や条項番号（例：5.3.2）でも探せます。章の一覧からたどることもできます。
      </p>
    </div>
  );
};

export default SearchRecovery;
