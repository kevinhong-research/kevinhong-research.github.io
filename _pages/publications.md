---
layout: page
permalink: /publications/
title: publications
description: Selected publications in <a href='https://jsom.utdallas.edu/the-utd-top-100-business-school-research-rankings/list-of-journals' target='_blank' class='header-link' style='color:#00a060;'>UTD-24 journals</a>, using this <a href='https://nihuang.me/research/' target='_blank' class='header-link' style='color:#00a060;'>template style</a>.
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
  <button class="filter-btn" data-filter="Future of Work">Future of Work</button>
  <button class="filter-btn" data-filter="Digital Platforms">Digital Platforms</button>
  <button class="filter-btn" data-filter="Digital Media">Digital Media</button>
  <button class="filter-btn" data-filter="Human-AI Interaction">Human-AI Interaction</button>
  <span class="filter-count" id="filterCount"></span>
  <div class="view-toggle" role="group" aria-label="View mode">
    <button class="view-btn view-btn--active" id="viewBtnList" data-view="list" title="List view">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <line x1="4.5" y1="2.5"  x2="13" y2="2.5"  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="4.5" y1="7"    x2="13" y2="7"    stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="4.5" y1="11.5" x2="13" y2="11.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="2" cy="2.5"  r="1.1" fill="currentColor"/>
        <circle cx="2" cy="7"    r="1.1" fill="currentColor"/>
        <circle cx="2" cy="11.5" r="1.1" fill="currentColor"/>
      </svg>
      List
    </button>
    <button class="view-btn" id="viewBtnTimeline" data-view="timeline" title="Timeline view">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <line x1="7" y1="1"  x2="7" y2="13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="7" y1="3"  x2="12" y2="3"  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="7" y1="7"  x2="12" y2="7"  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="7" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="7" cy="3"  r="2" fill="currentColor" stroke="none"/>
        <circle cx="7" cy="7"  r="2" fill="currentColor" stroke="none"/>
        <circle cx="7" cy="11" r="2" fill="currentColor" stroke="none"/>
      </svg>
      Timeline
    </button>
  </div>
</div>

  <!-- List view — populated by research.js -->
  <div class="pub-list" id="pubList"></div>

  <!-- Timeline view — populated by research.js, hidden by default -->
  <div class="pub-timeline" id="timelineList" aria-hidden="true"></div>

</div><!-- end .nh-research -->

<!-- Pass Jekyll data to JS as a plain JSON array -->
<script>
window.PUBLICATIONS = [
  {% for pub in site.data.publications %}
  {
    "title":       {{ pub.title       | jsonify }},
    "url":         {{ pub.url         | jsonify }},
    "doi":         {{ pub.doi         | default: "" | jsonify }},
    "authors":     {{ pub.authors     | jsonify }},
    "journal":     {{ pub.journal     | jsonify }},
    "year":        {{ pub.year        | jsonify }},
    "volume":      {{ pub.volume      | default: "" | jsonify }},
    "forthcoming": {{ pub.forthcoming | default: false | jsonify }},
    "topics":      {{ pub.topics | jsonify | default: "[]" }},
    "abstract":    {{ pub.abstract    | default: "" | jsonify }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];
</script>

<script src="{{ '/assets/js/research.js' | relative_url }}"></script>
