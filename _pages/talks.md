---
layout: page
permalink: /talks/
title: talks
description: Previous and upcoming invited research talks.
nav: true
nav_order: 2
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/talks.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/talkmap.css' | relative_url }}">

<!-- Serialize US talks (those with lat/lng) from talks.yml into JS.
     To add a talk to the map: add lat/lng to its entry in talks.yml.
     No JS changes needed — the map updates automatically on deploy. -->
<script>
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

<!-- Toggle bar — collapsed by default, expands to show the US map -->
<div class="nh-research">
  <div id="talk-map-toggle" class="tm-toggle" role="button" aria-expanded="false" tabindex="0">
    <div class="tm-toggle-left">
      <svg class="tm-toggle-chevron" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="tm-toggle-title">Invited Research Talks in the United States</span>
    </div>
    <span class="tm-toggle-meta" id="tm-toggle-meta"></span>
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
<script src="{{ '/assets/js/talkmap.js' | relative_url }}"></script>
