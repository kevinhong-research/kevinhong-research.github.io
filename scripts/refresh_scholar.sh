#!/usr/bin/env bash
#
# Weekly publication-data refresh — one-liner. Two phases:
#
#   Phase 1  Promote forthcoming papers that have appeared in print
#            (scripts/refresh_forthcoming.py — pure stdlib, fast, ~4 Crossref
#            calls). Runs first so a promotion is committed even if the slow
#            scholar scrape later gets blocked.
#   Phase 2  Google Scholar citation refresh. Tries the lightweight requests
#            scraper first (scripts/fetch_scholar_counts.py from .venv-scholar/);
#            the moment Scholar captcha-blocks it, automatically falls back to
#            the real-browser fetcher (scripts/fetch_scholar_browser.sh — drives
#            your signed-in Chrome). Scholar currently blocks the requests path
#            almost always, so the browser fetcher is the usual outcome.
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
# requests scraper; --limit/--only also forward to the browser fallback, but
# --max-age-days does not (it's requests-only). --dry-run applies to both phases
# and suppresses the browser fallback (no Chrome window on a dry run). To run
# just the forthcoming check, use ./scripts/refresh_forthcoming.sh instead.
#
# Phase 2 requires the venv from scripts/README.md → "Google Scholar citation
# pipeline" → setup (./scripts/setup_scholar.sh).

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

# Lightweight requests probe first. rc=0 → clean run; rc=2 → blocked (it stops
# fast, after the first confirmed captcha; any progress before the block is on
# disk). Anything else is a hard error — don't commit counts, but still push any
# Phase-1 promotion.
.venv-scholar/bin/python scripts/fetch_scholar_counts.py "$@"
rc=$?

if [ "$rc" -ne 0 ] && [ "$rc" -ne 2 ]; then
  echo "Scraper failed with exit code $rc — not committing scholar counts." >&2
  [ "$push_needed" -eq 1 ] && git push
  exit "$rc"
fi

# Commit whatever the requests probe wrote (a full rc=0 run, or partial progress
# from before a block on rc=2).
if ! git diff --quiet _data/scholar_counts.yml; then
  git add _data/scholar_counts.yml
  if [ "$rc" -eq 2 ]; then
    git commit -m "data: refresh scholar citation counts (partial — requests blocked, browser fallback follows)"
  else
    git commit -m "data: refresh scholar citation counts"
  fi
  push_needed=1
fi

# ── Fast fallback: requests path blocked → drive signed-in Chrome ─────────
# Skipped on --dry-run (a dry run must not open a browser window).
if [ "$rc" -eq 2 ] && [ -z "$DRY" ]; then
  echo "→ requests path blocked by Scholar — falling back to the browser fetcher (Chrome)…"
  # The browser fetcher only understands --only / --limit (NOT --max-age-days,
  # which is requests-only). Forward just the flags it accepts; single-shift
  # parsing avoids a `shift 2` hang on a trailing valueless flag.
  browser_args=()
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --only|--limit)
        browser_args+=("$1"); shift
        [ "$#" -gt 0 ] && { browser_args+=("$1"); shift; } ;;
      --only=*|--limit=*)
        browser_args+=("$1"); shift ;;
      --max-age-days)
        shift; [ "$#" -gt 0 ] && shift ;;   # drop flag + its value
      *)
        shift ;;                            # drop --max-age-days=…, --dry-run, anything else
    esac
  done
  # Self-contained: guards venv/playwright, fetches the papers the requests probe
  # didn't get (prior counts preserved), and commits + pushes scholar_counts.yml
  # itself when it fetched ≥1 count — that push also carries any earlier commit.
  ./scripts/fetch_scholar_browser.sh "${browser_args[@]}"
  push_needed=1   # ensure the trailing push runs (no-op if the wrapper already pushed)
fi

# ── Single push for whatever is still unpushed (no-op if already in sync) ──
if [ "$push_needed" -eq 1 ]; then
  git push
else
  echo "No changes from either phase — nothing to commit."
fi
