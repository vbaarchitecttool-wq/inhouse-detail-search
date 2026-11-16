// 自分のデータ（お気に入り・メモ・チェックシート・学習記録）の書き出しと読み込み。
// データは端末のブラウザにしか無いので、機種変更・PC入替え・ブラウザの掃除で消える。
// ファイル1つに書き出しておけば、別の端末でも続きから使える。

import {
  sanitizeIdList,
  sanitizeNotes,
  sanitizeQuizStats,
  sanitizeSheets,
} from "./storage";
import type { UserData } from "../types";

const APP_ID = "na-spec-viewer";
const FORMAT_VERSION = 1;

export const serializeBackup = (data: UserData, now: Date = new Date()): string =>
  JSON.stringify(
    {
      app: APP_ID,
      version: FORMAT_VERSION,
      exportedAt: now.toISOString(),
      data,
    },
    null,
    2
  );

/** このアプリのバックアップでなければ null */
export const parseBackup = (text: string): UserData | null => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const file = raw as Record<string, unknown>;
  if (file.app !== APP_ID || typeof file.data !== "object" || file.data === null) {
    return null;
  }
  const d = file.data as Record<string, unknown>;
  return {
    favorites: sanitizeIdList(d.favorites),
    notes: sanitizeNotes(d.notes),
    sheets: sanitizeSheets(d.sheets),
    readIds: sanitizeIdList(d.readIds),
    quizStats: sanitizeQuizStats(d.quizStats),
  };
};

export const summarizeUserData = (data: UserData): string =>
  [
    `お気に入り ${data.favorites.length}件`,
    `メモ ${Object.keys(data.notes).length}件`,
    `チェックシート ${data.sheets.sheets.length}枚`,
    `読んだ条項 ${data.readIds.length}件`,
  ].join("・");

/** 文字列をファイルとして保存させる */
export const downloadText = (
  fileName: string,
  text: string,
  mime: string
): void => {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
