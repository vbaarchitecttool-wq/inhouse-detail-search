import { useId } from "react";
import type { Lesson, SceneProps } from "./ConstructionScenes";

const ink = "currentColor";
const accent = "var(--accent)";
const paper = "var(--panel-solid)";
const clamp = (n: number) => Math.max(0, Math.min(1, n));

const traceY = (x: number) => 146 - 11 * Math.sin(4 * Math.PI * x);
const pressureTrace = Array.from({ length: 65 }, (_, i) => `${33 + 103*i/64},${traceY(i/64)}`).join(" ");

// Show both sides of the same specimen while the pressure trace and spray run together.
function SashWaterTest({ start, finish, time }: SceneProps) {
  const elapsed = Math.max(0, time - 5000);
  const phase = (elapsed / 2400) % 1;
  const testing = time >= 5000;

  const marker = (elapsed % 4800) / 4800;
  return <>
    <text x="106" y="16" textAnchor="middle">圧力箱（屋外側）</text>
    <text x="290" y="16" textAnchor="middle">室内側</text>
    <path d="M195 28H29v32H12v17h17v43h166" fill="none" stroke={ink} strokeWidth="2.4"/>
    <path d="M198 29h15v11h-3v64h4v16h-19v-16h6V40h-4Z" fill={paper} stroke={ink} strokeWidth="2"/>
    <path d="M204 42v60" stroke={accent} strokeWidth="1.6"/>
    <text x="232" y="59">サッシ</text><path d="M229 62l-17 5" className="lesson-leader"/>
    <g opacity={.4+.6*start} stroke={ink} fill={paper}>
      <path d="M90 29v78" fill="none" strokeWidth="2"/>
      {[46,72,98].map(y => <path key={y} d={`M90 ${y-2}h4l5 -2v8l-5-2h-4Z`}/>)}
    </g>
    {testing && <g fill="none" stroke={accent} strokeWidth="1.6">
      {[46,72,98].flatMap(y => [-10,0,10].map(dy =>
        <path key={y+":"+dy} d={`M100 ${y}l97 ${dy}`} strokeDasharray="4 7" strokeDashoffset={-11*((elapsed%600)/600)}/>))}
      <path d="M15 69h49l-8-4m8 4-8 4" strokeWidth={2 + (1 + Math.sin(phase*2*Math.PI))}/>
    </g>}
    <g opacity={finish}>
      <circle cx="209" cy="107" r="16" fill="none" stroke={accent} strokeWidth="2"/>
      <path d="M225 110l47 9" className="lesson-leader"/>
      <circle cx="310" cy="123" r="36" fill={paper} stroke={ink}/>
      <path d="M292 96v35h-6v9h25v-8h-9V96" fill="none" stroke={ink} strokeWidth="2.5"/>
      <path d="M331 118h-22l5-4m-5 4 5 4" className="lesson-arrow"/>
      <text x="314" y="178" textAnchor="middle">室内側の観察例</text>
    </g>
    <path d="M32 128v35h109" className="lesson-leader"/>
    {testing && <><polyline points={pressureTrace} stroke={accent} fill="none"/><circle cx={33+103*marker} cy={traceY(marker)} r="3.4" fill={accent}/></>}
    <text x="87" y="185" textAnchor="middle">内外圧力差の推移</text>
  </>;
}

function ConcreteJoint({ start, fold, finish }: SceneProps) {
  const profile = "38 115 52 111 67 115 77 110 90 114 105 109 119 114 131 110 144 114 158 110 170 113 184 109 196 113 209 109 222 114 237 110 250 114 268 110";
  const clipId = useId();
  const weakLayerId = useId();
  return <>
    <defs>
      <clipPath id={clipId}><rect x="38" y={115-72*finish} width="230" height={72*finish}/></clipPath>
      <clipPath id={weakLayerId}><rect x={38+230*fold} y="103" width={230*(1-fold)} height="13"/></clipPath>
    </defs>
    <g stroke={ink} strokeWidth="3"><path d="M104 34v137m112-137v137"/></g>
    <polygon points={profile+" 268 169 38 169"} fill={paper}/>
    <polygon points={profile+" 268 169 38 169"} fill={ink} fillOpacity=".19" stroke={ink}/>
    <g fill={ink} opacity=".3">
      {[50,86,126,164,201,235].map((x,i) => <ellipse key={x} cx={x} cy={126+11*(i%3)} rx="5" ry="2.5"/>)}
    </g>
    <g clipPath={`url(#${clipId})`} opacity={finish>0 ? 1 : 0}>
      <polygon points={profile+" 268 43 38 43"} fill={accent} fillOpacity=".32" stroke={ink}/>
    </g>
    <polygon points={profile+" 268 105 38 105"} clipPath={`url(#${weakLayerId})`} fill="#ac8149"/>
    <path d="M37 46v124h232V46" fill="none" stroke={ink} strokeWidth="2"/>
    {fold>0 && fold<1 && <g transform={`translate(${38+230*fold} 107)`}>
      <path d="M-8 0l15-4 10-16" fill="none" stroke={ink} strokeWidth="3"/>
    </g>}
    <path d={finish > 0 ? "M292 69h-33" : "M292 87l-40 19"} className="lesson-leader" opacity={.55+.45*start}/>
    <text x="297" y={finish > 0 ? 74 : 85}>{finish > 0 ? "次の打込み" : fold===1 ? "処理した面" : "表面の弱い層"}</text>
    <text x="297" y="148">先打ち部分</text><path d="M291 144h-24" className="lesson-leader"/>
    <text x="155" y="193" textAnchor="middle">{finish>0 ? "打継ぎ面が隠れる" : fold===1 ? "健全な面の露出・滞水を確認" : "壁の水平打継ぎ"}</text>
  </>;
}

function DrainInvert({ start, fold, finish }: SceneProps) {
  const pipeOffset = -16 * (1 - start);
  const streamEnd = 16 + 268*finish;
  const streamHeight = (x: number) => 103 + (x-16)*.055;
  return <>
    <text x="42" y="41">流入管</text><text x="227" y="53">流出管</text>
    <path d="M72 54h14v30H72Zm0 56h14v31h129v-23h14v39H72Zm143-55h14v37h-14Z" fill={ink} fillOpacity=".2" stroke={ink}/>
    <g transform={`translate(0 ${pipeOffset})`} fill="none" stroke={ink} strokeWidth="2.2">
      <path d="M16 81l77 4m-77 19 77 5m-1-24v3m0 18v3 M209 91l75 4m-75 21 75 4m-75-29v3m0 19v3"/>
    </g>
    <path d="M86 141L86 110l129 7v24Z" fill={accent} fillOpacity={.32*fold} stroke={accent} strokeOpacity={fold}/>
    <text x="350" y="54" textAnchor="middle">桝底の横断面</text>
    <path d="M306 70v71h86V70" fill="none" stroke={ink} strokeWidth="2"/>
    <g opacity={fold}>
      <path d="M307 87h15a27 27 0 0 0 54 0h15v53h-84Z" fill={accent} fillOpacity=".32" stroke={accent}/>
      <text x="350" y="164" textAnchor="middle">半円形の溝</text>
    </g>
    {finish > 0 && <g fill="none" stroke={accent} strokeLinecap="round">
      <path d={`M16 103L${streamEnd} ${streamHeight(streamEnd)}`} strokeWidth="3"/>
      <path d="M328 104q21 18 42 0" strokeOpacity={finish} strokeWidth="3"/>
      {finish>.88 && <path d="M275 111l9 7-11 4" strokeWidth="2"/>}
    </g>}
    <text x="149" y="190" textAnchor="middle">{finish>0 ? "流入管 → インバート → 流出管" : fold>0 ? "管底に合わせて溝を仕上げる" : "管を先に取り付ける"}</text>
  </>;
}

function BlockCourse({ start, fold, finish }: SceneProps) {
  // The open end reveals the trough. Its two long edges recede in the same direction as the bar.
  const end = "M47 100h14v20q0 5 5 5h15q5 0 5-5v-20h14v50H47Z";
  const seating = clamp(finish/.6);
  const reveal = clamp((finish-.6)/.4);
  const rodY = 91+29*fold;
  return <>
    <g stroke={ink} strokeLinejoin="round" fill={paper} strokeWidth="1.5">
      <path d="M47 100l165-40h14L61 100Z"/>
      <path d="M61 100l165-40v23L61 125Z" fill={ink} fillOpacity=".16"/>
      <path d="M61 125l165-42h25L86 125Z"/>
      <path d="M86 100l165-40h14l-165 40Z"/>
      <path d="M100 100l165-40v50l-165 40Z" fill={ink} fillOpacity=".16"/>
      <path d={end} fill={paper}/>
    </g>
    {fold>0 && <g stroke={accent} strokeWidth="6" strokeLinecap="round" opacity={clamp(fold*6)}>
      <path d={`M74 ${rodY}l164-40`}/>
    </g>}
    <path d={end} fill="none" stroke={ink} strokeWidth="1.4"/>
    <g opacity={seating} fill="#aa845a"><path d="M47 97l165-40h14L61 97Z M86 97l165-40h14L100 97Z" stroke="#aa845a" strokeWidth="2"/></g>
    {finish>0 && <g transform={`translate(0 ${-18*(1-seating)})`} fill={paper}
      stroke={ink} strokeLinejoin="round" opacity={seating*(1-.73*reveal)}>
      <path d="M47 97V58h53v39Z M47 58l165-40h53L100 58Z M100 58l165-40v39L100 97Z"/>
      <path d="M72 54l62-15h23l-62 15Z M149 35l62-15h23l-62 15Z" fill={ink} fillOpacity=".15"/>
    </g>}
    <text x="278" y="80">{finish>0 ? "次段を透視" : fold>0 ? "横筋" : "連続する溝"}</text>
    <path d={finish>0 ? "M274 82l-50-21" : fold>0 ? `M273 82l-57 ${rodY-116}` : "M273 82l-53 6"} className="lesson-leader" opacity={.45+.55*start}/>
    {finish>0 && <><text x="278" y="132">横目地</text><path d="M273 127l-55 -21-48-26" className="lesson-leader"/></>}
    <text x="155" y="184" textAnchor="middle">{finish>0 ? "横筋の段と横目地の高さを見る" : "基本形横筋ブロックの部分透視図"}</text>
  </>;
}

function StudBend({ start, fold, finish }: SceneProps) {
  const angle = 15*fold;
  return <>
    <path d="M23 150h180v20H23Z" fill={ink} fillOpacity=".22" stroke={ink}/>
    <path d="M101 146V34" fill="none" stroke={ink} strokeDasharray="4 3"/>
    <g transform={`rotate(${angle} 101 148)`} fill={paper} stroke={ink} strokeWidth="2">
      <path d="M97 148V59h-6V49h20v10h-6v89Z"/>
    </g>
    <path d="M89 150l5-7 5-2h5l5 2 5 7Z" fill={ink}/>
    {fold>0 && <g fill="none" stroke={accent} strokeWidth="2">
      <path d={`M101 83A65 65 0 0 1 ${101+65*Math.sin(angle*Math.PI/180)} ${148-65*Math.cos(angle*Math.PI/180)}`}/>
      <path d="M51 82h34l-7-4m7 4-7 4"/>
    </g>}
    <text x="136" y="57">{fold>0 ? Math.round(angle)+"°" : "曲げる前"}</text>
    <text x="49" y="27" opacity={.6+.4*start}>試験対象のスタッド</text>
    <g opacity={finish}>
      <circle cx="101" cy="148" r="17" fill="none" stroke={accent} strokeWidth="1.8"/>
      <path d="M116 141l101-35" className="lesson-leader"/>
      <circle cx="272" cy="91" r="53" fill={paper} stroke={ink}/>
      <path d="M229 118h86M256 115q3-9 11-11l11-41 10 3-11 40q8 2 12 12Z" fill={ink} fillOpacity=".2" stroke={ink} strokeWidth="1.8"/>
      <path d="M300 89l-16 14m2-7-2 7 7-1" className="lesson-arrow"/>
      <text x="277" y="166" textAnchor="middle">溶接部を観察</text>
    </g>
    <text x="116" y="191" textAnchor="middle">{fold===0 ? "鉛直な元の軸を示す" : "破線は曲げる前の軸"}</text>
  </>;
}

function RetainingDrain({ start, fold, finish }: SceneProps) {
  // The outlet is on the exposed face (left); a filter covers the buried inlet.
  return <>
    <path d="M214 42h177v129H177Z" fill={ink} opacity=".12"/>
    <path d="M167 42h52l-33 129h-54Z" fill="#a59571" fillOpacity=".58" stroke={ink}/>
    <path d="M126 42h41l-35 129H81Z" fill={ink} fillOpacity=".19" stroke={ink}/>
    <path d="M126 42l-45 129H54l44-129Z" fill={paper} stroke={ink}/>
    <path d="M85 79h28m-39 32h28m-39 32h27" stroke={ink}/>
    <path d="M73 119l123-10 1 9-128 11Z" fill={paper} stroke={ink} strokeWidth="1.6"/>
    <g opacity={fold}>
      <g fill={paper} stroke={ink}>
        {[[207,103],[218,108],[207,115],[218,121],[207,127],[228,99],[229,113]].map(([x,y]) =>
          <path key={x+":"+y} d={`M${x-4} ${y}l3-4 5 2 1 4-4 3-5-2Z`}/>)}
      </g>
      <path d="M197 98l2 31" stroke={ink} strokeWidth="4" strokeDasharray="2 1"/>
    </g>
    <text x="38" y="24">前面</text><text x="250" y="24">背面（土側）</text>
    <text x="260" y="66">{fold>0 ? "砂利・砕石" : "透水層（裏込め材）"}</text>
    <path d={fold>0 ? "M255 69l-37 30" : "M255 69l-54-9"} className="lesson-leader" opacity={.55+.45*start}/>
    {fold>0 && <><text x="249" y="146">土砂流出防止マット</text><path d="M245 142l-45-19" className="lesson-leader"/></>}
    {finish>0 && <path d="M210 48q-8 33 5 55q3 8-18 10l-125 11q-10 2-12 13" stroke={accent} strokeWidth="3" fill="none"
      strokeDasharray="245 246" strokeDashoffset={245*(1-finish)}/>}
    {finish>.95 && <path d="M56 130l4 8 7-5" className="lesson-arrow"/>}
    <text x="200" y="192" textAnchor="middle">{finish>0 ? "背面から管内を通り、前面へ排水" : fold>0 ? "水抜き管の入口を確認" : "間知石の練積み・水抜き部の断面"}</text>
  </>;
}

export const fieldInspectionLessons: Readonly<Record<string, readonly Lesson[]>> = {
  "16.1.2": [{
    title: "サッシの水密性試験", view: "JIS A 1517に基づく試験室での例・装置断面", Scene: SashWaterTest, inspectionStep: 2,
    steps: [
      { label: "試験体を確認", text: "圧力箱の開口にサッシを取り付ける。箱内が屋外側、反対側が室内側。散水ノズルと観察側の位置を確認する。" },
      { label: "散水と脈動圧", text: "屋外面に毎分4 L/m²の水を噴霧し、等級に応じた内外圧力差を周期的に変化させる。グラフは変化の模式図。" },
      { label: "室内側を見る", text: "散水と加圧を続けている間、室内側で漏水の有無・位置・状態を観察する。拡大図は下枠の一例。実際の試験時間は10分間。" },
    ],
  }],
  "6.6.4": [{
    title: "打継ぎ面が隠れる前に", view: "壁の水平打継ぎ・縦断面", Scene: ConcreteJoint, inspectionStep: 1,
    steps: [
      { label: "先打ち面を見る", text: "先に打ったコンクリートの上面を見る。茶色は表面に残ったレイタンスなどの弱い層を強調したもの。" },
      { label: "打継ぎ面を確認", text: "レイタンスや弱いコンクリートを取り除く。次を打つ前に、健全なコンクリートが露出し、水がたまっていないことを確認する。" },
      { label: "次を打ち込む", text: "処理した面に次のコンクリートを打ち込む。青い部分が後打ち。先打ちとの境界に、先ほど確認した打継ぎ面が残る。" },
    ],
  }],
  "21.2.2": [{
    title: "汚水桝の管底とインバート", view: "直線型の例・縦断面と桝底の横断面", Scene: DrainInvert, inspectionStep: 1,
    steps: [
      { label: "流入・流出管", text: "先に排水管を取り付ける。左が流入側、右が流出側。縦断面でそれぞれの管底の高さを確認する。勾配の表現は説明用。" },
      { label: "桝底に溝を作る", text: "汚水が入る桝では、管の施工後、流れに沿って半円形の溝を作りモルタルで仕上げる。左図で管底とのつながり、右図で溝の形を見る。" },
      { label: "水の経路を追う", text: "水は流入管から桝底のインバートを通り、流出管へ向かう。水の線は完成後の流れを示す。" },
    ],
  }],
  "8.2.7": [{
    title: "ブロックの横筋はどの段に納まるか", view: "横筋のある段の部分図・斜め上から", Scene: BlockCourse, inspectionStep: 2,
    steps: [
      { label: "横筋用の段", text: "横筋を入れる段には基本形横筋ブロックを使う。手前の切り口から奥に続く溝を確認する。" },
      { label: "溝に横筋を配置", text: "横筋を壁の長さ方向に連続させて溝に納める。青い線が横筋。側面の一部を透かし、縦筋や充填材は省略している。" },
      { label: "次段を透視", text: "次段を重ねて透視する。横筋は下段の溝の中、横目地モルタル（茶色）は上下のブロックが接する面にある。両者の高さを見比べる。" },
    ],
  }],
  "7.7.6": [{
    title: "スタッド溶接の打撃曲げ試験", view: "溶接完了後の抜取り試験・側面", Scene: StudBend, inspectionStep: 2,
    steps: [
      { label: "試験対象を確認", text: "抜取り試験の対象に選んだスタッドを現位置で試験する。図の破線が打撃前の軸、下の板が溶接した母材。" },
      { label: "15°まで曲げる", text: "打撃を加えて15°まで曲げる。元の軸と曲げたスタッドを側面から重ねて、曲がる方向と角度を見る。" },
      { label: "溶接部を観察", text: "曲げた後は根元の溶接部を確認する。割れなどの欠陥がなければ、試験したスタッドは曲げた状態のまま使用する。" },
    ],
  }],
  "20.4.3": [{
    title: "石積み背面の水抜き", view: "間知石の練積み・透水層に裏込め材を用いる例", Scene: RetainingDrain, inspectionStep: 1,
    steps: [
      { label: "管の両端を見る", text: "石積みの断面で前面と背面を確認する。水抜き管は石積みと裏込めコンクリートを貫き、背面の水を前面に導く。" },
      { label: "入口を確認", text: "管の背面側の入口に土砂流出防止マットを設け、そのまわりに砂利または砕石を置く。埋め戻す前に位置を確かめる。" },
      { label: "排水を追う", text: "青い線で一つの水の経路を追う。背面の透水層から入口に達した水が、管を通って石積み前面に出る。" },
    ],
  }],
};
