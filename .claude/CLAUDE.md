# CLAUDE.md — kevinhong-research.github.io

Academic personal website for Kevin Y. Hong (University of Miami).
Built on Jekyll / al-folio. Deployed to GitHub Pages via the `gh-pages` branch.

---

## Stack

| Layer | Tool |
|-------|------|
| Site generator | Jekyll (Ruby, rbenv 3.3.11) |
| Theme | al-folio (heavily customised) |
| CSS | Bootstrap + custom SCSS in `_sass/` |
| Fonts | Self-hosted: Geist, Cormorant Garamond, Instrument Sans, Space Grotesk |
| JS | Vanilla JS + D3 v7 (football map) |
| Deploy | GitHub Actions → `gh-pages` branch |

---

## Dev server

```bash
# Start (uses rbenv Ruby, NOT system Ruby 2.6)
RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_ exec jekyll serve --livereload --host 127.0.0.1 --port 4000

# Or via Claude Code preview (launch.json already configured):
# .claude/launch.json → "jekyll" → port 4000
```

**Note:** `bundle` from `/usr/bin/bundle` uses the system Ruby 2.6 and will fail.
Always use Homebrew rbenv, the repo `.ruby-version`, or `.claude/launch.json`.

---

## Workflow Orchestration Rules

### 1. Write Handover before Push

- Read the latest 3-5 handover records at `.claude/HANDOVER.md` at start of each session
- When instructed to push to main or remote main, do **not** push yet — first commit the changes, then document current session's handover information as the latest entry at `.claude/HANDOVER.md`. After handover is written, commit and push. Prompt the user to stop the session and start a new session via `/clear`.

### 2. Handover Format and Template

- The handover template is at `.claude/handover-template.md`

### 3. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 4. Subagent Strategy

- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 5. Self-Improvement Loop

- After ANY correction from the user: update `.claude/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant context

### 6. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 7. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 8. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management Rules

1. **Plan First**: Write plan and save to `.claude/plans/` with checkable items
2. **Plan File Name**: Name the plan with a simple description and date so plans can be revisited in the future
3. **Verify Plan**: Check in before starting implementation
4. **Track Progress**: Mark items complete as you go
5. **Explain Changes**: High-level summary at each step
6. **Document Results**: Add review section to the same plan file
7. **Capture Lessons**: Update `.claude/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Key data files

| File | Purpose |
|------|---------|
| `_data/publications.yml` | **Primary** publication list — this is what the site renders |
| `_data/working_papers.yml` | Working papers / under review |
| `_data/talks.yml` | Conference and invited talks |
| `_data/services.yml` | Editorial and professional service |
| `_data/football.yml` | School overrides for the football map |
| `_data/football_favorite_teams.yml` | Favorite teams cards |
| `_data/football_favorite_players.yml` | Favorite players cards |
| `_data/scholar_counts.yml` | **Auto-generated.** Google Scholar citation counts per DOI — see "Scholar citation pipeline" below |
| `_bibliography/papers.bib` | Legacy BibTeX — all entries are commented out; **not rendered** |

---

## Theming

Three theme states (set via `data-theme` attribute on `<html>`):

| `data-theme` | Description |
|---|---|
| *(none / `:root`)* | Default light (white) |
| `"light"` | Claude Light Parchment (`#faf9f5`) |
| `"dark"` | Claude Code dark (`#262624`) |

Dark mode is the default (`default_theme: dark` in `_config.yml`).

Custom theme vars live in `_sass/_themes.scss`. Page-specific overrides
(e.g. football page) should have **three** blocks: base, `[data-theme="light"]`,
and `[data-theme="dark"]`.

---

## Conventions

### Publication titles
All titles in `_data/publications.yml` must use **Chicago-style title case**:
- Capitalize all major words
- Lowercase: articles (a, an, the), coordinating conjunctions (and, but, or…),
  prepositions (in, on, at, to, for, from, of, via, through, with…)
- First word after `:` `?` `!` always capitalized
- Preserve all-caps acronyms (AI, IT, DM, CIO, SHEDR…)
- Hyphenated compounds: capitalize each part unless it's an article/short prep
  (End-to-End, On-the-Hour, Algorithm-Based, E-Procurement)

**Auto-fix script:**
```bash
python scripts/fix_pub_titles.py            # fix in place
python scripts/fix_pub_titles.py --dry-run  # preview only
```

This also runs automatically as a pre-commit hook whenever
`_data/publications.yml` is staged (hook path: `.githooks/pre-commit`,
already activated via `git config core.hooksPath .githooks`).

### Scholar citation pipeline

The per-paper citation badge on `/publications/` prefers Google Scholar's count
when present, falling back to OpenAlex (live API) otherwise. Source data lives
in `_data/scholar_counts.yml`, regenerated by a local Python scraper.

**Why local:** Google Scholar blocks datacenter IPs aggressively. The scraper
must run from a residential network — never in CI/GitHub Actions.

#### End-to-end pipeline

```
                          ONE TIME, PER MACHINE
┌─────────────────────────────────────────────────────────────────┐
│  ./scripts/setup_scholar.sh                                     │
│  → creates .venv-scholar/, installs scholarly + requests + yaml │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                          ONE TIME, PER AUTHOR PROFILE
┌─────────────────────────────────────────────────────────────────┐
│  .venv-scholar/bin/python scripts/fetch_scholar_pub_ids.py      │
│  → walks scholar.google.com/citations?user=<scholar_userid>     │
│  → matches each Scholar paper to publications.yml by title      │
│  → writes _data/scholar_pub_ids.yml { doi: scholar_pub_id }     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                          WEEKLY / ON DEMAND
┌─────────────────────────────────────────────────────────────────┐
│  ./scripts/refresh_scholar.sh                                   │
│  ├── calls fetch_scholar_counts.py                              │
│  │   ├── reads publications.yml + scholar_pub_ids.yml +         │
│  │   │       existing scholar_counts.yml (counts + flags)       │
│  │   ├── shuffles paper order (spreads block risk)              │
│  │   └── per paper:                                             │
│  │       1. SKIP if last fetch < --max-age-days AND not flagged │
│  │       2. If pub_id mapped → DIRECT URL fetch (10-20s jitter) │
│  │          GET citations?citation_for_view=…&user=…            │
│  │          parse "Cited by N" → record                         │
│  │       3. If no mapping OR direct fails → SEARCH fallback     │
│  │          scholarly.search_pubs() + verify_match()            │
│  │          30-90s jitter                                       │
│  │       4. Scholar=0 or no match → SKIP write, FLAG for review │
│  │   └── writes _data/scholar_counts.yml atomically             │
│  ├── git diff → if file changed → git commit + git push         │
│  └── GitHub Actions builds & deploys (~1-2 min)                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                          AT VISIT TIME (browser)
┌─────────────────────────────────────────────────────────────────┐
│  /publications/                                                 │
│  ├── Jekyll inlines window.SCHOLAR_COUNTS from data file        │
│  ├── research.js fetchCitations():                              │
│  │   1. Apply Scholar values synchronously                      │
│  │   2. Query OpenAlex for DOIs not in Scholar data             │
│  │   3. Tag badges with data-cite-source="scholar|openalex"     │
│  └── Badges render with live numbers                            │
└─────────────────────────────────────────────────────────────────┘
```

#### Re-run frequency cheat-sheet

| Trigger | Run |
|---|---|
| New machine | `setup_scholar.sh` |
| New paper added to `publications.yml` | `fetch_scholar_pub_ids.py`, then `refresh_scholar.sh` |
| Just want fresh numbers | `refresh_scholar.sh` |
| Suspicious entry in `flagged_for_review:` | `refresh_scholar.sh --only <DOI>` |
| Force re-fetch ignoring freshness | `refresh_scholar.sh --max-age-days 0` |
| Scholar block mid-run | Wait 12-24 h, re-run — partial progress preserved |

#### One-time setup (per machine, one-liner)

```bash
./scripts/setup_scholar.sh
```

Creates `.venv-scholar/` (gitignored) and installs `scholarly` + `PyYAML`.
Idempotent — re-running re-uses the venv and just refreshes dependencies, so
it's also the right command to run after `scripts/requirements-scholar.txt`
changes. Otherwise only redo on a new machine.

#### One-time profile bootstrap (per author, one-liner)

```bash
.venv-scholar/bin/python scripts/fetch_scholar_pub_ids.py
```

Walks the Scholar author profile **once** to build a DOI → `pub_id` mapping
in `_data/scholar_pub_ids.yml`. With this in place, the refresh script
fetches counts via direct per-paper citation URLs (lighter rate-limit
category than `search_pubs`, much less block-prone). The bootstrap itself
costs ~1-3 Scholar requests total.

Re-run only when new papers are added to publications.yml. Otherwise the
mapping is stable. If the bootstrap is skipped, the refresh script falls
back to search-based fetching for every paper (more block-prone).

#### Weekly / on-demand refresh (one-liner)

```bash
./scripts/refresh_scholar.sh
```

What it does, in order:
1. Runs the scraper (~10–20 min for 39 papers with jittered sleeps).
2. If `_data/scholar_counts.yml` changed, commits with message
   `data: refresh scholar citation counts` and pushes to `origin/main`.
3. If nothing changed (counts identical to last run), exits cleanly with **no
   commit** — safe to re-run any time.
4. If Scholar blocks the IP mid-run, commits the partial progress with a
   `(partial — IP blocked mid-run)` tag, then exits. Retry from a different
   network or after 24 h.

Smoke tests and partial refreshes pass flags straight to the Python scraper:

```bash
./scripts/refresh_scholar.sh --limit 3       # first 3 papers (~3 min)
./scripts/refresh_scholar.sh --only 10.1287/isre.2022.1160
./scripts/refresh_scholar.sh --dry-run       # validate freshness/skip paths, no write
./scripts/refresh_scholar.sh --max-age-days 0  # force re-fetch of every paper
```

**Freshness skip + restart-after-block:** the scraper records when each
DOI's count was last verified. On the next run, any paper whose count is
under `--max-age-days N` (default 7) is auto-skipped — no Scholar call,
no jitter. After a Scholar block mid-run, you can re-run *immediately*
once the block clears: the 33 successful papers from last time will be
skipped as fresh, leaving only the ~6 failed/blocked ones to retry. This
also distributes block risk across runs — a full refresh shuffles paper
order so the same paper isn't always at position #39.

**Direct-URL vs search fetch:** when `_data/scholar_pub_ids.yml` exists
(see one-time profile bootstrap above), each paper's count is fetched
via the canonical per-paper citation page — one lightweight HTTP request,
no metadata-stub risk, no `verify_match` needed because the pub_id is
deterministic. Jitter shortens to 10-20s for these. Papers without a
pub_id mapping fall back to `scholarly.search_pubs` with 30-90s jitter.
A full refresh post-bootstrap is ~10-12 min (was ~40 min) at far lower
block risk.

#### Manual three-step equivalent

Use this if you want to review the diff before pushing:

```bash
.venv-scholar/bin/python scripts/fetch_scholar_counts.py
git diff _data/scholar_counts.yml
git add _data/scholar_counts.yml && git commit -m "data: refresh scholar citation counts" && git push
```

#### Manual-review queue

The scraper auto-skips two suspicious result patterns to avoid wrong
attributions on the live site:

1. **Scholar returns 0 cites** for an indexed paper — almost always a
   metadata-corrupt stub that happened to pass the title match.
2. **No valid candidate** in the top 5 Scholar hits.

In both cases the scraper:
- Does **not** write a count (frontend auto-falls back to OpenAlex).
- Preserves any existing count untouched (so manually-pinned values stick).
- Adds the DOI to a `flagged_for_review:` block at the bottom of
  `_data/scholar_counts.yml` with a one-line reason.

After each refresh, scan the `flagged_for_review:` block in the file
(or in `git diff _data/scholar_counts.yml`). If you confirm the real
Scholar count via the web UI, edit the `counts:` section directly to
pin the verified value — the next refresh will leave it alone unless
Scholar starts returning a confident match.

Flags auto-clear on the next refresh that produces a confident nonzero
count for the same DOI.

#### Rollback

```bash
git rm _data/scholar_counts.yml && git commit -m "revert: remove scholar pipeline data" && git push
```

The site falls back to OpenAlex for every paper, exactly as before this
pipeline shipped.

### Football page dark mode
`assets/css/football.css` has three theme sections:
1. Base (dark palette, no selector) — default and dark mode cards
2. `html[data-theme="light"] .fb-page` — light mode overrides
3. `html[data-theme="dark"] .fb-page` — dark mode overrides (at end of file)

When adding new CSS to the football page, check all three states.
Key issue that was fixed: `--fb-text-lo` was `#3A3A36` (invisible on dark card
`#2F2F2D`). Dark mode override sets it to `#6A6A5E`.

---

## Pages

| URL | Source |
|-----|--------|
| `/` | `_pages/about.md` |
| `/publications/` | `_pages/publications.md` + `_data/publications.yml` |
| `/talks/` | `_pages/talks.md` + `_data/talks.yml` |
| `/services/` | `_pages/services.md` + `_data/services.yml` |
| `/football/` | `_pages/football.md` + `assets/css/football.css` + `assets/js/footballmap.js` |

---

## Git hooks

`.githooks/pre-commit` — activated. Automatically fixes publication title case
before any commit that stages `_data/publications.yml`.

To re-activate after a fresh clone:
```bash
git config core.hooksPath .githooks
```
