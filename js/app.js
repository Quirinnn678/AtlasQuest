// Ultra-minimale versie: alleen continenten-quiz met continentkleuren

// ---- Basis instellingen ----
const DEFAULT_VIEW = { center: [0, 20], zoom: 1.5 };
const CONTINENT_COLORS = new Map([
  ["Africa", "#d4a300"],
  ["Asia", "#b65c3a"],
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
const quizHomeEl = document.getElementById("quiz-home");
const quizActiveEl = document.getElementById("quiz-active");
const continentPickerEl = document.getElementById("continent-picker");
const continentPickerLabelEl = continentPickerEl ? continentPickerEl.querySelector(".quiz-label") : null;
const continentOptionsEl = document.getElementById("continent-options");
const continentConfirmBtn = document.getElementById("continent-confirm");
const continentCancelBtn = document.getElementById("continent-cancel");
const continentAllBtn = document.getElementById("continent-all");
const startContinentsBtn = document.getElementById("start-continents-quiz");
const startCountriesBtn = document.getElementById("start-countries-quiz");
const startCapitalsBtn = document.getElementById("start-capitals-quiz");
const startCurrenciesBtn = document.getElementById("start-currencies-quiz");
const changeQuizBtn = document.getElementById("change-quiz-btn");
const currencyOptionsEl = document.getElementById("currency-options");
const currencyRevealEl = document.getElementById("currency-reveal");
const currencyNextBtn = document.getElementById("currency-next-btn");
const warmthMeterEl = document.getElementById("warmth-meter");

// ---- State ----
let continentList = [];
const guessedContinents = new Set();
let currentTargetContinent = null;
let countriesGeojson = null;
let iso3ToRegion = new Map();
const iso3ToName = new Map();
const iso3ToCapitalName = new Map();
let iso3ToCurrency = new Map();
let iso3ToCurrencyFull = new Map();
let allCountryIso3 = [];
let currentCountryTarget = null;
let currentCountryContinent = null;
let currentCountryPool = [];
let currentCapitalContinent = null;
let currentCapitalPool = [];
let allowedCountrySet = null; // UN-member lijst (REST Countries)
let allowedIndependentSet = null; // UN + onafhankelijke staten
let tinyCountryGeojson = null;
let tinyExpandedGeojson = null;
let capitalCoords = new Map(); // iso3 -> [lng, lat]
const guessedCountries = new Set();
const guessedCapitals = new Set();
const guessedCurrencies = new Set();
let currentCurrencyTarget = null;
let currentCurrencyContinent = null;
let currentCurrencyPool = [];
let oceaniaFocused = false;
const OCEANIA_PRIORITY = ["AUS", "NZL"];
const SMALL_COUNTRY_AREA = 2.6e9; // ~2586 km² (Luxemburg)
const OCEANIA_BIG_EXCLUDE = new Set(["AUS", "NZL", "PNG"]);
let pendingContinentChoice = null;
let pickerTargetMode = null; // 'country' | 'capital'
let capitalPool = [];
let currentCapitalTarget = null;
let capitalFeaturesAll = [];
let lastCapitalDistance = null;
let compassMarker = null;
let compassTimeoutId = null;
let currencyAdvanceTimeout = null;
let currencyFeedbackTimeout = null;
const smallHighlightIsos = new Set();
const HATCHED_NAMES = new Set([
  "palestine",
  "somaliland",
  "western sahara",
  "kosovo",
  "hong kong s.a.r.",
  "hong kong",
  "northern cyprus",
  "taiwan",
  "british indian ocean territory",
  "baykonur cosmodrome"
]);
const PERSISTENT_MINI_ISOS = new Set([
  "VAT", // Vatican
  "MCO", // Monaco
  "NRU", // Nauru
  "TUV", // Tuvalu
  "SMR", // San Marino
  "LIE", // Liechtenstein
  "MHL"  // Marshall Islands
]);
// Helper om feature-state op meerdere sources te zetten
function setFeatureStateAll(iso3, state) {
  if (!iso3) return;
  ["my-countries", "tiny-country-expanded", "capital-markers", "country-label-points"].forEach((src) => {
    const source = map.getSource(src);
    if (source) {
      map.setFeatureState({ source: src, id: iso3 }, state);
    }
  });
}
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
  ["bir tawil", "Africa"],
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
  "british indian ocean territory",
  "baykonur cosmodrome"
]);
let quizStage = "continent";
let activeQuiz = null;

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
  if (quizStage !== "currency") {
    hideCurrencyOptions({ cancelTimeout: true });
  }
  const fillLayerId = "my-countries-fill";
  const lineLayerId = "my-countries-line";
  if (!map.getLayer(fillLayerId)) return;
  const tinyLayers = [
    "tiny-country-expanded-fill",
    "tiny-country-expanded-fill-persist"
  ];
  const capitalLayerId = "capital-markers";
  const capitalLabelLayerId = "capital-labels";
  const countryNameLabelId = "country-name-labels";
  const showCapHighlights = quizStage === "country" || quizStage === "capital" || quizStage === "currency";
  if (showCapHighlights) {
    const expr = getCountryColorExpression();
    map.setPaintProperty(fillLayerId, "fill-color", expr);
    map.setLayoutProperty(lineLayerId, "visibility", "visible");
    tinyLayers.forEach((id) => {
      if (map.getLayer(id)) {
        map.setPaintProperty(id, "fill-color", expr);
      }
    });
    if (map.getLayer(capitalLayerId)) {
      map.setLayoutProperty(capitalLayerId, "visibility", quizStage === "capital" ? "visible" : "none");
    }
    if (map.getLayer("capital-markers-highlight")) {
      map.setLayoutProperty("capital-markers-highlight", "visibility", showCapHighlights ? "visible" : "none");
    }
    if (map.getLayer(capitalLabelLayerId)) {
      map.setLayoutProperty(capitalLabelLayerId, "visibility", quizStage === "capital" ? "visible" : "none");
    }
    if (map.getLayer(countryNameLabelId)) {
      map.setLayoutProperty(countryNameLabelId, "visibility", (quizStage === "country" || quizStage === "currency") ? "visible" : "none");
    }
  } else {
    map.setPaintProperty(fillLayerId, "fill-color", getContinentColorExpression());
    map.setLayoutProperty(lineLayerId, "visibility", "visible");
    tinyLayers.forEach((id) => {
      if (map.getLayer(id)) {
        map.setPaintProperty(id, "fill-color", getContinentColorExpression());
      }
    });
    if (map.getLayer(capitalLayerId)) {
      map.setLayoutProperty(capitalLayerId, "visibility", "none");
    }
    if (map.getLayer("capital-markers-highlight")) {
      map.setLayoutProperty("capital-markers-highlight", "visibility", "none");
    }
    if (map.getLayer(capitalLabelLayerId)) {
      map.setLayoutProperty(capitalLabelLayerId, "visibility", "none");
    }
    if (map.getLayer(countryNameLabelId)) {
      map.setLayoutProperty(countryNameLabelId, "visibility", "none");
    }
  }
}

function setQuizText(text, feedback) {
  if (quizStage !== "currency") {
    hideCurrencyOptions({ cancelTimeout: true });
  }
  if (quizTargetEl) quizTargetEl.textContent = text || "Find: –";
  if (quizFeedbackEl) quizFeedbackEl.textContent = feedback || "";
}

function clearCurrencyTimeouts() {
  if (currencyAdvanceTimeout) {
    clearTimeout(currencyAdvanceTimeout);
    currencyAdvanceTimeout = null;
  }
  if (currencyFeedbackTimeout) {
    clearTimeout(currencyFeedbackTimeout);
    currencyFeedbackTimeout = null;
  }
}

function hideCurrencyOptions({ cancelTimeout = false } = {}) {
  if (currencyOptionsEl) {
    currencyOptionsEl.classList.add("hidden");
  }
  if (currencyRevealEl) {
    currencyRevealEl.classList.add("hidden");
    currencyRevealEl.textContent = "";
  }
  if (currencyNextBtn) {
    currencyNextBtn.classList.add("hidden");
  }
  if (cancelTimeout) {
    clearCurrencyTimeouts();
  }
}

function toDegrees(rad) {
  return (rad * 180) / Math.PI;
}

function getBearing(origin, destination) {
  if (!Array.isArray(origin) || !Array.isArray(destination)) return null;
  const [lon1, lat1] = origin;
  const [lon2, lat2] = destination;
  if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) return null;
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

const MAX_DISTANCE_KM = 20000;
const warmColor = "#10b981";
const coldColor = "#dc2626";

if (warmthMeterEl) {
  warmthMeterEl.style.height = "6px";
  warmthMeterEl.style.borderRadius = "999px";
  warmthMeterEl.style.marginTop = "6px";
  warmthMeterEl.style.background = coldColor;
  warmthMeterEl.style.opacity = 0;
  warmthMeterEl.style.transition = "background 0.3s, opacity 0.3s";
}

function resetWarmthMeter() {
  if (warmthMeterEl) {
    warmthMeterEl.style.backgroundImage = "";
    warmthMeterEl.style.opacity = 0;
  }
}

function setWarmthMeter(distance) {
  if (!warmthMeterEl || distance === null) {
    resetWarmthMeter();
    return;
  }
  const ratio = 1 - Math.min(distance / MAX_DISTANCE_KM, 1);
  const percent = Math.round(ratio * 100);
  warmthMeterEl.style.backgroundImage = `linear-gradient(90deg, ${warmColor} ${percent}%, ${coldColor} ${percent}%)`;
  warmthMeterEl.style.opacity = 1;
}

function createCompassElement(bearing) {
  const el = document.createElement("div");
  el.className = "compass-marker";
  const arrow = document.createElement("div");
  arrow.className = "compass-arrow";
  arrow.style.transform = `rotate(${bearing}deg)`;
  el.appendChild(arrow);
  return el;
}

function resetCompass() {
  if (compassMarker) {
    compassMarker.remove();
    compassMarker = null;
  }
  if (compassTimeoutId) {
    clearTimeout(compassTimeoutId);
    compassTimeoutId = null;
  }
}

function showCompassOverlay(coords, bearing) {
  if (!map || !coords || bearing === null) return;
  resetCompass();
  const el = createCompassElement(bearing);
  compassMarker = new maplibregl.Marker({
    element: el,
    anchor: "center"
  }).setLngLat(coords).addTo(map);
  compassTimeoutId = window.setTimeout(() => {
    resetCompass();
  }, 2000);
}

function updateProgress() {
  if (!progressPill) return;
  if (!activeQuiz) {
    progressPill.textContent = "Kies een quiz om te starten.";
    return;
  }
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
  } else if (quizStage === "capital") {
    const pool = currentCapitalPool.length ? currentCapitalPool : capitalPool;
    const total = pool.length;
    const guessed = Array.from(guessedCapitals).filter((iso) => pool.includes(iso)).length;
    if (!total) {
      progressPill.textContent = "Capitals: 0 / ? (loading…)";
      return;
    }
    const percent = total ? ((guessed / total) * 100).toFixed(1) : "0.0";
    progressPill.textContent = `Capitals: ${guessed} / ${total} (${percent}%)`;
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

function resetFeatureStates() {
  if (!countriesGeojson) return;
  (countriesGeojson.features || []).forEach((f) => {
    const iso3 = f.properties["ISO3166-1-Alpha-3"];
    if (iso3) {
      setFeatureStateAll(iso3, { guessed: false, feedback: null, isSpecialLight: null, hatched: null, isHatched: null });
    }
  });
}

function updateCapitalSource() {
  const src = map.getSource("capital-markers");
  if (!src || !capitalFeaturesAll.length) return;
  let pool = [];
  if (quizStage === "capital") {
    pool = currentCapitalPool.length ? currentCapitalPool : capitalPool;
  } else if (quizStage === "country") {
    pool = currentCountryPool.length ? currentCountryPool : allCountryIso3;
  } else {
    pool = capitalPool;
  }
  const feats = pool.length
    ? capitalFeaturesAll.filter((f) => pool.includes(f.properties.iso3))
    : capitalFeaturesAll;
  src.setData({ type: "FeatureCollection", features: feats });
}

function updateMainMenuSelection(mode) {
  if (startContinentsBtn) {
    startContinentsBtn.classList.toggle("active", mode === "continent");
  }
  if (startCountriesBtn) {
    startCountriesBtn.classList.toggle("active", mode === "country");
  }
  if (startCapitalsBtn) {
    startCapitalsBtn.classList.toggle("active", mode === "capital");
  }
  if (startCurrenciesBtn) {
    startCurrenciesBtn.classList.toggle("active", mode === "currency");
  }
}

function getPickerContinents(mode) {
  if (mode === "country" || mode === "capital" || mode === "currency") {
    return continentList.filter((c) => c !== "Antarctica");
  }
  return continentList;
}

function renderContinentOptions(mode) {
  if (!continentOptionsEl) return;
  continentOptionsEl.innerHTML = "";
  const list = getPickerContinents(mode);
  list.forEach((cont) => {
    const btn = document.createElement("button");
    btn.className = "quiz-home-btn";
    btn.textContent = cont;
    btn.dataset.continent = cont;
    btn.addEventListener("click", () => {
      pendingContinentChoice = cont;
      updateContinentSelectionUI();
    });
    continentOptionsEl.appendChild(btn);
  });
  updateContinentSelectionUI();
}

function updateContinentSelectionUI() {
  if (!continentOptionsEl) return;
  const buttons = continentOptionsEl.querySelectorAll("button");
  buttons.forEach((btn) => {
    const cont = btn.dataset.continent;
    if (pendingContinentChoice === cont) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  if (continentAllBtn) {
    if (!pendingContinentChoice) {
      continentAllBtn.classList.add("active");
    } else {
      continentAllBtn.classList.remove("active");
    }
  }
}

function showQuizHome() {
  quizStage = "continent";
  activeQuiz = null;
  guessedContinents.clear();
  guessedCountries.clear();
  guessedCapitals.clear();
  currentTargetContinent = null;
  currentCountryTarget = null;
  currentCountryContinent = null;
  currentCountryPool = [];
  currentCapitalContinent = null;
  currentCapitalPool = [];
  currentCapitalTarget = null;
  resetFeatureStates();
  updateCapitalSource();
  hideCurrencyOptions({ cancelTimeout: true });
  setQuizText("Find: –", "Kies een quiz om te starten.");
  if (quizHomeEl) quizHomeEl.classList.remove("hidden");
  if (quizActiveEl) quizActiveEl.classList.add("hidden");
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  pendingContinentChoice = null;
  updateMainMenuSelection(null);
  updateMapStylingForStage();
  updateProgress();
}

function flyToContinent(continent) {
  console.log("Flying to continent:", continent);
  if (!continent || !countriesGeojson) return;
  const target = canonicalRegion(continent);
  // Hand-tuned viewboxes for better framing
  const customBounds = {
    "North America": [
      [-172, -10], // west Alaska, extend south toward Caribbean
      [-77, 73]    // east Washington DC, north just above Alaska tips
    ],
    Europe: [
      [-11.5, 34], // west Ireland, south Mediterranean edge
      [33, 72]     // east Belarus, north Scandinavia
    ]
  };
  if (target === "Oceania") {
    map.flyTo({ center: [134, -25], zoom: 2.9, duration: 900 });
    return;
  }
  const preset = customBounds[target];
  if (preset) {
    map.fitBounds(preset, { padding: 40, duration: 900 });
    return;
  }
  const feats = (countriesGeojson.features || []).filter(
    (f) => canonicalRegion((f.properties || {}).region) === target
  );
  if (!feats.length) return;
  const bbox = turf.bbox({ type: "FeatureCollection", features: feats });
  if (!bbox || bbox.length !== 4) return;
  map.fitBounds(
    [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]]
    ],
    { padding: 40, duration: 900 }
  );
}

function flyToLand(iso) {
  console.log("Flying to land:", iso);
  if (!countriesGeojson) {
    console.log("No countriesGeojson");
    return;
  }
  const feat = countriesGeojson.features.find(f => f.properties["ISO3166-1-Alpha-3"] === iso || f.properties.ISO_A3 === iso);
  console.log("Found feature:", !!feat);
  if (!feat) return;
  const bbox = turf.bbox(feat);
  console.log("Bbox:", bbox);
  if (!bbox || bbox.length !== 4) return;
  const lonSpan = Math.abs(bbox[2] - bbox[0]);
  if (lonSpan >= 180) {
    const coords = [];
    turf.coordEach(feat, (coord) => {
      if (Array.isArray(coord) && coord.length >= 2) {
        coords.push([coord[0], coord[1]]);
      }
    });
    if (coords.length) {
      const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      const mean = coords.reduce(
        (acc, c) => {
          const rad = toRadians(c[0]);
          acc.x += Math.cos(rad);
          acc.y += Math.sin(rad);
          return acc;
        },
        { x: 0, y: 0 }
      );
      const meanLon = Math.atan2(mean.y, mean.x) * (180 / Math.PI);
      if (Number.isFinite(meanLon) && Number.isFinite(avgLat)) {
        map.flyTo({ center: [meanLon, avgLat], zoom: 4.5, duration: 900 });
        return;
      }
    }
  }
  map.fitBounds(
    [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]]
    ],
    { padding: 50, duration: 900 }
  );
}

function startContinentQuiz() {
  quizStage = "continent";
  activeQuiz = "continent";
  hideCurrencyOptions({ cancelTimeout: true });
  guessedContinents.clear();
  resetFeatureStates();
  currentCountryTarget = null;
  currentCapitalTarget = null;
  guessedCapitals.clear();
  currentCountryContinent = null;
  currentCountryPool = [];
  currentCapitalContinent = null;
  currentCapitalPool = [];
  updateCapitalSource();
  updateMainMenuSelection("continent");
  if (quizHomeEl) quizHomeEl.classList.add("hidden");
  if (quizActiveEl) quizActiveEl.classList.remove("hidden");
  updateMapStylingForStage();
  pickNextContinent();
  updateProgress();
}

function openContinentPicker(mode = "country") {
  if (!continentList.length) {
    setQuizText("Find: –", "Data is nog niet geladen; probeer zo weer.");
    updateProgress();
    return;
  }
  pickerTargetMode = mode;
  hideCurrencyOptions({ cancelTimeout: true });
  quizStage = mode === "capital" ? "capital" : "country";
  activeQuiz = quizStage;
  updateMainMenuSelection(quizStage);
  pendingContinentChoice = null;
  renderContinentOptions(mode);
  if (continentPickerLabelEl) {
    continentPickerLabelEl.textContent = mode === "capital"
      ? "Kies een continent voor de Capitals quiz"
      : "Kies een continent voor de Countries quiz";
  }
  if (quizHomeEl) quizHomeEl.classList.add("hidden");
  if (quizActiveEl) quizActiveEl.classList.add("hidden");
  if (continentPickerEl) continentPickerEl.classList.remove("hidden");
  setQuizText("Find: –", "Kies een continent voor de quiz.");
}

function startCountryQuizWithContinent(continentChoice) {
  quizStage = "country";
  activeQuiz = "country";
  hideCurrencyOptions({ cancelTimeout: true });
  currentCountryTarget = null;
  currentCapitalTarget = null;
  guessedCountries.clear();
  guessedContinents.clear();
  guessedCapitals.clear();
  resetFeatureStates();
  oceaniaFocused = false;
  updateMainMenuSelection("country");
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (quizHomeEl) quizHomeEl.classList.add("hidden");
  if (quizActiveEl) quizActiveEl.classList.remove("hidden");
  updateMapStylingForStage();

  const normalizedChoice = continentChoice ? canonicalRegion(continentChoice.trim()) : "";
  if (normalizedChoice && continentList.includes(normalizedChoice)) {
    currentCountryContinent = normalizedChoice;
    currentCountryPool = allCountryIso3.filter(
      (iso) => canonicalRegion(iso3ToRegion.get(iso)) === normalizedChoice
    );
  } else {
    currentCountryContinent = null;
    currentCountryPool = [];
  }

  updateCapitalSource();
  if (currentCountryContinent) {
    flyToContinent(currentCountryContinent);
  }
  pickNextCountryTarget();
  updateProgress();
}

function startCapitalQuiz() {
  openContinentPicker("capital");
}

function startCapitalQuizWithContinent(continentChoice) {
  console.log("startCapitalQuizWithContinent called with:", continentChoice);
  quizStage = "capital";
  activeQuiz = "capital";
  hideCurrencyOptions({ cancelTimeout: true });
  currentCapitalTarget = null;
  guessedCapitals.clear();
  guessedCurrencies.clear();
  guessedCountries.clear();
  guessedContinents.clear();
  resetFeatureStates();
  updateMainMenuSelection("capital");
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (quizHomeEl) quizHomeEl.classList.add("hidden");
  if (quizActiveEl) quizActiveEl.classList.remove("hidden");
  updateMapStylingForStage();

  const normalizedChoice = continentChoice ? canonicalRegion(continentChoice.trim()) : "";
  if (normalizedChoice && continentList.includes(normalizedChoice)) {
    currentCapitalContinent = normalizedChoice;
    currentCapitalPool = capitalPool.filter(
      (iso) => canonicalRegion(iso3ToRegion.get(iso)) === normalizedChoice
    );
  } else {
    currentCapitalContinent = null;
    currentCapitalPool = [];
  }

  updateCapitalSource();
  if (currentCapitalContinent) {
    flyToContinent(currentCapitalContinent);
  }
  pickNextCapitalTarget();
  updateProgress();
}

function startCurrenciesQuizWithContinent(continentChoice) {
  console.log("startCurrenciesQuizWithContinent called with:", continentChoice);
  quizStage = "currency";
  activeQuiz = "currency";
  hideCurrencyOptions({ cancelTimeout: true });
  currentCurrencyTarget = null;
  guessedCurrencies.clear();
  guessedCountries.clear();
  guessedContinents.clear();
  resetFeatureStates();
  updateMainMenuSelection("currency");
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (quizHomeEl) quizHomeEl.classList.add("hidden");
  if (quizActiveEl) quizActiveEl.classList.remove("hidden");
  updateMapStylingForStage();

  const normalizedChoice = continentChoice ? canonicalRegion(continentChoice.trim()) : "";
  if (normalizedChoice && continentList.includes(normalizedChoice)) {
    currentCurrencyContinent = normalizedChoice;
    const continentIsos = allCountryIso3.filter(
      (iso) => canonicalRegion(iso3ToRegion.get(iso)) === normalizedChoice
    );
    currentCurrencyPool = continentIsos.filter(iso => iso3ToCurrency.has(iso));
  } else {
    currentCurrencyContinent = null;
    currentCurrencyPool = [];
  }

  if (currentCurrencyContinent) {
    flyToContinent(currentCurrencyContinent);
  }
  pickNextCurrencyTarget();
  updateProgress();
}

function pickNextContinent() {
  if (!continentList.length) {
    setQuizText("Find: –", "Continent list not ready.");
    return;
  }
  const remaining = continentList.filter((c) => !guessedContinents.has(c));
  if (!remaining.length) {
    setQuizText("All continents guessed!", "Continue learning? Start the Countries quiz!");
    return;
  }
  const next = remaining[Math.floor(Math.random() * remaining.length)];
  currentTargetContinent = next;
  setQuizText(`Find continent: ${next}`, "");
}

function pickNextCountryTarget() {
  const pool = currentCountryPool.length ? currentCountryPool : allCountryIso3;
  const remaining = pool.filter((iso) => !guessedCountries.has(iso));
  if (!pool.length || !remaining.length) {
    setQuizText("All countries guessed!", "Continue learning? Start the Capitals quiz!");
    currentCountryTarget = null;
    return;
  }
  // In Oceanië eerst Australië en Nieuw-Zeeland afhandelen
  if (currentCountryContinent === "Oceania") {
    const priorityRemaining = OCEANIA_PRIORITY.filter((iso) => remaining.includes(iso));
    if (priorityRemaining.length) {
      currentCountryTarget = priorityRemaining[0];
      const name = iso3ToName.get(currentCountryTarget) || currentCountryTarget;
      setQuizText(`Find country: ${name}`, "");
      if (quizStage === "country" && currentCountryTarget === "DNK") {
        setFeatureStateAll("GRL", {isHatched: true});
      }
      return;
    }
  }

  const randomIso = remaining[Math.floor(Math.random() * remaining.length)];
  currentCountryTarget = randomIso;
  const name = iso3ToName.get(randomIso) || randomIso;
  setQuizText(`Find country: ${name}`, "");

  if (quizStage === "country" && currentCountryTarget === "DNK") {
    setFeatureStateAll("GRL", {isHatched: true});
  }
}

function simplifyCurrency(name) {
  const lower = name.toLowerCase();
  if (lower.includes('dollar')) return 'Dollar';
  if (lower.includes('euro')) return 'Euro';
  if (lower.includes('pound')) return 'Pound';
  if (lower.includes('shekel')) return 'Shekel';
  if (lower.includes('riyal')) return 'Riyal';
  if (lower.includes('peso')) return 'Peso';
  if (lower.includes('franc')) return 'Franc';
  if (lower.includes('krona')) return 'Krona';
  if (lower.includes('krone')) return 'Krone';
  if (lower.includes('rand')) return 'Rand';
  if (lower.includes('won')) return 'Won';
  if (lower.includes('yen')) return 'Yen';
  // Default: last word capitalized
  const words = name.split(' ');
  const last = words[words.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
}

function pickNextCurrencyTarget() {
  if (!currentCurrencyPool.length) {
    setQuizText("Find: –", "Currency list not ready.");
    currentCurrencyTarget = null;
    return;
  }
  if (currencyNextBtn) {
    currencyNextBtn.classList.add("hidden");
  }
  const remaining = currentCurrencyPool.filter((iso) => !guessedCurrencies.has(iso));
  if (!remaining.length) {
    setQuizText("All currencies guessed!", "Great job.");
    currentCurrencyTarget = null;
    return;
  }
  const randomIso = remaining[Math.floor(Math.random() * remaining.length)];
  currentCurrencyTarget = randomIso;
  const countryName = iso3ToName.get(randomIso) || randomIso;
  setQuizText(`What is the currency of ${countryName}?`, "");
  flyToLand(randomIso);
  // Show options
  const optionsEl = currencyOptionsEl;
  if (!optionsEl) return;
  optionsEl.classList.remove("hidden");
  if (currencyRevealEl) {
    currencyRevealEl.classList.add("hidden");
    currencyRevealEl.textContent = "";
  }
  const correct = iso3ToCurrency.get(randomIso);
  const fullName = iso3ToCurrencyFull.get(randomIso) || correct;
  const allCurrencies = Array.from(new Set(iso3ToCurrency.values()));
  const others = allCurrencies.filter(c => c !== correct);
  // Shuffle others
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const options = [correct, ...others.slice(0, 3)];
  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const buttons = optionsEl.querySelectorAll(".currency-option-btn");
  buttons.forEach((btn, i) => {
    btn.classList.remove("hidden");
    btn.textContent = options[i];
    btn.disabled = false;
    btn.style.background = "#fff";
    btn.onclick = () => {
      if (options[i] === correct) {
        btn.style.background = "#10b981"; // green
        setQuizText("Correct!", "Klik op 'Volgende currency' om door te gaan.");
        guessedCurrencies.add(randomIso);
        updateProgress();
        buttons.forEach(b => {
          b.disabled = true;
          b.classList.add("hidden");
        });
        if (currencyRevealEl) {
          currencyRevealEl.textContent = fullName;
          currencyRevealEl.classList.remove("hidden");
        }
        if (currencyNextBtn) {
          currencyNextBtn.classList.remove("hidden");
        }
      } else {
        btn.style.background = "#dc2626"; // red
        setQuizText(`Wrong, correct is ${correct}`, "");
        buttons.forEach(b => b.disabled = true);
        if (currencyFeedbackTimeout) {
          clearTimeout(currencyFeedbackTimeout);
          currencyFeedbackTimeout = null;
        }
        currencyFeedbackTimeout = setTimeout(() => {
          currencyFeedbackTimeout = null;
          if (quizStage !== "currency") return;
          buttons.forEach(b => {
            b.disabled = false;
            b.style.background = "#fff";
          });
          setQuizText(`What is the currency of ${countryName}?`, "");
        }, 2000);
      }
    };
  });
}

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function getDistanceBetweenCoords(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) return null;
  const R = 6371; // km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const aHarv = Math.sin(dLat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
  return R * c;
}

function provideWarmColdHint(guessIso) {
  if (!currentCapitalTarget || !guessIso) return;
  const targetCoords = capitalCoords.get(currentCapitalTarget);
  const guessCoords = capitalCoords.get(guessIso);
  if (!targetCoords || !guessCoords) return;
  const distance = getDistanceBetweenCoords(guessCoords, targetCoords);
  if (distance === null) return;
  lastCapitalDistance = distance;
  setWarmthMeter(distance);
  const bearing = getBearing(guessCoords, targetCoords);
  console.log("Bearing from", guessIso, "to", currentCapitalTarget, ":", bearing);
  const adjustedBearing = (bearing + 180) % 360;
  if (adjustedBearing !== null) {
    showCompassOverlay(guessCoords, adjustedBearing);
  } else {
    resetCompass();
  }
  const capitalName = iso3ToCapitalName.get(currentCapitalTarget) || iso3ToName.get(currentCapitalTarget) || currentCapitalTarget;
  setQuizText(`Find capital: ${capitalName}`, "");
}

function pickNextCapitalTarget() {
  const pool = currentCapitalPool.length ? currentCapitalPool : capitalPool;
  if (!pool.length) {
    setQuizText("Find: –", "Capital list not ready.");
    currentCapitalTarget = null;
    return;
  }
  const remaining = pool.filter((iso) => !guessedCapitals.has(iso));
  if (!remaining.length) {
    setQuizText("All capitals guessed!", "Great job.");
    currentCapitalTarget = null;
    return;
  }
  const next = remaining[Math.floor(Math.random() * remaining.length)];
  currentCapitalTarget = next;
  const capitalName = iso3ToCapitalName.get(next);
  const countryName = iso3ToName.get(next) || next;
  lastCapitalDistance = null;
  resetWarmthMeter();
  resetCompass();
  setQuizText(`Find capital: ${capitalName || countryName}`, "Click the capital circle on the map.");
}

// ---- Kaart ----
const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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
  if (!activeQuiz) return;
  const layerId = feature.layer && feature.layer.id;
  const region = canonicalRegion(feature.properties.region);
  let iso3 = feature.properties["ISO3166-1-Alpha-3"] || feature.properties.iso3;

  if (quizStage === "capital") {
    // alleen klikken op capital markers telt
    const iso = feature.properties.iso3 || iso3;
    if (!iso || layerId !== "capital-markers") return;
    if (!currentCapitalTarget) return;
    if (iso === currentCapitalTarget) {
      setFeatureStateAll(iso, { guessed: true, feedback: null });
      guessedCapitals.add(iso);
      const capitalName = iso3ToCapitalName.get(iso) || iso3ToName.get(iso) || iso;
      setQuizText(`Correct: ${capitalName}`, "Picking next capital…");
      lastCapitalDistance = null;
      updateProgress();
      pickNextCapitalTarget();
    } else {
      provideWarmColdHint(iso);
    }
    return;
  }

  if (quizStage === "country") {
    if (!currentCountryTarget || !iso3) return;
    if (iso3 === currentCountryTarget) {
      const isLightChild = LIGHT_GREEN_CHILDREN.has((feature.properties.name || "").toLowerCase());
      setFeatureStateAll(iso3, { guessed: true, feedback: null, isSpecialLight: isLightChild });
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
          setFeatureStateAll(childIso, { guessed: true, feedback: null, isSpecialLight: true, hatched: true, isHatched: true });
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
            setFeatureStateAll(iso, { guessed: true });
          }
        }
      });
    }
    setQuizText(`Correct: ${region}`, "Pick next continent…");
    updateProgress();
    pickNextContinent();
  } else {
    setQuizText(`Find continent: ${currentTargetContinent}`, `That was ${region}.`);
  }
}

map.on("load", async () => {
  async function addSvgIcon(map, id, svgUrl, size = 64) {
    const cacheBustUrl = `${svgUrl}${svgUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
    const svgText = await fetch(cacheBustUrl).then((r) => r.text());
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    if (map.hasImage(id)) map.removeImage(id);
    const imageData = ctx.getImageData(0, 0, size, size);
    map.addImage(id, { width: size, height: size, data: imageData.data }, { pixelRatio: 2 });
  }

  // Probeer live regio-data + UN/independent-lijst op te halen
  let currencies = {};
  try {
    const resp = await fetch("https://restcountries.com/v3.1/all?fields=cca3,region,subregion,unMember,independent,capital,capitalInfo,currencies");
    if (resp.ok) {
      const data = await resp.json();
      const m = new Map();
      const allowed = new Set();
      const independent = new Set();
      const caps = new Map();
      const currFull = new Map();
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
        if (Array.isArray(c.capital) && c.capital.length) {
          iso3ToCapitalName.set(iso3, String(c.capital[0]));
        }
        if (c.currencies) {
          const currKeys = Object.keys(c.currencies);
          if (currKeys.length) {
            const fullName = c.currencies[currKeys[0]].name;
            const simpleName = simplifyCurrency(fullName);
            currencies[iso3] = simpleName;
            currFull.set(iso3, fullName);
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
      iso3ToCurrency = new Map(Object.entries(currencies));
      iso3ToCurrencyFull = currFull;
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
  map.addSource("tiny-country-expanded", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    promoteId: "iso3"
  });
  map.addSource("capital-markers", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    promoteId: "iso3"
  });
  map.addSource("country-label-points", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    promoteId: "iso3"
  });
  const geojson = await fetch("data/countries.geojson").then((r) => r.json());
  countriesGeojson = geojson;

  try {
    map.addSource("mountains", {
      type: "geojson",
      data: "data/mountains.geojson"
    });
    const DEBUG_MOUNTAINS = false;
    if (DEBUG_MOUNTAINS) {
      map.addLayer({
        id: "poi-mountains-debug",
        type: "circle",
        source: "mountains",
        paint: {
          "circle-color": "#ef4444",
          "circle-radius": 12,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
          "circle-opacity": 0.9
        },
        minzoom: 0
      });
    }
    let mountainIconReady = false;
    try {
      await addSvgIcon(map, "icon-mountain", "data/icons/mountain.svg", 72);
      mountainIconReady = true;
    } catch (e) {
      console.warn("Kon mountain icoon niet laden, gebruik fallback.", e);
      try {
        const size = 64;
        const data = new Uint8Array(size * size * 4);
        const peakX = Math.floor(size / 2);
        const peakY = 8;
        const baseY = size - 6;
        for (let y = peakY; y <= baseY; y++) {
          const t = (y - peakY) / (baseY - peakY);
          const halfWidth = Math.floor((size / 2 - 6) * t);
          const startX = peakX - halfWidth;
          const endX = peakX + halfWidth;
          for (let x = startX; x <= endX; x++) {
            const idx = (y * size + x) * 4;
            data[idx] = 17;
            data[idx + 1] = 24;
            data[idx + 2] = 39;
            data[idx + 3] = 255;
          }
        }
        if (map.hasImage("icon-mountain")) map.removeImage("icon-mountain");
        map.addImage("icon-mountain", { width: size, height: size, data });
        mountainIconReady = true;
      } catch (fallbackErr) {
        console.warn("Kon fallback mountain icoon niet laden.", fallbackErr);
      }
    }
    if (mountainIconReady) {
      map.addLayer({
        id: "poi-mountains",
        type: "symbol",
        source: "mountains",
        filter: ["==", ["get", "kind"], "mountain_range"],
        layout: {
          "icon-image": "icon-mountain",
          "icon-size": 0.8,
          "icon-allow-overlap": true,
          "text-field": ["get", "name"],
          "text-size": 13,
          "text-offset": [0, 1.1],
          "text-anchor": "top"
        },
        paint: {
          "text-halo-width": 0,
          "text-color": "#ffffff"
        },
        minzoom: 0
      });
    }

    const poiIcons = [
      ["icon-windmill", "data/icons/windmill.svg"],
      ["icon-architecture", "data/icons/architecture.svg"],
      ["icon-archaeology", "data/icons/archaeology.svg"],
      ["icon-art", "data/icons/art.svg"],
      ["icon-historic_city", "data/icons/historic_city.svg"],
      ["icon-cultural_landscape", "data/icons/cultural_landscape.svg"],
      ["icon-industrial", "data/icons/industrial.svg"],
      ["icon-religious", "data/icons/religious.svg"],
      ["icon-other", "data/icons/other.svg"]
    ];
    const loadedPoiIcons = new Set();
    for (const [id, url] of poiIcons) {
      try {
        await addSvgIcon(map, id, url, 72);
        loadedPoiIcons.add(id);
      } catch (e) {
        console.warn(`Kon POI icoon niet laden: ${id}`, e);
      }
    }
    console.log(
      "[poi-icons] registered:",
      poiIcons.map(([id]) => `${id}=${map.hasImage(id) ? "yes" : "no"}`).join(", ")
    );
    if (loadedPoiIcons.has("icon-windmill")) {
      map.addSource("poi", {
        type: "geojson",
        data: "data/poi.geojson"
      });
      map.addLayer({
        id: "poi-icons",
        type: "symbol",
        source: "poi",
        layout: {
          "icon-image": ["coalesce", ["get", "icon"], "icon-windmill"],
          "icon-size": 0.7,
          "icon-allow-overlap": true,
          "text-allow-overlap": true,
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.1],
          "text-anchor": "top"
        },
        paint: {
          "text-halo-width": 0,
          "text-color": "#ffffff",
          "icon-opacity": 1,
          "text-opacity": 1
        },
        minzoom: 0
      });
    }
  } catch (e) {
    console.warn("Kon mountain POI lagen niet laden.", e);
  }

  // Detecteer buren (bbox overlap) om eilanden te herkennen
  const featuresWithIso = (geojson.features || []).filter(
    (f) => (f.properties || {})["ISO3166-1-Alpha-3"]
  );
  const bboxes = featuresWithIso.map((f) => turf.bbox(f));
  const isoHasNeighbor = new Map();
  featuresWithIso.forEach((f) => {
    const iso = f.properties["ISO3166-1-Alpha-3"];
    isoHasNeighbor.set(iso, false);
  });
  for (let i = 0; i < featuresWithIso.length; i++) {
    for (let j = i + 1; j < featuresWithIso.length; j++) {
      const a = bboxes[i];
      const b = bboxes[j];
      const overlap =
        !(a[0] > b[2] || a[2] < b[0] || a[1] > b[3] || a[3] < b[1]);
      if (overlap) {
        const isoA = featuresWithIso[i].properties["ISO3166-1-Alpha-3"];
        const isoB = featuresWithIso[j].properties["ISO3166-1-Alpha-3"];
        isoHasNeighbor.set(isoA, true);
        isoHasNeighbor.set(isoB, true);
      }
    }
  }

  // Bepaal continenten en kleur per feature
  const continentSet = new Set();
  const tinyFeatures = [];
  const tinyExpandedFeatures = [];
  const expandedAdded = new Set();
  const DISABLE_EXPANDED_BLOBS = true;
  const MALDIVES_AREA_THRESHOLD = 3e8; // ~300 km²
  const ISLAND_AREA_THRESHOLD = 5e9; // ~5.000 km² voor eilandstaatjes
  const capitalFeatures = [];
  const countryLabelPoints = [];
  smallHighlightIsos.clear();
  // Kies centroid van grootste polygon zodat het label op het hoofdland valt (France/USA etc.)
  function mainPolygonCenter(feature) {
    try {
      const flat = turf.flatten(feature);
      let best = null;
      let bestArea = -1;
      (flat.features || []).forEach((poly) => {
        const area = turf.area(poly);
        if (area > bestArea) {
          bestArea = area;
          best = poly;
        }
      });
      const target = best || feature;
      return turf.centroid(target);
    } catch (e) {
      return turf.centroid(feature);
    }
  }
  // Helper: maak een convex hull met een antimeridiaan-wrap zodat verspreide eilandstaten
  // een aaneengesloten 'blob' krijgen zonder wereldwijde strepen.
  // Simpele, kleine convex buffer om een vloeiende blob rond minilanden te tekenen
  function buildWrappedHull(feature, bufferKm = 20) {
    const pts = [];
    turf.coordEach(feature, (coord) => {
      pts.push([coord[0], coord[1]]);
    });
    if (!pts.length) return null;

    const lons = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    const spanLon = Math.max(...lons) - Math.min(...lons);
    const spanLat = Math.max(...lats) - Math.min(...lats);
    if (spanLon > 80 || spanLat > 80) return null;

    const hullFc = {
      type: "FeatureCollection",
      features: pts.map((c) => ({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: c }
      }))
    };

    let hull = turf.convex(hullFc);
    if (!hull) return null;
    hull = turf.buffer(hull, bufferKm, { units: "kilometers" });

    const b = turf.bbox(hull);
    const spanLonBuf = Math.abs(b[2] - b[0]);
    const spanLatBuf = Math.abs(b[3] - b[1]);
    if (spanLonBuf > 80 || spanLatBuf > 80) return null;
    const hullArea = turf.area(hull);
    if (hullArea > 8e11) return null; // sanity check

    return hull;
  }

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
    const isExcludedName = nameLower === "somaliland" || nameLower === "new caledonia" || nameLower === "crimea";
    const isValidIso = iso3 && iso3 !== "-99";
    const isAllowed =
      !allowedIndependentSet || (isValidIso && allowedIndependentSet.has(iso3));
    if (isValidIso && !isExcludedName && isAllowed) {
      allCountryIso3.push(iso3);
      iso3ToName.set(iso3, f.properties.name || iso3);
    }

    // Tiny marker + outline targets
    const area = turf.area(f);
    const hasNeighbor = isValidIso ? isoHasNeighbor.get(iso3) : false;
    const isIslandState = isValidIso && hasNeighbor === false;
    const isOceania = region === "Oceania";
    const allowOceaniaHighlight = isOceania && !OCEANIA_BIG_EXCLUDE.has(iso3);
    // Sla kleine landen/eilandstaten op voor capital-highlight
    if (
      isValidIso &&
      (!allowedIndependentSet || allowedIndependentSet.has(iso3)) &&
      (allowOceaniaHighlight || isIslandState || area <= SMALL_COUNTRY_AREA)
    ) {
      smallHighlightIsos.add(iso3);
    }
    // Markers voor zeer kleine landen/eilanden: alleen voor onafhankelijke/UN staten met echte ISO
    if (
      isValidIso &&
      (area <= MALDIVES_AREA_THRESHOLD || area <= ISLAND_AREA_THRESHOLD) &&
      (!allowedIndependentSet || allowedIndependentSet.has(iso3))
    ) {
      const capCoord = capitalCoords.get(iso3);
      const centroid = mainPolygonCenter(f);
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
    if (isValidIso && (!allowedIndependentSet || allowedIndependentSet.has(iso3))) {
      const centroid = mainPolygonCenter(f);
      countryLabelPoints.push({
        type: "Feature",
        properties: { iso3, name: f.properties.name || iso3 },
        geometry: centroid.geometry
      });
    }
  });

  // Maak stabiele lijst (7 continenten), Antarctica uit de countries-quiz gefilterd
  continentList = Array.from(continentSet).filter((c) => CONTINENT_COLORS.has(c) && c !== "Antarctica").sort();
  // Capital pool en features (alleen landen met coördinaten)
  capitalPool = allCountryIso3.filter((iso) => capitalCoords.has(iso));
  capitalPool.forEach((iso) => {
    const coord = capitalCoords.get(iso);
    if (!coord) return;
    const capName = iso3ToCapitalName.get(iso) || iso3ToName.get(iso) || iso;
    capitalFeatures.push({
      type: "Feature",
      properties: {
        iso3: iso,
        name: capName,
        countryName: iso3ToName.get(iso) || iso,
        highlight: smallHighlightIsos.has(iso)
      },
      geometry: {
        type: "Point",
        coordinates: coord
      }
    });
  });
  capitalFeaturesAll = capitalFeatures;
  renderContinentOptions();

  const src = map.getSource("my-countries");
  if (src) src.setData(geojson);
  tinyCountryGeojson = { type: "FeatureCollection", features: tinyFeatures };
  tinyExpandedGeojson = { type: "FeatureCollection", features: [] };
  const tinySrc = map.getSource("tiny-country-markers");
  if (tinySrc && tinyCountryGeojson) tinySrc.setData(tinyCountryGeojson);
  const tinyExpSrc = map.getSource("tiny-country-expanded");
  if (tinyExpSrc && tinyExpandedGeojson) tinyExpSrc.setData(tinyExpandedGeojson);
  const capitalSrc = map.getSource("capital-markers");
  if (capitalSrc) {
    capitalSrc.setData({ type: "FeatureCollection", features: capitalFeatures });
  }
  const countryLabelSrc = map.getSource("country-label-points");
  if (countryLabelSrc) {
    countryLabelSrc.setData({ type: "FeatureCollection", features: countryLabelPoints });
  }
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
    paint: {
      "fill-pattern": "diag-hatch",
      "fill-opacity": [
        "case",
        ["any",
          ["==", ["get", "isHatched"], true],
          ["==", ["feature-state", "hatched"], true],
          ["==", ["feature-state", "isHatched"], true]
        ],
        0.35,
        0
      ]
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
    id: "country-name-labels-poly",
    type: "symbol",
    source: "my-countries",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 12,
      "text-anchor": "center",
      "text-allow-overlap": false,
      "text-ignore-placement": false,
      visibility: "none"
    },
    paint: {
      "text-color": "#111827",
      "text-halo-color": "#f8fafc",
      "text-halo-width": 1.2,
      "text-opacity": [
        "case",
        ["boolean", ["feature-state", "guessed"], false], 1,
        0
      ]
    }
  });

  // Expanded tiny polygons bovenop landen (lage zoom)
  map.addLayer({
    id: "tiny-country-expanded-fill",
    type: "fill",
    source: "tiny-country-expanded",
    minzoom: 0,
    maxzoom: 0,
    filter: ["==", ["get", "isPersistentMini"], false],
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "forceGray"], true], "#cbd5e1",
        ["has", "regionColor"], ["get", "regionColor"],
        "#cbd5e1"
      ],
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "guessed"], false], 0.9,
        0.55
      ]
    }
  });

  map.addLayer({
    id: "tiny-country-expanded-line",
    type: "line",
    source: "tiny-country-expanded",
    minzoom: 0,
    maxzoom: 0,
    filter: ["==", ["get", "isPersistentMini"], false],
    paint: {
      "line-color": "#111827",
      "line-width": 0.8
    }
  });

  // Persistent minis (blijven zichtbaar tot hogere zoom)
  map.addLayer({
    id: "tiny-country-expanded-fill-persist",
    type: "fill",
    source: "tiny-country-expanded",
    minzoom: 0,
    maxzoom: 0,
    filter: ["==", ["get", "isPersistentMini"], true],
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "forceGray"], true], "#cbd5e1",
        ["has", "regionColor"], ["get", "regionColor"],
        "#cbd5e1"
      ],
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "guessed"], false], 0.9,
        0.55
      ]
    }
  });

  map.addLayer({
    id: "tiny-country-expanded-line-persist",
    type: "line",
    source: "tiny-country-expanded",
    minzoom: 0,
    maxzoom: 0,
    filter: ["==", ["get", "isPersistentMini"], true],
    paint: {
      "line-color": "#111827",
      "line-width": 0.8
    }
  });

  map.addLayer({
    id: "capital-markers",
    type: "circle",
    source: "capital-markers",
    paint: {
      "circle-color": [
        "case",
        ["boolean", ["feature-state", "guessed"], false], "#16a34a",
        "#111827"
      ],
      "circle-radius": 5,
      "circle-stroke-color": "#f9fafb",
      "circle-stroke-width": 1.5
    },
    layout: {
      visibility: "none"
    }
  });

  map.addLayer({
    id: "capital-markers-highlight",
    type: "circle",
    source: "capital-markers",
    filter: ["==", ["get", "highlight"], true],
    paint: {
      "circle-color": "rgba(239,68,68,0)",
      "circle-radius": 12,
      "circle-stroke-color": "#ef4444",
      "circle-stroke-width": 2.5,
      "circle-stroke-opacity": 0.8
    },
    layout: {
      visibility: "none"
    }
  });

  map.addLayer({
    id: "capital-labels",
    type: "symbol",
    source: "capital-markers",
    minzoom: 1,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 10,
      "text-anchor": "left",
      "text-offset": [0.6, 0],
      visibility: "none"
    },
    paint: {
      "text-color": "#0f172a",
      "text-halo-color": "#f9fafb",
      "text-halo-width": 1,
      "text-opacity": [
        "case",
        ["boolean", ["feature-state", "guessed"], false], 1,
        0
      ]
    }
  });

  map.addLayer({
    id: "country-name-labels",
    type: "symbol",
    source: "country-label-points",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 13,
      "text-anchor": "center",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-offset": [0, 0],
      visibility: "none"
    },
    paint: {
      "text-color": "#0f172a",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.6,
      "text-opacity": [
        "case",
        ["boolean", ["feature-state", "guessed"], false], 1,
        0
      ]
    }
  });

  // Keep name labels above lines/fills
  if (map.getLayer("country-name-labels")) {
    map.moveLayer("country-name-labels");
  }
  if (map.getLayer("country-name-labels-poly")) {
    map.moveLayer("country-name-labels-poly");
  }
  if (map.getLayer("poi-mountains")) {
    map.moveLayer("poi-mountains");
  }
  if (map.getLayer("poi-icons")) {
    map.moveLayer("poi-icons");
  }
  if (map.getLayer("poi-mountains-debug")) {
    map.moveLayer("poi-mountains-debug");
  }

  // Tiny markers terug als visuele hint
  showQuizHome();
});

map.on("click", "my-countries-fill", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  handleFeatureClick(feature);
});

map.on("click", (e) => {
  // Klik op water reset feedback
  if (!activeQuiz) return;
  const feats = map.queryRenderedFeatures(e.point, { layers: ["my-countries-fill"] });
  if (!feats || !feats.length) {
    if (quizStage === "country") {
      // behoud huidige country target
      if (currentCountryTarget) {
        const name = iso3ToName.get(currentCountryTarget) || currentCountryTarget;
        setQuizText(`Find country: ${name}`, "");
      } else {
        setQuizText("Find: –", "");
      }
    } else if (quizStage === "capital") {
      if (currentCapitalTarget) {
        const cap = iso3ToCapitalName.get(currentCapitalTarget) || iso3ToName.get(currentCapitalTarget) || currentCapitalTarget;
        setQuizText(`Find capital: ${cap}`, "");
      } else {
        setQuizText("Find: –", "");
      }
    } else {
      setQuizText(`Find continent: ${currentTargetContinent || "–"}`, "");
    }
  }
});

// Maak tiny markers klikbaar
// Klik op exploded tiny polygons
map.on("click", "tiny-country-expanded-fill", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  handleFeatureClick(feature);
});

map.on("click", "capital-markers", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  handleFeatureClick(feature);
});

map.on("click", "capital-markers-highlight", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  handleFeatureClick(feature);
});

// Reset knop
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    hideCurrencyOptions({ cancelTimeout: true });
    guessedContinents.clear();
    guessedCountries.clear();
    guessedCapitals.clear();
    guessedCurrencies.clear();
    oceaniaFocused = false;
    currentCountryContinent = null;
    currentCountryPool = [];
    currentCapitalContinent = null;
    currentCapitalPool = [];
    currentCurrencyContinent = null;
    currentCurrencyPool = [];
    resetFeatureStates();
    if (!activeQuiz) {
      setQuizText("Find: –", "Kies een quiz om te starten.");
      updateProgress();
      return;
    }
    if (quizStage === "country") {
      pickNextCountryTarget();
    } else if (quizStage === "capital") {
      pickNextCapitalTarget();
    } else {
      pickNextContinent();
      setQuizText(`Find continent: ${currentTargetContinent || "–"}`, "");
    }
    updateProgress();
  });
}

if (startContinentsBtn) {
  startContinentsBtn.addEventListener("click", startContinentQuiz);
}

if (startCountriesBtn) {
  startCountriesBtn.addEventListener("click", openContinentPicker);
}

if (startCapitalsBtn) {
  startCapitalsBtn.addEventListener("click", () => openContinentPicker("capital"));
}

if (startCurrenciesBtn) {
  startCurrenciesBtn.addEventListener("click", () => openContinentPicker("currency"));
}

if (changeQuizBtn) {
  changeQuizBtn.addEventListener("click", () => {
    showQuizHome();
  });
}

if (continentConfirmBtn) {
  continentConfirmBtn.addEventListener("click", () => {
    if (pickerTargetMode === "capital") {
      startCapitalQuizWithContinent(pendingContinentChoice);
    } else if (pickerTargetMode === "currency") {
      startCurrenciesQuizWithContinent(pendingContinentChoice);
    } else {
      startCountryQuizWithContinent(pendingContinentChoice);
    }
  });
}

if (continentCancelBtn) {
  continentCancelBtn.addEventListener("click", () => {
    showQuizHome();
  });
}

if (continentAllBtn) {
  continentAllBtn.addEventListener("click", () => {
    pendingContinentChoice = null;
    updateContinentSelectionUI();
  });
}

if (currencyNextBtn) {
  currencyNextBtn.addEventListener("click", () => {
    if (quizStage !== "currency") return;
    currencyNextBtn.classList.add("hidden");
    hideCurrencyOptions();
    pickNextCurrencyTarget();
  });
}
