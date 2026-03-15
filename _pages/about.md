---
layout: about
title: about
permalink: /
subtitle: <a href='https://people.miami.edu/profile/f7508a21683d334770fe03a231e454a3'>University of Miami Herbert Business School</a>

profile:
  align: right
  image: prof_pic.jpeg
  image_circular: true # crops the image to make it circular
  more_info: >

news: false # includes a list of news items
selected_papers: false # includes a list of papers marked as "selected={true}"
social: false # includes social icons at the bottom of the page
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/about.css' | relative_url }}">

{% assign featured_papers = site.data.publications | where_exp: "pub", "pub.id == 'peer-awards-reddit' or pub.id == 'ridesharing-traffic-congestion'" %}

<div class="nh-paper-preview" id="nhPaperPreview" role="tooltip" aria-hidden="true">
  <div class="nh-paper-preview__eyebrow">Featured publication</div>
  <div class="nh-paper-preview__title"></div>
  <div class="nh-paper-preview__authors"></div>
  <div class="nh-paper-preview__meta"></div>
  <div class="nh-paper-preview__abstract"></div>
  <a class="nh-paper-preview__cta" href="#">
    <span class="nh-paper-preview__cta-icon" aria-hidden="true">↗</span>
    <span>Learn more about this paper</span>
  </a>
</div>

<script>
window.NH_FEATURED_PAPERS = {
  {% for pub in featured_papers %}
  {{ pub.id | jsonify }}: {
    id: {{ pub.id | jsonify }},
    title: {{ pub.title | jsonify }},
    authors: {{ pub.authors | jsonify }},
    journal: {{ pub.journal | jsonify }},
    year: {{ pub.year | jsonify }},
    volume: {{ pub.volume | default: "" | jsonify }},
    abstract: {{ pub.abstract | default: "" | jsonify }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
};
</script>

<div class="nh-terminal" id="nhTerminal">
  <span class="nh-terminal-prompt" id="nhPrompt">›</span>
  <span class="nh-terminal-text"   id="nhText"></span>
  <span class="nh-terminal-cursor" id="nhCursorT"></span>
</div>
<div class="nh-terminal" id="nhTerminal2">
  <span class="nh-terminal-prompt" id="nhPrompt2"></span>
  <span class="nh-terminal-text"   id="nhText2"></span>
  <span class="nh-terminal-cursor" id="nhCursorT2"></span>
</div>

I study how digital technology reshapes work, markets, and human behavior. My research — spanning `Future of Work`, `Digital Platforms`, `Digital Media`, and `Human-Algorithm Interactions` — has been published in *Management Science*, *Information Systems Research*, *MIS Quarterly*, *Production and Operations Management*, *INFORMS Journal on Computing*, and supported by grants from the *National Science Foundation* and the *Robert Wood Johnson Foundation*, among others.

My work has received sustained recognition across information systems and operations management. Most notably, my <a href="{{ '/publications/?paper=peer-awards-reddit' | relative_url }}" class="nh-paper-link" data-paper-id="peer-awards-reddit" aria-describedby="nhPaperPreview">paper</a> on peer awards and creative content won the `Management Science IS Best Paper Award` (2025), and my <a href="{{ '/publications/?paper=ridesharing-traffic-congestion' | relative_url }}" class="nh-paper-link" data-paper-id="ridesharing-traffic-congestion" aria-describedby="nhPaperPreview">paper</a> on ridesharing and traffic congestion won the `POM J. George Shanthikumar Best Data Science and E-Operations Paper Award` (2025). My dissertation on the gig economy received the `ACM SIGMIS Best Dissertation Award` and was runner-up for the `INFORMS ISS Nunamaker-Chen Dissertation Award`. I have also received the `AIS Early Career Award` (2018), the `INFORMS ISS Sandy Slaughter Early Career Award` (2019), the `W. P. Carey Faculty Research Award` (2017), and the `Associate Editor of the Year Award` from *Information Systems Research* (2018). Papers of mine have won best paper awards at the `ICIS` (2012, 2018, 2020, 2021), `INFORMS` (2021, 2024), `WISE` (2018), `HICSS` (2017), `AMCIS` (2012), and `CSWIM` (2018). According to the [AIS Research Rankings](https://www.aisresearchrankings.org/), I was ranked #1 globally in publications across *MISQ* and *ISR* for 2025, #5 for 2021–2023, and #7 for 2016–2018.

Before entering academia, I spent time as an analyst at a leading investment bank and as a language specialist for the International Olympics Committee. I continue to work closely with industry — advising technology companies including Freelancer, Alibaba, Livad, fits.me, Summer, Extole, Ookong, and Picmonic on digital transformation, large-scale data analytics, and experimentation.

When I am not doing research, I enjoy reading, writing code, and watching American football. I am an avid [Emacs](https://www.spacemacs.org/) user, a [typography](https://fontsinuse.com/) enthusiast, a frequent [Redditor](https://www.reddit.com/), and a `mechanical keyboard` designer and collector.
<script src="{{ '/assets/js/about.js' | relative_url }}"></script>
