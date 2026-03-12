---
layout: page
permalink: /services/
title: services
description: Editorial services, professional activities, and student advising.
nav: true
nav_order: 3
---

<link rel="stylesheet" href="{{ '/assets/css/research.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/services.css' | relative_url }}">

{% include services_render.html %}

<script>
document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(x => {
      if (x.isIntersecting) {
        x.target.classList.add('nh-visible');
        obs.unobserve(x.target);
      }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.nh-reveal').forEach(r => obs.observe(r));
});
</script>
