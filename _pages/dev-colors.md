---
layout: page
permalink: /dev/colors/
title: Color Lab
description: Live editor for the design system color tokens. Tweak values, see the site update, copy back to _themes.scss when satisfied. Not linked from the public nav.
nav: false
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<style>
/* Color Lab — page-local styles. */
.cl-page {
  display: grid;
  grid-template-columns: minmax(0, 380px) 1fr;
  gap: var(--space-4xl, 2rem);
  align-items: start;
  margin-top: var(--space-2xl, 1.1rem);
}
@media (max-width: 900px) { .cl-page { grid-template-columns: 1fr; } }

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

.cl-editor { display: flex; flex-direction: column; gap: var(--space-2xl); }
.cl-group { display: flex; flex-direction: column; gap: var(--space-sm); }
.cl-group__title { font: 500 var(--fs-xs)/1 "Geist", sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-cool); margin: 0 0 var(--space-sm); }
.cl-row { display: grid; grid-template-columns: 1fr; gap: var(--space-2xs); padding: var(--space-md); border: 1px solid var(--line); background: var(--surface-raised); }
.cl-row__head { display: flex; align-items: baseline; gap: var(--space-sm); font: 500 var(--fs-sm)/1.3 "Geist Mono", monospace; color: var(--text-hi); margin-bottom: var(--space-2xs); }
.cl-row__desc { font: var(--fs-xs)/1.4 "Geist", sans-serif; color: var(--text-mid); flex: 1; font-weight: 400; letter-spacing: 0; text-transform: none; }
.cl-row__inputs { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); align-items: center; }
.cl-row__inputs--unified { grid-template-columns: 1fr; }
.cl-input { display: flex; align-items: center; gap: var(--space-2xs); }
.cl-input__label { font: var(--fs-2xs)/1 "Geist", sans-serif; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-lo); min-width: 32px; }
.cl-input input[type="color"] { width: 32px; height: 32px; border: 1px solid var(--line); border-radius: 0; padding: 0; background: transparent; cursor: pointer; }
.cl-input input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
.cl-input input[type="color"]::-webkit-color-swatch { border: none; }
.cl-input input[type="text"] { flex: 1; font: var(--fs-xs)/1 "Geist Mono", monospace; padding: var(--space-2xs) var(--space-sm); border: 1px solid var(--line); background: transparent; color: var(--text-hi); min-width: 0; }
.cl-input input[type="text"]:focus { outline: none; border-color: var(--accent-cool-border); }

.cl-preview { display: flex; flex-direction: column; gap: var(--space-xl); }
.cl-preview__section { border: 1px solid var(--line); background: var(--surface); padding: var(--space-xl); }
.cl-preview__section h3 { font: 500 var(--fs-xs)/1 "Geist", sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-cool); margin: 0 0 var(--space-md); }

.cl-card { background: var(--surface-raised); border: 1px solid var(--line); padding: var(--space-xl); margin-bottom: var(--space-sm); }
.cl-card__title { font: 500 var(--fs-base)/1.3 "Geist", sans-serif; color: var(--text-hi); margin: 0 0 var(--space-2xs); }
.cl-card__meta  { font: var(--fs-sm)/1.5 "Geist", sans-serif; color: var(--text-mid); margin: 0; }

.cl-row-sample { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-xl); padding: var(--space-md) 0; border-bottom: 1px solid var(--line); position: relative; transition: padding-left var(--duration-fast) var(--ease-default), background var(--duration-fast) var(--ease-default); }
.cl-row-sample::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--accent-warm); transform: scaleY(0); transform-origin: top; transition: transform var(--duration-base) var(--ease-default); }
.cl-row-sample:hover { padding-left: var(--space-md); background: var(--surface-raised); }
.cl-row-sample:hover::before { transform: scaleY(1); }
.cl-row-sample__title { font: 500 var(--fs-base)/1.3 "Geist", sans-serif; color: var(--text-hi); }
.cl-row-sample__meta  { font: var(--fs-sm)/1.3 "Geist", sans-serif; color: var(--text-mid); flex-shrink: 0; }

.cl-chip { display: inline-block; font: 500 var(--fs-2xs)/1 "Geist", sans-serif; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.3rem 0.6rem; margin-right: var(--space-2xs); clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
.cl-chip--warm { color: var(--accent-warm); border: 1px solid var(--accent-warm-border); }
.cl-chip--warm-soft { color: var(--accent-warm-soft); border: 1px solid var(--accent-warm-soft-border); }
.cl-chip--cool { color: var(--accent-cool); border: 1px solid var(--accent-cool-border); background: var(--accent-cool-bg-medium); }
.cl-chip--danger { color: var(--accent-danger); border: 1px solid color-mix(in oklch, var(--accent-danger) 42%, transparent); }

.cl-text-tier { display: grid; grid-template-columns: 80px 1fr; gap: var(--space-sm); font: var(--fs-base)/1.5 "Geist", sans-serif; padding: var(--space-2xs) 0; }
.cl-text-tier__label { font: 500 var(--fs-2xs)/1 "Geist Mono", monospace; letter-spacing: 0.08em; color: var(--text-lo); text-transform: uppercase; padding-top: 5px; }
.cl-t-hi  { color: var(--text-hi); }
.cl-t     { color: var(--text); }
.cl-t-mid { color: var(--text-mid); }
.cl-t-lo  { color: var(--text-lo); }

.cl-modal-hint { font: var(--fs-xs)/1.5 "Geist", sans-serif; color: var(--text-mid); padding: var(--space-md); border-left: 2px solid var(--accent-cool); background: var(--accent-cool-bg-soft); margin-bottom: var(--space-2xl); }
.cl-modal-hint code { font: var(--fs-xs)/1 "Geist Mono", monospace; color: var(--accent-warm); background: transparent; padding: 0 0.15rem; }

dialog.cl-dialog { border: 1px solid var(--line); background: var(--surface); color: var(--text); padding: var(--space-2xl); max-width: min(640px, calc(100vw - 4rem)); max-height: 80vh; overflow: auto; }
dialog.cl-dialog::backdrop { background: rgba(0, 0, 0, 0.6); }
dialog.cl-dialog h3 { font: 500 var(--fs-xs)/1 "Geist", sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-cool); margin: 0 0 var(--space-md); }
dialog.cl-dialog pre { background: var(--surface-raised); color: var(--text-hi); padding: var(--space-md); font: var(--fs-xs)/1.5 "Geist Mono", monospace; white-space: pre-wrap; word-break: break-word; max-height: 50vh; overflow: auto; }
dialog.cl-dialog .cl-btn { margin-top: var(--space-md); }
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
  <div class="cl-editor" id="cl-editor"></div>

  <div class="cl-preview">
    <div class="cl-preview__section">
      <h3>Surface tier</h3>
      <p class="cl-card__meta" style="margin: 0 0 var(--space-md);">Outer box is on <strong style="color:var(--accent-warm);">--surface</strong>. The inner card is on <strong style="color:var(--accent-warm);">--surface-raised</strong>.</p>
      <div class="cl-card">
        <p class="cl-card__title">Card title (raised surface)</p>
        <p class="cl-card__meta">Sample card body — meant to convey a subtle lift over the page surface, similar to a Codex card.</p>
      </div>
    </div>

    <div class="cl-preview__section">
      <h3>Text tier</h3>
      <div class="cl-text-tier"><div class="cl-text-tier__label">--text-hi</div><div class="cl-t-hi">Primary heading-class text at full ink contrast.</div></div>
      <div class="cl-text-tier"><div class="cl-text-tier__label">--text</div><div class="cl-t">Body / paragraph text. Most ordinary content uses this tier.</div></div>
      <div class="cl-text-tier"><div class="cl-text-tier__label">--text-mid</div><div class="cl-t-mid">Metadata, secondary descriptions, captions.</div></div>
      <div class="cl-text-tier"><div class="cl-text-tier__label">--text-lo</div><div class="cl-t-lo">Faint elements — separators, dot indicators, low-emphasis labels.</div></div>
    </div>

    <div class="cl-preview__section">
      <h3>Accents</h3>
      <p style="margin: 0 0 var(--space-md);">
        <span class="cl-chip cl-chip--warm">accent-warm</span>
        <span class="cl-chip cl-chip--warm-soft">accent-warm-soft</span>
        <span class="cl-chip cl-chip--cool">accent-cool</span>
        <span class="cl-chip cl-chip--danger">accent-danger</span>
      </p>
      <p style="font: var(--fs-sm)/1.5 'Geist', sans-serif; color: var(--text); margin: 0 0 var(--space-sm);">Inline <code>code text</code> uses <strong style="color:var(--accent-warm);">--accent-warm</strong>. Links like <a href="#" style="color: var(--accent-cool); text-decoration: underline; text-underline-offset: 0.16em;">this one</a> use <strong style="color:var(--accent-warm);">--accent-cool</strong>.</p>
    </div>

    <div class="cl-preview__section">
      <h3>List row hover</h3>
      <p style="font: var(--fs-sm)/1.5 'Geist', sans-serif; color: var(--text-mid); margin: 0 0 var(--space-md);">Hover any row — the left stripe is <strong style="color:var(--accent-warm);">--accent-warm</strong>, the row background lifts to <strong style="color:var(--accent-warm);">--surface-raised</strong>.</p>
      <div class="cl-row-sample"><div class="cl-row-sample__title">Senior Editor · Information Systems Research</div><div class="cl-row-sample__meta">2026–</div></div>
      <div class="cl-row-sample"><div class="cl-row-sample__title">Associate Editor · Production and Operations Management</div><div class="cl-row-sample__meta">2019–2025</div></div>
      <div class="cl-row-sample"><div class="cl-row-sample__title">Editorial Board · Journal of the Association for Information Systems</div><div class="cl-row-sample__meta">2017–2019</div></div>
    </div>
  </div>
</div>

<dialog class="cl-dialog" id="cl-scss-dialog">
  <h3>Paste this into _sass/_themes.scss</h3>
  <p style="font: var(--fs-xs)/1.5 'Geist', sans-serif; color: var(--text-mid); margin: 0 0 var(--space-md);">Locate the <strong style="color:var(--accent-warm);">:root</strong> block (for dark/base) and the <strong style="color:var(--accent-warm);">html[data-theme="light"]</strong> block. Replace the matching lines.</p>
  <pre id="cl-scss-output"></pre>
  <form method="dialog" style="text-align: right;">
    <button class="cl-btn">Close</button>
  </form>
</dialog>

<script>
(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────────
  // Tokens to expose. mode='split' shows separate dark+light pickers;
  // mode='unified' shows one picker that applies to both modes.
  // Add new tokens here to make them user-editable.
  // ────────────────────────────────────────────────────────────────────
  var TOKEN_GROUPS = [
    { title: 'Surface tier', tokens: [
      { name: '--surface',        desc: 'Page background',         mode: 'split' },
      { name: '--surface-raised', desc: 'Cards, dropdowns, hover', mode: 'split' },
      { name: '--line',           desc: 'Dividers, borders',       mode: 'split' }
    ]},
    { title: 'Ink + text', tokens: [
      { name: '--ink',      desc: 'Highest-emphasis text (aliases --text-hi)', mode: 'split' },
      { name: '--text',     desc: 'Body / paragraph',                          mode: 'split' },
      { name: '--text-mid', desc: 'Metadata, secondary',                       mode: 'split' },
      { name: '--text-lo',  desc: 'Faint, separators',                         mode: 'split' }
    ]},
    { title: 'Brand accent (unified across modes)', tokens: [
      { name: '--accent-warm',      desc: 'Primary: hover, links, active', mode: 'unified' },
      { name: '--accent-warm-soft', desc: 'Lighter coral; labels, badges', mode: 'unified' }
    ]},
    { title: 'Semantic (unified across modes)', tokens: [
      { name: '--accent-cool',   desc: 'Success / "added"',         mode: 'unified' },
      { name: '--accent-danger', desc: 'Destructive / "removed"',   mode: 'unified' }
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
    var root = document.getElementById('cl-editor');
    while (root.firstChild) root.removeChild(root.firstChild);
    TOKEN_GROUPS.forEach(function (group) {
      var grp = createEl('div', { className: 'cl-group' });
      grp.appendChild(createEl('h2', { className: 'cl-group__title', textContent: group.title }));
      group.tokens.forEach(function (token) { grp.appendChild(buildRow(token)); });
      root.appendChild(grp);
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
      var dark = [], light = [], unified = [];
      TOKEN_GROUPS.forEach(function (group) {
        group.tokens.forEach(function (token) {
          if (token.mode === 'unified') {
            var v = overrides['unified.' + token.name] || defaults['unified.' + token.name];
            unified.push('  ' + padRight(token.name, 22) + v + ';');
          } else {
            var dv = overrides['dark.' + token.name] || defaults['dark.' + token.name];
            var lv = overrides['light.' + token.name] || defaults['light.' + token.name];
            dark.push('  ' + padRight(token.name, 22) + dv + ';');
            light.push('  ' + padRight(token.name, 22) + lv + ';');
          }
        });
      });
      var scss =
        '// In :root (dark / base)\n' +
        ':root {\n' + dark.join('\n') + '\n' + unified.join('\n') + '\n}\n\n' +
        '// In html[data-theme="light"]\n' +
        'html[data-theme="light"] {\n' + light.join('\n') + '\n}\n';
      document.getElementById('cl-scss-output').textContent = scss;
      var dlg = document.getElementById('cl-scss-dialog');
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      if (navigator.clipboard) navigator.clipboard.writeText(scss).then(function () { setStatus('Copied to clipboard'); });
    }
  });

  function padRight(str, len) {
    while (str.length < len) str += ' ';
    return str;
  }

  captureDefaults();
  applyOverrides();
  renderEditor();
})();
</script>
