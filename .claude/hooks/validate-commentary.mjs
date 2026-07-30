#!/usr/bin/env node
// やさしい解説（src/commentary/*.ts）の整合性を検証する PostToolUse フック。
//
// ビルドでも画面でも検知できない「無言の失敗」を止めるのが目的:
//   1. 条項番号キーが spec_index.json に存在しない（＝解説が永久に表示されない）
//   2. 章ファイル間でキーが重複（＝index.ts の spread で後勝ちし、片方が消える）
//   3. 章ファイルが index.ts に import / spread されていない（＝章まるごと消える）
//   4. SVG が DESIGN.md の規約違反（currentColor 以外の色＝ダークテーマで破綻、
//      role/aria-label 欠落＝図解の内容が非視覚利用者に届かない）
//   5. aria-label に対応するAI生成写真が無い（aria-label は
//      src/utils/diagramPhoto.ts のハッシュ元＝写真のファイル名。ラベルを1文字直すと
//      photo-xxxx.webp が 404 になり、写真が黙って消える）
//
// 検証エラー: exit 2（stderr が Claude に返る） / 内部エラー: exit 1（利用者にのみ表示）

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const COMMENTARY_DIR = join(ROOT, "src", "commentary");
const INDEX_JSON = join(ROOT, "src", "spec_index.json");

/** 条項エントリ（例: `  "21.2.2": {`）。glossary の term などとは形が違うので誤検出しない */
const ENTRY_RE = /^[ \t]*"(\d+\.\d+\.\d+)"\s*:\s*\{/gm;
const SVG_RE = /<svg\b[\s\S]*?<\/svg>/g;
const PAINT_RE = /\b(fill|stroke)="([^"]*)"/g;
/** テーマ追従のため、色は currentColor / none / inherit / url(#...) のみ許可 */
const ALLOWED_PAINT = new Set(["currentcolor", "none", "inherit", "transparent"]);

const PHOTO_DIR = join(ROOT, "public", "diagrams");
const MANIFEST = join(PHOTO_DIR, "manifest.json");

const errors = [];
const warnings = [];

/** src/utils/diagramPhoto.ts / scripts/build_diagram_photo_manifest.mjs と同一の FNV-1a */
function hashLabel(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function targetsCommentary(payload) {
  const p =
    payload?.tool_input?.file_path ??
    payload?.tool_input?.filePath ??
    payload?.tool_input?.path ??
    "";
  const norm = String(p).replace(/\\/g, "/");
  return (
    /\/src\/commentary\/[^/]+\.ts$/.test(norm) || /\/src\/spec_index\.json$/.test(norm)
  );
}

function validate() {
  const specIds = new Set(
    JSON.parse(readFileSync(INDEX_JSON, "utf8")).details.map((d) => d.id)
  );

  const files = readdirSync(COMMENTARY_DIR)
    .filter((f) => /^ch\d{2}\.ts$/.test(f))
    .sort();

  const seen = new Map(); // 条項番号 -> 最初に定義したファイル
  const labelHashes = new Map(); // aria-labelのハッシュ -> 最初に使った場所
  const missingPhotos = [];
  let total = 0;

  for (const file of files) {
    const chapterNum = Number(file.slice(2, 4));
    const path = join(COMMENTARY_DIR, file);
    const src = readFileSync(path, "utf8");

    // --- 条項番号キー ---
    for (const m of src.matchAll(ENTRY_RE)) {
      const id = m[1];
      const line = lineOf(src, m.index);
      const where = `${file}:${line}`;
      total += 1;

      if (!specIds.has(id)) {
        errors.push(
          `${where}  条項 "${id}" は spec_index.json に存在しません（番号の誤りか、原文側の再生成漏れ）。この解説は画面に一生表示されません。`
        );
      }
      if (Number(id.split(".")[0]) !== chapterNum) {
        errors.push(
          `${where}  条項 "${id}" が ${chapterNum}章のファイルにあります。${id.split(".")[0]}章のファイルへ移してください。`
        );
      }
      const prev = seen.get(id);
      if (prev) {
        errors.push(
          `${where}  条項 "${id}" が ${prev} と重複しています。index.ts の spread で後勝ちするため、片方が無言で消えます。`
        );
      } else {
        seen.set(id, where);
      }
    }

    // --- SVG 規約（DESIGN.md） ---
    for (const svgMatch of src.matchAll(SVG_RE)) {
      const svg = svgMatch[0];
      const line = lineOf(src, svgMatch.index);
      const where = `${file}:${line}`;

      if (!/\bviewBox="/.test(svg)) {
        errors.push(`${where}  SVG に viewBox がありません（拡大縮小が壊れます）。`);
      }
      if (!/\brole="img"/.test(svg)) {
        errors.push(`${where}  SVG に role="img" がありません。`);
      }
      const label = svg.match(/\baria-label="([^"]*)"/);
      if (!label) {
        errors.push(
          `${where}  SVG に aria-label がありません。図解の内容（寸法・数値を含む）を文章で書いてください。`
        );
      } else if (label[1].trim().length < 15) {
        warnings.push(
          `${where}  aria-label が短すぎます（"${label[1]}"）。図中の数値・条件が読み上げだけで伝わるか確認してください。`
        );
      }

      // aria-label は AI生成写真のファイル名のハッシュ元でもある
      if (label) {
        const text = label[1].trim();
        const hash = hashLabel(text);
        const prev = labelHashes.get(hash);
        if (prev) {
          errors.push(
            `${where}  aria-label が ${prev} と完全に同一です（ハッシュ ${hash} が衝突し、build_diagram_photo_manifest.mjs が失敗します）。図ごとに違う説明にしてください。`
          );
        } else {
          labelHashes.set(hash, where);
        }
        if (!existsSync(join(PHOTO_DIR, `photo-${hash}.webp`))) {
          missingPhotos.push({ where, hash, text });
        }
      }
      for (const paint of svg.matchAll(PAINT_RE)) {
        const value = paint[2].trim();
        if (ALLOWED_PAINT.has(value.toLowerCase()) || /^url\(/.test(value)) continue;
        errors.push(
          `${where}  ${paint[1]}="${value}" は色の直書きです。ライト/ダーク両テーマに追従させるため currentColor を使ってください。`
        );
      }
    }
  }

  // --- index.ts への登録漏れ ---
  const indexSrc = readFileSync(join(COMMENTARY_DIR, "index.ts"), "utf8");
  for (const file of files) {
    const name = file.replace(/\.ts$/, "");
    const imported = new RegExp(`import\\s+${name}\\s+from\\s+"\\./${name}"`).test(
      indexSrc
    );
    const spread = new RegExp(`\\.\\.\\.${name}\\s*,`).test(indexSrc);
    if (!imported || !spread) {
      const missing = !imported ? `import ${name} from "./${name}"` : `...${name},`;
      errors.push(
        `index.ts  ${file} の \`${missing}\` がありません。この章の解説がまるごと表示されません。`
      );
    }
  }

  // --- AI生成写真（aria-label のハッシュで紐づく）---
  if (missingPhotos.length) {
    warnings.push(
      `対応する写真が無い図解が ${missingPhotos.length} 件あります（写真は表示されず、SVGにフォールバックします）:\n` +
        missingPhotos
          .map((m) => `      ${m.where}  photo-${m.hash}.webp が未生成 ／ label: 「${m.text.slice(0, 40)}…」`)
          .join("\n") +
        `\n      aria-label を編集した場合はハッシュが変わります。node scripts/build_diagram_photo_manifest.mjs でマニフェストを更新し、写真を生成し直してください。`
    );
  }
  if (existsSync(MANIFEST)) {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
    const known = new Set(manifest.diagrams.map((d) => d.hash));
    const unknown = [...labelHashes.keys()].filter((h) => !known.has(h));
    if (unknown.length) {
      warnings.push(
        `public/diagrams/manifest.json が古くなっています（未登録の図解 ${unknown.length} 件）。node scripts/build_diagram_photo_manifest.mjs を実行してください。`
      );
    }
  }

  return {
    total,
    unique: seen.size,
    files: files.length,
    diagrams: labelHashes.size,
  };
}

const raw = readStdin();
let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  payload = {};
}
if (!targetsCommentary(payload)) process.exit(0);

let stats;
try {
  stats = validate();
} catch (e) {
  console.error(`[validate-commentary] 検証を実行できませんでした: ${e.message}`);
  process.exit(1);
}

if (errors.length) {
  console.error(
    `解説データの整合性エラー ${errors.length} 件（解説 ${stats.unique}件 / ${stats.files}章）:\n` +
      errors.map((e) => `  ✗ ${e}`).join("\n") +
      (warnings.length ? "\n" + warnings.map((w) => `  △ ${w}`).join("\n") : "") +
      "\n\n上記を修正してください。"
  );
  process.exit(2);
}

if (warnings.length) {
  console.error(
    `解説データの注意 ${warnings.length} 件:\n` + warnings.map((w) => `  △ ${w}`).join("\n")
  );
  process.exit(1);
}

process.exit(0);
