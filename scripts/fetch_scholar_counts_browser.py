#!/usr/bin/env python3
"""
Fetch Google Scholar per-paper citation counts via a REAL, signed-in browser
(Playwright + your installed Chrome), to get past Scholar's captcha wall on the
`/citations` endpoints that the plain-`requests` scraper (fetch_scholar_counts.py)
can no longer reach.

Why this exists
---------------
Scholar tightened bot detection: a bare `requests` fetch of the citation_for_view
page is captcha-challenged regardless of IP or headers (even a fresh hotspot +
full browser headers gets a reCAPTCHA). A real Chrome with a persistent, signed-in
profile is trusted — you sign in and solve ONE captcha once, the session persists,
and the per-paper "Total citations" (Scholar's MERGED count — the number we want)
reads cleanly thereafter.

Output
------
Writes `_data/scholar_counts.yml` in the SAME format as fetch_scholar_counts.py
(`count` / `title_match` / `fetched_at` / `source: browser`), reusing that module's
YAML helpers, so the site frontend is unchanged. Existing counts/flags are
preserved; a successful fetch clears that DOI's flag.

Usage
-----
    .venv-scholar/bin/python scripts/fetch_scholar_counts_browser.py
    .venv-scholar/bin/python scripts/fetch_scholar_counts_browser.py --only 10.25300/MISQ/2017/41.4.02
    .venv-scholar/bin/python scripts/fetch_scholar_counts_browser.py --limit 5

First run: a Chrome window opens on your Scholar profile. Sign in to Google
(top-right) and solve any captcha, then press Enter in the terminal. The login
persists in a dedicated profile (`.scholar-browser-profile/`, gitignored) for
future runs — so later runs usually need no interaction.

Setup (one-time): `.venv-scholar/bin/pip install playwright`  (Chrome already
installed → no `playwright install` needed; this uses channel="chrome").
"""
import argparse
import datetime as dt
import random
import sys
import time
from pathlib import Path

# Reuse the existing scraper's data helpers so the YAML format stays identical.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_scholar_counts import (  # noqa: E402
    ROOT, OUT_FILE, PUBS_FILE,
    normalize_doi, load_pub_id_map, load_existing, build_payload, atomic_write_yaml,
)

try:
    import yaml
except ImportError:
    sys.exit("PyYAML missing. Run: ./scripts/setup_scholar.sh")

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    sys.exit("playwright missing. Run: .venv-scholar/bin/pip install playwright")

PROFILE_DIR = ROOT / ".scholar-browser-profile"
CITATION_URL = ("https://scholar.google.com/citations?view_op=view_citation&hl=en"
                "&user={user}&citation_for_view={user}:{pubid}")
PROFILE_URL = "https://scholar.google.com/citations?hl=en&user={user}"

# Polite random spacing between papers (seconds) — ~20s average. Conservative
# enough to keep a signed-in session from tripping a captcha on a ~39-paper run.
JITTER_MIN_SEC, JITTER_MAX_SEC = 15, 25


def load_pubs() -> list:
    with PUBS_FILE.open() as f:
        return yaml.safe_load(f) or []


def is_captcha(page) -> bool:
    try:
        low = page.content().lower()
    except Exception:
        return False
    return ("gs_captcha" in low or "not a robot" in low
            or "please show you" in low or "/sorry/" in page.url)


def wait_for_citation_or_captcha(page, timeout_s: float = 15.0) -> str:
    """Poll until the citation table appears. Returns 'ok' | 'captcha' | 'timeout'."""
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        if page.query_selector(".gsc_oci_field"):
            return "ok"
        if is_captcha(page):
            return "captcha"
        time.sleep(0.5)
    return "captcha" if is_captcha(page) else "timeout"


# Anchor on the "Total citations" row (Scholar's MERGED total), not the first
# "Cited by N" on the page — the histogram and the related-articles list below it
# carry their own "Cited by N". Returns int, 0 (real page, no row), or None.
EXTRACT_JS = r"""() => {
  const fields = [...document.querySelectorAll('.gsc_oci_field')];
  const f = fields.find(e => /total citations/i.test(e.textContent || ''));
  if (f && f.nextElementSibling) {
    // Read ONLY the "Cited by N" anchor (its href has cites=), NOT the whole value
    // div — that div also holds the per-year citation histogram, whose digits would
    // concatenate onto the count via textContent (e.g. 313 -> 3.13...e61). Bug found
    // 2026-06-03: the histogram is a sibling of the link inside .gsc_oci_value.
    const a = f.nextElementSibling.querySelector('a[href*="cites="]')
           || f.nextElementSibling.querySelector('a');
    const m = a && (a.textContent || '').match(/Cited by\s+([\d,]+)/);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  }
  if (document.querySelector('#gsc_oci_table, .gsc_oci_field')) return 0;  // real page, 0 cites
  return null;  // not a citation page (captcha / unexpected)
}"""


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", type=str, help="Only fetch a single DOI.")
    ap.add_argument("--limit", type=int, help="Only fetch the first N papers.")
    ap.add_argument("--headless", action="store_true",
                    help="Run headless (NOT recommended — you can't solve captchas).")
    ap.add_argument("--dry-run", action="store_true", help="Fetch but don't write the YAML.")
    args = ap.parse_args()

    user_id, pub_id_map = load_pub_id_map()
    if not user_id or not pub_id_map:
        sys.exit("No _data/scholar_pub_ids.yml mapping. Run scripts/fetch_scholar_pub_ids.py first.")

    existing = load_existing()
    counts = existing.get("counts") if isinstance(existing.get("counts"), dict) else {}
    flagged = existing.get("flagged_for_review") if isinstance(existing.get("flagged_for_review"), dict) else {}
    counts, flagged = dict(counts), dict(flagged)

    # Work list: papers with a pub_id, in publications.yml order.
    work = []
    only = normalize_doi(args.only) if args.only else None
    for pub in load_pubs():
        doi = normalize_doi(pub.get("doi", ""))
        if not doi or doi not in pub_id_map:
            continue
        if only and doi != only:
            continue
        work.append((doi, pub_id_map[doi]))
    if args.limit:
        work = work[: args.limit]
    if not work:
        sys.exit("No matching papers (check --only DOI / scholar_pub_ids.yml).")

    print(f"Fetching {len(work)} paper(s) via signed-in Chrome.")
    now = dt.datetime.now(dt.timezone.utc)
    n_ok = n_zero = n_fail = 0
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        try:
            ctx = p.chromium.launch_persistent_context(
                user_data_dir=str(PROFILE_DIR),
                channel="chrome",
                headless=args.headless,
                viewport={"width": 1280, "height": 900},
                args=["--disable-blink-features=AutomationControlled"],
            )
        except Exception as e:
            sys.exit(f"Could not launch Chrome ({e}).\n"
                     f"If Chrome isn't found, install browsers with: "
                     f".venv-scholar/bin/python -m playwright install chromium  "
                     f"(then remove channel='chrome' in this script).")

        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        # Warm-up / login: open Scholar; let the user sign in + clear any captcha once.
        page.goto(PROFILE_URL.format(user=user_id), wait_until="domcontentloaded")
        if not args.headless:
            print("\n" + "=" * 72)
            print(" A Chrome window opened on your Google Scholar profile.")
            print("   1. If not signed in, click 'Sign in' (top-right) and log in.")
            print("   2. Solve any captcha shown.")
            print("   3. When you can SEE your publication list, come back here.")
            print("=" * 72)
            input(" Press Enter to start fetching... ")

        for i, (doi, pubid) in enumerate(work):
            url = CITATION_URL.format(user=user_id, pubid=pubid)
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
            except PWTimeout:
                print(f"[fail] {doi:<40} navigation timeout — flagged")
                flagged[doi] = "browser fetch: navigation timeout"
                n_fail += 1
                continue

            status = wait_for_citation_or_captcha(page)
            if status == "captcha" and not args.headless:
                print(f"\n[captcha] {doi}")
                print("          Solve the captcha in the browser window, then…")
                input("          press Enter to continue (Ctrl-C to stop): ")
                page.goto(url, wait_until="domcontentloaded")
                status = wait_for_citation_or_captcha(page)

            if status != "ok":
                print(f"[fail] {doi:<40} ({status}) — flagged for retry; prior count preserved")
                flagged[doi] = f"browser fetch: {status}"
                n_fail += 1
            else:
                cnt = page.evaluate(EXTRACT_JS)
                if cnt is None:
                    print(f"[fail] {doi:<40} (no Total-citations row) — flagged")
                    flagged[doi] = "browser fetch: parse miss"
                    n_fail += 1
                elif int(cnt) > 1_000_000:
                    # Sanity bound — no paper has >1M cites. A value this large means
                    # the parse slurped extra digits (e.g. the histogram). Never record
                    # it; flag for retry and keep the prior count.
                    print(f"[fail] {doi:<40} (implausible count {cnt} — parse error) — flagged; prior preserved")
                    flagged[doi] = f"browser fetch: implausible count {cnt}"
                    n_fail += 1
                elif int(cnt) == 0:
                    print(f"[zero] {doi:<40} Scholar=0 — flagged, OpenAlex will fill in")
                    flagged[doi] = "Scholar returned 0 cites via browser"
                    n_zero += 1
                else:
                    prev = counts.get(doi)
                    old = prev.get("count") if isinstance(prev, dict) else None
                    arrow = f"{old} -> {cnt}" if (old is not None and old != cnt) else f"{cnt}"
                    print(f"[ok]   {doi:<40} {arrow}   (browser, total citations)")
                    counts[doi] = {
                        "count": int(cnt),
                        "title_match": 1.0,
                        "fetched_at": now.isoformat(timespec="seconds"),
                        "source": "browser",
                    }
                    flagged.pop(doi, None)
                    n_ok += 1

            if not args.dry_run:
                atomic_write_yaml(build_payload(counts, flagged))
            if i < len(work) - 1:
                time.sleep(random.uniform(JITTER_MIN_SEC, JITTER_MAX_SEC))

        ctx.close()

    if not args.dry_run:
        atomic_write_yaml(build_payload(counts, flagged))
        print(f"\nWrote {OUT_FILE.relative_to(ROOT)}")
    print(f"Summary: {n_ok} ok, {n_zero} zero (flagged), {n_fail} failed (flagged).")
    # Exit code for the wrapper: rc=2 = nothing fetched (e.g. fully captcha-blocked)
    # → wrapper skips committing flag-only churn. rc=0 = at least one count fetched
    # (or --dry-run) → wrapper commits + pushes.
    if n_ok == 0 and not args.dry_run:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
