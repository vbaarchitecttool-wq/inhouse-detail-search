import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// 実データ（spec_index.json ＋ 全章の解説）でアプリ全体を描画し、
// 「起動する」「検索できる」「条項番号で先頭に来る」の3点だけを見る煙テスト。
// 検索は 80ms のデバウンス後に走り、jsdom では数百件のカード描画に 1 秒近くかかるため、
// 件数の変化を waitFor で待つ（既定の 1 秒より長めに取る）。

const WAIT = { timeout: 10000 };

const resultCount = (): number => {
  const h = screen.getByRole("heading", { level: 2, name: /検索結果：\d+件/ });
  return Number(h.textContent?.match(/(\d+)件/)?.[1] ?? NaN);
};

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("App", () => {
  it("起動して見出しと検索欄が出て、全条項が結果に並ぶ", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "NA 建築工事標準仕様書" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/5\.3\.2/)).toBeInTheDocument();

    await waitFor(() => expect(resultCount()).toBeGreaterThan(0), WAIT);
    const main = screen.getByRole("main");
    expect(within(main).getAllByRole("button", { name: / を開く$/ }).length).toBeGreaterThan(0);
  });

  it("条項番号で検索すると、その条項が先頭に出る", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(resultCount()).toBeGreaterThan(0), WAIT);
    const total = resultCount();

    await user.type(screen.getByPlaceholderText(/5\.3\.2/), "5.3.2");
    await waitFor(() => expect(resultCount()).toBeLessThan(total), WAIT);

    const main = screen.getByRole("main");
    const cards = within(main).getAllByRole("button", { name: / を開く$/ });
    expect(cards[0]).toHaveAccessibleName("5.3.2 加工 を開く");
  });

  it("キーワードで検索すると件数が絞られ、一致しない語では0件になる", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(resultCount()).toBeGreaterThan(0), WAIT);
    const total = resultCount();
    const input = screen.getByPlaceholderText(/5\.3\.2/);

    await user.type(input, "アスファルト防水");
    await waitFor(() => {
      const n = resultCount();
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(total);
    }, WAIT);

    await user.clear(input);
    await user.type(input, "zzzz_no_such_word_9999");
    await screen.findByText("検索条件に一致する条項が見つかりませんでした。", {}, WAIT);
  });
});
