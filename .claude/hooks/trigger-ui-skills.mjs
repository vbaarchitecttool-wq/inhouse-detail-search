#!/usr/bin/env node
// UIファイル編集時に UI品質スキル群の読み込みを促す PostToolUse フック。
//
// 5スキルの内容は1セッション読めば足りるため、session_id ごとのマーカーで
// 初回のみ発火させる。（旧 trigger-ui-skills.sh は編集のたびに同じ要求を出していた）

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CACHE_DIR = join(ROOT, ".claude", ".cache");

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let payload = {};
try {
  payload = JSON.parse(readStdin() || "{}");
} catch {
  process.exit(0);
}

const file = String(payload?.tool_input?.file_path ?? "").replace(/\\/g, "/");
if (!/\.(tsx|jsx|vue|html|css)$/.test(file)) process.exit(0);

const sessionId = String(payload?.session_id ?? "unknown").replace(/[^\w-]/g, "");
const marker = join(CACHE_DIR, `ui-skills-${sessionId}`);
if (existsSync(marker)) process.exit(0);

mkdirSync(CACHE_DIR, { recursive: true });
writeFileSync(marker, new Date().toISOString());

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext:
        "フロントエンドUIファイルが編集されました。続けて以下5つのスキルをSkillツールで順番に呼び、UI品質を整えてください: (1) frontend-design (2) baseline-ui (3) fixing-accessibility (4) web-design-guidelines (5) impeccable。" +
        "この要求はセッション内で1回だけ出ます（以降の編集でも同じ基準を適用してください）。" +
        "判断基準は PRODUCT.md（register/トーン/アンチリファレンス）と DESIGN.md（トークン/タイポ/モーション）に従い、変更したらそちらも更新すること。",
    },
  })
);
process.exit(0);
