// 原文（spec_index.json）はPDFから抽出したため、文の途中にもPDFの折り返し由来の
// 改行文字が入っている。そのまま pre-wrap で表示すると枠幅を使い切れず、文の途中で
// 改行されて読みにくい。
//
// reflowSpecText は「文の途中の改行」だけを詰めて枠幅で自然に折り返せるようにし、
// 条番号・記号・表・図・注などで始まる行の改行は構造として残す。

// 行頭が新しい項目・見出しであることを示すマーカー（この行の前の改行は残す）
const LINE_START_MARKER =
  /^[ \t　]*(\([0-9]{1,2}\)|\([ｱ-ﾟ]\)|\([a-zA-Z]\)|[①-⑳]|[0-9０-９]{1,2}[.．]|[（(]注[）)]|表[\s　0-9０-９]|図[\s　0-9０-９])/;

// 直前の行が文として完結していることを示す末尾（この場合は改行を残す）
const ENDS_SENTENCE = /[。．！？：；」』）)][ \t　]*$/;

// ---- 見出し行の判定 -------------------------------------------------------
// 「(1) 適用範囲」「表 5.3.5 かぶり厚さ」のような見出し行は句点で終わらないため、
// ENDS_SENTENCE だけでは直後の本文行と連結されてしまう。
// マーカーで始まり、かつ短い行を見出しと見なし、その「後ろ」の改行も残す。
//
// 幅のしきい値（全角換算）。原文PDFの本文は 1 行あたり全角 40 文字超で折り返されて
// いるため、「(1) 受注者は、…の場合」のように文の途中で折り返された行（長い）と
// 見出し行（短い）はこの幅で区別できる。表中の狭い列（全角 20 文字前後）で折り返された
// 本文は誤判定し得るが、実データでは数件にとどまる。
const HEADING_MAX_WIDTH = 20;

// 見出しの末尾としては不自然な文字（開き括弧・読点・中黒）。これで終わる短いマーカー行は
// 「…圧縮強度の平均値(」のように文の途中で折り返されたものと見なす。
// 中黒は下記の傍点残り（"(c) こて・・"）を連結した行を見出し扱いしないために含める
const ENDS_MID_SENTENCE = /[（(「『【、，,・][ \t　]*$/;

// 次の行がこれで始まる場合は、見出しではなく直前の行の続き（折り返し）と見なす。
// 「こて」「ちり」「まぐさ」など傍点付きの語は、PDF 抽出時に傍点が「・・」として
// 次の行に分離される（例: "(c) こて" / "・・" / "塗りの場合、…"）
const CONTINUATION_START = /^[・．]/;

// 全角換算の表示幅。ASCII と半角カナは 0.5、それ以外は 1 として数える
const textWidth = (s: string): number => {
  let w = 0;
  for (const ch of s) {
    w += /[\x20-\x7e｡-ﾟ]/.test(ch) ? 0.5 : 1;
  }
  return w;
};

const isHeadingLine = (line: string): boolean => {
  const t = line.trim();
  return (
    LINE_START_MARKER.test(t) &&
    !ENDS_SENTENCE.test(t) &&
    !ENDS_MID_SENTENCE.test(t) &&
    textWidth(t) <= HEADING_MAX_WIDTH
  );
};

export const reflowSpecText = (raw: string): string => {
  if (!raw) return "";
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (out.length === 0) {
      out.push(line);
      continue;
    }
    const prev = out[out.length - 1];
    const cur = line.replace(/^[ \t　]+/, "");
    // 改行を残す条件:
    //   - 現在行または直前行が空行（空行は構造として残す）
    //   - 現在行がマーカーで始まる
    //   - 直前行が文末で終わる
    //   - 直前行が見出し行（短いマーカー行）で、現在行がその続きでない
    // それ以外は折り返し由来として直前行に連結する
    const keepBreak =
      cur === "" ||
      prev.trim() === "" ||
      LINE_START_MARKER.test(line) ||
      ENDS_SENTENCE.test(prev) ||
      (isHeadingLine(prev) && !CONTINUATION_START.test(cur));
    if (keepBreak) {
      out.push(line);
    } else {
      out[out.length - 1] = prev.replace(/[ \t　]+$/, "") + cur;
    }
  }
  return out.join("\n");
};
