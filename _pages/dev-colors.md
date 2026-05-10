---
layout: page
permalink: /dev/colors/
title: Color Lab
description: Live editor for the design system color tokens. Tweak values, see the site update, copy back to _themes.scss when satisfied. Not linked from the public nav.
nav: false
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<style>
/* Color Lab — page-local styles.
   Layout: one stacked column of sections; each section is an editor block on
   the left and a preview block on the right, paired so the visual rhythm
   aligns. At <900px the section body collapses to a single column. */

.cl-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--line);
  flex-wrap: wrap;
}
.cl-btn {
  font: 500 var(--fs-xs)/1 "Geist", sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: var(--space-md) var(--space-xl);
  border: 1px solid var(--line);
  background: transparent;
  color: var(--text-hi);
  cursor: pointer;
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
  transition: border-color var(--duration-fast) var(--ease-default), color var(--duration-fast) var(--ease-default);
}
.cl-btn:hover { border-color: var(--accent-warm-border); color: var(--accent-warm); }
.cl-status { margin-left: auto; font: var(--fs-xs)/1.4 "Geist Mono", monospace; color: var(--text-mid); }

.cl-page { display: flex; flex-direction: column; gap: var(--space-4xl); }

.cl-section { padding-top: var(--space-2xl); border-top: 1px solid var(--line); }
.cl-section:first-of-type { border-top: none; padding-top: 0; }
.cl-section__title {
  font: 500 var(--fs-xs)/1 "Geist", sans-serif;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-cool);
  margin: 0 0 var(--space-xl);
}
.cl-section__body {
  display: grid;
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
  gap: var(--space-2xl);
  align-items: start;
}
@media (max-width: 900px) {
  .cl-section__body { grid-template-columns: minmax(0, 1fr); }
}

.cl-section__editor { display: flex; flex-direction: column; gap: var(--space-sm); }
.cl-section__editor--note {
  font: var(--fs-xs)/1.5 "Geist", sans-serif;
  color: var(--text-mid);
  padding: var(--space-md);
  border-left: 2px solid var(--accent-warm-border);
  background: var(--accent-warm-bg-subtle);
}
.cl-section__preview {
  border: 1px solid var(--line);
  background: var(--surface);
  padding: var(--space-xl);
  min-width: 0;
}

.cl-row { display: grid; grid-template-columns: 1fr; gap: var(--space-2xs); padding: var(--space-md); border: 1px solid var(--line); background: var(--surface-raised); min-width: 0; }
.cl-row__head { display: flex; align-items: baseline; gap: var(--space-sm); font: 500 var(--fs-sm)/1.3 "Geist Mono", monospace; color: var(--text-hi); margin-bottom: var(--space-2xs); }
.cl-row__desc { font: var(--fs-xs)/1.4 "Geist", sans-serif; color: var(--text-mid); flex: 1; font-weight: 400; letter-spacing: 0; text-transform: none; min-width: 0; }
.cl-row__inputs { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-sm); align-items: center; }
.cl-row__inputs--unified { grid-template-columns: minmax(0, 1fr); }
.cl-input { display: flex; align-items: center; gap: var(--space-2xs); min-width: 0; }
.cl-input__label { font: var(--fs-2xs)/1 "Geist", sans-serif; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-lo); flex-shrink: 0; }
.cl-input input[type="color"] { width: 32px; height: 32px; border: 1px solid var(--line); border-radius: 0; padding: 0; background: transparent; cursor: pointer; flex-shrink: 0; }
.cl-input input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
.cl-input input[type="color"]::-webkit-color-swatch { border: none; }
.cl-input input[type="text"] { flex: 1; font: var(--fs-xs)/1 "Geist Mono", monospace; padding: var(--space-2xs) var(--space-sm); border: 1px solid var(--line); background: transparent; color: var(--text-hi); min-width: 0; }
.cl-input input[type="text"]:focus { outline: none; border-color: var(--accent-cool-border); }

/* Preview components */
.cl-preview-intro { font: var(--fs-sm)/1.5 "Geist", sans-serif; color: var(--text-mid); margin: 0 0 var(--space-md); }
.cl-preview-intro strong { color: var(--accent-warm); font-weight: 400; }

.cl-card { background: var(--surface-raised); border: 1px solid var(--line); padding: var(--space-xl); }
.cl-card__title { font: 500 var(--fs-base)/1.3 "Geist", sans-serif; color: var(--text-hi); margin: 0 0 var(--space-2xs); }
.cl-card__meta  { font: var(--fs-sm)/1.5 "Geist", sans-serif; color: var(--text-mid); margin: 0; }

.cl-text-tier { display: grid; grid-template-columns: 80px 1fr; gap: var(--space-sm); font: var(--fs-base)/1.5 "Geist", sans-serif; padding: var(--space-2xs) 0; }
.cl-text-tier__label { font: 500 var(--fs-2xs)/1 "Geist Mono", monospace; letter-spacing: 0.08em; color: var(--text-lo); text-transform: uppercase; padding-top: 5px; }
.cl-t-hi  { color: var(--text-hi); }
.cl-t     { color: var(--text); }
.cl-t-mid { color: var(--text-mid); }
.cl-t-lo  { color: var(--text-lo); }

.cl-chip { display: inline-block; font: 500 var(--fs-2xs)/1 "Geist", sans-serif; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.3rem 0.6rem; margin: 0 var(--space-2xs) var(--space-2xs) 0; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
.cl-chip--warm { color: var(--accent-warm); border: 1px solid var(--accent-warm-border); }
.cl-chip--warm-soft { color: var(--accent-warm-soft); border: 1px solid var(--accent-warm-soft-border); }
.cl-chip--cool { color: var(--accent-cool); border: 1px solid var(--accent-cool-border); background: var(--accent-cool-bg-medium); }
.cl-chip--danger { color: var(--accent-danger); border: 1px solid color-mix(in oklch, var(--accent-danger) 42%, transparent); }

.cl-row-sample { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-xl); padding: var(--space-md) 0; border-bottom: 1px solid var(--line); position: relative; transition: padding-left var(--duration-fast) var(--ease-default), background var(--duration-fast) var(--ease-default); }
.cl-row-sample::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--accent-warm); transform: scaleY(0); transform-origin: top; transition: transform var(--duration-base) var(--ease-default); }
.cl-row-sample:hover { padding-left: var(--space-md); background: var(--surface-raised); }
.cl-row-sample:hover::before { transform: scaleY(1); }
.cl-row-sample__title { font: 500 var(--fs-base)/1.3 "Geist", sans-serif; color: var(--text-hi); }
.cl-row-sample__meta  { font: var(--fs-sm)/1.3 "Geist", sans-serif; color: var(--text-mid); flex-shrink: 0; }

.cl-modal-hint { font: var(--fs-xs)/1.5 "Geist", sans-serif; color: var(--text-mid); padding: var(--space-md); border-left: 2px solid var(--accent-cool); background: var(--accent-cool-bg-soft); margin-bottom: var(--space-2xl); }
.cl-modal-hint code { font: var(--fs-xs)/1 "Geist Mono", monospace; color: var(--accent-warm); background: transparent; padding: 0 0.15rem; }

dialog.cl-dialog { border: 1px solid var(--accent-cool-border); background: var(--surface); color: var(--text); padding: var(--space-2xl); max-width: min(720px, calc(100vw - 4rem)); max-height: 80vh; overflow: auto; }
dialog.cl-dialog[open] { animation: cl-dialog-in var(--duration-base) var(--ease-default); }
dialog.cl-dialog[open]::backdrop { animation: cl-backdrop-in var(--duration-base) var(--ease-default); }
dialog.cl-dialog::backdrop { background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(2px); }
@keyframes cl-dialog-in { from { opacity: 0; transform: translateY(8px) scale(0.985); } to { opacity: 1; transform: none; } }
@keyframes cl-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
dialog.cl-dialog h3 { font: 500 var(--fs-xs)/1 "Geist", sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-cool); margin: 0 0 var(--space-md); }
dialog.cl-dialog pre { background: var(--surface-raised); color: var(--text-hi); padding: var(--space-md); font: var(--fs-xs)/1.5 "Geist Mono", monospace; white-space: pre-wrap; word-break: break-word; max-height: 50vh; overflow: auto; }
dialog.cl-dialog .cl-btn { margin-top: var(--space-md); }
dialog.cl-dialog .cl-dialog-actions { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); margin-top: var(--space-lg); }
dialog.cl-dialog .cl-dialog-status { font: var(--fs-xs)/1.4 "Geist Mono", monospace; color: var(--accent-cool); }

/* Brief flash on the Copy SCSS button so the click is visibly acknowledged */
.cl-btn.is-flashing { color: var(--accent-cool); border-color: var(--accent-cool-border); }
</style>

<div class="cl-modal-hint">
  Tweak token values; the whole site updates live. Overrides save to <code>localStorage</code> and persist across reloads. Use <strong>Copy SCSS</strong> to grab the values and paste back into <code>_sass/_themes.scss</code> when satisfied. <strong>Reset</strong> wipes overrides.
</div>

<div class="cl-toolbar">
  <button class="cl-btn" data-action="toggle-theme">Toggle theme</button>
  <button class="cl-btn" data-action="copy-scss">Copy SCSS</button>
  <button class="cl-btn" data-action="reset">Reset to defaults</button>
  <span class="cl-status" data-status>—</span>
</div>

<div class="cl-page">

  <section class="cl-section">
    <h2 class="cl-section__title">Surface tier</h2>
    <div class="cl-section__body">
      <div class="cl-section__editor" data-group-idx="0"></div>
      <div class="cl-section__preview">
        <p class="cl-preview-intro">Outer box is on <strong>--surface</strong>. The inner card is on <strong>--surface-raised</strong>.</p>
        <div class="cl-card">
          <p class="cl-card__title">Card title (raised surface)</p>
          <p class="cl-card__meta">Sample card body — meant to convey a subtle lift over the page surface, similar to a Codex card.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="cl-section">
    <h2 class="cl-section__title">Ink + text</h2>
    <div class="cl-section__body">
      <div class="cl-section__editor" data-group-idx="1"></div>
      <div class="cl-section__preview">
        <div class="cl-text-tier"><div class="cl-text-tier__label">--text-hi</div><div class="cl-t-hi">Primary heading-class text at full ink contrast.</div></div>
        <div class="cl-text-tier"><div class="cl-text-tier__label">--text</div><div class="cl-t">Body / paragraph text. Most ordinary content uses this tier.</div></div>
        <div class="cl-text-tier"><div class="cl-text-tier__label">--text-mid</div><div class="cl-t-mid">Metadata, secondary descriptions, captions.</div></div>
        <div class="cl-text-tier"><div class="cl-text-tier__label">--text-lo</div><div class="cl-t-lo">Faint elements — separators, dot indicators, low-emphasis labels.</div></div>
      </div>
    </div>
  </section>

  <section class="cl-section">
    <h2 class="cl-section__title">Brand accent (unified across modes)</h2>
    <div class="cl-section__body">
      <div class="cl-section__editor" data-group-idx="2"></div>
      <div class="cl-section__preview">
        <p style="margin: 0 0 var(--space-md);">
          <span class="cl-chip cl-chip--warm">accent-warm</span>
          <span class="cl-chip cl-chip--warm-soft">accent-warm-soft</span>
        </p>
        <p class="cl-preview-intro" style="margin: 0;">
          Inline <code>code text</code> uses <strong>--accent-warm</strong>. Hover stripes on list rows use the same token.
        </p>
      </div>
    </div>
  </section>

  <section class="cl-section">
    <h2 class="cl-section__title">Semantic (unified across modes)</h2>
    <div class="cl-section__body">
      <div class="cl-section__editor" data-group-idx="3"></div>
      <div class="cl-section__preview">
        <p style="margin: 0 0 var(--space-md);">
          <span class="cl-chip cl-chip--cool">accent-cool</span>
          <span class="cl-chip cl-chip--danger">accent-danger</span>
        </p>
        <p class="cl-preview-intro" style="margin: 0;">
          Section labels and status pills (the <code>SCHOLAR</code> / <code>FORTHCOMING</code> badges on the publications page) use <strong>--accent-cool</strong>. <strong>--accent-danger</strong> is reserved for future destructive UI.
        </p>
      </div>
    </div>
  </section>

  <section class="cl-section">
    <h2 class="cl-section__title">List row hover (uses surface-raised + accent-warm)</h2>
    <div class="cl-section__body">
      <div class="cl-section__editor cl-section__editor--note">
        No new editor controls here — this demo uses the tokens above. Hover any row: the left stripe paints with <strong style="color:var(--accent-warm);">--accent-warm</strong>, the row background lifts to <strong style="color:var(--accent-warm);">--surface-raised</strong>.
      </div>
      <div class="cl-section__preview">
        <div class="cl-row-sample"><div class="cl-row-sample__title">Senior Editor · Information Systems Research</div><div class="cl-row-sample__meta">2026–</div></div>
        <div class="cl-row-sample"><div class="cl-row-sample__title">Associate Editor · Production and Operations Management</div><div class="cl-row-sample__meta">2019–2025</div></div>
        <div class="cl-row-sample"><div class="cl-row-sample__title">Editorial Board · Journal of the Association for Information Systems</div><div class="cl-row-sample__meta">2017–2019</div></div>
      </div>
    </div>
  </section>

</div>

<dialog class="cl-dialog" id="cl-scss-dialog">
  <h3>Paste this into _sass/_themes.scss</h3>
  <p class="cl-preview-intro" style="margin: 0 0 var(--space-md);">Locate the <strong>:root</strong> block (dark/base) and the <strong>html[data-theme="light"]</strong> block. Replace the matching lines.</p>
  <pre id="cl-scss-output"></pre>
  <form method="dialog" class="cl-dialog-actions">
    <span class="cl-dialog-status" id="cl-dialog-status">—</span>
    <span style="display: flex; gap: var(--space-sm);">
      <button class="cl-btn" type="button" data-action="copy-again">Copy to clipboard</button>
      <button class="cl-btn" type="submit">Close</button>
    </span>
  </form>
</dialog>

<script>
(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────────
  // Tokens to expose. Each top-level entry maps to one section in the
  // page; the section's editor block uses data-group-idx="N" to receive
  // its rows. mode='split' shows separate dark+light pickers; 'unified'
  // shows one picker that applies to both modes.
  // ────────────────────────────────────────────────────────────────────
  var TOKEN_GROUPS = [
    { tokens: [
      { name: '--surface',        desc: 'Page background',         mode: 'split' },
      { name: '--surface-raised', desc: 'Cards, dropdowns, hover', mode: 'split' },
      { name: '--line',           desc: 'Dividers, borders',       mode: 'split' }
    ]},
    { tokens: [
      { name: '--ink',      desc: 'Highest-emphasis text (aliases --text-hi)', mode: 'split' },
      { name: '--text',     desc: 'Body / paragraph',                          mode: 'split' },
      { name: '--text-mid', desc: 'Metadata, secondary',                       mode: 'split' },
      { name: '--text-lo',  desc: 'Faint, separators',                         mode: 'split' }
    ]},
    { tokens: [
      { name: '--accent-warm',      desc: 'Primary: hover, links, active', mode: 'unified' },
      { name: '--accent-warm-soft', desc: 'Lighter coral; labels, badges', mode: 'unified' }
    ]},
    { tokens: [
      { name: '--accent-cool',   desc: 'Success / "added"',       mode: 'unified' },
      { name: '--accent-danger', desc: 'Destructive / "removed"', mode: 'unified' }
    ]}
  ];

  var STORAGE_KEY = 'cl-color-overrides';
  var STYLE_TAG_ID = 'cl-override-style';

  var overrides = loadOverrides();
  var defaults = {};

  function loadOverrides() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveOverrides() { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); }
  function getCurrentTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }

  function normalizeHex(value) {
    if (!value) return '#000000';
    value = value.trim();
    if (value.charAt(0) === '#') {
      if (value.length === 4) {
        return '#' + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2) + value.charAt(3) + value.charAt(3);
      }
      return value.length === 7 ? value.toLowerCase() : '#000000';
    }
    var rgb = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgb) {
      var toHex = function (n) { var h = Number(n).toString(16); return h.length === 1 ? '0' + h : h; };
      return '#' + toHex(rgb[1]) + toHex(rgb[2]) + toHex(rgb[3]);
    }
    return '#000000';
  }

  function captureDefaults() {
    var originalTheme = getCurrentTheme();
    ['dark', 'light'].forEach(function (mode) {
      document.documentElement.setAttribute('data-theme', mode);
      var computed = getComputedStyle(document.documentElement);
      TOKEN_GROUPS.forEach(function (group) {
        group.tokens.forEach(function (token) {
          var key = (token.mode === 'unified' ? 'unified' : mode) + '.' + token.name;
          if (defaults[key]) return;
          var raw = computed.getPropertyValue(token.name).trim();
          defaults[key] = normalizeHex(raw);
        });
      });
    });
    document.documentElement.setAttribute('data-theme', originalTheme);
  }

  function applyOverrides() {
    var tag = document.getElementById(STYLE_TAG_ID);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = STYLE_TAG_ID;
      document.head.appendChild(tag);
    }
    var dark = [], light = [], unified = [];
    Object.keys(overrides).forEach(function (key) {
      var parts = key.split('.');
      var scope = parts[0], name = parts.slice(1).join('.');
      var line = '  ' + name + ': ' + overrides[key] + ';';
      if (scope === 'dark') dark.push(line);
      else if (scope === 'light') light.push(line);
      else if (scope === 'unified') unified.push(line);
    });
    var css = '';
    if (unified.length) css += ':root, html[data-theme="dark"], html[data-theme="light"] {\n' + unified.join('\n') + '\n}\n';
    if (dark.length) css += ':root, html[data-theme="dark"] {\n' + dark.join('\n') + '\n}\n';
    if (light.length) css += 'html[data-theme="light"] {\n' + light.join('\n') + '\n}\n';
    tag.textContent = css;
  }

  function createEl(tag, opts) {
    var el = document.createElement(tag);
    if (opts) {
      if (opts.className) el.className = opts.className;
      if (opts.textContent) el.textContent = opts.textContent;
      if (opts.attrs) Object.keys(opts.attrs).forEach(function (k) { el.setAttribute(k, opts.attrs[k]); });
    }
    return el;
  }

  function renderEditor() {
    TOKEN_GROUPS.forEach(function (group, idx) {
      var host = document.querySelector('[data-group-idx="' + idx + '"]');
      if (!host) return;
      while (host.firstChild) host.removeChild(host.firstChild);
      group.tokens.forEach(function (token) { host.appendChild(buildRow(token)); });
    });
  }

  function buildRow(token) {
    var row = createEl('div', { className: 'cl-row' });
    var head = createEl('div', { className: 'cl-row__head' });
    head.appendChild(createEl('span', { textContent: token.name }));
    head.appendChild(createEl('span', { className: 'cl-row__desc', textContent: token.desc }));
    row.appendChild(head);
    var inputs = createEl('div', { className: 'cl-row__inputs' + (token.mode === 'unified' ? ' cl-row__inputs--unified' : '') });
    if (token.mode === 'split') {
      inputs.appendChild(buildInput(token.name, 'dark', 'Dark'));
      inputs.appendChild(buildInput(token.name, 'light', 'Light'));
    } else {
      inputs.appendChild(buildInput(token.name, 'unified', ''));
    }
    row.appendChild(inputs);
    return row;
  }

  function buildInput(tokenName, scope, label) {
    var wrap = createEl('label', { className: 'cl-input' });
    var key = scope + '.' + tokenName;
    var current = overrides[key] || defaults[key] || '#000000';

    if (label) wrap.appendChild(createEl('span', { className: 'cl-input__label', textContent: label }));

    var colorInput = createEl('input', { attrs: { type: 'color', value: current } });
    var hexInput = createEl('input', { attrs: { type: 'text', value: current, spellcheck: 'false', 'aria-label': tokenName + ' ' + (label || 'value') } });

    var apply = function (val, fromColor) {
      val = String(val).trim().toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(val)) {
        if (/^#[0-9a-f]{3}$/.test(val)) {
          val = '#' + val.charAt(1) + val.charAt(1) + val.charAt(2) + val.charAt(2) + val.charAt(3) + val.charAt(3);
        } else return;
      }
      overrides[key] = val;
      saveOverrides();
      applyOverrides();
      if (fromColor) hexInput.value = val; else colorInput.value = val;
      setStatus('Updated ' + tokenName + ' (' + scope + ')');
    };

    colorInput.addEventListener('input', function () { apply(colorInput.value, true); });
    hexInput.addEventListener('input', function () { apply(hexInput.value, false); });

    wrap.appendChild(colorInput);
    wrap.appendChild(hexInput);
    return wrap;
  }

  function setStatus(msg) {
    var el = document.querySelector('[data-status]');
    if (!el) return;
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.textContent = '—'; }, 2200);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;

    if (action === 'toggle-theme') {
      var cur = getCurrentTheme();
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      document.documentElement.setAttribute('data-theme-setting', next);
      setStatus('Theme: ' + next);
    }

    if (action === 'reset') {
      overrides = {};
      saveOverrides();
      applyOverrides();
      renderEditor();
      setStatus('Reset to defaults');
    }

    if (action === 'copy-scss') {
      btn.classList.add('is-flashing');
      setTimeout(function () { btn.classList.remove('is-flashing'); }, 420);
      var scss = buildScss();
      document.getElementById('cl-scss-output').textContent = scss;
      var dlg = document.getElementById('cl-scss-dialog');
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      copyToClipboard(scss);
    }

    if (action === 'copy-again') {
      copyToClipboard(document.getElementById('cl-scss-output').textContent);
    }
  });

  function buildScss() {
    var dark = [], light = [], unified = [];
    TOKEN_GROUPS.forEach(function (group) {
      group.tokens.forEach(function (token) {
        var label = padRight(token.name + ':', 24);
        if (token.mode === 'unified') {
          var v = overrides['unified.' + token.name] || defaults['unified.' + token.name];
          unified.push('  ' + label + v + ';');
        } else {
          var dv = overrides['dark.' + token.name] || defaults['dark.' + token.name];
          var lv = overrides['light.' + token.name] || defaults['light.' + token.name];
          dark.push('  ' + label + dv + ';');
          light.push('  ' + label + lv + ';');
        }
      });
    });
    return '// In :root (dark / base)\n' +
      ':root {\n' + dark.join('\n') + '\n' + unified.join('\n') + '\n}\n\n' +
      '// In html[data-theme="light"]\n' +
      'html[data-theme="light"] {\n' + light.join('\n') + '\n}\n';
  }

  function copyToClipboard(text) {
    var done = function (ok) {
      setDialogStatus(ok ? 'Copied to clipboard ✓' : 'Select all + ⌘C to copy');
      setStatus(ok ? 'Copied to clipboard' : 'Copy failed — select text manually');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(!!ok);
    } catch (e) { done(false); }
  }

  function setDialogStatus(msg) {
    var el = document.getElementById('cl-dialog-status');
    if (!el) return;
    el.textContent = msg;
  }

  function padRight(str, len) {
    while (str.length < len) str += ' ';
    return str;
  }

  captureDefaults();
  applyOverrides();
  renderEditor();
})();
</script>
