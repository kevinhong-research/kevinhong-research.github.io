(function () {
  function initTerminalIntro() {
    var KEY = 'nh_typed';
    var CHAR_MS = 44;
    var PRE_MS = 320;
    var PAUSE_MS = 480;
    var BLINK_MS = 950;
    var TTL = 24 * 60 * 60 * 1000;
    var LINE1 = 'researcher \u00b7 professor \u00b7 builder';
    var LINE2 = 'Currently: Senior Editor, ISR \u00b7 Centennial Endowed Chair \u00b7 Assoc. Dean';
    var ISR_TEXT = 'ISR';
    var ISR_HREF = 'https://pubsonline.informs.org/page/isre/editorial-board';
    var prompt1 = document.getElementById('nhPrompt');
    var text1 = document.getElementById('nhText');
    var cursor1 = document.getElementById('nhCursorT');
    var prompt2 = document.getElementById('nhPrompt2');
    var text2 = document.getElementById('nhText2');
    var cursor2 = document.getElementById('nhCursorT2');

    if (!prompt1 || !prompt2 || !text1 || !text2 || !cursor1 || !cursor2) return;

    function hasRunRecently() {
      try {
        var ts = localStorage.getItem(KEY);
        return ts && Date.now() - Number(ts) < TTL;
      } catch (_) {
        return false;
      }
    }

    function linkifyISR() {
      var full = text2.textContent;
      var idx = full.indexOf(ISR_TEXT);
      var before;
      var link;
      var after;

      if (idx === -1) return;

      before = document.createTextNode(full.slice(0, idx));
      link = document.createElement('a');
      after = document.createTextNode(full.slice(idx + ISR_TEXT.length));

      link.href = ISR_HREF;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = ISR_TEXT;
      link.className = 'nh-terminal-inline-link';

      text2.textContent = '';
      text2.appendChild(before);
      text2.appendChild(link);
      text2.appendChild(after);
    }

    function typeLine(textEl, cursorEl, promptEl, str, onDone) {
      var i = 0;
      var iv;

      promptEl.classList.add('nh-t-visible');
      cursorEl.classList.add('nh-t-visible');

      iv = setInterval(function () {
        textEl.textContent = str.slice(0, i + 1);
        i += 1;
        if (i >= str.length) {
          clearInterval(iv);
          if (onDone) onDone(cursorEl);
        }
      }, CHAR_MS);
    }

    function blinkAndHide(cursorEl, cb) {
      cursorEl.classList.add('nh-t-blink');
      setTimeout(function () {
        cursorEl.classList.remove('nh-t-blink');
        cursorEl.classList.add('nh-t-hidden');
        if (cb) cb();
      }, BLINK_MS);
    }

    function showStatic() {
      prompt1.classList.add('nh-t-visible');
      text1.textContent = LINE1;
      prompt2.classList.add('nh-t-visible');
      text2.textContent = LINE2;
      linkifyISR();
    }

    function run() {
      setTimeout(function () {
        typeLine(text1, cursor1, prompt1, LINE1, function (cur1) {
          blinkAndHide(cur1, function () {
            setTimeout(function () {
              typeLine(text2, cursor2, prompt2, LINE2, function (cur2) {
                blinkAndHide(cur2, function () {
                  linkifyISR();
                  try {
                    localStorage.setItem(KEY, String(Date.now()));
                  } catch (_) {}
                });
              });
            }, PAUSE_MS);
          });
        });
      }, PRE_MS);
    }

    if (hasRunRecently()) {
      showStatic();
    } else {
      run();
    }
  }

  function initTopicLinks() {
    var TOPIC_MAP = {
      'Future of Work': '/publications/#future-of-work',
      'Digital Platforms': '/publications/#digital-platforms',
      'Digital Media': '/publications/#digital-media',
      'Human-Algorithm Interactions': '/publications/#human-ai-interaction',
      'American football': '/football/'
    };

    document.querySelectorAll('article code, .post-content code').forEach(function (el) {
      var key = el.textContent.trim().replace(/^#/, '');
      var href = TOPIC_MAP[key];

      if (!href) return;
      if (el.parentNode.tagName === 'A') return;

      if (!el.textContent.startsWith('#')) {
        el.textContent = '#' + el.textContent;
      }

      el.classList.add('nh-topic-link');
      el.setAttribute('title', key === 'American football' ? 'View football page' : 'View ' + key + ' publications');
      el.addEventListener('click', function () {
        window.location.href = href;
      });
    });
  }

  function initPaperPreviews() {
    var JOURNAL_META = {
      ISR: 'Information Systems Research',
      MISQ: 'MIS Quarterly',
      MS: 'Management Science',
      POM: 'Production and Operations Management',
      JMIS: 'Journal of Management Information Systems',
      JAIS: 'Journal of the Association for Information Systems',
      TKDD: 'ACM Transactions on Knowledge Discovery from Data',
      JCP: 'Journal of Consumer Psychology',
      IJOC: 'INFORMS Journal on Computing'
    };
    var data = window.NH_FEATURED_PAPERS || {};
    var preview = document.getElementById('nhPaperPreview');
    var links = Array.prototype.slice.call(document.querySelectorAll('.nh-paper-link[data-paper-id]'));
    var titleEl;
    var authorsEl;
    var metaEl;
    var abstractEl;
    var ctaEl;
    var activeLink = null;
    var hideTimer = null;

    if (!preview || !links.length) return;

    titleEl = preview.querySelector('.nh-paper-preview__title');
    authorsEl = preview.querySelector('.nh-paper-preview__authors');
    metaEl = preview.querySelector('.nh-paper-preview__meta');
    abstractEl = preview.querySelector('.nh-paper-preview__abstract');
    ctaEl = preview.querySelector('.nh-paper-preview__cta');

    function authorMarkup(authors) {
      return (authors || []).map(function (author) {
        return author.indexOf('**') === 0 ? '<strong>' + author.slice(2, -2) + '</strong>' : author;
      }).join(', ');
    }

    function metaText(paper) {
      var parts = [];
      var journal = JOURNAL_META[paper.journal] || paper.journal;

      if (journal) parts.push(journal);
      if (paper.year) parts.push(String(paper.year));
      if (paper.volume) parts.push(paper.volume);
      return parts.join(' · ');
    }

    function positionPreview(link) {
      var rect = link.getBoundingClientRect();
      var previewRect = preview.getBoundingClientRect();
      var gap = 14;
      var left = rect.left + window.scrollX;
      var top = rect.bottom + window.scrollY + gap;

      if (left + previewRect.width > window.scrollX + window.innerWidth - 16) {
        left = window.scrollX + window.innerWidth - previewRect.width - 16;
      }
      if (left < window.scrollX + 16) left = window.scrollX + 16;

      if (top + previewRect.height > window.scrollY + window.innerHeight - 16) {
        top = rect.top + window.scrollY - previewRect.height - gap;
      }
      if (top < window.scrollY + 16) top = window.scrollY + 16;

      preview.style.left = left + 'px';
      preview.style.top = top + 'px';
    }

    function showPreview(link) {
      var paper = data[link.dataset.paperId];

      if (!paper) return;

      window.clearTimeout(hideTimer);
      activeLink = link;
      titleEl.textContent = paper.title || '';
      authorsEl.innerHTML = authorMarkup(paper.authors);
      metaEl.textContent = metaText(paper);
      abstractEl.textContent = paper.abstract || '';
      if (ctaEl) ctaEl.href = link.href;
      preview.classList.add('is-visible');
      preview.setAttribute('aria-hidden', 'false');
      positionPreview(link);
    }

    function hidePreviewSoon() {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () {
        activeLink = null;
        preview.classList.remove('is-visible');
        preview.setAttribute('aria-hidden', 'true');
      }, 120);
    }

    links.forEach(function (link) {
      link.addEventListener('mouseenter', function () { showPreview(link); });
      link.addEventListener('focus', function () { showPreview(link); });
      link.addEventListener('mouseleave', hidePreviewSoon);
      link.addEventListener('blur', hidePreviewSoon);
    });

    preview.addEventListener('mouseenter', function () {
      window.clearTimeout(hideTimer);
    });
    preview.addEventListener('mouseleave', hidePreviewSoon);

    window.addEventListener('scroll', function () {
      if (activeLink && preview.classList.contains('is-visible')) positionPreview(activeLink);
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (activeLink && preview.classList.contains('is-visible')) positionPreview(activeLink);
    });
  }

  function initAboutPage() {
    initTerminalIntro();
    initTopicLinks();
    initPaperPreviews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutPage);
  } else {
    initAboutPage();
  }
})();
