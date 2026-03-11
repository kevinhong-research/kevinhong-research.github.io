---
layout: page
permalink: /publications/
title: publications
description: Selected publications in <a href='https://jsom.utdallas.edu/the-utd-top-100-business-school-research-rankings/list-of-journals' target='_blank' class='header-link'>UTD-24 journals</a>, using this <a href='https://nihuang.me/research/' target='_blank' class='header-link'>template style</a>.
nav: false
nav_order: 2
---

<!-- Cursor elements (referenced by research.js) -->
<!-- <div id="nhCursor"></div>
<div id="nhCursorRing"></div> -->

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">

<div class="nh-research">

  <div class="scholar-bar">
  <a href="https://scholar.google.com/citations?user=VwQmUFQAAAAJ" 
     target="_blank" class="scholar-btn">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5h3.6v8.4h4.8V12h7.2v5.9h4.8V9.5H24z"/>
    </svg>
    Google Scholar
  </a>
  </div>

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
