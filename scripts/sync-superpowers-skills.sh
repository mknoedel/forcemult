#!/usr/bin/env bash
# Vendor the latest Superpowers skills (github.com/obra/superpowers) into
# .claude/vendor/superpowers/. Run by the update-superpowers-skills GitHub
# workflow, and usable locally to refresh on demand:
#   bash scripts/sync-superpowers-skills.sh
#
# These are NOT auto-discovered — they live under .claude/vendor/, not
# .claude/skills/. On Claude Code on the web the SessionStart hook copies them
# into .claude/skills/; local users install the real Superpowers plugin instead,
# so the vendored copy never duplicates or shadows their own skills.
set -euo pipefail

REPO="${SUPERPOWERS_REPO:-https://github.com/obra/superpowers.git}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$ROOT/.claude/vendor/superpowers"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Cloning $REPO (shallow)…"
git clone --depth 1 "$REPO" "$TMP/superpowers" >/dev/null 2>&1
[ -d "$TMP/superpowers/skills" ] || {
  echo "error: upstream has no skills/ directory" >&2
  exit 1
}

# The vendor directory is wholly managed by this script — replace it atomically.
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"
cp -R "$TMP"/superpowers/skills/. "$VENDOR_DIR"/
# Preserve upstream attribution (Superpowers is MIT-licensed).
cp "$TMP/superpowers/LICENSE" "$VENDOR_DIR/SUPERPOWERS-LICENSE"

count=$(find "$VENDOR_DIR" -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')
echo "Vendored $count Superpowers skills into .claude/vendor/superpowers/."
