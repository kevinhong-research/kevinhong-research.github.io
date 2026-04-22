# Session Handover

> Updated at the end of each session. New sessions should read this first.

---

## 2026-04-21 — Session 2 (latest)

### Goal
Merge the `MacStudio-ui-ux-audit` branch into `main` and push — bringing navigation, publications, and site-wide UI refinements live; also formalise workflow/task rules in `.claude/CLAUDE.md` and add a handover template.

### What was done

**UI/UX audit merge (commit `9a497d9` + merge `25c46f6`)**
- Merged `MacStudio-ui-ux-audit` (developed on MacStudio, brought over and fast-merged here)
- Touches 17 files, +712 / −261 lines
- Site navigation (`_includes/header.liquid`, `_sass/_dropdown.scss`, `_pages/dropdown.md`, `_pages/football.md`, `_pages/services.md`, `_pages/talks.md`, `_pages/working.md`)
- Publications page overhaul (`_pages/publications.md`, `assets/css/research.css` +382 lines, `assets/js/research.js` +202 lines)
- Supporting theme + base tweaks (`_sass/_base.scss`, `_sass/_themes.scss`, `_config.yml`)
- Page-level CSS polish (`assets/css/about.css`, `football.css`, `services.css`, `talks.css`)

**Workflow rules formalised (`.claude/CLAUDE.md`)**
- Expanded the minimal "Coding Rules" into 8 numbered Workflow Orchestration Rules + 7 Task Management Rules + Core Principles (mirrors the global `~/.claude/CLAUDE.md` pattern)
- Added explicit rule: before pushing to main, write handover → commit → push → prompt `/clear`

**Handover template (`.claude/handover-template.md`)**
- New file, defines the canonical format for future HANDOVER.md entries

**Gemfile.lock**
- Platform-specific ffi gems regenerated on this machine (aarch64-linux entries replaced with local platform set); expected side-effect of `bundle install` on a new host

**Dropdown panel consistency fix (`_sass/_dropdown.scss`, commit `5c50464`)**
- User reported About vs Publications dropdowns looking inconsistent in both light and dark mode
- Root cause: the panels themselves had identical computed styles, but the active-item treatment was a full-width solid colored block (`var(--global-hover-color)` in dark = green fill; `#CC785C` in light = terracotta fill), which gave whichever panel contained the current page's child a much heavier visual weight than the other one
- Replaced the solid-fill active state with a subtle `color: var(--global-theme-color)` + `font-weight: 500` + `background: transparent !important` marker
- Same treatment in the light-mode override (`#CC785C` text, transparent bg)
- Removed commented-out dead CSS from earlier `::before` accent-bar experiment
- Verified in browser via preview_screenshot on `/` and `/publications/` in both modes — panels now read as uniform regardless of which has an active child

### Current status
- **Done**: UI/UX audit merged; CLAUDE.md workflow rules + handover template committed locally; Gemfile.lock refreshed; dropdown consistency fix committed locally (`5c50464`)
- **Pending**: Push all local commits to `origin/main` (4 pushed earlier, plus `5c50464` still to push)
- **Not yet verified in browser on live site**: everything currently verified on local dev server only — watch GitHub Pages rebuild

### Important context
- Local branch `MacStudio-ui-ux-audit` is retained post-merge; safe to delete later if no further work expected on it
- `_bibliography/papers.bib` remains commented-out (not rendered) — publications source of truth is still `_data/publications.yml`
- Football dark mode fix and title-case tooling from Session 1 were already on `main` before this merge

### Decisions already made
- Kept CLAUDE.md workflow rules near-identical to the user's global `~/.claude/CLAUDE.md` for consistency (same numbered structure)
- Committed Gemfile.lock platform change rather than `.gitignore`ing it — lockfile drift per-machine is the team/repo's accepted norm here

### Next best step
- **Primary action**: After push lands, visit the live site (`/`, `/publications/`, `/football/`, `/services/`) in both light and dark mode to confirm the nav/publications UI refinements and the dropdown consistency fix both rendered as intended
- If the user still perceives the two dropdowns as different after the fix, the next thing to investigate is the *trigger* (nav-link) treatment — the active dropdown trigger picks up `color: var(--global-theme-color)` + a gradient underline from `_sass/_base.scss:326` (`.navbar-nav .nav-item.active > .nav-link`), which the inactive one doesn't. That is the remaining asymmetry by design
- Consider deleting local `MacStudio-ui-ux-audit` branch once GitHub Pages build confirms the merge is clean
- Continue populating `.claude/plans/` for any substantive next change

---

## 2026-04-15 — Session 1

### Goal
Fix dark mode text visibility on the football page; normalise all publication titles to consistent Chicago-style title case; set up dev server and automated tooling.

### What was done

**Football page — dark mode fix (`assets/css/football.css`)**
- Comprehensive audit found no `html[data-theme="dark"]` block existed
- Root cause: `--fb-text-lo: #3A3A36` is near-identical to dark card background `#2F2F2D`, making labels (QB1, Record, Position, Year) and map tooltip row labels invisible
- Added `html[data-theme="dark"]` section at end of file:
  - `--fb-text-lo` raised to `#6A6A5E` — fixes all card and tooltip labels
  - `--fb-line` raised to `#4A4A46` — fixes pill container border-top/bottom
  - All hardcoded `rgba(58,58,54,*)` borders and separators replaced with `rgba(194,192,182,*)` equivalents for legible contrast on dark page background (`#262624`)
  - Covers: pill borders, pill separators, feature card borders, row dividers, map marker frame, tooltip border, tooltip note divider, empty-state code background, lightbox close button

**Publication titles — normalisation (`_data/publications.yml`, `_bibliography/papers.bib`)**
- Discovered `papers.bib` entries are all commented out — `_data/publications.yml` is the live source
- Fixed 32 of 39 titles in `_data/publications.yml` to Chicago-style title case (7 were already correct)
- Applied same fixes to `papers.bib` for consistency

**Automated title case tooling (`scripts/fix_pub_titles.py`, `.githooks/pre-commit`)**
- `scripts/fix_pub_titles.py`: pure-Python script (no dependencies); reads `_data/publications.yml`, applies full Chicago title case rules (acronym preservation, hyphenated compounds, post-colon capitalisation), writes in place; supports `--dry-run`
- `.githooks/pre-commit`: runs the script automatically whenever `_data/publications.yml` is staged; re-stages the file if changes were made
- Activated via `git config core.hooksPath .githooks`

**Dev server setup (`.claude/launch.json`)**
- Diagnosed failure: `/usr/bin/bundle` uses system Ruby 2.6 which lacks bundler 2.5.18
- Fixed by setting `runtimeExecutable` to `/Users/hong/.rbenv/versions/3.3.7/bin/bundle`
- Server confirmed running on port 4000

**Project context files (`.claude/CLAUDE.md`, `.claude/HANDOVER.md`)**
- Created both files (gitignored, local only)

### What was tested
- `python scripts/fix_pub_titles.py --dry-run` → 0 titles to change ✓
- Jekyll dev server started successfully on port 4000 ✓
- Football dark mode: CSS audit confirmed; visual verification in browser not completed this session

### DB changes
- None (static Jekyll site)

### Commits pushed to main
- `fix: football dark mode label visibility and border contrast`
- `fix: normalise all publication titles to Chicago-style title case`
- `feat: add automated title case script and pre-commit hook`

### Current status
- All changes committed and pushed to main
- Football dark mode fix unverified in browser — should be checked next session

### Next best step
- Open `http://localhost:4000/football/` in dark mode and confirm QB1/Record labels are visible
- Verify light mode on football page is unaffected by new dark overrides
- Review `_data/publications.nina.yml` — purpose is unclear
- Consider removing commented-out entries from `papers.bib` or documenting why they exist
