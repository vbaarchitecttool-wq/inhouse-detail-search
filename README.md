# NA 建築工事標準仕様書

公共建築工事標準仕様書（建築工事編）令和7年版（国土交通省）をベースにした、ノムラアークス社内向けの検索・閲覧ツール。

- 左サイドバーに 1章〜23章 →（展開で）各節のカテゴリツリー
- 1件 =「項」（例: `5.3.2 加工`）。約800条項を全文検索
- 各条項は「📖 原文」＋「🧑‍🏫 やさしい解説（一言でいうと / なぜ / チェックポイント / 図解 / 用語）」の2部構成
- お気に入り・最近見た・URL共有・PWAオフライン対応

## 開発

```bash
npm install
npm start        # 開発サーバー
npm run build    # 本番ビルド
```

## データ更新

原文データ（`src/spec_index.json`）はPDFから再生成する。**直接上書きせず** `/reindex-spec` を使う（消える条項・孤立する解説を先に検出するため）：

```bash
python scripts/extract_spec.py <仕様書PDF> <一時ファイル>
node .claude/skills/reindex-spec/compare-index.mjs <一時ファイル>   # 差分を確認してから上書き
```

やさしい解説は `src/commentary/` で章ごとに分離管理しており、再生成しても消えない。

## Claude Code の自動化（`.claude/`）

| 種別 | 名前 | 役割 |
|---|---|---|
| フック | `validate-commentary.mjs` | 解説の条項番号が原文に存在するか・重複・`index.ts` への登録漏れ・SVG規約・`aria-label` に対応するAI生成写真の有無を編集時に検査（PostToolUse） |
| フック | `typecheck.mjs` | `.ts/.tsx` 編集時に `tsc --noEmit`（増分・約2秒） |
| フック | `guard-generated.mjs` | 生成物（`spec_index.json`・`package-lock.json`）への直接書き込みをブロック（PreToolUse） |
| フック | `trigger-ui-skills.mjs` | UIファイル編集時にUI品質スキル群を促す（セッション1回のみ） |
| エージェント | `commentary-reviewer` | 解説を章単位でレビュー（原文との数値矛盾・「なぜ」の有無・トーン） |
| エージェント | `diagram-reviewer` | SVG図解をレビュー（aria-labelと図中数値の一致・viewBox破綻） |
| スキル | `/new-commentary <条項番号>` | 原文取得→雛形→正しい位置へ挿入まで一式 |
| スキル | `/reindex-spec` | 原文インデックスの安全な再生成 |
| MCP | `playwright` / `context7` | ブラウザ実操作での動作確認 / ライブラリ公式ドキュメント参照 |

`.mcp.json` は初回セッションで承認が必要。Playwright は既定で Edge を使う（`--browser` で変更可）。

## 出典

原文は「公共建築工事標準仕様書（建築工事編）令和7年版」（国土交通省大臣官房官庁営繕部）による。解説・図解は社内作成の補足であり、実務判断は原文と設計図書を正とする。
