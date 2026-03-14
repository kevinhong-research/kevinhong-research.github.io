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

<div class="nh-research">
  <div id="talk-map-container"></div>
</div>

{% include talks_render.html %}

<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js"></script>
<script src="{{ '/assets/js/talkmap.js' | relative_url }}"></script>
