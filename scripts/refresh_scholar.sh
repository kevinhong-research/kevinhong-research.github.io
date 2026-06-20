#!/usr/bin/env bash
#
# Weekly publication-data refresh — one-liner. Two phases:
#
#   Phase 1  Promote forthcoming papers that have appeared in print
#            (scripts/refresh_forthcoming.py — pure stdlib, fast, ~4 Crossref
#            calls). Runs first so a promotion is committed even if the slow
#            scholar scrape later gets blocked.
#   Phase 2  Google Scholar citation refresh
#            (scripts/fetch_scholar_counts.py from .venv-scholar/, ~10-20 min).
#
# Each phase makes its OWN commit (so publication promotions and citation
# counts stay independently revertable); a single push at the end covers
# whatever changed. A run where nothing changed exits clean with no commit.
#
# Usage:
#   ./scripts/refresh_scholar.sh                # both phases, ~10-20 min
#   ./scripts/refresh_scholar.sh --limit 3      # scholar smoke test: first 3 papers
#   ./scripts/refresh_scholar.sh --only DOI     # scholar: refresh a single DOI
#   ./scripts/refresh_scholar.sh --dry-run      # both phases: report, don't write/commit
#
# Scholar-specific flags (--limit, --only, --max-age-days) pass through to the
# scraper only; --dry-run applies to both phases. To run just the forthcoming
# check, use ./scripts/refresh_forthcoming.sh instead.
#
# Phase 2 requires the venv from CLAUDE.md → "Scholar citation pipeline" → setup.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

# --dry-run applies to both phases; detect it without consuming scholar flags.
DRY=""
for arg in "$@"; do
  [ "$arg" = "--dry-run" ] && DRY="--dry-run"
done

push_needed=0

# ── Phase 1: promote forthcoming papers now in print ─────────────────────
echo "→ Phase 1: checking forthcoming papers (Crossref)…"
if command -v python3 >/dev/null 2>&1; then
  python3 scripts/refresh_forthcoming.py $DRY
  if [ -z "$DRY" ] && ! git diff --quiet _data/publications.yml; then
    git add _data/publications.yml
    git commit -m "data(publications): promote forthcoming papers now in print"
    push_needed=1
  fi
else
  echo "  (python3 not found — skipping forthcoming phase)" >&2
fi

# ── Phase 2: Google Scholar citation refresh ─────────────────────────────
echo "→ Phase 2: refreshing Scholar citation counts…"
if [ ! -x ".venv-scholar/bin/python" ]; then
  echo "Missing .venv-scholar/ — run one-time setup first:" >&2
  echo >&2
  echo "  ./scripts/setup_scholar.sh" >&2
  echo >&2
  # Still push a Phase-1 promotion if there was one.
  [ "$push_needed" -eq 1 ] && git push
  exit 1
fi

.venv-scholar/bin/python scripts/fetch_scholar_counts.py "$@"
rc=$?

# rc=0 → clean run; rc=2 → partial (blocked mid-run, partial progress on disk).
# Anything else is a hard error — don't commit Scholar counts, but still push
# any Phase-1 promotion.
if [ "$rc" -ne 0 ] && [ "$rc" -ne 2 ]; then
  echo "Scraper failed with exit code $rc — not committing scholar counts." >&2
  [ "$push_needed" -eq 1 ] && git push
  exit "$rc"
fi

if ! git diff --quiet _data/scholar_counts.yml; then
  git add _data/scholar_counts.yml
  if [ "$rc" -eq 2 ]; then
    git commit -m "data: refresh scholar citation counts (partial — IP blocked mid-run)"
  else
    git commit -m "data: refresh scholar citation counts"
  fi
  push_needed=1
fi

# ── Single push for whatever the two phases committed ────────────────────
if [ "$push_needed" -eq 1 ]; then
  git push
else
  echo "No changes from either phase — nothing to commit."
fi
