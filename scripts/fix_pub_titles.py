#!/usr/bin/env python3
"""
Normalise publication titles in _data/publications.yml to Chicago-style title case.

Usage (from project root):
    python scripts/fix_pub_titles.py            # fix in place
    python scripts/fix_pub_titles.py --dry-run  # preview changes only

Rules applied:
  - Capitalize all major words (nouns, verbs, adjectives, adverbs, pronouns)
  - Keep lowercase: articles (a, an, the), coordinating conjunctions
    (and, but, or, nor, yet, so), and prepositions (at, by, for, from, in,
    into, of, off, on, onto, out, over, per, through, to, up, via, vs., with)
  - First word of every title always capitalized
  - First word after : ? ! always capitalized
  - All-caps acronyms (AI, IT, DM, CIO, SHEDR, …) are preserved as-is
  - Hyphenated compounds: first element always capitalized; subsequent
    elements lowercase only if they are articles or short prepositions
    (End-to-End, On-the-Hour, Algorithm-Based, E-Procurement, …)
"""

import re
import sys
from pathlib import Path

# Words kept lowercase when they appear mid-title (not after : ? !)
SMALL_WORDS = frozenset({
    # Articles
    "a", "an", "the",
    # Coordinating conjunctions
    "and", "but", "or", "nor", "yet", "so",
    # Prepositions
    "as", "at", "by", "for", "from", "in", "into",
    "of", "off", "on", "onto", "out", "over", "per",
    "through", "to", "up", "via", "vs", "vs.", "with",
})

# Small words kept lowercase inside hyphenated compounds
HYPHEN_SMALL = frozenset({"a", "an", "the", "to", "of"})

# Regex that matches a title line in publications.yml
TITLE_LINE_RE = re.compile(r'^(- title: ")(.+?)(")\s*$')


def _case_word(word: str, force: bool) -> str:
    """Title-case a single unhyphenated word fragment."""
    # Preserve all-caps acronyms (2+ uppercase letters, optional trailing digits)
    if re.fullmatch(r"[A-Z]{2,}\d*", word):
        return word
    lower = word.lower()
    if force or lower not in SMALL_WORDS:
        return lower.capitalize() if lower else word
    return lower


def _case_hyphenated(token: str) -> str:
    """Title-case a hyphenated compound.

    The first element is always capitalized; subsequent elements are
    lowercased only when they are articles or short prepositions.
    """
    parts = token.split("-")
    result = [_case_word(parts[0], force=True)]
    for part in parts[1:]:
        # Keep small words (the, to, of, a, an) lowercase inside a compound
        force = part.lower() not in HYPHEN_SMALL
        result.append(_case_word(part, force=force))
    return "-".join(result)


def to_title_case(title: str) -> str:
    """Return *title* in Chicago-style title case."""
    tokens = title.split(" ")
    out = []
    force = True  # first word is always capitalized

    for tok in tokens:
        if not tok:
            out.append(tok)
            continue

        # Split off leading non-alpha characters (open parens, quotes, …)
        lead_end = 0
        while lead_end < len(tok) and not tok[lead_end].isalpha():
            lead_end += 1
        lead = tok[:lead_end]

        # Split off trailing non-alphanumeric characters (:, ?, !, ), …)
        trail_start = len(tok)
        while trail_start > lead_end and not tok[trail_start - 1].isalnum():
            trail_start -= 1
        trail = tok[trail_start:]
        core = tok[lead_end:trail_start]

        if not core:
            out.append(tok)
            force = bool(tok) and tok[-1] in ":?!"
            continue

        # Apply casing to the core fragment
        if "-" in core:
            cased = _case_hyphenated(core)
        else:
            cased = _case_word(core, force=force)

        out.append(lead + cased + trail)

        # Next token must be capitalized when this one ends with : ? !
        force = bool(trail) and trail[-1] in ":?!"

    return " ".join(out)


def fix_titles(path: Path, dry_run: bool = False) -> int:
    """Fix every `- title:` line in *path*.  Returns number of titles changed."""
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    changed = 0
    new_lines = []

    for line in lines:
        m = TITLE_LINE_RE.match(line)
        if m:
            prefix, original, suffix = m.group(1), m.group(2), m.group(3)
            fixed = to_title_case(original)
            if fixed != original:
                changed += 1
                label = "WOULD FIX" if dry_run else "FIXED"
                print(f"  {label}: {original!r}")
                print(f"       → {fixed!r}")
                if not dry_run:
                    line = prefix + fixed + suffix + "\n"
        new_lines.append(line)

    if not dry_run and changed:
        path.write_text("".join(new_lines), encoding="utf-8")
        print(f"\n✓ Fixed {changed} title(s) in {path}")
    elif dry_run:
        print(f"\n(dry run) {changed} title(s) would be changed in {path}")
    else:
        print(f"✓ All titles already in correct case in {path}")

    return changed


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    root = Path(__file__).resolve().parent.parent
    pub_file = root / "_data" / "publications.yml"
    if not pub_file.exists():
        print(f"ERROR: {pub_file} not found", file=sys.stderr)
        sys.exit(1)
    changed = fix_titles(pub_file, dry_run=dry_run)
    sys.exit(0)
