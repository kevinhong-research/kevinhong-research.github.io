#!/usr/bin/env python3
"""Audit hard-coded colors in site-owned UI files.

The design-system token source, generated/vendor assets, syntax/Jupyter CSS,
search bundles, and content-data colors are intentionally outside this check.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOTS = (
    "_sass",
    "assets/css",
    "assets/js",
    "_pages",
    "_includes",
    "_layouts",
)

EXCLUDED_PREFIXES = (
    "_sass/font-awesome/",
    "_sass/tabler-icons/",
    "assets/css/academicons",
    "assets/css/bootstrap",
    "assets/css/font-awesome/",
    "assets/css/jekyll-pygments",
    "assets/css/jupyter",
    "assets/css/mdb",
    "assets/css/tabler-icons/",
    "assets/js/bootstrap",
    "assets/js/distillpub/",
    "assets/js/search/",
    "assets/js/vanilla-back-to-top.min.js",
)

EXCLUDED_FILES = {
    "_sass/_themes.scss",
    "_sass/_variables.scss",
}

COLOR_RE = re.compile(
    r"""
    \#[0-9A-Fa-f]{3,8}\b
    |
    \brgba?\([^\n;{}]*\)
    |
    \bhsla?\([^\n;{}]*\)
    |
    \boklch\([^\n;{}]*\)
    """,
    re.VERBOSE,
)

COLOR_LAB_FUNCTIONAL_FALLBACK = "COLOR_INPUT_FALLBACK = '#000000'"


def is_excluded(path: Path) -> bool:
    path_text = path.as_posix()
    return path_text in EXCLUDED_FILES or any(
        path_text.startswith(prefix) for prefix in EXCLUDED_PREFIXES
    )


def should_ignore_match(path: Path, line: str, match: str) -> bool:
    path_text = path.as_posix()

    if path_text == "_pages/dev-colors.md" and COLOR_LAB_FUNCTIONAL_FALLBACK in line:
        return True

    # CSS keywords and token-derived color functions are not hard-coded colors.
    if match in {"rgb(var(--bs-primary-rgb))", "rgba(var(--bs-primary-rgb), 0.1)"}:
        return True

    return False


def iter_files(root: Path):
    for root_name in ROOTS:
        base = root / root_name
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.is_file() and not is_excluded(path.relative_to(root)):
                yield path


def audit(root: Path):
    findings = []
    for path in iter_files(root):
        rel = path.relative_to(root)
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            lines = path.read_text(errors="ignore").splitlines()

        for line_no, line in enumerate(lines, start=1):
            for match in COLOR_RE.findall(line):
                if should_ignore_match(rel, line, match):
                    continue
                findings.append((rel.as_posix(), line_no, match, line.strip()))

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit site-owned UI files for hard-coded color literals."
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 when site-owned UI color literals are found.",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path.cwd(),
        help="Repository root to scan. Defaults to the current directory.",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    findings = audit(root)

    current_file = None
    for path, line_no, match, line in findings:
        if current_file != path:
            current_file = path
            print(path)
        print(f"  {line_no}: {match} :: {line}")

    total = len(findings)
    print(f"TOTAL_SITE_OWNED_UI {total}")

    if args.strict and total:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
