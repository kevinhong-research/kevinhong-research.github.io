---
layout: page
permalink: /publications/
title: publications
description: publications in reversed chronological order, using this <a href='https://nihuang.me/research/' target='_blank'>Template</a>.
nav: false
nav_order: 2
---

<!-- Cursor elements (referenced by research.js) -->
<div id="nhCursor"></div>
<div id="nhCursorRing"></div>

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<div class="nh-research"><div>

  <div class="filter-bar">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="ISR">ISR</button>
        <button class="filter-btn" data-filter="MISQ">MISQ</button>
        <button class="filter-btn" data-filter="MS">MS</button>
        <button class="filter-btn" data-filter="POM">POM</button>
        <button class="filter-btn" data-filter="IJOC">IJOC</button>
        <span class="filter-count" id="filterCount"></span>
      </div>

      <!-- Populated by research.js via window.PUBLICATIONS -->
  <div class="pub-list" id="pubList"></div>

  </div>
  </div>

</div><!-- end .nh-research -->

<!-- Pass Jekyll data to JS as a plain JSON array -->
<script>
window.PUBLICATIONS = [
  {% for pub in site.data.publications %}
  {
    "title":       {{ pub.title       | jsonify }},
    "url":         {{ pub.url         | jsonify }},
    "authors":     {{ pub.authors     | jsonify }},
    "journal":     {{ pub.journal     | jsonify }},
    "year":        {{ pub.year        | jsonify }},
    "volume":      {{ pub.volume      | default: "" | jsonify }},
    "forthcoming": {{ pub.forthcoming | default: false | jsonify }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];
</script>

<script src="{{ '/assets/js/research.js' | relative_url }}"></script>
