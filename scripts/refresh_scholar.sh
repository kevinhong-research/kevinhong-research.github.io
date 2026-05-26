#!/usr/bin/env bash
#
# Weekly Google Scholar citation refresh — one-liner.
#
# Usage:
#   ./scripts/refresh_scholar.sh                # full refresh, ~10-20 min
#   ./scripts/refresh_scholar.sh --limit 3      # smoke test: first 3 papers
#   ./scripts/refresh_scholar.sh --only DOI     # refresh a single DOI
#   ./scripts/refresh_scholar.sh --dry-run      # fetch but don't write/commit
#
# What it does:
#   1. Runs scripts/fetch_scholar_counts.py from .venv-scholar/.
#   2. If _data/scholar_counts.yml changed, commits and pushes it.
#   3. If nothing changed, exits cleanly with no commit.
#   4. If Scholar blocked the IP mid-run (rc=2), still commits the partial
#      progress with a "(partial — IP blocked mid-run)" tag.
#
# Requires the venv from CLAUDE.md → "Scholar citation pipeline" → setup.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

if [ ! -x ".venv-scholar/bin/python" ]; then
  echo "Missing .venv-scholar/ — run one-time setup first:"
  echo
  echo "  ./scripts/setup_scholar.sh"
  echo
  exit 1
fi

.venv-scholar/bin/python scripts/fetch_scholar_counts.py "$@"
rc=$?

# rc=0 → clean run; rc=2 → partial (blocked mid-run, partial progress on disk).
# Anything else is a hard error — don't commit.
if [ "$rc" -ne 0 ] && [ "$rc" -ne 2 ]; then
  echo "Scraper failed with exit code $rc — not committing." >&2
  exit "$rc"
fi

# --dry-run leaves the file untouched; nothing to do.
if git diff --quiet _data/scholar_counts.yml; then
  echo "No changes to _data/scholar_counts.yml — nothing to commit."
  exit 0
fi

git add _data/scholar_counts.yml
if [ "$rc" -eq 2 ]; then
  git commit -m "data: refresh scholar citation counts (partial — IP blocked mid-run)"
else
  git commit -m "data: refresh scholar citation counts"
fi
git push
