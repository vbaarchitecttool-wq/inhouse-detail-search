// ファイルパス解決ユーティリティ
//   - JSON内のパス: "/files/xxx.pdf"
//   - 環境変数 REACT_APP_FILES_BASE_URL が設定されていれば、それを前に付ける
//   - 既に http(s):// で始まっていればそのまま返す
//
// 例:
//   REACT_APP_FILES_BASE_URL=https://files.example.r2.dev
//   resolveFileUrl("/files/01.pdf") → "https://files.example.r2.dev/files/01.pdf"
//
// 未設定（ローカル開発時）はパスをそのまま返す → public/files/ から配信される

const BASE = (process.env.REACT_APP_FILES_BASE_URL || "").replace(/\/+$/, "");

export const resolveFileUrl = (path?: string | null): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!BASE) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
};
