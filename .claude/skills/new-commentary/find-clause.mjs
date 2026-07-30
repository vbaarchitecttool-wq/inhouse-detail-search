#!/usr/bin/env node
// 条項番号から、解説を書くのに必要な情報を全部出す。
//   使い方: node .claude/skills/new-commentary/find-clause.mjs 5.3.2
//
// 出力: 原文 / 既存解説の有無 / 挿入先ファイルと行 / 同じ節の前後条項 / 既存SVG定数一覧

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const id = process.argv[2];

if (!id || !/^\d+\.\d+\.\d+$/.test(id)) {
  console.error("使い方: node .claude/skills/new-commentary/find-clause.mjs <条項番号（例 5.3.2）>");
  process.exit(1);
}

const index = JSON.parse(readFileSync(join(ROOT, "src", "spec_index.json"), "utf8"));
const detail = index.details.find((d) => d.id === id);

if (!detail) {
  const near = index.details
    .filter((d) => d.id.startsWith(id.split(".").slice(0, 2).join(".") + "."))
    .map((d) => d.id);
  console.error(`条項 "${id}" は spec_index.json にありません。`);
  if (near.length) console.error(`同じ節の条項: ${near.join(", ")}`);
  process.exit(1);
}

const [ch, sec] = id.split(".").map(Number);
const file = `ch${String(ch).padStart(2, "0")}.ts`;
const path = join(ROOT, "src", "commentary", file);
const key = (s) => s.split(".").map(Number);
const cmp = (a, b) => {
  const [x, y] = [key(a), key(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

console.log(`=== ${detail.number} ${detail.title} ===`);
console.log(`分類: ${detail.categoryPath.join(" › ")}`);
console.log(`\n--- 原文（改変禁止・解説の根拠） ---\n${detail.original}\n`);

if (!existsSync(path)) {
  console.log(`--- 挿入先 ---\n${file} は存在しません。新規作成し、index.ts に import と spread を追加すること。`);
  process.exit(0);
}

const src = readFileSync(path, "utf8");
const entries = [...src.matchAll(/^[ \t]*"(\d+\.\d+\.\d+)"\s*:\s*\{/gm)].map((m) => ({
  id: m[1],
  line: src.slice(0, m.index).split("\n").length,
}));

const existing = entries.find((e) => e.id === id);
if (existing) {
  console.log(`--- 既存解説 ---\n${file}:${existing.line} に既に "${id}" の解説があります。新規作成ではなく編集すること。`);
} else {
  const after = entries.filter((e) => cmp(e.id, id) < 0).pop();
  const before = entries.find((e) => cmp(e.id, id) > 0);
  console.log(`--- 挿入先 ---\nファイル: src/commentary/${file}`);
  if (before) console.log(`位置: ${before.id}（${file}:${before.line}）の直前。番号順を崩さないこと。`);
  else if (after) console.log(`位置: ${after.id}（${file}:${after.line}）のブロックの直後（末尾）。`);
  else console.log(`位置: オブジェクトの先頭（このファイルにはまだ解説がありません）。`);
}

const sameSection = entries.filter((e) => e.id.startsWith(`${ch}.${sec}.`));
if (sameSection.length) {
  console.log(
    `\n--- 同じ節（${ch}.${sec}）の既存解説 ---\n` +
      sameSection.map((e) => `  ${e.id}  (${file}:${e.line})`).join("\n") +
      `\n※ 文体・用語・詳しさをこれらに揃えること。`
  );
}

const svgConsts = [...src.matchAll(/^const (SVG_\w+)\s*=/gm)].map((m) => m[1]);
if (svgConsts.length) {
  console.log(`\n--- この章の既存SVG定数（流用可） ---\n  ${svgConsts.join(", ")}`);
}

const total = index.details.filter((d) => d.id.startsWith(`${ch}.`)).length;
console.log(`\n--- 進捗 ---\n${ch}章: 原文 ${total}条項 / 解説済み ${entries.length}件`);
