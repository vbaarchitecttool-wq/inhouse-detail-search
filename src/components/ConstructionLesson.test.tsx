import { act, fireEvent, render, screen } from "@testing-library/react";
import ConstructionLesson from "./ConstructionLesson";
import { lessons } from "./ConstructionScenes";

it("工程を選ぶとその位置で止まり、再生、停止、終端からの再生ができる", () => {
  vi.useFakeTimers();
  try {
    const options = lessons["9.7.5"]!;
    const lesson = options[0];
    render(<ConstructionLesson options={options}/>);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("0");
    fireEvent.click(screen.getByRole("button", { name: /端を折り返す/ }));
    expect(slider).toHaveValue("8800");
    expect(screen.getByRole("img")).toHaveAccessibleName(lesson.steps[1].text);
    fireEvent.click(screen.getByRole("button", { name: /再生/ }));
    act(() => vi.advanceTimersByTime(1200));
    fireEvent.click(screen.getByRole("button", { name: /一時停止/ }));
    expect(slider).toHaveValue("10000");
    act(() => vi.advanceTimersByTime(1000));
    expect(slider).toHaveValue("10000");
    fireEvent.click(screen.getByRole("button", { name: /再生/ }));
    act(() => vi.advanceTimersByTime(6000));
    expect(slider).toHaveValue("15000");
    fireEvent.click(screen.getByRole("button", { name: /もう一度/ }));
    expect(slider).toHaveValue("0");
    fireEvent.change(slider, { target: { value: "12000" } });
    expect(screen.getByRole("button", { name: /再生/ })).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAccessibleName(lesson.steps[2].text);
  } finally {
    vi.useRealTimers();
  }
});

it("9.7.5では選んだ試験だけが先頭から再生され、工程表示も切り替わる", () => {
  vi.useFakeTimers();
  try {
    const options = lessons["9.7.5"]!;
    render(<ConstructionLesson options={options}/>);
    fireEvent.click(screen.getByRole("button", { name: /H形試験体/ }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("slider")).toHaveValue("1000");
    expect(screen.getByRole("img")).toHaveAccessibleName(options[1].steps[0].text);
    fireEvent.click(screen.getByRole("button", { name: /180°折返し/ }));
    expect(screen.getByRole("slider")).toHaveValue("0");
    expect(screen.getByRole("img")).toHaveAccessibleName(options[0].steps[0].text);
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /一時停止/ })).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
