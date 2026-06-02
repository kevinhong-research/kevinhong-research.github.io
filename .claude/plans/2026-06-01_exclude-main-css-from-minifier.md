# Plan — Exclude `main.css` from `jekyll-minifier` (build-time fix)

**Date:** 2026-06-01
**Author:** Claude (with Kevin Hong)
**Status:** DRAFT → will be hardened over 3 audit rounds before implementation.

---

## 1. Objective

Cut the production build from **~194s (CI) / ~139s (local) to ~20s** by stopping
`jekyll-minifier` from re-minifying `assets/css/main.css` — a 610KB file that Sass
**already** emits minified (`sass: style: compressed`, `_config.yml:283`).

**Hard constraint:** the *deployed site must be byte-for-byte identical except for the
internal whitespace of `main.css`, and must render/animate/behave identically.* No
visual change, no behavioral change.

---

## 2. Root cause (measured, not assumed)

| Build variant | Build time | Conclusion |
|---|---|---|
| Full production (CI parity) | 139.6s local / 194.6s CI | baseline |
| `RENDER` phase only | 0.89s | templates/scholar are not the issue |
| `development` (no minify) | 1.23s | minifier ≈ 99% of build |
| `compress_javascript: false` | 134.3s | JS minify ≈ 5s |
| **`compress_css: false`** | **6.98s** | **CSS minify ≈ 132s** |

Per-file `CSSminify2` unit timing:

```
133.39 s   609,787 B → 609,419 B   main.css   ← 133s to save 368 bytes (0.06%)
  0.04 s    74,795 B →  62,522 B   jupyter-grade3.css
  (every other CSS file < 0.05s)
```

`CSSminify2.extractDataUrls` does `while css.match(/url(...data:/)`, re-scanning the
entire 610KB string on every tabler-icon `data:` URI. `main.css` is the *only*
pathological input. All other CSS files minify in well under 0.05s.

---

## 3. The change (single line)

`_config.yml`, the `jekyll-minifier` block (currently lines 289–292):

```yaml
# BEFORE
jekyll-minifier:
  exclude: ["robots.txt", "assets/js/search/*.js", "assets/libs/**/*"]
  uglifier_args:
    harmony: true

# AFTER
jekyll-minifier:
  exclude: ["robots.txt", "assets/js/search/*.js", "assets/libs/**/*", "assets/css/main.css"]
  uglifier_args:
    harmony: true
```

That is the entire change. No other file is touched.

---

## 4. Why this cannot change the rendered site (facts established by reading source)

1. **`main.css` is already minified by Sass.** `sass: style: compressed` produces
   compressed output; `CSSminify2` only shaved 368 / 609,787 bytes (0.06%). Skipping
   it leaves the Sass-compressed CSS, which is semantically identical.

2. **Exclude matcher — confirmed applies to `main.css`.** `main.css` compiles from
   `main.scss` (front matter) so it is a `Jekyll::Page`. Verified in
   `jekyll-minifier-0.1.10/lib/jekyll-minifier.rb:174–186`: `Page#write` (and
   `Document#write`, 160–172) call `exclude?(dest, dest_path)` and, when matched, write
   `output_file(dest_path, output)` — the Sass-compiled CSS **verbatim**, no
   `CSSminify2`. `exclude?` compares the dest-relative path (`assets/css/main.css`,
   no leading slash) with `e == file_name || File.fnmatch(e, file_name)`; the exact
   string `assets/css/main.css` hits the `==` branch. (StaticFile#write also honors
   exclude, but `main.css` is a Page, not a StaticFile — this distinction was the
   top mechanism risk and is now closed.)

3. **Cache-bust unaffected.** `bust_css_cache` (`_plugins/cache-bust.rb`) appends
   `?<md5>` as a **query string** (no filename rename) and hashes the **SCSS source +
   `_sass/**/*`**, never the compiled output. So the `<link href="…/main.css?HASH">`
   in every page is **byte-identical** before and after. Only the *content* of
   `_site/assets/css/main.css` changes.

4. **`main.css` is linked, not inlined.** Only `_includes/head.liquid:72` references
   it, as `<link rel="stylesheet">`. So the blast radius is exactly one file.

5. **Other CSS untouched.** research.css, football.css, jupyter*.css, etc. still go
   through `CSSminify2` (each <0.05s) → their `_site` bytes are identical.

6. **Inline `<style>` untouched.** `htmlcompressor` (`compress_css: true`) still
   minifies inline styles → HTML output identical.

7. **JS untouched.** `compress_javascript` stays on → all JS identical.

8. **purgecss still runs on `main.css`.** The CI step globs `_site/assets/css/*.css`
   and removes unused selectors based on the parsed AST (whitespace-independent).
   Same rules in → same purge decisions out. purgecss does not minify (no `--minify`
   in `purgecss.config.js`), so it preserves the input's compression.

---

## 5. Risks & mitigations (hardened across 3 audit rounds)

| # | Risk | Severity | Status / mitigation |
|---|---|---|---|
| R1-a | Exclude not honored for `main.css` because it's a Page, not StaticFile | HIGH | **RESOLVED** — `Page#write` honors `exclude?` (jekyll-minifier.rb:174–186). See §4.2. |
| R1-b | Pattern glob ambiguity | LOW | RESOLVED — exact `==` match on `assets/css/main.css`. |
| R2-a | Naive diff fails because `CSSminify2` does value opts (`#fff`, `0px`→`0`) | HIGH | QA proof (a) pre-purge identity: `old == CSSminify2(new)`; (b) post-purge rule-set equivalence via `css_parser`. See §6. |
| R2-b | purgecss errors/skips on the unminified `main.css` | MED | QA explicitly asserts purgecss exits 0 and emits a non-empty `main.css`. |
| R2-c | Comparing the wrong artifact (pre- vs post-purge) | LOW | QA compares the post-purgecss deployed file. |
| R3-a | Build nondeterminism (`BUILD_FALLBACK=Time.now`, feed/sitemap timestamps) fakes/masks the tree diff | HIGH | **Determinism pre-check** (§6 step 0): build twice unchanged, diff; quarantine any nondeterministic files. |
| R3-b | Visual QA via `jekyll serve` reflects dev mode (no minify), not the prod artifact | MED | Serve the built `_site` **statically** (`python3 -m http.server`). |
| R3-c | Local Sass output ≠ CI Sass output | INFO | `Gemfile.lock` pins `sass-embedded 1.80.3`; dart-sass is deterministic & Ruby-independent → local proof transfers to CI. |
| R3-d | (bonus) — | — | Excluding `main.css` also bypasses the `CSSminify2.extractDataUrls` path that crashed under US-ASCII; strictly safer, not riskier. |

---

## 6. Test / QA strategy (hardened)

All builds use the CI-parity invocation:
`LANG/LC_ALL=en_US.UTF-8 JEKYLL_ENV=production … jekyll build`, then the exact CI
purgecss step (`purgecss -c purgecss.config.js`). Builds go to throwaway dirs under
`/tmp` (via `-d`) so the working tree and the live pipeline are untouched.

**Step 0 — Determinism pre-check (before any change).**
Build twice with the CURRENT config → `/tmp/site_A`, `/tmp/site_B`. `diff -r`.
- If identical → pipeline is deterministic; any later diff is attributable to the change.
- If some files differ (e.g. `feed.xml`, `sitemap.xml`, a `?Time.now` fallback) →
  record them as the **nondeterminism quarantine set**; they are excluded from the
  Step 3 judgement.

**Step 1 — Baseline.** Current config → full build + purgecss → `/tmp/site_baseline`.

**Step 2 — Option A.** Apply the one-line change → full build + purgecss → `/tmp/site_optionA`.

**Step 3 — Tree diff.** `diff -r /tmp/site_baseline /tmp/site_optionA`, ignoring the
quarantine set. **PASS = the only differing file is `assets/css/main.css`.**

**Step 4 — CSS equivalence (two independent proofs):**
- (a) *Pre-purge identity:* re-run a build of each to a pre-purge dir; assert
  `CSSminify2(optionA main.css) == baseline main.css` byte-for-byte. (old deployed =
  `CSSminify2(Sass output)` = `CSSminify2(new)`, so this must hold exactly — proving
  the sole change is the removed pass.)
- (b) *Post-purge rule-set equivalence:* parse both **deployed** (post-purgecss)
  `main.css` with the `css_parser` gem; assert identical ordered list of
  `selector { declarations }`. This tolerates value-opts and whitespace and proves
  identical rendering.

**Step 5 — purgecss health.** Assert the purgecss step exits 0 on the unminified
input and emits a non-empty `main.css` of plausible size (≈ baseline ± a few %).

**Step 6 — Visual QA.** Serve `/tmp/site_optionA` **statically** (`python3 -m http.server`,
NOT `jekyll serve`). Screenshot about / publications / talks / services / football in
light + dark via the preview tools; compare against the same pages served from
`/tmp/site_baseline`. Expect pixel-identical. Spot-check one CSS animation (e.g. a
hover/reveal) renders.

**Step 7 — Build-time confirmation.** Record baseline vs option-A build seconds.

**Loop:** if any step fails, diagnose, fix, re-run from the first affected step until
Steps 3, 4(a), 4(b), 5, 6 all pass.

---

## 7. Rollback

Single-line revert of `_config.yml`. No data, no schema, no irreversible step.

---

## 8. Checklist

- [x] Plan audited 3 rounds; all surfaced issues resolved (R1-a/b, R2-a/b/c, R3-a/b/c/d)
- [x] Step 0 — determinism pre-check; quarantine set recorded (`feed.xml` + `?v=` map-script stamps)
- [x] Change applied to `_config.yml`
- [x] Steps 1–2 — baseline + option-A built via full CI pipeline (jekyll + purgecss)
- [x] Step 3 — tree diff shows ONLY `assets/css/main.css` changed (mod quarantine set)
- [x] Step 4(a) — `CSSminify2(optionA main.css) == baseline main.css` byte-for-byte (609,419 B)
- [x] Step 4(b) — post-purge `main.css` rule sets equivalent (csso canonical + `css_parser`)
- [x] Step 5 — purgecss exits 0, non-empty `main.css` (30,790 B → 31,179 B)
- [x] Step 6 — about computed-styles byte-identical; pubs/football/talks/services screenshots pixel-identical (AE=0)
- [x] Step 7 — build time confirmed reduced (143s → 8s local)
- [x] Review section appended with results

---

## 9. Review / Results (verified 2026-06-02)

**Outcome: ship-ready. Build ~18× faster locally (143s → 8s; CI ~194s → ~20s expected). Deployed
output provably identical — rendering and animation unchanged.**

| Check | Result |
|---|---|
| Build time (local prod) | 143s → **8s** (the 133s `CSSminify2(main.css)` pass removed) |
| Tree diff (full `_site`) | After normalizing build timestamps, **only `assets/css/main.css`** changed |
| Determinism quarantine | `feed.xml` (jekyll-feed `<updated>`) + `?v=%Y%m%d%H%M` on footballmap.js/talkmap.js — pre-existing, time-based, unrelated |
| 4a pre-purge identity | `CSSminify2(optionA main.css)` == baseline `main.css`, **byte-for-byte** (609,419 B) |
| 4b rule equivalence | Only value-syntax diffs (`#ffffff`→`#fff`, `0px`→`0`, `border:none`→`border:0`) — spec-equivalent |
| purgecss health | exit 0; post-purge 30,790 B (base) vs 31,179 B (opt); both ~95% stripped; gzip absorbs the ~389 B |
| about (computed styles) | **byte-identical** — every element × ~80 props × light + dark |
| pubs / football / talks / services | full-page screenshots **pixel-identical** (ImageMagick AE = 0) |

**Three "differences" investigated → all measurement artifacts, never the CSS:**
1. First swap test appended `main.css` at a new `<head>` position → cascade-order bug (false color diffs).
2. Chromium `color-mix()` `oklch`↔`oklab` computed-value *serialization* jitter — renders identically (pubs AE=0).
3. Full-page screenshot image-load timing on football (17,841 px → **0 px** once images settled).

**Lessons (also added to project memory):**
- `jekyll-minifier`'s `CSSminify2` re-minifies the already-`style: compressed` Sass output; it's pathological on the tabler-icon `data:` URIs in `main.css` (133s for a 0.06% gain).
- `getComputedStyle` is unreliable for cross-render equivalence when `color-mix()` is present (serialization nondeterminism); screenshot pixel-diff is the robust check.
- Full-page screenshots must wait for `document.images` to settle or they yield false diffs.

**Status:** committed to `main` (not pushed). Push triggers the GitHub Actions deploy; write a HANDOVER entry first.
