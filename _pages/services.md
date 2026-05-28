---
layout: page
permalink: /services/
title: services
description: Editorial services, professional activities, and student advising.
nav: true
nav_order: 4
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url | bust_file_cache }}">
<link rel="stylesheet" href="{{ '/assets/css/services.css' | relative_url | bust_file_cache }}">

{% include services_render.html %}

<script>
document.addEventListener('DOMContentLoaded', () => {
  /* Scroll-reveal: fade + lift sections into view as the user scrolls.
     EXCEPTION: sections already visible at first paint should appear
     instantly — animating above-the-fold content on page load is jarring.
     The .nh-reveal-instant class disables the transition so adding
     .nh-visible alongside it snaps to the final state without animation. */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(x => {
      if (x.isIntersecting) {
        x.target.classList.add('nh-visible');
        obs.unobserve(x.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.nh-reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
    if (inViewport) {
      el.classList.add('nh-reveal-instant', 'nh-visible');
    } else {
      obs.observe(el);
    }
  });
});
</script>
