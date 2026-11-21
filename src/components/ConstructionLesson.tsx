import { useEffect, useReducer, useState } from "react";
import type { Lesson } from "./ConstructionScenes";

const duration = 15000;
// Pause each scene after its movement settles, while its caption is still active.
const originalTiming = { starts: [0, 3400, 9400], ends: [3100, 7200, 13100], stops: [0, 8800, duration] };
const inspectionTiming = { starts: [0, 5000, 10000], ends: [3800, 8600, 13700], stops: [4000, 9000, 14500] };
const clock = (ms: number) => "0:" + String(Math.floor(ms / 1000)).padStart(2, "0");

interface State { time: number; playing: boolean }
type Action = { type: "play" | "pause" } | { type: "tick" | "seek"; value: number };

function advance(state: State, action: Action): State {
  switch (action.type) {
    case "play": return { playing: true, time: state.time === duration ? 0 : state.time };
    case "pause": return { ...state, playing: false };
    case "seek": return { playing: false, time: action.value };
    case "tick": {
      if (!state.playing) return state;
      const time = Math.min(duration, state.time + action.value);
      return { time, playing: time < duration };
    }
  }
}

function progress(time: number, from: number, to: number, reduced: boolean) {
  if (reduced) return time >= from ? 1 : 0;
  const t = Math.max(0, Math.min(1, (time-from)/(to-from)));
  return t * t * (3 - 2*t);
}

function LessonPlayer({ lesson, playOnMount }: { lesson: Lesson; playOnMount: boolean }) {
  const [{ time, playing }, dispatch] = useReducer(advance, { time: 0, playing: playOnMount });
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: "tick", value: now - last });
      last = now;
    }, 40);
    const onVisibility = () => {
      if (document.hidden) dispatch({ type: "pause" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [playing]);

  const [motionPreference] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)"));
  const reduced = motionPreference?.matches ?? false;
  const { starts, ends, stops } = lesson.inspectionStep === undefined ? originalTiming : inspectionTiming;
  const step = time < starts[1] ? 0 : time < starts[2] ? 1 : 2;
  const { Scene } = lesson;
  return (
    <>
      <header className="lesson-heading">
        <span>工程アニメーション</span>
        <h4>{lesson.title}</h4>
      </header>
      <div className="lesson-view">
        <span>{lesson.view}</span>
        <svg viewBox="0 0 420 202" role="img" aria-label={lesson.steps[step].text}>
          <Scene start={progress(time, starts[0], ends[0], reduced)} fold={progress(time, starts[1], ends[1], reduced)}
            finish={progress(time, starts[2], ends[2], reduced)} time={reduced ? stops[step] : time}/>
        </svg>
      </div>
      <div className="lesson-controls">
        <button type="button" className="lesson-play" onClick={() => dispatch({ type: playing ? "pause" : "play" })}>
          {playing ? "Ⅱ 一時停止" : time === duration ? "↺ もう一度" : "▶ 再生"}
        </button>
        <input type="range" min="0" max={duration} step="100" value={Math.round(time / 100) * 100}
          aria-label="再生位置" aria-valuetext={clock(time)}
          onChange={event => dispatch({ type: "seek", value: Number(event.target.value) })}/>
        <span className="lesson-time">{clock(time)} / 0:15</span>
      </div>
      <div className="lesson-steps" role="group" aria-label="工程を選ぶ">
        {lesson.steps.map(({ label }, index) => (
          <button key={label} type="button" aria-current={step === index ? "step" : undefined}
            onClick={() => dispatch({ type: "seek", value: stops[index] })}>
            <span>{index + 1}</span><span>{label}{lesson.inspectionStep === index && <small className="inspection-stop">確認場面</small>}</span>
          </button>
        ))}
      </div>
      <p className="lesson-caption" aria-live="polite">{lesson.steps[step].text}</p>
    </>
  );
}

export default function ConstructionLesson({ options }: { options: readonly Lesson[] }) {
  const [selection, setSelection] = useState({ index: 0, playRequest: 0 });
  const lesson = options[selection.index];
  return (
    <section className="construction-lesson" aria-label={lesson.title}>
      {options.length > 1 && (
        <div className="lesson-choices" role="group" aria-label="試験方法を選んで再生">
          {options.map((item, index) => (
            <button key={item.title} type="button" aria-pressed={index === selection.index}
              onClick={() => setSelection(prev => ({ index, playRequest: prev.playRequest + 1 }))}>
              ▶ {item.choiceLabel ?? item.title}
            </button>
          ))}
        </div>
      )}
      <LessonPlayer key={selection.playRequest} lesson={lesson} playOnMount={selection.playRequest > 0} />
    </section>
  );
}
