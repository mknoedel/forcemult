#!/bin/bash
# SessionStart hook: prepare and validate the repo for an agent session.
#
# Superpowers is provisioned differently per environment so we never duplicate
# skills a local user already has:
#   - Local CLI: nothing is materialized here. Users install the real plugin
#     (pre-registered in .claude/settings.json), which auto-updates and is theirs
#     to manage. This hook is gated to remote sessions, so local trees stay clean.
#   - Claude Code on the web (/plugin unavailable): copy the vendored skills from
#     .claude/vendor/superpowers/ (committed; refreshed by the
#     update-superpowers-skills workflow) into the auto-discovered .claude/skills/
#     — UNLESS the user already has the Superpowers plugin or a same-named skill.
#     No network/clone: the source is a committed local directory.
#
# Output contract (SessionStart): progress/readiness go to STDERR (shown on
# success); STDOUT carries ONLY the final JSON additionalContext. Mixing plain
# text and JSON on stdout breaks the hook parser, so all noise uses log().
set -euo pipefail

# Only run in Claude Code on the web (remote) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Everything that is not the final JSON object must go to stderr.
log() { echo "$@" >&2; }

log "▶ Installing dependencies (npm install)…"
npm install --no-audit --no-fund >&2

# --- Materialize vendored Superpowers skills into the discovered path ---------
# Source is committed under .claude/vendor/ (not itself auto-discovered), so this
# is a local file copy with no network. Skipped entirely if the user already has
# Superpowers, so we never duplicate or shadow their skills.
VENDOR=".claude/vendor/superpowers"

materialize_superpowers() {
  [ -d "$VENDOR" ] || return 1
  # Defer to an already-installed Superpowers plugin, if any.
  if grep -q 'superpowers' "$HOME/.claude/plugins/installed_plugins.json" 2>/dev/null; then
    return 2
  fi
  mkdir -p .claude/skills
  local d name
  for d in "$VENDOR"/*/; do
    name="$(basename "$d")"
    # Defer to a personal skill of the same name, if the user has one.
    [ -e "$HOME/.claude/skills/$name/SKILL.md" ] && continue
    rm -rf ".claude/skills/$name"
    cp -R "$d" ".claude/skills/$name"
  done
  return 0
}

inject=""
rc=0
materialize_superpowers || rc=$?
if [ "$rc" = "0" ]; then
  sp_count=$(find .claude/skills -maxdepth 2 -name SKILL.md 2>/dev/null | wc -l | tr -d ' ')
  log "  ✓ Superpowers skills materialized ($sp_count in .claude/skills/)"
  inject="$VENDOR/using-superpowers/SKILL.md"
elif [ "$rc" = "2" ]; then
  log "  • Superpowers plugin already installed — deferring to it (no vendored copy)"
else
  log "  • No vendored Superpowers skills found ($VENDOR absent)"
fi

# --- Informational readiness checks (guarded; do not block the session) ------
log "▶ Readiness checks:"

if node scripts/generate-docs.js --check >/dev/null 2>&1; then
  log "  ✓ CLAUDE.md auto sections current"
else
  log "  ⚠ CLAUDE.md auto sections stale — run: node scripts/generate-docs.js"
fi

if npm run --silent type-check >/dev/null 2>&1; then
  log "  ✓ TypeScript type-check passes"
else
  log "  ⚠ type-check reported issues — run: npm run type-check"
fi

if npm run --silent lint >/dev/null 2>&1; then
  log "  ✓ ESLint passes"
else
  log "  ⚠ lint reported issues — run: npm run lint"
fi

log "✓ Session ready."

# --- Inject the using-superpowers guidance from the LOCAL committed file ------
# Only when we materialized the vendored skills (an installed plugin injects its
# own). STDOUT here is JSON only.
if [ -n "$inject" ] && [ -f "$inject" ]; then
  sp_preamble=$(printf '%s\n' \
    '<EXTREMELY_IMPORTANT>' \
    'You have superpowers. The Superpowers skill library is available via the Skill tool (materialized into .claude/skills/). Below is the full content of your "using-superpowers" skill — your guide to finding and using skills. For every other skill, use the Skill tool. Per that skill, this repo'\''s CLAUDE.md and the user'\''s instructions always take precedence over skill guidance.' \
    '</EXTREMELY_IMPORTANT>' \
    '')
  node -e 'const fs=require("fs");const c=process.argv[1]+fs.readFileSync(process.argv[2],"utf8");process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:c}}))' \
    "$sp_preamble" "$inject"
fi

exit 0
