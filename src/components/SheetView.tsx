import React, { useMemo, useState } from "react";
import {
  buildGroups,
  countProgress,
  formatJaDate,
  safeFileName,
  sheetToCsv,
  sheetToText,
  CHECK_LABEL,
  SheetGroup,
} from "../utils/sheet";
import { downloadText } from "../utils/backup";
import type { CheckSheetsApi } from "../hooks/useCheckSheets";
import type { CheckState, Detail } from "../types";

interface Props {
  api: CheckSheetsApi;
  allDetails: Detail[];
  detailsById: Map<string, Detail>;
  onOpenClause: (id: string) => void;
  onGoSearch: () => void;
  notify: (message: string) => void;
}

const APP_NAME = "NA 建築工事標準仕様書";
const STATES: { value: CheckState; mark: string }[] = [
  { value: "ok", mark: "◯" },
  { value: "ng", mark: "×" },
  { value: "na", mark: "―" },
];

/** 条項1件ぶんの確認項目・追加項目・備考 */
const SheetGroupCard: React.FC<{
  group: SheetGroup;
  index: number;
  count: number;
  api: CheckSheetsApi;
  onOpenClause: (id: string) => void;
}> = ({ group, index, count, api, onOpenClause }) => {
  const [extraText, setExtraText] = useState("");
  const { item, detail, rows } = group;
  const title = detail ? detail.title : "（原文データにない条項）";
  const number = detail ? detail.number : item.id;

  const submitExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraText.trim()) return;
    api.addExtra(item.id, extraText);
    setExtraText("");
  };

  return (
    <li className="sheet-group">
      <div className="sheet-group-head">
        <button
          type="button"
          className="sheet-group-title"
          onClick={() => detail && onOpenClause(item.id)}
          disabled={!detail}
          title="原文と解説を開く"
        >
          <span className="spec-number">{number}</span>
          <span>{title}</span>
        </button>
        <div className="sheet-group-tools">
          <button
            type="button"
            className="icon-button"
            onClick={() => api.moveClause(item.id, -1)}
            disabled={index === 0}
            aria-label={`${number} を上へ`}
            title="上へ"
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => api.moveClause(item.id, 1)}
            disabled={index === count - 1}
            aria-label={`${number} を下へ`}
            title="下へ"
          >
            ↓
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => api.removeClause(item.id)}
            aria-label={`${number} をシートから外す`}
            title="シートから外す"
          >
            ✕
          </button>
        </div>
      </div>

      {detail?.commentary?.plainSummary ? (
        <p className="sheet-group-summary">{detail.commentary.plainSummary}</p>
      ) : null}

      <ul className="sheet-rows">
        {rows.map((row) => (
          <li
            key={row.key}
            className={`sheet-row ${row.state ? `is-${row.state}` : ""}`}
          >
            <span className="sheet-row-text">
              {row.custom ? <span className="sheet-row-own">追加</span> : null}
              {row.text}
            </span>
            <span className="sheet-row-actions">
              <span
                className="sheet-states"
                role="group"
                aria-label={`判定：${row.text}`}
              >
                {STATES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`sheet-state sheet-state-${s.value} ${
                      row.state === s.value ? "is-on" : ""
                    }`}
                    aria-pressed={row.state === s.value}
                    onClick={() => api.setCheck(item.id, row.key, s.value)}
                  >
                    <span aria-hidden="true">{s.mark}</span>
                    {CHECK_LABEL[s.value]}
                  </button>
                ))}
              </span>
              {row.custom ? (
                <button
                  type="button"
                  className="sheet-row-remove"
                  onClick={() => api.removeExtra(item.id, row.key)}
                  aria-label={`追加した項目「${row.text}」を消す`}
                >
                  消す
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      <form className="sheet-extra" onSubmit={submitExtra}>
        <input
          type="text"
          className="sheet-input"
          value={extraText}
          maxLength={300}
          onChange={(e) => setExtraText(e.target.value)}
          placeholder="確認項目を足す（特記仕様書の内容など）"
          aria-label={`${number} に確認項目を足す`}
        />
        <button
          type="submit"
          className="sheet-btn"
          disabled={!extraText.trim()}
        >
          ＋ 足す
        </button>
      </form>

      <label className="sheet-note">
        <span className="sheet-note-label">備考</span>
        <textarea
          className="sheet-input sheet-textarea"
          value={item.note}
          rows={2}
          maxLength={4000}
          onChange={(e) => api.setNote(item.id, e.target.value)}
          placeholder="是正の内容、測った値、写真番号など"
        />
      </label>
    </li>
  );
};

/** 紙・PDF 用の表（画面では非表示） */
const SheetPrint: React.FC<{
  name: string;
  site: string;
  date: string;
  inspector: string;
  groups: SheetGroup[];
}> = ({ name, site, date, inspector, groups }) => {
  let no = 0;
  return (
    <div className="sheet-print">
      <div className="sheet-print-app">{APP_NAME}　検査チェックシート</div>
      <h2 className="sheet-print-title">{name}</h2>
      <table className="sheet-print-meta">
        <tbody>
          <tr>
            <th>工事名</th>
            <td>{site}</td>
            <th>検査日</th>
            <td>{formatJaDate(date)}</td>
          </tr>
          <tr>
            <th>確認者</th>
            <td>{inspector}</td>
            <th>確認印</th>
            <td className="sheet-print-stamp" />
          </tr>
        </tbody>
      </table>
      <table className="sheet-print-table">
        <thead>
          <tr>
            <th className="col-no">No.</th>
            <th className="col-clause">条項</th>
            <th>確認項目</th>
            <th className="col-state">判定</th>
            <th className="col-note">備考</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) =>
            g.rows.map((r, i) => {
              no++;
              return (
                <tr key={`${g.item.id}-${r.key}`}>
                  <td className="col-no">{no}</td>
                  {i === 0 ? (
                    <td className="col-clause" rowSpan={g.rows.length}>
                      <strong>{g.detail?.number ?? g.item.id}</strong>
                      <br />
                      {g.detail?.title ?? ""}
                    </td>
                  ) : null}
                  <td>{r.text}</td>
                  <td className="col-state">
                    {r.state ? CHECK_LABEL[r.state] : "適・否・対象外"}
                  </td>
                  {i === 0 ? (
                    <td className="col-note" rowSpan={g.rows.length}>
                      {g.item.note}
                    </td>
                  ) : null}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <p className="sheet-print-foot">
        条項は「公共建築工事標準仕様書（建築工事編）令和7年版」（国土交通省）による。確認項目は社内作成の補足であり、
        実務上の判断は原文及び設計図書（特記仕様書等）によってください。
      </p>
    </div>
  );
};

const SheetView: React.FC<Props> = ({
  api,
  allDetails,
  detailsById,
  onOpenClause,
  onGoSearch,
  notify,
}) => {
  const { state, active } = api;
  const [starter, setStarter] = useState("");

  const groups = useMemo(
    () => (active ? buildGroups(active, detailsById) : []),
    [active, detailsById]
  );
  const progress = useMemo(() => countProgress(groups), [groups]);

  // 「章から作る」用：チェックポイントのある条項を章ごとに集める
  const starters = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of allDetails) {
      if (!d.commentary?.points?.length) continue;
      const chapter = d.categoryPath?.[0];
      if (!chapter) continue;
      const list = map.get(chapter);
      if (list) list.push(d.id);
      else map.set(chapter, [d.id]);
    }
    return Array.from(map, ([chapter, ids]) => ({ chapter, ids }));
  }, [allDetails]);

  const createFromChapter = () => {
    const picked = starters.find((s) => s.chapter === starter);
    if (!picked) return;
    api.createSheet(`${picked.chapter} チェック`, picked.ids);
    setStarter("");
    notify(`✓ 「${picked.chapter}」の${picked.ids.length}条項でシートを作りました`);
  };

  const starterBox = (
    <div className="sheet-starter">
      <label className="sheet-field">
        <span className="sheet-field-label">章からまとめて作る</span>
        <select
          className="sheet-input"
          value={starter}
          onChange={(e) => setStarter(e.target.value)}
        >
          <option value="">章を選ぶ…</option>
          {starters.map((s) => (
            <option key={s.chapter} value={s.chapter}>
              {s.chapter}（チェックポイントつき {s.ids.length}条項）
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="sheet-btn"
        onClick={createFromChapter}
        disabled={!starter}
      >
        この章でシートを作る
      </button>
    </div>
  );

  if (!active) {
    return (
      <div className="sheet-view">
        <div className="sheet-screen">
          <h2 className="view-title">📋 検査チェックシート</h2>
          <div className="view-empty">
            <p className="view-empty-lead">
              条項を選ぶだけで、その条項の「現場でのチェックポイント」が検査用の表になります。
            </p>
            <ol className="view-steps">
              <li>
                「さがす」で条項を開き、<strong>📋 シート</strong>
                を押す（カードの 📋 でも入れられます）
              </li>
              <li>ここで 適合・要是正・対象外 を付け、備考を書く</li>
              <li>印刷・PDF、Excel 用の CSV、チャット用のテキストで出す</li>
            </ol>
            <div className="view-empty-actions">
              <button
                type="button"
                className="recovery-primary"
                onClick={onGoSearch}
              >
                条項をさがして入れる
              </button>
            </div>
            {starterBox}
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    const text = sheetToText(active, groups);
    try {
      await navigator.clipboard.writeText(text);
      notify("✓ テキストをコピーしました。チャットやメールに貼り付けできます");
    } catch {
      window.prompt("コピーしてください:", text);
    }
  };

  const handleCsv = () => {
    downloadText(
      `${safeFileName(active.name)}_${active.date || "日付なし"}.csv`,
      sheetToCsv(active, groups),
      "text/csv;charset=utf-8"
    );
    notify("✓ CSV を保存しました。Excel で開けます");
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `「${active.name}」を削除します。判定・備考も消え、元に戻せません。よろしいですか？`
      )
    ) {
      api.deleteSheet(active.id);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "このシートの判定と備考をすべて消します（条項と追加した項目は残ります）。よろしいですか？"
      )
    ) {
      api.resetChecks();
    }
  };

  const percent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="sheet-view">
      <div className="sheet-screen">
        <div className="view-head">
          <h2 className="view-title">📋 検査チェックシート</h2>
          <div className="sheet-switch">
            <label className="sr-only" htmlFor="sheet-select">
              シートを選ぶ
            </label>
            <select
              id="sheet-select"
              className="sheet-input"
              value={active.id}
              onChange={(e) => api.selectSheet(e.target.value)}
            >
              {state.sheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}（{s.items.length}条項）
                </option>
              ))}
            </select>
            <button
              type="button"
              className="sheet-btn"
              onClick={() => api.createSheet()}
            >
              ＋ 新しいシート
            </button>
          </div>
        </div>

        <div className="sheet-meta">
          <label className="sheet-field">
            <span className="sheet-field-label">シート名</span>
            <input
              type="text"
              className="sheet-input"
              value={active.name}
              maxLength={80}
              onChange={(e) => api.updateMeta({ name: e.target.value })}
            />
          </label>
          <label className="sheet-field">
            <span className="sheet-field-label">工事名</span>
            <input
              type="text"
              className="sheet-input"
              value={active.site}
              maxLength={120}
              onChange={(e) => api.updateMeta({ site: e.target.value })}
            />
          </label>
          <label className="sheet-field">
            <span className="sheet-field-label">検査日</span>
            <input
              type="date"
              className="sheet-input"
              value={active.date}
              onChange={(e) => api.updateMeta({ date: e.target.value })}
            />
          </label>
          <label className="sheet-field">
            <span className="sheet-field-label">確認者</span>
            <input
              type="text"
              className="sheet-input"
              value={active.inspector}
              maxLength={60}
              onChange={(e) => api.updateMeta({ inspector: e.target.value })}
            />
          </label>
        </div>

        {groups.length > 0 ? (
          <>
            <div className="sheet-progress" role="status">
              <div className="sheet-progress-text">
                確認 <strong>{progress.done}</strong> / {progress.total} 項目
                {progress.ng > 0 ? (
                  <span className="sheet-progress-ng">
                    要是正 {progress.ng}
                  </span>
                ) : null}
              </div>
              <div className="progress-bar" aria-hidden="true">
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>

            <div className="sheet-actions">
              <button
                type="button"
                className="sheet-btn sheet-btn-primary"
                onClick={() => window.print()}
              >
                🖨 印刷・PDF
              </button>
              <button type="button" className="sheet-btn" onClick={handleCsv}>
                ⬇ Excel 用 CSV
              </button>
              <button type="button" className="sheet-btn" onClick={handleCopy}>
                📄 テキストでコピー
              </button>
              <button type="button" className="sheet-btn" onClick={onGoSearch}>
                ＋ 条項を足す
              </button>
            </div>

            <ol className="sheet-groups">
              {groups.map((g, i) => (
                <SheetGroupCard
                  key={g.item.id}
                  group={g}
                  index={i}
                  count={groups.length}
                  api={api}
                  onOpenClause={onOpenClause}
                />
              ))}
            </ol>
          </>
        ) : (
          <div className="view-empty">
            <p className="view-empty-lead">
              このシートにはまだ条項がありません。「さがす」で条項を開いて
              <strong> 📋 シート </strong>
              を押すと、ここに確認項目が並びます。
            </p>
            <div className="view-empty-actions">
              <button
                type="button"
                className="recovery-primary"
                onClick={onGoSearch}
              >
                条項をさがして入れる
              </button>
            </div>
          </div>
        )}

        <div className="sheet-manage">
          {starterBox}
          <div className="sheet-danger">
            {groups.length > 0 ? (
              <button type="button" className="sheet-btn" onClick={handleReset}>
                判定と備考を消して使い回す
              </button>
            ) : null}
            <button
              type="button"
              className="sheet-btn sheet-btn-danger"
              onClick={handleDelete}
            >
              このシートを削除
            </button>
          </div>
        </div>

        <p className="view-note">
          確認項目は、各条項のやさしい解説にある「現場でのチェックポイント」（社内作成の補足）です。
          実務上の判断は原文と設計図書（特記仕様書等）を正としてください。シートはこの端末の中だけに保存されます。
        </p>
      </div>

      <SheetPrint
        name={active.name}
        site={active.site}
        date={active.date}
        inspector={active.inspector}
        groups={groups}
      />
    </div>
  );
};

export default SheetView;
