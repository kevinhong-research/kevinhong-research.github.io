#!/usr/bin/env python3
"""
Promote forthcoming publications that have appeared in print.

For every entry in _data/publications.yml marked `forthcoming: true` that has
a DOI, query the Crossref REST API. Once Crossref reports the paper has been
assigned to an issue (volume + issue + page range all present), rewrite the
entry in place: replace the `forthcoming: true` line with a
`volume: "VOL(ISSUE):START-END"` line in the site's format, and update the
`year:` if the finalised print year differs from what's in the file.

Pure standard library — no venv, no pip installs. Run it with plain python3.

Usage (from the project root):
    python3 scripts/refresh_forthcoming.py             # check all, write in place
    python3 scripts/refresh_forthcoming.py --dry-run   # report only, no write
    python3 scripts/refresh_forthcoming.py --only DOI  # check a single DOI
    python3 scripts/refresh_forthcoming.py --file PATH # operate on another file

Behaviour:
  * A forthcoming paper Crossref has NOT yet placed in an issue (the normal
    case for a true forthcoming paper) is left untouched.
  * A paper Crossref reports as in an issue but missing a page range is
    reported for manual review rather than written with a malformed volume.
  * Page ranges are normalised to an en-dash (the dominant style in the file).

Exit codes:
    0  ran successfully (whether or not anything changed)
    1  usage error
"""

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT_PUBS = Path(__file__).resolve().parent.parent / "_data" / "publications.yml"
CROSSREF = "https://api.crossref.org/works/"
# Polite-pool User-Agent: Crossref asks for a contact so they can reach out
# before rate-limiting rather than after.
UA = "kevinhong-research.github.io forthcoming-refresh (mailto:khong@miami.edu)"
ENDASH = "–"

TITLE_RE     = re.compile(r'^- title:\s*"(.*)"\s*$')
ENTRY_START  = re.compile(r'^- title:')
DOI_RE       = re.compile(r'^\s+doi:\s*"?([^"\n]+?)"?\s*$')
FORTHCOMING  = re.compile(r'^(\s+)forthcoming:\s*true\s*$')
YEAR_RE      = re.compile(r'^(\s+)year:\s*(\d+)\s*$')


def find_entries(lines):
    """Yield (start, end) line-index ranges, one per publication entry."""
    starts = [i for i, ln in enumerate(lines) if ENTRY_START.match(ln)]
    for k, s in enumerate(starts):
        e = starts[k + 1] if k + 1 < len(starts) else len(lines)
        yield s, e


def crossref(doi):
    """Fetch the Crossref work record for a DOI (one transient retry)."""
    url = CROSSREF + urllib.parse.quote(doi, safe="")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.load(r)["message"]
        except Exception:
            if attempt == 0:
                time.sleep(2)
                continue
            raise


def issue_info(msg):
    """Return {volume, issue, pages, year} when the work is in an issue.

    Returns None if no volume/issue is assigned yet (still online-first /
    forthcoming). `pages` is None when Crossref has no page range — the caller
    treats that as 'needs manual review' rather than writing a bad volume.
    """
    vol = msg.get("volume")
    iss = msg.get("issue")
    if not (vol and iss):
        return None
    year = None
    ji = msg.get("journal-issue", {}) or {}
    for src in (ji.get("published-print"), msg.get("published-print"),
                ji.get("published-online"), msg.get("published-online")):
        parts = (src or {}).get("date-parts", [[None]])
        if parts and parts[0] and parts[0][0]:
            year = parts[0][0]
            break
    page = msg.get("page")
    pages = re.sub(r"\s*[-‒–—]\s*", ENDASH, page.strip()) if page else None
    return {"volume": str(vol), "issue": str(iss), "pages": pages, "year": year}


def main(argv):
    dry = "--dry-run" in argv
    only = None
    if "--only" in argv:
        try:
            only = argv[argv.index("--only") + 1].strip().lower()
        except IndexError:
            print("--only requires a DOI argument", file=sys.stderr)
            return 1
    pubs = DEFAULT_PUBS
    if "--file" in argv:
        try:
            pubs = Path(argv[argv.index("--file") + 1])
        except IndexError:
            print("--file requires a path argument", file=sys.stderr)
            return 1

    lines = pubs.read_text(encoding="utf-8").splitlines(keepends=True)

    # Collect every forthcoming entry that carries a DOI.
    candidates = []
    for s, e in find_entries(lines):
        title = (TITLE_RE.match(lines[s]).group(1) if TITLE_RE.match(lines[s]) else "")
        doi = forth_idx = indent = year_idx = None
        for i in range(s, e):
            m = DOI_RE.match(lines[i])
            if m:
                doi = m.group(1).strip()
            m = FORTHCOMING.match(lines[i])
            if m:
                forth_idx, indent = i, m.group(1)
            m = YEAR_RE.match(lines[i])
            if m:
                year_idx = i
        if doi and forth_idx is not None:
            if only and doi.lower() != only:
                continue
            candidates.append({"title": title, "doi": doi,
                               "forth_idx": forth_idx, "indent": indent,
                               "year_idx": year_idx})

    if not candidates:
        print(f"No forthcoming paper with DOI {only}." if only
              else "No forthcoming papers with a DOI to check.")
        return 0

    promoted, pending, flagged = [], [], []
    for c in candidates:
        try:
            info = issue_info(crossref(c["doi"]))
        except Exception as ex:
            flagged.append((c, f"Crossref error: {str(ex)[:60]}"))
            continue
        if info is None:
            pending.append(c)
        elif not info["pages"]:
            flagged.append((c, f"in {info['volume']}({info['issue']}) but Crossref has no page range"))
        else:
            volstr = f'{info["volume"]}({info["issue"]}):{info["pages"]}'
            lines[c["forth_idx"]] = f'{c["indent"]}volume: "{volstr}"\n'
            note = ""
            if info["year"] and c["year_idx"] is not None:
                ym = YEAR_RE.match(lines[c["year_idx"]])
                if ym and int(ym.group(2)) != int(info["year"]):
                    note = f" (year {ym.group(2)} -> {info['year']})"
                    lines[c["year_idx"]] = f'{ym.group(1)}year: {info["year"]}\n'
            promoted.append((c, volstr, note))
        time.sleep(1.0)

    # ---- Report ---------------------------------------------------------
    if promoted:
        verb = "Would promote" if dry else "Promoted"
        print(f"{verb} {len(promoted)} paper(s) now in print:")
        for c, volstr, note in promoted:
            print(f'  ✓ {volstr}{note}  — {c["title"][:60]}')
    if flagged:
        print(f"\n{len(flagged)} paper(s) need manual review:")
        for c, why in flagged:
            print(f'  ⚠ {why}  — {c["title"][:60]}  [{c["doi"]}]')
    if pending:
        print(f"\n{len(pending)} paper(s) still forthcoming (not yet in an issue):")
        for c in pending:
            print(f'  · {c["title"][:64]}')

    if promoted and not dry:
        pubs.write_text("".join(lines), encoding="utf-8")
        print(f"\nWrote {pubs}.")
    elif promoted and dry:
        print("\n--dry-run: no file written.")

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
