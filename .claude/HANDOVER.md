# Session Handover

> Updated at the end of each session. New sessions should read this first.

---

## 2026-04-29 — Session 3 (latest)

### Goal
Shrink the bloated `.git/` (was 129 MB) by purging four large history-only blobs via `git filter-repo`, then opportunistically remove seven unused al-folio template pages — all force-pushed and redeployed live without disrupting the deployed site.

### What was done

**History filter (commit `0bd194f` → `319fc38`, force-pushed)**
- Installed `git-filter-repo` via Homebrew
- Pre-flight audit confirmed all four target paths absent from current tree and unreferenced by anything that ships to the live site
- Removed from every commit: `assets/video/tutorial_al_folio.mp4` (24.79 MB), `assets/img/prof_pic_color.png` (13.72 MB), `assets/img/prof_pic.jpg` (2.20 MB), `assets/css/main.css.map` (21 versions)
- Cryptographic invariant verified: HEAD tree SHA `51bd5cf069f3d2d48f7bc0f1736224bf648151bc` byte-identical pre/post filter — proves the rendered site cannot change
- Reclaim: pack 122 MiB → 81 MiB (~41 MB packed); commit count preserved (209 commits, all rewritten)

**Unused page removal (commit `319fc38`, on top of filter)**
- Deleted 7 page files + 1 orphan content file + 1 obsolete `_config.yml` exclude entry: `_pages/teaching.md`, `_pages/archived pages/{profiles,blog,news,projects,cv,repositories,about_einstein}.md`, removed line `- _pages/about_einstein.md` from `_config.yml` exclude block
- 9 files changed, 372 deletions
- Verified all 7 URLs now 404 on dev server, all 6 kept routes (`/`, `/publications/`, `/working/`, `/talks/`, `/services/`, `/football/`) still 200
- Deploy to `gh-pages` succeeded (commit `7d405d5`); same verified against `https://kevinhong.ai`

**Dev environment rebuild** (machine had drifted since Session 2)
- rbenv had been removed from `/Users/hong/.rbenv/`; reinstalled via `brew install rbenv ruby-build` and `rbenv install 3.3.7`
- New bundler 4.x deprecated `--path`; switched to `bundle config set --local path 'vendor/bundle'`
- Installed ImageMagick (`brew install imagemagick`) — required locally so `jekyll-imagemagick` plugin can produce `prof_pic-{480,800,1400}.webp` variants; missing it caused dev-preview-only 404s on those `<picture>` sources
- Dev preview verified working at `http://127.0.0.1:4000` — homepage, all kept pages, light-mode parchment colors render correctly

**Local repo cleanup**
- Swapped filtered clone in for original; kept `.OLD` directory briefly then `rm -rf`'d it (438 MB)
- Deleted `origin/backup/pre-filter-2026-04-29` (the in-session safety branch)
- Restricted `remote.origin.fetch` to main only (`+refs/heads/main:refs/remotes/origin/main`)
- Dropped local `refs/remotes/origin/gh-pages` and ran `git gc --aggressive --prune=now`
- Final `.git/`: 90 MB on disk, 80.56 MiB pack — down from 129 MB / 122 MiB at session start

### Current status
- **Done**: All technical work complete; live site verified at `https://kevinhong.ai`
- **In progress**: nothing
- **Pending**: Eyeball check after Fastly CDN cache (max-age 600s) clears — the deleted-page URLs will return 200 for ~10 min after deploy due to CDN cache, then 404. Verified on the `gh-pages` git tree itself that they're absent.

### Important context
- **Recovery is no longer possible for pre-filter SHAs** — backup branch deleted, `.OLD` clone deleted. The current clone's reflog only contains the filtered SHAs (`319fc38`, `e14cf54`, …). The original tip `0bd194f` exists nowhere user-accessible. The decision was deliberate after live-site verification.
- **`CLAUDE.md` rbenv path is correct again** — `/Users/hong/.rbenv/versions/3.3.7/bin/bundle` is back in place after this session's rbenv reinstall. If rbenv gets removed again, dev preview will fail with the exact same "Failed to spawn process: No such file or directory" message.
- **ImageMagick is required for parity** between local dev and the deployed site. Without it, `prof_pic-*.webp` and talk-logo webp variants 404 locally — confusing because the deployed site (built on GHA where ImageMagick exists) is fine.
- **`gh-pages` is not fetched locally** anymore. To inspect what's deployed: `git fetch origin gh-pages` brings it back into a remote-tracking ref temporarily.
- **`_pages/archived pages/publications_scholar.md` was NOT removed** — only the 7 explicitly listed by the user. That folder still has one file in it; consider removing if also unused.
- The dev preview defaults to dark mode (`default_theme: dark` in `_config.yml`); cross-device color comparisons need both browsers in the same theme.

### Decisions already made
- **Force-push over a test PR** — pre-flight tree-SHA equivalence proof gave mathematical certainty the deployed site couldn't break, so the slower PR-test-then-merge path added no information
- **Filter + page removal in a single push pair** — clean two-commit history (`e14cf54` filtered base, `319fc38` cleanup) instead of two separate force-pushes
- **Did not also clean inert blog-related entries in `_config.yml`** (lines 136, 307–309: pagination, permalink patterns) — they're harmless dead config and the user didn't ask
- **Manual `gh workflow run deploy.yml` was redundant** — the chore commit's `**.md` deletions already matched the deploy workflow's `paths:` filter and auto-triggered it. Knowing this for future history-only force-pushes (which would NOT auto-trigger): use `workflow_dispatch` if no path-matched changes are part of the push.
- **Did not update `CLAUDE.md`** to record the ImageMagick dependency — out of scope for this session, but a candidate add for any "Dev server" doc cleanup

### Next best step
- **Primary action**: Spot-check `https://kevinhong.ai/teaching/` (or any other deleted route) returns 404 after CDN expires (~10 min from `2026-04-30 02:56 UTC` deploy). If 200s persist past 30 min, force a hard refresh; if still 200 then, something didn't deploy as expected — check `git ls-tree origin/gh-pages teaching/` to see if the file actually got removed (already confirmed absent at deploy time, so this would be unusual).
- Consider whether to add an `ImageMagick (brew install imagemagick)` line to `CLAUDE.md`'s "Dev server" section so future sessions on a fresh machine don't hit the same diagnostic detour.
- Optional: remove `_pages/archived pages/publications_scholar.md` if also unused (the only remaining occupant of `archived pages/`).

---

## 2026-04-21 — Session 2

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
