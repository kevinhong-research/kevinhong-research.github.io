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

  /* ── RENDER PUBLICATIONS ───────────────────────────────────
     Called once on DOMContentLoaded. Reads window.PUBLICATIONS
     (injected by the Jekyll data loop in research_nh.md) and
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

      return `
        <div class="pub-item" data-journal="${j.filter}">
          <span class="pub-num">${num}</span>
          <div class="pub-body">
            <a class="pub-title" href="${pub.url || '#'}" target="_blank">${pub.title}</a>
            <div class="pub-authors">${authors}</div>
            <div class="pub-meta">
              <span class="pub-journal">${j.label}</span>
              <span class="pub-year">${pub.year}</span>
              ${pub.forthcoming  ? `<span class="pub-note">Forthcoming</span>` : ''}
              ${pub.volume       ? `<span class="pub-year">${pub.volume}</span>` : ''}
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
    const btns  = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.pub-item');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const f = btn.dataset.filter;
        let count = 0;

        items.forEach(item => {
          const show = f === 'all' || item.dataset.journal === f;
          item.classList.toggle('hidden', !show);
          if (show) { item.classList.remove('nh-visible'); count++; }
        });

        updateCount(count, f === 'all');

        setTimeout(() => {
          Array.from(items)
            .filter(i => !i.classList.contains('hidden'))
            .forEach((item, i) => {
              setTimeout(() => item.classList.add('nh-visible'), i * 40);
            });
        }, 30);
      });
    });
  }

  function updateCount(n, all) {
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

  /* ── CUSTOM CURSOR ─────────────────────────────────────────
     Dot + ring that follow the mouse. Expands on interactive
     elements; hidden on touch devices.
  ──────────────────────────────────────────────────────────── */
  function initCursor() {
    const dot  = document.getElementById('nhCursor');
    const ring = document.getElementById('nhCursorRing');
    if (!dot || !ring) return;

    // Hide on touch devices
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
     research_nh.md (populated via Jekyll/Liquid).
  ──────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    renderPubs(window.PUBLICATIONS || []);
    initSectionReveal();
    // initCursor();
  });

})();
