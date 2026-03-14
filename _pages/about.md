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

<!-- ── Terminal typing intro ───────────────────────────────────
     Plays once on first visit (localStorage key: nh_typed).
     On all return visits the line is hidden — never distracts.
──────────────────────────────────────────────────────────── -->
<style>
.nh-terminal {
  display: flex;
  align-items: center;
  font-family: "SFMono-Regular", "Fira Code", "Fira Mono",
               "Roboto Mono", ui-monospace, monospace;
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  height: 1.5em;
  margin-bottom: 1.4rem;
  user-select: none;
}
.nh-terminal-prompt {
  color: #00a060;
  margin-right: 0.55em;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.nh-terminal-prompt.nh-t-visible { opacity: 1; }
.nh-terminal-text { color: #4a4a4a; }
.nh-terminal-cursor {
  display: inline-block;
  width: 0.48em;
  height: 1.05em;
  background: #00a060;
  margin-left: 2px;
  vertical-align: text-bottom;
  border-radius: 1px;
  opacity: 0;
}
.nh-terminal-cursor.nh-t-visible { opacity: 1; }
.nh-terminal-cursor.nh-t-blink   { animation: nh-t-blink 1.1s step-end infinite; }
.nh-terminal-cursor.nh-t-hidden  { opacity: 0 !important; animation: none; }
@keyframes nh-t-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
.nh-terminal.nh-t-done { display: none; }
</style>

<div class="nh-terminal" id="nhTerminal">
  <span class="nh-terminal-prompt" id="nhPrompt">›</span>
  <span class="nh-terminal-text"   id="nhText"></span>
  <span class="nh-terminal-cursor" id="nhCursorT"></span>
</div>

I am a Professor of Business Technology, Miami Herbert Centennial Endowed Chair, and Associate Dean for Research at the [Miami Herbert Business School](https://www.herbert.miami.edu/about/miami-herbert-leadership/index.html), `University of Miami`. I currently serve as a Senior Editor at [Information Systems Research](https://pubsonline.informs.org/page/isre/editorial-board) and [Production and Operations Management](http://www.poms.org/journal/departments/). I recently co-edited a POM Special Issue on `Social Technologies in Operations`.

My research interests are in the areas of `Future of Work`, `Digital Platforms`, `Digital Media`, and `Human-Algorithm Interactions`. My research has been published in premier journals such as `Management Science`, `Information Systems Research`, `MIS Quarterly`, `Production and Operations Management`, `INFORMS Journal on Computing`, among others. My work has been supported by several prestigious grants, from the `Robert Wood Johnson Foundation`, the `National Science Foundation`, `NET Institute`, and the `Department of Education`.

My research papers have won a number of best paper awards at major conferences and journals, including the `Workshop on Information Systems and Economics` (2018), the `International Conference on Information Systems` (2012, 2018, 2020, 2021), `Hawaii International Conference on System Sciences` (2017), `INFORMS Annual Conference Information Systems Cluster` (2024), `INFORMS Annual Conference eBusiness Cluster` (2021), `America's Conference on Information Systems` (2012), and the `China Summer Workshop on Information Management` (2018). Most notably, my [paper](https://pubsonline.informs.org/doi/10.1287/mnsc.2021.4040) on how peer awards shape creative content generation won the `Management Science IS Best Paper Award` (2025) and [paper](https://journals.sagepub.com/doi/10.1111/poms.13530) on the nuanced role of ridesharing on traffic congestion won the `POM J. George Shanthikumar Best Data Science and E-Operations Paper Award` (2025). My dissertation research on the gig economy and future of work was awarded the `ACM SIGMIS Best Dissertation Award` and runner-up `INFORMS ISS Nunamaker-Chen Dissertation Award`. In 2017, I was awarded the college-wide `W. P. Carey Faculty Research Award` at Arizona State University. Further, I was awarded the `Association for Information Systems Early Career Award` (2018) and the `INFORMS Information Systems Society Sandy Slaughter Early Career Award` (2019). And I was awarded the `Associate Editor of the Year Award` (2018) from `Information Systems Research`. According to the [AIS Research Rankings](https://www.aisresearchrankings.org/rankings/), I was ranked #1 in the world based on publications in the top two information systems journals (*MISQ*, *ISR*) for 2025, #5 for 2021-2023 and #7 for 2016-2018.

Prior to my academic career, I have worked as an analyst at a leading investment bank and as a language specialist for the International Olympics Committee. Besides research and teaching as a faculty member, I serve as an advisor or external research scientist for a number of tech companies, primarily working with them on large-scale digital transformation, data analytics, and digital experimentation efforts. Some of my corporate research partners include Freelancer, Alibaba, Livad, fits.me, Summer, Ports America, Extole, Ookong, and Picmonic.

In my spare time, I enjoy reading books, writing codes, and watching American football games. I am an avid [Emacs](https://www.spacemacs.org/) user, a [typography](https://fontsinuse.com/) enthusiast, a frequent [Redditor](https://www.reddit.com/), and a `mechanical keyboard` designer and collector.

<script>
(function () {
  var KEY      = 'nh_typed';
  var FULL     = 'researcher \u00b7 professor \u00b7 builder';
  var CHAR_MS  = 44;   /* ms per character typed            */
  var PRE_MS   = 320;  /* pause before typing starts        */
  var BLINK_MS = 950;  /* cursor blink duration after done  */

  var wrap   = document.getElementById('nhTerminal');
  var prompt = document.getElementById('nhPrompt');
  var text   = document.getElementById('nhText');
  var cursor = document.getElementById('nhCursorT');
  if (!wrap) return;

  /* Return visitors: hide the line immediately, do nothing else */
  try {
    if (localStorage.getItem(KEY)) {
      wrap.classList.add('nh-t-done');
      return;
    }
  } catch (_) {}

  /* First visit: run the animation */
  function run() {
    setTimeout(function () {
      prompt.classList.add('nh-t-visible');
      cursor.classList.add('nh-t-visible');

      var i  = 0;
      var iv = setInterval(function () {
        text.textContent = FULL.slice(0, i + 1);
        i++;
        if (i >= FULL.length) {
          clearInterval(iv);
          cursor.classList.add('nh-t-blink');
          setTimeout(function () {
            cursor.classList.add('nh-t-hidden');
            try { localStorage.setItem(KEY, '1'); } catch (_) {}
          }, BLINK_MS);
        }
      }, CHAR_MS);
    }, PRE_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
</script>
