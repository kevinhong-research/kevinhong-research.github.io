# Color Token Audit and Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce hard-coded colors in the site by replacing literals that map cleanly to theme tokens, while preserving intentionally local visual details for maps, shadows, syntax highlighting, and vendor/generated assets.

**Architecture:** Treat `_sass/_themes.scss` as the design-system source of truth for site colors. Add a small set of missing semantic/utility tokens only when multiple literals represent the same reusable idea; otherwise replace literals directly with existing tokens such as `--surface`, `--surface-raised`, `--text-*`, `--line`, `--accent-warm`, `--accent-cool`, and derived `color-mix()` tokens. Split the work by visual surface so each commit is reviewable and screenshots can catch accidental palette drift.

**Tech Stack:** Jekyll, SCSS/CSS custom properties, vanilla JS/D3 SVG maps, project CSS in `_sass/`, `assets/css/`, page-level CSS in `_pages/`.

---

## Current Audit Snapshot

Command used:

```bash
python3 - <<'PY'
from pathlib import Path
import re, collections
roots = ['_sass','assets/css','assets/js','_pages','_includes','_layouts','_data']
exclude_prefixes = ['assets/css/bootstrap','assets/css/mdb','assets/css/jupyter','assets/css/jekyll-pygments','assets/css/academicons','assets/css/font-awesome/','assets/css/tabler-icons/','assets/js/distillpub/','assets/js/search/','assets/js/vanilla-back-to-top.min.js','_sass/font-awesome/','_sass/tabler-icons/']
exclude_files = {'_sass/_themes.scss','_sass/_variables.scss','_pages/dev-colors.md'}
pat = re.compile(r'#[0-9A-Fa-f]{3,8}\\b|\\brgba?\\([^\\n;{}]*\\)|\\bhsla?\\([^\\n;{}]*\\)', re.I)
by_file=[]; by_value=collections.Counter()
for root in roots:
    for p in Path(root).rglob('*'):
        if not p.is_file(): continue
        s=str(p)
        if s in exclude_files or any(s.startswith(x) for x in exclude_prefixes): continue
        ms=pat.findall(p.read_text(errors='ignore'))
        if ms:
            by_file.append((len(ms),s))
            by_value.update(ms)
print('Core UI color literals outside token files:', sum(c for c,_ in by_file))
print('Files:', len(by_file))
for c,s in sorted(by_file, reverse=True): print(f'{c:4} {s}')
PY
```

Baseline result on 2026-05-11:

```text
Core UI color literals outside token files: 164
Files: 17
  74 assets/css/football.css
  18 _pages/talks.md
  14 assets/css/talkmap.css
  12 assets/css/research.css
  11 _sass/_base.scss
  10 assets/css/about.css
   6 assets/css/talks.css
   4 _sass/_dropdown.scss
   3 assets/js/research.js
   2 assets/js/talkmap.js
   2 assets/js/bootstrap.bundle.min.js.map
   2 assets/css/services.css
   2 _data/venues.yml
   1 assets/js/footballmap.js
   1 _sass/_distill.scss
   1 _includes/scripts/search.liquid
   1 _includes/latest_posts.liquid
```

Do not chase these in this pass:

- `assets/css/jupyter*`, `assets/css/jekyll-pygments*`, Bootstrap/MDB, Font Awesome, Tabler, Academicons, Distill bundle, Search/Ninja minified assets.
- Literal colors inside `_sass/_themes.scss` and `_sass/_variables.scss`; those are token source definitions.
- The hex-input fallback values in `_pages/dev-colors.md`; they are part of the color-lab tool.

## Token Policy

Use existing tokens first:

- Dark/light surfaces: `--surface`, `--surface-raised`
- Text ladder: `--text-hi`, `--text`, `--text-mid`, `--text-lo`
- Lines: `--line`, `--line-hi`
- Accents: `--accent-warm`, `--accent-warm-soft`, `--accent-cool`, `--accent-danger`
- Derived accents: `--accent-warm-bg-*`, `--accent-warm-border*`, `--accent-cool-bg-*`, `--accent-cool-border*`

Add only these new tokens if repeated replacements make them useful:

```scss
// in _sass/_themes.scss :root, near line / overlay tokens
--shadow-soft: rgba(0, 0, 0, 0.08);
--shadow-medium: rgba(0, 0, 0, 0.28);
--overlay-scrim: rgba(0, 0, 0, 0.8);
--surface-overlay: color-mix(in oklch, var(--surface) 88%, transparent);
--map-fill: color-mix(in oklch, var(--surface-raised) 78%, var(--surface));
--map-fill-hover: color-mix(in oklch, var(--surface-raised) 88%, var(--surface));
--map-label: var(--text-lo);
```

If a literal is a one-off alpha shadow or image treatment, prefer leaving it and documenting why over inventing a token that nobody else will reuse.

## Task 0: Add Missing Shared Utility Tokens

**Files:**
- Modify: `_sass/_themes.scss`

- [x] **Step 1: Add reusable shadow, scrim, and map tokens**

Add this block in `_sass/_themes.scss` after the line tokens and before motion tokens:

```scss
  // ── Reusable overlays / shadows / map chroming
  --shadow-soft: rgba(0, 0, 0, 0.08);
  --shadow-medium: rgba(0, 0, 0, 0.28);
  --overlay-scrim: rgba(0, 0, 0, 0.8);
  --surface-overlay: color-mix(in oklch, var(--surface) 88%, transparent);
  --map-fill: color-mix(in oklch, var(--surface-raised) 78%, var(--surface));
  --map-fill-hover: color-mix(in oklch, var(--surface-raised) 88%, var(--surface));
  --map-label: var(--text-lo);
```

- [x] **Step 2: Verify token syntax is present**

Run:

```bash
rg -n -e '--shadow-soft' -e '--overlay-scrim' -e '--map-fill' _sass/_themes.scss
```

Expected: all three token groups are present.

- [x] **Step 3: Commit**

```bash
git add _sass/_themes.scss
git commit -m "style(theme): add shared map and overlay tokens"
```

## Task 1: Safe Inline Talks Pill Cleanup

**Files:**
- Modify: `_pages/talks.md`

- [x] **Step 1: Replace old accent literals in pill CSS**

Change these direct mappings:

```css
.tm-pill-bar::before { background: var(--accent-warm); }
.tm-pill { border: 1px solid var(--line); }
.tm-pills:hover .tm-pill,
.tm-pills--open .tm-pill {
  border-color: var(--accent-warm-border);
  background: var(--accent-warm-bg-subtle);
}
.tm-pill-n,
.tm-pill-l { color: var(--text-lo); }
.tm-pill--green .tm-pill-n { color: var(--accent-cool); }
.tm-pill--orange .tm-pill-n { color: var(--accent-warm); }
.tm-pills:hover .tm-pill--green .tm-pill-n,
.tm-pills--open .tm-pill--green .tm-pill-n { color: var(--accent-cool); }
.tm-pills:hover .tm-pill--orange .tm-pill-n,
.tm-pills--open .tm-pill--orange .tm-pill-n { color: var(--accent-warm); }
.tm-pills:hover .tm-pill--geo .tm-pill-l,
.tm-pills--open .tm-pill--geo .tm-pill-l { color: var(--accent-warm); }
.tm-pill-sep { background: var(--line); }
.tm-pills:hover .tm-pill-sep,
.tm-pills--open .tm-pill-sep { background: var(--line-hi); }
.tm-pill-hint { color: var(--text-mid); }
.tm-pills:hover .tm-pill-hint { color: var(--text); }
.tm-pills--open .tm-pill-hint { color: var(--text-hi); }
```

- [x] **Step 2: Verify no talks-page inline color literals remain except allowed transparent/currentColor/inherit**

Run:

```bash
rg -n -e '#[0-9A-Fa-f]{3,8}\\b' -e 'rgba?\\(' _pages/talks.md
```

Expected: no matches or only deliberately documented exceptions.

- [x] **Step 3: Commit**

```bash
git add _pages/talks.md
git commit -m "style(talks): tokenize pill strip colors"
```

## Task 2: Talks Map Geography and Tooltip Cleanup

**Files:**
- Modify: `assets/css/talkmap.css`
- Modify: `assets/js/talkmap.js`

- [x] **Step 1: Replace map state and tooltip literals with tokens**

Target mappings:

```css
.tm-state {
  fill: var(--map-fill);
  stroke: var(--line);
}
.tm-state:hover { fill: var(--map-fill-hover); }
.tm-state-lbl { fill: var(--map-label); }
.tm-tip { color: var(--text-mid); }
.tm-tip-meta { color: var(--text-lo); }
.tm-tip-divider { background: var(--line); }
html[data-theme="light"] .tm-state {
  fill: var(--map-fill);
  stroke: var(--line);
}
html[data-theme="light"] .tm-state:hover { fill: var(--map-fill-hover); }
html[data-theme="light"] .tm-state-lbl { fill: var(--map-label); }
html[data-theme="light"] .tm-tip {
  background: var(--surface-raised);
  border-color: var(--line);
  border-left-color: var(--accent-warm);
  color: var(--text-mid);
  box-shadow: 0 8px 24px var(--shadow-soft);
}
html[data-theme="light"] .tm-tip-meta { color: var(--text-lo); }
html[data-theme="light"] .tm-tip-divider { background: var(--line); }
```

- [x] **Step 2: Replace JS SVG stroke literals**

In `assets/js/talkmap.js`, replace:

```js
.attr("stroke", "#253040")
```

with:

```js
.attr("stroke", "var(--line)")
```

and replace:

```js
.attr("stroke", "rgba(0,0,0,0.5)")
```

with:

```js
.attr("stroke", "var(--surface)")
```

- [x] **Step 3: Verify the map CSS/JS no longer has hard-coded color literals**

Run:

```bash
rg -n -e '#[0-9A-Fa-f]{3,8}\\b' -e 'rgba?\\(' assets/css/talkmap.css assets/js/talkmap.js
node --check assets/js/talkmap.js
```

Expected: first command has no matches or only documented exceptions; Node syntax check passes.

- [x] **Step 4: Commit**

```bash
git add assets/css/talkmap.css assets/js/talkmap.js
git commit -m "style(talks): tokenize map palette"
```

## Task 3: Shared Base/Dropdown/About/Research/Services Cleanup

**Files:**
- Modify: `_sass/_base.scss`
- Modify: `_sass/_dropdown.scss`
- Modify: `assets/css/about.css`
- Modify: `assets/css/research.css`
- Modify: `assets/css/services.css`
- Modify: `assets/css/talks.css`
- Modify: `assets/js/research.js`
- Modify: `_includes/latest_posts.liquid`
- Modify: `_includes/scripts/search.liquid`

- [x] **Step 1: Replace obvious text/line/surface literals**

Use these mapping rules:

```text
#8A8A7A -> var(--text-mid)
#6e6d68 -> var(--text-mid)
#b4b2a7 -> var(--text-lo)
#535146 -> var(--text)
#595549 -> var(--text)
#dad9d4 -> var(--line)
#ede9de -> var(--surface-raised)
#ffffff -> var(--surface) when it means page/card bg; var(--ink) when it means foreground in dark UI
#D97757 / #c85a42 -> var(--accent-warm)
#00a060 / #00c070 -> var(--accent-cool)
rgba(217,119,87,0.7) -> color-mix(in oklch, var(--accent-warm) 70%, transparent)
rgba(217,119,87,0.4) -> color-mix(in oklch, var(--accent-warm) 40%, transparent)
stroke="#999" -> stroke="currentColor" where the surrounding text color is already appropriate; otherwise use `var(--text-lo)` if inline SVG allows CSS variables there.
```

- [x] **Step 2: Keep true shadow and scrim literals only if tokenizing would reduce clarity**

Tokenize repeated shadow/scrim values:

```css
box-shadow: 0 6px 16px var(--shadow-soft);
background-color: var(--overlay-scrim);
```

Leave one-off box-shadow alpha values only when they are tied to depth/geometry and not reusable.

- [x] **Step 3: Verify shared files**

Run:

```bash
rg -n -e '#[0-9A-Fa-f]{3,8}\\b' -e 'rgba?\\(' _sass/_base.scss _sass/_dropdown.scss assets/css/about.css assets/css/research.css assets/css/services.css assets/css/talks.css assets/js/research.js _includes/latest_posts.liquid _includes/scripts/search.liquid
node --check assets/js/research.js
git diff --check
```

Expected: any remaining matches are reviewed and either documented as intentional or queued for a later task.

- [x] **Step 4: Commit**

```bash
git add _sass/_base.scss _sass/_dropdown.scss assets/css/about.css assets/css/research.css assets/css/services.css assets/css/talks.css assets/js/research.js _includes/latest_posts.liquid _includes/scripts/search.liquid
git commit -m "style(theme): replace shared color literals with tokens"
```

## Task 4: Football Page Tokenization as a Dedicated Visual Pass

**Files:**
- Modify: `assets/css/football.css`
- Modify: `assets/js/footballmap.js` only if its one literal color is active rendering color rather than data/content.

- [x] **Step 1: Categorize the 74 literals before editing**

Create a temporary audit list:

```bash
rg -n -e '#[0-9A-Fa-f]{3,8}\\b' -e 'rgba?\\(' assets/css/football.css assets/js/footballmap.js
```

Group each match into one of:

```text
tokenize: text, line, surface, accent, map-fill, tooltip
keep: shadow, photo gradient, map texture, intentionally local visual effect
delete: unused variable such as --fb-blue if no selector consumes it
```

- [x] **Step 2: Remove unused or stale local variables**

Check whether `--fb-blue` is used:

```bash
rg -n -- '--fb-blue' assets/css/football.css
```

If only declared and never consumed, delete both declarations.

- [x] **Step 3: Replace obvious football text/line/surface/accent literals**

Use these mappings unless visual inspection says otherwise:

```text
#8A8A7A -> var(--text-mid)
#535146 -> var(--text)
#6e6d68 -> var(--text-mid)
#dad9d4 -> var(--line)
#ede9de / #e9e6dc -> var(--map-fill) / var(--map-fill-hover)
#4A4A46 -> var(--line)
rgba(58, 58, 54, alpha) -> color-mix(in oklch, var(--line) <alpha-equivalent>, transparent) or var(--line) for borders
rgba(194, 192, 182, alpha) -> color-mix(in oklch, var(--text-hi) <alpha-equivalent>, transparent)
rgba(120, 188, 152, alpha) -> color-mix(in oklch, var(--accent-cool) <alpha-equivalent>, transparent)
rgba(77, 184, 255, 0.08) / rgba(97, 170, 242, 0.06) -> replace with a warm/cool token tint or keep only if the blue photographic contrast is intentional
```

- [x] **Step 4: Verify football page colors in all three theme states**

Run grep:

```bash
rg -n -e '#[0-9A-Fa-f]{3,8}\\b' -e 'rgba?\\(' assets/css/football.css assets/js/footballmap.js
git diff --check
```

If a dev server is available, visually verify:

```bash
/Users/hong/.rbenv/versions/3.3.7/bin/bundle exec jekyll serve --livereload
```

Open:

```text
http://127.0.0.1:4000/football/
```

Check default/dark and light mode for:

```text
card contrast, map state contrast, marker hover, tooltip contrast, lightbox close button, no vanished labels
```

- [x] **Step 5: Commit**

```bash
git add assets/css/football.css assets/js/footballmap.js
git commit -m "style(football): align page colors with theme tokens"
```

## Task 5: Data and Vendored/Generated Boundary

**Files:**
- Inspect: `_data/venues.yml`
- Inspect: `assets/js/bootstrap.bundle.min.js.map`
- Inspect: syntax/vendor/search assets excluded from the core audit

- [x] **Step 1: Decide whether `_data/venues.yml` colors are content or UI tokens**

If venue colors are content metadata used by a rendered component, either:

```yaml
color_token: "--accent-cool"
```

or keep the literal with a comment explaining that venue colors are content data, not theme chrome.

- [x] **Step 2: Remove generated sourcemap from core audit**

Do not edit `assets/js/bootstrap.bundle.min.js.map`; it is generated/vendor metadata.

- [x] **Step 3: Document exclusions**

Add a short comment to the audit script/checklist in the plan review section, not to the codebase, unless a future automation is added.

## Task 6: Final Audit and Visual Verification

**Files:**
- Modify: this plan file’s Review section after execution.
- Optional modify: `.claude/HANDOVER.md` only if the cleanup is pushed to main.

- [x] **Step 1: Rerun the core literal count**

Run the audit command from the top of this plan.

Target:

```text
Core UI color literals outside token files: below 40
```

Acceptable remaining literals:

```text
intentional shadows/scrims, SVG/vendor strokes, content-data colors, syntax/Jupyter/search/vendor assets, token source definitions
```

- [x] **Step 2: Run syntax checks**

Run:

```bash
node --check assets/js/talkmap.js
node --check assets/js/research.js
node --check assets/js/footballmap.js
git diff --check
```

Expected: all commands exit 0.

- [x] **Step 3: Run Jekyll build if Ruby toolchain is available**

Run:

```bash
/Users/hong/.rbenv/versions/3.3.7/bin/bundle exec jekyll build
```

Expected: exit 0. If the path is missing, record the Ruby/Bundler blocker and do not claim full build verification.

- [x] **Step 4: Browser visual pass**

Verify these routes in dark and light mode:

```text
/
/talks/
/football/
/publications/
/services/
/dev/colors/
```

Check:

```text
no invisible tertiary labels, map states still legible, dots and badges use intended accent colors, hover states remain visible, dropdowns retain contrast, inline code remains terracotta, Color Lab still displays correct token values
```

- [x] **Step 5: Commit review notes**

Update the Review section below with final counts, verification commands, and any intentional remaining literals.

## Follow-up Hardening Pass: Preview, Audit Script, Ruby Config, Sass Warnings

**Goal:** Make future color changes safer to preview, easier to audit, and easier to verify locally.

**Architecture:** Keep the Color Lab as a self-contained Jekyll dev page, add a small reusable audit script under `scripts/`, align local Ruby config/docs with the installed Ruby 3.3.11 toolchain, and convert the root icon-library includes in `assets/css/main.scss` from root-level `@import` to module-system `@use`. Leave vendored icon internals intact; `_config.yml` already sets `sass.quiet_deps: true`, so dependency-level deprecations are quiet while root stylesheet deprecations are removed.

**Tech Stack:** Jekyll, SCSS/Sass module system, vanilla JS, Python 3 audit utility, rbenv Ruby 3.3.11.

### Follow-up Plan Audit Round 1

- **Coverage check:** The four requested items are covered by Tasks 7-10: component impact previews, reusable color audit, Ruby config/docs alignment, and Sass root import cleanup.
- **Design check:** The preview feature should remain a working tool, not a marketing explanation. Use compact component replicas on the same page; avoid iframes for this pass because iframe override injection would add fragile cross-document state.
- **Verification check:** The plan includes browser checks for changed Color Lab behavior, script checks for audit output, and Jekyll build checks for Sass/Ruby changes.

### Follow-up Plan Audit Round 2

- **Sass risk:** Directly migrating Font Awesome internals would touch many vendored files and introduce risk. The lower-risk approach is to replace only root-level imports in `assets/css/main.scss` with `@use`, relying on existing `quiet_deps` for vendored internals. A scratch compile confirmed this compiles quietly with `quiet_deps: true`.
- **Ruby risk:** Adding `.ruby-version` is useful, but updating GitHub Actions to Ruby 3.3.11 would change deployment behavior. Keep CI/deploy workflows unchanged unless a later task explicitly targets remote build parity.
- **Audit-script risk:** The script must distinguish site-owned UI from token source, generated files, vendor assets, syntax/Jupyter CSS, and content data. It should fail only on site-owned UI literals by default.

### Follow-up Plan Audit Round 3

- **Accessibility/responsiveness:** New Color Lab previews need stable dimensions, no overlapping labels, and meaningful `aria-label`s for map/cluster samples.
- **Regression guard:** `scripts/audit_colors.py` should report counts and optionally fail with `--strict`; the final verification should run `--strict` so drift is caught.
- **Scope control:** Do not tokenize `_data/venues.yml` in this pass. It remains content metadata unless a future publications/bibliography task makes those badges part of the current public UI.

## Task 7: Color Lab Component Impact Previews

**Files:**
- Modify: `_pages/dev-colors.md`

- [x] **Step 1: Add preview styles**

Add compact component-preview CSS for:

```text
.cl-impact-grid
.cl-impact-card
.cl-talk-dot / .cl-talk-dot--upcoming / .cl-talk-cluster
.cl-status-badge
.cl-impact-section-label
.cl-inline-demo
.cl-map-component
.cl-dropdown-demo
```

These previews must use existing theme tokens only, with no new color literals.

- [x] **Step 2: Add preview markup**

Add a new Color Lab section titled `Component impact previews` after the semantic section and before utility tokens. The section should include:

```text
--accent-cool: talks regular dots, status badges, section labels
--accent-warm: upcoming talk dots/clusters, hover stripes, inline links/code
--surface / --surface-raised / --line: dropdown/card/list surfaces
--map-fill / --map-fill-hover / --map-label: map-state samples
```

- [x] **Step 3: Highlight affected preview cards while editing**

Add `data-token-impact` attributes to preview cards and extend the input handler so editing a token briefly applies `.is-active` to matching cards.

- [x] **Step 4: Verify Color Lab behavior**

Run browser QA on `/dev/colors/`:

```text
change --accent-cool to #123456, confirm cool preview cards highlight and rendered cool samples compute to rgb(18, 52, 86)
change --accent-warm to #654321, confirm warm preview cards highlight and rendered warm samples compute to rgb(101, 67, 33)
reset overrides, confirm --accent-cool returns #00a060 and --accent-warm returns #cc7d5e
```

## Task 8: Reusable Color Audit Script

**Files:**
- Create: `scripts/audit_colors.py`

- [x] **Step 1: Create the script**

The script should:

```text
scan site-owned UI paths
ignore generated/vendor/search/Jupyter/icon-library assets
ignore token-source files (`_sass/_themes.scss`, `_sass/_variables.scss`)
ignore content-data colors such as `_data/venues.yml`
ignore the Color Lab functional fallback `COLOR_INPUT_FALLBACK = '#000000'`
print per-file findings and `TOTAL_SITE_OWNED_UI <n>`
exit 1 only when `--strict` is passed and `<n> > 0`
```

- [x] **Step 2: Verify strict audit**

Run:

```bash
python3 scripts/audit_colors.py --strict
```

Expected: `TOTAL_SITE_OWNED_UI 0` and exit 0.

## Task 9: Ruby 3.3.11 Local Config and Agent Docs

**Files:**
- Create: `.ruby-version`
- Modify: `.claude/CLAUDE.md`
- Modify: `.claude/launch.json`

- [x] **Step 1: Add `.ruby-version`**

Create `.ruby-version` with:

```text
3.3.11
```

- [x] **Step 2: Update local agent docs and launch config**

Replace local references to `/Users/hong/.rbenv/versions/3.3.7/bin/bundle` with:

```text
RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_
```

For `.claude/launch.json`, set `runtimeExecutable` to:

```text
/opt/homebrew/bin/rbenv
```

and set args so the command runs `exec bundle _2.5.18_ exec jekyll serve --livereload --port 4000`.

- [x] **Step 3: Verify Ruby config**

Run:

```bash
RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec ruby -v
RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_ -v
```

Expected: Ruby 3.3.11 and Bundler 2.5.18.

## Task 10: Root Sass Import Warning Cleanup

**Files:**
- Modify: `assets/css/main.scss`

- [x] **Step 1: Replace root icon imports with `@use`**

Replace the root-level icon-library `@import` block with:

```scss
@use "font-awesome/fontawesome";
@use "font-awesome/brands";
@use "font-awesome/solid";
@use "font-awesome/regular";
@use "tabler-icons/tabler-icons" as tabler-icons with (
  $ti-font-path: "../fonts",
  $ti-font-display: swap
);
@use "tabler-icons/tabler-icons-filled" as tabler-icons-filled with (
  $ti-font-path: "../fonts",
  $ti-font-display: swap
);
@use "tabler-icons/tabler-icons-outline" as tabler-icons-outline with (
  $ti-font-path: "../fonts",
  $ti-font-display: swap
);
```

Remove the now-unused `$ti-font-path`, `$ti-font-display`, and `$fa-font-path` global declarations.

- [x] **Step 2: Verify the build has no root Sass `@import` warning**

Run:

```bash
RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_ exec jekyll build
```

Expected: build exit 0. The previous warnings pointing at `assets/css/main.scss` lines for Font Awesome/Tabler `@import` should be gone.

## Task 11: Final Test and QA

**Files:**
- Modify: this plan file’s Review section.

- [x] **Step 1: Run static verification**

Run:

```bash
python3 scripts/audit_colors.py --strict
node --check assets/js/talkmap.js
node --check assets/js/research.js
node --check assets/js/footballmap.js
git diff --check
```

Expected: all exit 0.

- [x] **Step 2: Run Jekyll build**

Run:

```bash
RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_ exec jekyll build
```

Expected: exit 0 with no root `@import` deprecation warnings from `assets/css/main.scss`.

- [x] **Step 3: Browser QA**

Start:

```bash
RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_ exec jekyll serve --livereload --host 127.0.0.1 --port 4000
```

Verify:

```text
/dev/colors/ component previews update and highlight
/talks/ map dots still use accent-cool/accent-warm
/football/ map and marker frame still render
/publications/ and /services/ still render tokenized badges/rows
```

- [x] **Step 4: Commit**

Commit the implementation if all verification passes.

## Review

Executed on branch `codex/color-token-cleanup`.

Final outcome:
- Added shared utility tokens in `_sass/_themes.scss`: `--shadow-soft`, `--shadow-medium`, `--overlay-scrim`, `--surface-overlay`, `--map-fill`, `--map-fill-hover`, and `--map-label`.
- Tokenized talks/map colors, shared UI files, football page colors, and one Distill text literal.
- Final site-owned UI literal audit: `TOTAL_SITE_OWNED_UI 0`, excluding token source files, vendored/bundled assets, generated/dev tooling, and content data.
- Intentional remaining non-token literals: `_data/venues.yml` stores data/content colors; `_sass/font-awesome/_variables.scss` keeps Font Awesome vendor defaults.

Verification performed:
- `node --check assets/js/talkmap.js`
- `node --check assets/js/research.js`
- `node --check assets/js/footballmap.js`
- Refined Python audit for site-owned UI files returned `TOTAL_SITE_OWNED_UI 0`.

Build/visual QA status:
- Ruby 3.3.11 was installed via Homebrew `rbenv`/`ruby-build` because Ruby 3.3.7 was not available in the current `ruby-build` definitions.
- Bundler 2.5.18 installed successfully under Ruby 3.3.11 and `bundle install` completed.
- `RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_ exec jekyll build` completed successfully.
- Build warnings only: the existing pagination warning and Dart Sass `@import` deprecation warnings for Font Awesome/Tabler imports.
- Browser visual QA completed on `http://127.0.0.1:4000` for `/`, `/talks/`, `/football/`, `/publications/`, `/services/`, and `/dev/colors/`.
- Dark-mode checks were repeated for `/dev/colors/`, `/talks/`, and `/football/`; the talks map dots resolved to `--accent-cool` / `--accent-warm`, and football map surfaces/markers rendered through the shared map/surface variables.

Follow-up audit including `/dev/colors/`:
- Tokenized the Color Lab dialog backdrop to `--overlay-scrim`.
- Added preview-only Color Lab coverage for derived utility tokens: `--shadow-soft`, `--shadow-medium`, `--surface-overlay`, `--overlay-scrim`, `--map-fill`, `--map-fill-hover`, and `--map-label`.
- Confirmed `--accent-cool` remains an editable live token and resolves from `_sass/_themes.scss`, where it is currently `#00a060`.
- Final audit including `/dev/colors/`: `TOTAL_SITE_OWNED_UI_EXCLUDING_FUNCTIONAL_FALLBACK 0`.
- Remaining `/dev/colors/` literal: one intentional `COLOR_INPUT_FALLBACK = '#000000'` for the browser color input when a computed value is missing or unparsable.

Follow-up hardening pass:
- Added Color Lab component-impact previews for `--accent-cool`, `--accent-warm`, surface/line tokens, and map-derived tokens. Editing a token briefly highlights the affected preview cards.
- Added `scripts/audit_colors.py --strict`; final result: `TOTAL_SITE_OWNED_UI 0`.
- Added `.ruby-version` with Ruby 3.3.11 and updated `.claude/CLAUDE.md` plus `.claude/launch.json` to use Homebrew rbenv and Bundler 2.5.18.
- Replaced root-level icon-library imports in `assets/css/main.scss` with Sass `@use`. Build output no longer shows the previous root `@import` warnings from `assets/css/main.scss`; the existing pagination warning remains.

Follow-up verification:
- `python3 scripts/audit_colors.py --strict`
- `python3 -m json.tool .claude/launch.json`
- `RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec ruby -v`
- `RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_ -v`
- `node --check assets/js/talkmap.js`
- `node --check assets/js/research.js`
- `node --check assets/js/footballmap.js`
- `git diff --check`
- `RBENV_VERSION=3.3.11 /opt/homebrew/bin/rbenv exec bundle _2.5.18_ exec jekyll build`
- Browser QA on `/dev/colors/`, `/talks/`, `/football/`, `/publications/`, and `/services/`.
