---
name: new-commentary
description: 指定した条項番号の「やさしい解説」を新規作成し、該当する章ファイルの正しい位置に挿入する。原文の取得・トーン規約・SVG規約・挿入位置の判定まで一式を行う。
disable-model-invocation: true
---

# やさしい解説の新規作成

引数の条項番号（例 `5.3.2`、複数可）について、`src/commentary/chNN.ts` に解説を追加する。

## 1. 情報を集める

まず必ずこれを実行する。原文・挿入位置・同じ節の既存解説・流用可能なSVG定数が一度に出る。

```bash
node .claude/skills/new-commentary/find-clause.mjs 5.3.2
```

`src/spec_index.json` は約1MBある。**Read で開かないこと**（コンテキストを食い潰す）。原文はこのスクリプト経由で取る。

引数が無い場合は、解説が未作成の条項を提示して選んでもらう：

```bash
node -e "const d=require('./src/spec_index.json');const fs=require('fs');const done=new Set();for(const f of fs.readdirSync('src/commentary').filter(f=>/^ch\d\d\.ts$/.test(f))){for(const m of fs.readFileSync('src/commentary/'+f,'utf8').matchAll(/^[ \t]*\"(\d+\.\d+\.\d+)\"\s*:/gm))done.add(m[1])}console.log(d.details.filter(x=>!done.has(x.id)).map(x=>x.id+' '+x.title).join('\n')||'未作成なし')"
```

## 2. 書く

`Commentary` 型（`src/types/index.ts`）に沿う。**全項目必須ではない**——原文が短い定義条項なら `plainSummary` と `why` だけでよい。同じ節の既存解説を読み、詳しさを揃えること。

| 項目 | 中身 | よくある失敗 |
|---|---|---|
| `plainSummary` | 一言でいうと。原文の要点だけを凝縮 | 理由を混ぜる／原文をそのまま貼る |
| `why` | **なぜこの規定があるのか**。守らないと何が起きるか | 原文の言い換えで終わる（最頻出の失敗） |
| `points` | 現場のチェックポイント。何を測る・何を見る・いつ確認する | 「注意する」で終わり行動になっていない |
| `glossary` | 1年目が知らない語。**本文に出てくる語だけ** | 本文に無い語を登録／循環定義 |
| `diagrams` | 空間関係・順序・寸法など、文章では伝わらないものだけ | 本文の絵解きにすぎない装飾図 |

### トーン（`PRODUCT.md` 準拠）

- 読者は**入社1年目の施工管理者**。社会人であり、子供ではない。
- 目標は「隣の先輩が横で説明している」。教科書調でも、官報調でも、幼稚（「〜だよ」）でもない。
- **原文は改変しない**。解説側で規定を作らない。原文が「特記による」としている箇所を一つの答えに決めつけない。
- 数値・材種・適用条件は原文と1つずつ照合する。ここが食い違うと現場の誤施工になる。

### 雛形

```ts
  "5.3.2": {
    plainSummary:
      "（原文の要点。何を・どこまで定めているか）",
    why: "（なぜこの規定があるのか。何を防ぐためか。守らないと現場で何が起きるか）",
    points: [
      "（測る・見る・確認するの具体的行動）",
    ],
    glossary: [
      {
        term: "（1年目が知らない語）",
        meaning: "（その語自身を使わずに説明する）",
      },
    ],
  },
```

## 3. 図解を足す場合

`DESIGN.md` の規約。フック `.claude/hooks/validate-commentary.mjs` が機械的に検査する。

- 色は **`currentColor` のみ**。`fill="#333"` のような直書きはダークテーマで破綻するため禁止。濃淡は `opacity` で付ける。
- `viewBox` / `role="img"` / `aria-label` は必須。
- **`aria-label` が図の本体**。図に描いた寸法・数値・条件を文章で全部書く（例：`ch05.ts` の `SVG_BEND` は余長4d/6d/8d、内法直径3d/4d/5d まで label に入っている）。「鉄筋の図」では情報が届かない。
- `font-size` は 11 以上。文字の `opacity` は 0.5 以上。
- SVGはファイル冒頭の `const SVG_XXX = \`...\`` として定義し、`diagrams` から参照する。`caption` には条項番号を付ける（例「排水桝の断面（21.2.2）」）。

## 4. 挿入と検証

- 挿入位置は手順1のスクリプトが示した場所。**条項番号の昇順を崩さない**。
- 新しい章ファイルを作った場合は `src/commentary/index.ts` に `import` と spread の両方を追加する（片方だけだと章まるごと表示されない）。
- 保存すると PostToolUse フックが自動で検査する（キーの存在・重複・章の対応・SVG規約・型）。エラーが出たら直してから完了とする。
- 仕上げに `commentary-reviewer` サブエージェントでレビューする（原文との数値矛盾・「なぜ」の有無を見る）。図解を足したなら `diagram-reviewer` も。
