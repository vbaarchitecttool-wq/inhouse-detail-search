// 原文（spec_index.json）はPDFから抽出したため、文の途中にもPDFの折り返し由来の
// 改行文字が入っている。そのまま pre-wrap で表示すると枠幅を使い切れず、文の途中で
// 改行されて読みにくい。
//
// reflowSpecText は「文の途中の改行」だけを詰めて枠幅で自然に折り返せるようにし、
// 条番号・記号・表・図・注などで始まる行の改行は構造として残す。

// 行頭が新しい項目・見出しであることを示すマーカー（この行の前の改行は残す）
// 括弧は半角・全角の混在（例: "(ｱ）"）があるため両方を受ける
const LINE_START_MARKER =
  /^[ \t　]*([（(][0-9]{1,2}[）)]|[（(][ｱ-ﾟ][）)]|[（(][a-zA-Z][）)]|[①-⑳]|[0-9０-９]{1,2}[.．]|[（(]注[）)]|表[\s　0-9０-９]|図[\s　0-9０-９])/;

// 表・図の見出し（例: "表 5.3.1 鉄筋の折曲げ形状及び寸法"）。長さによらず単独の行として扱う
const CAPTION_MARKER = /^[ \t　]*[表図][\s　0-9０-９]/;

// 直前の行が文として完結していることを示す末尾（この場合は改行を残す）
const ENDS_SENTENCE = /[。．！？：；」』）)][ \t　]*$/;

// 「(1) 適用範囲」のような見出し行は句点で終わらないため、そのままでは次の本文と
// 連結されてしまう。PDFの折返し幅は全角およそ45字なので、マーカー始まりで
// これより十分短い行は「折り返された本文」ではなく見出しと見なし、後ろの改行も残す。
const HEADING_MAX_LENGTH = 15;

// 読点で終わる行は文の途中（長い表題の折返し等）なので見出しとして扱わない
const ENDS_MID_SENTENCE = /[、，][ \t　]*$/;

const isHeadingLine = (line: string): boolean => {
  if (!LINE_START_MARKER.test(line)) return false;
  if (ENDS_MID_SENTENCE.test(line)) return false;
  if (CAPTION_MARKER.test(line)) return true;
  return line.trim().length <= HEADING_MAX_LENGTH;
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
    // 空行の前後・マーカー始まり・直前が文末か見出し → 改行を残す。
    // それ以外は折り返し由来として連結
    if (
      cur === "" ||
      prev === "" ||
      LINE_START_MARKER.test(line) ||
      ENDS_SENTENCE.test(prev) ||
      isHeadingLine(prev)
    ) {
      out.push(line);
    } else {
      out[out.length - 1] = prev.replace(/[ \t　]+$/, "") + cur;
    }
  }
  return out.join("\n");
};
