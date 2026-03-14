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
  <!-- Single view-toggle button: shows what you'll switch TO.
       Sits at far-right via margin-left:auto in CSS. -->
  <button class="view-toggle-btn" id="viewToggleBtn" data-current="list" title="Switch to timeline view">
    <svg class="vtb-icon vtb-icon--timeline" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <line x1="6.5" y1="1" x2="6.5" y2="12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="6.5" y1="3"  x2="11.5" y2="3"  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="6.5" y1="6.5" x2="11.5" y2="6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="6.5" y1="10" x2="11.5" y2="10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="6.5" cy="3"   r="1.8" fill="currentColor"/>
      <circle cx="6.5" cy="6.5" r="1.8" fill="currentColor"/>
      <circle cx="6.5" cy="10"  r="1.8" fill="currentColor"/>
    </svg>
    <svg class="vtb-icon vtb-icon--list" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style="display:none">
      <line x1="4" y1="2.5"  x2="12.5" y2="2.5"  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="4" y1="6.5"  x2="12.5" y2="6.5"  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="4" y1="10.5" x2="12.5" y2="10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="1.8" cy="2.5"  r="1.5" fill="currentColor"/>
      <circle cx="1.8" cy="6.5"  r="1.5" fill="currentColor"/>
      <circle cx="1.8" cy="10.5" r="1.5" fill="currentColor"/>
    </svg>
    <span class="vtb-label" id="viewToggleLabel">Timeline</span>
  </button>
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
