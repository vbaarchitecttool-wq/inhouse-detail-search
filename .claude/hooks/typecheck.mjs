#!/usr/bin/env node
// .ts / .tsx 編集後に型チェックを走らせる PostToolUse フック。
//
// このプロジェクトにはテストが無く、netlify.toml が CI=false のため、
// 型の取り違え（例: Commentary.points を string[] でなく string で書く）が
// dev server を起動するまで表に出ない。編集直後に潰す。
//
// 増分ビルド情報を .claude/.cache に持たせ、2回目以降を数秒に抑える。

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
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
  payload = {};
}

const file = String(payload?.tool_input?.file_path ?? "").replace(/\\/g, "/");
if (!/\.tsx?$/.test(file)) process.exit(0);

mkdirSync(CACHE_DIR, { recursive: true });

const args = [
  "tsc",
  "--noEmit",
  "-p",
  join(ROOT, "tsconfig.json"),
  "--incremental",
  "--tsBuildInfoFile",
  join(CACHE_DIR, "tsconfig.tsbuildinfo"),
  "--pretty",
  "false",
];

try {
  execFileSync("npx", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
} catch (e) {
  const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
  if (!out) {
    console.error(`[typecheck] tsc を実行できませんでした: ${e.message}`);
    process.exit(1);
  }
  const lines = out.split("\n").filter((l) => l.trim());
  console.error(
    `TypeScript の型エラー（${lines.length}行）:\n` +
      lines.slice(0, 40).join("\n") +
      (lines.length > 40 ? `\n… 他 ${lines.length - 40} 行` : "") +
      "\n\n編集した箇所の型エラーを修正してください。"
  );
  process.exit(2);
}

process.exit(0);
