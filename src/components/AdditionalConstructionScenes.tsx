import { useId } from "react";
import type { Lesson, SceneProps } from "./ConstructionScenes";

const ink = "currentColor";
const accent = "var(--accent)";
const paper = "var(--panel-solid)";
const clamp = (n: number) => Math.max(0, Math.min(1, n));

function AdhesionTestScene({ fold: extension, finish: failure }: SceneProps) {
  const upper = 89 - 34 * extension - 10 * failure;
  const lower = 132;
  const mid = (upper + lower) / 2;
  const neck = 11 * extension;
  const split = 7 * failure;
  return <>
    <g fill="none" stroke={ink} strokeWidth="3">
      <path d={`M145 13V${upper-18} M84 ${upper-11}v-7h122v7`}/>
      <path d="M84 143v7h122v-7 M145 150v23"/>
    </g>
    <g fill={ink} fillOpacity=".18" stroke={ink} strokeWidth="1.5">
      <rect x="71" y={upper-11} width="148" height="11"/><rect x="71" y={lower} width="148" height="11"/>
    </g>
    {failure === 0
      ? <path d={`M108 ${upper}h74 Q${182-2*neck} ${mid} 182 ${lower}h-74 Q${108+2*neck} ${mid} 108 ${upper}Z`} fill={accent}/>
      : <g fill={accent}>
      <path d={`M108 ${upper}h74 Q${182-neck} ${mid-7} ${182-neck} ${mid-split} l-18 -2 -17 4 -16 -4 L${108+neck} ${mid-split} Q${108+neck} ${mid-7} 108 ${upper}Z`}/>
      <path d={`M108 ${lower}h74 Q${182-neck} ${mid+7} ${182-neck} ${mid+split} l-18 -2 -17 4 -16 -4 L${108+neck} ${mid+split} Q${108+neck} ${mid+7} 108 ${lower}Z`}/>
    </g>}
    <path d={`M219 ${upper-5}h22l12 -7`} className="lesson-leader"/>
    <text x="260" y={upper-9}>被着体</text>
    <path d={`M185 ${mid}h63`} className="lesson-leader"/>
    <text x="255" y={mid+5}>{failure > .1 ? "破断面の例" : "シーリング材"}</text>
    <text x="145" y="194" textAnchor="middle">試験機のつかみ具と試験体</text>
    {extension > 0 && <path d="M50 82V43l-5 8m5-8 5 8" className="lesson-arrow"/>}
  </>;
}

export const adhesionTest: Lesson = {
  title: "シーリング材の引張接着性試験", choiceLabel: "引張接着性試験｜H形試験体",
  view: "H形試験体・側面（下側固定の例）", Scene: AdhesionTestScene,
  steps: [
    { label: "試験体を装着", text: "使用する材料と同様に作った二つの被着体の間でシーリング材を硬化・養生し、試験体を引張試験機に取り付ける。" },
    { label: "間隔を広げる", text: "上下の被着体の間隔が広がる方向に載荷する。接着した両端を通じて引張力が伝わり、中央のシーリング材が伸びる。" },
    { label: "結果を確認", text: "図は材料内部で破断した一例。荷重と伸びの関係、破壊の位置・状態を確認する。試験条件はJIS A 1439の引張接着性試験による。" },
  ],
};

function BaseGroutScene({ fold: erect, finish: fill }: SceneProps) {
  const lift = 42 * (1 - clamp(erect / .7));
  const form = clamp((erect - .65) / .35);
  const left = clamp(fill / .55);
  const right = clamp((fill - .35) / .55);
  const overflow = clamp((fill - .88) / .12);
  return <>
    <path d="M23 153h272v26H23z" fill={ink} fillOpacity=".17" stroke={ink}/>
    <path d="M141 153l4-22h31l4 22z" fill={ink} fillOpacity=".64" stroke={ink}/>
    {erect > 0 && <g transform={`translate(0 ${-lift})`} opacity={clamp(erect * 7)}>
      <path d="M145 27v92h-65v12h161v-12h-64V27" fill={paper} stroke={ink} strokeWidth="2"/>
      <path d="M152 27v91m18-91v91" stroke={ink} opacity=".55"/>
    </g>}
    <g opacity={form} fill={ink}>
      <rect x="62" y="109" width="5" height="44"/><rect x="255" y="109" width="5" height="44"/>
    </g>
    {fill > 0 && <g fill={accent} fillOpacity=".8">
      <path d={`M67 152v-21h${78*left}l-4 21z`}/>
      <path d={`M179 152l-3 -21h${79*right}v21z`}/>
      <rect x="67" y={131-11*left} width="13" height={11*left}/>
      <rect x="241" y={131-12*overflow} width="14" height={12*overflow}/>
    </g>}
    {fill > 0 && <path d="M31 118h23l17 12m-9-1 9 1-4-8" className="lesson-arrow"/>}
    <text x="284" y="70">{erect === 0 ? "建込み前" : "ベースプレート"}</text>
    {erect > 0 && <path d={`M278 76l-41 ${48-lift}`} className="lesson-leader"/>}
    <text x="284" y="126">{fill > 0 ? "圧入・充填" : "硬練りモルタル"}</text>
    <path d={fill > 0 ? "M277 130l-29 6" : "M276 131l-98 12"} className="lesson-leader"/>
    <text x="155" y="197" textAnchor="middle">柱脚の断面（アンカーボルトは省略）</text>
  </>;
}

export const baseGrout: Lesson = {
  title: "ベースプレート下をどの順番で埋めるか", view: "柱底均しモルタル・A種（表7.10.2）", Scene: BaseGroutScene,
  steps: [
    { label: "中央を先に施工", text: "目荒ししたコンクリート上で、プレート中央下部に当たる位置へ柱を支持する硬練りモルタル等を所定の高さに施工する。" },
    { label: "柱を建て込む", text: "柱を建て込み、プレートの周囲に型枠を設ける。中央の支持部の周りには、後で充填する空間がある。" },
    { label: "周囲まで圧入", text: "無収縮モルタル（着色）が中央の支持部の周りを回り込み、プレート下面に広がる。プレートの周囲からあふれ出るまで圧入する。" },
  ],
};

function JointMovementScene({ fold: filling, finish: movement }: SceneProps) {
  // Unbonded bottom, bonded vertical sides. Show opening, closing, then opening.
  const change = 17 * Math.sin(2.5 * Math.PI * movement);
  const left = 155 - change;
  const right = 225 + change;
  const bottom = 135;
  const height = 45 * filling;
  return <>
    <path d="M36 136h308v21H36z" fill={ink} opacity=".15"/>
    <g fill={ink} fillOpacity=".15" stroke={ink}>
      <rect x={left-87} y="62" width="87" height="74"/><rect x={right} y="62" width="87" height="74"/>
    </g>
    <path d={`M${left} 135H${right}`} stroke={ink} strokeWidth="3" strokeDasharray="5 2"/>
    {filling > 0 && <>
      <path d={`M${left} ${bottom-height} Q190 ${bottom-height+change*.65} ${right} ${bottom-height} V${bottom-2} Q190 ${bottom-2-Math.max(0,change)} ${left} ${bottom-2}Z`} fill={accent} fillOpacity=".66"/>
      <path d={`M${left} ${bottom-height}V133 M${right} ${bottom-height}V133`} stroke={accent} strokeWidth="3"/>
    </>}
    {movement > 0 && <g transform="translate(0 48)" className="lesson-arrow">
      <path d={`M155 0h${-change}m${change>=0?6:-6} -4l${change>=0?-6:6} 4 ${change>=0?6:-6} 4`}/>
      <path d={`M225 0h${change}m${change>=0?-6:6} -4l${change>=0?6:-6} 4 ${change>=0?-6:6} 4`}/>
    </g>}
    <text x="190" y="27" textAnchor="middle">{movement > 0 ? "硬化後の目地の開閉" : filling > 0 ? "左右の被着面に接着" : "所定深さの目地"}</text>
    <path d={`M190 ${bottom+2}v23l27 15`} className="lesson-leader"/>
    <text x="220" y="185">ボンドブレーカー</text>
  </>;
}

export const twoSidedJoint: Lesson = {
  title: "二面接着の目地が開閉するとき", view: "シーリング目地の断面・所定深さの例", Scene: JointMovementScene,
  steps: [
    { label: "目地底を処理", text: "清掃した所定深さの目地底にボンドブレーカーを設け、底への接着を防ぐ。深さの調整が必要な場合はバックアップ材を用いる。" },
    { label: "側面に密着", text: "左右の被着面にプライマーを塗り、指定時間内にシーリング材を充填して、へらで押さえる。図の左右の濃い線が接着する面。" },
    { label: "開閉に追従", text: "硬化後、目地が開くと材料が伸び、閉じると押し縮められる。左右の側面は接着したまま、底面は拘束されずに変形する。" },
  ],
};

// Probe positions are measured from the centre of the upset, in units of
// rib-to-rib distance D. The held transmitter moves between scanning ranges.
function probeOffsets(initialScan: number, reposition: number) {
  const mid = 1.4;
  const near = .83;
  const far = 2;
  if (reposition === 0) {
    return { tx: mid, rx: mid + .25 * Math.sin(4 * Math.PI * initialScan) };
  }
  const approach = clamp(reposition / .14);
  const retreat = clamp((reposition - .5) / .16);
  const firstPass = clamp((reposition - .14) / .36);
  const secondPass = clamp((reposition - .66) / .34);
  const pass = (fraction: number) => (1 - Math.cos(4 * Math.PI * fraction)) / 2;
  return {
    tx: mid + (near-mid)*approach + (far-near)*retreat,
    rx: mid + (far-mid)*pass(firstPass) - (mid-near)*pass(secondPass),
  };
}

function UltrasoundScene({ start, fold, finish }: SceneProps) {
  const rightSide = finish > 0;
  const offsets = rightSide ? probeOffsets(clamp(finish/.25), clamp((finish-.25)/.75)) : probeOffsets(start, fold);
  const scale = rightSide ? 36 : -36;
  const tx = 210 + offsets.tx * scale;
  const rx = 210 + offsets.rx * scale;
  const toward = rightSide ? -1 : 1;
  return <>
    <path d="M24 83h165q9 0 13-7q8-9 16 0q4 7 13 7h165v36H231q-9 0-13 7q-8 9-16 0q-4-7-13-7H24Z"
      fill={ink} fillOpacity=".13" stroke={ink} strokeWidth="1.7"/>
    <path d="M32 87h150m56 0h149M32 115h150m56 0h149" stroke={ink} opacity=".4"/>
    <path d="M210 61v80" stroke={ink} strokeDasharray="3 3" opacity=".65"/>
    <g transform={`translate(${tx} 83) scale(${toward} 1)`}>
      <path d="M-13 -16H3l10 10v6h-26Z" fill={accent}/>
      <path d="M-13 -12l-15 -6h-11" className="lesson-leader"/>
    </g>
    <g transform={`translate(${rx} 119) scale(${toward} -1)`}>
      <path d="M-13 -16H3l10 10v6h-26Z" fill={paper} stroke={ink} strokeWidth="2"/>
      <path d="M-13 -12l-15 -6h-11" className="lesson-leader"/>
    </g>
    <text x={tx} y="52" textAnchor="middle">送信</text>
    <text x={rx} y="159" textAnchor="middle">受信</text>
    <text x={rightSide ? 24 : 275} y="42">圧接部のふくらみ</text>
    <path d={rightSide ? "M139 45l60 32" : "M271 46l-52 30"} className="lesson-leader"/>
    <text x="210" y="191" textAnchor="middle">{rightSide ? "反対側でも同じ範囲を調べる" : fold > 0 ? "送信位置を変え、各位置で受信側を走査" : "向かい合うリブに探触子を当てる"}</text>
  </>;
}

export const ultrasonicScan: Lesson = {
  title: "ガス圧接部の探触子をどう動かすか", view: "JIS Z 3062・二探触子法の走査例（平面模式図）", Scene: UltrasoundScene,
  steps: [
    { label: "中央部を走査", text: "感度調整後の配置。ふくらみの片側で送信探触子をリブ上に固定し、向かい合うリブ上の受信探触子を前後に動かして圧接中央部を調べる。" },
    { label: "送信位置を変更", text: "送信探触子をふくらみ近くに固定して受信側を走査し、次は送信側を遠ざけた位置で走査する。圧接中央部から両側の表層部までを調べる。" },
    { label: "反対側も走査", text: "ふくらみの反対側に探触子を置き直し、同じ走査を行う。実際の位置、走査範囲、判定はJIS Z 3062による。" },
  ],
};

function CompactionScene({ start: insert, fold: vibrating, finish: withdraw }: SceneProps) {
  const tip = 66 + 82 * insert - 93 * withdraw;
  const immersed = tip > 80;
  const wave = immersed ? .6 + .35 * Math.cos(10 * Math.PI * (vibrating + withdraw)) : 0;
  return <>
    <rect x="35" y="81" width="211" height="44" fill={ink} opacity=".12"/>
    <rect x="35" y="125" width="211" height="47" fill={ink} opacity=".24"/>
    <path d="M34 51v122h213V51" className="lesson-leader"/>
    <path d="M35 125h211" stroke={ink} strokeDasharray="4 3"/>
    <g transform={`translate(153 ${tip})`}>
      <path d="M0 -138v95" stroke={ink} strokeWidth="3"/>
      <rect x="-5" y="-45" width="10" height="45" rx="4" fill={accent}/>
      {immersed && <g fill="none" stroke={accent} opacity={wave} strokeWidth="1.8">
        <path d="M-12 -26q-6 9 0 18m24-18q6 9 0 18 M-20 -29q-8 12 0 24m40-24q8 12 0 24"/>
      </g>}
    </g>
    <path d="M34 81h212" stroke={ink} strokeWidth="1.5"/>
    <path d="M71 80q23-3 45 0t47 0t44 0" fill="none" stroke={accent} strokeWidth="3" opacity={vibrating}/>
    <text x="266" y="100">今回の打込み層</text>
    <text x="266" y="152">下層</text>
    {withdraw > 0 && <path d="M195 70V37l-5 7m5-7 5 7" className="lesson-arrow"/>}
    {vibrating === 0 && <path d="M194 36v32l-5-7m5 7 5-7" className="lesson-arrow"/>}
    <text x="144" y="194" textAnchor="middle">{withdraw > 0 ? "加振しながら徐々に引き抜く" : vibrating > 0 ? "上面に浮くセメントペーストを確認" : "棒形振動機をほぼ垂直に挿入"}</text>
  </>;
}

export const concreteCompaction: Lesson = {
  title: "棒形振動機の先端とコンクリートの締固め", view: "型枠内の縦断面・連続して打ち重ねる場合", Scene: CompactionScene,
  steps: [
    { label: "下層まで挿入", text: "打込み各層ごとに棒形振動機をほぼ垂直に挿入する。今回の層とその下層の境界を越えて先端が入る位置を見る。" },
    { label: "上面を確認", text: "上面にセメントペーストが浮くまで加振する。打込み高さ・速度に応じて挿入位置を決め、挿入間隔は60cm以下とする。" },
    { label: "徐々に引抜き", text: "加振を続けたまま徐々に引き抜き、コンクリートに穴を残さない。動画の再生時間は実際の加振時間を表さない。" },
  ],
};

function FloorSeamScene({ fold: weld, finish: trim }: SceneProps) {
  const cutId = useId();
  const filled = clamp(weld / .72);
  const crown = 15 * clamp((weld - .72) / .28);
  const bladeX = 146 + 70 * trim;
  return <>
    <defs><clipPath id={cutId}><rect x={bladeX} y="63" width="120" height="42"/></clipPath></defs>
    <rect x="34" y="144" width="280" height="20" fill={ink} opacity=".2"/>
    <g fill={ink} fillOpacity=".12" stroke={ink} strokeWidth="1.6">
      <path d="M34 99h120l22 30v15H34Z"/><path d="M176 129l22-30h116v45H176Z"/>
    </g>
    <path d="M34 146h280" stroke={ink} strokeWidth="2"/>
    {weld > 0 && <>
      <path d={`M176 129l${-22*filled} ${-30*filled}h${44*filled}Z`} fill={accent}/>
      <path d={`M154 99q22 ${-2*crown} 44 0Z`} fill={accent} clipPath={`url(#${cutId})`}/>
    </>}
    {weld > 0 && weld < .97 && <g>
      <path d="M132 34l29 37 13 7-6-16-26-35Z" fill={paper} stroke={ink} strokeWidth="2"/>
      <path d={`M202 34Q179 54 176 ${129-30*filled-crown}`} fill="none" stroke={accent} strokeWidth="5"/>
      <text x="231" y="52">熱風・溶接棒</text>
    </g>}
    {trim > 0 && trim < .99 && <path d={`M${bladeX} 99l-29-5-14-12 27 4Z`} fill={paper} stroke={ink} strokeWidth="1.6"/>}
    <text x="176" y="21" textAnchor="middle">{trim > 0 ? "完全に冷却した後" : weld > 0 ? "同時に溶かし、加圧" : "接着剤の硬化後に溝切り"}</text>
    <text x="231" y="123" fontSize="12">床シート</text>
    <text x="174" y="190" textAnchor="middle">{trim === 1 ? "余盛りを削ってシート面と平滑に" : trim > 0 ? "余盛りだけを削る" : weld > 0 ? "溝を満たし、余盛りをつくる" : "V溝の例・深さはシート厚の約2/3"}</text>
  </>;
}

export const floorSeam: Lesson = {
  title: "床シートの継目を熱溶接で納める", view: "ビニル床シート・継目に直角な拡大断面", Scene: FloorSeamScene,
  steps: [
    { label: "溝を切る", text: "シートを張り、接着剤の硬化を確認してから継目に均一な幅の溝を切る。深さはシート厚さの約2/3。図はV溝の例で、U溝もある。" },
    { label: "溶接・余盛り", text: "熱溶接機で床シートと溶接棒を同時に溶かし、加圧しながら継目を満たす。溶接材がシート面より少し高くなるよう余盛りをつくる。" },
    { label: "冷却後に仕上げ", text: "溶接部が完全に冷えた後に削り取り、シート面と平滑にする。図は実際の冷却待ち時間を省略している。" },
  ],
};
