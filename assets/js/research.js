/* ============================================================
   research.js — interactivity for the /research/ page
   Depends on: #nhCursor, #nhCursorRing, #pubList, #filterCount
   ============================================================ */

(function () {

  /* ── VIEW STATE ─────────────────────────────────────────────
     Tracks which view is active: 'list' or 'timeline'.
     Shared across renderPubs, initFilter, updateCount.
  ──────────────────────────────────────────────────────────── */
  let currentView   = 'list';
  let allPubs       = [];   /* full unfiltered set, kept for view switching */
  let currentFilter = 'all';

  /* ── JOURNAL METADATA ──────────────────────────────────────*/
  const JOURNAL_META = {
    ISR:  { label: "Information Systems Research" },
    MISQ: { label: "MIS Quarterly" },
    MS:   { label: "Management Science" },
    POM:  { label: "Production and Operations Management" },
    JMIS: { label: "Journal of Management Information Systems" },
    JAIS: { label: "Journal of the Association for Information Systems" },
    TKDD: { label: "ACM Transactions on Knowledge Discovery from Data" },
    JCP:  { label: "Journal of Consumer Psychology" },
    IJOC: { label: "INFORMS Journal on Computing" },
  };

  /* ── GOOGLE SCHOLAR ICON ───────────────────────────────────*/
  const SCHOLAR_ICON = `<svg viewBox="0 0 24 24" fill="#00a060" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>
  </svg>`;

  /* ── CHEVRON ICON (abstract toggle) ───────────────────────*/
  const CHEVRON_ICON = `<svg class="pub-abstract-chevron" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  /* ── EXTRACT DOI ───────────────────────────────────────────
     Returns a bare DOI string from either the explicit doi
     field or by parsing the url field as a fallback.
     e.g. "https://doi.org/10.1287/mnsc.2021.4040" → "10.1287/mnsc.2021.4040"
  ──────────────────────────────────────────────────────────── */
  function extractDoi(pub) {
    if (pub.doi && pub.doi.trim()) return pub.doi.trim();
    if (pub.url) {
      const m = pub.url.match(/doi\.org\/(.+)$/i)
             || pub.url.match(/\/doi\/(?:abs\/)?(.+)$/i);
      if (m) return m[1].trim();
    }
    return '';
  }

  /* ── RENDER PUBLICATIONS ───────────────────────────────────*/
  function renderPubs(pubs) {
    allPubs = pubs;   /* cache for view switching */
    const list = document.getElementById('pubList');
    if (!list || !pubs || !pubs.length) return;

    list.innerHTML = pubs.map((pub, i) => {
      const j       = JOURNAL_META[pub.journal] || { label: pub.journal };
      const num     = String(i + 1).padStart(2, '0');
      const authors = (pub.authors || [])
        .map(a => a.startsWith('**') ? `<strong>${a.slice(2, -2)}</strong>` : a)
        .join(', ');

      const doi = extractDoi(pub);
      const citeBadge = doi ? `
        <a class="pub-cite"
           data-doi="${doi}"
           href="https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}"
           target="_blank" rel="noopener"
           title="View on Google Scholar">
          <span class="pub-cite-label">${SCHOLAR_ICON}scholar</span>
          <span class="pub-cite-count">—</span>
        </a>` : '';

      /* ── Abstract — button lives in pub-meta row, body lives below it ── */
      const hasAbstract = pub.abstract && pub.abstract.trim();
      const abstractBtn = hasAbstract ? `
        <button class="pub-abstract-btn" aria-expanded="false" aria-label="Toggle abstract">
          ${CHEVRON_ICON}
          <span class="pub-abstract-btn-label">Abstract</span>
        </button>` : '';
      const abstractBody = hasAbstract ? `
        <div class="pub-abstract-body" aria-hidden="true">
          <div class="pub-abstract-inner">${pub.abstract.trim()}</div>
        </div>` : '';

      return `
        <div class="pub-item" data-topics="${(pub.topics || []).join('|')}">
          <span class="pub-num">${num}</span>
          <div class="pub-body">
            <a class="pub-title" href="${pub.url || '#'}" target="_blank">${pub.title}</a>
            <div class="pub-authors">${authors}</div>
            <div class="pub-meta">
              <span class="pub-journal">${j.label}</span>
              <span class="pub-year">${pub.year}</span>
              ${pub.forthcoming ? `<span class="pub-note">Forthcoming</span>` : ''}
              ${pub.volume      ? `<span class="pub-year">${pub.volume}</span>` : ''}
              ${citeBadge}
              ${abstractBtn}
            </div>
            ${abstractBody}
          </div>
        </div>`;
    }).join('');

    updateCount();
    initPubAnimations();
    initFilter();
    initAbstracts();
    initViewToggle();
  }

  /* ── ABSTRACT TOGGLES ──────────────────────────────────────
     Uses the CSS grid trick (grid-template-rows: 0fr → 1fr)
     for a native-feeling height animation with no JS height
     measurement needed. The chevron SVG rotates via CSS.
  ──────────────────────────────────────────────────────────── */
  function initAbstracts() {
    document.querySelectorAll('.pub-abstract-btn').forEach(btn => {
      /* Button is inside .pub-meta; body is a direct child of .pub-body */
      const body = btn.closest('.pub-body').querySelector('.pub-abstract-body');

      btn.addEventListener('click', (e) => {
        /* Prevent the pub-item hover indent from flickering on click */
        e.stopPropagation();

        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        btn.setAttribute('aria-expanded', String(!isOpen));
        body.setAttribute('aria-hidden', String(isOpen));
        body.classList.toggle('pub-abstract-open', !isOpen);
        btn.classList.toggle('pub-abstract-btn--open', !isOpen);
      });
    });
  }

  /* ── FILTER BAR ────────────────────────────────────────────*/
  function getFiltered() {
    if (currentFilter === 'all') return allPubs;
    return allPubs.filter(p => (p.topics || []).includes(currentFilter));
  }

  function initFilter() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;

        if (currentView === 'list') {
          /* Filter list items in-place with animation */
          const items = document.querySelectorAll('.pub-item');
          let count = 0;
          items.forEach(item => {
            const topics = (item.dataset.topics || '').split('|');
            const show = currentFilter === 'all' || topics.includes(currentFilter);
            show ? item.classList.remove('hidden') : item.classList.add('hidden');
            if (show) count++;
          });
          updateCount(count);
          const visible = Array.from(items).filter(i => !i.classList.contains('hidden'));
          visible.forEach(item => item.classList.remove('nh-visible'));
          visible.forEach((item, i) => setTimeout(() => item.classList.add('nh-visible'), i * 40));
        } else {
          /* Re-render timeline with filtered pubs */
          renderTimeline(getFiltered());
        }
      });
    });
  }

  function updateCount(n) {
    /* Count display removed — no filterCount element in the new layout */
  }

  /* ── SCROLL-REVEAL ─────────────────────────────────────────*/
  function initPubAnimations() {
    const items = document.querySelectorAll('.pub-item');
    const list  = document.getElementById('pubList');
    if (!list) return;
    const po = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        Array.from(items).filter(i => !i.classList.contains('hidden'))
          .forEach((item, i) => setTimeout(() => item.classList.add('nh-visible'), i * 45));
        po.disconnect();
      }
    }, { threshold: 0.02 });
    po.observe(list);
  }

  /* ── TIMELINE RENDERER ─────────────────────────────────────
     Groups publications by year descending, renders as a
     vertical timeline with year nodes, connector ticks,
     and a staggered entrance animation.
  ──────────────────────────────────────────────────────────── */
  function renderTimeline(pubs) {
    const container = document.getElementById('timelineList');
    if (!container) return;

    if (!pubs || !pubs.length) {
      container.innerHTML = '<div class="tl-empty">No publications match this filter.</div>';
      updateCount(0);
      return;
    }

    /* Group by year, descending */
    const byYear = {};
    pubs.forEach(p => {
      if (!byYear[p.year]) byYear[p.year] = [];
      byYear[p.year].push(p);
    });
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    container.innerHTML = years.map(yr => {
      const papers = byYear[yr];
      const paperHTML = papers.map(p => {
        const j       = JOURNAL_META[p.journal] || { label: p.journal };
        const authors = (p.authors || [])
          .map(a => a.startsWith('**') ? `<strong>${a.slice(2, -2)}</strong>` : a)
          .join(', ');
        const meta = [
          `<span class="tl-journal">${j.label}</span>`,
          p.volume      ? `<span class="tl-volume">${p.volume}</span>`             : '',
          p.forthcoming ? `<span class="tl-forthcoming">Forthcoming</span>`        : '',
        ].filter(Boolean).join('<span class="tl-meta-sep">·</span>');

        /* Abstract toggle — reuses same CSS as list view */
        const hasAbstract = p.abstract && p.abstract.trim();
        const abstractBtn = hasAbstract ? `
          <button class="pub-abstract-btn tl-abstract-btn" aria-expanded="false" aria-label="Toggle abstract">
            ${CHEVRON_ICON}
            <span class="pub-abstract-btn-label">Abstract</span>
          </button>` : '';
        const abstractBody = hasAbstract ? `
          <div class="pub-abstract-body" aria-hidden="true">
            <div class="pub-abstract-inner">${p.abstract.trim()}</div>
          </div>` : '';

        return `
          <div class="tl-paper" data-topics="${(p.topics || []).join('|')}">
            <a class="tl-title" href="${p.url || '#'}" target="_blank">${p.title}</a>
            <div class="tl-authors">${authors}</div>
            <div class="tl-meta">${meta}${abstractBtn}</div>
            ${abstractBody}
          </div>`;
      }).join('');

      return `
        <div class="tl-year-group">
          <div class="tl-year-header">
            <div class="tl-year-node"><div class="tl-year-dot"></div></div>
            <span class="tl-year-label">${yr}</span>
            <span class="tl-year-count">${papers.length} paper${papers.length > 1 ? 's' : ''}</span>
          </div>
          <div class="tl-papers">${paperHTML}</div>
        </div>`;
    }).join('');

    updateCount(pubs.length);

    /* Wire abstract toggles in timeline */
    container.querySelectorAll('.pub-abstract-btn').forEach(btn => {
      const body = btn.closest('.tl-paper').querySelector('.pub-abstract-body');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        body.setAttribute('aria-hidden', String(isOpen));
        body.classList.toggle('pub-abstract-open', !isOpen);
        btn.classList.toggle('pub-abstract-btn--open', !isOpen);
      });
    });

    /* Stagger entrance animation */
    const papers = container.querySelectorAll('.tl-paper');
    papers.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateX(-8px)'; });
    requestAnimationFrame(() => {
      papers.forEach((el, i) => {
        setTimeout(() => {
          el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
          el.style.opacity    = '1';
          el.style.transform  = 'none';
        }, i * 35);
      });
    });
  }

  /* ── VIEW TOGGLE ────────────────────────────────────────────
     Single button that toggles between list and timeline views.
     Button always shows the name of the view you'll switch TO,
     with the corresponding icon. Sits at margin-left:auto in
     the filter bar, replacing the old filter-count element.
  ──────────────────────────────────────────────────────────── */
  function initViewToggle() {
    const btn        = document.getElementById('viewToggleBtn');
    const label      = document.getElementById('viewToggleLabel');
    const iconTl     = btn && btn.querySelector('.vtb-icon--timeline');
    const iconList   = btn && btn.querySelector('.vtb-icon--list');
    const listEl     = document.getElementById('pubList');
    const timelineEl = document.getElementById('timelineList');
    if (!btn || !listEl || !timelineEl) return;

    function switchTo(view) {
      if (view === currentView) return;
      currentView = view;

      /* Update button to show the OTHER view (what you'll switch to next) */
      if (view === 'timeline') {
        if (label)    label.textContent       = 'List';
        if (iconTl)   iconTl.style.display    = 'none';
        if (iconList) iconList.style.display  = '';
        btn.title = 'Switch to list view';
        btn.dataset.current = 'timeline';
      } else {
        if (label)    label.textContent       = 'Timeline';
        if (iconTl)   iconTl.style.display    = '';
        if (iconList) iconList.style.display  = 'none';
        btn.title = 'Switch to timeline view';
        btn.dataset.current = 'list';
      }

      /* Crossfade between views */
      const leaving  = view === 'list' ? timelineEl : listEl;
      const entering = view === 'list' ? listEl     : timelineEl;

      leaving.style.transition = 'opacity 0.2s ease';
      leaving.style.opacity    = '0';

      setTimeout(() => {
        leaving.style.display = 'none';
        leaving.setAttribute('aria-hidden', 'true');

        entering.style.display  = view === 'list' ? 'flex' : 'block';
        entering.style.opacity  = '0';
        entering.setAttribute('aria-hidden', 'false');
        entering.style.transition = 'opacity 0.25s ease';

        if (view === 'timeline') {
          renderTimeline(getFiltered());
        } else {
          const items = Array.from(listEl.querySelectorAll('.pub-item:not(.hidden)'));
          items.forEach(item => item.classList.remove('nh-visible'));
          items.forEach((item, i) => setTimeout(() => item.classList.add('nh-visible'), i * 35));
        }

        requestAnimationFrame(() => { entering.style.opacity = '1'; });
      }, 200);
    }

    btn.addEventListener('click', () => {
      switchTo(currentView === 'list' ? 'timeline' : 'list');
    });
  }

  function initSectionReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(x => {
        if (x.isIntersecting) { x.target.classList.add('nh-visible'); obs.unobserve(x.target); }
      });
    }, { threshold: 0.05 });
    document.querySelectorAll('.nh-reveal').forEach(r => obs.observe(r));
  }

  /* ── CITATION COUNTS (OpenAlex) ────────────────────────────
     Batches all DOIs into a single OpenAlex request.
     Pipes in the filter string MUST be literal (not %7C).
     Falls back gracefully on any error — dash stays in place.
  ──────────────────────────────────────────────────────────── */
  function applyCountsToDOM(counts, doiMap) {
    let applied = 0;
    Object.entries(counts).forEach(([doi, count]) => {
      const anchor = doiMap[doi];
      if (!anchor || count == null) return;
      const span = anchor.querySelector('.pub-cite-count');
      if (span) { span.textContent = Number(count).toLocaleString(); applied++; }
    });
    console.log('[citations] Applied', applied, 'of', Object.keys(counts).length, 'counts to DOM');
  }

  async function fetchCitations() {
    const CACHE_KEY = 'nh_openalex_citations';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    const anchors = Array.from(document.querySelectorAll('.pub-cite[data-doi]'))
                         .filter(a => a.dataset.doi);
    if (!anchors.length) return;

    const doiMap = {};
    anchors.forEach(a => { doiMap[a.dataset.doi.toLowerCase()] = a; });
    const dois = Object.keys(doiMap);

    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
          applyCountsToDOM(cached.counts, doiMap);
          return;
        }
      }
    } catch (_) {}

    const filterParam = 'doi:' + dois.join('|');
    const apiUrl = 'https://api.openalex.org/works'
                 + '?filter='  + filterParam
                 + '&select=doi,cited_by_count'
                 + '&per-page=100'
                 + '&mailto=khong@miami.edu';

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) return;

      const data = await res.json();
      const counts = {};
      (data.results || []).forEach(work => {
        if (!work.doi) return;
        const bare = work.doi.replace(/^https?:\/\/doi\.org\//i, '').toLowerCase();
        counts[bare] = work.cited_by_count;
      });

      applyCountsToDOM(counts, doiMap);

      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), counts })); }
      catch (_) {}

    } catch (err) {
      console.error('[citations] Fetch failed:', err.message);
    }
  }

  /* ── CUSTOM CURSOR ─────────────────────────────────────────*/
  function initCursor() {
    const dot  = document.getElementById('nhCursor');
    const ring = document.getElementById('nhCursorRing');
    if (!dot || !ring) return;
    if (window.matchMedia('(pointer: coarse)').matches) {
      dot.style.display = ring.style.display = 'none'; return;
    }
    document.addEventListener('mousemove', e => {
      dot.style.left = ring.style.left = e.clientX + 'px';
      dot.style.top  = ring.style.top  = e.clientY + 'px';
    });
    document.querySelectorAll('a, button, .area-tag').forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.style.width = dot.style.height = '14px';
        ring.style.width = ring.style.height = '44px';
        ring.style.borderColor = 'rgba(244,115,33,0.7)';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.width = dot.style.height = '8px';
        ring.style.width = ring.style.height = '32px';
        ring.style.borderColor = 'rgba(244,115,33,0.4)';
      });
    });
  }

  /* ── INIT ──────────────────────────────────────────────────*/
  document.addEventListener('DOMContentLoaded', () => {
    renderPubs(window.PUBLICATIONS || []);
    initSectionReveal();
    fetchCitations();
    // initCursor();
  });

})();
