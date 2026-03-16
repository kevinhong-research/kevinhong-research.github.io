/* ============================================================
   footballmap.js — visited FBS school map for /football/
   Data source: window.FOOTBALL_MAP_DATA from _data/football.yml
   ============================================================ */

(function () {
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
    "06": [90, 330],
    "26": [670, 155],
    "12": [730, 490],
    "24": [760, 285],
    "02": null,
    "15": null,
  };

  const MIN_AREA = 900;
  const MARKER_SIZE = 28;
  const COLLISION_PX = 26;
  const POWER_FOUR_SCHOOLS = new Set([
    "Arizona State University",
    "Baylor University",
    "Boston College",
    "Brigham Young University",
    "Clemson University",
    "Duke University",
    "Florida State University",
    "Georgia Institute of Technology",
    "Indiana University",
    "Iowa State University",
    "Kansas State University",
    "Louisville University",
    "Michigan State University",
    "North Carolina State University",
    "Northwestern University",
    "Ohio State University",
    "Oklahoma State University",
    "Penn State University",
    "Purdue University",
    "Rutgers University",
    "Southern Methodist University",
    "Stanford University",
    "Syracuse University",
    "TCU",
    "Texas A&M University",
    "Texas Christian University",
    "Texas Tech University",
    "University of Alabama",
    "University of Arizona",
    "University of Arkansas",
    "University of Auburn",
    "University of California, Berkeley",
    "University of Central Florida",
    "University of Cincinnati",
    "University of Colorado Boulder",
    "University of Florida",
    "University of Georgia",
    "University of Houston",
    "University of Illinois Urbana-Champaign",
    "University of Iowa",
    "University of Kansas",
    "University of Kentucky",
    "University of Maryland",
    "University of Miami",
    "University of Michigan",
    "University of Minnesota",
    "University of Mississippi",
    "University of Missouri",
    "University of Nebraska",
    "University of North Carolina at Chapel Hill",
    "University of Oklahoma",
    "University of Oregon",
    "University of Pittsburgh",
    "University of South Carolina",
    "University of Southern California",
    "University of Tennessee",
    "University of Texas at Austin",
    "University of Utah",
    "University of Virginia",
    "University of Washington",
    "University of Wisconsin-Madison",
    "Vanderbilt University",
    "Virginia Tech",
    "Wake Forest University",
    "West Virginia University",
  ]);
  const POWER_FOUR_CONFERENCES = {
    "Arizona State University": "Big 12",
    "Baylor University": "Big 12",
    "Boston College": "ACC",
    "Brigham Young University": "Big 12",
    "Clemson University": "ACC",
    "Duke University": "ACC",
    "Florida State University": "ACC",
    "Georgia Institute of Technology": "ACC",
    "Indiana University": "Big Ten",
    "Iowa State University": "Big 12",
    "Kansas State University": "Big 12",
    "Louisville University": "ACC",
    "Michigan State University": "Big Ten",
    "North Carolina State University": "ACC",
    "Northwestern University": "Big Ten",
    "Ohio State University": "Big Ten",
    "Oklahoma State University": "Big 12",
    "Penn State University": "Big Ten",
    "Purdue University": "Big Ten",
    "Rutgers University": "Big Ten",
    "Southern Methodist University": "ACC",
    "Stanford University": "ACC",
    "Syracuse University": "ACC",
    "TCU": "Big 12",
    "Texas Christian University": "Big 12",
    "Texas A&M University": "SEC",
    "Texas Tech University": "Big 12",
    "University of Alabama": "SEC",
    "University of Arizona": "Big 12",
    "University of Arkansas": "SEC",
    "University of Auburn": "SEC",
    "University of California, Berkeley": "ACC",
    "University of Central Florida": "Big 12",
    "University of Cincinnati": "Big 12",
    "University of Colorado Boulder": "Big 12",
    "University of Florida": "SEC",
    "University of Georgia": "SEC",
    "University of Houston": "Big 12",
    "University of Illinois Urbana-Champaign": "Big Ten",
    "University of Iowa": "Big Ten",
    "University of Kansas": "Big 12",
    "University of Kentucky": "SEC",
    "University of Maryland": "Big Ten",
    "University of Miami": "ACC",
    "University of Michigan": "Big Ten",
    "University of Minnesota": "Big Ten",
    "University of Mississippi": "SEC",
    "University of Missouri": "SEC",
    "University of Nebraska": "Big Ten",
    "University of North Carolina at Chapel Hill": "ACC",
    "University of Oklahoma": "SEC",
    "University of Oregon": "Big Ten",
    "University of Pittsburgh": "ACC",
    "University of South Carolina": "SEC",
    "University of Southern California": "Big Ten",
    "University of Tennessee": "SEC",
    "University of Texas at Austin": "SEC",
    "University of Utah": "Big 12",
    "University of Virginia": "ACC",
    "University of Washington": "Big Ten",
    "University of Wisconsin-Madison": "Big Ten",
    "Vanderbilt University": "SEC",
    "Virginia Tech": "ACC",
    "Wake Forest University": "ACC",
    "West Virginia University": "Big 12",
  };
  const POWER_FOUR_STADIUMS = {
    "Arizona State University": "Mountain America Stadium",
    "Boston College": "Alumni Stadium",
    "Florida State University": "Doak Campbell Stadium",
    "Ohio State University": "Ohio Stadium",
    "Tulane University": "Yulman Stadium",
    "University of Arizona": "Arizona Stadium",
    "University of Georgia": "Sanford Stadium",
    "University of Houston": "TDECU Stadium",
    "University of Illinois Urbana-Champaign": "Memorial Stadium",
    "University of Maryland": "SECU Stadium",
    "University of Miami": "Hard Rock Stadium",
    "University of Minnesota": "Huntington Bank Stadium",
    "University of Oklahoma": "Gaylord Family Oklahoma Memorial Stadium",
    "University of Pittsburgh": "Acrisure Stadium",
    "University of Southern California": "Los Angeles Memorial Coliseum",
    "University of Texas at Austin": "Darrell K Royal-Texas Memorial Stadium",
    "University of Utah": "Rice-Eccles Stadium",
    "University of Virginia": "Scott Stadium",
    "University of Washington": "Husky Stadium",
    "University of Wisconsin-Madison": "Camp Randall Stadium",
    "Virginia Tech": "Lane Stadium",
    "University of South Florida": "Raymond James Stadium",
  };
  const POWER_FOUR_TITLES = {
    "Arizona State University": [],
    "Boston College": [1940],
    "Florida State University": [1993, 1999, 2013],
    "Ohio State University": [1942, 1954, 1957, 1961, 1968, 1970, 2002, 2014, 2024],
    "University of Arizona": [],
    "University of Georgia": [1942, 1980, 2021, 2022],
    "University of Houston": [],
    "University of Illinois Urbana-Champaign": [1914, 1919, 1923, 1927, 1951],
    "University of Maryland": [1953],
    "University of Miami": [1983, 1987, 1989, 1991, 2001],
    "University of Minnesota": [1934, 1935, 1936, 1940, 1941, 1960],
    "University of Oklahoma": [1950, 1955, 1956, 1974, 1975, 1985, 2000],
    "University of Pittsburgh": [1910, 1915, 1916, 1918, 1929, 1931, 1934, 1936, 1937, 1976],
    "University of Southern California": [1928, 1931, 1932, 1939, 1962, 1967, 1972, 1974, 1978, 2003, 2004],
    "University of Texas at Austin": [1963, 1969, 1970, 2005],
    "University of Utah": [],
    "University of Virginia": [],
    "University of Washington": [1960, 1991],
    "University of Wisconsin-Madison": [],
    "Virginia Tech": [],
  };
  const POWER_FOUR_HEAD_COACHES = {
    "Arizona State University": "Kenny Dillingham",
    "Boston College": "Bill O'Brien",
    "Florida State University": "Mike Norvell",
    "Ohio State University": "Ryan Day",
    "University of Arizona": "Brent Brennan",
    "University of Georgia": "Kirby Smart",
    "University of Houston": "Willie Fritz",
    "University of Illinois Urbana-Champaign": "Bret Bielema",
    "University of Maryland": "Mike Locksley",
    "University of Miami": "Mario Cristobal",
    "University of Minnesota": "P.J. Fleck",
    "University of Oklahoma": "Brent Venables",
    "University of Pittsburgh": "Pat Narduzzi",
    "University of Southern California": "Lincoln Riley",
    "University of Texas at Austin": "Steve Sarkisian",
    "University of Utah": "Morgan Scalley",
    "University of Virginia": "Tony Elliott",
    "University of Washington": "Jedd Fisch",
    "University of Wisconsin-Madison": "Luke Fickell",
    "Virginia Tech": "James Franklin",
  };

  function mergeEntries(entries, overrides) {
    const merged = new Map();

    (entries || []).forEach((entry) => {
      if (!entry || !entry.school) return;
      if (merged.has(entry.school)) return;
      const override = overrides && overrides[entry.school] ? overrides[entry.school] : {};
      merged.set(entry.school, {
        ...entry,
        ...override,
        school: entry.school,
        football_name: override.football_name || entry.football_name || entry.school,
        logo: override.logo || entry.logo || "",
        stadium: override.stadium || entry.stadium || POWER_FOUR_STADIUMS[entry.school] || "",
        conference: override.conference || entry.conference || POWER_FOUR_CONFERENCES[entry.school] || "",
        head_coach: override.head_coach || entry.head_coach || POWER_FOUR_HEAD_COACHES[entry.school] || "",
        lat: Number.isFinite(override.lat) ? override.lat : entry.lat,
        lng: Number.isFinite(override.lng) ? override.lng : entry.lng,
        championships: Array.isArray(override.championships)
          ? override.championships
          : ((entry.championships && entry.championships.length)
            ? entry.championships
            : (POWER_FOUR_TITLES[entry.school] || [])),
        favorite_players: Array.isArray(override.favorite_players) ? override.favorite_players : (entry.favorite_players || []),
      });
    });

    return Array.from(merged.values());
  }

  function cleanEntries(entries) {
    return (entries || []).filter(
      (entry) =>
        POWER_FOUR_SCHOOLS.has(entry.school) &&
        Number.isFinite(entry.lat) &&
        Number.isFinite(entry.lng) &&
        entry.logo
    );
  }

  function computeMetrics(entries) {
    return {
      schools: entries.length,
      titles: entries.reduce((sum, entry) => sum + ((entry.championships || []).length || 0), 0),
    };
  }

  function initToggle(entries) {
    const strip = document.getElementById("football-map-toggle");
    const body = document.getElementById("football-map-body");
    const hint = document.getElementById("fb-pill-hint-geo");
    const schools = document.getElementById("fb-count-schools");
    const titles = document.getElementById("fb-count-titles");
    if (!strip || !body) return;

    const metrics = computeMetrics(entries);
    if (schools) schools.textContent = metrics.schools;
    if (titles) titles.textContent = metrics.titles;

    let built = false;

    function openMap() {
      strip.setAttribute("aria-expanded", "true");
      strip.classList.add("fb-pills--open");
      body.classList.add("fb-body--open");
      if (hint) hint.textContent = "Hide the Map";
      if (!built) {
        buildMap(entries);
        built = true;
      }
    }

    function closeMap() {
      strip.setAttribute("aria-expanded", "false");
      strip.classList.remove("fb-pills--open");
      body.classList.remove("fb-body--open");
      if (hint) hint.textContent = "Show the Map";
    }

    strip.addEventListener("click", () => {
      if (strip.getAttribute("aria-expanded") === "true") {
        closeMap();
      } else {
        openMap();
      }
    });

    strip.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        strip.click();
      }
    });

    openMap();
  }

  function initSectionToggle(toggleId, bodyId, hintId) {
    const strip = document.getElementById(toggleId);
    const body = document.getElementById(bodyId);
    const hint = document.getElementById(hintId);
    if (!strip || !body) return;

    function openSection() {
      strip.setAttribute("aria-expanded", "true");
      strip.classList.add("fb-pills--open");
      body.classList.add("fb-body--open");
      if (hint) {
        hint.textContent = hintId === "fb-pill-hint-teams" ? "Hide the Teams" : "Hide the Players";
      }
    }

    function closeSection() {
      strip.setAttribute("aria-expanded", "false");
      strip.classList.remove("fb-pills--open");
      body.classList.remove("fb-body--open");
      if (hint) {
        hint.textContent = hintId === "fb-pill-hint-teams" ? "Show the Teams" : "Show the Players";
      }
    }

    strip.addEventListener("click", () => {
      if (strip.getAttribute("aria-expanded") === "true") {
        closeSection();
      } else {
        openSection();
      }
    });

    strip.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        strip.click();
      }
    });

    openSection();
  }

  function buildEmptyState(container) {
    container.innerHTML = `
      <div class="fb-wrap">
        <div class="fb-empty">
          Add visited schools to <code>_data/football.yml</code> with logos, coordinates,
          stadium images, championship years, and favorite players to populate the map.
        </div>
      </div>`;
  }

  function spreadPoints(points) {
    const laidOut = points.map((point) => ({
      ...point,
      x: point.x,
      y: point.y,
      ox: point.x,
      oy: point.y,
    }));

    for (let iter = 0; iter < 18; iter += 1) {
      for (let i = 0; i < laidOut.length; i += 1) {
        for (let j = i + 1; j < laidOut.length; j += 1) {
          const a = laidOut[i];
          const b = laidOut[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          if (dist >= COLLISION_PX) continue;
          const push = (COLLISION_PX - dist) * 0.5;
          dx /= dist;
          dy /= dist;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
        }
      }

      laidOut.forEach((point) => {
        point.x += (point.ox - point.x) * 0.14;
        point.y += (point.oy - point.y) * 0.14;
      });
    }

    return laidOut;
  }

  function buildTooltip(entry) {
    const location = [entry.city, entry.state].filter(Boolean).join(", ");
    const titles = (entry.championships || []).length ? entry.championships.join(", ") : "None yet";
    const headCoach = entry.head_coach || "Not listed";
    const stadium = entry.stadium || "Stadium";
    const title = entry.football_name || entry.school;
    const photoQuery = `${stadium} ${title} stadium field logo`;
    const photoHref = entry.stadium_image
      ? entry.stadium_image
      : `https://www.bing.com/images/search?q=${encodeURIComponent(photoQuery)}`;
    const image = entry.stadium_image
      ? `<a class="fb-tip-photo-link" href="${photoHref}" target="_blank" rel="noopener noreferrer"><div class="fb-tip-photo"><img src="${entry.stadium_image}" alt="${stadium}"></div></a>`
      : "";
    const note = entry.note ? `<div class="fb-tip-note">${entry.note}</div>` : "";
    const conference = entry.conference || "Not listed";
    const kicker = (location || conference) ? `<div class="fb-tip-kicker">${location || conference}</div>` : "";
    const stadiumLabel = entry.stadium
      ? `<a class="fb-tip-stadium-link" href="${photoHref}" target="_blank" rel="noopener noreferrer">${stadium}</a>`
      : stadium;

    return `${image}
      <div class="fb-tip-body">
        ${kicker}
        <strong class="fb-tip-title">${title}</strong>
        <div class="fb-tip-sub">${stadiumLabel}</div>
        <div class="fb-tip-rows">
          <div class="fb-tip-row">
            <div class="fb-tip-row-label">Titles</div>
            <div class="fb-tip-row-value">${titles}</div>
          </div>
          <div class="fb-tip-row">
            <div class="fb-tip-row-label">Head Coach</div>
            <div class="fb-tip-row-value">${headCoach}</div>
          </div>
        </div>
        ${note}
      </div>`;
  }

  function placeTooltip(tip, area, svg, x, y) {
    const svgRect = svg.node().getBoundingClientRect();
    const wrapRect = area.getBoundingClientRect();
    const sx = svgRect.width / 960;
    const sy = svgRect.height / 580;
    const tipRect = tip.getBoundingClientRect();
    const tipWidth = tipRect.width || 250;
    const tipHeight = tipRect.height || 260;
    const markerLeft = x * sx + (svgRect.left - wrapRect.left);
    const markerTop = y * sy + (svgRect.top - wrapRect.top);
    let left = markerLeft + 18;
    let top = markerTop - 18;

    if (left + tipWidth > wrapRect.width - 12) {
      left = markerLeft - tipWidth - 18;
    }
    if (left < 12) left = 12;

    const bottomLimit = Math.min(wrapRect.height - 8, window.innerHeight - wrapRect.top - 12);
    if (top + tipHeight > bottomLimit) {
      top = markerTop - tipHeight - 18;
    }
    if (top < 12) {
      top = Math.max(12, bottomLimit - tipHeight);
    }

    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function buildMap(entries) {
    const container = document.getElementById("football-map-container");
    if (!container) return;

    const cleaned = cleanEntries(entries);
    if (!cleaned.length) {
      buildEmptyState(container);
      return;
    }

    container.innerHTML = `
      <div class="fb-wrap">
        <div class="fb-map-area">
          <div id="fb-tip" class="fb-tip"></div>
          <svg id="fb-svg" viewBox="0 0 960 580"></svg>
        </div>
      </div>`;

    const svg = d3.select("#fb-svg");
    const tip = document.getElementById("fb-tip");
    const area = container.querySelector(".fb-map-area");
    const lightbox = document.getElementById("fb-lightbox");
    const lightboxImage = document.getElementById("fb-lightbox-image");
    const lightboxClose = document.getElementById("fb-lightbox-close");
    const projection = d3.geoAlbersUsa().scale(1100).translate([480, 270]);
    const pathFn = d3.geoPath().projection(projection);
    let activeGroup = null;
    let hideTimer = null;
    let lightboxOpen = false;

    function openLightbox(src, alt) {
      if (!lightbox || !lightboxImage) return;
      lightboxImage.src = src;
      lightboxImage.alt = alt || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lightboxOpen = true;
    }

    function closeLightbox() {
      if (!lightbox || !lightboxImage) return;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "";
      document.body.style.overflow = "";
      lightboxOpen = false;
    }

    function clearHideTimer() {
      if (!hideTimer) return;
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }

    function showTooltip(group, point) {
      clearHideTimer();
      if (activeGroup && activeGroup !== group) {
        activeGroup.classed("is-active", false);
      }
      activeGroup = group;
      tip.innerHTML = buildTooltip(point.entry);
      tip.style.display = "block";
      placeTooltip(tip, area, svg, point.x, point.y);
      group.classed("is-active", true);
    }

    function hideTooltipSoon() {
      if (lightboxOpen) return;
      clearHideTimer();
      hideTimer = window.setTimeout(() => {
        tip.style.display = "none";
        if (activeGroup) {
          activeGroup.classed("is-active", false);
          activeGroup = null;
        }
      }, 100);
    }

    tip.addEventListener("mouseenter", () => {
      clearHideTimer();
    });

    tip.addEventListener("mouseleave", () => {
      hideTooltipSoon();
    });

    tip.addEventListener("click", (event) => {
      const link = event.target.closest(".fb-tip-photo-link, .fb-tip-stadium-link");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      openLightbox(href, link.textContent.trim() || "Stadium image");
    });

    if (lightbox && !lightbox.dataset.bound) {
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox || event.target === lightboxImage) {
          closeLightbox();
        }
      });

      if (lightboxClose) {
        lightboxClose.addEventListener("click", () => {
          closeLightbox();
        });
      }

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && lightboxOpen) {
          closeLightbox();
        }
      });

      lightbox.dataset.bound = "true";
    }

    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then((response) => response.json())
      .then((us) => {
        const states = topojson.feature(us, us.objects.states);

        svg.append("g")
          .selectAll("path")
          .data(states.features)
          .join("path")
          .attr("class", "fb-state")
          .attr("d", pathFn);

        svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
          .attr("fill", "none")
          .attr("stroke", "#253040")
          .attr("stroke-width", "0.5")
          .attr("d", pathFn);

        const labels = svg.append("g");
        states.features.forEach((feature) => {
          const id = feature.id.toString().padStart(2, "0");
          const abbr = STATE_ABBR[id];
          if (!abbr) return;
          if (id in CENTROID_OVERRIDES && CENTROID_OVERRIDES[id] === null) return;
          if (pathFn.area(feature) < MIN_AREA) return;

          let cx;
          let cy;
          if (id in CENTROID_OVERRIDES) {
            [cx, cy] = CENTROID_OVERRIDES[id];
          } else {
            const centroid = pathFn.centroid(feature);
            if (!centroid || Number.isNaN(centroid[0])) return;
            [cx, cy] = centroid;
          }

          labels.append("text")
            .attr("class", "fb-state-lbl")
            .attr("x", cx)
            .attr("y", cy)
            .text(abbr);
        });

        const points = cleaned
          .map((entry) => {
            const projected = projection([entry.lng, entry.lat]);
            if (!projected) return null;
            return { entry, x: projected[0], y: projected[1] };
          })
          .filter(Boolean);

        const laidOut = spreadPoints(points);
        const markers = svg.append("g");

        laidOut.forEach((point) => {
          const group = markers.append("g")
            .attr("class", "fb-marker")
            .attr("transform", `translate(${point.x},${point.y})`);

          group.append("ellipse")
            .attr("class", "fb-marker-shadow")
            .attr("cx", 1.5)
            .attr("cy", MARKER_SIZE * 0.42)
            .attr("rx", MARKER_SIZE * 0.34)
            .attr("ry", MARKER_SIZE * 0.12);

          group.append("rect")
            .attr("class", "fb-marker-frame")
            .attr("x", -MARKER_SIZE / 2 - 3)
            .attr("y", -MARKER_SIZE / 2 - 3)
            .attr("width", MARKER_SIZE + 6)
            .attr("height", MARKER_SIZE + 6)
            .attr("rx", 6)
            .attr("ry", 6);

          group.append("image")
            .attr("href", point.entry.logo)
            .attr("x", -MARKER_SIZE / 2)
            .attr("y", -MARKER_SIZE / 2)
            .attr("width", MARKER_SIZE)
            .attr("height", MARKER_SIZE)
            .attr("preserveAspectRatio", "xMidYMid meet");

          group
            .on("mouseenter", function () {
              showTooltip(group, point);
            })
            .on("mouseleave", function () {
              hideTooltipSoon();
            });
        });
      })
      .catch(() => buildEmptyState(container));
  }

  function init() {
    const merged = mergeEntries(window.FOOTBALL_MAP_DATA || [], window.FOOTBALL_OVERRIDES || {});
    const cleaned = cleanEntries(merged);
    initToggle(cleaned);
    initSectionToggle("football-teams-toggle", "football-teams-body", "fb-pill-hint-teams");
    initSectionToggle("football-players-toggle", "football-players-body", "fb-pill-hint-players");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
