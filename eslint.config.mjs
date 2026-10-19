// ESLint（flat config）。react-scripts 同梱の eslint-config-react-app の後継。
// error 0 件を CI で維持する。warning は段階的に解消する。
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  // .claude/ 配下は Claude Code 用の補助スクリプト（アプリ本体ではない）ので対象外
  { ignores: ["dist/**", "build/**", "node_modules/**", "public/**", "coverage/**", ".claude/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 原文の整形ルールや解説文には全角スペース（U+3000）が正規表現・文字列として必要
      "no-irregular-whitespace": [
        "error",
        { skipStrings: true, skipTemplates: true, skipRegExps: true, skipComments: true, skipJSXText: true },
      ],
      // effect 内の setState（検索のデバウンス等、既存の実装）。段階的に解消するため warning に留める
      "react-hooks/set-state-in-effect": "warn",
      // 既存コードの書き方に合わせて緩める（CRA 既定も同程度だった）
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}", "src/setupTests.ts"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.{js,mjs,ts}"],
    languageOptions: { globals: { ...globals.node } },
  }
);
