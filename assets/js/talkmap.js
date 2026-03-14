/* ============================================================
   talkmap.js — US talks map for the /talks/ page
   Data source: window.TALKMAP_DATA, serialized by Jekyll from
   _data/talks.yml. To add a talk to the map, add lat/lng to
   its entry in talks.yml — no JS changes needed.
   ============================================================ */

(function () {

  /* ── State abbreviations for label rendering ─────────────── */
  const STATE_ABBR = {
    "01":"AL","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
    "10":"DE","12":"FL","13":"GA","16":"ID","17":"IL","18":"IN",
    "19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA",
    "26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV",
    "33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH",
    "40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN",
    "48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
  };

  const CENTROID_OVERRIDES = {
    "06": [90,  330],  /* CA */
    "26": [670, 155],  /* MI lower peninsula */
    "12": [730, 490],  /* FL */
    "24": [760, 285],  /* MD */
    "02": null,        /* AK — skip */
    "15": null,        /* HI — skip */
  };

  const MIN_AREA    = 900;  /* px² to show a state label */
  const CLUSTER_PX  = 20;  /* px radius for clustering dots */

  /* ── Toggle bar wiring ───────────────────────────────────── */
  function initToggle(talks) {
    const toggle   = document.getElementById("talk-map-toggle");
    const body     = document.getElementById("talk-map-body");
    const metaEl   = document.getElementById("tm-toggle-meta");
    if (!toggle || !body) return;

    /* Populate meta counts from live data */
    const total    = talks.length;
    const upcoming = talks.filter(t => t.upcoming).length;
    metaEl.textContent = upcoming > 0
      ? `${total} talks · ${upcoming} upcoming`
      : `${total} talks`;

    let mapBuilt = false;

    function open() {
      toggle.setAttribute("aria-expanded", "true");
      toggle.classList.add("tm-toggle--open");
      body.classList.add("tm-body--open");
      /* Build map on first open — avoids fetching TopoJSON until needed */
      if (!mapBuilt) { buildMap(talks); mapBuilt = true; }
    }

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("tm-toggle--open");
      body.classList.remove("tm-body--open");
    }

    toggle.addEventListener("click", () => {
      toggle.getAttribute("aria-expanded") === "true" ? close() : open();
    });

    toggle.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle.click(); }
    });
  }

  /* ── Map rendering ───────────────────────────────────────── */
  function buildMap(talks) {
    const container = document.getElementById("talk-map-container");
    if (!container) return;

    container.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-map-area">
          <div id="tm-tip"></div>
          <svg id="tm-svg" viewBox="0 0 960 580"></svg>
        </div>
      </div>`;

    const svg    = d3.select("#tm-svg");
    const tip    = document.getElementById("tm-tip");
    const area   = container.querySelector(".tm-map-area");
    const proj   = d3.geoAlbersUsa().scale(1100).translate([480, 270]);
    const pathFn = d3.geoPath().projection(proj);

    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then(r => r.json())
      .then(us => {
        const states = topojson.feature(us, us.objects.states);

        /* State fills */
        svg.append("g")
          .selectAll("path")
          .data(states.features)
          .join("path")
          .attr("class", "tm-state")
          .attr("d", pathFn);

        /* State borders */
        svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
          .attr("fill", "none")
          .attr("stroke", "#253040")
          .attr("stroke-width", "0.5")
          .attr("d", pathFn);

        /* State labels */
        const labelsG = svg.append("g");
        states.features.forEach(f => {
          const id   = f.id.toString().padStart(2, "0");
          const abbr = STATE_ABBR[id];
          if (!abbr) return;
          if (id in CENTROID_OVERRIDES && CENTROID_OVERRIDES[id] === null) return;
          if (pathFn.area(f) < MIN_AREA) return;

          let cx, cy;
          if (id in CENTROID_OVERRIDES) {
            [cx, cy] = CENTROID_OVERRIDES[id];
          } else {
            const c = pathFn.centroid(f);
            if (!c || isNaN(c[0])) return;
            [cx, cy] = c;
          }
          labelsG.append("text")
            .attr("class", "tm-state-lbl")
            .attr("x", cx).attr("y", cy)
            .text(abbr);
        });

        /* ── Cluster nearby talks ────────────────────────────
           Groups dots within CLUSTER_PX of each other.
           Centroid is re-averaged as members are added.      */
        const projected = talks
          .map(t => ({ talk: t, c: proj([t.lng, t.lat]) }))
          .filter(d => d.c);

        const clusters = [];
        projected.forEach(({ talk, c }) => {
          const match = clusters.find(cl =>
            Math.hypot(cl.cx - c[0], cl.cy - c[1]) < CLUSTER_PX
          );
          if (match) {
            match.talks.push(talk);
            const n = match.talks.length;
            match.cx = match.talks.reduce((s, tk) => {
              const p = projected.find(d => d.talk === tk);
              return s + (p ? p.c[0] : match.cx);
            }, 0) / n;
            match.cy = match.talks.reduce((s, tk) => {
              const p = projected.find(d => d.talk === tk);
              return s + (p ? p.c[1] : match.cy);
            }, 0) / n;
          } else {
            clusters.push({ talks: [talk], cx: c[0], cy: c[1] });
          }
        });

        /* ── Render one dot per cluster ─────────────────────── */
        const dotsG = svg.append("g");
        clusters.forEach(cl => {
          const hasUpcoming = cl.talks.some(t => t.upcoming);
          const color = hasUpcoming ? "#4db8ff" : "#00a060";
          /* Dot radius scales with cluster size: 1→6, 2→8, 3→10, 4+→12 */
          const BASE_R  = [0, 6, 8, 10, 12];
          const countR  = BASE_R[Math.min(cl.talks.length, 4)];
          const r       = hasUpcoming ? Math.max(7.5, countR) : countR;
          const cx    = cl.cx, cy = cl.cy;

          const g = dotsG.append("g").attr("transform", `translate(${cx},${cy})`);

          if (hasUpcoming) {
            g.append("circle")
              .attr("class", "tm-pulse")
              .attr("r", 11).attr("fill", "none")
              .attr("stroke", color).attr("stroke-width", 1.2).attr("opacity", 0.5);
          }

          g.append("circle").attr("r", r + 4).attr("fill", color).attr("opacity", 0.1);

          g.append("circle").attr("r", r)
            .attr("fill", color).attr("opacity", 0.92)
            .attr("stroke", "#0d0d0d").attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .on("mouseover", function () {
              const svgRect  = svg.node().getBoundingClientRect();
              const wrapRect = area.getBoundingClientRect();
              const sx = svgRect.width  / 960;
              const sy = svgRect.height / 580;
              let lx = cx * sx + (svgRect.left - wrapRect.left) + 14;
              let ly = cy * sy + (svgRect.top  - wrapRect.top)  - 14;
              if (lx + 230 > wrapRect.width) lx -= 245;
              if (ly < 0) ly += 50;

              tip.className = "tm-tip" + (hasUpcoming ? " upcoming" : "");
              tip.innerHTML  = cl.talks.map((t, i) => {
                const meta  = [t.venue, t.date].filter(Boolean).join(" · ");
                const badge = t.upcoming
                  ? `<span class="tm-tip-badge" style="color:#4db8ff"> · Upcoming</span>`
                  : "";
                const div   = i > 0 ? `<div class="tm-tip-divider"></div>` : "";
                return `${div}<div class="tm-tip-entry">
                  <strong>${t.institution}</strong>
                  <div class="tm-tip-meta">${meta}${badge}</div>
                </div>`;
              }).join("");

              tip.style.left    = Math.round(lx) + "px";
              tip.style.top     = Math.round(ly) + "px";
              tip.style.display = "block";
              d3.select(this).attr("r", r + 2).attr("opacity", 1);
            })
            .on("mouseout", function () {
              tip.style.display = "none";
              d3.select(this).attr("r", r).attr("opacity", 0.92);
            });
        });
      });
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    const talks = window.TALKMAP_DATA || [];
    if (!talks.length) return;
    initToggle(talks);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
