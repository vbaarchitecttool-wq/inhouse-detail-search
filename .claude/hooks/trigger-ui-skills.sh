#!/bin/bash
input=$(cat)
file=$(printf '%s' "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
case "$file" in
  *.tsx|*.jsx|*.vue|*.html|*.css)
    cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "フロントエンドUIファイルが編集されました。続けて以下5つのスキルをSkillツールで順番に呼び、UI品質を整えてください: (1) frontend-design (2) baseline-ui (3) fixing-accessibility (4) web-design-guidelines (5) impeccable"
  }
}
JSON
    ;;
esac
