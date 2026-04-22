# CLAUDE.md — kevinhong-research.github.io

Academic personal website for Kevin Y. Hong (University of Miami).
Built on Jekyll / al-folio. Deployed to GitHub Pages via the `gh-pages` branch.

---

## Stack

| Layer | Tool |
|-------|------|
| Site generator | Jekyll (Ruby, rbenv 3.3.7) |
| Theme | al-folio (heavily customised) |
| CSS | Bootstrap + custom SCSS in `_sass/` |
| Fonts | Self-hosted: Geist, Cormorant Garamond, Instrument Sans, Space Grotesk |
| JS | Vanilla JS + D3 v7 (football map) |
| Deploy | GitHub Actions → `gh-pages` branch |

---

## Dev server

```bash
# Start (uses rbenv Ruby, NOT system Ruby 2.6)
/Users/hong/.rbenv/versions/3.3.7/bin/bundle exec jekyll serve --livereload

# Or via Claude Code preview (launch.json already configured):
# .claude/launch.json → "jekyll" → port 4000
```

**Note:** `bundle` from `/usr/bin/bundle` uses the system Ruby 2.6 and will fail.
Always use the full rbenv path or run via `.claude/launch.json`.

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
| `/teaching/` | `_pages/teaching.md` |

---

## Git hooks

`.githooks/pre-commit` — activated. Automatically fixes publication title case
before any commit that stages `_data/publications.yml`.

To re-activate after a fresh clone:
```bash
git config core.hooksPath .githooks
```
