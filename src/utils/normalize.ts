// 日本語検索のための文字の「ゆれ」吸収。
//
// 仕様書の原文はPDF抽出のため、全角英数（ＡＬＣ）・半角カナ（(ｱ)）・文中改行が混在する。
// 利用者の入力も 全角/半角・ひらがな/カタカナ が揺れるので、検索時は両方を同じ形に畳む。
//   - NFKC（全角英数→半角、半角カナ→全角、㎜→mm など）
//   - 英字は小文字化
//   - カタカナ→ひらがな（メッキ＝めっき、ジャンカ＝じゃんか）
//   - 空白・改行は除去（PDFの折り返しで「重ね⏎継手」と割れた語にも当たるように）
//
// ハイライト表示のため、畳んだ後の各文字が元の文字列のどこに対応するかも返す。

export interface FoldedText {
  /** 畳んだ後の文字列（検索はこれに対して行う） */
  text: string;
  /** text[i] に対応する元文字列の開始位置 */
  starts: number[];
  /** text[i] に対応する元文字列の終了位置（排他的） */
  ends: number[];
}

const WHITESPACE = /[\s\u3000]/;
const COMBINING_VOICED = /[\u3099\u309a]/;

/**
 * PDF抽出で長音「ー」が全角ハイフン等に化けた語（コンクリ－ト、ル－フィング）を直す。
 * カタカナに挟まれたハイフン類だけを長音とみなす（「が－５℃」「ゴム－引張特性」は対象外）。
 * 文字数は変えない。
 */
const fixLongVowel = (s: string): string =>
  s.replace(/([ァ-ヶー])[-‐‑–—―−─](?=[ァ-ヶ])/g, "$1ー");

const kataToHira = (ch: string): string => {
  const code = ch.charCodeAt(0);
  // ァ(30A1)〜ヶ(30F6) → ぁ(3041)〜ゖ(3096)。長音「ー」はそのまま
  return code >= 0x30a1 && code <= 0x30f6
    ? String.fromCharCode(code - 0x60)
    : ch;
};

export const foldWithMap = (src: unknown): FoldedText => {
  const input = src === null || src === undefined ? "" : String(src);
  const chars: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];

  let pos = 0;
  for (const ch of input) {
    const start = pos;
    pos += ch.length;
    if (WHITESPACE.test(ch)) continue;

    const normalized = ch.normalize("NFKC").toLowerCase();
    for (const c of normalized) {
      if (WHITESPACE.test(c)) continue;
      // 半角カナの濁点・半濁点（ｶﾞ）は直前の文字と合成して1文字にする
      if (COMBINING_VOICED.test(c) && chars.length > 0) {
        const composed = (chars[chars.length - 1] + c).normalize("NFC");
        if (composed.length === 1) {
          chars[chars.length - 1] = composed;
          ends[ends.length - 1] = pos;
          continue;
        }
      }
      // サロゲートペア等は1要素として保持せず、コード単位で積む（位置対応を単純に保つ）
      for (let i = 0; i < c.length; i += 1) {
        chars.push(c[i]);
        starts.push(start);
        ends.push(pos);
      }
    }
  }

  const text = Array.from(fixLongVowel(chars.join("")))
    .map(kataToHira)
    .join("");
  return { text, starts, ends };
};

/** 位置対応が不要なときの軽量版 */
export const foldText = (src: unknown): string => foldWithMap(src).text;

/**
 * カタカナ→ひらがな変換だけを行わない版。
 * 送り仮名（本物のひらがな）とカタカナ語を区別する必要がある処理で使う。
 */
export const foldKeepKana = (src: unknown): string => {
  const input = src === null || src === undefined ? "" : String(src);
  let out = "";
  for (const ch of input) {
    if (WHITESPACE.test(ch)) continue;
    out += ch.normalize("NFKC").toLowerCase().replace(/[\s\u3000]/g, "");
  }
  return fixLongVowel(out.normalize("NFC"));
};

export const kanaFold = (s: string): string =>
  Array.from(s)
    .map((c) => (c.length === 1 ? kataToHira(c) : c))
    .join("");

export const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
