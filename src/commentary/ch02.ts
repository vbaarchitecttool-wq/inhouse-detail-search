// 2章 仮設工事 — やさしい解説
// 原文は src/spec_index.json（PDFから自動生成）。このファイルは手書きで管理する。
// SVGは currentColor を使い、ライト/ダーク両テーマに追従させる。

import type { Commentary } from "../types";

const SVG_KIJUN_FLOW = `
<svg viewBox="0 0 660 240" role="img" aria-label="着工時に基準をつくる流れ。敷地の状況確認と監督職員への報告、縄張りで建物の位置を示す、ベンチマークで高さの基準をつくる、遣方で位置と水平の基準を表示する。縄張り、ベンチマーク、遣方はそれぞれ監督職員の検査を受ける">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="20"  y="50" width="140" height="70" rx="8"/>
    <rect x="185" y="50" width="140" height="70" rx="8"/>
    <rect x="350" y="50" width="140" height="70" rx="8"/>
    <rect x="515" y="50" width="130" height="70" rx="8"/>
  </g>
  <g stroke="currentColor" stroke-width="1.8">
    <line x1="160" y1="85" x2="177" y2="85"/>
    <line x1="325" y1="85" x2="342" y2="85"/>
    <line x1="490" y1="85" x2="507" y2="85"/>
  </g>
  <g fill="currentColor">
    <polygon points="185,85 173,79 173,91"/>
    <polygon points="350,85 338,79 338,91"/>
    <polygon points="515,85 503,79 503,91"/>
  </g>
  <g fill="currentColor" font-size="13" font-weight="bold" text-anchor="middle">
    <text x="90"  y="78">① 敷地の</text>
    <text x="90"  y="96">状況確認</text>
    <text x="255" y="78">② 縄張り</text>
    <text x="255" y="96">（位置）</text>
    <text x="420" y="78">③ ベンチマーク</text>
    <text x="420" y="96">（高さ）</text>
    <text x="580" y="78">④ 遣方</text>
    <text x="580" y="96">（位置＋水平）</text>
  </g>
  <g fill="currentColor" font-size="11.5" text-anchor="middle" opacity="0.85">
    <text x="90"  y="145">境界・高低差・周辺を</text>
    <text x="90"  y="162">確認し報告</text>
    <text x="255" y="145">建物の位置を地面に表示</text>
    <text x="255" y="162">→ 検査</text>
    <text x="420" y="145">高低の基準点を設置</text>
    <text x="420" y="162">→ 検査</text>
    <text x="580" y="145">水貫・水糸で基準を表示</text>
    <text x="580" y="162">→ 検査</text>
  </g>
  <g fill="currentColor" font-size="12" opacity="0.8">
    <text x="20" y="215">建物の位置と高さの「ものさし」を最初につくる工程。②〜④はいずれも監督職員の検査を受ける</text>
  </g>
</svg>`;

const SVG_YARIKATA = `
<svg viewBox="0 0 660 280" role="img" aria-label="遣方の構成。建物の隅などの要所に地杭を打ち、上端をかんな削りした水貫を水平に固定する。水貫の間に水糸を張って建物の位置と水平の基準を表示する。基準は工事に支障のない場所に逃げ心として控えておく">
  <g stroke="currentColor" stroke-width="6" stroke-linecap="round">
    <line x1="120" y1="90" x2="120" y2="230"/>
    <line x1="220" y1="90" x2="220" y2="230"/>
    <line x1="520" y1="90" x2="520" y2="230"/>
  </g>
  <g fill="currentColor" opacity="0.8">
    <rect x="90" y="110" width="180" height="14" rx="2"/>
    <rect x="490" y="110" width="90" height="14" rx="2"/>
  </g>
  <g stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.9">
    <line x1="180" y1="117" x2="535" y2="117"/>
  </g>
  <g stroke="currentColor" stroke-width="2" opacity="0.5">
    <line x1="40" y1="230" x2="620" y2="230"/>
  </g>
  <g fill="currentColor" font-size="12.5">
    <text x="60" y="60" font-weight="bold">水貫：上端をかんな削りして「水平」に固定（この上端が高さの基準）</text>
    <text x="300" y="105" opacity="0.9">水糸（建物の通り心を示す）</text>
    <text x="96" y="256" opacity="0.85">地杭</text>
    <text x="470" y="256" opacity="0.85">逃げ心（控えの基準）</text>
  </g>
  <g fill="currentColor" font-size="12" opacity="0.8">
    <text x="250" y="160">・建物の隅など要所に設ける</text>
    <text x="250" y="182">・基準を表示 → 監督職員の検査</text>
    <text x="250" y="204">・検査の巻尺はJIS 1級</text>
  </g>
</svg>`;

const SVG_ASHIBA = `
<svg viewBox="0 0 660 280" role="img" aria-label="手すり先行工法。足場の組立解体変更の作業時と使用時には、常時すべての作業床に手すり、中桟、幅木の機能を持つものを設置する">
  <g stroke="currentColor" stroke-width="5" stroke-linecap="round">
    <line x1="150" y1="40" x2="150" y2="240"/>
    <line x1="450" y1="40" x2="450" y2="240"/>
  </g>
  <g fill="currentColor" opacity="0.7">
    <rect x="150" y="150" width="300" height="10"/>
  </g>
  <g stroke="currentColor" stroke-width="3">
    <line x1="150" y1="90" x2="450" y2="90"/>
    <line x1="150" y1="120" x2="450" y2="120"/>
  </g>
  <g fill="currentColor" opacity="0.85">
    <rect x="150" y="132" width="300" height="18"/>
  </g>
  <g stroke="currentColor" stroke-width="1.2" opacity="0.7">
    <line x1="470" y1="90" x2="520" y2="70"/>
    <line x1="470" y1="120" x2="520" y2="110"/>
    <line x1="470" y1="141" x2="520" y2="150"/>
    <line x1="470" y1="155" x2="520" y2="190"/>
  </g>
  <g fill="currentColor" font-size="12.5" font-weight="bold">
    <text x="526" y="74">手すり</text>
    <text x="526" y="114">中桟</text>
    <text x="526" y="154">幅木</text>
    <text x="526" y="194">作業床</text>
  </g>
  <g fill="currentColor" font-size="12" opacity="0.85">
    <text x="40" y="264">組立・解体・変更の「作業時」も「使用時」も、常時すべての作業床にこの3点セットを設置（手すり先行工法）</text>
  </g>
</svg>`;

const SVG_KIKENBUTSU = `
<svg viewBox="0 0 660 250" role="img" aria-label="危険物貯蔵所の要件。建物や仮設事務所、他の材料置場から隔離した場所に設け、屋根と壁は不燃材料で覆い、出入口に施錠し、火気厳禁の表示を行い、消火器を設ける">
  <g fill="none" stroke="currentColor" stroke-width="2">
    <rect x="80" y="70" width="200" height="130"/>
    <path d="M70 70 L180 30 L290 70"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="150" y="130" width="60" height="70"/>
  </g>
  <g fill="currentColor">
    <circle cx="200" cy="168" r="5"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="8 5" opacity="0.6">
    <rect x="30" y="15" width="330" height="215" rx="8"/>
  </g>
  <g fill="currentColor" font-size="12.5">
    <text x="390" y="50" font-weight="bold">危険物貯蔵所の5点セット</text>
    <text x="390" y="82">① 建物・事務所・置場から隔離</text>
    <text x="390" y="108">② 屋根・壁は不燃材料</text>
    <text x="390" y="134">③ 出入口に錠（施錠）</text>
    <text x="390" y="160">④ 「火気厳禁」の表示</text>
    <text x="390" y="186">⑤ 消火器等を設置</text>
  </g>
  <g fill="currentColor" font-size="11.5" text-anchor="middle" opacity="0.85">
    <text x="180" y="100">火気厳禁</text>
    <text x="180" y="222">塗料・油類などの引火性材料</text>
  </g>
</svg>`;

const ch02: Record<string, Commentary> = {
  "2.1.1": {
    plainSummary:
      "この章は建物を完成させるために必要な仮設工事（縄張り・遣方・足場・仮設物など）のルール。1章とセットで適用する。",
    why: "仮設は完成すれば消えてしまう工事ですが、①建物の位置・高さの基準をつくる（2節前半）②安全に作業する足場をつくる（2節後半）③現場を運営する施設をつくる（3節）という、工事全体の土台です。",
  },

  "2.1.2": {
    plainSummary:
      "仮設材料は適切な性能があれば新品でなくてよい（リース・転用品OK）。",
    why: "本設材料は新品が原則（1.4.2）ですが、仮設は完成後に撤去されるため中古でよい、という対比で覚えましょう。ただし「適切な性能」が条件なので、変形した単管や割れた足場板はNGです。",
  },

  "2.2.1": {
    plainSummary:
      "着工したらまず敷地境界・既存構造物・高低差・周辺状況を確認して監督職員に報告。縄張りで建物の位置を地面に示し、設計図書と照合して監督職員の検査を受ける。",
    why: "縄張りは「建物をここに建てます」という最初の意思表示です。ここで位置がずれると全てがずれるため、必ず検査を受けます。隣地との境界や越境物の確認もこの段階の重要な仕事です。",
    points: [
      "敷地境界の境界杭を必ず現地で確認（なければ監督職員に報告）",
      "縄張り検査では隣地境界からの離れ・道路からの後退距離を照合",
    ],
    glossary: [
      {
        term: "縄張り",
        meaning:
          "建物の外周位置をロープや石灰で地面に表示すること。配置の最終確認に使う。",
      },
    ],
    diagrams: [
      {
        svg: SVG_KIJUN_FLOW,
        caption: "着工時の基準づくりの流れ（2.2.1〜2.2.3）",
      },
    ],
  },

  "2.2.2": {
    plainSummary:
      "ベンチマーク（高さの基準点）は木杭・コンクリート杭等で動かないように設置して養生し、位置・高さ・設置方法について監督職員の検査を受ける。動かない既存の固定物で代用してもよい。",
    why: "建物の高さ（設計GL・各階レベル）はすべてベンチマークから測ります。工事中に重機が当たって動いてしまったら大事故のもと。だから「動かないように＋養生＋検査」の3点が規定されています。通常は2箇所以上設けて相互チェックできるようにします。",
    points: [
      "ベンチマークは移動のおそれのない場所に設置し、周囲を柵等で養生",
      "定期的に相互チェックして動いていないことを確認",
    ],
    glossary: [
      {
        term: "ベンチマーク（BM）",
        meaning:
          "工事中の高さの基準点。敷地付近の動かない点に設け、建物の高さはすべてここから追う。",
      },
    ],
  },

  "2.2.3": {
    plainSummary:
      "縄張りの後、建物の隅など要所に遣方を設け、工事に支障のない場所に逃げ心を設ける。水貫は上端をかんな削りして水平に固定。位置・水平の基準を明確に表示して監督職員の検査を受ける。巻尺はJIS 1級。",
    why: "遣方は「位置と高さの基準を、掘削しても消えない高さに写した仮設の定規」です。水貫の上端をかんな削りするのは、この上端そのものが高さの基準面になるから。基礎工事が始まると建物位置の墨は掘削で消えるため、離れた場所に控え（逃げ心）を取っておきます。",
    points: [
      "水貫の上端＝高さの基準。傷めないよう養生する",
      "逃げ心は掘削・重機の動線にかからない場所に",
      "基準巻尺はJIS 1級（鉄骨製作用巻尺とのテープ合わせにも使う）",
    ],
    glossary: [
      {
        term: "遣方（やりかた）",
        meaning:
          "建物の位置・水平を示すために隅部などに設ける仮設の基準枠。地杭＋水貫＋水糸で構成。",
      },
      {
        term: "水貫（みずぬき）",
        meaning: "遣方の地杭に水平に取り付ける貫板。上端が高さの基準になる。",
      },
      {
        term: "逃げ心（にげしん）",
        meaning:
          "工事で消える基準墨を、支障のない場所に控えとして写した墨。ここから元の位置を復元する。",
      },
    ],
    diagrams: [
      {
        svg: SVG_YARIKATA,
        caption: "遣方の構成（2.2.3）",
      },
    ],
  },

  "2.2.4": {
    plainSummary:
      "足場・作業構台・仮囲いは労働安全衛生法等に基づく適切な材料・構造とし保守管理する。足場は手すり先行工法により、組立・解体・変更の作業時も使用時も、常時すべての作業床に手すり・中桟・幅木を設置する。定置する足場は関連工事の関係者に無償で使用させる。",
    why: "建設業の死亡事故の最多原因は墜落・転落です。手すり先行工法は「手すりのない作業床には人を乗せない」という考え方で、組み立てている最中から手すりが先に付きます。「作業時も使用時も常時」「全ての作業床」という言葉の強さに注目してください。",
    points: [
      "手すり・中桟・幅木の3点セットが常時あるか、朝の点検で確認",
      "足場の組立・変更後は点検記録を残す",
      "電気・設備業者も使う足場＝無償使用させる（費用トラブル防止のため計画時に共有）",
    ],
    glossary: [
      {
        term: "手すり先行工法",
        meaning:
          "足場の組立・解体時に、作業床に上がる前から手すりが設置されている状態を保つ工法。墜落防止対策の標準。",
      },
      {
        term: "幅木（はばき）",
        meaning:
          "作業床の縁に立てる板。工具や資材の落下を防ぐ。",
      },
      {
        term: "作業構台",
        meaning:
          "資材の荷受けや重機作業のために設ける仮設のステージ。",
      },
    ],
    diagrams: [
      {
        svg: SVG_ASHIBA,
        caption: "手すり先行工法：作業床の3点セット（2.2.4）",
      },
    ],
  },

  "2.3.1": {
    plainSummary:
      "監督職員事務所の設置・規模・設備・備品は特記による。光熱水費・通信費・消耗品は受注者負担。作業員宿舎は工事現場内に設けない。現場の適切な場所に工事名称・発注者等の表示板を設ける。",
    points: [
      "監督職員事務所の光熱水費等は受注者負担（見積り時に忘れやすい）",
      "作業員宿舎の現場内設置は不可",
    ],
  },

  "2.3.2": {
    plainSummary:
      "塗料・油類など引火性材料の貯蔵所は、建物・仮設事務所・他の置場から隔離し、屋根・壁を不燃材料で覆い、出入口に施錠、「火気厳禁」を表示し、消火器を設ける。",
    why: "現場火災の多くは可燃物の管理不良から起こります。「隔離・不燃・施錠・表示・消火器」の5点セットは消防法等の要求でもあり、危険物の量によっては消防署への届出も必要です。",
    diagrams: [
      {
        svg: SVG_KIKENBUTSU,
        caption: "危険物貯蔵所の要件（2.3.2）",
      },
    ],
  },

  "2.3.3": {
    plainSummary: "材料置場・下小屋（加工小屋）は使用目的に適した構造とする。",
    glossary: [
      {
        term: "下小屋（したごや）",
        meaning: "現場内で材料の加工や仮置きをするための仮設小屋。",
      },
    ],
  },

  "2.4.1": {
    plainSummary:
      "工事完成までに仮設物を撤去し、撤去跡と付近の清掃・地均しを行う。仮設物が工事の障害になり移転場所がない場合は、監督職員の承諾を受けて工事目的物の一部を使用できる。",
    why: "「仮設は撤去して原状回復まで」が仕事の完了です。完成した建物の一部を資材置場や事務所に使いたい場合（例：完成した1階を仮事務所に）は、勝手に使わず承諾が必要です。",
  },
};

export default ch02;
