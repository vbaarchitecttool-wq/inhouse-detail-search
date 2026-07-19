// 8章 コンクリートブロック、ＡＬＣパネル及び押出成形セメント板工事 — やさしい解説
// 原文は src/spec_index.json（PDFから自動生成）。このファイルは手書きで管理する。
// SVGは currentColor を使い、ライト/ダーク両テーマに追従させる。

import type { Commentary } from "../types";

const SVG_CB_WALL = `
<svg viewBox="0 0 660 280" role="img" aria-label="補強コンクリートブロック造の配筋。縦筋はブロック空洞部の中心に配置し継手を設けず上下をがりょうや基礎に定着する。横筋は壁端部の縦筋に180度フックでかぎ掛けする。重ね継手45d、定着40d、かぶり20ミリ以上">
  <g fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6">
    <rect x="60" y="40" width="120" height="52"/>
    <rect x="60" y="96" width="120" height="52"/>
    <rect x="60" y="152" width="120" height="52"/>
    <rect x="120" y="40" width="60" height="52"/>
  </g>
  <g stroke="currentColor" stroke-width="6" stroke-linecap="round">
    <line x1="120" y1="20" x2="120" y2="224"/>
  </g>
  <g stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.7">
    <line x1="60" y1="120" x2="180" y2="120"/>
  </g>
  <g fill="currentColor" opacity="0.25">
    <rect x="60" y="204" width="120" height="36"/>
  </g>
  <g fill="currentColor" font-size="12.5">
    <text x="210" y="50" font-weight="bold">縦筋：空洞部の「中心」に配筋</text>
    <text x="210" y="72">・継手を設けない（1本もの）</text>
    <text x="210" y="94">・上下端はがりょう・基礎に定着</text>
    <text x="210" y="126" font-weight="bold">横筋：壁端部の縦筋に180°フックでかぎ掛け</text>
    <text x="210" y="148">・縦筋との交差部は径0.8mm以上の鉄線で結束</text>
    <text x="210" y="180" font-weight="bold">数値：重ね継手45d／定着40d／かぶり20mm以上</text>
    <text x="210" y="202" opacity="0.8">※ フェイスシェル（ブロックの外殻）はかぶりに含めない</text>
  </g>
  <g fill="currentColor" font-size="11.5" opacity="0.75">
    <text x="60" y="262">ブロック空洞部（縦筋位置）にモルタル又はコンクリートを充填して一体化する</text>
  </g>
</svg>`;

const SVG_CB_STACK = `
<svg viewBox="0 0 660 260" role="img" aria-label="ブロック積みのルール。1日の積上げ高さは1.6メートル程度まで。横筋を入れる段と最上段は基本形横筋ブロックを使う。目地モルタルは横目地は上端全面、縦目地は接合面に隙間なく塗る">
  <g fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7">
    <rect x="60" y="180" width="90" height="40"/><rect x="150" y="180" width="90" height="40"/><rect x="240" y="180" width="90" height="40"/>
    <rect x="105" y="140" width="90" height="40"/><rect x="195" y="140" width="90" height="40"/><rect x="60" y="140" width="45" height="40"/>
    <rect x="60" y="100" width="90" height="40"/><rect x="150" y="100" width="90" height="40"/><rect x="240" y="100" width="90" height="40"/>
    <rect x="105" y="60" width="90" height="40"/><rect x="195" y="60" width="90" height="40"/><rect x="60" y="60" width="45" height="40"/>
  </g>
  <g stroke="currentColor" stroke-width="3" opacity="0.7">
    <line x1="60" y1="100" x2="330" y2="100"/>
  </g>
  <g stroke="currentColor" stroke-width="1.5">
    <line x1="360" y1="60" x2="360" y2="220"/>
    <line x1="352" y1="60" x2="368" y2="60"/>
    <line x1="352" y1="220" x2="368" y2="220"/>
  </g>
  <g fill="currentColor" font-size="12.5">
    <text x="380" y="120" font-weight="bold">1日の積上げ高さ</text>
    <text x="380" y="142" font-weight="bold">1.6ｍ程度まで</text>
    <text x="380" y="170" opacity="0.85">（積みすぎると目地モルタルが</text>
    <text x="380" y="188" opacity="0.85">　硬化前につぶれて不陸・剥離）</text>
  </g>
  <g fill="currentColor" font-size="12" opacity="0.85">
    <text x="60" y="46">← 横筋の段・最上段は「基本形横筋ブロック」を使用</text>
  </g>
  <g fill="currentColor" font-size="11.5" opacity="0.75">
    <text x="60" y="248">目地は通りよく目違いなく。凝結を始めたモルタルは使わない。ブロックは適度に水湿ししてから積む</text>
  </g>
</svg>`;

const SVG_CB_FILL = `
<svg viewBox="0 0 660 240" role="img" aria-label="空洞部への充填ルール。縦目地の空洞部はブロック2段以下ごとに充填し、1日の作業終了時の打止め位置はブロック上端から5センチ程度下げる">
  <g fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7">
    <rect x="80" y="40" width="110" height="44"/>
    <rect x="80" y="84" width="110" height="44"/>
    <rect x="80" y="128" width="110" height="44"/>
    <rect x="80" y="172" width="110" height="44"/>
  </g>
  <g fill="currentColor" opacity="0.4">
    <rect x="115" y="96" width="40" height="120"/>
  </g>
  <g stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4">
    <line x1="80" y1="96" x2="260" y2="96"/>
  </g>
  <g stroke="currentColor" stroke-width="1.5">
    <line x1="240" y1="84" x2="240" y2="96"/>
    <line x1="232" y1="84" x2="248" y2="84"/>
    <line x1="232" y1="96" x2="248" y2="96"/>
  </g>
  <g fill="currentColor" font-size="12.5">
    <text x="280" y="70" font-weight="bold">充填は「2段以下ごと」に行う</text>
    <text x="280" y="98" font-weight="bold">打止めは上端から5cm程度下げる</text>
    <text x="280" y="126" opacity="0.85">→ 翌日の充填と段差で噛み合い、</text>
    <text x="280" y="146" opacity="0.85">　 打継ぎが弱点になりにくい</text>
    <text x="280" y="180" opacity="0.85">まぐさを受ける開口部両側は、最下部から</text>
    <text x="280" y="200" opacity="0.85">まぐさ下端まで全て充填する</text>
  </g>
</svg>`;

const SVG_FENCE = `
<svg viewBox="0 0 660 260" role="img" aria-label="補強コンクリートブロック塀の規定。高さは2.2メートル以下。ブロックの正味厚さは高さ2メートル以下で120ミリ、2メートルを超えると150ミリ。交差部や控壁には型枠状ブロックを使いコンクリートを充填する">
  <g fill="none" stroke="currentColor" stroke-width="2">
    <rect x="80" y="60" width="300" height="150"/>
    <path d="M380 210 L470 210 L380 120 Z"/>
  </g>
  <g stroke="currentColor" stroke-width="1.2" opacity="0.5">
    <line x1="80" y1="90" x2="380" y2="90"/><line x1="80" y1="120" x2="380" y2="120"/>
    <line x1="80" y1="150" x2="380" y2="150"/><line x1="80" y1="180" x2="380" y2="180"/>
  </g>
  <g fill="currentColor" opacity="0.25">
    <rect x="60" y="210" width="440" height="26"/>
  </g>
  <g stroke="currentColor" stroke-width="1.5">
    <line x1="52" y1="60" x2="52" y2="210"/>
    <line x1="44" y1="60" x2="60" y2="60"/>
    <line x1="44" y1="210" x2="60" y2="210"/>
  </g>
  <g fill="currentColor" font-size="12.5">
    <text x="20" y="140" font-weight="bold">高さ</text>
    <text x="500" y="80" font-weight="bold">この節の塀＝高さ2.2ｍ以下</text>
    <text x="500" y="110">厚さ：高さ2ｍ以下→120mm</text>
    <text x="500" y="132">　　　2ｍ超　　→150mm</text>
    <text x="500" y="164" opacity="0.85">交差部・控壁は型枠状</text>
    <text x="500" y="184" opacity="0.85">ブロック＋コンクリート充填</text>
  </g>
  <g fill="currentColor" font-size="11.5" opacity="0.8">
    <text x="392" y="196">控壁</text>
    <text x="80" y="252">基礎・控壁の構造は5章・6章による。ブロックは空洞ブロックC(16)</text>
  </g>
</svg>`;

const SVG_ALC_ROCKING = `
<svg viewBox="0 0 660 300" role="img" aria-label="ALC外壁パネル構法の2種類。A種の縦壁ロッキング構法はパネル上下の取付け金物でパネルが回転でき、地震の層間変形に追従する。B種の横壁アンカー構法はパネル左右をアンカーと金物で接合し5段以下ごとに受金物を設ける">
  <g fill="none" stroke="currentColor" stroke-width="1.8">
    <rect x="70" y="60" width="60" height="180" transform="rotate(-3 100 150)"/>
    <rect x="140" y="60" width="60" height="180"/>
    <rect x="210" y="60" width="60" height="180" transform="rotate(3 240 150)"/>
  </g>
  <g fill="currentColor">
    <circle cx="100" cy="70" r="5"/><circle cx="100" cy="230" r="5"/>
    <circle cx="170" cy="70" r="5"/><circle cx="170" cy="230" r="5"/>
    <circle cx="240" cy="70" r="5"/><circle cx="240" cy="230" r="5"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.8">
    <rect x="390" y="70" width="200" height="42"/>
    <rect x="390" y="116" width="200" height="42"/>
    <rect x="390" y="162" width="200" height="42"/>
  </g>
  <g fill="currentColor" opacity="0.7">
    <rect x="380" y="208" width="220" height="8"/>
  </g>
  <g fill="currentColor" font-size="13" font-weight="bold" text-anchor="middle">
    <text x="170" y="40">Ａ種：縦壁ロッキング構法</text>
    <text x="490" y="40">Ｂ種：横壁アンカー構法</text>
  </g>
  <g fill="currentColor" font-size="11.5" text-anchor="middle" opacity="0.85">
    <text x="170" y="262">パネル上下端の金物で「回転」できる</text>
    <text x="170" y="280">→ 地震の層間変形に追従して割れない</text>
    <text x="490" y="234">受金物（積上げ5段以下ごと）</text>
    <text x="490" y="262">パネル左右端をアンカー＋金物で接合</text>
  </g>
</svg>`;

const SVG_ALC_FLOOR = `
<svg viewBox="0 0 660 260" role="img" aria-label="ALC屋根床パネルの敷設筋構法。パネルは支持梁上に敷き並べ、短辺小口相互には20ミリ程度の目地を設ける。取付け金物を受材に固定し、目地用鉄筋を金物の孔に通してパネル長辺溝部に500ミリ以上挿入し、目地モルタルを充填する">
  <g fill="none" stroke="currentColor" stroke-width="1.8">
    <rect x="60" y="80" width="250" height="70"/>
    <rect x="330" y="80" width="250" height="70"/>
  </g>
  <g fill="currentColor" opacity="0.3">
    <rect x="310" y="80" width="20" height="70"/>
  </g>
  <g stroke="currentColor" stroke-width="5" stroke-linecap="round">
    <line x1="160" y1="115" x2="480" y2="115"/>
  </g>
  <g stroke="currentColor" stroke-width="1.5">
    <line x1="160" y1="132" x2="320" y2="132"/>
    <line x1="160" y1="124" x2="160" y2="140"/>
    <line x1="320" y1="124" x2="320" y2="140"/>
  </g>
  <g fill="currentColor" opacity="0.7">
    <rect x="300" y="160" width="40" height="14"/>
  </g>
  <g fill="currentColor" font-size="12.5">
    <text x="60" y="50" font-weight="bold">敷設筋構法（Ｆ種）＝屋根・床パネルの標準構法</text>
    <text x="180" y="152" opacity="0.9">目地用鉄筋：金物から500mm以上挿入</text>
    <text x="352" y="172" opacity="0.85">← 取付け金物（受材に溶接等で固定）</text>
    <text x="290" y="70" font-weight="bold">短辺目地 20mm程度</text>
  </g>
  <g fill="currentColor" font-size="12" opacity="0.8">
    <text x="60" y="210">・目地モルタルは5mm程度盛り上げ→水引きを見て上面にそろえて平滑に</text>
    <text x="60" y="232">・長辺は突き合わせ、有効な掛り代を確保して支持梁上に敷き並べる</text>
  </g>
</svg>`;

const SVG_ECP = `
<svg viewBox="0 0 660 300" role="img" aria-label="押出成形セメント板ECPの外壁工法。A種の縦張り工法は各段ごとに下地鋼材で受けロッキングできるよう取り付ける。B種の横張り工法は積上げ3枚以下ごとに下地鋼材で受け、左右端部の金物でスライドできるように取り付ける">
  <g fill="none" stroke="currentColor" stroke-width="1.8">
    <rect x="80" y="60" width="50" height="180"/>
    <rect x="136" y="60" width="50" height="180"/>
    <rect x="192" y="60" width="50" height="180"/>
  </g>
  <g fill="currentColor">
    <circle cx="105" cy="70" r="5"/><circle cx="105" cy="230" r="5"/>
    <circle cx="161" cy="70" r="5"/><circle cx="161" cy="230" r="5"/>
    <circle cx="217" cy="70" r="5"/><circle cx="217" cy="230" r="5"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.8">
    <rect x="390" y="66" width="200" height="40"/>
    <rect x="390" y="110" width="200" height="40"/>
    <rect x="390" y="154" width="200" height="40"/>
  </g>
  <g fill="currentColor" opacity="0.7">
    <rect x="380" y="198" width="220" height="8"/>
  </g>
  <g stroke="currentColor" stroke-width="1.6" opacity="0.8">
    <line x1="370" y1="86" x2="352" y2="86"/><line x1="610" y1="86" x2="628" y2="86"/>
  </g>
  <g fill="currentColor">
    <polygon points="352,86 362,81 362,91"/>
    <polygon points="628,86 618,81 618,91"/>
  </g>
  <g fill="currentColor" font-size="13" font-weight="bold" text-anchor="middle">
    <text x="160" y="40">Ａ種：縦張り工法</text>
    <text x="490" y="40">Ｂ種：横張り工法</text>
  </g>
  <g fill="currentColor" font-size="11.5" text-anchor="middle" opacity="0.85">
    <text x="160" y="262">各段ごとに下地鋼材で受け、</text>
    <text x="160" y="280">上下端部の金物で「ロッキング」</text>
    <text x="490" y="224">受け＝積上げ3枚以下ごと</text>
    <text x="490" y="252">左右端部の金物で「スライド」して</text>
    <text x="490" y="270">層間変形に追従</text>
  </g>
</svg>`;

const ch08: Record<string, Commentary> = {
  "8.1.1": {
    plainSummary:
      "この章はコンクリートブロック（CB）、ALCパネル、押出成形セメント板（ECP）を使う工事のルール。1章とセットで適用する。",
    why: "3つの材料はどれも「工場生産の部材を現場で組み立てる壁」です。2〜3節がブロック（積む）、4節がALC（軽い気泡コンクリート板）、5節がECP（中空の押出セメント板）という構成です。",
  },

  "8.1.2": {
    plainSummary:
      "ゴールは3つ。①所定の材料 ②所定の形状・寸法・位置と所要の仕上り面 ③構造耐力・耐久性・耐火性に有害な欠陥がないこと。",
  },

  "8.2.1": {
    plainSummary:
      "この節は、ブロックを積んで鉄筋で補強した耐力壁による小規模な構造物（補強コンクリートブロック造）のルール。基礎・がりょう・スラブは5章・6章による。",
    glossary: [
      {
        term: "補強コンクリートブロック造",
        meaning:
          "ブロックの空洞部に鉄筋を通しコンクリート等を充填して耐力壁とする構造。倉庫や小規模建物に使われる。",
      },
      {
        term: "がりょう（臥梁）",
        meaning:
          "ブロック壁の頂部に設ける鉄筋コンクリートの梁。壁を一体化し、上下の力をまとめる。",
      },
    ],
  },

  "8.2.2": {
    plainSummary:
      "ブロックはJIS A 5406により種類・寸法は特記。充填用コンクリートの粗骨材は空洞部最小径の1/5以下かつ砂利20mm・砕石15mm以下。ブロックは雨水を吸わないよう養生して保管する。",
    why: "ブロックの空洞は狭いので、普通のコンクリート（粗骨材20〜25mm）では詰まって充填不良になります。骨材を小さくするのはそのためです。濡れたブロックを積むと乾燥収縮でひび割れの原因になるため、保管時の雨仕舞いも規定されています。",
    glossary: [
      {
        term: "フェイスシェル",
        meaning: "ブロックの表裏の板状の部分（外殻）。かぶり厚さには含めない。",
      },
    ],
  },

  "8.2.3": {
    plainSummary:
      "モルタルの調合（容積比）は、目地用＝セメント1：砂2.5、化粧目地用＝1：1、充填用＝1：2.5。",
  },

  "8.2.4": {
    plainSummary:
      "充填用コンクリートは容積比でセメント1：砂2.5：砂利3.5、スランプ20〜23cm。生コンを使う場合は呼び強度21・スランプ21cm。",
    why: "スランプが大きい（軟らかい）のは、狭い空洞部の隅々まで流し込むためです。6章の構造体コンクリート（18cm以下）とは目的が違うことに注意。",
  },

  "8.2.5": {
    plainSummary:
      "縦筋は空洞部の中心に配筋し、継手を設けず上下をがりょう・基礎に定着。横筋は壁端部の縦筋に180°フックでかぎ掛け。重ね継手45d・定着40d・かぶり20mm以上（フェイスシェルは含まない）。",
    why: "ブロック造の鉄筋は後から直せないため、「縦筋は1本もの・継手なし」が原則です。かぶりの基準面はブロックの外面ではなく充填モルタル・コンクリーの中での距離で、フェイスシェルを算入しないのが引っかけポイントです。",
    diagrams: [
      {
        svg: SVG_CB_WALL,
        caption: "補強コンクリートブロック造の配筋ルール（8.2.5）",
      },
    ],
  },

  "8.2.6": {
    plainSummary:
      "縦遣方（壁の通り・高さの基準となる仮設の定規）は、足場や型枠と連結せず自立させ、動かないよう堅固に設ける。",
    why: "足場につなぐと、足場の揺れで基準そのものが動いてしまいます。基準は独立させるのが鉄則です。",
    glossary: [
      {
        term: "縦遣方（たてやりかた）",
        meaning:
          "ブロック積みの通り・目地高さを示すために立てる仮設の基準材。水糸を張って各段の高さを管理する。",
      },
    ],
  },

  "8.2.7": {
    plainSummary:
      "凝結が始まったモルタルは使わない。ブロックは適度に水湿しして、横目地は上端全面・縦目地は接合面に隙間なくモルタルを塗り、通りよく積む。1日の積上げ高さは1.6ｍ程度まで。横筋の段と最上段は基本形横筋ブロックを使う。",
    why: "1.6ｍ（約8段）の制限は、下の段の目地モルタルが固まらないうちに荷重をかけると、目地がつぶれて壁の精度と強度が落ちるためです。ブロック工事で最も有名な数値なので必ず覚えましょう。",
    points: [
      "1日1.6ｍ程度＝ブロック工事の代表数値",
      "横筋ブロック（溝付き）を使う段を割付け図で確認",
      "化粧面の汚れは「その都度」清掃（固まってからでは取れない）",
    ],
    diagrams: [
      {
        svg: SVG_CB_STACK,
        caption: "ブロック積みのルール（8.2.7）",
      },
    ],
  },

  "8.2.8": {
    plainSummary:
      "空洞部への充填はブロック2段以下ごとに行い、1日の打止めはブロック上端から5cm程度下げる。まぐさを受ける開口部両側は最下部からまぐさ下端まで充填する。",
    why: "打止めを5cm下げるのは、翌日の充填との継ぎ目を目地位置からずらし、噛み合わせを作るためです。まぐさ（開口上の梁）は両側のブロックに荷重を伝えるので、その支えとなる部分は中まで詰めて固めます。",
    glossary: [
      {
        term: "まぐさ",
        meaning: "窓や出入口など開口部の上に架け渡す小さな梁。",
      },
    ],
    diagrams: [
      {
        svg: SVG_CB_FILL,
        caption: "空洞部への充填と打止め位置（8.2.8）",
      },
    ],
  },

  "8.2.9": {
    plainSummary:
      "ボルト・とい受金物・配管支持金物などを壁に埋め込む場合は「目地位置」に埋め込む。難しい場合は監督職員と協議。",
    why: "ブロック本体に穴をあけると強度低下や割れの原因になるため、埋込みは目地（モルタル部分）で行うのが原則です。",
  },

  "8.2.10": {
    plainSummary:
      "空洞部に電気配管する場合は、かぶり厚さを邪魔しないよう空洞部の片側に寄せ、配管の出入り部の空洞にはモルタル等を充填する。",
  },

  "8.2.11": {
    plainSummary:
      "目地・充填のモルタルが硬化するまで振動・衝撃・荷重を与えず、直射日光・寒気から養生する。出隅など欠けやすい部分は板で養生。空洞部に雨水を入れない。",
    points: [
      "施工済み壁の天端はシート養生（空洞部への雨水侵入はひび割れ・白華の原因）",
    ],
  },

  "8.3.1": {
    plainSummary:
      "この節はブロックの帳壁（非耐力の間仕切壁など）と高さ2.2ｍ以下の塀のルール。塀の基礎・控壁は5章・6章による。",
    glossary: [
      {
        term: "帳壁（ちょうへき）",
        meaning:
          "建物の荷重を負担しない壁（非耐力壁）。間仕切りや外周の仕切りに使う。",
      },
    ],
  },

  "8.3.2": {
    plainSummary:
      "ブロックは特記がなければ空洞ブロックC(16)。塀の厚さは高さ2ｍ以下で120mm、2ｍ超で150mm。塀の交差部・控壁は型枠状ブロック＋コンクリート充填。",
    why: "ブロック塀は地震のたびに倒壊事故が問題になってきました。高さ2.2ｍ以下・厚さ・控壁・充填のルールは人命に直結する規定です。既存塀の点検でもこの数値が判断基準になります。",
    diagrams: [
      {
        svg: SVG_FENCE,
        caption: "補強コンクリートブロック塀の規定（8.3.1〜8.3.2）",
      },
    ],
  },

  "8.3.3": {
    plainSummary: "モルタル・コンクリートの調合は耐力壁と同じ（8.2.3・8.2.4による）。",
  },

  "8.3.4": {
    plainSummary:
      "主筋は空洞部の中心に配筋。継手・定着・末端フックは特記による。かぶり20mm以上（フェイスシェル含まず）。",
  },

  "8.3.5": {
    plainSummary: "塀の縦遣方は耐力壁と同じ（8.2.6による）。",
  },

  "8.3.6": {
    plainSummary: "ブロック積みは耐力壁と同じ（8.2.7による）。1日1.6ｍ程度など。",
  },

  "8.3.7": {
    plainSummary:
      "充填は8.2.8による。塀の型枠状ブロックの空洞部にはコンクリートを充填する。",
  },

  "8.3.8": {
    plainSummary: "ボルト等の埋込みは目地位置（8.2.9による）。",
  },

  "8.3.9": {
    plainSummary:
      "ブロック帳壁の面に溝掘り配管はしない。空洞部への配管は8.2.10による。難しい場合は協議。",
    why: "積み上がった壁に溝を掘れば断面欠損＋ひび割れの起点になります。配管は計画段階で空洞部に仕込むのが正解です。",
  },

  "8.3.10": {
    plainSummary: "養生は8.2.11による。",
  },

  "8.4.1": {
    plainSummary:
      "この節はALCパネルを屋根・床・外壁・間仕切壁に使う工事のルール。",
    glossary: [
      {
        term: "ALCパネル",
        meaning:
          "軽量気泡コンクリート（Autoclaved Lightweight aerated Concrete）のパネル。コンクリートの約1/4の重さで断熱性・耐火性に優れるが、吸水しやすく衝撃に弱い。",
      },
    ],
  },

  "8.4.2": {
    plainSummary:
      "パネルはJIS A 5416の厚形パネル。目地用鉄筋はSR235-9φまたはSD295-D10。下地鋼材はSS400で錆止め2回塗り、パネルに接する金物は溶融亜鉛めっき。目地用モルタルはセメント1：砂3.5＋混和剤。",
    points: [
      "金物の防錆（めっき・錆止め2回塗り）は取付け後に見えなくなる部分。取付け前に確認",
    ],
  },

  "8.4.3": {
    plainSummary:
      "外壁パネル構法はA種（縦壁ロッキング構法）とB種（横壁アンカー構法）で特記による。パネル幅の最小は300mm。短辺小口相互・出入隅・他部材との取合いは伸縮目地（幅10〜20mm）としシーリングを充填。B種の受金物は5段以下ごと。",
    why: "ALC外壁の設計思想は「地震で建物が変形してもパネルを壊さない」こと。縦壁ロッキング構法は、パネル1枚1枚が金物を支点にわずかに回転（ロッキング）して層間変形を逃がします。だからパネルを構造体に固く固定したり、目地をモルタルで固めたりしてはいけません。伸縮目地＋シーリングはこの「動ける壁」を守るためのものです。",
    points: [
      "スラブ取合いの充填モルタルとパネルの間にはクラフトテープ等の絶縁材（A種）",
      "幅300mm未満のパネルは特記がない限り使わない",
      "外部目地のシーリング充填を忘れない（漏水の定番箇所）",
    ],
    glossary: [
      {
        term: "ロッキング構法",
        meaning:
          "パネル上下の支点で回転を許容し、層間変形に追従させる取付け方式。現在のALC外壁の主流。",
      },
      {
        term: "層間変形",
        meaning: "地震時に建物の上下階が水平方向にずれる変形。",
      },
    ],
    diagrams: [
      {
        svg: SVG_ALC_ROCKING,
        caption: "外壁パネル構法：ロッキングとアンカー（表8.4.2）",
      },
    ],
  },

  "8.4.4": {
    plainSummary:
      "間仕切壁はC種（縦壁ロッキング）・D種（横壁アンカー）で外壁と同じ考え方。現場での切詰めは専用工具。防火区画では下地鋼材に耐火被覆を行う。",
    points: [
      "防火区画の壁は「パネルが耐火」でも下地鋼材が無防備だと区画が成立しない",
    ],
  },

  "8.4.5": {
    plainSummary:
      "屋根・床はF種（敷設筋構法）。パネルを支持梁上に敷き並べ（短辺目地20mm程度）、取付け金物を受材に固定し、目地用鉄筋を金物から500mm以上パネル長辺溝部に挿入して目地モルタルを充填する。モルタルは5mm程度盛り上げてから上面にそろえて平滑に。",
    why: "敷設筋構法は、目地鉄筋とモルタルで隣り合うパネルを縫い合わせ、床全体を一体の面（ダイアフラム）にする工法です。目地の充填不良は床のガタつき・ひび割れに直結するため、清掃→充填→均しの手順が細かく決められています。",
    points: [
      "充填中の降雨・降雪は作業中止＋養生",
      "パネル表面に付いたモルタルは直ちに除去",
    ],
    diagrams: [
      {
        svg: SVG_ALC_FLOOR,
        caption: "屋根・床パネルの敷設筋構法（表8.4.4）",
      },
    ],
  },

  "8.4.6": {
    plainSummary:
      "外壁・間仕切壁パネルには原則、溝掘り・孔あけをしない。屋根・床パネルは溝掘り禁止・孔あけも原則禁止。やむを得ず設けた部分は補修用モルタル等を充填し、露出した鉄筋には錆止めを塗る。",
    why: "ALCは内部の補強鉄筋で強度を保っています。溝や孔で鉄筋を切ればパネルの耐力・耐火性が失われます。設備工事の「ちょっと欠き込み」が事故につながる典型箇所です。",
  },

  "8.4.7": {
    plainSummary:
      "目地モルタル硬化まで振動・衝撃を与えない。屋根・床に集中荷重をかけない。急乾燥・凍結のおそれがあれば養生する。",
    points: [
      "床パネル上に資材をまとめ置きしない（集中荷重NG。分散して置く）",
    ],
  },

  "8.5.1": {
    plainSummary:
      "この節は押出成形セメント板（ECP）を外壁・間仕切壁に使う工事のルール。",
    glossary: [
      {
        term: "押出成形セメント板（ECP）",
        meaning:
          "セメントを中空パネル状に押出成形して高温高圧養生した板。ALCより強度・耐水性が高く、外壁・帳壁に使う。",
      },
    ],
  },

  "8.5.2": {
    plainSummary:
      "パネルはJIS A 5441により種類・形状・厚さ・幅は特記。下地鋼材・金物の防錆処理はALCと同じ。接合部のシーリングは9章7節による。",
  },

  "8.5.3": {
    plainSummary:
      "外壁はA種（縦張り工法：各段ごとに下地鋼材で受け、上下端部でロッキング）とB種（横張り工法：3枚以下ごとに受け、左右端部でスライド）。パネル幅最小300mm。目地幅は幅900mm以下でも長辺10mm以上・短辺15mm以上。出入隅は伸縮目地15mm程度＋シーリング。",
    why: "ECPもALCと同じく「動ける壁」です。縦張りはロッキング、横張りはスライドで層間変形に追従します。方式によって動き方が違うため、金物も受けの間隔も変わる、と整理して覚えましょう。",
    diagrams: [
      {
        svg: SVG_ECP,
        caption: "ECP外壁：縦張り（ロッキング）と横張り（スライド）（表8.5.1）",
      },
    ],
  },

  "8.5.4": {
    plainSummary:
      "間仕切壁はB種（横張り）とC種（縦張り：上端は山形鋼・溝形鋼、下端は山形鋼・金物で固定）。山形鋼等はあと施工アンカー・溶接で取付け。切詰めは専用工具。防火区画では金物に耐火被覆。",
    glossary: [
      {
        term: "あと施工アンカー",
        meaning:
          "硬化済みコンクリートに孔をあけて後から設置するアンカー。金属拡張式・接着式がある。",
      },
    ],
  },

  "8.5.5": {
    plainSummary:
      "ECPには溝掘りをしない。開口部の寸法・位置は原則パネル幅に合わせ、補強材を設ける。欠き込みも原則禁止（やむを得ない設備開口の限度は特記）。",
    why: "ECPは中空構造なので、欠き込むと断面が大きく失われます。開口は「パネル割りに合わせて計画する」のが原則で、現場合わせの加工に頼らない設計・施工が求められます。",
  },
};

export default ch08;
