/* ============================================================
   talkmap.js — US talks map for the /talks/ page
   Renders before the talk list. Data is hardcoded here since
   talks.yml does not carry lat/lng fields.
   Depends on D3 v7 and TopoJSON (loaded via CDN in talks.md).
   ============================================================ */

(function () {

  const TALKS = [
    { name:"University of South Florida",           venue:"Muma College of Business",             date:"Fall 2026", lat:28.058, lng:-82.413, type:"upcoming" },
    { name:"Tulane University",                     venue:"The Murphy Institute",                  date:"4/2026",    lat:29.938, lng:-90.120, type:"upcoming" },
    { name:"University of Texas at Austin",         venue:"McCombs School of Business",           date:"3/2026",    lat:30.285, lng:-97.734 },
    { name:"Ohio State University",                 venue:"Fisher College of Business",           date:"11/2025",   lat:40.006, lng:-83.030 },
    { name:"Virginia Tech",                         venue:"Pamplin College of Business",          date:"9/2025",    lat:37.228, lng:-80.423 },
    { name:"Univ. of Illinois Urbana-Champaign",   venue:"Gies College of Business",             date:"11/2024",   lat:40.102, lng:-88.227 },
    { name:"New York University",                   venue:"Stern School of Business",             date:"5/2024",    lat:40.729, lng:-73.996 },
    { name:"Boston University",                     venue:"Questrom School of Business",          date:"11/2023",   lat:42.350, lng:-71.105 },
    { name:"University of Delaware",                venue:"Lerner College",                       date:"10/2023",   lat:39.678, lng:-75.751 },
    { name:"Univ. of Southern California",          venue:"Marshall School of Business",          date:"12/2022",   lat:34.022, lng:-118.285 },
    { name:"Florida State University",              venue:"College of Business",                  date:"10/2022",   lat:30.441, lng:-84.298 },
    { name:"University of Georgia",                 venue:"Terry College of Business",            date:"4/2022",    lat:33.948, lng:-83.377 },
    { name:"University of Rochester",               venue:"Simon Business School",                date:"4/2022",    lat:43.128, lng:-77.627 },
    { name:"University of Pittsburgh",              venue:"Katz Graduate School",                 date:"11/2021",   lat:40.444, lng:-79.960 },
    { name:"University of Miami",                   venue:"Herbert Business School",              date:"11/2021",   lat:25.758, lng:-80.375 },
    { name:"Univ. of Wisconsin–Madison",            venue:"Wisconsin School of Business",         date:"11/2021",   lat:43.076, lng:-89.412 },
    { name:"University of Maryland",                venue:"R. H. Smith School of Business",       date:"9/2021",    lat:38.986, lng:-76.942 },
    { name:"University of Houston",                 venue:"HPE Data Science Institute",           date:"4/2021",    lat:29.719, lng:-95.342 },
    { name:"University of Oklahoma",                venue:"Price College of Business",            date:"4/2021",    lat:35.205, lng:-97.445 },
    { name:"University of Connecticut",             venue:"School of Business",                   date:"2/2021",    lat:41.808, lng:-72.249 },
    { name:"Lehigh University",                     venue:"College of Business",                  date:"1/2021",    lat:40.606, lng:-75.378 },
    { name:"University of Washington",              venue:"Foster School of Business",            date:"2/2020",    lat:47.655, lng:-122.303 },
    { name:"University of Houston",                 venue:"Bauer College of Business",            date:"12/2019",   lat:29.724, lng:-95.350 },
    { name:"Georgia State University",              venue:"Robinson College of Business",         date:"11/2019",   lat:33.753, lng:-84.386 },
    { name:"University of Arizona",                 venue:"Eller College of Management",          date:"10/2019",   lat:32.231, lng:-110.950 },
    { name:"UNC Charlotte",                         venue:"Belk College of Business",             date:"10/2019",   lat:35.307, lng:-80.735 },
    { name:"University of Utah",                    venue:"Eccles School of Business",            date:"9/2019",    lat:40.764, lng:-111.842 },
    { name:"Boston College",                        venue:"Carroll School of Management",         date:"5/2019",    lat:42.335, lng:-71.168 },
    { name:"George Washington University",          venue:"College of Business",                  date:"4/2019",    lat:38.899, lng:-77.048 },
    { name:"Univ. of Illinois at Chicago",          venue:"College of Business",                  date:"11/2018",   lat:41.870, lng:-87.650 },
    { name:"University of Minnesota",               venue:"Carlson School of Management",         date:"3/2018",    lat:44.974, lng:-93.227 },
    { name:"Special Libraries Association",         venue:"Invited Keynote",                      date:"7/2017",    lat:32.776, lng:-96.797, type:"keynote" },
    { name:"Arizona State University",              venue:"Ira A. Fulton School of Engineering",  date:"3/2017",    lat:33.425, lng:-111.940 },
    { name:"Temple University",                     venue:"Fox School of Business",               date:"2/2017",    lat:39.981, lng:-75.155 },
    { name:"Uber HQ",                               date:"10/2016",                               lat:37.774, lng:-122.419 },
    { name:"Arizona State University",              venue:"IS Research Workshop",                 date:"2/2016",    lat:33.430, lng:-111.935 },
    { name:"Temple University",                     venue:"CIBER",                                date:"4/2014",    lat:39.985, lng:-75.150 },
    { name:"University of Virginia",                venue:"McIntire School of Commerce",          date:"10/2013",   lat:38.033, lng:-78.508 },
  ];

  const STATE_ABBR = {
    "01":"AL","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
    "10":"DE","12":"FL","13":"GA","16":"ID","17":"IL","18":"IN",
    "19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA",
    "26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV",
    "33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH",
    "40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN",
    "48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
  };

  /* States too small for a label or with bad auto-centroids */
  const CENTROID_OVERRIDES = {
    "06": [90,  330],  /* CA */
    "26": [670, 155],  /* MI lower peninsula */
    "12": [730, 490],  /* FL */
    "24": [760, 285],  /* MD — nudge right */
    "02": null,        /* AK — skip (inset) */
    "15": null,        /* HI — skip (inset) */
  };

  const MIN_AREA = 900; /* px² threshold for showing a label */

  function buildMap() {
    const container = document.getElementById("talk-map-container");
    if (!container) return;

    /* ── Stats ── */
    const upcoming = TALKS.filter(t => t.type === "upcoming").length;
    const keynotes = TALKS.filter(t => t.type === "keynote").length;

    container.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header">
          <div class="tm-title">
            <span class="tm-label">Invited Research Talks in the United States</span>
          </div>
          <div class="tm-stats">
            <div class="tm-stat"><span class="tm-stat-n tm-green">${TALKS.length}</span><span class="tm-stat-l">Talks</span></div>
            <div class="tm-divider"></div>
            <div class="tm-stat"><span class="tm-stat-n tm-blue">${upcoming}</span><span class="tm-stat-l">Upcoming</span></div>
          </div>
        </div>
        <div class="tm-map-area">
          <div id="tm-tip"></div>
          <svg id="tm-svg" viewBox="0 0 960 520"></svg>
        </div>
      </div>`;

    const svg    = d3.select("#tm-svg");
    const tip    = document.getElementById("tm-tip");
    const area   = container.querySelector(".tm-map-area");
    const proj   = d3.geoAlbersUsa().scale(1100).translate([480, 290]);
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

        /* ── Cluster nearby talks (within CLUSTER_PX projected pixels) ──
           Groups are averaged to a centroid. Upcoming type wins if any
           talk in the group is upcoming.                               */
        const CLUSTER_PX = 20;

        const projected = TALKS.map(t => ({ talk: t, c: proj([t.lng, t.lat]) }))
                               .filter(d => d.c);

        const clusters = [];
        projected.forEach(({ talk, c }) => {
          const match = clusters.find(cl =>
            Math.hypot(cl.cx - c[0], cl.cy - c[1]) < CLUSTER_PX
          );
          if (match) {
            match.talks.push(talk);
            /* Re-average centroid */
            match.cx = match.talks.reduce((s, _, i) => s + projected.find(p => p.talk === match.talks[i]).c[0], 0) / match.talks.length;
            match.cy = match.talks.reduce((s, _, i) => s + projected.find(p => p.talk === match.talks[i]).c[1], 0) / match.talks.length;
          } else {
            clusters.push({ talks: [talk], cx: c[0], cy: c[1] });
          }
        });

        /* ── Render one dot per cluster ── */
        const dotsG = svg.append("g");
        clusters.forEach(cl => {
          const hasUpcoming = cl.talks.some(t => t.type === "upcoming");
          const color = hasUpcoming ? "#4db8ff" : "#00a060";
          const count = cl.talks.length;
          const r = hasUpcoming ? 7.5 : count > 1 ? 7 : 6;
          const cx = cl.cx, cy = cl.cy;

          const g = dotsG.append("g").attr("transform", `translate(${cx},${cy})`);

          if (hasUpcoming) {
            g.append("circle")
              .attr("class", "tm-pulse")
              .attr("r", 11).attr("fill", "none")
              .attr("stroke", color).attr("stroke-width", 1.2).attr("opacity", 0.5);
          }

          g.append("circle").attr("r", r + 3.5).attr("fill", color).attr("opacity", 0.1);

          g.append("circle").attr("r", r)
            .attr("fill", color).attr("opacity", 0.92)
            .attr("stroke", "#0d0d0d").attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .on("mouseover", function () {
              const svgRect  = svg.node().getBoundingClientRect();
              const wrapRect = area.getBoundingClientRect();
              const sx = svgRect.width  / 960;
              const sy = svgRect.height / 520;
              let lx = cx * sx + (svgRect.left - wrapRect.left) + 14;
              let ly = cy * sy + (svgRect.top  - wrapRect.top)  - 14;
              if (lx + 230 > wrapRect.width) lx -= 245;
              if (ly < 0) ly += 50;

              const clusterUpcoming = cl.talks.some(t => t.type === "upcoming");
              tip.className = "tm-tip" + (clusterUpcoming ? " upcoming" : "");

              tip.innerHTML = cl.talks.map((t, i) => {
                const meta = [t.venue, t.date].filter(Boolean).join(" · ");
                const badge = t.type === "upcoming"
                  ? `<span class="tm-tip-badge" style="color:#4db8ff"> · Upcoming</span>` : "";
                const divider = i > 0 ? `<div class="tm-tip-divider"></div>` : "";
                return `${divider}<div class="tm-tip-entry">
                  <strong>${t.name}</strong>
                  <div class="tm-tip-meta">${meta}${badge}</div>
                </div>`;
              }).join("");

              tip.style.left = Math.round(lx) + "px";
              tip.style.top  = Math.round(ly) + "px";
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

  /* Run after DOM is ready */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildMap);
  } else {
    buildMap();
  }

})();
