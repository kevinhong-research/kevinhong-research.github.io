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

  /* ── EXTRACT DOI ───────────────────────────────────────────
     Returns a bare DOI string from either the explicit doi
     field or by parsing the url field as a fallback.
     e.g. "https://doi.org/10.1287/mnsc.2021.4040" → "10.1287/mnsc.2021.4040"
  ──────────────────────────────────────────────────────────── */
  function extractDoi(pub) {
    // Prefer explicit doi field
    if (pub.doi && pub.doi.trim()) return pub.doi.trim();
    // Fall back: parse from url
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
      const j = JOURNAL_META[pub.journal] || { label: pub.journal };
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
          </div>
        </div>`;
    }).join('');

    updateCount();
    initPubAnimations();
    initFilter();
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
    const anchors = Array.from(document.querySelectorAll('.pub-cite[data-doi]'))
                         .filter(a => a.dataset.doi);
    if (!anchors.length) return;

    const doiMap = {};
    anchors.forEach(a => { doiMap[a.dataset.doi.toLowerCase()] = a; });
    const dois = Object.keys(doiMap);

    // Build URL — pipes MUST be literal, not encoded as %7C
    const filterParam = 'doi:' + dois.join('|');  // OpenAlex: doi:val1|val2 (prefix once)
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
