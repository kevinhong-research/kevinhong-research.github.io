---
layout: page
permalink: /publications/
title: publications
description: Selected publications in UTD-24 journals and related outlets.
nav: true
nav_order: 1
dropdown: true
children:
  - title: publications
    permalink: /publications/
  - title: working papers
    permalink: /working/
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
  <div class="pub-search-field">
    <input
      class="pub-search-input"
      id="pubSearchInput"
      type="search"
      inputmode="search"
      placeholder="Search title, author, journal, or year"
      autocomplete="off"
      spellcheck="false">
    <button class="pub-search-clear" id="pubSearchClear" type="button" hidden>Clear</button>
  </div>
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

  <div class="pub-results-bar">
    <div class="pub-results-count" id="pubResultsCount" aria-live="polite"></div>
    <button class="pub-results-reset" id="pubResultsReset" type="button" hidden>Reset</button>
  </div>

  <div class="pub-empty-state" id="pubEmptyState" hidden>
    <p class="pub-empty-state__title">No publications match the current search or filter.</p>
    <button class="pub-empty-state__action" id="pubEmptyReset" type="button">Reset search and filter</button>
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
    "id":          {{ pub.id          | default: "" | jsonify }},
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
