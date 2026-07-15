#!/usr/bin/env bash
# .claude/hooks/require-search-justification.sh
#
# PreToolUse hook — replaces a flat grep/glob ban with a "declare, then
# search" gate. Grep, Glob, and grep-like Bash calls are allowed ONLY if
# Claude has stated a one-line justification earlier in the current turn.
# Import-tracing stays the unstated default; search becomes a visible,
# audited exception instead of either "always available" or "never
# available".
#
# Approved justification categories — Claude should state one of these
# after the marker text:
#   - cross-cutting / anti-pattern sweep (same bug elsewhere in the codebase)
#   - DI-registered / global provider lookup (APP_GUARD, APP_INTERCEPTOR,
#     APP_FILTER, or a custom @Inject token — not reachable by tracing
#     imports from a controller)
#   - rename or impact analysis (all call sites of a symbol)
#   - literal string lookup (env var name, error string, config key)
#   - entry file unknown and the user hasn't supplied one
#
# Design notes:
#   - FAILS OPEN on any plumbing problem (missing transcript, unreadable
#     file, jq missing). A broken hook should not silently brick every
#     search for the rest of the session -- that's a worse failure mode
#     than an occasional unjustified grep slipping through. `set -e` is
#     deliberate here: per Claude Code's exit-code semantics, only exit
#     code 2 blocks a PreToolUse call -- any other non-zero exit (e.g. a
#     crash from a missing jq) is treated as a pass-through, not a block.
#     So a broken environment fails open by construction, not by luck.
#   - Checks the tail of the transcript for the marker text rather than
#     doing a full structural JSONL parse. The transcript schema is an
#     internal implementation detail that can shift between Claude Code
#     versions; a plain-text search over the last N lines is far more
#     resistant to that drift than a hand-rolled jq state machine over
#     message.content blocks would be.
#   - This is a presence check, not a quality check. It confirms the
#     marker text was written, not that the reasoning behind it was good.
#     Treat it as a tripwire/audit trail, not a guarantee -- spot-check
#     the justifications it lets through occasionally.
#
# Verify against a REAL transcript before trusting this:
#   1. Run any Claude Code session and note the transcript path Claude Code
#      logs under ~/.claude/projects/<encoded-project-path>/<session-id>.jsonl
#   2. tail -n 60 <that-file> | grep "Search justification:"
#   3. Confirm it behaves as expected; adjust LOOKBACK_LINES if your turns
#      routinely produce more than ~60 JSONL lines before reaching a search.
#
# Requires: jq

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty')

MARKER="Search justification:"
LOOKBACK_LINES=60

block() {
  echo "[require-search-justification] $1" >&2
  exit 2
}

# Fails open (returns success / exit 0) if the transcript can't be
# checked at all. Only reaches block() once we've positively confirmed
# the marker is absent from a transcript we could actually read.
require_justification_or_allow() {
  local what="$1"

  if [[ -z "$TRANSCRIPT" || ! -f "$TRANSCRIPT" ]]; then
    exit 0
  fi

  if tail -n "$LOOKBACK_LINES" "$TRANSCRIPT" 2>/dev/null | grep -qF "$MARKER"; then
    exit 0
  fi

  block "$what needs a reason first. Before retrying, output a line: \"${MARKER} <why import-tracing can't answer this>\" -- e.g. anti-pattern sweep, DI/global-provider lookup (APP_GUARD/APP_INTERCEPTOR/custom token), rename impact analysis, literal string/env-var/config lookup, or unknown entry point. Then retry."
}

case "$TOOL_NAME" in
  Grep)
    require_justification_or_allow "Grep"
    ;;
  Glob)
    require_justification_or_allow "Glob"
    ;;
  Bash)
    CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

    if echo "$CMD" | grep -qE '(^|[|;&]|[[:space:]])(grep|egrep|fgrep|rg|ag|ack)([[:space:]]|$)'; then
      require_justification_or_allow "grep/rg/ag/ack via Bash"
    fi

    if echo "$CMD" | grep -qE '\bfind\b[^|;&]*(-name|-iname)\b'; then
      require_justification_or_allow "find by filename via Bash"
    fi
    ;;
esac

exit 0