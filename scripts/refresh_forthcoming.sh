#!/usr/bin/env bash
#
# Promote forthcoming publications that have appeared in print — one-liner.
#
# Usage:
#   ./scripts/refresh_forthcoming.sh             # check all; commit + push if any promoted
#   ./scripts/refresh_forthcoming.sh --dry-run   # report only, no write/commit
#   ./scripts/refresh_forthcoming.sh --only DOI  # check a single DOI
#
# What it does:
#   1. Runs scripts/refresh_forthcoming.py (pure stdlib — no venv needed).
#      For each `forthcoming: true` paper with a DOI, it asks Crossref whether
#      the paper is now in an issue and, if so, replaces `forthcoming: true`
#      with `volume: "VOL(ISSUE):START-END"` in the site's format.
#   2. If _data/publications.yml changed, commits and pushes it. The repo's
#      pre-commit hook re-checks title case on the way through.
#   3. If nothing changed (the normal weekly result), exits cleanly, no commit.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

PY="$(command -v python3 || true)"
if [ -z "$PY" ]; then
  echo "python3 not found on PATH." >&2
  exit 1
fi

"$PY" scripts/refresh_forthcoming.py "$@"
rc=$?
if [ "$rc" -ne 0 ]; then
  echo "refresh_forthcoming.py failed with exit code $rc — not committing." >&2
  exit "$rc"
fi

# --dry-run (and runs with no promotions) leave the file untouched.
if git diff --quiet _data/publications.yml; then
  echo "No publications.yml changes — nothing to commit."
  exit 0
fi

git add _data/publications.yml
git commit -m "data(publications): promote forthcoming papers now in print"
git push
