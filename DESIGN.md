# Design

既存コードから抽出した視覚システムの記録。変更時はこのファイルも更新する。

## Theme

ライト/ダーク両対応（`data-theme` 属性 + `prefers-color-scheme` フォールバック）。CSSカスタムプロパティで一元管理（`src/styles.css` の `:root` / `[data-theme="dark"]`）。

## Color Tokens

- `--bg` 背景: `#f9fafb` / dark `#0b1020`
- `--text` 本文: `#111827` / dark `#e5e7eb`（`--text-soft` `--text-softer` の段階あり）
- `--muted` 補助: `#6b7280` / dark `#94a3b8`
- `--accent` アクセント: `#2563eb` / dark `#60a5fa`（主要アクション・選択状態のみに使用）
- 仕様書ビューア追加トークン: `--original-bg`（原文ブロック地）, `--commentary-bg`（解説ブロック地）— 原文＝中立・解説＝わずかに暖色で役割を色分けする

## Typography

- システムサンセリフ1系統（product register）。見出しはウェイトとサイズで階層化
- 条項番号はタブラー数字・等幅寄せの番号チップ（`.spec-number`）
- 条文本文は `line-height: 1.9` 前後、最大行長 72ch 程度で可読性優先

## Components

- カード（`.detail-card`）: グリッド/リスト両対応。番号チップ＋タイトル＋スニペット＋バッジ（💡解説/🖼図解）
- モーダル記事ビュー（`.spec-*`）: 一言でいうと → 原文 → やさしい解説（なぜ/チェックポイント/図解/用語）→ 出典注記
- チップ（`.chip`）: 絞り込み条件の解除UI
- バッジ（`.badge-commentary` `.badge-diagram`）: コンテンツ有無の表示

## Motion

150–250ms、状態変化のみ。`prefers-reduced-motion` 尊重。装飾モーションなし。

## Layout

ヘッダー＋検索セクション＋「サイドバー（章ツリー）｜結果グリッド」の2カラム。モバイルは1カラムに折り畳み。
