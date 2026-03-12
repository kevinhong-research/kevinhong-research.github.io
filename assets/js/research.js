/* ============================================================
   research.js — interactivity for the /research/ page
   Depends on: #nhCursor, #nhCursorRing, #pubList, #filterCount
   ============================================================ */

(function () {

  /* ── JOURNAL METADATA ──────────────────────────────────────
     Maps the shorthand keys used in publications.yml to the
     full journal name, badge label, and filter-bar category.
  ──────────────────────────────────────────────────────────── */
  const JOURNAL_META = {
    ISR:  { label: "Information Systems Research",                    badge: "ISR",  filter: "ISR"  },
    MISQ: { label: "MIS Quarterly",                                   badge: "MISQ", filter: "MISQ" },
    MS:   { label: "Management Science",                              badge: "MS",   filter: "MS"   },
    POM:  { label: "Production and Operations Management",            badge: "POM",  filter: "POM"  },
    JMIS: { label: "Journal of Management Information Systems",       badge: "JMIS", filter: "other" },
    JAIS: { label: "Journal of the Association for Information Systems", badge: "JAIS", filter: "other" },
    TKDD: { label: "ACM Transactions on Knowledge Discovery from Data",  badge: "TKDD", filter: "other" },
    JCP:  { label: "Journal of Consumer Psychology",                  badge: "JCP",  filter: "other" },
    IJOC: { label: "INFORMS Journal on Computing", badge: "IJOC", filter: "IJOC" },
  };

  /* ── GOOGLE SCHOLAR ICON SVG ───────────────────────────────
     Inline SVG — Google Scholar logo (mortarboard + circle).
     Source: Simple Icons / shields.io al-folio template.
  ──────────────────────────────────────────────────────────── */
  const SCHOLAR_ICON = `<svg viewBox="0 0 24 24" fill="#4285F4" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>
  </svg>`;

  /* ── RENDER PUBLICATIONS ───────────────────────────────────
     Called once on DOMContentLoaded. Reads window.PUBLICATIONS
     (injected by the Jekyll data loop in publications.md) and
     builds the pub-item markup, then kicks off animations.
  ──────────────────────────────────────────────────────────── */
  function renderPubs(pubs) {
    const list = document.getElementById('pubList');
    if (!list || !pubs || !pubs.length) return;

    list.innerHTML = pubs.map((pub, i) => {
      const j = JOURNAL_META[pub.journal] || {
        label: pub.journal, badge: pub.journal, filter: "other"
      };
      const num     = String(i + 1).padStart(2, '0');
      const authors = (pub.authors || [])
        .map(a => a.startsWith('**') ? `<strong>${a.slice(2, -2)}</strong>` : a)
        .join(', ');

      // Citation badge — only rendered when a DOI is present.
      // .pub-cite-count starts as an em dash; fetchCitations() replaces it.
      const citeBadge = pub.doi ? `
        <a class="pub-cite"
           data-doi="${pub.doi}"
           href="https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}"
           target="_blank"
           rel="noopener"
           title="View on Google Scholar">
          <span class="pub-cite-label">
            ${SCHOLAR_ICON}
            scholar
          </span>
          <span class="pub-cite-count">—</span>
        </a>` : '';

      return `
        <div class="pub-item" data-topics="${(pub.topics || []).join('|')}">
          <span class="pub-num">${num}</span>
          <div class="pub-body">
            <a class="pub-title" href="${pub.url || '#'}" target="_blank">${pub.title}</a>
            <div class="pub-authors">${authors}</div>
            <div class="pub-meta">
              <span class="pub-journal">${j.label}</span>
              <span class="pub-year">${pub.year}</span>
              ${pub.forthcoming  ? `<span class="pub-note">Forthcoming</span>` : ''}
              ${pub.volume       ? `<span class="pub-year">${pub.volume}</span>` : ''}
              ${citeBadge}
            </div>
          </div>
        </div>`;
    }).join('');

    updateCount();
    initPubAnimations();
    initFilter();
  }

  /* ── FILTER BAR ────────────────────────────────────────────
     Filters visible pub-items and re-staggers their entrance.
  ──────────────────────────────────────────────────────────── */
  function initFilter() {
    const btns = document.querySelectorAll('.filter-btn');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const f = btn.dataset.filter;

        const items = document.querySelectorAll('.pub-item');
        let count = 0;

        items.forEach(item => {
          const topics = (item.dataset.topics || '').split('|');
          const show = f === 'all' || topics.includes(f);
          if (show) {
            item.classList.remove('hidden');
            count++;
          } else {
            item.classList.add('hidden');
          }
        });

        updateCount(count);

        const visible = Array.from(items).filter(i => !i.classList.contains('hidden'));
        visible.forEach(item => item.classList.remove('nh-visible'));
        visible.forEach((item, i) => {
          setTimeout(() => item.classList.add('nh-visible'), i * 40);
        });
      });
    });
  }

  function updateCount(n) {
    const el = document.getElementById('filterCount');
    if (!el) return;
    const count = (n !== undefined)
      ? n
      : document.querySelectorAll('.pub-item').length;
    el.textContent = count + ' publication' + (count !== 1 ? 's' : '');
  }

  /* ── SCROLL-REVEAL (sections + pub items) ──────────────────
     Section blocks use .nh-reveal; pub items stagger once the
     list enters the viewport.
  ──────────────────────────────────────────────────────────── */
  function initPubAnimations() {
    const items = document.querySelectorAll('.pub-item');
    const list  = document.getElementById('pubList');
    if (!list) return;

    const po = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        Array.from(items)
          .filter(i => !i.classList.contains('hidden'))
          .forEach((item, i) => {
            setTimeout(() => item.classList.add('nh-visible'), i * 45);
          });
        po.disconnect();
      }
    }, { threshold: 0.02 });

    po.observe(list);
  }

  function initSectionReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(x => {
        if (x.isIntersecting) {
          x.target.classList.add('nh-visible');
          obs.unobserve(x.target);
        }
      });
    }, { threshold: 0.05 });

    document.querySelectorAll('.nh-reveal').forEach(r => obs.observe(r));
  }

  /* ── CITATION COUNTS (OpenAlex) ────────────────────────────
     Fires after renderPubs() builds the DOM.

     KEY FIX: The OpenAlex filter uses pipe-separated DOIs:
       filter=doi:10.x/y|doi:10.x/z
     These pipes MUST be literal in the URL — NOT percent-encoded.
     encodeURIComponent() would turn | into %7C, breaking the API.
     So we build the URL by string concatenation, only encoding
     the mailto address which may contain special characters.
  ──────────────────────────────────────────────────────────── */

  function applyCountsToDOM(counts, doiMap) {
    Object.entries(counts).forEach(([doi, count]) => {
      const anchor = doiMap[doi];
      if (!anchor || count == null) return;
      const countSpan = anchor.querySelector('.pub-cite-count');
      if (countSpan) {
        countSpan.textContent = Number(count).toLocaleString();
      }
    });
  }

  async function fetchCitations() {
    const CACHE_KEY = 'nh_openalex_citations';
    const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

    // 1. Collect all citation anchors that have a non-empty DOI
    const anchors = Array.from(document.querySelectorAll('.pub-cite[data-doi]'))
                         .filter(a => a.dataset.doi);
    if (!anchors.length) return;

    // 2. Build DOI → anchor lookup (lowercase for reliable matching)
    const doiMap = {};
    anchors.forEach(a => { doiMap[a.dataset.doi.toLowerCase()] = a; });

    const dois = Object.keys(doiMap);
    if (!dois.length) return;

    // 3. Try session cache first
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

    // 4. Build OpenAlex URL — pipes must be literal (not %7C)
    //    OpenAlex filter syntax: doi:10.x/y|doi:10.x/z
    const filterParam = dois.map(d => 'doi:' + d).join('|');
    const mailto      = 'khong@miami.edu'; // ← replace with your real email
    const apiUrl      = 'https://api.openalex.org/works'
                      + '?filter='  + filterParam          // literal pipes, NOT encoded
                      + '&select=doi,cited_by_count'
                      + '&per-page=100'
                      + '&mailto='  + encodeURIComponent(mailto);

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) return;

      const data = await res.json();
      const counts = {};

      // OpenAlex returns full DOI URLs: "https://doi.org/10.x/y"
      // Strip prefix to match our bare-DOI keys
      (data.results || []).forEach(work => {
        if (!work.doi) return;
        const bare = work.doi.replace(/^https?:\/\/doi\.org\//i, '').toLowerCase();
        counts[bare] = work.cited_by_count;
      });

      // 5. Write counts to DOM
      applyCountsToDOM(counts, doiMap);

      // 6. Cache for 12 hours
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), counts }));
      } catch (_) {}

    } catch (_) {
      // Network failure — em dash placeholder stays, fail silently
    }
  }

  /* ── CUSTOM CURSOR ─────────────────────────────────────────
     Dot + ring that follow the mouse. Expands on interactive
     elements; hidden on touch devices.
  ──────────────────────────────────────────────────────────── */
  function initCursor() {
    const dot  = document.getElementById('nhCursor');
    const ring = document.getElementById('nhCursorRing');
    if (!dot || !ring) return;

    if (window.matchMedia('(pointer: coarse)').matches) {
      dot.style.display = ring.style.display = 'none';
      return;
    }

    document.addEventListener('mousemove', e => {
      dot.style.left  = ring.style.left  = e.clientX + 'px';
      dot.style.top   = ring.style.top   = e.clientY + 'px';
    });

    document.querySelectorAll('a, button, .area-tag').forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.style.width  = dot.style.height  = '14px';
        ring.style.width = ring.style.height = '44px';
        ring.style.borderColor = 'rgba(244,115,33,0.7)';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.width  = dot.style.height  = '8px';
        ring.style.width = ring.style.height = '32px';
        ring.style.borderColor = 'rgba(244,115,33,0.4)';
      });
    });
  }

  /* ── INIT ──────────────────────────────────────────────────
     window.PUBLICATIONS is set by the inline <script> in
     publications.md (populated via Jekyll/Liquid).
  ──────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    renderPubs(window.PUBLICATIONS || []);
    initSectionReveal();
    fetchCitations();
    // initCursor();
  });

})();
