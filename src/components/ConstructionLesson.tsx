import { useEffect, useReducer, useState } from "react";
import type { Lesson } from "./ConstructionScenes";

const duration = 15000;
const stops = [0, 8800, duration];
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

export default function ConstructionLesson({ lesson }: { lesson: Lesson }) {
  const [{ time, playing }, dispatch] = useReducer(advance, { time: 0, playing: false });
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
  const step = time < 3400 ? 0 : time < 9400 ? 1 : 2;
  const { Scene } = lesson;
  return (
    <section className="construction-lesson" aria-label={lesson.title}>
      <header className="lesson-heading">
        <span>工程アニメーション</span>
        <h4>{lesson.title}</h4>
      </header>
      <div className="lesson-view">
        <span>{lesson.view}</span>
        <svg viewBox="0 0 420 202" role="img" aria-label={lesson.steps[step].text}>
          <Scene fold={progress(time, 3400, 7200, reduced)} finish={progress(time, 9400, 13100, reduced)}/>
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
            <span>{index + 1}</span>{label}
          </button>
        ))}
      </div>
      <p className="lesson-caption" aria-live="polite">{lesson.steps[step].text}</p>
    </section>
  );
}
