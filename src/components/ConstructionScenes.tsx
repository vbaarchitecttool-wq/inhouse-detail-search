import type { ComponentType } from "react";

interface SceneProps { fold: number; finish: number }
export interface Lesson {
  title: string;
  view: string;
  Scene: ComponentType<SceneProps>;
  steps: readonly { label: string; text: string }[];
}

const ink = "var(--text)";
const accent = "var(--accent)";
const paper = "var(--panel-solid)";

function SealScene({ fold, finish }: SceneProps) {
  // Trace a constant-radius turn and its tangent so that the free end
  // starts flat and finishes pointing back along the bonded surface.
  const angle = Math.PI * fold;
  const front = 162 + 54 * finish;
  const radius = 13;
  const arcX = front - radius * Math.sin(angle);
  const arcY = 114 - radius * (1 - Math.cos(angle));
  const free = 84 + 54 * finish - radius * angle;
  const tipX = arcX - free * Math.cos(angle);
  const tipY = arcY - free * Math.sin(angle);
  return <>
    <rect x="38" y="120" width="344" height="26" rx="2" fill={ink} opacity=".14"/>
    <path d="M38 120h344" stroke={ink}/>
    <text x="210" y="170" textAnchor="middle">被着体（実部材・化粧見本）</text>
    <path d="M72 119h90" stroke={ink} strokeWidth="3" strokeDasharray="5 2"/>
    {finish > 0 && <path d={`M162 118h${front-162}`} stroke={accent} strokeWidth="3"/>}
    <path d={`M362 114 H${front} A${radius} ${radius} 0 0 1 ${arcX} ${arcY} L${tipX} ${tipY}`}
      fill="none" stroke={accent} strokeWidth="10" strokeLinecap="round"/>
    {fold === 0
      ? <><text x="43" y="54">つかみ代</text><path d="M88 62v34l12 10" className="lesson-leader"/>
          <text x="256" y="80">硬化した材料</text></>
      : <><text x="275" y="40" textAnchor="middle">面に沿って引く</text>
          {fold > .9 && <path d={`M${tipX-16} 67h50m-10 -6 10 6-10 6`} className="lesson-arrow"/>}</>}
  </>;
}

function BoltScene({ fold, finish }: SceneProps) {
  const angle = 82 * fold; // Illustrative movement, never a target tightening angle.
  return <>
    <rect x="23" y="23" width="177" height="134" rx="4" fill={ink} opacity=".09"/>
    <g stroke={ink} strokeWidth="1.8">
      <circle cx="111" cy="88" r="54" fill={paper}/>
      <path d="M111 129v26" className="lesson-mark"/>
      <g transform={`rotate(${angle} 111 88)`}>
        <path d="M157 88l-23 40H88L65 88l23-40h46Z" fill={paper}/>
        <path d="M111 108v20" className="lesson-mark"/>
      </g>
      <circle cx="111" cy="88" r="20" fill={paper}/>
      <path d="M111 99v9" className="lesson-mark"/>
      {finish < .4 && <circle cx="111" cy="88" r="9" fill={ink}/>}
    </g>
    <text x="111" y="180" textAnchor="middle">白線の位置（着色）</text>
    <g stroke={ink} strokeWidth="1.8">
      <rect x="241" y="114" width="135" height="24" rx="2" fill={paper}/>
      <rect x="263" y="107" width="91" height="7" fill={paper}/>
      <path d="M274 107V80l8-4h55l7 4v27Z" fill={paper}/>
      <path d="M293 76V61h31v15 M294 69l29-4 M294 74l29-4" fill="none"/>
      {finish < .4 && <path d="M299 61V41h20v20 M304 43v14 M309 43v14 M314 43v14" fill="none"/>}
    </g>
    <text x="308" y="24" textAnchor="middle">{finish < .4 ? "ピンテール" : "ピンテール破断後"}</text>
    <text x="308" y="180" textAnchor="middle">側面</text>
  </>;
}

function TremieScene({ fold, finish }: SceneProps) {
  const surface = 107 - 32 * fold;
  const tip = 157 - 32 * finish;
  return <>
    <rect x="88" y="22" width="150" height="153" fill={accent} opacity=".06"/>
    <rect x="88" y={surface} width="150" height={175-surface} fill={ink} opacity=".23"/>
    <path d="M88 22v153h150V22" className="lesson-leader"/>
    <path d="M100 26v143 M226 26v143" stroke={ink} strokeWidth="3" opacity=".55"/>
    <path d={`M88 ${surface}H238`} stroke={ink} strokeWidth="2"/>
    <path d={`M151 14V${tip}h18V14`} fill={paper} stroke="none"/>
    <path d={`M151 14V${tip} M169 14V${tip}`} stroke={accent} strokeWidth="3"/>
    <path d="M160 40v28m-5-6 5 6 5-6" className="lesson-arrow"/>
    <text x="13" y="45">管内へ</text><text x="13" y="64">投入</text>
    <path d="M57 48h30l55-13" className="lesson-leader"/>
    <path d={`M239 ${surface}h38 M171 ${tip}H277`} stroke={ink} strokeDasharray="3 3" opacity=".65"/>
    <path d={`M270 ${surface}V${tip}m-5 0h10 M265 ${surface}h10`} className="lesson-arrow"/>
    <text x="283" y={surface+4}>打上り面</text>
    <text x="283" y={(surface+tip)/2+5} fontWeight="700" fill={accent}>2m以上</text>
    <text x="283" y={tip+5}>管先端</text>
    <text x="163" y="194" textAnchor="middle">杭孔の縦断面（模式）</text>
  </>;
}

export const lessons: Readonly<Partial<Record<string, Lesson>>> = {
  "4.5.5": {
    title: "トレミー管の先端はどこにあるか", view: "打込み中の縦断面", Scene: TremieScene,
    steps: [
      { label: "管先端の位置", text: "打込み中の場面。根入れは、コンクリートの打上り面から管先端までの鉛直距離で読む。" },
      { label: "打上り面が上昇", text: "管からコンクリートを連続して打ち込む。管の高さを保っている間は打上り面が上がり、管の根入れが深くなる。" },
      { label: "管の高さを調整", text: "打上り面と管先端の深さを確認しながら管を引き上げる。打込み中は先端をコンクリート内に2m以上保持する。" },
    ],
  },
  "7.4.8": {
    title: "高力ボルトの白線はどこが動くか", view: "トルシア形・正面と側面", Scene: BoltScene,
    steps: [
      { label: "一次締め後", text: "一次締め後、ボルトのねじ部・ナット・座金・添え板に一本の印を付ける。ピンテールはまだ付いている。" },
      { label: "本締め", text: "ナットを締めると、ナット上の印が移動する。ボルト・座金の印が添え板の印と同じ方向に残るかを見る。図の回転角は説明用。" },
      { label: "締付け後の確認", text: "ピンテールの破断と印のずれ方を確認。ナット回転量がボルト群の平均±30°の範囲、余長がねじ1～6山であることも確認する。" },
    ],
  },
  "9.7.5": {
    title: "シーリング材を180°折り返して引く", view: "簡易接着性試験・硬化後の側面", Scene: SealScene,
    steps: [
      { label: "つかみ代を確認", text: "実部材または化粧見本に作製した試験片を使う。シーリング材に弾性が現れたら、接着させていない端をつかむ。" },
      { label: "端を折り返す", text: "つかんだ端を被着面側へ180°折り返す。横から見て、材料が折り返し部でU字になる向きを確認する。" },
      { label: "面に沿って引く", text: "折り返した端を被着面に沿って引き、破壊した面を観察する。図は材料が被着面に薄く残る例。凝集破壊または薄層凝集破壊を合格とする。" },
    ],
  },
};
