---
name: reindex-spec
description: 仕様書PDFから src/spec_index.json を再生成する。一時ファイルに抽出して現行と差分を取り、消える条項・孤立する解説を確認してから上書きする。
disable-model-invocation: true
---

# 原文インデックスの再生成

`scripts/extract_spec.py` で PDF から `src/spec_index.json` を作り直す。

**いきなり上書きしないこと。** 抽出器は見出しを「章.節.項の連番が直前+1」という規則で判定しているため、PDFの版が変わって番号が飛ぶと、そこから先の1節が丸ごと本文として吸収され、**無言で消える**。804条項のうち何件が消えたかは、差分を取らないと分からない。

## 手順

### 1. 前提を確認

```bash
python -c "import pypdf; print(pypdf.__version__)"
```

`ModuleNotFoundError` なら `pip install pypdf`。**pypdf 以外のライブラリに差し替えないこと**（抽出結果の改行位置が変わり、全条項の原文が書き換わる）。

PDFのパスは引数で受け取る。指定が無ければ利用者に聞く（`public/files/` は .gitignore 対象で、リポジトリにPDFは入っていない）。

### 2. 一時ファイルへ抽出

```bash
python scripts/extract_spec.py "<PDFのパス>" "$TMP/spec_index.new.json"
```

標準出力に章ごとの節・項の件数が出る。ここで章が23未満、または節の件数が0の章があれば、その時点で抽出は失敗している。

### 3. 差分を取る（必須）

```bash
node .claude/skills/reindex-spec/compare-index.mjs "$TMP/spec_index.new.json"
```

報告される内容：

| 項目 | 意味 |
|---|---|
| 🔴 消えた条項 | 抽出漏れの可能性が高い。PDFが実際に改訂されたのか要確認 |
| 🟢 増えた条項 | PDF改訂なら正常 |
| 🟡 見出しの変化 | 改訂か、抽出時の行結合ミス |
| 🔴 **孤立する解説** | 上書きすると、その手書き解説は原文を失い画面に出なくなる |
| 解説カバレッジ | 未作成の条項数 |

終了コードが 1（⚠判定）なら**上書きしない**。原因を切り分ける：

- PDFが実際に改訂された → 消えた条項に対応する解説を、新しい条項番号へ移す作業が別途必要。利用者に判断を仰ぐ。
- 抽出器の取りこぼし → `scripts/extract_spec.py` の `CHAP_RE` / `SEC_RE` / `ITEM_RE` と連番判定を直す。フッター行（`FOOTER_LINES`）や本文開始ページ（現在は7ページ目 = `range(6, ...)`）も版によってずれる。

### 4. 上書き

差分が妥当だと確認できてから：

```bash
cp "$TMP/spec_index.new.json" src/spec_index.json
```

`src/spec_index.json` は PreToolUse フック（`.claude/hooks/guard-generated.mjs`）が Write/Edit をブロックしている。**手編集ではなく、この cp（生成物の入れ替え）で更新する。**

### 5. 事後確認

```bash
node .claude/hooks/validate-commentary.mjs <<< '{"tool_input":{"file_path":"src/spec_index.json"}}'
npx tsc --noEmit -p tsconfig.json
npm run build
```

解説側にエラーが出た場合は、原文が変わったことによる不整合。解説を新しい条項番号に合わせて直す。

最後に、消えた/増えた条項と解説カバレッジの変化を利用者へ報告する。
