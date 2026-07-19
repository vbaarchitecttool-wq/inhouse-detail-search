// 21章 排水工事 — やさしい解説
// 原文は src/spec_index.json（PDFから自動生成）。このファイルは手書きで管理する。
// SVGは currentColor を使い、ライト/ダーク両テーマに追従させる。

import type { Commentary } from "../types";

const SVG_MANHOLE = `
<svg viewBox="0 0 660 250" role="img" aria-label="排水桝の断面。上部にふた、桝の側壁を側塊で積みモルタルで接合する。流入管と流出管が桝の内面に少し突き出るように取り付け、隙間はモルタルを内外から詰めて水漏れを防ぐ。汚水が混じる桝は底に流れの方向にならった半円形のインバート溝をモルタルで作る。深い桝には足掛け金物を取り付ける">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M180 60 h300 M180 60 v150 h300 v-150"/>
    <rect x="250" y="46" width="160" height="14"/>
  </g>
  <g fill="currentColor" opacity="0.15"><rect x="181" y="61" width="298" height="148"/></g>
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M120 110 h62 M120 128 h62"/>
    <path d="M478 130 h62 M478 148 h62"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M230 210 q100 -34 200 0"/></g>
  <g fill="currentColor" opacity="0.85"><circle cx="210" cy="90" r="4"/><circle cx="210" cy="130" r="4"/></g>
  <g fill="currentColor" font-size="12">
    <text x="255" y="40" font-weight="bold">ふた</text>
    <text x="120" y="102">流入管</text>
    <text x="486" y="122">流出管</text>
    <text x="238" y="200">インバート（半円溝）</text>
    <text x="150" y="150">足掛け金物</text>
  </g>
  <g fill="currentColor" font-size="12" opacity="0.8">
    <text x="40" y="30" font-weight="bold">排水桝の断面（21.2.2）</text>
    <text x="40" y="238">管は桝内面に突き出して取付け、隙間はモルタルを内外から詰める。汚水桝は底にインバート</text>
  </g>
</svg>`;

const SVG_PIPE_LAY = `
<svg viewBox="0 0 660 220" role="img" aria-label="遠心力鉄筋コンクリート管ソケット管の敷設。勾配を付けた基床の上に、受口（ソケット）を上流に向け、水下（下流）から上流へ向かって管を敷設する。差込み管と受口の隙間には硬練りモルタルを充填し、水漏れがないよう目塗りする。排水は上流から下流へ勾配で自然に流れる">
  <g fill="currentColor" opacity="0.2"><path d="M40 175 L620 130 L620 200 L40 200 Z"/></g>
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M110 168 h120 M110 148 h120"/>
    <path d="M228 144 h14 v28 h-14"/>
    <path d="M260 160 h120 M260 140 h120"/>
    <path d="M378 136 h14 v28 h-14"/>
    <path d="M410 152 h120 M410 132 h120"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3"><path d="M60 120 L600 120"/></g>
  <g fill="currentColor" font-size="13" font-weight="bold">
    <text x="560" y="60">上流</text>
    <text x="70" y="60">下流（水下）</text>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M120 75 L90 75 M120 75 L108 68 M120 75 L108 82"/></g>
  <g fill="currentColor" font-size="12">
    <text x="130" y="80" opacity="0.85">下流から上流へ敷設</text>
    <text x="240" y="128" opacity="0.85">受口（ソケット）は上流向き</text>
    <text x="40" y="215" opacity="0.8">基床は勾配付き。差込み部の隙間に硬練りモルタルを充填し目塗り（21.2.2）</text>
  </g>
</svg>`;

const SVG_BACKFILL = `
<svg viewBox="0 0 660 220" role="img" aria-label="排水管の埋戻し。管の両側から同時に、管の中心線程度まで空隙が生じないよう十分突き固めながら埋め戻す。管を移動させないようにしてから所定の埋戻しを行い、1層の仕上り厚さは20cm以下として層ごとに締め固める">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M60 190 L60 70 L600 70 L600 190"/>
    <circle cx="330" cy="150" r="34"/>
  </g>
  <g fill="currentColor" opacity="0.12"><rect x="61" y="118" width="538" height="72"/></g>
  <g fill="none" stroke="currentColor" stroke-width="1" opacity="0.6">
    <path d="M61 118 h538 M61 140 h538 M61 162 h538"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M280 150 L200 150 M280 150 L212 143 M280 150 L212 157 M380 150 L460 150 M380 150 L448 143 M380 150 L448 157"/></g>
  <g fill="currentColor" font-size="12">
    <text x="150" y="112">管の中心線まで両側から同時に</text>
    <text x="610" y="130" text-anchor="end" opacity="0.85">1層20cm以下</text>
    <text x="308" y="205" text-anchor="middle" opacity="0.85">排水管</text>
  </g>
  <g fill="currentColor" font-size="12" opacity="0.8">
    <text x="40" y="40" font-weight="bold">排水管の埋戻し（21.2.2）</text>
    <text x="40" y="58">両側から同時に突き固めて管を動かさない。1層ごとに締め固める</text>
  </g>
</svg>`;

const SVG_GUTTER = `
<svg viewBox="0 0 660 210" role="img" aria-label="街きょ・縁石・側溝の例。L形側溝は車道の端に沿って水を集めて流す断面、U形側溝はコの字の溝に上ぶたをのせる。いずれもプレキャスト製品を据付け用モルタルで通りよく据え付け、目地は幅10mm程度にモルタルを充填する">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M40 130 L200 130 L200 90 L230 90 L230 150 L40 150 Z"/>
  </g>
  <g fill="currentColor" opacity="0.15"><path d="M40 130 L200 130 L200 150 L40 150 Z"/></g>
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M400 95 L400 155 L500 155 L500 95"/>
    <path d="M385 90 L515 90 L515 100 L385 100 Z"/>
  </g>
  <g fill="currentColor" opacity="0.12"><rect x="401" y="100" width="98" height="55"/></g>
  <g fill="currentColor" font-size="13" font-weight="bold" text-anchor="middle">
    <text x="135" y="180">L形側溝</text>
    <text x="450" y="180">U形側溝（上ぶた式）</text>
  </g>
  <g fill="currentColor" font-size="12">
    <text x="205" y="85" opacity="0.85">縁石</text>
    <text x="520" y="98" opacity="0.85">ふた</text>
  </g>
  <g fill="currentColor" font-size="12" opacity="0.8">
    <text x="40" y="40" font-weight="bold">街きょ・縁石・側溝（21.3）</text>
    <text x="40" y="58">プレキャスト製品を据付け用モルタルで通りよく据付け、目地は幅10mm程度に充填</text>
  </g>
</svg>`;

const ch21: Record<string, Commentary> = {
  "21.1.1": {
    plainSummary:
      "この章は、構内の屋外雨水排水工事、及び街きょ・縁石・側溝等を設置する工事に適用する。車両の通行が少なく、根切り等で乱されていない支持地盤に管路を敷設する場合が対象。1章とセットで適用する。",
    why: "敷地内に降った雨水を桝と管で集め、公共の下水や排水路まで流すのがこの章の工事です。管を地中に埋設し、要所に「桝（ます）」を設けて点検・合流できるようにします。ポイントは①勾配で水を流す ②沈下・漏水させない、の2点です。",
  },

  "21.1.2": {
    plainSummary:
      "ゴールは3つ。①所定の材料 ②配管・桝等が所定の形状・寸法 ③排水に支障となる沈下や漏水がないこと。",
    why: "排水は「勾配」で自然に流れるため、管が沈下すると水がたまり、逆勾配になると流れなくなります。また継手から漏水すると周囲の地盤を傷めます。沈下と漏水を防ぐことが排水工事の生命線です。",
  },

  "21.2.1": {
    plainSummary:
      "材料。排水管は表21.2.1（遠心力鉄筋コンクリート管、硬質ポリ塩化ビニル管VP／VU、継手DV等、材種・呼び径は特記）。接合部のゴム輪はJIS K 6353。側塊・排水桝・ふた（鋳鉄製はSHASE-S209）・グレーチングは特記。地業の砂利はC-40／C-30／C-20程度。現場打ちコンクリートは無筋（特記なければFc18・スランプ15/18cm）、鉄筋はSD295。凍上抑制層用の砂の粒度、モルタル調合（1：2）、埋戻し材（B種）が定められる。",
    glossary: [
      {
        term: "遠心力鉄筋コンクリート管（ヒューム管）",
        meaning:
          "型枠を回転させ遠心力で締め固めて作る鉄筋コンクリートの管。強度が高く大口径の排水本管に使う。",
      },
      {
        term: "VP管／VU管",
        meaning:
          "硬質ポリ塩化ビニル管。VPは肉厚で丈夫、VUは肉薄で安価。軽くて腐食せず接合しやすい。",
      },
      {
        term: "グレーチング",
        meaning:
          "側溝や桝の上にのせる格子状の金属ふた。水を通しながら人や車を通す。",
      },
    ],
  },

  "21.2.2": {
    plainSummary:
      "施工。根切り底は勾配付きに仕上げ地山を乱さない。埋戻しは管の両側から同時に中心線程度まで空隙なく突き固め、管を移動させず1層20cm以下で締め固める。側塊はモルタル接合。内法600mm超かつ深さ1.2m超の桝には足掛け金物。管は桝内面に突き出して取り付け隙間はモルタルを内外から詰める。汚水混入桝にはインバート（半円形の溝）を設ける。遠心力管は受口を上流に向け水下から敷設し隙間に硬練りモルタルを目塗り。塩ビ管は冷間工法（接着剤またはゴム輪、特記なければ接着剤）で管頂100mmまで同材で埋戻し。",
    why: "排水管は「水下（下流）から上流へ」、受口（ソケット）を上流に向けて敷設します。こうすると継手の受口の向きが水流に逆らわず、上流から流れてきた水がスムーズに次の管へ入ります。埋戻しで管の両側から同時に突き固めるのは、片側だけ埋めると管が横にずれてしまうためです。インバートは、桝の底に半円の溝を付けて汚水をよどみなく流し、臭気やつまりを防ぐ工夫です。",
    points: [
      "受口を上流に向け、水下（下流）から敷設",
      "埋戻しは両側から同時に、1層20cm以下で締固め",
      "汚水桝の底にはインバート（半円溝）を設ける",
      "管は桝内面に突き出し、隙間はモルタルを内外から詰める",
    ],
    glossary: [
      {
        term: "インバート",
        meaning:
          "桝の底に流れの方向へ作る半円形の溝。汚水をよどませず流し、臭気・堆積を防ぐ。",
      },
      {
        term: "側塊（そっかい）",
        meaning:
          "桝やマンホールの側壁を作る、輪切り状のプレキャストコンクリート。積み重ねて深さを調整する。",
      },
    ],
    diagrams: [
      {
        svg: SVG_MANHOLE,
        caption: "排水桝の断面とインバート（21.2.2）",
      },
      {
        svg: SVG_PIPE_LAY,
        caption: "排水管の敷設（受口は上流・水下から敷設）（21.2.2）",
      },
      {
        svg: SVG_BACKFILL,
        caption: "排水管の埋戻し（両側から同時・1層20cm以下）（21.2.2）",
      },
    ],
  },

  "21.2.3": {
    plainSummary:
      "通水試験。排水管の埋戻しに先立ち、排水に支障がないこと・漏水のないことを確認する。さらに全系統の完了後、通水試験を行う。",
    why: "埋め戻す前に試験するのが重要。埋めた後に漏水が判明すると掘り返しになるため、隠れる前に通水して勾配・漏水を確認します。全系統完成後にもう一度通水するのは、桝や合流部を含めた全体が正しく流れるかの最終確認です。",
    points: [
      "埋戻し前に通水し、漏水・排水不良を確認",
      "全系統完成後にもう一度通水試験",
    ],
  },

  "21.3.1": {
    plainSummary:
      "街きょ・縁石・側溝の材料（表21.3.1、種類・形状・寸法は特記、曲線部は曲線部ブロック）。街きょ・縁石は境界ブロック、L形側溝・U形側溝はプレキャスト製品。現場打ちコンクリート・鉄筋・地業材料は21.2.1による。据付け用モルタルは容積比セメント1：砂3、目地用モルタルは22章による。凍上抑制層材料は21.2.1(10)。",
    glossary: [
      {
        term: "街きょ（がいきょ）",
        meaning:
          "車道の端に沿って設ける浅い排水路。道路の雨水を集めて側溝や桝へ導く。",
      },
      {
        term: "L形側溝／U形側溝",
        meaning:
          "L形は車道端に沿わせるL字断面の側溝、U形はコの字断面の溝に上ぶたをのせる側溝。",
      },
    ],
  },

  "21.3.2": {
    plainSummary:
      "施工。地業は砂利地業（特記なければ厚さ100mm）。現場打ちのコンクリート面は金ごて仕上げとし、水勾配を縦断方向に付けて水たまりのないよう仕上げる。縁石・側溝は据付け用モルタルで通りよく据え付け、目地は幅10mm程度にモルタルを充填。降雨降雪・低温時の施工・養生は22章による。凍上抑制層・発生土処理は前節による。",
    why: "縁石や側溝は「通りよく」（一直線に、高さをそろえて）据え付けることが仕上がりの決め手です。少しでも高さや通りがずれると、水たまりができたり見た目が悪くなります。コンクリート面を金ごてで平滑に仕上げ、縦断方向に勾配を付けて水を流します。",
    points: [
      "据付け用モルタルで「通りよく」据え付ける",
      "目地は幅10mm程度にモルタル充填",
      "水勾配を付け水たまりを作らない",
    ],
    diagrams: [
      {
        svg: SVG_GUTTER,
        caption: "街きょ・縁石・側溝（L形・U形）（21.3）",
      },
    ],
  },
};

export default ch21;
