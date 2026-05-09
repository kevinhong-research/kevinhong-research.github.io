# Lessons

Patterns and pitfalls learned during work on this site. Append new entries at the top.

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
