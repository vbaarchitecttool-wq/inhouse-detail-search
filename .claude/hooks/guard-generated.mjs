#!/usr/bin/env node
// 生成物への直接書き込みを止める PreToolUse フック。
//
// src/spec_index.json は scripts/extract_spec.py が PDF から生成する成果物。
// 手で直すと次回の抽出で消えるうえ、原文（正）と画面表示がずれる。
// 修正が必要なら /reindex-spec（抽出器の見直し）を通す。

import { readFileSync } from "node:fs";

const GUARDED = [
  {
    pattern: /\/src\/spec_index\.json$/,
    reason:
      "src/spec_index.json は scripts/extract_spec.py が PDF から生成する成果物です。手で編集しても次回の抽出で失われ、原文と画面がずれます。",
    instead:
      "原文を直す必要がある場合は scripts/extract_spec.py の抽出ロジックを修正し、/reindex-spec で再生成してください。",
  },
  {
    pattern: /\/package-lock\.json$/,
    reason: "package-lock.json は npm が生成するロックファイルです。",
    instead: "依存を変えるなら npm install / npm uninstall を実行してください。",
  },
];

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
if (!file) process.exit(0);

for (const g of GUARDED) {
  if (g.pattern.test(file)) {
    console.error(`書き込みをブロックしました: ${file}\n${g.reason}\n${g.instead}`);
    process.exit(2);
  }
}

process.exit(0);
