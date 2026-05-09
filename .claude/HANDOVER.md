# Session Handover

> Updated at the end of each session. New sessions should read this first.

---

## 2026-05-09 — Session 10 (latest)

### Goal
Investigate user bug report — "school logos not showing in /talks/, except Rochester and Lehigh, since session 9's WebP commit." Find the root cause, fix it properly (no quick revert), and extend the fix to the football page where the same WebP-vs-PNG asymmetry was bleeding bandwidth on stadium thumbnails.

### What was done

**Bug diagnosis** (no commit — investigation only)
- The dd7385f `<picture>` markup added `<source srcset="…-480.webp" type="image/webp">` per logo. With WebP support universal, browsers commit to that source; if its URL 404s, the `<img>` fallback does **not** trigger (fallback is only for `type` mismatch, not network errors).
- `git ls-tree origin/gh-pages | grep talk-logos.*webp` returned exactly one file (Rochester, the committed source). The deploy workflow's `jekyll-imagemagick` step was failing silently every run: `sh: 1: magick: not found`. The plugin called the v7 binary `magick`; Ubuntu's `imagemagick` apt package ships v6 (`convert`). The custom `_plugins/imagemagick_fix.rb` monkey-patch hardcoded `magick` too. So zero `-480.webp` variants ever reached production — the perf optimization never landed, only the markup change did.
- Why Rochester + Lehigh worked: Rochester's source IS already `.webp` (committed). Lehigh + 3 others are SVG; the Liquid `replace` chain didn't change SVG paths, so the source URL was the SVG itself, which browsers fetch and render even though the declared `type` is `image/webp` (browser sniffs content). All PNG/JPG/JPEG-sourced logos broke.

**Quick mitigation considered then rejected**: a one-line revert of the `<picture>` wrapper would restore live logos but lose the perf intent, and the broken-CI infrastructure would still pollute every deploy log.

**Commit 1 — Talk logos at 256px + drop jekyll-imagemagick** (`2624775`, `perf(images): commit talk-logo WebPs at 256px, drop jekyll-imagemagick`)
- Generated 160 sibling WebP files locally with `magick "$f" -resize 256x256 -quality 85 "${f%.*}.webp"` over PNG/JPG/JPEG in `assets/img/talk-logos/`. Total: ~1.23 MB committed to source.
- 256px chosen as the single shared variant covering both pages: talks-page logos render at ~19.5 CSS px (3× DPR = 60px source needed), football team-card logos render at 120px (3× DPR = 360px ideal, but 256/120 = 2.13× still acceptable for retina). Avoids per-page-specific variants.
- Re-added `<picture>` markup with extension-aware Liquid in `_includes/talks_render.html` and `_pages/football.md`: PNG/JPG/JPEG get `<source>`, SVG and `.webp` sources render as plain `<img>`.
- Football SVG `<image>` map markers swap PNG→WebP directly in the Liquid JSON generation at `_pages/football.md:49` (SVG `<image>` doesn't accept `<picture>`, so direct path swap). Verified all 20 markers load `.webp` after the change.
- **Removed jekyll-imagemagick infrastructure entirely**: gem from `Gemfile`, plugin entry from `_config.yml` plugins list, the entire `imagemagick:` config block from `_config.yml`, the custom `_plugins/imagemagick_fix.rb` monkey-patch, and both imagemagick steps from `.github/workflows/deploy.yml` (apt-cache-pkgs step + `_site/assets/img` cache step).
- 167 files changed: 160 new WebPs, 6 modified template/config/workflow files, 1 deleted plugin, +23 −72 lines on the non-image files.

**Commit 2 — Stadium thumbnails at 800px via `<picture>` in JS** (`b0da3fb`, `perf(images): add 800px stadium WebPs and serve via <picture> in tooltips`)
- Generated 20 sibling WebP files with `magick "$f" -resize 800x800 -quality 82 "${f%.*}.webp"` over the JPG/PNG sources in `assets/img/football/stadiums/`. Total: ~1.78 MB committed. Largest individual: Sanford 174 KB; average ~93 KB.
- 800px chosen for tooltip rendering (~280×146 CSS px) — covers 3× DPR plus headroom; lightbox click-through still uses the original full-quality JPG/PNG (separate optimization, deferred).
- Updated `assets/js/footballmap.js:428-432` `buildTooltip()`: the JS template literal that emits the `.fb-tip-photo` markup now wraps the `<img>` in `<picture>` with a WebP `<source>`. Path derived via `entry.stadium_image.replace(/\.(jpe?g|png)$/i, '.webp')`.
- Verified by triggering a marker `mouseenter` event in the running browser: tooltip renders, `<picture>` element present, `currentSrc` ends in `.webp`, `naturalWidth=800`, JPG fallback path correct.

### Current status

- **Done**: Both commits land locally. All visible images verified rendering via WebP at the right sizes. Build clean (~1.2s) — no more imagemagick "Generating image" output, no `magick: not found` errors in deploy logs once pushed.
- **In progress**: nothing.
- **Pending**: Push to `origin/main`. Then verify on live `kevinhong.ai`:
  1. `curl -I https://kevinhong.ai/assets/img/talk-logos/fbs-library/South_Florida_Bulls_logo-300x300.webp` returns 200 (was 404).
  2. Visual check on /talks/ — all 50 logos visible (was: only Rochester + 3 SVGs).
  3. Visual check on /football/ — map markers, team-cards, and stadium tooltips all loading WebP.

### Important context

- **The previous session 9 commit message ("Verified at 1280x900: 50 picture elements, all with currentSrc ending in -480.webp, zero PNGs served. Visual rendering identical.") was true locally but false in production**, because the local `_site/` had imagemagick-generated WebPs (working `magick` binary) but CI's `_site/` had none (broken plugin). The verification script never tested the deployed gh-pages tree. **Lesson for future perf commits touching build-time-generated assets**: verify against `git ls-tree origin/gh-pages` or `curl -I` against the live URL, not just the local dev server.
- **`<picture>` fallback semantics gotcha**: when a browser supports the `<source>` `type`, it commits to that source. Network errors do NOT trigger the `<img>` fallback — only `type` non-support does. So `<picture>` is fragile against missing-but-claimed-existing variants. The fix is to *guarantee* the variants exist (e.g., commit them to source) rather than rely on graceful degradation.
- **The 256px / 800px sizing decisions** are conservative — could go lower (96px talks, 600px stadium) for ~50% more byte savings, but 256/800 leave headroom for layout changes and provide insurance against any DPR weirdness on future devices.
- **Lightbox click-through on stadiums is intentionally still loading the original JPG/PNG**, not the 800px WebP. That's the right call: lightbox can hit 1100px CSS-wide, and the click-through is opt-in (rare interaction). If lightbox bandwidth becomes a concern later, generate `-1400.webp` variants and update the click-handler URL.
- **Local imagemagick installation is at `/opt/homebrew/bin/magick` (v7.1.2-16)**. The repo no longer depends on it for build, but if anyone ever wants to regenerate WebPs (e.g., new logos added), the one-liner is in commit 1's body.
- **AGENTS.md still untracked.** Same as previous sessions.
- **Player headshots in `assets/img/football/players/` are already `.webp`** at source (3 files); no work needed there.

### Decisions already made

- **256px single variant for talk logos** (not multi-size srcset, not separate small/large for talks vs football). Simpler markup, ~1.2 MB repo cost vs ~400 KB for 96px-only or ~2 MB for two variants. Bandwidth headroom for 3× DPR on football's 120px cards.
- **800px single variant for stadium thumbnails** (not multi-size). Tooltips render at one size; no responsive breakpoints in the JS template.
- **Quality 85 for talk-logos, 82 for stadiums.** Stadium photos are photographic content where -3 quality is invisible; logos are line-art and benefit from the cleaner edges.
- **Strip the imagemagick build pipeline entirely** rather than fixing the v6/v7 binary mismatch in CI. The pipeline was generating dead bytes (no markup ever referenced multi-width variants) and adding ~30s + brittleness to every deploy. Pre-generating and committing is simpler and deterministic.
- **Lightbox click-through stays on original JPG/PNG.** Out of scope for "thumbnail tooltip optimization." Documented as a future option.
- **No README/docs update.** The build setup is materially simpler now (no imagemagick, no monkey-patch); future maintainers reading the Gemfile + workflow file will see exactly what's needed. If new logos are added, follow the one-liner pattern.

### Next best step

- **Primary action**: After deploy, on `kevinhong.ai`:
  1. `curl -sI https://kevinhong.ai/assets/img/talk-logos/fbs-library/South_Florida_Bulls_logo-300x300.webp` → 200.
  2. `curl -sI https://kevinhong.ai/assets/img/football/stadiums/lane-stadium.webp` → 200.
  3. Visual: /talks/ all 50 logos visible; /football/ map markers + 3 team-card logos visible; click a school marker, tooltip shows stadium photo loading via WebP (DevTools Network filter `webp`).
  4. Confirm GitHub Actions deploy log no longer contains `magick: not found` lines.
- **Next-set queue (carried from session 9)**:
  - **Tier 2 left**: T2.6 lede deck, T2.7 awards `<details>`, T2.9 promote working papers in nav.
  - **Tier 3 left**: T3.11 jQuery/Bootstrap-bundle replacement (~100 KB cut, biggest remaining perf lever), T3.13 earn the green Currently dot, T3.14 football×talks crosslink.
  - **Tier 4 left**: T4.17 OG/Twitter card meta, T4.19 Bootstrap utility-only build (pairs with T3.11), T4.20 last-updated stamp.
  - **From session 8 audit**: F1 dark-mode `--text-lo` contrast bump, F2 services special-issue date column.
  - **External deadline (still)**: vendored font-awesome + tabler-icons Sass migration before Dart Sass 3.0.
- **If stadium lightbox bandwidth becomes a concern later**: generate `-1400.webp` for full-quality view, update `photoHref` derivation in `footballmap.js:425` to swap to webp.

---

## 2026-05-08 — Session 9

### Goal
Implement four perf items from the original session-6 audit's `/optimize` lens: serve talk logos as WebP via `<picture>` (#1), set tabler-icons `font-display: swap` (#2), preload Cormorant Garamond + Geist for LCP (#3), and audit GitHub Pages cache headers (#4). Plan, audit-the-plan, implement, verify, ship.

### What was done

**Plan + plan-audit** (`.claude/plans/2026-05-08_perf-fonts-and-images.md`)
- Wrote a structured plan covering all four items with rationale, file paths, risks, and verification checklist.
- Honest framing of #4: GitHub Pages serves a hard-coded `cache-control: max-age=14400` (4 hours, confirmed via `curl -I` on production); per-file rules aren't possible on GH Pages. Documented as not actionable, included infrastructure notes for future consideration.
- Self-critique caught: the `bust_file_cache` filter would have caused double-fetching of preloaded fonts (the @font-face URLs in compiled CSS don't have the cache-bust query string, so a preload URL with `?<md5>` would not match → browser fetches twice). Plan revised to use bare URLs for preloads.

**#1 — Talk logos PNG → WebP via `<picture>`** (commit `dd7385f`, `perf: …`)
- `_includes/talks_render.html`: wrapped each `<img src="{{ talk.logo }}">` in a `<picture>` with a WebP `<source>` pointing at the build-generated `-480.webp` variant (handles `.png`, `.jpg`, `.jpeg` source extensions).
- Added explicit `width="48" height="48"` to prevent CLS as lazy-loaded logos paint.
- Verified end-to-end: 50 picture elements, all `currentSrc` end in `-480.webp`, zero PNGs served. The Jekyll build was already producing the WebP variants — they were just being ignored by the markup.

**#2 — Tabler-icons `font-display: swap`** (commit `8aa575a`, `perf: …`)
- `assets/css/main.scss`: added `$ti-font-display: swap;` before the legacy `@import` block. The vendored partials use `$ti-font-display: null !default;` so a pre-set value in the importing scope wins.
- Compiled CSS `font-display` count went from 12 swap (Geist 7 + Cormorant/Instrument/SpaceGrotesk 5) to 15 swap (+ 3 from tabler outline / filled / base). The 3 remaining `font-display: block` declarations are font-awesome, which is intentional for icon fonts.

**#3 — Preload Cormorant Garamond + Geist** (commit `d95ef16`, `perf: …`)
- `_includes/head.liquid`: added two `<link rel="preload" as="font" type="font/woff2" crossorigin>` directives at the very top of `<head>`, before the bootstrap.min.css link. URLs match the `@font-face` declarations in `_sass/_geist.scss` and `_sass/_fonts.scss` exactly.
- Verified: 2 preload links present at desktop AND mobile; no "preloaded but not used" console warning (which would indicate URL mismatch); Cormorant Garamond resolves correctly in H1 computed styles, Geist in body.

**#4 — GitHub Pages cache headers (documented, not implemented)**
- `curl -I https://kevinhong.ai/assets/css/main.css` returns `cache-control: max-age=14400` (4h), `expires: <4h from now>`, weak `etag` for revalidation, and `last-modified`.
- Per-file cache rules are NOT supported on GitHub Pages — there is no `_headers` file mechanism (that's Netlify/Cloudflare).
- For longer cache TTL on hashed assets (the typical "1 year for hashed, short for HTML" pattern), would need to either front GH Pages with Cloudflare and override at the edge, or migrate to Netlify/Vercel. **Not worth doing today** — 4h + ETag is fine for an academic personal site; revisit if traffic patterns change.

### Current status

- **Done**: Three code commits made; all four plan items complete or documented. Build passes. Visual sweep across `/`, `/talks/`, `/publications/` in dark theme confirms identical rendering. All previous-session wins (sessions 6 + 7 + 8) intact: no MathJax/polyfill/MDB/Material-Icons, theme aria-label, skip link, homepage tag canonicalized, `[citations]` log gone, profile srcset, title-case filter chips, top-level Sass migration.
- **In progress**: nothing.
- **Pending**: push to `origin/main` + `gh-pages` rebuild + deploy verification.

### Important context

- **Preload URLs are deliberately bare** (no `bust_file_cache`). This is correct, not an oversight: the @font-face URLs in compiled CSS use static paths, so a hashed preload URL would mismatch and trigger a double fetch. If a font file ever changes, the preload URL needs manual update — but variable woff2 files are immutable in practice (versioned by package).
- **Talk logos use `-480.webp` only** (not a multi-width srcset). Logos render at ~48 CSS px in the timeline cards; even DPR 3 mobile only needs ~144px. The `-480.webp` variant covers all DPRs without extra HTML weight. The build produces `-800.webp` and `-1400.webp` too but they're not currently used — kept available for future high-density scenarios.
- **Why not also fix font-awesome's font-display:** it requires modifying vendored partials (FA 6 free's `_variables.scss` doesn't expose a `$fa-font-display` knob). Lower-impact than tabler-icons because FA isn't used in the visible nav. Defer with the rest of the vendor migration.
- **GitHub Pages 4h cache TTL is the floor for any asset improvement on this hosting.** If LCP becomes critical for return visitors, switching infrastructure is the next lever — but it's a structural change, not a code change.
- ImageMagick errors for `assets/img/football/players/{arch-manning,malachi-toney}.jpg` remain pre-existing.
- `AGENTS.md` still untracked.

### Decisions already made

- **Preload only Cormorant Garamond and Geist** (not Geist Mono, Cormorant italic, Space Grotesk, Instrument Sans). Those are below-the-fold or specialized; preloading too many fonts wastes bandwidth and competes with critical resources.
- **Single `-480.webp` source on talk logos**, not srcset. Visual size doesn't justify multi-width.
- **No `bust_file_cache` on preload URLs.** Avoids URL mismatch with @font-face. Tradeoff: font URL must be updated manually if the file changes.
- **`$ti-font-display: swap` not `block` or `optional`.** swap is the right balance for icon fonts that pair with rendered text — text never blocks, icon swaps in when ready. `block` (FOIT) is what the implicit default was; `optional` would skip the icon entirely if not cached, which is too aggressive for the theme toggle.
- **GH Pages cache is acceptable as-is.** Documented; not migrating infrastructure.

### Next best step

- **Primary action**: After deploy, on the live site:
  1. DevTools Network on `/`: confirm Cormorant Garamond and Geist Variable woff2 fetches happen high in the request waterfall (priority high, parallel with main.css). Check that there's NO "preload but not used" warning.
  2. DevTools Network on `/talks/`: confirm at least one `-480.webp` request (ideally many). Confirm no `*-300x300.png` requests for FBS logos that have WebP variants.
  3. Run Lighthouse on `/`: "Preload key requests" recommendation should be gone or significantly reduced. LCP score should improve (cold-cache).
- **Next-set queue**:
  - **Tier 2 left**: T2.6 lede deck, T2.7 awards `<details>`, T2.9 promote working papers in nav.
  - **Tier 3 left**: T3.11 jQuery/Bootstrap-bundle replacement (~100KB cut, biggest remaining perf lever), T3.13 earn the green Currently dot, T3.14 football×talks crosslink.
  - **Tier 4 left**: T4.17 OG/Twitter card meta, T4.19 Bootstrap utility-only build (pairs with T3.11), T4.20 last-updated stamp.
  - **From session 8 audit**: F1 dark-mode `--text-lo` contrast bump, F2 services special-issue date column.
  - **External deadline (still)**: vendored font-awesome + tabler-icons Sass migration before Dart Sass 3.0.

---

## 2026-05-08 — Session 8

### Goal
Implement six items from across Tier 2/3/4: title-case the publications filter chips (T2.8), generate a profile-photo srcset (T2.10), migrate top-level Sass partials from `@import` to `@use` (T3.12), verify the typewriter localStorage gate (T3.15), audit the services + working pages (T4.16), and add a Browserslist config (T4.18). Plan, audit-the-plan, implement, verify, ship.

### What was done

**Plan + plan-audit** (`.claude/plans/2026-05-08_tier-2-3-4-bundle.md`)
- Wrote a structured plan covering all six items: rationale, file paths, risks, verification checklist, plan-self-critique, rollback, commit strategy.
- Self-critique caught: Sass scope creep on font-awesome internals (deferred); the `$max-content-width` Liquid templating constraint (`@use ... with (...)` is the right pattern); cwebp quality matched to existing 800px effective quality; T2.8 selector isolation (only `.filter-btn`, not the other 10 `text-transform: uppercase` rules); T3.15 confirmed read-only verification unless broken; T4.16 hard-capped at 15 minutes total of inline fixes.

**T4.18 — Browserslist** (commit `9af524e`, `chore: …`)
- New `.browserslistrc` at repo root with `last 2 chrome versions / last 2 safari versions / last 2 firefox versions / last 2 edge versions / not dead`. No tool currently consumes it; preventative for future build chain.

**T2.8 — Title-case filter chips** (commit `f9638f3`, `style: …`)
- `assets/css/research.css` `.filter-btn`: removed `text-transform: uppercase`; reduced `letter-spacing` from `0.1em` to `0.01em`; bumped `font-weight: 400 → 500` and `font-size: 0.8rem → 0.85rem` to compensate for lost uppercase weight.
- Verified other UPPERCASE rules (eyebrows like "39 RESULTS", `.pub-results-count`, "TIMELINE" view-toggle) are unchanged — they use different selectors.

**T3.15 — Typewriter localStorage gate verification** (no commit — code already correct)
- Verified all three states via runtime test:
  1. **Cleared localStorage** → `run()` runs, animates, writes timestamp.
  2. **Within 24h TTL** → `showStatic()` runs, no animation.
  3. **Expired (>24h)** → `run()` runs again, refreshes timestamp.
- Robust verification: set timestamp 30h ago, reload, wait 12s, confirm timestamp got refreshed (`runExecuted: true`). Gate works as designed; documented finding.

**T2.10 — Profile photo srcset** (commit `097369a`, `perf: …`)
- Generated `assets/img/prof_pic-home-300.webp` (7.2KB) and `prof_pic-home-600.webp` (24KB) from the JPEG source via `cwebp -q 82 -resize`.
- Updated `_layouts/about.liquid` `<picture><source>` to emit a 3-width `srcset` (300w/600w/800w) plus `sizes="(max-width: 768px) 220px, 268px"`.
- Verified at 375×812 mobile (DPR 1): browser pulls the 300w variant (`currentSrc` confirmed). 87% byte reduction vs the previous 800px-only file at this viewport.

**T3.12 — Sass `@import` → `@use` migration (top-level partials)** (commit `c0dead7`, `build: …`)
- `_sass/_variables.scss`: added `!default` to `$max-content-width` so main.scss can override.
- 5 partials that reference variables (`_themes`, `_base`, `_layout`, `_fonts`, `_geist`) each get `@use "variables" as *;` prepended.
- `assets/css/main.scss` rewritten:
  - `@use "variables" with ($max-content-width: {{ site.max_width }})` configures the module from Liquid.
  - Each top-level partial loaded via `@use` instead of `@import`. `_dropdown` stays last to preserve cascade order.
  - **Crucial fix:** vendored font-awesome and tabler-icons partials still use `@import` and reference `$fa-font-path` / `$ti-font-path` from the global scope. With `@use`, `_variables.scss`'s vars are namespaced, not global. Re-declared `$ti-font-path` and `$fa-font-path` at module scope **before** the legacy `@import` block so the vendored CSS resolves font URLs correctly.
- Build warnings dropped from 13+ to ~7 (only the font-awesome × 4 + tabler-icons × 3 vendor-internal warnings remain). The 11 top-level partials are clean.
- Visual sweep across `/`, `/publications/`, `/talks/`, `/services/`, `/football/`, `/working/` in both light and dark themes: identical rendering. Tabler-icon fonts return 200; theme toggle, skip link, mobile layout, and the new srcset all still work.

**T4.16 — Brand audit on /services/ and /working/** (no commit — findings only)
- Audited both pages at 1280×900 desktop and 375×812 mobile in both themes. No console errors. No horizontal overflow. All images carry alt text.
- Findings (none warranted inline fix):
  - **F1 (medium): dark-mode metadata text contrast borderline.** `--text-lo: #928d7f` on `#262624` bg ≈ 4.3:1 — fails WCAG AA Normal-text 4.5:1 by a hair. Affects services/working/publications metadata. Bumping to ~`#a8a394` would give ~5:1. **Deferred** — design call, alters the visual register of the entire site's "muted" text register.
  - **F2 (low): services special-issue editorships have no date column.** Inconsistent with the regular editorial appointments above which show year/range. Possibly intentional (timeless commitment).
  - **F3 (resolved): working-papers row appeared "highlighted".** Verified via `matches(':hover')` that this was just hover-state from the cursor's last position; not a feature, not a bug.
  - **F4 (low): working-papers has no filter/search.** Acceptable today (10 papers); revisit if it grows past ~20.

### Current status

- **Done**: All six items implemented (or verified). Five code commits, one verification-only result, one audit-only result with documented findings. Visual sweep across six pages in both themes confirms no regressions.
- **In progress**: nothing.
- **Pending**: push to `origin/main` + `gh-pages` rebuild + deploy verification.

### Important context

- **Sass migration is partial.** Top-level partials are on `@use`; vendored font-awesome and tabler-icons subdirectories still use internal `@import` chains. They emit ~7 deprecation warnings each build. They will hard-break under Dart Sass 3.0 unless the vendor packages are upgraded or replaced. Tracked in next-set queue.
- **Variable re-declaration in main.scss is intentional, not duplication.** `$ti-font-path` and `$fa-font-path` are declared at module-file scope inside main.scss because the `@use`d variables module namespaces them away from the legacy `@import`'d vendor partials. The vendored CSS reads them as global Sass variables. If `_variables.scss` ever changes those paths, both copies need updating until the vendor migration completes.
- **Profile photo `naturalWidth` reports 220 in the verification eval, not 300.** Suspected measurement quirk in the headless browser (CSS-rendered size leaking into the IDL property). The actual file IS 300×300 (`file` command confirmed), and `currentSrc` correctly resolves to the 300w URL. Not a bug.
- The `[2026-05-08 ...] ERROR Errno::ECONNRESET: Connection reset by peer` lines that appear in Webrick logs are stale browser connection drops during livereload — unrelated to any code change.
- `AGENTS.md` remains untracked (per session-5 decision).
- ImageMagick errors for `assets/img/football/players/{arch-manning,malachi-toney}.jpg` are still pre-existing (those files are HTML/JSON masquerading as `.jpg`).

### Decisions already made

- **Title-case filter chips, kept all-caps elsewhere.** Editorial sites use uppercase for short eyebrow labels (counters, taxonomic markers); filter chips are interactive nouns and read better in title case. Audit M3 fully addressed; not extended to other selectors.
- **`$max-content-width` exposed via `!default` + `with (...)`** instead of being moved out of `_variables.scss` or hard-coded. Preserves the `_config.yml site.max_width` Liquid binding.
- **Vendored font-awesome and tabler-icons NOT migrated.** Out of scope for this session — would require either upgrading those vendor libraries to module-system versions or refactoring the included files. Documented as a known remainder.
- **`--text-lo` contrast NOT bumped.** F1 finding is design-sensitive; deferred to a session where Kevin can weigh in.
- **No filter/search added to working-papers.** Premature with only 10 papers.

### Next best step

- **Primary action**: After deploy, on the live site:
  1. DevTools Network tab on `/`: confirm the homepage portrait pulls `prof_pic-home-300.webp` or `-600.webp` (NOT `-home.webp`) at the active DPR.
  2. Visit `/publications/` and confirm the filter chips render in title case ("All / Future of Work / …"), and the click-through filter still works.
  3. Sanity check: navigate through `/`, `/publications/`, `/talks/`, `/services/`, `/football/`, `/working/` — page background, fonts, theme toggle, mobile photo behavior, skip link should all work as before. The Sass migration should be invisible.
- **Next-set queue (Tier 2 / 3 / 4 remainder)**:
  - **Tier 2 left**: T2.6 promote lede sentence to a deck; T2.7 fold awards run-on into `<details>`; T2.9 promote `working papers` to top-level nav.
  - **Tier 3 left**: T3.11 replace jQuery + Bootstrap-bundle with vanilla nav (~100KB cut); T3.13 earn the green Currently dot via data file; T3.14 cross-link football map ↔ talks page.
  - **Tier 4 left**: T4.17 OG/Twitter card meta; T4.19 Bootstrap utility-only build (pairs with T3.11); T4.20 last-updated stamp in footer.
  - **From this session's audit**: F1 dark-mode `--text-lo` contrast bump (design call); F2 services special-issue date column (decide intentional vs gap).
  - **External-deadline cleanup**: vendored font-awesome + tabler-icons Sass migration when those libraries get module-system updates, OR replace with CSS-only variants before Dart Sass 3.0 ships.

---

## 2026-05-08 — Session 7

### Goal
Implement the four Tier-1 follow-ups the user picked from the session-6 audit: theme-toggle a11y, homepage tag canonicalization, skip-to-main-content link, and citations console-log cleanup. Plan, audit-the-plan, implement, verify, ship.

### What was done

**Plan + plan-audit** (`.claude/plans/2026-05-08_tier1-a11y-and-fixes.md`)
- Wrote a structured plan covering all four items: rationale, file paths, risks, verification checklist, rollback.
- Self-critiqued the plan and revised: rejected `aria-pressed` for the tri-state toggle (misleading semantics; used dynamic `aria-label` instead); split the toggle aria update into a small `updateToggleAria()` helper called from both `setThemeSetting` AND `DOMContentLoaded` (because the first `setThemeSetting` call runs synchronously in `<head>` before the button exists in the DOM); confirmed via `_sass/_layout.scss` that `body.fixed-top-nav` already has `padding-top: 56px`, so a `z-index: 10000` skip link sits cleanly above the navbar.

**Theme-toggle a11y + skip link** (commit `1190e33`, `a11y: …`)
- `_includes/header.liquid`: added `type="button"` + `aria-label="Theme"` to `<button id="light-toggle">`; added `aria-hidden="true"` to each of the three child `<i>` icons.
- `assets/js/theme.js`: introduced `updateToggleAria(themeSetting)` helper. Sets aria-label to `"Theme: system"` / `"Theme: dark"` / `"Theme: light"`. Null-safe (early-returns when `#light-toggle` doesn't exist yet). Called from `setThemeSetting` and from the `DOMContentLoaded` handler in `initTheme`.
- `_layouts/default.liquid`: added `<a class="skip-link" href="#main">Skip to main content</a>` as the very first thing in `<body>`; added `id="main" tabindex="-1"` to the existing main container.
- `_sass/_base.scss`: skip-link styles. `position: fixed` (so it stays anchored to the viewport regardless of scroll), `top: -3rem` off-screen, `top: 0.75rem` on `:focus` / `:focus-visible`, with the same warm-rust border + parchment/dark-bg as the rest of the brand. Verified visually in both themes.

**Homepage tag canonicalization** (commit `2398c53`, `fix: …`)
- `_pages/about.md`: bio chip `#Human-Algorithm Interactions` → `#Human-AI Interaction` (aligns with the canonical name in `_data/publications.yml` and the publications-page filter button).
- `assets/js/about.js`: `TOPIC_MAP` key updated to match. URL stays `/publications/#human-ai-interaction`.
- End-to-end verified: clicking the homepage chip navigates to `/publications/#human-ai-interaction`, the "Human-AI Interaction" filter button activates, and 5 of 39 papers are filtered.

**Citations log + idempotence guard** (commit `88cc6c6`, `chore: …`)
- `assets/js/research.js`: removed the `console.log('[citations] Applied …')` line in `applyCountsToDOM`. Added module-scope `let citationsApplied = false;` and an early-return at the top of `fetchCitations`. Counts still populate (verified: 39 `.pub-cite-count` spans rendered). `console.error` on fetch failure preserved.
- The audit's claim of "8x per visit" was wrong — `applyCountsToDOM` is called exactly once per page life. The 8 messages we saw were accumulated console state across multiple page navigations during the audit. Documented this in the plan and the commit.

### Current status

- **Done**: All four Tier-1 fixes implemented, three code commits made, all verified end-to-end via Jekyll preview at desktop+mobile in both light and dark themes. No console errors. No regressions to session-6 perf wins (mathjax/polyfill/altmetric/dimensions/MDB/Material Icons all still absent from the bundle). Tag click-through works to the filter.
- **In progress**: nothing.
- **Pending**: push to `origin/main` + `gh-pages` rebuild + deploy verification.

### Important context

- The `:focus` pseudo-class doesn't always update under programmatic `Element.focus()` in headless Chrome / CDP-driven script evaluation — known harness quirk. Verified the skip-link styles work via a forced-state demo screenshot in both themes; for real keyboard users pressing Tab, the pseudo-class will engage normally. If automated a11y tests are added later, `axe` or `pa11y` should be configured to use real keyboard simulation, not `.focus()`.
- `body.fixed-top-nav` in `_sass/_layout.scss:29` adds `padding-top: 56px` for the fixed navbar. The skip link's `position: fixed; z-index: 10000` rides above this when focused — no extra layout work needed.
- The publications page filter logic (`research.js:805-816 applyHashFilter`) slugifies button `data-filter` via `.toLowerCase().replace(/ /g, '-')`. So `/publications/#human-ai-interaction` already matched both the old and new chip text — the rename was purely about visible string consistency, not wiring.
- `AGENTS.md` is still untracked (per session-5 decision).
- ImageMagick errors during build for `assets/img/football/players/{arch-manning,malachi-toney}.jpg` are pre-existing (these files are HTML/JSON masquerading as `.jpg`); unrelated to this session.

### Decisions already made

- `aria-pressed` deliberately not added to the theme toggle — three states means binary toggle semantics don't fit; `aria-pressed="mixed"` is misleading. Dynamic `aria-label` is the WAI-ARIA Authoring Practices recommendation for tri-state cycles.
- aria-label kept terse (`"Theme: dark"`, not `"Theme: dark — press to switch to system"`). Verbose stateful labels hurt screen-reader UX more than they help.
- Skip link is `position: fixed`, not `absolute` — `absolute` made it scroll with the document, which would have left it inaccessible mid-scroll. Caught during plan-audit.
- Did **not** title-case the publications filter chips (audit M3) — out of scope for Tier 1; queued for the next pass.
- Did **not** also fix the audit's M5 ("earn the green dot" — link the ISR / Endowed Chair / Assoc. Dean labels in the Currently line) — also out of scope.

### Next best step

- **Primary action**: After deploy, on the live site:
  1. On a real laptop, hard-reload the homepage and press `Tab` once. Verify the "Skip to main content" pill appears in the top-left, focused. Press Enter — focus should jump past the nav to the main content.
  2. With a screen reader on (VoiceOver, NVDA, or Orca), focus the theme toggle and confirm it announces "Theme: system" / "Theme: dark" / "Theme: light" and updates as you press it.
  3. From the homepage, click the `#Human-AI Interaction` chip. URL should become `/publications/#human-ai-interaction`, the filter button should activate, and only matching papers should be visible.
  4. DevTools → Console on `/publications/`. Confirm zero `[citations] Applied …` log lines.
- **Next-set queue (Tier 1 remainder + Tier 2)**: from the session-6 audit, untouched items are: title-case publications filter chips (M3), promote `working papers` to top-level nav (audit recommendation H7 partial), tighten/fold the awards run-on with `<details>` (M1), promote the lede sentence to a deck (M6), smaller `prof_pic-home` srcset for mobile LCP (H2), Sass `@import` → `@use/@forward` migration (L1, getting urgent before Dart Sass 3.0), homepage footer affordances (H6 — explicitly declined this round, can revisit).

---

## 2026-05-08 — Session 6

### Goal
Run a top-to-bottom QA + design audit, then implement the highest-priority fixes the audit surfaced: visible typos, mobile-hidden identity content, and over-eager 3rd-party JS loading.

### What was done

**Multi-skill site audit** (recommendations only — no commit)
- Drove `/audit`, `/optimize`, `/delight`, `/polish` lenses against rendered pages at desktop 1280×900 and mobile 375×812, in both dark and light themes, using the local Jekyll preview.
- Anti-patterns verdict: **pass** (the typography pairing, warm-tinted neutrals, and bespoke football page survive the AI-slop test). Two flags raised: monospace terminal aesthetic on the homepage, and verifying the profile portrait isn't compositing a CSS hero glow.
- Produced a prioritized findings list (4 critical, 7 high, 8 medium, 9 low/polish) with mappings to the impeccable command set for fixes.

**Audit follow-ups** (commit `2059199`, `fix: audit follow-ups …`)
- `_pages/football.md`: `Favorate` → `Favorite` on the team and player pills (visible uppercase typo on the personality page).
- `assets/css/about.css`: dropped the mobile `display: none` for `#nhTerminal` / `#nhTerminal2`. Unfloat `.profile` on `≤768px` so the photo centers as a block and the two intro lines (`> researcher · professor · builder`, `• Currently: Senior Editor, ISR · Centennial Endowed Chair · Assoc. Dean`) render below the photo with natural wrapping. Phone visitors now see the editorship/dean status that was previously desktop-only.
- `.claude/CLAUDE.md`: removed the `/teaching/` row from the Pages table. The page was deleted in session 3 but the doc still asserted it existed.

**Per-page 3rd-party JS gating** (commit `676f9fb`, `perf: drop unused 3rd-party JS …`)
- `_includes/scripts/mathjax.liquid`: now requires `page.math: true` in front-matter (opt-in) in addition to `site.enable_math`. Polyfill follows (it's inside the same include).
- `_includes/scripts/badges.liquid`: now requires `page.publication_badges: true`. The Altmetric / Dimensions badges were not rendering anywhere on the live site — the legacy `bib.liquid` layout isn't in use; `_pages/publications.md` renders its own list from `_data/publications.yml` — so this is a clean removal with an opt-in path for future.
- `_includes/head.liquid`: removed the MDBootstrap CSS link and the Google Material Icons stylesheet (both confirmed unused via grep).
- `_includes/scripts/bootstrap.liquid`: removed the MDBootstrap JS CDN script. Local `bootstrap.bundle.min.js` stays for the nav dropdown.

### Current status

- **Done**: Audit complete, two code commits made, both verified end-to-end via Jekyll preview (homepage desktop+mobile in dark, publications, football). No console errors. No layout regressions. Bootstrap nav dropdowns, jQuery, theme toggle, livereload all still work.
- **In progress**: nothing.
- **Pending**: push to `origin/main`; verify on `https://kevinhong.ai` after GitHub Pages rebuild.

### Important context

- `AGENTS.md` remains an untracked local file and was intentionally not staged (matching session 5 decision). The `/teaching/` row was edited locally there too but isn't being committed.
- `assets/css/about.css` has an `@media (max-width: 768px)` block that now also unfloats `.profile`. If anything else later assumes the photo is right-floated on mobile, it will need to be aware of this.
- ImageMagick errors during build for `assets/img/football/players/{arch-manning,malachi-toney,…}.jpg` are pre-existing (noted in session 5 handover) — these files are HTML/JSON masquerading as `.jpg`. Unrelated to this session.
- The `[citations] Applied 38 of 38 counts to DOM` console log still fires 8× per visit on the publications page — flagged in the audit as H3, not yet fixed.

### Decisions already made

- Two-commit split: `fix:` for visible/textual changes, `perf:` for the JS gating. Lets either be reverted independently.
- Did **not** opt `_pages/publications.md` into `publication_badges: true`, because the page never actually renders those badges. If a future page wants them it adds the flag.
- Did **not** replace jQuery / Bootstrap-bundle this session — that's a Tier 3 follow-up because it requires writing a small vanilla nav-dropdown to replace Bootstrap 4's jQuery-dependent dropdown.
- Did **not** address the homepage tag → publications-filter naming inconsistency (`#Human-Algorithm Interactions` vs `HUMAN-AI INTERACTION`). It's in the next-set list.

### Next best step

- **Primary action**: After `git push`, verify on the deployed site that (a) the homepage renders identically at desktop, (b) on a real phone the "Currently:" line is visible below the photo, (c) DevTools Network tab on `/` shows no requests to `cdn.jsdelivr.net/npm/mdbootstrap`, `cdn.jsdelivr.net/npm/mathjax`, `cdnjs.cloudflare.com/polyfill`, `embed.altmetric.com`, `badge.dimensions.ai`, or `fonts.googleapis.com/css2?family=Material+Icons`.
- **Next-set queue**: Tier 1 follow-ups from the audit are `aria-label` on `#light-toggle`, footer with email/CV/Scholar/ORCID, homepage tag chips → publications filter wiring, skip-to-main link, `[citations]` repeat-log fix. Full prioritized list is in this session's chat transcript.

---

## 2026-05-08 — Session 5

### Goal
Audit and fix the intermittent broken homepage profile picture, then commit and push the fix.

### What was done

**Profile image audit**
- Reproduced the deployed failure at the asset level: live `index.html` referenced `/assets/img/prof_pic-{480,800,1400}.webp`, but those generated WebP files returned `404` on `https://kevinhong.ai`.
- Confirmed the original fallback JPEG existed and returned `200`, explaining why refreshes sometimes recovered after fallback/caching.
- Confirmed `origin/gh-pages` had `assets/img/prof_pic.jpeg` but not the generated `prof_pic-*.webp` variants.

**Profile image fix** (`f1c6a21`)
- Added committed homepage-specific WebP asset: `assets/img/prof_pic-home.webp`.
- Updated `_pages/about.md` with `image_webp: prof_pic-home.webp` and alt text `Kevin Y. Hong`.
- Updated `_layouts/about.liquid` so the homepage profile picture uses the committed cache-busted WebP with the original JPEG fallback instead of generated responsive WebP names.
- Hardened `_includes/figure.liquid` by removing the trailing comma from generated `srcset` values and replacing the jQuery-dependent `onerror` fallback with vanilla JS.

### Current status
- **Done**: Profile image fix implemented, committed, and verified locally.
- **In progress**: nothing.
- **Pending**: GitHub Pages rebuild/live-site verification after push.

### Important context
- `AGENTS.md` remains an untracked local file and was intentionally not staged.
- Local verification used `http://127.0.0.1:4177/` served from `_site`.
- Production build completed in `141.42s`; existing ImageMagick warnings for malformed football player `.jpg` files are unrelated to the profile picture.

### Decisions already made
- Did not rely on generated `prof_pic-480.webp`, `prof_pic-800.webp`, or `prof_pic-1400.webp` for the homepage because those names were missing on the deployed `gh-pages` branch.
- Used one committed, cache-busted WebP (`prof_pic-home.webp`) plus JPEG fallback for deterministic deployment.

### Next best step
- **Primary action**: After deploy completes, verify `https://kevinhong.ai/assets/img/prof_pic-home.webp` returns `200` and the homepage portrait survives repeated refreshes.

---

## 2026-05-08 — Session 4

### Goal
Recover local `main` after the April 29 history rewrite, add the DOI link for the educational crowdfunding publication, and push the resulting `main` update.

### What was done

**Remote history recovery**
- Investigated why `git pull --ff-only` failed: `origin/main` had been force-updated from the pre-filter tip `0bd194f` to rewritten history at `247a514`.
- Confirmed the rewrite was intentional from Session 3: `git filter-repo` preserved the old HEAD tree and added two real commits afterward.
- Preserved the old local pre-filter tip on local branch `backup/pre-filter-main-20260508-211708`.
- Reset local `main` to `origin/main`; verified `main...origin/main = 0 0`.

**Publication DOI update** (`_data/publications.yml`)
- Updated "When Do Equity Appeals Increase Giving? Evidence from Educational Crowdfunding" with:
  - `url: "https://pubsonline.informs.org/doi/10.1287/isre.2024.1190"`
  - `doi: "10.1287/isre.2024.1190"`
- Verified `_data/publications.yml` parses as YAML.
- Pre-commit publication title-case hook passed with no changes.

### Current status
- **Done**: Local `main` aligned to rewritten `origin/main`; DOI update committed; handover prepared for push.
- **In progress**: nothing.
- **Pending**: GitHub Pages rebuild/live-site verification after push.

### Important context
- `AGENTS.md` exists as an untracked local file and was intentionally not staged.
- The backup branch `backup/pre-filter-main-20260508-211708` is local only; it points to old pre-filter commit `0bd194f`.
- Do not merge the backup/pre-filter branch back into `main`; doing so would reintroduce the pre-filter history shape.

### Decisions already made
- Adopted the rewritten remote history instead of merging, because the remote was intentionally cleaned with `git filter-repo`.
- Used the INFORMS article URL for the rendered publication link and kept the bare DOI for citation-count logic.

### Next best step
- **Primary action**: Verify the publication title link on `/publications/` after the GitHub Pages deploy completes.

---

## 2026-04-29 — Session 3

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
