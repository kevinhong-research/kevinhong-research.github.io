# Lessons

Patterns and pitfalls learned during work on this site. Append new entries at the top.

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
