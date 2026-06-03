#!/usr/bin/env bash
#
# Real-browser Google Scholar citation fetcher — for when the plain-requests
# path (./scripts/refresh_scholar.sh) is captcha-blocked. Drives your signed-in
# Chrome via Playwright and reads each paper's merged "Total citations".
#
# Usage:
#   ./scripts/fetch_scholar_browser.sh                                   # all papers
#   ./scripts/fetch_scholar_browser.sh --only 10.25300/MISQ/2017/41.4.02 # smoke test
#   ./scripts/fetch_scholar_browser.sh --limit 5
#   ./scripts/fetch_scholar_browser.sh --dry-run                         # don't write the YAML
#
# A Chrome window opens on your Scholar profile: sign in + solve any captcha
# once, press Enter, and it fetches the counts into _data/scholar_counts.yml.
# Login persists in .scholar-browser-profile/ (gitignored), so later runs usually
# need no interaction.
#
# Like refresh_scholar.sh, this auto-commits + pushes _data/scholar_counts.yml
# when the run fetched at least one count. A fully-blocked run (no counts) is NOT
# committed. Use --dry-run to fetch without writing/committing.
#
# One-time setup: ./scripts/setup_scholar.sh  (the playwright package is
# auto-installed below if missing; uses your installed Chrome, no browser download).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

if [ ! -x ".venv-scholar/bin/python" ]; then
  echo "Missing .venv-scholar/ — run one-time setup first:"
  echo
  echo "  ./scripts/setup_scholar.sh"
  echo
  exit 1
fi

if ! .venv-scholar/bin/python -c "import playwright" 2>/dev/null; then
  echo "Installing playwright into .venv-scholar/ (one-time)…"
  .venv-scholar/bin/pip install "playwright>=1.40" || exit 1
fi

.venv-scholar/bin/python scripts/fetch_scholar_counts_browser.py "$@"
rc=$?

# rc=2 → nothing fetched (e.g. captcha-blocked); skip committing flag-only churn.
if [ "$rc" -eq 2 ]; then
  echo "No counts fetched (Scholar blocked?) — not committing."
  exit 0
fi
# Any other non-zero (hard error, or a Ctrl-C abort) → don't auto-commit.
if [ "$rc" -ne 0 ]; then
  echo "Fetcher exited with code $rc — not committing." >&2
  exit "$rc"
fi

# --dry-run leaves the file untouched → nothing to commit.
if git diff --quiet _data/scholar_counts.yml; then
  echo "No changes to _data/scholar_counts.yml — nothing to commit."
  exit 0
fi

git add _data/scholar_counts.yml
git commit -m "data: refresh scholar citation counts (browser)"
git push
