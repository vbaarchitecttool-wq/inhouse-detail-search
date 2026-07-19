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
    // 空行・マーカー始まり・直前が文末 → 改行を残す。それ以外は折り返し由来として連結
    if (cur === "" || LINE_START_MARKER.test(line) || ENDS_SENTENCE.test(prev)) {
      out.push(line);
    } else {
      out[out.length - 1] = prev.replace(/[ \t　]+$/, "") + cur;
    }
  }
  return out.join("\n");
};
