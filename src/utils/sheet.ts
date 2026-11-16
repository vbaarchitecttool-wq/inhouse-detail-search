// 検査チェックシート。
//
// 条項を選ぶと、その条項の「現場でのチェックポイント」（社内作成の解説）が確認項目として並ぶ。
// 判定（適合／要是正／対象外）と備考を付けて、印刷・PDF・Excel（CSV）・チャット用テキストに出す。
// 状態の更新はすべて「元の状態を変えずに新しい状態を返す」関数にして、単体テストできるようにする。

import type {
  CheckSheet,
  CheckState,
  Detail,
  SheetItem,
  SheetsState,
} from "../types";

/** チェックポイントが無い条項に置く、既定の確認項目のキー */
export const BASE_KEY = "base";

export const CHECK_LABEL: Record<CheckState, string> = {
  ok: "適合",
  ng: "要是正",
  na: "対象外",
};

export interface SheetRow {
  key: string;
  text: string;
  state: CheckState | null;
  /** 利用者が足した項目 */
  custom: boolean;
}

export interface SheetGroup {
  item: SheetItem;
  /** 原文データから消えた条項は null（番号だけ表示する） */
  detail: Detail | null;
  rows: SheetRow[];
}

export interface SheetProgress {
  total: number;
  done: number;
  ng: number;
}

const pad = (n: number): string => String(n).padStart(2, "0");

export const todayIso = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export const formatJaDate = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : "";
};

export const makeId = (prefix: string): string =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const newItem = (id: string): SheetItem => ({
  id,
  checks: {},
  extras: [],
  note: "",
});

export const createSheet = (
  id: string,
  name: string,
  clauseIds: string[] = [],
  date: string = todayIso()
): CheckSheet => ({
  id,
  name,
  site: "",
  date,
  inspector: "",
  items: Array.from(new Set(clauseIds)).map(newItem),
});

/** まだ使われていない「チェックシート n」を返す */
export const nextSheetName = (sheets: CheckSheet[]): string => {
  const used = new Set(sheets.map((s) => s.name));
  for (let i = sheets.length + 1; ; i++) {
    const name = `チェックシート ${i}`;
    if (!used.has(name)) return name;
  }
};

export const getActiveSheet = (state: SheetsState): CheckSheet | null =>
  state.sheets.find((s) => s.id === state.activeId) ?? null;

/** 条項の確認項目を組み立てる（解説のチェックポイント → 利用者が足した項目の順） */
export const buildRows = (item: SheetItem, detail: Detail | null): SheetRow[] => {
  const points = detail?.commentary?.points ?? [];
  const rows: SheetRow[] =
    points.length > 0
      ? points.map((text, i) => ({
          key: `p${i}`,
          text,
          state: item.checks[`p${i}`] ?? null,
          custom: false,
        }))
      : [
          {
            key: BASE_KEY,
            text: "原文の規定どおりであることを確認した",
            state: item.checks[BASE_KEY] ?? null,
            custom: false,
          },
        ];
  for (const extra of item.extras) {
    rows.push({
      key: extra.key,
      text: extra.text,
      state: item.checks[extra.key] ?? null,
      custom: true,
    });
  }
  return rows;
};

export const buildGroups = (
  sheet: CheckSheet,
  detailsById: Map<string, Detail>
): SheetGroup[] =>
  sheet.items.map((item) => {
    const detail = detailsById.get(item.id) ?? null;
    return { item, detail, rows: buildRows(item, detail) };
  });

export const countProgress = (groups: SheetGroup[]): SheetProgress => {
  let total = 0;
  let done = 0;
  let ng = 0;
  for (const g of groups) {
    for (const r of g.rows) {
      total++;
      if (r.state) done++;
      if (r.state === "ng") ng++;
    }
  }
  return { total, done, ng };
};

/* ------------------------------------------------------------------ */
/* 状態の更新                                                           */
/* ------------------------------------------------------------------ */

const mapActive = (
  state: SheetsState,
  fn: (sheet: CheckSheet) => CheckSheet
): SheetsState => ({
  ...state,
  sheets: state.sheets.map((s) => (s.id === state.activeId ? fn(s) : s)),
});

const mapItem = (
  state: SheetsState,
  clauseId: string,
  fn: (item: SheetItem) => SheetItem
): SheetsState =>
  mapActive(state, (sheet) => ({
    ...sheet,
    items: sheet.items.map((it) => (it.id === clauseId ? fn(it) : it)),
  }));

export const addSheet = (state: SheetsState, sheet: CheckSheet): SheetsState => ({
  sheets: [...state.sheets, sheet],
  activeId: sheet.id,
});

export const removeSheet = (state: SheetsState, sheetId: string): SheetsState => {
  const sheets = state.sheets.filter((s) => s.id !== sheetId);
  const activeId =
    state.activeId === sheetId ? sheets[0]?.id ?? null : state.activeId;
  return { sheets, activeId };
};

export const selectSheet = (state: SheetsState, sheetId: string): SheetsState =>
  state.sheets.some((s) => s.id === sheetId)
    ? { ...state, activeId: sheetId }
    : state;

export const updateSheetMeta = (
  state: SheetsState,
  patch: Partial<Pick<CheckSheet, "name" | "site" | "date" | "inspector">>
): SheetsState => mapActive(state, (sheet) => ({ ...sheet, ...patch }));

/**
 * 使用中のシートへ条項を出し入れする。シートが1枚も無ければ fallback を作って入れる。
 */
export const toggleClause = (
  state: SheetsState,
  clauseId: string,
  fallback: CheckSheet
): SheetsState => {
  if (!getActiveSheet(state)) {
    return addSheet(state, { ...fallback, items: [newItem(clauseId)] });
  }
  return mapActive(state, (sheet) => ({
    ...sheet,
    items: sheet.items.some((it) => it.id === clauseId)
      ? sheet.items.filter((it) => it.id !== clauseId)
      : [...sheet.items, newItem(clauseId)],
  }));
};

export const removeClause = (state: SheetsState, clauseId: string): SheetsState =>
  mapActive(state, (sheet) => ({
    ...sheet,
    items: sheet.items.filter((it) => it.id !== clauseId),
  }));

/** 同じ判定をもう一度押すと未確認に戻す */
export const setCheck = (
  state: SheetsState,
  clauseId: string,
  key: string,
  value: CheckState
): SheetsState =>
  mapItem(state, clauseId, (item) => {
    const checks = { ...item.checks };
    if (checks[key] === value) delete checks[key];
    else checks[key] = value;
    return { ...item, checks };
  });

export const setItemNote = (
  state: SheetsState,
  clauseId: string,
  note: string
): SheetsState => mapItem(state, clauseId, (item) => ({ ...item, note }));

export const addExtra = (
  state: SheetsState,
  clauseId: string,
  key: string,
  text: string
): SheetsState => {
  const t = text.trim();
  if (!t) return state;
  return mapItem(state, clauseId, (item) => ({
    ...item,
    extras: [...item.extras, { key, text: t }],
  }));
};

export const removeExtra = (
  state: SheetsState,
  clauseId: string,
  key: string
): SheetsState =>
  mapItem(state, clauseId, (item) => {
    const checks = { ...item.checks };
    delete checks[key];
    return {
      ...item,
      checks,
      extras: item.extras.filter((e) => e.key !== key),
    };
  });

export const moveClause = (
  state: SheetsState,
  clauseId: string,
  delta: number
): SheetsState =>
  mapActive(state, (sheet) => {
    const from = sheet.items.findIndex((it) => it.id === clauseId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= sheet.items.length) return sheet;
    const items = [...sheet.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    return { ...sheet, items };
  });

/** 判定と備考だけ消す（同じ項目で次の検査に使い回すため） */
export const resetChecks = (state: SheetsState): SheetsState =>
  mapActive(state, (sheet) => ({
    ...sheet,
    items: sheet.items.map((it) => ({ ...it, checks: {}, note: "" })),
  }));

/* ------------------------------------------------------------------ */
/* 書き出し                                                             */
/* ------------------------------------------------------------------ */

const clauseLabel = (g: SheetGroup): string =>
  g.detail ? `${g.detail.number} ${g.detail.title}` : `${g.item.id}（原文データにない条項）`;

const MARK: Record<CheckState, string> = { ok: "○", ng: "×", na: "―" };

/** チャット・メールに貼る用のテキスト */
export const sheetToText = (sheet: CheckSheet, groups: SheetGroup[]): string => {
  const p = countProgress(groups);
  const head = [
    `■ ${sheet.name}`,
    sheet.site ? `工事名：${sheet.site}` : "",
    sheet.date ? `検査日：${formatJaDate(sheet.date)}` : "",
    sheet.inspector ? `確認者：${sheet.inspector}` : "",
    `確認 ${p.done}/${p.total} 項目（要是正 ${p.ng}）`,
  ].filter(Boolean);
  const body = groups.map((g) => {
    const lines = [`【${clauseLabel(g)}】`];
    for (const r of g.rows) {
      lines.push(`  [${r.state ? MARK[r.state] : "　"}] ${r.text}`);
    }
    if (g.item.note.trim()) lines.push(`  備考：${g.item.note.trim()}`);
    return lines.join("\n");
  });
  return [
    head.join("\n"),
    ...body,
    "○=適合　×=要是正　―=対象外　／　確認項目は社内作成の補足です。判断は原文と設計図書によってください。",
  ].join("\n\n");
};

const csvCell = (v: string): string => {
  // Excel が式として解釈しないよう、= + - @ で始まる値は文字列として渡す
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Excel でそのまま開ける CSV（BOM つき UTF-8、CRLF） */
export const sheetToCsv = (sheet: CheckSheet, groups: SheetGroup[]): string => {
  const rows: string[][] = [
    ["シート名", sheet.name],
    ["工事名", sheet.site],
    ["検査日", sheet.date],
    ["確認者", sheet.inspector],
    [],
    ["No.", "条項番号", "条項名", "確認項目", "判定", "備考"],
  ];
  let no = 0;
  for (const g of groups) {
    g.rows.forEach((r, i) => {
      no++;
      rows.push([
        String(no),
        g.detail?.number ?? g.item.id,
        g.detail?.title ?? "",
        r.text,
        r.state ? CHECK_LABEL[r.state] : "",
        i === 0 ? g.item.note.trim() : "",
      ]);
    });
  }
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
};

/** ファイル名に使えない文字を除く */
export const safeFileName = (name: string): string =>
  (name || "チェックシート").replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 60);
