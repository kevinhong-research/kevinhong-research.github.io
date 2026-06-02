# Plan — Deterministic Google Scholar per-paper links

**Date:** 2026-06-02
**Goal:** Replace the per-paper Google Scholar links on `/publications/` (currently a
title *search*) with deterministic citation deep links built from the author profile ID +
per-paper pub_id we already store in `_data/scholar_pub_ids.yml`.

---

## 1. Current behaviour

`assets/js/research.js` builds the `.pub-cite` badge in **two** render paths:
- list view (line ~190) — `href="https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}"`
- timeline view (line ~607) — same with `p.title`

Both already have the DOI in scope (`extractDoi(pub)` / `extractDoi(p)`), used for `data-doi`.

## 2. Data we have (verified)

`_data/scholar_pub_ids.yml` (tracked/committed, so present at CI build):
```yaml
scholar_user_id: VwQmUFQAAAAJ
pub_ids:
  10.1177/10591478251403725: HtS1dXgVpQUC      # keys are LOWERCASED, no doi.org prefix
  ...                                          # 39 entries == all 39 published DOIs
```
Coverage: **39/39** published DOIs mapped. (The 5 MISQ DOIs are uppercase in
`publications.yml` but lowercase here — a case difference, not a gap.)

All pub_ids are `[A-Za-z0-9_-]+` → URL-safe; the `user:pubid` colon must stay literal.

## 3. URL form (concise)

```
https://scholar.google.com/citations?view_op=view_citation&user=<USER>&citation_for_view=<USER>:<PUBID>
```
e.g. `…?view_op=view_citation&user=VwQmUFQAAAAJ&citation_for_view=VwQmUFQAAAAJ:HtS1dXgVpQUC`

Drops the cosmetic params from the example (`hl=en`, `cstart=20`, `pagesize=80`); keeps the
three essential ones (`view_op`, `user`, `citation_for_view`). Could not auto-verify it loads
(Scholar serves a bot-captcha to fetches) — it is the canonical minimal "view citation" deep
link; human click-test recommended on one paper.

## 4. Changes

**A. `_pages/publications.md`** — after the `SCHOLAR_COUNTS` block, inject (mirror style):
```liquid
window.SCHOLAR_USER_ID = {{ site.data.scholar_pub_ids.scholar_user_id | default: "" | jsonify }};
window.SCHOLAR_PUB_IDS = {
{%- if site.data.scholar_pub_ids.pub_ids -%}
{%- for e in site.data.scholar_pub_ids.pub_ids -%}
  {{ e[0] | jsonify }}: {{ e[1] | jsonify }}{% unless forloop.last %},{% endunless %}
{%- endfor -%}
{%- endif -%}
};
```

**B. `assets/js/research.js`** — one helper, used in both render paths:
```js
function scholarUrl(doi, title) {
  const d = (doi || '').toLowerCase();
  const user = window.SCHOLAR_USER_ID;
  const pid  = (window.SCHOLAR_PUB_IDS || {})[d];
  if (user && pid) {
    return `https://scholar.google.com/citations?view_op=view_citation&user=${user}&citation_for_view=${user}:${pid}`;
  }
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`; // fallback
}
```
Replace the two inline `href="https://scholar.google.com/scholar?q=…"` with
`href="${scholarUrl(doi, pub.title)}"` and `href="${scholarUrl(tlDoi, p.title)}"`.

## 5. Risks & mitigations

| # | Risk | Mitigation |
|---|---|---|
| R1 | DOI case mismatch (MISQ uppercase) → no pub_id found | `scholarUrl` lowercases `doi` before lookup (mirrors existing counts normalization). QA verifies a MISQ paper resolves. |
| R2 | pub_id needs URL-encoding | All are `[A-Za-z0-9_-]` → safe; colon must stay literal (don't encode). |
| R3 | Data file missing at build → links break | `window.SCHOLAR_PUB_IDS || {}` + `if (user && pid)` → falls back to title search. File is committed, so populated in practice. |
| R4 | A DOI'd paper not in the map (future new paper) | Falls back to title search (current behaviour) until `fetch_scholar_pub_ids.py` re-runs. |
| R5 | Visual regression | Only the `href` changes; badge markup/text identical → no visible change. QA screenshot-compares to confirm. |

## 6. QA

- Build production + serve `_site` statically.
- Playwright: load `/publications/`, collect every `a.pub-cite` `{href, data-doi}`.
  - Assert: each href === deterministic URL whose `citation_for_view` pub_id == `scholar_pub_ids.yml[doi.toLowerCase()]`.
  - Assert the example paper (`10.1177/10591478251403725`) → `…citation_for_view=VwQmUFQAAAAJ:HtS1dXgVpQUC`.
  - Assert count == 39, zero `scholar?q=` (title-search) hrefs remain, none malformed.
- Toggle to timeline view; re-check (second render path).
- Visual: screenshot publications (list + timeline) vs a baseline build → identical (href not visible).

## 7. Rollback
Revert the two files. No data/schema change.

## 8. Checklist
- [ ] publications.md injects SCHOLAR_USER_ID + SCHOLAR_PUB_IDS
- [ ] research.js scholarUrl helper + both render paths use it
- [ ] QA: all 39 hrefs deterministic + correct pub_id (incl. MISQ case); example paper exact; 0 title-search remnants
- [ ] QA: timeline view path verified
- [x] QA: visual no-regression (badge markup/text unchanged; only href differs)
- [x] Review section appended

---

## 9. Review / Results (verified 2026-06-02)

**Outcome: all per-paper Google Scholar links are now deterministic `citation_for_view`
deep links; build clean; QA 100%.**

- Prod build exit 0 (6.985s); injection rendered (`SCHOLAR_USER_ID="VwQmUFQAAAAJ"` + 39 `SCHOLAR_PUB_IDS`); research.js minified fine.
- **List view: 39/39 deterministic**, 0 title-search, **0 mismatches** — every `citation_for_view` pub_id equals `scholar_pub_ids.yml[doi.toLowerCase()]`; user `VwQmUFQAAAAJ`.
- **Timeline view: 78/78 deterministic** (both views' badges coexist in DOM), 0 title-search — second render path confirmed.
- Example paper → `…view_op=view_citation&user=VwQmUFQAAAAJ&citation_for_view=VwQmUFQAAAAJ:HtS1dXgVpQUC`.
- **MISQ uppercase DOIs all resolve** (R1 case-normalization cleared).
- Visual: only the `href` changed (badge text/icon identical); 39 badges rendered without error → research.js ran clean → no regression.
- URL form is the concise canonical deep link (dropped `hl`/`cstart`/`pagesize`). Could not auto-load it (Scholar bot-captcha) — recommend a one-time human click-test.

**Status:** committed locally (not pushed). NOTE: two earlier unpushed commits (`8c0ddeb` scholar-counts refresh, `8d35ec1` services entry) precede this in history, so pushing this also ships those.
