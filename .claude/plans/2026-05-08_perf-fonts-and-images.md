# Perf: talk-logo WebP + font-display + preload + cache audit

**Date:** 2026-05-08
**Session:** 9
**Scope:** 4 audit items from the `/optimize` lens
**Estimated effort:** 60–90 min

---

## Goals (priority of impact)

1. **#1 Talk logos PNG → WebP via `<picture>`** — the build already generates `-480/-800/-1400.webp` variants for all 50+ logos, but `talks_render.html` serves the PNG directly. **Real, measurable bytes wasted on every visitor of `/talks/`.**
2. **#3 Preload Cormorant Garamond + Geist** — direct LCP win on every page since Cormorant is the H1 font. ~100–300ms shaved off FCP/LCP on cold cache.
3. **#2 Tabler-icons `font-display: swap`** — small but real defensive hygiene. Currently `$ti-font-display: null !default` → no declaration → browser defaults to `block` (FOIT). Sets icon fonts to swap so text never blocks while an icon font loads.
4. **#4 GitHub Pages cache headers** — investigative only. **NOT FIXABLE on GitHub Pages.** Documenting findings and confirming current behavior.

---

## Pre-work findings

### #1 Talk logos
- [_includes/talks_render.html:43](_includes/talks_render.html) renders:
  ```html
  <img src="{{ talk.logo | relative_url }}" alt="{{ talk.institution }} logo" loading="lazy">
  ```
- `talk.logo` data values look like `/assets/img/talk-logos/fbs-library/Texas_Longhorns_logo-300x300.png`.
- Build produces alongside each `<name>.png`:
  - `<name>-480.webp`
  - `<name>-800.webp`
  - `<name>-1400.webp`
- Confirmed in `_site/assets/img/talk-logos/fbs-library/` — all variants exist for every PNG.
- The talks page lazy-loads images, so the win is per-image (not blocking page load) but still useful: ~50 logos at PNG sizes vs WebP, plus better mobile DPR scaling.
- Logo display size is small (~40-60 CSS px in the timeline cards) — even DPR 3 only needs ~180px. The `-480.webp` variant is the appropriate primary; `-800.webp` is overkill.

### #2 Font-display
- `_sass/_fonts.scss`: 5 @font-face blocks (Cormorant × 2, Instrument × 2, Space Grotesk × 1) — all have `font-display: swap`. ✓
- `_sass/_geist.scss`: 7 @font-face blocks (Geist × 2, Geist Pixel × 5) — all have `font-display: swap`. ✓
- `_sass/tabler-icons/tabler-icons.scss`, `-filled.scss`, `-outline.scss`: each has `$ti-font-display: null !default;` followed by `font-display: $ti-font-display;`. With `null`, the compiled CSS contains `font-display:;` which is invalid → browser uses default (`auto`/`block`).
- font-awesome partials: not yet checked. Less critical (icons aren't render-blocking text), but worth a glance.

### #3 Preload state
- [_includes/head.liquid](_includes/head.liquid) currently has zero `<link rel="preload">` declarations for fonts.
- Fonts get discovered by the browser only after CSS parses and hits `@font-face` rules — that's a serial dependency: HTML → CSS → CSS parsed → discovers @font-face → fetches font. Adding preload moves font fetch onto the same parallel batch as the CSS itself.

### #4 Cache headers (production check)
- `curl -I https://kevinhong.ai/assets/css/main.css` returns:
  - `cache-control: max-age=14400` (4 hours)
  - `expires: <4h from now>`
  - `etag: W/"…"` (weak, for revalidation)
  - `last-modified: <…>`
- GitHub Pages does NOT honor per-file cache rules. There is no `_headers` file or `_redirects` mechanism that GH Pages reads (those are Netlify/Cloudflare features).
- Hashed asset URLs (e.g. `main.css?d41d8cd9...`) get the same 4h TTL as non-hashed. Not optimal for hashed assets which could safely cache for a year.
- **No code change possible on GH Pages.** The recommendation is a future infrastructure conversation: front the site with Cloudflare or move to Netlify/Vercel if longer caching matters. Out of scope for this session.

---

## Item plans

### #1 — Talk logos PNG → WebP via `<picture>`

**Fix:** Modify [_includes/talks_render.html:39-46](_includes/talks_render.html) to wrap the image in a `<picture>` element with a WebP `<source>` and the existing PNG as fallback.

**Liquid pattern:**
```liquid
{% if talk.logo %}
  {% assign logo_webp = talk.logo | replace: '.png', '-480.webp' %}
  <span class="talk-logo talk-logo--image">
    <picture>
      <source srcset="{{ logo_webp | relative_url }}" type="image/webp">
      <img src="{{ talk.logo | relative_url }}" alt="{{ talk.institution }} logo" loading="lazy" width="48" height="48">
    </picture>
  </span>
{% endif %}
```

**Why `-480.webp` not srcset with all 3:** the logos render at ~40-60 CSS px in the timeline cards; even DPR 3 mobile only needs ~180px. The `-480.webp` variant is more than enough. Adding -800 and -1400 to a srcset would be over-engineering and add HTML weight.

**Why explicit `width="48" height="48"`:** prevents CLS when logos load. Browsers compute aspect ratio from the dimensions even if CSS overrides display size.

**Risk:**
- Some `talk.logo` values might not have `.png` extension (e.g. `.jpg` for one institution, `.webp` already — possible). `replace: '.png', '-480.webp'` would no-op on non-PNG values, leaving `<source srcset="non-png-url">` which the browser silently ignores → falls back to `<img src>`. Safe degradation.
- Need to verify a sampling of logos actually have generated `-480.webp` files. Confirmed in `_site/`; will re-confirm post-build.

**Verification:**
- Reload `/talks/`. DevTools Network: confirm at least one `-480.webp` request.
- Visually: logos render identically.
- For any institution where the WebP didn't generate, the PNG fallback still works.

---

### #2 — Tabler-icons `font-display: swap`

**Fix:** In [assets/css/main.scss](assets/css/main.scss), declare `$ti-font-display: swap;` BEFORE the legacy `@import` block for tabler-icons. The `!default` in the partial means it picks up our value.

```scss
$ti-font-display: swap;
$ti-font-path: "../fonts";
$fa-font-path: "../webfonts";

@import
  "font-awesome/...",
  "tabler-icons/...";
```

**Risk:** essentially zero. The default behavior is `auto`/`block` (worst); `swap` is strictly better for icon fonts since icon glyphs replacing text fallbacks is barely noticeable.

**Why not also set font-awesome's font-display:** font-awesome 6 free's source `_variables.scss` doesn't expose a `$fa-font-display` knob; it would require modifying vendored files. Lower-impact than tabler-icons (which the site uses for nav theme toggle + filter eyebrow icons + back-to-top). Defer with the rest of the vendor migration.

**Verification:**
- `curl -s http://127.0.0.1:4000/assets/css/main.css | grep "font-display:swap" | wc -l` should increase by 3 (one per tabler-icons @font-face).
- Tabler-icons still render (theme toggle moon/sun, etc.).

---

### #3 — Preload Cormorant Garamond + Geist

**Fix:** In [_includes/head.liquid](_includes/head.liquid), add two `<link rel="preload">` directives at the top of `<head>` (before main.css). Use `crossorigin` (required for fonts even from the same origin per spec).

```liquid
<!-- Preload critical LCP fonts -->
<link
  rel="preload"
  href="{{ '/assets/fonts/geist/Geist-Variable.woff2' | relative_url }}"
  as="font"
  type="font/woff2"
  crossorigin>
<link
  rel="preload"
  href="{{ '/assets/fonts/cormorant-garamond/cormorant-garamond-latin-wght-normal.woff2' | relative_url }}"
  as="font"
  type="font/woff2"
  crossorigin>
```

**Why NOT `bust_file_cache`:** the compiled CSS `@font-face` rules use static URLs (no hash query). If the preload URL has `?<md5>` and the @font-face doesn't, the browser would fetch the font twice. Font files are immutable in practice (variable woff2 versioned by package); cache-busting is unnecessary here.

**Why these two:** Cormorant Garamond is the H1 display font (LCP element on every page — `Kevin Y. Hong` on home, `publications` / `talks` / `services` / `football` / `working papers` on the rest). Geist is the body font, used for everything else visible above the fold.

**Why NOT preload Geist Mono / Cormorant italic / Space Grotesk / Instrument:** they're either below-the-fold or for specialized content (terminal lines on home use Geist Mono — which is already discovered quickly via @font-face). Preloading too many fonts wastes bandwidth and competes with the critical resources.

**Why `crossorigin` even though same-origin:** the WOAFF2 fetch via `@font-face` uses CORS mode; if the preload doesn't match (no crossorigin attr), the browser fetches twice. The spec is well-known; recent browsers warn in DevTools if preload doesn't match the eventual use mode.

**Why `bust_file_cache`:** matches the cache-busting pattern al-folio uses everywhere else. If a font ever gets replaced, the URL changes.

**Risk:**
- If the `bust_file_cache` filter doesn't apply to font URLs cleanly (it's mostly used for CSS/JS), the preload URL might not match the @font-face URL → browser fetches twice. **Need to verify in DevTools.** Mitigation: drop the filter and use a static URL if it doesn't match.
- Order of `<head>` matters: preloads should appear BEFORE the CSS link tag so they don't compete for connection slots after CSS starts processing.

**Verification:**
- DevTools Network on `/`: Cormorant Garamond and Geist Variable fonts should appear higher in the request waterfall (parallel with CSS), not after it.
- Lighthouse audit: "Preload key requests" recommendation should disappear.
- Check console for "preloaded but not used" warning — would indicate URL mismatch.

---

### #4 — GitHub Pages cache headers (documentation only)

**No code change.** Confirmed via `curl -I https://kevinhong.ai/assets/css/main.css`:
- `cache-control: max-age=14400` (4 hours)
- ETag + Last-Modified for revalidation

**Findings to document in handover:**
- GH Pages does not support per-file cache rules.
- Hashed assets (URL with `?...` query string) get the same 4h TTL as everything else.
- For longer cache TTL (e.g., 1 year for hashed assets), would need to:
  - Front GH Pages with Cloudflare and override cache rules at the edge, OR
  - Migrate to Netlify (which honors `_headers` files) or Vercel.
- Not worth doing today. The 4h TTL + ETag combo is fine for an academic personal site. If load patterns change (high return-visit traffic, slow connections), revisit.

---

## Implementation order

1. #4 documentation (zero code) — already covered in this plan.
2. #2 tabler-icons `font-display: swap` (one line in main.scss) — fastest code change.
3. #1 talk logos `<picture>` — biggest visible perf win.
4. #3 preload fonts — coordinate with #1's cache-busting verification.

---

## Verification checklist

**Per-item:**
- [ ] #2: `font-display:swap` count in compiled CSS goes UP by 3 (Tabler outline / filled / base).
- [ ] #1: At least one `-480.webp` request on `/talks/`. Visual: logos identical. PNG fallback still serves on browsers that block WebP (rare, but verifiable via `Accept: text/html` only).
- [ ] #3: Cormorant + Geist Variable woff2 fetches happen earlier in the network waterfall on `/`. No "preloaded but not used" console warning. Sample at desktop AND mobile.

**Cross-cutting:**
- [ ] No console errors on `/`, `/publications/`, `/talks/`, `/services/`, `/football/`, `/working/`.
- [ ] Theme toggle moon/sun icons still render (sanity for tabler-icons swap).
- [ ] All previous session perf wins intact (mathjax/polyfill/MDB/etc. still NOT loaded).
- [ ] Mobile (`/`) still works — Currently line, profile srcset.

---

## Plan audit — self-critique pass

**Things I almost got wrong:**

1. **`bust_file_cache` on preload URLs.** I almost shipped without verifying that the cache-busted URL would match the @font-face url. Caught it: documented as a verification step. If mismatch occurs, plan to drop the filter (fonts rarely change anyway).
2. **Including all 3 WebP sizes for logos in srcset.** Caught it: logos render at ~48 CSS px so even DPR 3 needs only ~144px. The `-480` variant is fine; adding `-800/-1400` would bloat HTML for no gain.
3. **Setting `font-display: swap` on font-awesome too.** Caught it: would require modifying vendored partials. Lower impact than tabler-icons (which is used in the visible nav).
4. **Forgetting `crossorigin` on preload.** Caught it: required for the preload to match the @font-face fetch mode; without it, browser fetches twice.
5. **Width/height on logo `<img>`.** Caught it: prevents CLS as logos load. Use the original 300x300 dimension OR the visual 48x48 — visual is more precise. Going with `width="48" height="48"`.
6. **Not preloading Geist Mono.** Confirmed correct: only used in the homepage terminal lines (below the H1 + paragraph) and on `/publications/` for award-name treatment. Both paint paths are not LCP-critical.

**Still uncertain (will resolve during implementation):**
- Whether ALL `talk.logo` values have generated WebP. Some might be unusual extensions or in folders the build didn't process. Verify by sampling.
- Whether `bust_file_cache` produces an Output that matches @font-face URL exactly (cache string match required). Easy to verify with a single test.

---

## Risks summary

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Preload URL doesn't match @font-face URL → double fetch | medium | medium | Verify in DevTools immediately after deploy preview; drop `bust_file_cache` if mismatch |
| Some talk logos don't have WebP variants | low | low | `<picture>` falls back to PNG automatically; no broken images |
| `$ti-font-display: swap` breaks tabler-icons rendering | very low | low | swap is strictly better than the current implicit `auto`; if any visual issue, revert that one line |
| Preloads compete for connection slots with critical CSS | low | low | Place preloads BEFORE the CSS link in head.liquid |

---

## Commit strategy

Three commits, independently revertable:

1. **`perf: serve talk logos as WebP via <picture>`** (#1)
2. **`perf: set tabler-icons font-display to swap`** (#2)
3. **`perf: preload Cormorant Garamond + Geist for LCP`** (#3)

Then handover commit:
4. **`docs: handover + plan for session 9 (perf fonts + images)`**

---

## Out of scope (deferred to next session)

- font-awesome `font-display` (requires vendor file modification).
- Migrating GH Pages to a CDN with longer cache TTL.
- Preloading any other fonts.
- T2.6 / T2.7 / T2.9 / T3.11 / T3.13 / T3.14 / T4.17 / T4.19 / T4.20 from the audit roadmap.
- F1 dark-mode `--text-lo` contrast bump (deferred from session 8).
- Vendored Sass migration before Dart Sass 3.0 (requires upgrading or replacing font-awesome and tabler-icons).
