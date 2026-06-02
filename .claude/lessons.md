# Lessons

Patterns and pitfalls learned during work on this site. Append new entries at the top.

---

## deploy.yml: the Python steps and the giscus yaml-update step are dead weight

**Rule.** Two CI steps in `.github/workflows/deploy.yml` did nothing useful and were removed
(2026-06-02, commit `9a6f410`):

1. **`Setup Python` + `Install Python dependencies`.** `requirements.txt` is only `nbconvert`,
   which exists for `jekyll-jupyter-notebook`. That gem **auto-loads via the Gemfile
   `:jekyll_plugins` group even though it's commented out in `_config.yml plugins:`** — but it
   only shells out to `nbconvert` when converting a `.ipynb`, and there are none. So the
   production build runs fine with **no Python on PATH** (verified: local prod builds succeed
   without `nbconvert`/`jupyter`). Bonus: `setup-python@v5` was one of the two Node-20-deprecated
   actions. **Caveat:** `requirements.txt` is still referenced by `axe.yml` + `Dockerfile`, so it
   was left in place. If a `.ipynb` is ever added, restore the Python steps or CI build fails.

2. **`Update _config.yml` (`fjogeleit/yaml-update-action@main`).** It set `site.giscus.repo`, but
   **giscus is never rendered**: `_includes/giscus.liquid` is gated behind
   `{% if site.giscus and page.giscus_comments %}` (post/page layouts) and **no page or
   `_config.yml` default sets `giscus_comments`**. So the step was a no-op. Removing it also
   dropped an unpinned `@main` action and the `punycode` deprecation warning.

**How to verify a deploy.yml change is site-safe.** Build twice through the full CI pipeline
(jekyll + the exact purgecss command) to throwaway dirs — once with the *new* config, once with a
temp `--config _config.yml,override.yml` that re-creates the *current* prod (here:
`giscus.repo: <repo>` + `pagination.enabled: true`) — then `diff -r` after normalizing build
timestamps (`?v=\d{12}` on football/talks map scripts, `feed.xml <updated>`). Identical → safe.

**Hook note.** The `security_reminder_hook` intercepts the **first** Edit to a
`.github/workflows/*.yml` file each turn with an injection-safety reminder (it does not block a
clean version bump); just re-issue the edit.

---

## `jekyll-minifier` re-minifies the already-compressed `main.css` (≈95% of the build)

**Rule.** `_config.yml` sets `sass: style: compressed`, so `_site/assets/css/main.css`
is *already* minified by Sass. `jekyll-minifier` then runs `CSSminify2` over it again, and
`CSSminify2.extractDataUrls` does a `while css.match(/url(...data:/)` scan that goes
pathological on the tabler-icon `data:` URIs baked into the ~610 KB `main.css`. Result:
**~133 s to shave 0.06 %** — essentially the entire production build. (`jekyll build --profile`
shows RENDER < 1 s; the WRITE phase is ~all minifier.)

**Fix (shipped 2026-06-02).** Add `assets/css/main.css` to `jekyll-minifier.exclude` in
`_config.yml`. Build drops ~194 s → ~20 s in CI (143 s → 8 s local). Safe: main.css is
already Sass-compressed, `purgecss` still strips it to ~30 KB, GitHub Pages gzips it. Deployed
output verified unchanged (only main.css whitespace differs; all pages render pixel-identical).
Full record: `.claude/plans/2026-06-01_exclude-main-css-from-minifier.md`.

**How to apply / diagnose.**

1. **Profiling a slow build:** `JEKYLL_ENV=production … jekyll build --profile` → read the
   phase table. WRITE ≫ RENDER means the minifier. Isolate which sub-pass with a throwaway
   override: `--config _config.yml,/tmp/o.yml` where `o.yml` sets `jekyll-minifier: {compress_css: false}`
   (or `compress_javascript: false`). Here CSS minify was ~132 s, JS ~5 s.
2. **Local prod builds need a UTF-8 locale** (`LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`) or
   `CSSminify2` dies with `invalid byte sequence in US-ASCII` on the `data:` URIs. CI is UTF-8, unaffected.
3. **`_site` tree-diff QA gotcha:** `_pages/football.md` and `_pages/talks.md` cache-bust their
   map scripts with `?v={{ site.time | date: '%Y%m%d%H%M' }}`, so those two pages differ
   build-to-build at minute granularity, and `feed.xml` carries a build `<updated>`. Normalize
   `?v=\d{12}` and the feed timestamp before diffing, or you'll chase phantom changes.

---

## `bust_file_cache` filter is broken for compiled assets

**Rule.** The `bust_file_cache` filter in `_plugins/cache-bust.rb` reads from the *source* path that matches the asset URL — but for compiled assets (e.g. `main.css` is generated from `main.scss`), there's no source file at `assets/css/main.css`. `File.read` fails silently → `Digest::MD5.hexdigest('')` → constant `?d41d8cd98f00b204e9800998ecf8427e` query param on every page load.

**Effect.** Returning visitors keep their browser-cached copy of the CSS for up to GitHub Pages' default `max-age=14400` (4 hours), even after the site redeploys with new styles. The cache-bust query string never changes because the file read failed.

**Detection.** Open DevTools Network on the live site and look at the `main.css` URL. If the query string is `?d41d8cd98f00b204e9800998ecf8427e` — that's the MD5 of the empty string — the filter is silently failing.

**How to apply.**

1. **For instant theme/style rollouts**, fix the filter first or hash a different file. Options (pick one):
   - Read from the built site instead: `File.read("_site/assets/css/main.css")` (only works after first build; CI does build before serve, OK).
   - Hash the source file when extension differs: try `.css` → fall back to `.scss` → fall back to file mtime.
   - Use `site.time` (build timestamp) as a global cache-buster — invalidates EVERY css/js on every build. Coarse but always works.

2. **Until the filter is fixed**: after a deploy, the only way for returning visitors to see the new theme is to wait for the 4-hour cache expiry, hard-refresh, or visit a fresh page that forces revalidation via the weak ETag.

3. **Local-dev preview** has the same bug. To verify a CSS change in the preview tool, replace the `<link rel=stylesheet>` with a fresh URL (random query string) — `window.location.reload()` won't bust the cache because the link's URL hasn't changed.

---

## CSS comment bodies must not contain `*/`

**Rule.** Never write the substring `*/` inside the body of a `/* ... */` CSS comment. It silently terminates the comment early. Whatever comes after gets parsed as CSS — and a malformed run of plaintext at the start of what looks like a rule will cause the *next* rule to be silently dropped by the browser parser. Linters won't always flag it.

**The 2026-05-09 incident.** A comment block in `assets/css/football.css` read:

```css
/* ── DARK MODE
   --fb-text-* and --fb-line cascade from the global --text-*/--line palette
   ... */
html[data-theme="dark"] .fb-page {
  --fb-line: #4A4A46;
  ...
}
```

The substring `*/` inside `--text-*/--line` closed the comment after `--text-*`. The remaining text (`--line palette ... */`) got parsed as broken CSS, which in turn caused the browser to drop the entire `html[data-theme="dark"] .fb-page { ... }` rule that followed. Effect: dark-mode football overrides silently stopped applying. The CSS file looked fine in the editor and `grep` confirmed both blocks existed; only `document.styleSheets` enumeration revealed the missing rule. Cost: ~30 minutes of bisecting.

**How to apply.**

1. **Pre-commit sweep.** Before committing CSS edits, run:
   ```bash
   grep -rEn "/\*[^*]*\*/[^*]*\*/" assets/css _sass
   grep -rEn "\-\-[a-z]+\-\*/" assets/css _sass     # the specific footgun (token wildcard followed by `/`)
   ```
   Either pattern flags a comment that contains a premature `*/`.

2. **Avoid these wordings inside comments:**
   - `--text-*/...` → use `--text-* and ...` or `--text-{xs,sm,base}/...`
   - `width: 50%/50%` → write `width: 50% / 50%` (space breaks the substring) or rephrase
   - Any natural-language `*/` (e.g. an inline regex example) → escape with whitespace or rephrase

3. **Debugging signal.** If a CSS rule that exists in the source file isn't being applied — and the selector matches via `el.matches(...)` and specificity beats the competing rule — check `document.styleSheets[N].cssRules` to see whether the rule is even present in the parsed model. If it's missing from the parsed model but present in the source, scan the *previous* comment block for a stray `*/`. The dropped rule is almost always the one immediately after a damaged comment.
