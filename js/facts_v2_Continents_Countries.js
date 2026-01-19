// Ultra-minimale versie: alleen continenten-quiz met continentkleuren

// ---- Basis instellingen ----
const DEFAULT_VIEW = { center: [0, 20], zoom: 1.5 };
const CONTINENT_COLORS = new Map([
  ["Africa", "#b65c3a"],
  ["Asia", "#d4a300"],
  ["Europe", "#003399"],
  ["North America", "#b32121"],
  ["South America", "#065f46"],
  ["Oceania", "#0b9da8"],
  ["Antarctica", "#bfc7d5"]
]);

// ---- Element referenties (verwacht in de HTML aanwezig) ----
const quizTargetEl = document.getElementById("quiz-target");
const quizFeedbackEl = document.getElementById("quiz-feedback");
const progressPill = document.getElementById("progress-pill");
const resetBtn = document.getElementById("reset-guesses-btn");

// ---- State ----
let continentList = [];
const guessedContinents = new Set();
let currentTargetContinent = null;
let countriesGeojson = null;
let iso3ToRegion = new Map();
const iso3ToName = new Map();
let allCountryIso3 = [];
let currentCountryTarget = null;
let currentCountryContinent = null;
let currentCountryPool = [];
let allowedCountrySet = null; // UN-member lijst (REST Countries)
let allowedIndependentSet = null; // UN + onafhankelijke staten
let tinyCountryGeojson = null;
let capitalCoords = new Map(); // iso3 -> [lng, lat]
const guessedCountries = new Set();
let oceaniaFocused = false;
const OCEANIA_PRIORITY = ["AUS", "NZL"];
const HATCHED_NAMES = new Set([
  "palestine",
  "somaliland",
  "western sahara",
  "kosovo",
  "hong kong s.a.r.",
  "hong kong",
  "northern cyprus",
  "taiwan",
  "british indian ocean territory"
]);
const FORCE_GRAY_NAMES = new Set([
  "bajo nuevo bank (petrel is.)",
  "serranilla bank",
  "scarborough reef"
]);
const NAME_REGION_OVERRIDE = new Map([
  ["somaliland", "Africa"],
  ["baykonur cosmodrome", "Asia"],
  ["kosovo", "Europe"],
  ["siachen glacier", "Asia"],
  ["southern patagonian ice field", "South America"],
  ["bir tawil", "Africa"]
]);
const SPECIAL_PARENT_ISO = new Map([
  ["palestine", "ISR"],
  ["somaliland", "SOM"],
  ["western sahara", "MAR"],
  ["kosovo", "SRB"],
  ["hong kong", "CHN"],
  ["northern cyprus", "CYP"],
  ["taiwan", "CHN"],
  ["british indian ocean territory", "GBR"],
  ["greenland", "DNK"]
]);
// Corrigeer ontbrekende ISO-codes uit de bron
const NAME_ISO_FIX = new Map([
  ["france", "FRA"],
  ["norway", "NOR"],
  ["somaliland", "SML"], // synthetische code
  ["baykonur cosmodrome", "BYK"], // synthetische code
  ["kosovo", "KSV"], // synthetische code
  ["western sahara", "ESH"],
  ["palestine", "PSE"],
  ["northern cyprus", "NCY"],
  ["greenland", "GRL"],
  ["siachen glacier", "SIA"],
  ["southern patagonian ice field", "SPF"],
  ["bir tawil", "BTW"]
]);
const LIGHT_GREEN_CHILDREN = new Set([
  "palestine",
  "somaliland",
  "western sahara",
  "kosovo",
  "hong kong",
  "northern cyprus",
  "taiwan",
  "british indian ocean territory"
]);
const quizStageSelect = document.getElementById("quiz-stage");
let quizStage = "continent";

// ---- Helpers ----
function canonicalRegion(label) {
  if (!label) return "Other";
  const lower = String(label).toLowerCase();
  if (lower.includes("antarct")) return "Antarctica";
  if (lower === "oceania" || lower === "australia") return "Oceania";
  if (lower === "europe") return "Europe";
  if (lower === "asia") return "Asia";
  if (lower === "africa") return "Africa";
  if (lower.includes("south america")) return "South America";
  if (lower.includes("north america")) return "North America";
  if (lower.includes("americas") || lower.includes("america")) {
    // eenvoudige splitsing o.b.v. subregion of centroid in deriveRegion
    return "Americas";
  }
  return label;
}

function guessRegionFromCentroid(feature) {
  try {
    const c = turf.centroid(feature).geometry.coordinates;
    const [lon, lat] = c || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -60) return "Antarctica";
    // Oceania op basis van longitude
    if ((lon >= 110 || lon <= -110) && lat >= -50 && lat <= 30) return "Oceania";
    // Split Americas: stel lat-drempel hoger om noord/zuid beter te scheiden
    if (lon >= -170 && lon <= -25) {
      return lat >= 12 ? "North America" : "South America";
    }
    // Europa bovenzijde
    if (lon >= -25 && lon <= 60 && lat >= 35) return "Europe";
    // Midden-Oosten/Azië: oostwaarts van 40 en boven evenaar -> Azië
    if (lon > 40 && lat >= 0) return "Asia";
    // Afrika band
    if (lon >= -25 && lon <= 50 && lat >= -35 && lat < 35) return "Africa";
    // Rest → Azië
    return "Asia";
  } catch (e) {
    return null;
  }
}

function deriveRegion(feature) {
  const props = feature.properties || {};
  const iso3 = props["ISO3166-1-Alpha-3"];
  const nameLower = (props.name || "").toLowerCase();
  const overrideByName = NAME_REGION_OVERRIDE.get(nameLower);
  if (overrideByName) return overrideByName;
  const regionFromMap = iso3 ? iso3ToRegion.get(iso3) : null;
  const raw = canonicalRegion(regionFromMap || props.region || props.subregion || props.CONTINENT || props.CONTINENT_CODE);
  if (raw && raw !== "Americas") return raw;
  const guessed = guessRegionFromCentroid(feature);
  if (!guessed) return "Other";
  if (raw === "Americas") {
    // split Americas met dezelfde centroidregel
    return guessed === "North America" || guessed === "South America" ? guessed : "North America";
  }
  return guessed;
}

// Hash-gebaseerde kleurindex voor landen (fallback als MAPCOLOR7 ontbreekt)
// Neutrale kleur voor countries-stage
function getCountryColorExpression() {
  return [
    "case",
    ["==", ["feature-state", "feedback"], "wrong"], "#ef4444",
    ["boolean", ["feature-state", "guessed"], false],
    [
      "case",
      [
        "boolean",
        [
          "coalesce",
          ["feature-state", "isSpecialLight"],
          ["get", "isSpecialLight"]
        ],
        false
      ],
      "#6ee7b7",
      "#156f2f"
    ],
    ["==", ["get", "forceGray"], true], "#cbd5e1",
    "#cbd5e1"
  ];
}

function getContinentColorExpression() {
  return [
    "case",
    ["==", ["get", "forceGray"], true], "#cbd5e1",
    ["has", "regionColor"], ["get", "regionColor"],
    "#cbd5e1"
  ];
}

function updateMapStylingForStage() {
  const fillLayerId = "my-countries-fill";
  const lineLayerId = "my-countries-line";
  if (!map.getLayer(fillLayerId)) return;
  if (quizStage === "country") {
    const expr = getCountryColorExpression();
    map.setPaintProperty(fillLayerId, "fill-color", expr);
    map.setLayoutProperty(lineLayerId, "visibility", "visible");
  } else {
    map.setPaintProperty(fillLayerId, "fill-color", getContinentColorExpression());
    map.setLayoutProperty(lineLayerId, "visibility", "visible");
  }
}

function setQuizText(text, feedback) {
  if (quizTargetEl) quizTargetEl.textContent = text || "Target: –";
  if (quizFeedbackEl) quizFeedbackEl.textContent = feedback || "";
}

function updateProgress() {
  if (!progressPill) return;
  if (quizStage === "country") {
    const pool = currentCountryPool.length ? currentCountryPool : allCountryIso3;
    const total = pool.length;
    const guessed = Array.from(guessedCountries).filter((iso) => pool.includes(iso)).length;
    if (!total) {
      progressPill.textContent = "Guessed: 0 / ? (loading…)";
      return;
    }
    const percent = total ? ((guessed / total) * 100).toFixed(1) : "0.0";
    progressPill.textContent = `Countries (${currentCountryContinent || "all"}): ${guessed} / ${total} (${percent}%)`;
  } else {
    const total = continentList.length;
    const guessed = guessedContinents.size;
    if (!total) {
      progressPill.textContent = "Guessed: 0 / ? (loading…)";
      return;
    }
    const percent = ((guessed / total) * 100).toFixed(1);
    progressPill.textContent = `Guessed: ${guessed} / ${total} (${percent}%)`;
  }
}

function pickNextContinent() {
  if (!continentList.length) {
    setQuizText("Target: –", "Continent list not ready.");
    return;
  }
  const remaining = continentList.filter((c) => !guessedContinents.has(c));
  if (!remaining.length) {
    setQuizText("All continents guessed!", "Great job.");
    return;
  }
  const next = remaining[Math.floor(Math.random() * remaining.length)];
  currentTargetContinent = next;
  setQuizText(`Target continent: ${next}`, "Find this continent on the map.");
}

function pickNextCountryTarget() {
  const pool = currentCountryPool.length ? currentCountryPool : allCountryIso3;
  const remaining = pool.filter((iso) => !guessedCountries.has(iso));
  if (!pool.length || !remaining.length) {
    setQuizText("Target: –", "Country list not ready.");
    currentCountryTarget = null;
    return;
  }
  // In Oceanië eerst Australië en Nieuw-Zeeland afhandelen
  if (currentCountryContinent === "Oceania") {
    const priorityRemaining = OCEANIA_PRIORITY.filter((iso) => remaining.includes(iso));
    if (priorityRemaining.length) {
      currentCountryTarget = priorityRemaining[0];
      const name = iso3ToName.get(currentCountryTarget) || currentCountryTarget;
      setQuizText(`Target country: ${name}`, "Find this country on the map.");
      return;
    }
  }

  const randomIso = remaining[Math.floor(Math.random() * remaining.length)];
  currentCountryTarget = randomIso;
  const name = iso3ToName.get(randomIso) || randomIso;
  setQuizText(`Target country: ${name}`, "Find this country on the map.");
}

// ---- Kaart ----
const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {},
    layers: [
      // Oceaankleur flink blauwer gezet
      { id: "background", type: "background", paint: { "background-color": "#4da6ff" } }
    ]
  },
  center: DEFAULT_VIEW.center,
  zoom: DEFAULT_VIEW.zoom
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

function handleFeatureClick(feature) {
  if (!feature || !feature.properties) return;
  const region = canonicalRegion(feature.properties.region);
  const iso3 = feature.properties["ISO3166-1-Alpha-3"];

  if (quizStage === "country") {
    if (!currentCountryTarget || !iso3) return;
    if (iso3 === currentCountryTarget) {
      const isLightChild = LIGHT_GREEN_CHILDREN.has((feature.properties.name || "").toLowerCase());
      map.setFeatureState(
        { source: "my-countries", id: iso3 },
        { guessed: true, feedback: null, isSpecialLight: isLightChild }
      );
      guessedCountries.add(iso3);
      // Als in Oceanië en prioritylanden klaar zijn, focus op eilanden
      if (
        currentCountryContinent === "Oceania" &&
        OCEANIA_PRIORITY.every((p) => guessedCountries.has(p)) &&
        !oceaniaFocused
      ) {
        oceaniaFocused = true;
        map.flyTo({ center: [170, -10], zoom: 3.5, duration: 1200 });
      }
      // Markeer gekoppelde gebieden lichtgroen mee
      SPECIAL_PARENT_ISO.forEach((parentIso, childName) => {
        if (parentIso === iso3) {
          const childIso = NAME_ISO_FIX.get(childName) || childName.toUpperCase().slice(0, 3);
          map.setFeatureState(
            { source: "my-countries", id: childIso },
            { guessed: true, feedback: null, isSpecialLight: true, hatched: true, isHatched: true }
          );
        }
      });
      setQuizText(`Correct: ${iso3ToName.get(iso3) || iso3}`, "Picking next country…");
      updateProgress();
      pickNextCountryTarget();
    }
    // Als het niet het target is, geef geen straf (zeker bij tiny markers); gewoon niets doen
    return;
  }

  if (!currentTargetContinent) return;

  if (region === currentTargetContinent) {
    guessedContinents.add(region);
    // Markeer alle features in dit continent
    if (countriesGeojson) {
      (countriesGeojson.features || []).forEach((f) => {
        if (canonicalRegion(f.properties.region) === region) {
          const iso = f.properties["ISO3166-1-Alpha-3"];
          if (iso) {
            map.setFeatureState({ source: "my-countries", id: iso }, { guessed: true });
          }
        }
      });
    }
    setQuizText(`Correct: ${region}`, "Pick next continent…");
    updateProgress();
    pickNextContinent();
  } else {
    setQuizText(`Target continent: ${currentTargetContinent}`, `That was ${region}.`);
  }
}

map.on("load", async () => {
  // Probeer live regio-data + UN/independent-lijst op te halen
  try {
    const resp = await fetch("https://restcountries.com/v3.1/all?fields=cca3,region,subregion,unMember,independent,capitalInfo");
    if (resp.ok) {
      const data = await resp.json();
      const m = new Map();
      const allowed = new Set();
      const independent = new Set();
      const caps = new Map();
      data.forEach((c) => {
        if (!c || !c.cca3) return;
        const iso3 = String(c.cca3).toUpperCase();
        if (c.unMember) allowed.add(iso3);
        if (c.unMember || c.independent === true) independent.add(iso3);
        const capInfo = c.capitalInfo && c.capitalInfo.latlng;
        if (Array.isArray(capInfo) && capInfo.length === 2) {
          const [lat, lng] = capInfo;
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            caps.set(iso3, [lng, lat]);
          }
        }
        const baseRegion = canonicalRegion(c.region);
        const sub = c.subregion ? String(c.subregion) : "";
        let reg = baseRegion;
        if (baseRegion === "Americas") {
          reg = /South/i.test(sub) ? "South America" : "North America";
        }
        m.set(iso3, reg);
      });
      iso3ToRegion = m;
      allowedCountrySet = allowed;
      allowedIndependentSet = independent;
      capitalCoords = caps;
    }
  } catch (e) {
    console.warn("Kon restcountries regio niet laden, val terug op centroid-guess.", e);
  }

  map.addSource("my-countries", {
    type: "geojson",
    data: "data/countries.geojson",
    promoteId: "ISO3166-1-Alpha-3"
  });
  map.addSource("tiny-country-markers", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  const geojson = await fetch("data/countries.geojson").then((r) => r.json());
  countriesGeojson = geojson;

  // Bepaal continenten en kleur per feature
  const continentSet = new Set();
  const tinyFeatures = [];
  const MALDIVES_AREA_THRESHOLD = 3e8; // ~300 km²
  const ISLAND_AREA_THRESHOLD = 5e9; // ~5.000 km² voor eilandstaatjes
  (geojson.features || []).forEach((f) => {
    let region = canonicalRegion(deriveRegion(f));
    // Forceer een bruikbare continentnaam zodat kleur niet grijs blijft
    if (!CONTINENT_COLORS.has(region)) {
      const guessed = guessRegionFromCentroid(f);
      const fixed = canonicalRegion(guessed);
      region = CONTINENT_COLORS.has(fixed) ? fixed : region;
    }
    continentSet.add(region);
    // Fix ISO-codes voor -99 entries die we willen gebruiken in feature-state
    const nameLower = (f.properties.name || "").toLowerCase();
    if (LIGHT_GREEN_CHILDREN.has(nameLower)) {
      f.properties.isSpecialLight = true;
    }
    if (HATCHED_NAMES.has(nameLower)) {
      f.properties.isHatched = true;
    }
    if (FORCE_GRAY_NAMES.has(nameLower)) {
      f.properties.forceGray = true;
    }
    if ((f.properties["ISO3166-1-Alpha-3"] === "-99" || !f.properties["ISO3166-1-Alpha-3"]) && NAME_ISO_FIX.has(nameLower)) {
      f.properties["ISO3166-1-Alpha-3"] = NAME_ISO_FIX.get(nameLower);
    }

    const baseColor = CONTINENT_COLORS.get(region) || "#cbd5e1";
    f.properties.region = region;
    f.properties.regionColor = baseColor;

    const iso3 = f.properties["ISO3166-1-Alpha-3"];
    if (iso3) {
      iso3ToRegion.set(iso3, region);
    }
    // Neem alleen echte ISO's mee; filter ISO -99 en uitgesloten namen; beperk tot UN-lijst als beschikbaar
    const isExcludedName = nameLower === "somaliland" || nameLower === "new caledonia";
    const isValidIso = iso3 && iso3 !== "-99";
    const isAllowed =
      !allowedIndependentSet || (isValidIso && allowedIndependentSet.has(iso3));
    if (isValidIso && !isExcludedName && isAllowed) {
      allCountryIso3.push(iso3);
      iso3ToName.set(iso3, f.properties.name || iso3);
    }

    // Tiny marker
    const area = turf.area(f);
    // Markers voor zeer kleine landen/eilanden: alleen voor onafhankelijke/UN staten met echte ISO
    if (
      isValidIso &&
      (area <= MALDIVES_AREA_THRESHOLD || area <= ISLAND_AREA_THRESHOLD) &&
      (!allowedIndependentSet || allowedIndependentSet.has(iso3))
    ) {
      const capCoord = capitalCoords.get(iso3);
      const centroid = turf.centroid(f);
      const pointCoord = capCoord || centroid.geometry.coordinates;
      tinyFeatures.push({
        type: "Feature",
        properties: { iso3, name: f.properties.name || iso3 },
        geometry: {
          type: "Point",
          coordinates: pointCoord
        }
      });
    }
  });

  // Maak stabiele lijst (7 continenten)
  continentList = Array.from(continentSet).filter((c) => CONTINENT_COLORS.has(c)).sort();

  const src = map.getSource("my-countries");
  if (src) src.setData(geojson);
  tinyCountryGeojson = { type: "FeatureCollection", features: tinyFeatures };
  const tinySrc = map.getSource("tiny-country-markers");
  if (tinySrc && tinyCountryGeojson) tinySrc.setData(tinyCountryGeojson);

  // Lagen
  map.addLayer({
    id: "my-countries-fill",
    type: "fill",
    source: "my-countries",
    paint: {
      "fill-color": getContinentColorExpression(),
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "guessed"], false], 1.0,
        0.8
      ]
    }
  });

  // Hatched overlay voor speciale gebieden
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = 8;
  patternCanvas.height = 8;
  const ctx = patternCanvas.getContext("2d");
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(8, 0);
  ctx.stroke();
  const patternData = ctx.getImageData(0, 0, 8, 8).data;
  if (!map.hasImage("diag-hatch")) {
    map.addImage(
      "diag-hatch",
      {
        width: 8,
        height: 8,
        data: patternData
      },
      { pixelRatio: 1 }
    );
  }

  map.addLayer({
    id: "my-countries-hatch",
    type: "fill",
    source: "my-countries",
    filter: [
      "any",
      ["==", ["get", "isHatched"], true],
      ["==", ["feature-state", "hatched"], true],
      ["==", ["feature-state", "isHatched"], true]
    ],
    paint: {
      "fill-pattern": "diag-hatch",
      "fill-opacity": 0.35
    }
  });

  map.addLayer({
    id: "my-countries-line",
    type: "line",
    source: "my-countries",
    paint: {
      "line-color": "#94a3b8",
      "line-width": 0.8
    }
  });

  map.addLayer({
    id: "tiny-country-markers",
    type: "circle",
    source: "tiny-country-markers",
    minzoom: 3,
    paint: {
      "circle-color": "#111827",
      "circle-opacity": 0.0,
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        3, 1.6,
        5, 2.6,
        8, 3.8
      ],
      "circle-stroke-color": "#111827",
      "circle-stroke-width": 1.0,
      "circle-stroke-opacity": 0.9
    }
  });

  updateMapStylingForStage();
  pickNextContinent();
  updateProgress();
});

map.on("click", "my-countries-fill", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  handleFeatureClick(feature);
});

map.on("click", (e) => {
  // Klik op water reset feedback
  const feats = map.queryRenderedFeatures(e.point, { layers: ["my-countries-fill"] });
  if (!feats || !feats.length) {
    setQuizText(`Target continent: ${currentTargetContinent || "–"}`, "");
  }
});

// Maak tiny markers klikbaar
map.on("click", "tiny-country-markers", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  // Koppel naar echte feature data door iso3 op te zoeken
  const iso3 = feature.properties && feature.properties.iso3;
  if (!iso3 || !countriesGeojson) return;
  const match = (countriesGeojson.features || []).find(
    (f) => f.properties && f.properties["ISO3166-1-Alpha-3"] === iso3
  );
  handleFeatureClick(match || feature);
});

// Reset knop
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    guessedContinents.clear();
    guessedCountries.clear();
    // reset feature-state
    if (countriesGeojson) {
      (countriesGeojson.features || []).forEach((f) => {
        const iso3 = f.properties["ISO3166-1-Alpha-3"];
        if (iso3) {
          map.setFeatureState({ source: "my-countries", id: iso3 }, { guessed: false });
        }
      });
    }
    pickNextContinent();
    updateProgress();
  });
}

// Stage wisselen (continents -> countries)
  if (quizStageSelect) {
    quizStageSelect.addEventListener("change", () => {
      quizStage = quizStageSelect.value || "continent";
      oceaniaFocused = false;
      updateMapStylingForStage();
      if (quizStage === "continent") {
        pickNextContinent();
        setQuizText(`Target continent: ${currentTargetContinent || "–"}`, "Find this continent on the map.");
      } else {
      // reset guessed states for countries view
      guessedCountries.clear();
      if (countriesGeojson) {
        (countriesGeojson.features || []).forEach((f) => {
          const iso = f.properties["ISO3166-1-Alpha-3"];
          if (iso) {
            map.setFeatureState({ source: "my-countries", id: iso }, { guessed: false, feedback: null });
          }
        });
      }
      // Kies eerst een continent voor de landenquiz
      const chosen =
        prompt(
          `Kies een continent voor de landen-quiz (${continentList.join(", ")}). Laat leeg voor allemaal.`
        ) || "";
      const normalizedChoice = canonicalRegion(chosen.trim());
      if (continentList.includes(normalizedChoice)) {
        currentCountryContinent = normalizedChoice;
        currentCountryPool = allCountryIso3.filter(
          (iso) => canonicalRegion(iso3ToRegion.get(iso)) === normalizedChoice
        );
      } else {
        currentCountryContinent = null;
        currentCountryPool = [];
      }
      pickNextCountryTarget();
    }
    updateProgress();
  });
}
