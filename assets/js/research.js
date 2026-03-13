/* ============================================================
   research.js — interactivity for the /research/ page
   Depends on: #nhCursor, #nhCursorRing, #pubList, #filterCount
   ============================================================ */

(function () {

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

      /* ── Abstract block — only rendered when abstract exists ── */
      const hasAbstract = pub.abstract && pub.abstract.trim();
      const abstractBlock = hasAbstract ? `
        <div class="pub-abstract-wrap">
          <button class="pub-abstract-btn" aria-expanded="false" aria-label="Toggle abstract">
            ${CHEVRON_ICON}
            <span class="pub-abstract-btn-label">Abstract</span>
          </button>
          <div class="pub-abstract-body" aria-hidden="true">
            <div class="pub-abstract-inner">${pub.abstract.trim()}</div>
          </div>
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
            </div>
            ${abstractBlock}
          </div>
        </div>`;
    }).join('');

    updateCount();
    initPubAnimations();
    initFilter();
    initAbstracts();
  }

  /* ── ABSTRACT TOGGLES ──────────────────────────────────────
     Uses the CSS grid trick (grid-template-rows: 0fr → 1fr)
     for a native-feeling height animation with no JS height
     measurement needed. The chevron SVG rotates via CSS.
  ──────────────────────────────────────────────────────────── */
  function initAbstracts() {
    document.querySelectorAll('.pub-abstract-btn').forEach(btn => {
      const body = btn.nextElementSibling; // .pub-abstract-body

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
          show ? item.classList.remove('hidden') : item.classList.add('hidden');
          if (show) count++;
        });
        updateCount(count);
        const visible = Array.from(items).filter(i => !i.classList.contains('hidden'));
        visible.forEach(item => item.classList.remove('nh-visible'));
        visible.forEach((item, i) => setTimeout(() => item.classList.add('nh-visible'), i * 40));
      });
    });
  }

  function updateCount(n) {
    const el = document.getElementById('filterCount');
    if (!el) return;
    const count = n !== undefined ? n : document.querySelectorAll('.pub-item').length;
    el.textContent = count + ' publication' + (count !== 1 ? 's' : '');
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
