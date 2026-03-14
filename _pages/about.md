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
#nhTerminal2 {
  margin-top: -0.8rem;
}
.nh-terminal-prompt {
  color: #00a060;
  margin-right: 0.55em;
  opacity: 0;
  transition: opacity 0.2s ease;
}
/* remove spacing for second line since chevron removed */
#nhPrompt2 {
  margin-right: 0;
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

/* Pulsing live dot before the "Currently" line */
#nhTerminal2::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00a060;
  margin-right: 0.6em;
  flex-shrink: 0;
  animation: nh-pulse 2.2s ease-in-out infinite;
}
@keyframes nh-pulse {
  0%, 100% { opacity: 1;   transform: scale(1);    }
  50%       { opacity: 0.3; transform: scale(0.75); }
}

/* Research area tags — orange diamond badges matching filter buttons */
article code.nh-topic-link,
.post-content code.nh-topic-link {
  display: inline-block !important;
  cursor: pointer !important;
  font-size: 0.78em !important;
  font-weight: 500 !important;
  letter-spacing: 0.06em !important;
  text-transform: none !important;
  font-family: inherit !important;
  color: #F47321 !important;
  background: rgba(244, 115, 33, 0.08) !important;
  border: 1px solid rgba(244, 115, 33, 0.35) !important;
  border-radius: 0 !important;
  padding: 0.08em 0.55em !important;
  clip-path: polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%) !important;
  transition: background 0.2s, border-color 0.2s, color 0.2s !important;
  text-decoration: none !important;
  white-space: nowrap;
}
article code.nh-topic-link:hover,
.post-content code.nh-topic-link:hover {
  color: #F47321 !important;
  background: rgba(244, 115, 33, 0.15) !important;
  border-color: rgba(244, 115, 33, 0.6) !important;
}
</style>

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

My work has received sustained recognition across information systems and operations management. Most notably, my [paper](https://pubsonline.informs.org/doi/10.1287/mnsc.2021.4040) on peer awards and creative content won the `Management Science IS Best Paper Award` (2025), and my [paper](https://journals.sagepub.com/doi/10.1111/poms.13530) on ridesharing and traffic congestion won the `POM J. George Shanthikumar Best Data Science and E-Operations Paper Award` (2025). My dissertation on the gig economy received the `ACM SIGMIS Best Dissertation Award` and was runner-up for the `INFORMS ISS Nunamaker-Chen Dissertation Award`. I have also received the `AIS Early Career Award` (2018), the `INFORMS ISS Sandy Slaughter Early Career Award` (2019), the `W. P. Carey Faculty Research Award` (2017), and the `Associate Editor of the Year Award` from *Information Systems Research* (2018). Papers of mine have won best paper awards at the `ICIS` (2012, 2018, 2020, 2021), `INFORMS` (2021, 2024), `WISE` (2018), `HICSS` (2017), `AMCIS` (2012), and `CSWIM` (2018). According to the [AIS Research Rankings](https://www.aisresearchrankings.org/rankings/), I was ranked #1 globally in publications across *MISQ* and *ISR* for 2025, #5 for 2021–2023, and #7 for 2016–2018.

Before entering academia, I spent time as an analyst at a leading investment bank and as a language specialist for the International Olympics Committee. I continue to work closely with industry — advising technology companies including Freelancer, Alibaba, Livad, fits.me, Summer, Extole, Ookong, and Picmonic on digital transformation, large-scale data analytics, and experimentation.

When I am not doing research, I enjoy reading, writing code, and watching American football. I am an avid [Emacs](https://www.spacemacs.org/) user, a [typography](https://fontsinuse.com/) enthusiast, a frequent [Redditor](https://www.reddit.com/), and a `mechanical keyboard` designer and collector.

<script>
(function () {
  var KEY      = 'nh_typed';
  var CHAR_MS  = 44;
  var PRE_MS   = 320;
  var PAUSE_MS = 480;  /* pause between line 1 finishing and line 2 starting */
  var BLINK_MS = 950;
  var TTL      = 24 * 60 * 60 * 1000;

  var LINE1 = 'researcher \u00b7 professor \u00b7 builder';
  var LINE2 = 'Currently: Senior Editor, ISR \u00b7 Centennial Endowed Chair \u00b7 Assoc. Dean';
  /* The substring to linkify after line 2 finishes typing */
  var ISR_TEXT = 'ISR';
  var ISR_HREF = 'https://pubsonline.informs.org/page/isre/editorial-board';

  /* Elements — line 1 */
  var prompt1 = document.getElementById('nhPrompt');
  var text1   = document.getElementById('nhText');
  var cursor1 = document.getElementById('nhCursorT');
  /* Elements — line 2 */
  var prompt2 = document.getElementById('nhPrompt2');
  var text2   = document.getElementById('nhText2');
  var cursor2 = document.getElementById('nhCursorT2');
  if (!prompt1 || !prompt2) return;

  function hasRunRecently() {
    try {
      var ts = localStorage.getItem(KEY);
      return ts && (Date.now() - Number(ts)) < TTL;
    } catch (_) { return false; }
  }

  /* Inject ISR link into line 2 text node after typing completes */
  function linkifyISR() {
    var full = text2.textContent;
    var idx  = full.indexOf(ISR_TEXT);
    if (idx === -1) return;

    /* Split into three text nodes around the link */
    var before = document.createTextNode(full.slice(0, idx));
    var link   = document.createElement('a');
    link.href        = ISR_HREF;
    link.target      = '_blank';
    link.rel         = 'noopener';
    link.textContent = ISR_TEXT;
    link.style.cssText = 'color:#00a060;text-decoration:none;border-bottom:1px solid rgba(0,160,96,0.3);transition:border-color 0.2s,color 0.2s';
    link.addEventListener('mouseenter', function() {
      this.style.color = '#00c07a';
      this.style.borderBottomColor = 'rgba(0,160,96,0.7)';
    });
    link.addEventListener('mouseleave', function() {
      this.style.color = '#00a060';
      this.style.borderBottomColor = 'rgba(0,160,96,0.3)';
    });
    var after = document.createTextNode(full.slice(idx + ISR_TEXT.length));

    text2.textContent = '';
    text2.appendChild(before);
    text2.appendChild(link);
    text2.appendChild(after);
  }

  /* Type a single line, call done() when finished */
  function typeLine(textEl, cursorEl, promptEl, str, onDone) {
    promptEl.classList.add('nh-t-visible');
    cursorEl.classList.add('nh-t-visible');
    var i = 0;
    var iv = setInterval(function () {
      textEl.textContent = str.slice(0, i + 1);
      i++;
      if (i >= str.length) {
        clearInterval(iv);
        if (onDone) onDone(cursorEl);
      }
    }, CHAR_MS);
  }

  /* Blink cursor briefly then hide it, call cb when done */
  function blinkAndHide(cursorEl, cb) {
    cursorEl.classList.add('nh-t-blink');
    setTimeout(function () {
      cursorEl.classList.remove('nh-t-blink');
      cursorEl.classList.add('nh-t-hidden');
      if (cb) cb();
    }, BLINK_MS);
  }

  /* Static display (return visits within TTL) */
  function showStatic() {
    prompt1.classList.add('nh-t-visible');
    text1.textContent = LINE1;

    prompt2.classList.add('nh-t-visible');
    text2.textContent = LINE2;
    linkifyISR();
  }

  /* Animated display — line 1, pause, line 2, linkify */
  function run() {
    setTimeout(function () {
      typeLine(text1, cursor1, prompt1, LINE1, function (cur1) {
        blinkAndHide(cur1, function () {
          /* Pause before starting line 2 */
          setTimeout(function () {
            typeLine(text2, cursor2, prompt2, LINE2, function (cur2) {
              blinkAndHide(cur2, function () {
                linkifyISR();
                try { localStorage.setItem(KEY, String(Date.now())); } catch (_) {}
              });
            });
          }, PAUSE_MS);
        });
      });
    }, PRE_MS);
  }

  function init() {
    if (hasRunRecently()) {
      showStatic();
    } else {
      run();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>

<script>
/* ── Research area deep-links ──────────────────────────────
   Finds the four research-area <code> elements in the bio
   by text content and makes them clickable links to the
   filtered publications page. No HTML changes needed.
──────────────────────────────────────────────────────────── */
(function () {
  var TOPIC_MAP = {
    'Future of Work':              '/publications/#future-of-work',
    'Digital Platforms':           '/publications/#digital-platforms',
    'Digital Media':               '/publications/#digital-media',
    'Human-Algorithm Interactions':'/publications/#human-ai-interaction',
  };

  function wire() {
    document.querySelectorAll('article code, .post-content code').forEach(function (el) {
      /* Strip any existing # so lookup works whether or not already prefixed */
      var key  = el.textContent.trim().replace(/^#/, '');
      var href = TOPIC_MAP[key];
      if (!href) return;
      if (el.parentNode.tagName === 'A') return; /* already wrapped */

      /* Prepend # to the displayed text */
      if (!el.textContent.startsWith('#')) {
        el.textContent = '#' + el.textContent;
      }
      el.classList.add('nh-topic-link');
      el.setAttribute('title', 'View ' + key + ' publications');

      el.addEventListener('click', function () {
        window.location.href = href;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
</script>
