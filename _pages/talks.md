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
     Pill counts and map data are both derived from this array at runtime. -->
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

<!-- Pill strip toggle + collapsible map -->
<div class="nh-research">

  <div class="tm-pills" id="talk-map-toggle" role="button" aria-expanded="false" tabindex="0">
    <div class="tm-pill tm-pill--green">
      <span class="tm-pill-n" id="tm-count-total">—</span>
      <span class="tm-pill-l">talks</span>
    </div>
    <div class="tm-pill-sep"></div>
    <div class="tm-pill tm-pill--blue" id="tm-pill-upcoming">
      <span class="tm-pill-n" id="tm-count-upcoming">—</span>
      <span class="tm-pill-l">upcoming</span>
    </div>
    <div class="tm-pill-sep"></div>
    <div class="tm-pill tm-pill--geo">
      <span class="tm-pill-l">United States</span>
    </div>
    <span class="tm-pill-hint" id="tm-pill-hint">View map</span>
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
