---
layout: page
permalink: /talks/
title: talks
description: Previous and upcoming invited research talks.
nav: true
nav_order: 3
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/talks.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/talkmap.css' | relative_url }}?v={{ site.time | date: '%Y%m%d%H%M' }}">

<!-- Pill strip styles inlined to guarantee rendering regardless of asset path.
     The map-specific styles (states, tooltip, animation) stay in talkmap.css. -->
<style>
.tm-pills {
  display: flex !important;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0.7rem 0 0.7rem 0;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: relative;
  cursor: pointer;
  transition: padding-left 0.22s ease;
  user-select: none;
  margin-bottom: 0;
}
.tm-pills::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0; width: 2px;
  background: #D97757;
  transform: scaleY(0); transform-origin: top;
  transition: transform 0.25s ease;
}
.tm-pills:hover, .tm-pills:focus-visible { padding-left: 10px; outline: none; }
.tm-pills:hover::before,
.tm-pills:focus-visible::before,
.tm-pills--open::before { transform: scaleY(1); }

.tm-pill {
  display: inline-flex !important;
  align-items: baseline;
  gap: 0.32rem;
  padding: 0.25rem 0.85rem 0.25rem 0.75rem;
  border: 1px solid #3A3A36;
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
  transition: border-color 0.2s ease, background 0.2s ease;
  flex-shrink: 0;
  line-height: 1;
  background: transparent;
  text-decoration: none;
  font-family: inherit;
}
.tm-pills:hover .tm-pill,
.tm-pills--open .tm-pill {
  border-color: rgba(217,119,87,0.18);
  background: rgba(217,119,87,0.04);
}
.tm-pill-n {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  color: #3A3A36;
  letter-spacing: 0;
  line-height: 1;
  transition: color 0.2s;
  font-style: normal;
}
.tm-pill-l {
  font-size: 0.68rem !important;
  font-weight: 400 !important;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #3A3A36;
  transition: color 0.2s;
  font-style: normal;
}
.tm-pill--green .tm-pill-l,
.tm-pill--orange .tm-pill-l {
  color: var(--text-lo);
}
.tm-pill--green .tm-pill-n { color: #00a060; }
.tm-pill--orange .tm-pill-n { color: #D97757; }
.tm-pill--geo .tm-pill-l { color: var(--green-hi); letter-spacing: 0.08em; }
.tm-pills:hover .tm-pill--green .tm-pill-n,
.tm-pills--open .tm-pill--green .tm-pill-n { color: #00c070; }
.tm-pills:hover .tm-pill--orange .tm-pill-n,
.tm-pills--open .tm-pill--orange .tm-pill-n  { color: #c85a42; }
.tm-pills:hover .tm-pill--geo .tm-pill-l,
.tm-pills--open .tm-pill--geo .tm-pill-l { color: #D97757; }

.tm-pill-sep {
  display: inline-block !important;
  width: 3px; height: 3px; border-radius: 50%;
  background: rgba(58,58,54,0.6);
  flex-shrink: 0;
  transition: background 0.2s;
  align-self: center;
}
.tm-pills:hover .tm-pill-sep,
.tm-pills--open .tm-pill-sep { background: rgba(255,255,255,0.13); }

.tm-pill-hint {
  display: inline-block !important;
  margin-left: auto;
  font-size: 0.68rem !important;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #272727;
  white-space: nowrap;
  padding-right: 2px;
  flex-shrink: 0;
  transition: color 0.2s;
  font-style: normal;
}
.tm-pills:hover .tm-pill-hint { color: #3a3a3a; }
.tm-pills--open .tm-pill-hint { color: #444; }
</style>

<!-- ALL talks count (not just US) — separate from TALKMAP_DATA which is US-only.
     Add lat/lng to a talks.yml entry to make it appear on the map.
     These counts update automatically on every deploy. -->
<script>
window.TALKMAP_ALL_TOTAL    = {{ site.data.talks | size }};
window.TALKMAP_ALL_UPCOMING = {{ site.data.talks | where: "upcoming", true | size }};
window.TALKMAP_DATA = [
  {% assign us_talks = site.data.talks | where_exp: "t", "t.lat" %}
  {% for t in us_talks %}
  {
    "institution": {{ t.institution | jsonify }},
    "venue":       {{ t.venue      | default: "" | jsonify }},
    "date":        {{ t.date       | jsonify }},
    "upcoming":    {{ t.upcoming   | default: false | jsonify }},
    "lat":         {{ t.lat        | jsonify }},
    "lng":         {{ t.lng        | jsonify }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];
</script>

<!-- Pill strip toggle + collapsible map -->
<div class="nh-research">

  <div class="tm-pills" id="talk-map-toggle" role="button" aria-expanded="false" tabindex="0">
    <div class="tm-pill tm-pill--green">
      <span class="tm-pill-n" id="tm-count-total">—</span>
      <span class="tm-pill-l">talks</span>
    </div>
    <div class="tm-pill-sep"></div>
    <div class="tm-pill tm-pill--orange" id="tm-pill-upcoming">
      <span class="tm-pill-n" id="tm-count-upcoming">—</span>
      <span class="tm-pill-l">upcoming</span>
    </div>
    <div class="tm-pill-sep" id="tm-sep-geo"></div>
    <div class="tm-pill tm-pill--geo">
      <span class="tm-pill-l" id="tm-pill-hint-geo">View US Talks on Map</span>
    </div>
  </div>

  <div class="tm-body" id="talk-map-body">
    <div class="tm-body-inner">
      <div id="talk-map-container"></div>
    </div>
  </div>

</div>

{% include talks_render.html %}

<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js"></script>
<script src="{{ '/assets/js/talkmap.js' | relative_url }}?v={{ site.time | date: '%Y%m%d%H%M' }}"></script>
