---
layout: page
permalink: /football/
title: football
description: A map of visited FBS schools, stadiums, and a few favorite college football memories.
nav: true
nav_order: 4
---

<link rel="stylesheet" href="{{ '/assets/css/football.css' | relative_url }}?v={{ site.time | date: '%Y%m%d%H%M' }}">

<div class="fb-page">
  <p class="fb-intro">
    College football is one of the great spectacles in my life: a world of regional identity,
    strategy, tradition, pageantry, noise, and complete chaos. I follow the sport closely, and
    whenever I travel for a research talk, I make a point of visiting the host school's stadium.
    This map tracks the Power 4 FBS campuses I have visited, along with stadium snapshots, national
    championship history, and a few players and coaches who make each stop memorable.
  </p>

  <script>
  window.FOOTBALL_OVERRIDES = {
    {% for school in site.data.football %}
    {{ school.school | jsonify }}: {
      "school":           {{ school.school | jsonify }},
      "football_name":    {{ school.football_name | default: "" | jsonify }},
      "logo":             {% if school.logo %}{{ school.logo | relative_url | jsonify }}{% else %}""{% endif %},
      "stadium":          {{ school.stadium | default: "" | jsonify }},
      "stadium_image":    {% if school.stadium_image %}{{ school.stadium_image | relative_url | jsonify }}{% else %}""{% endif %},
      "city":             {{ school.city | default: "" | jsonify }},
      "state":            {{ school.state | default: "" | jsonify }},
      "conference":       {{ school.conference | default: "" | jsonify }},
      "head_coach":       {{ school.head_coach | default: "" | jsonify }},
      "lat":              {{ school.lat | default: nil | jsonify }},
      "lng":              {{ school.lng | default: nil | jsonify }},
      "championships":    {{ school.championships | jsonify }},
      "favorite_players": {{ school.favorite_players | jsonify }},
      "note":             {{ school.note | default: "" | jsonify }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  };

  window.FOOTBALL_MAP_DATA = [
    {% for talk in site.data.talks %}
      {% if talk.lat and talk.logo and talk.logo contains '/assets/img/talk-logos/fbs-library/' %}
      {
        "school":           {{ talk.institution | jsonify }},
        "football_name":    {{ talk.football_name | default: "" | jsonify }},
        "logo":             {{ talk.logo | relative_url | jsonify }},
        "stadium":          "",
        "stadium_image":    "",
        "city":             "",
        "state":            "",
        "conference":       "",
        "head_coach":       "",
        "lat":              {{ talk.lat | jsonify }},
        "lng":              {{ talk.lng | jsonify }},
        "championships":    [],
        "favorite_players": [],
        "note":             ""
      }{% unless forloop.last %},{% endunless %}
      {% endif %}
    {% endfor %}
  ];
  </script>

  <div class="fb-pills" id="football-map-toggle" role="button" aria-expanded="true" tabindex="0">
    <div class="fb-pill fb-pill--green">
      <span class="fb-pill-n" id="fb-count-schools">0</span>
      <span class="fb-pill-l">Power 4 Schools Visited</span>
    </div>
    <div class="fb-pill-sep"></div>
    <div class="fb-pill fb-pill--orange">
      <span class="fb-pill-n" id="fb-count-titles">0</span>
      <span class="fb-pill-l">titles</span>
    </div>
    <div class="fb-pill-sep"></div>
    <div class="fb-pill fb-pill--geo">
      <span class="fb-pill-l" id="fb-pill-hint-geo">Hide the Map</span>
    </div>
  </div>

  <div class="fb-body fb-body--open" id="football-map-body">
    <div class="fb-body-inner">
      <div id="football-map-container"></div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js"></script>
<script src="{{ '/assets/js/footballmap.js' | relative_url }}?v={{ site.time | date: '%Y%m%d%H%M' }}"></script>
