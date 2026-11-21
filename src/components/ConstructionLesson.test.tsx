import { act, fireEvent, render, screen } from "@testing-library/react";
import ConstructionLesson from "./ConstructionLesson";
import { lessons } from "./ConstructionScenes";

it("工程を選ぶとその位置で止まり、再生、停止、終端からの再生ができる", () => {
  vi.useFakeTimers();
  try {
    const lesson = lessons["9.7.5"]!;
    render(<ConstructionLesson lesson={lesson}/>);
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
