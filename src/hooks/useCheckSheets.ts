import { useCallback, useEffect, useMemo, useState } from "react";
import { loadSheets, saveSheets } from "../utils/storage";
import * as ops from "../utils/sheet";
import type { CheckSheet, CheckState, SheetsState } from "../types";

export interface CheckSheetsApi {
  state: SheetsState;
  active: CheckSheet | null;
  /** 使用中のシートに入っている条項ID */
  activeIds: Set<string>;
  /** 条項を出し入れする。戻り値は操作後に「入っている」かどうか */
  toggleClause: (clauseId: string) => boolean;
  createSheet: (name?: string, clauseIds?: string[]) => void;
  deleteSheet: (sheetId: string) => void;
  selectSheet: (sheetId: string) => void;
  updateMeta: (
    patch: Partial<Pick<CheckSheet, "name" | "site" | "date" | "inspector">>
  ) => void;
  removeClause: (clauseId: string) => void;
  moveClause: (clauseId: string, delta: number) => void;
  setCheck: (clauseId: string, key: string, value: CheckState) => void;
  setNote: (clauseId: string, note: string) => void;
  addExtra: (clauseId: string, text: string) => void;
  removeExtra: (clauseId: string, key: string) => void;
  resetChecks: () => void;
  /** バックアップの読み込み用 */
  replaceAll: (next: SheetsState) => void;
}

/** 検査チェックシートの状態。変更のたびに端末へ保存する */
export default function useCheckSheets(): CheckSheetsApi {
  const [state, setState] = useState<SheetsState>(() => loadSheets());

  useEffect(() => {
    saveSheets(state);
  }, [state]);

  const active = useMemo(() => ops.getActiveSheet(state), [state]);
  const activeIds = useMemo(
    () => new Set((active?.items ?? []).map((it) => it.id)),
    [active]
  );

  const toggleClause = useCallback(
    (clauseId: string): boolean => {
      const fallback = ops.createSheet(
        ops.makeId("s"),
        ops.nextSheetName(state.sheets)
      );
      setState((prev) => ops.toggleClause(prev, clauseId, fallback));
      return !activeIds.has(clauseId);
    },
    [state.sheets, activeIds]
  );

  const createSheet = useCallback((name?: string, clauseIds: string[] = []) => {
    const id = ops.makeId("s");
    setState((prev) =>
      ops.addSheet(
        prev,
        ops.createSheet(id, name || ops.nextSheetName(prev.sheets), clauseIds)
      )
    );
  }, []);

  const deleteSheet = useCallback(
    (sheetId: string) => setState((prev) => ops.removeSheet(prev, sheetId)),
    []
  );
  const selectSheet = useCallback(
    (sheetId: string) => setState((prev) => ops.selectSheet(prev, sheetId)),
    []
  );
  const updateMeta = useCallback<CheckSheetsApi["updateMeta"]>(
    (patch) => setState((prev) => ops.updateSheetMeta(prev, patch)),
    []
  );
  const removeClause = useCallback(
    (clauseId: string) => setState((prev) => ops.removeClause(prev, clauseId)),
    []
  );
  const moveClause = useCallback(
    (clauseId: string, delta: number) =>
      setState((prev) => ops.moveClause(prev, clauseId, delta)),
    []
  );
  const setCheck = useCallback(
    (clauseId: string, key: string, value: CheckState) =>
      setState((prev) => ops.setCheck(prev, clauseId, key, value)),
    []
  );
  const setNote = useCallback(
    (clauseId: string, note: string) =>
      setState((prev) => ops.setItemNote(prev, clauseId, note)),
    []
  );
  const addExtra = useCallback((clauseId: string, text: string) => {
    const key = ops.makeId("x");
    setState((prev) => ops.addExtra(prev, clauseId, key, text));
  }, []);
  const removeExtra = useCallback(
    (clauseId: string, key: string) =>
      setState((prev) => ops.removeExtra(prev, clauseId, key)),
    []
  );
  const resetChecks = useCallback(
    () => setState((prev) => ops.resetChecks(prev)),
    []
  );
  const replaceAll = useCallback((next: SheetsState) => setState(next), []);

  return {
    state,
    active,
    activeIds,
    toggleClause,
    createSheet,
    deleteSheet,
    selectSheet,
    updateMeta,
    removeClause,
    moveClause,
    setCheck,
    setNote,
    addExtra,
    removeExtra,
    resetChecks,
    replaceAll,
  };
}
