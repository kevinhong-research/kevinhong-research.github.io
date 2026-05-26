#!/usr/bin/env bash
#
# One-time setup for the Scholar citation pipeline.
#
# Usage:
#   ./scripts/setup_scholar.sh
#
# What it does:
#   1. Creates .venv-scholar/ if it doesn't already exist (gitignored).
#   2. Installs/upgrades scholarly + PyYAML from scripts/requirements-scholar.txt.
#
# Idempotent: safe to re-run any time. Use it after pulling a change to
# requirements-scholar.txt, or on a new machine.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found on PATH. Install Python 3 (>= 3.9) and re-run." >&2
  exit 1
fi

if [ ! -d ".venv-scholar" ]; then
  echo "Creating .venv-scholar/ …"
  python3 -m venv .venv-scholar || { echo "venv creation failed." >&2; exit 1; }
else
  echo "Reusing existing .venv-scholar/."
fi

echo "Installing dependencies …"
.venv-scholar/bin/pip install --quiet --upgrade pip
.venv-scholar/bin/pip install --quiet -r scripts/requirements-scholar.txt || {
  echo "pip install failed. See output above." >&2
  exit 1
}

echo
echo "Setup complete. Run a refresh with:"
echo "  ./scripts/refresh_scholar.sh"
