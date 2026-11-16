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
  const h = screen.getByRole("heading", { level: 2, name: /(検索結果|すべての条項)：\d+件/ });
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
    await screen.findByText(/一致する条項は見つかりませんでした/, {}, WAIT);
  });
});

describe("仕事で使う道具（チェックシート・用語辞典・学習）", () => {
  it("カードからシートに入れると、チェックシートに確認項目が並び、判定を付けられる", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(resultCount()).toBeGreaterThan(0), WAIT);

    await user.type(screen.getByPlaceholderText(/5\.3\.2/), "5.3.2");
    await waitFor(
      () =>
        expect(
          within(screen.getByRole("main")).getAllByRole("button", { name: / を開く$/ })[0]
        ).toHaveAccessibleName("5.3.2 加工 を開く"),
      WAIT
    );
    await user.click(
      within(screen.getByRole("main")).getAllByRole("button", { name: "チェックシートに入れる" })[0]
    );

    await user.click(within(screen.getByRole("navigation", { name: "画面の切替" })).getByRole("button", { name: /チェックシート/ }));
    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 2, name: /検査チェックシート/ })).toBeInTheDocument();
    expect(within(main).getByRole("button", { name: /5\.3\.2\s*加工/ })).toBeInTheDocument();

    const before = within(main).getByRole("status").textContent ?? "";
    expect(before).toMatch(/確認\s*0\s*\/\s*\d+\s*項目/);
    await user.click(within(main).getAllByRole("button", { name: /適合/ })[0]);
    expect(within(main).getByRole("status").textContent).toMatch(/確認\s*1\s*\//);

    // 端末に保存されている
    const saved = JSON.parse(window.localStorage.getItem("ids-sheets-v1") || "{}");
    expect(saved.sheets[0].items[0].id).toBe("5.3.2");
    expect(Object.values(saved.sheets[0].items[0].checks)).toEqual(["ok"]);
  });

  it("用語辞典でさがせて、学習でクイズを始められる", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?view=glossary");
    render(<App />);
    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 2, name: /用語辞典/ })).toBeInTheDocument();

    await user.type(within(main).getByRole("searchbox", { name: "用語をさがす" }), "かぶり");
    await waitFor(() => {
      const [hit, all] = (within(main).getByRole("status").textContent ?? "").split("/").map((s) => parseInt(s, 10));
      expect(hit).toBeGreaterThan(0);
      expect(hit).toBeLessThan(all);
    }, WAIT);

    await user.click(screen.getByRole("button", { name: /学習/ }));
    await user.click(screen.getByRole("button", { name: "クイズを始める" }));
    expect(screen.getByText(/1 \/ \d+ 問目/)).toBeInTheDocument();
    // 選択肢は「用語クイズ」の中で、問題文の次に並ぶ4つのボタン
    const quiz = screen.getByRole("region", { name: "用語クイズ" });
    const choices = within(quiz).getAllByRole("button").slice(0, 4);
    await user.click(choices[0]);
    expect(screen.getByText(/正解です|ちがいます/)).toBeInTheDocument();
    expect(Object.keys(JSON.parse(window.localStorage.getItem("ids-quiz-v1") || "{}"))).toHaveLength(1);
  });
});
