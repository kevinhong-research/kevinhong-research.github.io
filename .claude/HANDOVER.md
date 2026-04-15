# Session Handover

> Updated at the end of each session. New sessions should read this first.

---

## 2026-04-15 — Session 1 (latest)

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
