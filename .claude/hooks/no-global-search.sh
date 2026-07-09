#!/usr/bin/env bash
# .claude/hooks/no-global-search.sh
#
# PreToolUse hook enforcing: "never grep/glob the codebase, trace imports instead."
# Unlike the CLAUDE.md instruction, this is a hard block — it fires before the
# tool runs and exit code 2 stops it regardless of what Claude decided to do.
#
# Blocks:
#   - the Grep tool (any call)
#   - the Glob tool (any call)
#   - Bash commands invoking grep/egrep/fgrep/rg/ag/ack
#   - Bash `find` calls used for filename search (-name / -iname)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

block() {
  echo "$1" >&2
  exit 2
}

case "$TOOL_NAME" in
  Grep)
    block "[no-global-search] Grep is disabled by project policy. Ask the user for the entry file path and trace imports from there instead."
    ;;
  Glob)
    block "[no-global-search] Glob is disabled by project policy. Don't guess paths — ask the user or follow imports from a known file."
    ;;
  Bash)
    CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

    if echo "$CMD" | grep -qE '(^|[|;&]|\s)(grep|egrep|fgrep|rg|ag|ack)(\s|$)'; then
      block "[no-global-search] Direct grep/rg/ag/ack calls are disabled by project policy. Trace imports from the entry file instead of searching."
    fi

    if echo "$CMD" | grep -qE '\bfind\b[^|;&]*(-name|-iname)\b'; then
      block "[no-global-search] Using find to search for files by name is disabled by project policy. Ask the user for the path or follow imports."
    fi
    ;;
esac

exit 0