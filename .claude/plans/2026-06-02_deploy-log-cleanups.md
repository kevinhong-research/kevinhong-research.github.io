# Plan — Deploy-log cleanups (4 deferred items)

**Date:** 2026-06-02
**Author:** Claude (with Kevin Hong)
**Status:** DRAFT → hardened over 3 audit rounds before implementation.
**Companion to:** `2026-06-01_exclude-main-css-from-minifier.md` (the build-speed fix, already shipped).

---

## 1. Objective

Clear the four warnings/inefficiencies surfaced by the deploy-log analysis, **without
changing the deployed site or breaking the deploy pipeline**:

1. Bump `actions/checkout@v4 → v5` (off deprecated Node 20).
2. Remove the `Setup Python 🐍` + `Install Python dependencies 🐍` steps (dead weight;
   removes the *other* Node-20 action, `setup-python@v5`).
3. Remove the `Update _config.yml ⚙️` step (`fjogeleit/yaml-update-action@main`) — a no-op
   here, unpinned to a moving branch, and the source of the `punycode` deprecation warning.
4. Set `pagination.enabled: false` in `_config.yml` — silences the recurring pagination warning.

**Hard constraints:** the built `_site` must be unchanged (modulo known build-timestamp
noise), and the deploy must still succeed.

---

## 2. Files touched

| File | Change |
|---|---|
| `.github/workflows/deploy.yml` | items 1, 2, 3 |
| `_config.yml` | item 4 (`pagination.enabled: true → false`) |

`requirements.txt` is **left as-is** (referenced by `axe.yml` + `Dockerfile`; out of scope).
No `Gemfile`/`Gemfile.lock` change (the `jekyll-jupyter-notebook` gem stays; harmless).

After the deploy.yml edits the steps become: Checkout (v5) → Setup Ruby → Build → Purge CSS → Deploy.

---

## 3. Evidence the changes are safe (from research)

| Item | Finding |
|---|---|
| 1 checkout v5 | `v5` tag exists (latest `v6.0.3`). Step has **no `with:` inputs** → v5 defaults (fetch-depth 1, persist-credentials true) == v4 here. JamesIves deploy action fetches `gh-pages` itself; persist-credentials still default-true so it can push. Runner (ubuntu-24.04) supports Node 24 (the deprecation forces it). |
| 2 remove Python | 0 `.ipynb` files. `nbconvert`/`jupyter` **not on local PATH**, yet local production builds succeeded (143s / 8s) → build provably independent of Python. `jekyll-jupyter-notebook` (auto-loaded via Gemfile `:jekyll_plugins`) only invokes `nbconvert` when converting a `.ipynb`; none exist, so it never runs. After removal, **no** python/pip call remains in deploy.yml. |
| 3 remove yaml-update | `giscus_comments` is set **nowhere** (no page front matter, no `_config.yml` default). Layout guards `{% if site.giscus and page.giscus_comments %}` are always false → `_includes/giscus.liquid` never included → `site.giscus.repo` never rendered. So setting it (the step's only effect) is invisible. Removal also eliminates the only Node action pinned to `@main` and the `punycode` warning. |
| 4 pagination off | No `pagination:` front matter anywhere; no blog page; `jekyll-paginate-v2` already logs "couldn't find any pagination page. Skipping." → it generates nothing. `enabled: false` only removes the warning. |

Non-actions confirmed: `ruby/setup-ruby@v1` and `JamesIves/...@v4` were **not** in the
Node-20 warning, so items 1+2 fully resolve the Node-20 deprecation. (`axe.yml` separately
uses `setup-python` — out of scope; noted for a future pass.)

---

## 4. Risks & mitigations (initial — expanded in audits)

| # | Risk | Mitigation |
|---|---|---|
| R1 | checkout v5 changes a default that breaks the gh-pages push | No inputs used; v5 keeps v4 defaults; deploy action self-fetches. Validate YAML; real proof = the deploy run. |
| R2 | Removing Python breaks the build (hidden nbconvert dependency) | Proven: local builds succeed with no Python on PATH. Re-confirm with a clean local prod build. |
| R3 | Removing yaml-update changes `_site` (giscus output) | QA: build with `giscus.repo` set (mimics the action) vs blank; diff `_site` → expect 0. |
| R4 | `pagination.enabled:false` drops a page or feed | QA: build with `true` vs `false`; diff `_site` → expect 0. |
| R5 | YAML syntax error silently disables the whole workflow | Validate `deploy.yml` parses + structural check (triggers/steps intact) before commit. |
| R6 | Can't run GitHub Actions locally | Split QA: (a) prove `_site` identical for site-affecting items 3+4; (b) validate workflow YAML + reason for CI-only items 1+2; (c) user watches the real deploy. |

---

## 5. Test / QA strategy

**A. Site-output safety (items 3 + 4) — the load-bearing proof.**
Two full production builds + purgecss to `/tmp`, then `diff -r`:
- **Baseline (mimics CURRENT prod):** temp config override with `giscus.repo: kevinhong-research/kevinhong-research.github.io` (what the action injects) **and** `pagination.enabled: true`.
- **New (post-change):** the edited `_config.yml` (`giscus.repo` blank, `pagination.enabled: false`).
- Normalize the known timestamp noise (`?v=\d{12}`, `feed.xml <updated>`).
- **PASS = no remaining differences.**

**B. Build still works without Python (item 2).**
Clean local prod build (`LANG/LC_ALL=en_US.UTF-8 JEKYLL_ENV=production … jekyll build`) with no
`nbconvert`/`jupyter` on PATH → exit 0, all pages generated. (Already observed; re-confirm.)

**C. Workflow YAML validation (items 1 + 2 + 3).**
- `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))"` → parses.
- `actionlint` if available.
- Structural diff of deploy.yml: confirm triggers unchanged; only the 3 intended step edits;
  Build/Purge/Deploy steps byte-identical; final step list = Checkout/Ruby/Build/Purge/Deploy.

**D. Final proof = the deploy run** (user-initiated push): build succeeds, ~20s build step,
no Node-20 / punycode / pagination warnings, site unchanged.

---

## 6. Rollback
Per-file `git revert`/checkout. All four changes are independent and reversible; nothing
touches data, content, or irreversible state.

---

## 7. Commit shape
Two focused commits (or one if preferred):
- `ci(deploy): checkout v5, drop unused Python + yaml-update steps` (deploy.yml)
- `chore(config): disable pagination (no paginated pages)` (_config.yml)

No push until the user says so; HANDOVER entry written first per workflow.

---

## 9. Audit outcomes (3 rounds)

- **R1 output safety:** no `giscus_comments` default in `_config.yml` `defaults:` either → guard always false; feed/sitemap independent of paginate-v2. QA-A (direct `_site` diff with giscus.repo set-vs-blank + pagination true-vs-false) is the foolproof net regardless of static analysis.
- **R2 pipeline safety:** checkout **v5 requires runner ≥ ~2.327**; deploy log shows runner **2.334.0** ✓. No `with:` inputs → v4 defaults kept; JamesIves action self-fetches gh-pages, `persist-credentials` default-true → push still works. No Python consumer remains in deploy.yml after removal. YAML-break risk covered by QA-C.
- **R3 completeness:** Node-20 fully resolved (only `setup-ruby@v1` + `JamesIves@v4` remain, neither flagged); punycode warning removed with yaml-update. Chose v5 over latest v6.0.3 for minimal risk. `axe.yml`'s own `setup-python` is out of scope (future pass).

## 8. Checklist
- [x] Plan audited 3 rounds; issues resolved
- [x] deploy.yml: checkout→v5, remove Setup Python, remove yaml-update, remove Install Python deps
- [x] _config.yml: pagination.enabled → false
- [x] QA-A: `_site` diff (giscus-set+pagination-true) vs (blank+false) → IDENTICAL (only feed.xml timestamp, normalized)
- [x] QA-B: clean prod build succeeds without Python (exit 0, 12 pages, no nbconvert/jupyter)
- [x] QA-C: deploy.yml YAML valid + structural check (5 clean steps, no remnants)
- [x] Review section appended

---

## 10. Review / Results (verified 2026-06-02)

**Outcome: all 4 items shipped to working tree; deployed site provably unchanged; pipeline validated locally (final proof = the deploy run).**

- **Diff** is exactly the 4 intended changes (checkout v4→v5; −3 steps; pagination true→false); nothing else touched. Both YAML files valid.
- **QA-A** (the load-bearing proof): built `new` (edited config) vs `baseline` (override re-creating current prod: `giscus.repo` set + `pagination: true`), each through jekyll + purgecss. After normalizing `feed.xml`'s build `<updated>`, the `_site` trees are **byte-identical** → items 3 + 4 change nothing in the deployed output.
- **QA-B**: the `new` production build exited 0 with **no `nbconvert`/`jupyter` on PATH** → the Python steps were dead weight; removing them is safe.
- **QA-C**: `deploy.yml` parses; final steps = Checkout(v5) → Ruby → Build → Purge → Deploy; zero `setup-python`/`yaml-update`/`pip`/`nbconvert` remnants.
- **Positive control**: the "Pagination: Is enabled, but…" warning appears in the baseline build (pagination:true) and is **absent** in the new build (pagination:false) — proving both that the override mechanism worked and that item 4 removes the warning.
- **Node-20 deprecation resolved**: only `setup-ruby@v1` + `JamesIves@v4` remain (neither flagged). The `punycode` warning is gone with yaml-update.
- **CI-only caveat**: checkout v5's runner behavior + the gh-pages push can't run locally. Mitigation: no `with:` inputs (v4 defaults preserved), runner 2.334.0 ≥ v5's floor, deploy action self-fetches gh-pages with default-true `persist-credentials`. Confirm on the next Actions run.

**Status:** committed locally (not pushed); HANDOVER written before any push.
