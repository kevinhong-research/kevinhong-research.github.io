#!/usr/bin/env python3
"""
Refresh Google Scholar citation counts for entries in _data/publications.yml.

Output goes to _data/scholar_counts.yml, which Jekyll inlines into
window.SCHOLAR_COUNTS on /publications/. The site prefers Scholar counts
when present and falls back to OpenAlex for the rest (see assets/js/research.js).

Usage (from project root):

    # First-time setup
    python3 -m venv .venv-scholar
    .venv-scholar/bin/pip install -r scripts/requirements-scholar.txt

    # Refresh
    .venv-scholar/bin/python scripts/fetch_scholar_counts.py

    # Useful flags
    --limit N         Only attempt first N publications (smoke test)
    --only DOI        Only attempt a single DOI
    --dry-run         Fetch but don't write the YAML
    --no-jitter       Disable the 15-45 s sleep (DO NOT use weekly — Scholar
                      will block your IP)

Run locally on a residential IP. GitHub Actions IPs are blocklisted by Scholar.

DOI normalization
-----------------
All DOI keys in the output file are lowercased and stripped of any leading
https?://doi.org/ prefix. The JS reader (assets/js/research.js) applies the
same normalization. MISQ DOIs (e.g. 10.25300/MISQ/2022/16959) are mixed-case
in publications.yml but DOI is case-insensitive per spec — lowercasing both
sides keeps the lookup chain self-consistent.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import random
import re
import string
import sys
import tempfile
import time
from difflib import SequenceMatcher
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML missing. Run: .venv-scholar/bin/pip install -r scripts/requirements-scholar.txt")

try:
    from scholarly import scholarly
    from scholarly._navigator import MaxTriesExceededException
except ImportError:
    sys.exit("scholarly missing. Run: .venv-scholar/bin/pip install -r scripts/requirements-scholar.txt")

try:
    import requests
except ImportError:
    sys.exit("requests missing. Run: .venv-scholar/bin/pip install -r scripts/requirements-scholar.txt")


ROOT = Path(__file__).resolve().parent.parent
PUBS_FILE = ROOT / "_data" / "publications.yml"
OUT_FILE = ROOT / "_data" / "scholar_counts.yml"
PUB_IDS_FILE = ROOT / "_data" / "scholar_pub_ids.yml"

# Direct-URL fetch: per-paper Scholar citation page. Built once via
# scripts/fetch_scholar_pub_ids.py (one profile walk) and looked up here.
# Much lighter rate-limit category than search_pubs() — Scholar treats
# page-view as ordinary browsing, search as potential scraping.
CITATION_URL_TEMPLATE = (
    "https://scholar.google.com/citations"
    "?view_op=view_citation&hl=en&user={user_id}&citation_for_view={user_id}:{pub_id}"
)
# Default Python UA is 403'd by Scholar; mimic a real browser.
DIRECT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) "
    "Version/17.0 Safari/605.1.15"
)

# How many of Scholar's top hits to consider per paper before giving up.
# Scholar occasionally surfaces a junk stub (PDF-parse artifact, no year/DOI,
# 0 cites) ahead of the real entry, e.g. 10.25300/MISQ/2018/14105. Walking
# past failing hits to find a real verify_match() pass costs no extra HTTP
# requests (all within the same result page).
MAX_SCHOLAR_HITS = 5

# Jitter range (seconds) between papers. Conservative enough that 39-paper
# runs don't reliably hit Scholar's rate limit. The search path uses the
# wider range; the direct-URL path uses a tighter range because page-view
# requests are in a less-throttled bucket.
JITTER_SEARCH_MIN_SEC = 30
JITTER_SEARCH_MAX_SEC = 90
JITTER_DIRECT_MIN_SEC = 5
JITTER_DIRECT_MAX_SEC = 15

# Default freshness threshold: a paper whose count was successfully fetched
# within the last N days is skipped on the next run. Combined with the
# always-retry-flagged behaviour, this makes restart-after-block essentially
# free — only the unfetched + flagged subset is re-queried.
DEFAULT_MAX_AGE_DAYS = 7


def normalize_doi(doi: str) -> str:
    doi = (doi or "").strip()
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi, flags=re.IGNORECASE)
    return doi.lower()


def normalize_title(title: str) -> str:
    """Lowercase, strip punctuation and collapse whitespace for similarity comparison."""
    title = (title or "").lower()
    title = title.translate(str.maketrans("", "", string.punctuation))
    title = re.sub(r"\s+", " ", title).strip()
    return title


def title_ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_title(a), normalize_title(b)).ratio()


def first_author_last_name(authors: list[str]) -> str:
    """Authors are stored as "Last F" (sometimes with bold markdown around Kevin)."""
    if not authors:
        return ""
    first = authors[0].replace("**", "").strip()
    # "Last F" → "Last"
    return first.split()[0]


def load_existing() -> dict:
    if OUT_FILE.exists():
        with OUT_FILE.open() as f:
            data = yaml.safe_load(f) or {}
        return data
    return {}


def atomic_write_yaml(payload: dict) -> None:
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w",
        dir=str(OUT_FILE.parent),
        prefix=".scholar_counts.",
        suffix=".tmp",
        delete=False,
    ) as tmp:
        tmp.write(
            "# Auto-generated by scripts/fetch_scholar_counts.py. Edit via the script, not by hand.\n"
        )
        yaml.safe_dump(
            payload,
            tmp,
            sort_keys=False,
            allow_unicode=True,
            default_flow_style=False,
            width=120,
        )
        tmp_path = tmp.name
    os.replace(tmp_path, OUT_FILE)


def fetch_count_via_citation_page(user_id: str, pub_id: str) -> tuple[int | None, str]:
    """Fetch citation count from the per-paper Scholar citation page.

    Returns (count, reason). count is None on failure; reason is a short
    string for logging.
    """
    url = CITATION_URL_TEMPLATE.format(user_id=user_id, pub_id=pub_id)
    try:
        r = requests.get(url, headers={"User-Agent": DIRECT_USER_AGENT}, timeout=30)
    except requests.RequestException as e:
        return None, f"network: {type(e).__name__}"

    if r.status_code == 429:
        return None, "http 429 (rate-limited)"
    if r.status_code != 200:
        return None, f"http {r.status_code}"

    # Detect Scholar CAPTCHA / "unusual traffic" interstitial.
    if "/sorry/" in r.url or "unusual traffic" in r.text.lower():
        return None, "captcha challenge"

    # "Cited by N" appears in meta description and page body. First match
    # is the most reliable signal (in <head> or page header).
    m = re.search(r'Cited by (\d{1,3}(?:,\d{3})*)', r.text)
    if m:
        return int(m.group(1).replace(",", "")), "ok"

    # Page loaded fine but no "Cited by" → almost certainly 0 cites
    # (Scholar omits the label when count is 0). We return 0 explicitly
    # so the caller's Scholar=0 handler runs (flag + fallback to OpenAlex).
    return 0, "no cited-by label (assumed 0)"


def verify_match(our_title: str, our_year: int, our_doi: str, scholar_pub: dict) -> tuple[bool, str, float]:
    """
    Returns (is_match, reason, title_similarity).

    Title similarity is necessary. Beyond that we require at least ONE
    positive identity confirmation — either DOI or year. Title alone is not
    enough because Scholar occasionally returns metadata-poor stubs (e.g.
    PDF-parse artifacts where author=['IV Regression'], year='NA', doi='')
    that match the title perfectly but represent a junk entry with 0 cites
    rather than the real published version.
    """
    bib = scholar_pub.get("bib", {}) or {}
    s_title = bib.get("title", "") or ""
    s_year = bib.get("pub_year") or bib.get("year")
    s_doi = bib.get("doi", "") or ""

    sim = title_ratio(our_title, s_title)

    # Title similarity threshold (tiered)
    word_count = len(our_title.split())
    threshold = 0.92 if word_count < 8 else 0.85
    if sim < threshold:
        return False, f"title-similarity {sim:.2f} < {threshold:.2f} (got {s_title!r})", sim

    # DOI cross-check: hard mismatch wins; matching DOI is positive ID.
    doi_confirmed = False
    if s_doi:
        if normalize_doi(s_doi) != normalize_doi(our_doi):
            return False, f"doi-mismatch (scholar={s_doi!r})", sim
        doi_confirmed = True

    # Year proximity: hard mismatch wins; matching year is positive ID.
    year_confirmed = False
    try:
        s_year_int = int(s_year)
        if abs(s_year_int - int(our_year)) > 1:
            return False, f"year {s_year_int} ≠ {our_year} ±1", sim
        year_confirmed = True
    except (TypeError, ValueError):
        pass

    # Require at least one positive ID. Title alone is insufficient — see
    # docstring for the false-positive case this guards against.
    if not (doi_confirmed or year_confirmed):
        return False, "metadata-poor entry (no year/DOI to confirm match)", sim

    return True, "ok", sim


def build_payload(counts: dict, flagged: dict) -> dict:
    # Sort by DOI for deterministic diffs regardless of iteration order
    # (we shuffle the iteration order to spread block risk across runs).
    sorted_counts = {k: counts[k] for k in sorted(counts)}
    payload = {
        "fetched_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "source": "google_scholar (via scholarly)",
        "counts": sorted_counts,
    }
    if flagged:
        payload["flagged_for_review"] = {k: flagged[k] for k in sorted(flagged)}
    return payload


def load_pub_id_map() -> tuple[str, dict]:
    """Returns (scholar_user_id, {doi: pub_id}) from _data/scholar_pub_ids.yml,
    or ("", {}) if the file doesn't exist. Generated once by
    scripts/fetch_scholar_pub_ids.py.

    Defensively strips a leading "<user_id>:" from each pub_id — older
    versions of the bootstrap script stored the full scholarly author_pub_id
    (which includes the user prefix), and the URL template re-adds it.
    Without this strip, the URL becomes "...=USER:USER:ARTICLE" → 404.
    """
    if not PUB_IDS_FILE.exists():
        return "", {}
    try:
        with PUB_IDS_FILE.open() as f:
            data = yaml.safe_load(f) or {}
        user_id = (data.get("scholar_user_id") or "").strip()
        pub_ids = data.get("pub_ids") or {}
        if not isinstance(pub_ids, dict):
            pub_ids = {}
        prefix = f"{user_id}:" if user_id else ""
        cleaned = {}
        for k, v in pub_ids.items():
            if not v:
                continue
            doi_norm = normalize_doi(k)
            pid = v
            if prefix and pid.startswith(prefix):
                pid = pid[len(prefix):]
            cleaned[doi_norm] = pid
        return user_id, cleaned
    except Exception as e:
        print(f"Warning: could not read {PUB_IDS_FILE.name}: {e}", file=sys.stderr)
        return "", {}


def scrape(args) -> int:
    with PUBS_FILE.open() as f:
        pubs = yaml.safe_load(f) or []

    existing = load_existing()
    counts = dict(existing.get("counts") or {})
    # flagged_for_review: { doi: "reason string" } — preserved across runs,
    # cleared when a DOI later succeeds with a non-zero count.
    flagged_raw = existing.get("flagged_for_review") or {}
    flagged = dict(flagged_raw) if isinstance(flagged_raw, dict) else {}

    # Direct-URL fast path: { doi: scholar_pub_id }. Empty if not bootstrapped.
    scholar_user_id, pub_id_map = load_pub_id_map()
    if pub_id_map:
        print(f"Loaded {len(pub_id_map)} DOI→pub_id mappings (direct-URL fetch enabled).")
    else:
        print("No pub_id mapping found — using search-based fetch only. "
              "Run scripts/fetch_scholar_pub_ids.py to enable the direct-URL fast path.")

    # Backfill per-entry fetched_at from the top-level value if missing
    # (migrates older scholar_counts.yml files that pre-date per-entry timestamps).
    top_fetched_at = existing.get("fetched_at") or ""
    for entry in counts.values():
        if isinstance(entry, dict) and "fetched_at" not in entry and top_fetched_at:
            entry["fetched_at"] = top_fetched_at

    if args.only:
        target_doi = normalize_doi(args.only)
        pubs = [p for p in pubs if normalize_doi(p.get("doi", "")) == target_doi]
        if not pubs:
            sys.exit(f"No publication in {PUBS_FILE.name} matches --only {args.only}")

    if args.limit:
        pubs = pubs[: args.limit]
    elif not args.only:
        # Shuffle on full-refresh so a block doesn't always strike the same
        # paper. --only and --limit stay deterministic for repeatability.
        random.shuffle(pubs)

    now = dt.datetime.now(dt.timezone.utc)
    max_age = dt.timedelta(days=args.max_age_days) if args.max_age_days > 0 else None

    n_updated = n_unchanged = n_skipped = n_failed = n_zero = n_fresh = 0
    n_direct = n_search = 0
    blocked = False

    for i, pub in enumerate(pubs):
        doi_raw = pub.get("doi", "")
        doi = normalize_doi(doi_raw)
        title = pub.get("title", "")
        year = pub.get("year")

        if not doi:
            print(f"[skip] (no DOI)                              {title[:60]}")
            n_skipped += 1
            continue

        # Forthcoming papers ARE attempted: working-paper cites are exactly
        # where Scholar > OpenAlex. The verify_match() guard (title sim + year
        # ±1 + DOI cross-check) is strict enough to reject wrong matches.

        # Freshness skip: if we have a recent good fetch for this DOI and
        # it isn't flagged, don't re-query Scholar. Saves the request budget
        # for stale + flagged papers. Disable with --max-age-days 0.
        if max_age is not None and doi not in flagged:
            existing_entry = counts.get(doi) or {}
            ts = existing_entry.get("fetched_at") if isinstance(existing_entry, dict) else None
            if ts:
                try:
                    fetched = dt.datetime.fromisoformat(ts)
                    age = now - fetched
                    if age < max_age:
                        print(f"[fresh] {doi:<40} (fetched {age.days}d ago, < {args.max_age_days}d)")
                        n_fresh += 1
                        continue  # no Scholar call, no jitter, no write needed
                except (ValueError, TypeError):
                    pass

        # ───────────────── Direct-URL fast path ─────────────────
        # When we have a Scholar pub_id, fetch the per-paper citation page
        # directly (no search, no metadata-stub risk, lighter rate-limit).
        new_count = None
        matched_sim = None
        fetch_source = None  # 'direct' or 'search'
        last_reason = "no Scholar results"
        pub_id = pub_id_map.get(doi) if scholar_user_id else None

        if pub_id:
            direct_count, direct_reason = fetch_count_via_citation_page(
                scholar_user_id, pub_id
            )
            if direct_count is not None:
                new_count = direct_count
                # pub_id was verified at bootstrap time → match is canonical.
                matched_sim = 1.0
                fetch_source = "direct"
                n_direct += 1
            else:
                # Direct fetch failed — fall through to search as safety net.
                print(f"[direct-fail] {doi:<40} ({direct_reason}) — falling back to search")

        # ───────────────── Search-based fallback ─────────────────
        if new_count is None:
            author_last = first_author_last_name(pub.get("authors", []))
            query = f"{title} {author_last}".strip()
            matched = None
            try:
                results = scholarly.search_pubs(query)
                for _ in range(MAX_SCHOLAR_HITS):
                    candidate = next(results, None)
                    if candidate is None:
                        break
                    ok, reason, sim = verify_match(title, year, doi, candidate)
                    if ok:
                        matched = candidate
                        matched_sim = sim
                        break
                    last_reason = reason
            except MaxTriesExceededException:
                print(f"[BLOCKED] Scholar blocked the IP at paper #{i+1} ({doi}).")
                print(f"          {n_updated} updated, {n_unchanged} unchanged before block.")
                print(f"          Wait 24h or switch networks and re-run.")
                blocked = True
                break
            except Exception as e:
                print(f"[fail] {doi:<40} ({type(e).__name__}: {e})")
                n_failed += 1
                continue

            if matched is not None:
                new_count = matched.get("num_citations")
                fetch_source = "search"
                n_search += 1

        # ───────────────── Record / flag ─────────────────
        if new_count is None and fetch_source != "search":
            # Direct path failed AND search wasn't tried (shouldn't really
            # happen since we fall through), or matched was None from search.
            print(f"[fail] {doi:<40} ({last_reason}) — flagged for review")
            flagged[doi] = f"no match in {MAX_SCHOLAR_HITS} hits: {last_reason}"
            n_failed += 1
        elif new_count is None:
            print(f"[fail] {doi:<40} ({last_reason}) — flagged for review")
            flagged[doi] = f"no match in {MAX_SCHOLAR_HITS} hits: {last_reason}"
            n_failed += 1
        elif int(new_count) == 0:
            # Scholar = 0. Via direct path: paper exists on profile but has 0
            # cites (or count was unparseable; same end-state). Via search:
            # likely a junk-stub. Either way, skip write, flag, fall back to
            # OpenAlex on the frontend. Any prior count is preserved.
            origin = fetch_source or "?"
            print(f"[zero] {doi:<40} Scholar=0 via {origin} — flagged, OpenAlex will fill in")
            flagged[doi] = (
                f"Scholar returned 0 cites via {origin}; "
                f"verify at https://scholar.google.com/scholar?q={doi}"
            )
            n_zero += 1
        else:
            old = counts.get(doi, {}).get("count") if isinstance(counts.get(doi), dict) else None
            arrow = f"{old} → {new_count}" if old is not None else f"{new_count}"
            tag = "direct" if fetch_source == "direct" else f"search {matched_sim:.2f}"
            print(f"[ok]   {doi:<40} {arrow}   ({tag})")
            counts[doi] = {
                "count": int(new_count),
                "title_match": round(matched_sim, 3) if matched_sim else 1.0,
                "fetched_at": now.isoformat(timespec="seconds"),
                "source": fetch_source,
            }
            flagged.pop(doi, None)
            if old == new_count:
                n_unchanged += 1
            else:
                n_updated += 1

        # Persist after every paper, regardless of outcome.
        if not args.dry_run and i < len(pubs) - 1:
            atomic_write_yaml(build_payload(counts, flagged))

        # Jitter — shorter for direct fetches (lighter rate-limit bucket).
        if not args.no_jitter and i < len(pubs) - 1:
            if fetch_source == "direct":
                delay = random.uniform(JITTER_DIRECT_MIN_SEC, JITTER_DIRECT_MAX_SEC)
            else:
                delay = random.uniform(JITTER_SEARCH_MIN_SEC, JITTER_SEARCH_MAX_SEC)
            time.sleep(delay)

    # Final write
    if not args.dry_run:
        atomic_write_yaml(build_payload(counts, flagged))
        print(f"\nWrote {OUT_FILE.relative_to(ROOT)}")

    print(
        f"\nSummary: {n_updated} updated, {n_unchanged} unchanged, "
        f"{n_fresh} fresh-skipped, "
        f"{n_zero} Scholar=0 (flagged), {n_skipped} skipped, {n_failed} failed (flagged)."
    )
    if n_direct or n_search:
        print(f"Fetch sources: {n_direct} via direct URL, {n_search} via search.")
    if flagged:
        print(f"\n{len(flagged)} paper(s) flagged for manual review — see "
              f"`flagged_for_review:` section of {OUT_FILE.relative_to(ROOT)}.")
    if blocked:
        print("Run was interrupted by a Scholar block; partial progress preserved.")
        return 2
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--limit", type=int, help="Only attempt first N publications (deterministic order).")
    ap.add_argument("--only", type=str, help="Only attempt a single DOI.")
    ap.add_argument("--dry-run", action="store_true", help="Fetch but don't write.")
    ap.add_argument("--no-jitter", action="store_true",
                    help=f"Disable inter-paper sleep "
                         f"({JITTER_DIRECT_MIN_SEC}-{JITTER_DIRECT_MAX_SEC}s direct / "
                         f"{JITTER_SEARCH_MIN_SEC}-{JITTER_SEARCH_MAX_SEC}s search) — debugging only.")
    ap.add_argument("--max-age-days", type=int, default=DEFAULT_MAX_AGE_DAYS,
                    help=f"Skip papers whose count was fetched within the last N days "
                         f"(default {DEFAULT_MAX_AGE_DAYS}; 0 disables — refetch everything). "
                         f"Flagged papers are always re-queried regardless.")
    args = ap.parse_args()

    if not PUBS_FILE.exists():
        sys.exit(f"Missing {PUBS_FILE}")

    raise SystemExit(scrape(args))


if __name__ == "__main__":
    main()
