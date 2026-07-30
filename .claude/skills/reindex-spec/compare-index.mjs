#!/usr/bin/env node
// 新旧の spec_index.json を突き合わせ、上書きしてよいかを判断するための差分を出す。
//   使い方: node .claude/skills/reindex-spec/compare-index.mjs <新しいJSON> [現行JSON]
//
// 抽出器は「章.節.項」の連番一致で見出しを判定するため、PDFの版が変わると
// 1節まるごと無言で消えることがある。上書き前に必ずこれを通す。

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const newPath = process.argv[2];
const oldPath = process.argv[3] || join(ROOT, "src", "spec_index.json");

if (!newPath) {
  console.error("使い方: node .claude/skills/reindex-spec/compare-index.mjs <新しいJSON> [現行JSON]");
  process.exit(1);
}

const load = (p) => JSON.parse(readFileSync(p, "utf8"));
const oldIdx = load(oldPath);
const newIdx = load(newPath);

const oldMap = new Map(oldIdx.details.map((d) => [d.id, d]));
const newMap = new Map(newIdx.details.map((d) => [d.id, d]));

const removed = [...oldMap.keys()].filter((id) => !newMap.has(id));
const added = [...newMap.keys()].filter((id) => !oldMap.has(id));
const titleChanged = [];
const textChanged = [];
for (const [id, o] of oldMap) {
  const n = newMap.get(id);
  if (!n) continue;
  if (n.title !== o.title) titleChanged.push({ id, from: o.title, to: n.title });
  else if (n.original !== o.original) textChanged.push(id);
}

// 解説側の条項番号を集める
const cdir = join(ROOT, "src", "commentary");
const commentaryIds = new Set();
for (const f of readdirSync(cdir).filter((f) => /^ch\d{2}\.ts$/.test(f))) {
  const src = readFileSync(join(cdir, f), "utf8");
  for (const m of src.matchAll(/^[ \t]*"(\d+\.\d+\.\d+)"\s*:\s*\{/gm)) {
    commentaryIds.add(m[1]);
  }
}
const orphaned = [...commentaryIds].filter((id) => !newMap.has(id));
const uncovered = [...newMap.keys()].filter((id) => !commentaryIds.has(id));

const chCount = (idx) => {
  const m = new Map();
  for (const d of idx.details) {
    const ch = d.id.split(".")[0];
    m.set(ch, (m.get(ch) || 0) + 1);
  }
  return m;
};
const oc = chCount(oldIdx);
const nc = chCount(newIdx);

const line = "─".repeat(56);
console.log(line);
console.log(`現行: ${oldIdx.details.length} 条項 / ${oldIdx.categories.length} 章  (${oldIdx.generatedAt})`);
console.log(`新規: ${newIdx.details.length} 条項 / ${newIdx.categories.length} 章  (${newIdx.generatedAt})`);
console.log(line);

const chapters = [...new Set([...oc.keys(), ...nc.keys()])].sort((a, b) => a - b);
const diffRows = chapters
  .map((ch) => ({ ch, o: oc.get(ch) || 0, n: nc.get(ch) || 0 }))
  .filter((r) => r.o !== r.n);

if (diffRows.length) {
  console.log("\n■ 章ごとの条項数の変化");
  for (const r of diffRows) {
    const d = r.n - r.o;
    console.log(`  ${r.ch}章: ${r.o} → ${r.n} (${d > 0 ? "+" : ""}${d})${r.n === 0 ? "  ← 章が消えています" : ""}`);
  }
} else {
  console.log("\n■ 章ごとの条項数: 変化なし");
}

if (removed.length) {
  console.log(`\n🔴 消えた条項 ${removed.length}件  ← 抽出失敗の可能性が高い。PDFが実際に改訂されたのか確認すること`);
  console.log("  " + removed.join(", "));
}
if (added.length) {
  console.log(`\n🟢 増えた条項 ${added.length}件`);
  console.log("  " + added.map((id) => `${id} ${newMap.get(id).title}`).join("\n  "));
}
if (titleChanged.length) {
  console.log(`\n🟡 見出しが変わった条項 ${titleChanged.length}件`);
  for (const t of titleChanged) console.log(`  ${t.id}: 「${t.from}」→「${t.to}」`);
}
if (textChanged.length) {
  console.log(`\n・本文が変わった条項 ${textChanged.length}件`);
  console.log("  " + textChanged.slice(0, 30).join(", ") + (textChanged.length > 30 ? " …" : ""));
}

console.log("\n" + line);
if (orphaned.length) {
  console.log(`🔴 孤立する解説 ${orphaned.length}件`);
  console.log("  上書きすると、これらの手書き解説は紐づく原文を失い、画面に一生出なくなります:");
  console.log("  " + orphaned.join(", "));
} else {
  console.log("✅ 孤立する解説: なし（全ての解説が新しい原文に紐づく）");
}
console.log(`解説カバレッジ: ${newIdx.details.length - uncovered.length} / ${newIdx.details.length} 条項（未作成 ${uncovered.length}件）`);
console.log(line);

const risky = removed.length > 0 || orphaned.length > 0 || diffRows.some((r) => r.n === 0);
console.log(
  risky
    ? "\n判定: ⚠ 上書きしない。消えた条項・孤立解説の原因（PDFの改訂かextract_spec.pyの抽出漏れか）を先に確認すること。"
    : "\n判定: ✅ 破壊的な変化なし。上書きしてよい。"
);
process.exit(risky ? 1 : 0);
