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
const statusTargetEl = document.getElementById("status-target");
const statusProgressEl = document.getElementById("status-progress");
const statusFlagEl = document.getElementById("status-flag");
const menuBtn = document.getElementById("menu-btn");
const quizPanelEl = document.getElementById("quiz-panel");
const quizActiveEl = document.getElementById("quiz-active");
const continentPickerEl = document.getElementById("continent-picker");
const continentPickerLabelEl = continentPickerEl ? continentPickerEl.querySelector(".quiz-label") : null;
const continentOptionsEl = document.getElementById("continent-options");
const continentConfirmBtn = document.getElementById("continent-confirm");
const continentCancelBtn = document.getElementById("continent-cancel");
const continentAllBtn = document.getElementById("continent-all");
const heritagePickerEl = document.getElementById("heritage-picker");
const heritageOptionsEl = document.getElementById("heritage-options");
const heritageConfirmBtn = document.getElementById("heritage-confirm");
const heritageCancelBtn = document.getElementById("heritage-cancel");
const startContinentsBtn = document.getElementById("start-continents-quiz");
const startCountriesBtn = document.getElementById("start-countries-quiz");
const startCapitalsBtn = document.getElementById("start-capitals-quiz");
const startCurrenciesBtn = document.getElementById("start-currencies-quiz");
const startHeritageBtn = document.getElementById("start-heritage-quiz");
const changeQuizBtn = document.getElementById("change-quiz-btn");
const currencyOptionsEl = document.getElementById("currency-options");
const currencyRevealEl = document.getElementById("currency-reveal");
const currencyNextBtn = document.getElementById("currency-next-btn");
const warmthMeterEl = document.getElementById("warmth-meter");
const fameFilter3 = document.getElementById("filter-fame-3");
const fameFilter2 = document.getElementById("filter-fame-2");
const fameFilter1 = document.getElementById("filter-fame-1");
const mountainsToggle = document.getElementById("toggle-mountains");
const selectAllCategoriesBtn = document.getElementById("select-all-categories");
const deselectAllCategoriesBtn = document.getElementById("deselect-all-categories");
const infoPillEl = document.getElementById("info-pill");
const infoCountryEl = document.getElementById("info-country");
const infoTaglineEl = document.getElementById("info-tagline");
const infoFactsEl = document.getElementById("info-facts");
const factsBlockEl = document.getElementById("facts-block");
const factsToggleEl = document.getElementById("facts-toggle");
const wikiThumbEl = document.getElementById("wiki-thumb");
const wikiExtractEl = document.getElementById("wiki-extract");
const wikiLinkEl = document.getElementById("wiki-link");
const wikiSourceEl = document.getElementById("wiki-source");
const creditsPanelEl = document.getElementById("credits-panel");
const creditsListEl = document.getElementById("credits-list");
const startScreenEl = document.getElementById("start-screen");
const startCultureBtn = document.getElementById("start-culture");
const startNatureBtn = document.getElementById("start-nature");
const startMountainsBtn = document.getElementById("start-mountains-quiz");
const startCreditsBtn = document.getElementById("start-credits");
const creditsScreenEl = document.getElementById("credits-screen");
const creditsListScreenEl = document.getElementById("credits-list-screen");
const creditsBackBtn = document.getElementById("credits-back");
const natureControlsEl = document.getElementById("nature-controls");
const cultureControlsEl = document.getElementById("culture-controls");
const quizScreenEl = document.getElementById("quiz-screen");
const quizScreenTitleEl = document.getElementById("quiz-screen-title");
const quizScreenCultureEl = document.getElementById("quiz-screen-culture");
const quizScreenNatureEl = document.getElementById("quiz-screen-nature");
const quizBackBtn = document.getElementById("quiz-back");
const quizToastEl = document.getElementById("quiz-toast");

const wikiCacheByQid = new Map();
const wikiCacheByTitle = new Map();
let creditsLoaded = false;
const categoryFilters = new Map([
  ["built_archaeological", document.getElementById("filter-cat-built-archaeological")],
  ["art_symbolic", document.getElementById("filter-cat-art-symbolic")],
  ["cultural_landscapes", document.getElementById("filter-cat-cultural-landscapes")],
  ["historic_cities", document.getElementById("filter-cat-historic-cities")],
  ["engineering_industry", document.getElementById("filter-cat-engineering-industry")]
]);

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
const iso3ToIso2 = new Map();
let currentCountryTarget = null;
let currentCountryContinent = null;
let currentCountryPool = [];
let currentCountryPrimaryPool = [];
let currentCountrySecondaryPool = [];
let currentCountryTier = "primary";
let countryQuestionMode = "name";
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
let mountainsGeojson = null;
let mountainNames = [];
let currentMountainTarget = null;
const guessedMountains = new Set();
const mountainCoords = new Map();
let poiGeojson = null;
const heritageCoords = new Map();
const countryCentroids = new Map();
let lastProgressText = "";
let correctStreak = 0;
let factsExpanded = false;
let lastFactsItems = [];
let quizToastTimer = null;
let suppressGenericCountryClick = false;
let heritageCategoryChoice = null;
let heritageLevel = 3;
let currentHeritageTarget = null;
const guessedHeritage = new Set();
const COUNTRY_CLICK_LAYERS = [
  "tiny-country-expanded-fill",
  "tiny-country-expanded-fill-persist",
  "my-countries-fill",
  "my-countries-line"
];
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
let activeQuizCategory = null; // "culture" | "nature" | null
let suppressWikiTagline = false;
let countryFactsRequestId = 0;
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

function setMountainState(name, state) {
  if (!name || !map.getSource("mountains")) return;
  map.setFeatureState({ source: "mountains", id: name }, state);
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
  if (statusTargetEl) statusTargetEl.textContent = text || "Find: –";
  if (quizFeedbackEl) quizFeedbackEl.textContent = feedback || "";
}

function setStatusFlag(url) {
  if (!statusFlagEl) return;
  if (url) {
    statusFlagEl.src = url;
    statusFlagEl.style.display = "block";
  } else {
    statusFlagEl.src = "";
    statusFlagEl.style.display = "none";
  }
}

function setProgressText(text) {
  lastProgressText = text || "";
  renderStatusProgress();
}

function renderStatusProgress() {
  const streakLabel = correctStreak > 0 ? `Streak: ${correctStreak}` : "";
  let text = "";
  if (lastProgressText && streakLabel) {
    text = `${lastProgressText} · ${streakLabel}`;
  } else if (lastProgressText) {
    text = lastProgressText;
  } else {
    text = streakLabel;
  }
  if (statusProgressEl) {
    statusProgressEl.textContent = text;
  } else if (progressPill) {
    progressPill.textContent = text;
  }
}

function incrementStreak() {
  correctStreak += 1;
  renderStatusProgress();
  if (correctStreak > 0 && correctStreak % 3 === 0) {
    showQuizToast(`Streak ${correctStreak}! Badge unlocked.`, "success");
  }
}

function resetStreak() {
  if (correctStreak === 0) return;
  correctStreak = 0;
  renderStatusProgress();
}

function showQuizToast(message, type = "info") {
  if (!quizToastEl) return;
  quizToastEl.textContent = message || "";
  quizToastEl.classList.remove("success", "error", "show", "hidden");
  if (type === "success") quizToastEl.classList.add("success");
  if (type === "error") quizToastEl.classList.add("error");
  quizToastEl.classList.add("show");
  if (quizToastTimer) clearTimeout(quizToastTimer);
  quizToastTimer = setTimeout(() => {
    if (!quizToastEl) return;
    quizToastEl.classList.remove("show", "success", "error");
    quizToastEl.classList.add("hidden");
  }, 1800);
}

function pulseAtCoords(coords) {
  if (!map || !coords || coords.length < 2) return;
  const el = document.createElement("div");
  el.className = "pulse-marker";
  const marker = new maplibregl.Marker({ element: el, anchor: "center" })
    .setLngLat(coords)
    .addTo(map);
  setTimeout(() => {
    marker.remove();
  }, 1200);
}

function getCountryTargetCoords(iso3) {
  if (!iso3) return null;
  if (countryCentroids.has(iso3)) return countryCentroids.get(iso3);
  if (capitalCoords.has(iso3)) return capitalCoords.get(iso3);
  return null;
}

function renderFactsItems() {
  if (!infoFactsEl || !factsBlockEl) return;
  const items = lastFactsItems || [];
  const maxVisible = 3;
  const showAll = factsExpanded || items.length <= maxVisible;
  const visible = showAll ? items : items.slice(0, maxVisible);
  infoFactsEl.innerHTML = "";
  visible.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    infoFactsEl.appendChild(li);
  });
  const hasFacts = items.length > 0;
  if (factsBlockEl) factsBlockEl.style.display = hasFacts ? "block" : "none";
  if (infoFactsEl) infoFactsEl.style.display = hasFacts ? "block" : "none";
  if (factsToggleEl) {
    if (items.length > maxVisible) {
      factsToggleEl.textContent = showAll ? "Minder feiten" : "Meer feiten";
      factsToggleEl.classList.remove("hidden");
    } else {
      factsToggleEl.classList.add("hidden");
    }
  }
}

function setFactsItems(items) {
  lastFactsItems = items || [];
  factsExpanded = false;
  renderFactsItems();
}

if (factsToggleEl) {
  factsToggleEl.addEventListener("click", () => {
    factsExpanded = !factsExpanded;
    renderFactsItems();
  });
}

const CATEGORY_LABELS = {
  built_archaeological: "Built archaeological",
  art_symbolic: "Art & symbolic",
  cultural_landscapes: "Cultural landscapes",
  historic_cities: "Historic cities",
  engineering_industry: "Engineering & industry"
};

const FAME_LABELS = {
  3: "Iconic heritage",
  2: "Recognized heritage",
  1: "Lesser-known heritage"
};

function setInfoPanel({ pill, title, tagline, facts }) {
  if (infoPillEl && pill) infoPillEl.textContent = pill;
  if (infoCountryEl) infoCountryEl.textContent = title || "Explore topics on the map";
  if (infoTaglineEl) {
    infoTaglineEl.textContent = tagline || "";
    infoTaglineEl.style.display = tagline ? "block" : "none";
  }
  setFactsItems(facts || []);
}

function renderCredits(items, targetEl) {
  if (!targetEl) return;
  targetEl.innerHTML = "";
  (items || []).forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "credits-item";
    const name = document.createElement("div");
    name.textContent = item.name || "Unknown";
    wrapper.appendChild(name);
    if (item.description) {
      const desc = document.createElement("div");
      desc.className = "credits-meta";
      desc.textContent = item.description;
      wrapper.appendChild(desc);
    }
    if (item.attribution) {
      const attrib = document.createElement("div");
      attrib.className = "credits-meta";
      attrib.textContent = item.attribution;
      wrapper.appendChild(attrib);
    }
    if (item.license) {
      const lic = document.createElement("div");
      lic.className = "credits-meta";
      lic.textContent = `License: ${item.license}`;
      wrapper.appendChild(lic);
    }
    if (item.url && item.url !== "Unknown") {
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = item.url;
      wrapper.appendChild(link);
    }
    targetEl.appendChild(wrapper);
  });
}

function loadCredits() {
  if (creditsLoaded || (!creditsListEl && !creditsListScreenEl)) return;
  creditsLoaded = true;
  fetch("public/credits.json")
    .then((r) => r.json())
    .then((data) => {
      if (creditsListEl) renderCredits(data, creditsListEl);
      if (creditsListScreenEl) renderCredits(data, creditsListScreenEl);
    })
    .catch(() => {
      if (creditsListEl) creditsListEl.textContent = "Unable to load credits.";
      if (creditsListScreenEl) creditsListScreenEl.textContent = "Unable to load credits.";
    });
}

function resetWikiPanel() {
  if (wikiThumbEl) {
    wikiThumbEl.style.display = "none";
    wikiThumbEl.src = "";
    wikiThumbEl.onerror = null;
  }
  if (wikiExtractEl) wikiExtractEl.textContent = "";
  if (wikiLinkEl) {
    wikiLinkEl.href = "#";
    wikiLinkEl.style.display = "none";
  }
  if (wikiSourceEl) wikiSourceEl.style.display = "none";
}

function setWikiPanel({ thumbUrl, pageUrl, fallbackThumbUrl = "" }) {
  if (wikiThumbEl) {
    const resolvedThumb = thumbUrl || fallbackThumbUrl;
    wikiThumbEl.onerror = null;
    if (resolvedThumb) {
      wikiThumbEl.src = resolvedThumb;
      wikiThumbEl.style.display = "block";
      if (fallbackThumbUrl && resolvedThumb !== fallbackThumbUrl) {
        wikiThumbEl.onerror = () => {
          wikiThumbEl.onerror = null;
          wikiThumbEl.src = fallbackThumbUrl;
        };
      }
    } else {
      wikiThumbEl.style.display = "none";
      wikiThumbEl.src = "";
    }
  }
  if (wikiExtractEl) wikiExtractEl.textContent = "";
  if (wikiLinkEl && pageUrl) {
    wikiLinkEl.href = pageUrl;
    wikiLinkEl.style.display = "inline";
  }
  if (wikiSourceEl) wikiSourceEl.style.display = pageUrl ? "block" : "none";
}

function setQuizInfoPlaceholder(label) {
  setCountryFactsList([]);
  setInfoPanel({
    pill: "Quiz",
    title: label,
    tagline: "Guess the correct answer to see details.",
    facts: []
  });
  resetWikiPanel();
  setStatusFlag("");
}

async function resolveWikiFromQid(qid) {
  if (wikiCacheByQid.has(qid)) return wikiCacheByQid.get(qid);
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Wikidata lookup failed");
  const data = await resp.json();
  const entity = data.entities && data.entities[qid];
  const sitelinks = entity && entity.sitelinks ? entity.sitelinks : {};
  const preferred = ["enwiki", "nlwiki", "dewiki"];
  for (const key of preferred) {
    if (sitelinks[key]) {
      const title = sitelinks[key].title;
      const lang = key.replace("wiki", "");
      const result = { title, lang };
      wikiCacheByQid.set(qid, result);
      return result;
    }
  }
  throw new Error("No sitelink found");
}

async function searchWikiByName(name) {
  const langs = ["en", "nl"];
  for (const lang of langs) {
    const api = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&srsearch=${encodeURIComponent(name)}&format=json&origin=*`;
    const resp = await fetch(api);
    if (!resp.ok) continue;
    const data = await resp.json();
    const results = data.query && data.query.search ? data.query.search : [];
    if (results.length) {
      return { title: results[0].title, lang };
    }
  }
  throw new Error("No search results");
}

async function fetchWikiPreview({ title, lang }) {
  const cacheKey = `${lang}:${title}`;
  if (wikiCacheByTitle.has(cacheKey)) return wikiCacheByTitle.get(cacheKey);
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryResp = await fetch(summaryUrl);
  if (!summaryResp.ok) throw new Error("Wikipedia summary failed");
  const summary = await summaryResp.json();
  const preview = {
    thumbUrl: summary.thumbnail ? summary.thumbnail.source : "",
    pageUrl: summary.content_urls && summary.content_urls.desktop ? summary.content_urls.desktop.page : ""
  };
  wikiCacheByTitle.set(cacheKey, preview);
  return preview;
}

async function loadWikiPreviewForPlace({ name, qid }) {
  const safeName = name || "";
  let resolvedQid = qid || "";
  if (!resolvedQid && /^Q\\d+$/i.test(safeName)) resolvedQid = safeName.toUpperCase();
  resetWikiPanel();
  try {
    let resolved;
    if (resolvedQid) {
      resolved = await resolveWikiFromQid(resolvedQid);
    } else {
      resolved = await searchWikiByName(safeName);
    }
    const preview = await fetchWikiPreview(resolved);
    setWikiPanel(preview);
  } catch (e) {
    resetWikiPanel();
  }
}

async function loadCountryWikiPreview({ name, requestId }) {
  try {
    const resolved = await searchWikiByName(name || "");
    const preview = await fetchWikiPreview(resolved);
    if (requestId !== countryFactsRequestId) return;
    setWikiPanel(preview);
  } catch (e) {
    if (requestId !== countryFactsRequestId) return;
    resetWikiPanel();
  }
}

async function loadWikiPreviewForPoi(feature) {
  const props = feature && feature.properties ? feature.properties : {};
  const name = props.name || "";
  const qid = props.wikidata_id || props.wikidata_item || "";
  loadWikiPreviewForPlace({ name, qid });
}

function updateInfoForPoi(feature) {
  suppressWikiTagline = false;
  setCountryFactsList([]);
  const props = feature && feature.properties ? feature.properties : {};
  const name = props.name || "Heritage site";
  const category = CATEGORY_LABELS[props.category] || "Uncategorized";
  const fameLabel = FAME_LABELS[props.fame] || "Lesser-known heritage";
  setInfoPanel({
    pill: "Heritage",
    title: name,
    tagline: "",
    facts: [`UNESCO cultural heritage site (${category}).`, `Fame: ${fameLabel}`]
  });
}

function showQuizPlaceInfo({ pill, title, facts, qid, skipWiki = false }) {
  suppressWikiTagline = false;
  setCountryFactsList([]);
  setInfoPanel({
    pill,
    title,
    tagline: "",
    facts: facts || []
  });
  if (skipWiki) {
    resetWikiPanel();
    return;
  }
  loadWikiPreviewForPlace({ name: title, qid });
}

const COUNTRY_FACTS_CACHE_MS = 30 * 24 * 60 * 60 * 1000;

function getCachedCountryFacts(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key.startsWith("countryfacts:") ? key : `countryfacts:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts || !parsed.data) return null;
    if (Date.now() - parsed.ts > COUNTRY_FACTS_CACHE_MS) {
      localStorage.removeItem(key.startsWith("countryfacts:") ? key : `countryfacts:${key}`);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function setCachedCountryFacts(key, data) {
  if (!key || !data) return;
  try {
    const storageKey = key.startsWith("countryfacts:") ? key : `countryfacts:${key}`;
    localStorage.setItem(storageKey, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {
    // ignore storage failures
  }
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toLocaleString("en-US");
}

function resolveCountryCodes(feature) {
  const props = feature && feature.properties ? feature.properties : {};
  let iso2 = props["ISO3166-1-Alpha-2"] || props.ISO_A2 || "";
  let iso3 = props["ISO3166-1-Alpha-3"] || props.ISO_A3 || props.iso3 || "";
  iso2 = String(iso2 || "").toUpperCase();
  iso3 = String(iso3 || "").toUpperCase();
  if ((!iso2 || iso2 === "-99") && iso3 && iso3 !== "-99") {
    const mapped = iso3ToIso2.get(iso3);
    if (mapped) iso2 = mapped;
  }
  const name = props.name || "";
  return { iso2, iso3, name };
}

function setCountryFactsList(items) {
  setFactsItems(items || []);
}

function formatCountryFacts(data) {
  const items = [];
  if (!data) return items;
  const pop = formatNumber(data.population);
  if (pop) {
    let label = `Population: ${pop}`;
    if (data.populationDate) {
      const year = new Date(data.populationDate).getUTCFullYear();
      if (Number.isFinite(year)) label += ` (${year})`;
    }
    items.push(label);
  }
  const area = formatNumber(data.area);
  if (area) items.push(`Area: ${area} km²`);
  if (data.capital) items.push(`Capital: ${data.capital}`);
  if (data.languages && data.languages.length) {
    items.push(`Official languages: ${data.languages.join(", ")}`);
  }
  if (data.currencies && data.currencies.length) {
    items.push(`Currency: ${data.currencies.join(", ")}`);
  }
  return items;
}

async function fetchCountryFactsByProperty({ code, property }) {
  const cacheKey = property === "P297" ? `countryfacts:${code}` : `countryfacts:${property}:${code}`;
  const cached = getCachedCountryFacts(cacheKey);
  if (cached) return cached;
  const query = `
    SELECT ?population ?populationDate ?area ?capitalLabel ?currencyLabel ?currencyEnd ?currencyStart ?languageLabel ?continentLabel ?articleTitle ?flag WHERE {
      ?country wdt:${property} "${code}".
      OPTIONAL { ?country wdt:P2046 ?area. }
      OPTIONAL { ?country wdt:P36 ?capital. }
      OPTIONAL {
        ?country p:P38 ?currencyStatement.
        ?currencyStatement ps:P38 ?currency.
        OPTIONAL { ?currencyStatement pq:P582 ?currencyEnd. }
        OPTIONAL { ?currencyStatement pq:P580 ?currencyStart. }
      }
      OPTIONAL { ?country wdt:P37 ?language. }
      OPTIONAL { ?country wdt:P30 ?continent. }
      OPTIONAL {
        ?article schema:about ?country;
          schema:isPartOf <https://en.wikipedia.org/>;
          schema:name ?articleTitle.
      }
      OPTIONAL { ?country wdt:P41 ?flag. }
      OPTIONAL {
        ?country p:P1082 ?popStatement.
        ?popStatement ps:P1082 ?population.
        OPTIONAL { ?popStatement pq:P585 ?populationDate. }
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    headers: { Accept: "application/sparql-results+json" }
  });
  if (!resp.ok) throw new Error("Wikidata request failed");
  const data = await resp.json();
  const bindings = data && data.results && data.results.bindings ? data.results.bindings : [];
  if (!bindings.length) throw new Error("No Wikidata results");

  const result = parseCountryFactsFromBindings(bindings);
  setCachedCountryFacts(cacheKey, result);
  return result;
}

async function fetchCountryFactsByName(name) {
  const safeName = String(name || "").trim();
  if (!safeName) throw new Error("No country name");
  const cacheKey = `countryfacts:name:${safeName.toLowerCase()}`;
  const cached = getCachedCountryFacts(cacheKey);
  if (cached) return cached;
  const query = `
    SELECT ?population ?populationDate ?area ?capitalLabel ?currencyLabel ?currencyEnd ?currencyStart ?languageLabel ?continentLabel ?articleTitle ?flag WHERE {
      ?country rdfs:label "${safeName}"@en.
      OPTIONAL { ?country wdt:P2046 ?area. }
      OPTIONAL { ?country wdt:P36 ?capital. }
      OPTIONAL {
        ?country p:P38 ?currencyStatement.
        ?currencyStatement ps:P38 ?currency.
        OPTIONAL { ?currencyStatement pq:P582 ?currencyEnd. }
        OPTIONAL { ?currencyStatement pq:P580 ?currencyStart. }
      }
      OPTIONAL { ?country wdt:P37 ?language. }
      OPTIONAL { ?country wdt:P30 ?continent. }
      OPTIONAL {
        ?article schema:about ?country;
          schema:isPartOf <https://en.wikipedia.org/>;
          schema:name ?articleTitle.
      }
      OPTIONAL { ?country wdt:P41 ?flag. }
      OPTIONAL {
        ?country p:P1082 ?popStatement.
        ?popStatement ps:P1082 ?population.
        OPTIONAL { ?popStatement pq:P585 ?populationDate. }
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    headers: { Accept: "application/sparql-results+json" }
  });
  if (!resp.ok) throw new Error("Wikidata request failed");
  const data = await resp.json();
  const bindings = data && data.results && data.results.bindings ? data.results.bindings : [];
  if (!bindings.length) throw new Error("No Wikidata results");

  const result = parseCountryFactsFromBindings(bindings);
  setCachedCountryFacts(cacheKey, result);
  return result;
}

function parseCountryFactsFromBindings(bindings) {
  const facts = {
    population: null,
    populationDate: null,
    area: null,
    capital: null,
    currencies: [],
    languages: new Set(),
    continents: new Set(),
    wikiTitle: "",
    flagName: ""
  };

  const currencyMeta = new Map();

  let bestPop = null;
  let bestDate = null;
  let bestDateMs = null;

  bindings.forEach((row) => {
    if (!facts.area && row.area && row.area.value) {
      facts.area = Number(row.area.value);
    }
    if (!facts.capital && row.capitalLabel && row.capitalLabel.value) {
      facts.capital = row.capitalLabel.value;
    }
    if (row.currencyLabel && row.currencyLabel.value) {
      const label = row.currencyLabel.value;
      const endRaw = row.currencyEnd && row.currencyEnd.value ? row.currencyEnd.value : "";
      const startRaw = row.currencyStart && row.currencyStart.value ? row.currencyStart.value : "";
      const prev = currencyMeta.get(label);
      if (!prev) {
        currencyMeta.set(label, { label, endRaw, startRaw });
      } else {
        const prevEnd = prev.endRaw ? Date.parse(prev.endRaw) : null;
        const nextEnd = endRaw ? Date.parse(endRaw) : null;
        if (prevEnd !== null && nextEnd !== null && nextEnd > prevEnd) {
          prev.endRaw = endRaw;
        }
        if (!prev.startRaw && startRaw) prev.startRaw = startRaw;
      }
    }
    if (row.languageLabel && row.languageLabel.value) facts.languages.add(row.languageLabel.value);
    if (row.continentLabel && row.continentLabel.value) facts.continents.add(row.continentLabel.value);
    if (!facts.wikiTitle && row.articleTitle && row.articleTitle.value) {
      facts.wikiTitle = row.articleTitle.value;
    }
    if (!facts.flagName && row.flag && row.flag.value) {
      facts.flagName = row.flag.value;
    }

    if (row.population && row.population.value) {
      const popVal = Number(row.population.value);
      if (!Number.isFinite(popVal)) return;
      const dateVal = row.populationDate && row.populationDate.value ? row.populationDate.value : "";
      const dateMs = dateVal ? Date.parse(dateVal) : null;
      if (dateMs && (bestDateMs === null || dateMs > bestDateMs)) {
        bestDateMs = dateMs;
        bestDate = dateVal;
        bestPop = popVal;
      } else if (!dateMs && bestDateMs === null && bestPop === null) {
        bestPop = popVal;
        bestDate = "";
      }
    }
  });

  if (bestPop !== null) {
    facts.population = bestPop;
    facts.populationDate = bestDate;
  }

  const currencies = Array.from(currencyMeta.values())
    .sort((a, b) => {
      const aEnd = a.endRaw ? Date.parse(a.endRaw) : null;
      const bEnd = b.endRaw ? Date.parse(b.endRaw) : null;
      if (aEnd === null && bEnd !== null) return -1;
      if (aEnd !== null && bEnd === null) return 1;
      if (aEnd !== null && bEnd !== null) return bEnd - aEnd;
      return 0;
    })
    .map((item) => item.label);

  const wikiUrl = facts.wikiTitle
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(facts.wikiTitle.replace(/ /g, "_"))}`
    : "";
  let flagUrl = "";
  if (facts.flagName) {
    if (/^https?:\/\//i.test(facts.flagName)) {
      flagUrl = facts.flagName.includes("?") ? facts.flagName : `${facts.flagName}?width=80`;
    } else {
      flagUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(facts.flagName)}?width=80`;
    }
  }

  return {
    population: facts.population,
    populationDate: facts.populationDate,
    area: facts.area,
    capital: facts.capital,
    currencies,
    languages: Array.from(facts.languages),
    continents: Array.from(facts.continents),
    wikiUrl,
    flagUrl
  };
}

async function loadCountryFactsForFeature(feature) {
  const { iso2, iso3, name } = resolveCountryCodes(feature);
  const countryName = iso3 && iso3ToName.has(iso3) ? iso3ToName.get(iso3) : name;
  const requestId = ++countryFactsRequestId;
  const fallbackFlagUrl = iso2 && iso2 !== "-99" ? `https://flagcdn.com/w80/${iso2.toLowerCase()}.png` : "";
  suppressWikiTagline = true;
  if ((!iso2 || iso2 === "-99") && (!iso3 || iso3 === "-99") && !countryName) {
    setInfoPanel({ pill: "Country", title: countryName, tagline: "", facts: [] });
    setCountryFactsList(["Facts unavailable."]);
    return;
  }
  if (wikiExtractEl) wikiExtractEl.textContent = "";
  if (infoTaglineEl) infoTaglineEl.style.display = "none";
  setInfoPanel({ pill: "Country", title: countryName, tagline: "", facts: [] });
  if (factsBlockEl) factsBlockEl.style.display = "block";
  if (infoFactsEl) infoFactsEl.style.display = "block";
  const loadingLabel = iso2 && iso2 !== "-99" ? iso2 : iso3 || countryName || "country";
  if (infoFactsEl) infoFactsEl.textContent = `Loading facts for ${loadingLabel}…`;
  setCountryFactsList([`Loading facts for ${loadingLabel}…`]);
  if (fallbackFlagUrl) {
    setWikiPanel({ thumbUrl: "", pageUrl: "", fallbackThumbUrl: fallbackFlagUrl });
  }
  try {
    let data = null;
    if (iso2 && iso2 !== "-99") {
      data = await fetchCountryFactsByProperty({ code: iso2, property: "P297" });
    } else if (iso3 && iso3 !== "-99") {
      data = await fetchCountryFactsByProperty({ code: iso3, property: "P298" });
    } else {
      data = await fetchCountryFactsByName(countryName);
    }
    if (requestId !== countryFactsRequestId) return;
    if (data) {
      const pageUrl = data.wikiUrl || "";
      const thumbUrl = data.flagUrl || "";
      if (pageUrl || thumbUrl || fallbackFlagUrl) {
        setWikiPanel({ thumbUrl, pageUrl, fallbackThumbUrl: fallbackFlagUrl });
      }
    }
    const items = formatCountryFacts(data);
    if (items.length) {
      setCountryFactsList(items);
    } else {
      setCountryFactsList(["Facts unavailable."]);
    }
  } catch (e) {
    if (requestId !== countryFactsRequestId) return;
    console.warn("country facts fetch failed", e);
    setCountryFactsList(["Facts unavailable."]);
  }
}

function updatePoiFilters() {
  if (activeQuiz === "heritage") {
    applyHeritageQuizFilter();
    return;
  }
  if (!map || !map.getLayer("poi-icons")) return;
  const enabled = [];
  if (fameFilter1 && fameFilter1.checked) enabled.push(1);
  if (fameFilter2 && fameFilter2.checked) enabled.push(2);
  if (fameFilter3 && fameFilter3.checked) enabled.push(3);
  const enabledCategories = [];
  categoryFilters.forEach((el, key) => {
    if (el && el.checked) enabledCategories.push(key);
  });

  const filters = ["all"];
  if (enabled.length) {
    filters.push(["in", ["get", "fame"], ["literal", enabled]]);
  } else {
    filters.push(["==", ["get", "fame"], -1]);
  }
  if (enabledCategories.length) {
    filters.push(["in", ["get", "category"], ["literal", enabledCategories]]);
  } else {
    filters.push(["==", ["get", "category"], "__none__"]);
  }
  filters.push([
    "case",
    ["<", ["zoom"], 3], ["==", ["get", "fame"], 3],
    ["<", ["zoom"], 4.5], [">=", ["get", "fame"], 2],
    true
  ]);
  map.setFilter("poi-icons", filters);
}

function applyHeritageQuizFilter() {
  if (!map || !map.getLayer("poi-icons") || !heritageCategoryChoice) return;
  map.setFilter("poi-icons", [
    "all",
    ["==", ["get", "category"], heritageCategoryChoice],
    ["==", ["get", "fame"], heritageLevel]
  ]);
}

function initFameFilterControls() {
  [fameFilter1, fameFilter2, fameFilter3].forEach((el) => {
    if (!el) return;
    el.addEventListener("change", updatePoiFilters);
  });
  categoryFilters.forEach((el) => {
    if (!el) return;
    el.addEventListener("change", updatePoiFilters);
  });
  if (selectAllCategoriesBtn) {
    selectAllCategoriesBtn.addEventListener("click", () => {
      categoryFilters.forEach((el) => {
        if (el) el.checked = true;
      });
      updatePoiFilters();
    });
  }
  if (deselectAllCategoriesBtn) {
    deselectAllCategoriesBtn.addEventListener("click", () => {
      categoryFilters.forEach((el) => {
        if (el) el.checked = false;
      });
      updatePoiFilters();
    });
  }
  if (mountainsToggle) {
    mountainsToggle.addEventListener("change", () => {
      applyMountainsVisibility();
    });
  }
}

function applyMountainsVisibility() {
  if (!map || !map.getLayer("poi-mountains")) return;
  const allowMountains = activeQuizCategory === "nature";
  const wantsMountains = mountainsToggle ? mountainsToggle.checked : true;
  const opacity = allowMountains && wantsMountains ? 1 : 0;
  map.setPaintProperty("poi-mountains", "icon-opacity", opacity);
  map.setPaintProperty("poi-mountains", "text-opacity", opacity);
  if (map.getLayer("poi-mountains-debug")) {
    map.setPaintProperty("poi-mountains-debug", "circle-opacity", opacity);
  }
}

function updateMountainLabelMode() {
  if (!map || !map.getLayer("poi-mountains")) return;
  if (activeQuiz === "mountain") {
    map.setLayoutProperty("poi-mountains", "text-field", [
      "case",
      ["boolean", ["feature-state", "guessed"], false],
      ["get", "name"],
      ""
    ]);
  } else {
    map.setLayoutProperty("poi-mountains", "text-field", "");
  }
}

function applyPoiVisibility() {
  if (!map || !map.getLayer("poi-icons")) return;
  const visibility = activeQuizCategory === "culture" && activeQuiz === "heritage"
    ? "visible"
    : "none";
  map.setLayoutProperty("poi-icons", "visibility", visibility);
}

function applyInfoControlsVisibility() {
  const showNatureControls = activeQuizCategory === "nature";
  const showCultureControls = activeQuizCategory === "culture" && activeQuiz === "heritage";
  if (natureControlsEl) {
    natureControlsEl.classList.toggle("hidden", !showNatureControls);
  }
  if (cultureControlsEl) {
    cultureControlsEl.classList.toggle("hidden", !showCultureControls);
  }
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

function getHeritagePool() {
  if (!poiGeojson || !heritageCategoryChoice) return [];
  const names = new Set();
  (poiGeojson.features || []).forEach((f) => {
    const props = f && f.properties ? f.properties : {};
    if (props.category !== heritageCategoryChoice) return;
    if (Number(props.fame) !== heritageLevel) return;
    if (props.name) names.add(props.name);
  });
  return Array.from(names);
}

function isQuizInProgress() {
  if (!activeQuiz) return false;
  if (quizPanelEl) {
    if (quizPanelEl.classList.contains("hidden")) return false;
    if (quizPanelEl.offsetParent === null) return false;
  }
  if (quizActiveEl) {
    if (quizActiveEl.classList.contains("hidden")) return false;
    if (quizActiveEl.offsetParent === null) return false;
  }
  return true;
}

function pickPreferredCountryFeature(features) {
  if (!features || !features.length) return null;
  const priority = [
    "tiny-country-expanded-fill",
    "tiny-country-expanded-fill-persist",
    "my-countries-fill",
    "my-countries-line"
  ];
  for (const layerId of priority) {
    const match = features.find((f) => f && f.layer && f.layer.id === layerId);
    if (match) return match;
  }
  return features[0];
}

function updateProgress() {
  if (!progressPill) return;
  if (!activeQuiz) {
    setProgressText("");
    if (statusTargetEl) statusTargetEl.textContent = "Kies een quiz om te starten.";
    return;
  }
  if (quizStage === "country") {
    const pool = currentCountryPool.length ? currentCountryPool : allCountryIso3;
    const total = pool.length;
    const guessed = Array.from(guessedCountries).filter((iso) => pool.includes(iso)).length;
    if (!total) {
      setProgressText("Guessed: 0 / ? (loading…)");
      return;
    }
    const percent = total ? ((guessed / total) * 100).toFixed(1) : "0.0";
    setProgressText(`Countries (${currentCountryContinent || "all"}): ${guessed} / ${total} (${percent}%)`);
  } else if (quizStage === "capital") {
    const pool = currentCapitalPool.length ? currentCapitalPool : capitalPool;
    const total = pool.length;
    const guessed = Array.from(guessedCapitals).filter((iso) => pool.includes(iso)).length;
    if (!total) {
      setProgressText("Capitals: 0 / ? (loading…)");
      return;
    }
    const percent = total ? ((guessed / total) * 100).toFixed(1) : "0.0";
    setProgressText(`Capitals: ${guessed} / ${total} (${percent}%)`);
  } else if (quizStage === "mountain") {
    const total = mountainNames.length;
    const guessed = guessedMountains.size;
    if (!total) {
      setProgressText("Mountain ranges: 0 / ? (loading…)");
      return;
    }
    const percent = ((guessed / total) * 100).toFixed(1);
    setProgressText(`Mountain ranges: ${guessed} / ${total} (${percent}%)`);
  } else if (quizStage === "heritage") {
    const pool = getHeritagePool();
    const total = pool.length;
    const guessed = guessedHeritage.size;
    const label = FAME_LABELS[heritageLevel] || "Heritage";
    const categoryLabel = CATEGORY_LABELS[heritageCategoryChoice] || "All categories";
    if (!total) {
      setProgressText(`${categoryLabel}: 0 / ? (${label})`);
      return;
    }
    const percent = ((guessed / total) * 100).toFixed(1);
    setProgressText(`${categoryLabel}: ${guessed} / ${total} (${label}, ${percent}%)`);
  } else {
    const total = continentList.length;
    const guessed = guessedContinents.size;
    if (!total) {
      setProgressText("Guessed: 0 / ? (loading…)");
      return;
    }
    const percent = ((guessed / total) * 100).toFixed(1);
    setProgressText(`Guessed: ${guessed} / ${total} (${percent}%)`);
  }
}

function resetMountainStates() {
  if (!mountainsGeojson) return;
  (mountainsGeojson.features || []).forEach((f) => {
    const name = f && f.properties ? f.properties.name : "";
    if (name) {
      setMountainState(name, { guessed: false });
    }
  });
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
  if (startHeritageBtn) {
    startHeritageBtn.classList.toggle("active", mode === "heritage");
  }
  if (startMountainsBtn) {
    startMountainsBtn.classList.toggle("active", mode === "mountain");
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

function renderHeritageOptions() {
  if (!heritageOptionsEl) return;
  heritageOptionsEl.innerHTML = "";
  Object.entries(CATEGORY_LABELS).forEach(([key, label]) => {
    const btn = document.createElement("button");
    btn.className = "quiz-home-btn";
    btn.textContent = label;
    btn.dataset.category = key;
    btn.addEventListener("click", () => {
      heritageCategoryChoice = key;
      updateHeritageSelectionUI();
    });
    heritageOptionsEl.appendChild(btn);
  });
  updateHeritageSelectionUI();
}

function updateHeritageSelectionUI() {
  if (!heritageOptionsEl) return;
  const buttons = heritageOptionsEl.querySelectorAll("button");
  buttons.forEach((btn) => {
    const cat = btn.dataset.category;
    if (heritageCategoryChoice === cat) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function showQuizHome() {
  quizStage = "continent";
  activeQuiz = null;
  guessedContinents.clear();
  guessedCountries.clear();
  guessedCapitals.clear();
  guessedMountains.clear();
  guessedHeritage.clear();
  resetStreak();
  currentTargetContinent = null;
  currentCountryTarget = null;
  currentCountryContinent = null;
  currentCountryPool = [];
  currentCountryPrimaryPool = [];
  currentCountrySecondaryPool = [];
  currentCountryTier = "primary";
  currentCapitalContinent = null;
  currentCapitalPool = [];
  currentCapitalTarget = null;
  currentMountainTarget = null;
  currentHeritageTarget = null;
  heritageCategoryChoice = null;
  heritageLevel = 3;
  resetFeatureStates();
  resetMountainStates();
  updateCapitalSource();
  updatePoiFilters();
  hideCurrencyOptions({ cancelTimeout: true });
  setQuizText("Find: –", "Kies een quiz om te starten.");
  setStatusFlag("");
  if (quizPanelEl) quizPanelEl.classList.add("hidden");
  if (quizActiveEl) quizActiveEl.classList.add("hidden");
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (heritagePickerEl) heritagePickerEl.classList.add("hidden");
  pendingContinentChoice = null;
  updateMainMenuSelection(null);
  updateMapStylingForStage();
  updateMountainLabelMode();
  applyInfoControlsVisibility();
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
  setQuizInfoPlaceholder("Continents");
  hideCurrencyOptions({ cancelTimeout: true });
  resetStreak();
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
  if (quizPanelEl) quizPanelEl.classList.remove("hidden");
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
  setQuizInfoPlaceholder(mode === "capital" ? "Capitals" : "Countries");
  updateMainMenuSelection(quizStage);
  applyInfoControlsVisibility();
  pendingContinentChoice = null;
  renderContinentOptions(mode);
  if (continentPickerLabelEl) {
    continentPickerLabelEl.textContent = mode === "capital"
      ? "Kies een continent voor de Capitals quiz"
      : "Kies een continent voor de Countries quiz";
  }
  if (quizPanelEl) quizPanelEl.classList.remove("hidden");
  if (quizActiveEl) quizActiveEl.classList.add("hidden");
  if (continentPickerEl) continentPickerEl.classList.remove("hidden");
  setQuizText("Find: –", "Kies een continent voor de quiz.");
}

function openHeritagePicker() {
  if (!poiGeojson) {
    setQuizText("Find: –", "Heritage data is nog niet geladen; probeer zo weer.");
    updateProgress();
    return;
  }
  quizStage = "heritage";
  activeQuiz = "heritage";
  setQuizInfoPlaceholder("Cultural Heritage");
  updateMainMenuSelection("heritage");
  applyInfoControlsVisibility();
  applyPoiVisibility();
  heritageCategoryChoice = null;
  renderHeritageOptions();
  if (quizPanelEl) quizPanelEl.classList.remove("hidden");
  if (quizActiveEl) quizActiveEl.classList.add("hidden");
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (heritagePickerEl) heritagePickerEl.classList.remove("hidden");
  setQuizText("Find: –", "Kies een categorie voor de quiz.");
}

function startCountryQuizWithContinent(continentChoice) {
  quizStage = "country";
  activeQuiz = "country";
  setQuizInfoPlaceholder("Countries");
  hideCurrencyOptions({ cancelTimeout: true });
  resetStreak();
  currentCountryTarget = null;
  currentCapitalTarget = null;
  guessedCountries.clear();
  guessedContinents.clear();
  guessedCapitals.clear();
  resetFeatureStates();
  oceaniaFocused = false;
  updateMainMenuSelection("country");
  applyInfoControlsVisibility();
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (quizPanelEl) quizPanelEl.classList.remove("hidden");
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
  const tierPool = currentCountryPool.length ? currentCountryPool : allCountryIso3;
  const tiers = buildCountryTiers(tierPool);
  currentCountryPrimaryPool = tiers.primary;
  currentCountrySecondaryPool = tiers.secondary;
  currentCountryTier = "primary";

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
  setQuizInfoPlaceholder("Capitals");
  hideCurrencyOptions({ cancelTimeout: true });
  resetStreak();
  currentCapitalTarget = null;
  guessedCapitals.clear();
  guessedCurrencies.clear();
  guessedCountries.clear();
  guessedContinents.clear();
  resetFeatureStates();
  updateMainMenuSelection("capital");
  applyInfoControlsVisibility();
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (quizPanelEl) quizPanelEl.classList.remove("hidden");
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
  setQuizInfoPlaceholder("Currencies");
  hideCurrencyOptions({ cancelTimeout: true });
  resetStreak();
  currentCurrencyTarget = null;
  guessedCurrencies.clear();
  guessedCountries.clear();
  guessedContinents.clear();
  resetFeatureStates();
  updateMainMenuSelection("currency");
  applyInfoControlsVisibility();
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (quizPanelEl) quizPanelEl.classList.remove("hidden");
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

function startHeritageQuizWithCategory(categoryChoice) {
  quizStage = "heritage";
  activeQuiz = "heritage";
  setQuizInfoPlaceholder("Cultural Heritage");
  hideCurrencyOptions({ cancelTimeout: true });
  resetStreak();
  heritageCategoryChoice = categoryChoice;
  heritageLevel = 3;
  currentHeritageTarget = null;
  guessedHeritage.clear();
  updateMainMenuSelection("heritage");
  applyInfoControlsVisibility();
  applyPoiVisibility();
  if (heritagePickerEl) heritagePickerEl.classList.add("hidden");
  if (quizPanelEl) quizPanelEl.classList.remove("hidden");
  if (quizActiveEl) quizActiveEl.classList.remove("hidden");
  updateMapStylingForStage();
  applyHeritageQuizFilter();
  pickNextHeritageTarget();
  updateProgress();
}

function startMountainQuiz() {
  quizStage = "mountain";
  activeQuiz = "mountain";
  setQuizInfoPlaceholder("Mountain ranges");
  hideCurrencyOptions({ cancelTimeout: true });
  resetStreak();
  currentMountainTarget = null;
  guessedMountains.clear();
  resetMountainStates();
  resetCompass();
  updateMainMenuSelection("mountain");
  applyInfoControlsVisibility();
  if (continentPickerEl) continentPickerEl.classList.add("hidden");
  if (quizPanelEl) quizPanelEl.classList.remove("hidden");
  if (quizActiveEl) quizActiveEl.classList.remove("hidden");
  updateMapStylingForStage();
  updateMountainLabelMode();
  pickNextMountainTarget();
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
  setStatusFlag("");
  setQuizText(`Find continent: ${next}`, "");
}

function pickNextHeritageTarget() {
  const pool = getHeritagePool();
  if (!pool.length) {
    if (heritageLevel > 1) {
      heritageLevel -= 1;
      guessedHeritage.clear();
      applyHeritageQuizFilter();
      pickNextHeritageTarget();
      updateProgress();
      return;
    }
    setQuizText("All heritage sites guessed!", "Nice work.");
    currentHeritageTarget = null;
    return;
  }
  const remaining = pool.filter((name) => !guessedHeritage.has(name));
  if (!remaining.length) {
    if (heritageLevel > 1) {
      heritageLevel -= 1;
      guessedHeritage.clear();
      applyHeritageQuizFilter();
      pickNextHeritageTarget();
      updateProgress();
      return;
    }
    setQuizText("All heritage sites guessed!", "Nice work.");
    currentHeritageTarget = null;
    return;
  }
  const next = remaining[Math.floor(Math.random() * remaining.length)];
  currentHeritageTarget = next;
  const levelLabel = FAME_LABELS[heritageLevel] || "Heritage";
  setStatusFlag("");
  setQuizText(`Find ${levelLabel}: ${next}`, "Click the heritage icon on the map.");
}

function pickNextMountainTarget() {
  if (!mountainNames.length) {
    setQuizText("Find: –", "Mountain list not ready.");
    return;
  }
  const remaining = mountainNames.filter((name) => !guessedMountains.has(name));
  if (!remaining.length) {
    setQuizText("All mountain ranges guessed!", "Nice work.");
    currentMountainTarget = null;
    return;
  }
  const next = remaining[Math.floor(Math.random() * remaining.length)];
  currentMountainTarget = next;
  resetCompass();
  setStatusFlag("");
  setQuizText(`Find mountain range: ${next}`, "Click the mountain icon on the map.");
}

function buildCountryTiers(pool) {
  const primary = pool.filter((iso) => !smallHighlightIsos.has(iso));
  const secondary = pool.filter((iso) => smallHighlightIsos.has(iso));
  if (!primary.length) {
    return { primary: pool.slice(), secondary: [] };
  }
  return { primary, secondary };
}

function setCountryQuestionForTarget(iso3) {
  const name = iso3ToName.get(iso3) || iso3;
  const capital = iso3ToCapitalName.get(iso3) || "";
  const iso2 = iso3ToIso2.get(iso3);
  const flagUrl = iso2 ? `https://flagcdn.com/w40/${iso2.toLowerCase()}.png` : "";
  const weightedModes = ["name", "name", "name", "name", "name", "name"];
  if (capital) weightedModes.push("capital", "capital");
  if (flagUrl) weightedModes.push("flag", "flag");
  countryQuestionMode = weightedModes[Math.floor(Math.random() * weightedModes.length)];

  if (countryQuestionMode === "capital" && capital) {
    setStatusFlag("");
    setQuizText(`Find country with capital: ${capital}`, "");
    return;
  }
  if (countryQuestionMode === "flag" && flagUrl) {
    setStatusFlag(flagUrl);
    setQuizText("Find country with this flag", "");
    return;
  }
  setStatusFlag("");
  setQuizText(`Find country: ${name}`, "");
}

function pickNextCountryTarget() {
  const pool = currentCountryPool.length ? currentCountryPool : allCountryIso3;
  const remainingAll = pool.filter((iso) => !guessedCountries.has(iso));
  if (!pool.length || !remainingAll.length) {
    setQuizText("All countries guessed!", "Continue learning? Start the Capitals quiz!");
    currentCountryTarget = null;
    return;
  }
  if (currentCountryTier === "primary") {
    const remainingPrimary = currentCountryPrimaryPool.filter((iso) => !guessedCountries.has(iso));
    if (!remainingPrimary.length && currentCountrySecondaryPool.length) {
      currentCountryTier = "secondary";
      showQuizToast("Microstates unlocked!", "success");
    }
  }
  const tierPool = currentCountryTier === "secondary" ? currentCountrySecondaryPool : currentCountryPrimaryPool;
  const remaining = tierPool.length ? tierPool.filter((iso) => !guessedCountries.has(iso)) : remainingAll;
  // In Oceanië eerst Australië en Nieuw-Zeeland afhandelen
  if (currentCountryContinent === "Oceania") {
    const priorityRemaining = OCEANIA_PRIORITY.filter((iso) => remainingAll.includes(iso));
    if (priorityRemaining.length) {
      currentCountryTarget = priorityRemaining[0];
      setCountryQuestionForTarget(currentCountryTarget);
      if (quizStage === "country" && currentCountryTarget === "DNK") {
        setFeatureStateAll("GRL", {isHatched: true});
      }
      return;
    }
  }

  const randomIso = remaining[Math.floor(Math.random() * remaining.length)];
  currentCountryTarget = randomIso;
  setCountryQuestionForTarget(randomIso);

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
  setStatusFlag("");
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
        incrementStreak();
        showQuizToast("Correct!", "success");
        guessedCurrencies.add(randomIso);
        updateProgress();
        showQuizPlaceInfo({
          pill: "Country",
          title: countryName
        });
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
        resetStreak();
        showQuizToast("Wrong currency.", "error");
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

function provideMountainHint(guessName) {
  if (!currentMountainTarget || !guessName) return;
  const targetCoords = mountainCoords.get(currentMountainTarget);
  const guessCoords = mountainCoords.get(guessName);
  if (!targetCoords || !guessCoords) return;
  const bearing = getBearing(guessCoords, targetCoords);
  const adjustedBearing = bearing !== null ? (bearing + 180) % 360 : null;
  if (adjustedBearing !== null) {
    showCompassOverlay(guessCoords, adjustedBearing);
  } else {
    resetCompass();
  }
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
  setStatusFlag("");
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
  if (quizStage === "mountain" || quizStage === "heritage") return;
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
      incrementStreak();
      showQuizToast("Correct!", "success");
      showQuizPlaceInfo({
        pill: "Capital",
        title: capitalName
      });
      lastCapitalDistance = null;
      updateProgress();
      pickNextCapitalTarget();
    } else {
      resetStreak();
      showQuizToast("Not quite. Try again.", "error");
      const targetCoords = capitalCoords.get(currentCapitalTarget);
      if (targetCoords) pulseAtCoords(targetCoords);
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
      const countryName = iso3ToName.get(iso3) || iso3;
      setQuizText(`Correct: ${countryName}`, "Picking next country…");
      setStatusFlag("");
      incrementStreak();
      showQuizToast("Correct!", "success");
      showQuizPlaceInfo({
        pill: "Country",
        title: countryName,
        skipWiki: true
      });
      loadCountryFactsForFeature(feature);
      updateProgress();
      pickNextCountryTarget();
    } else {
      resetStreak();
      showQuizToast("Wrong country. Try again.", "error");
      const targetCoords = getCountryTargetCoords(currentCountryTarget);
      if (targetCoords) pulseAtCoords(targetCoords);
    }
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
    incrementStreak();
    showQuizToast("Correct!", "success");
    showQuizPlaceInfo({
      pill: "Continent",
      title: region
    });
    updateProgress();
    pickNextContinent();
  } else {
    setQuizText(`Find continent: ${currentTargetContinent}`, `That was ${region}.`);
    resetStreak();
    showQuizToast("Wrong continent.", "error");
    if (currentTargetContinent) {
      const targetIso = allCountryIso3.find((iso) => canonicalRegion(iso3ToRegion.get(iso)) === currentTargetContinent);
      const targetCoords = getCountryTargetCoords(targetIso);
      if (targetCoords) pulseAtCoords(targetCoords);
    }
  }
}

map.on("load", async () => {
  async function addSvgIcon(map, id, svgUrl, size = 64, options = {}) {
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
    map.addImage(id, { width: size, height: size, data: imageData.data }, { pixelRatio: 2, ...options });
  }

  // Probeer live regio-data + UN/independent-lijst op te halen
  let currencies = {};
  try {
    const resp = await fetch("https://restcountries.com/v3.1/all?fields=cca3,cca2,region,subregion,unMember,independent,capital,capitalInfo,currencies");
    if (resp.ok) {
      const data = await resp.json();
      const m = new Map();
      const iso2Map = new Map();
      const allowed = new Set();
      const independent = new Set();
      const caps = new Map();
      const currFull = new Map();
      data.forEach((c) => {
        if (!c || !c.cca3) return;
        const iso3 = String(c.cca3).toUpperCase();
        if (c.cca2) {
          iso2Map.set(iso3, String(c.cca2).toUpperCase());
        }
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
      iso2Map.forEach((v, k) => iso3ToIso2.set(k, v));
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
      data: "data/mountains.geojson",
      promoteId: "name"
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
          "icon-opacity": 1,
          "icon-opacity-transition": { duration: 300 },
          "text-opacity": 1,
          "text-opacity-transition": { duration: 300 },
          "text-halo-width": 0,
          "text-color": "#ffffff"
        },
        minzoom: 0
      });
    }

    try {
      const resp = await fetch("data/mountains.geojson");
      if (resp.ok) {
        mountainsGeojson = await resp.json();
        mountainNames = (mountainsGeojson.features || [])
          .filter((f) => f && f.properties && f.properties.kind === "mountain_range")
          .map((f) => {
            const name = f.properties.name;
            const coords = f && f.geometry && Array.isArray(f.geometry.coordinates)
              ? f.geometry.coordinates
              : null;
            if (name && coords && coords.length >= 2) {
              mountainCoords.set(name, coords);
            }
            return name;
          })
          .filter(Boolean);
        resetMountainStates();
        updateMountainLabelMode();
      }
    } catch (e) {
      console.warn("Kon mountains data niet laden voor quiz.", e);
    }

    const poiIcons = [
      ["icon-windmill", "data/icons/windmill.svg"],
      ["icon-built_archaeological", "data/icons/built_archaeological.svg"],
      ["icon-art_symbolic", "data/icons/art_symbolic.svg"],
      ["icon-cultural_landscapes", "data/icons/cultural_landscapes.svg"],
      ["icon-historic_cities", "data/icons/historic_cities.svg"],
      ["icon-engineering_industry", "data/icons/engineering_industry.svg"]
    ];
    const loadedPoiIcons = new Set();
    for (const [id, url] of poiIcons) {
      try {
        await addSvgIcon(map, id, url, 72, { sdf: true });
        loadedPoiIcons.add(id);
      } catch (e) {
        console.warn(`Kon POI icoon niet laden: ${id}`, e);
      }
    }
    const iconStatus = poiIcons.map(([id]) => [id, map.hasImage(id)]);
    console.log(
      "[poi-icons] registered:",
      iconStatus.map(([id, ok]) => `${id}=${ok ? "yes" : "no"}`).join(", ")
    );
    if (iconStatus.every(([, ok]) => ok)) {
      console.log("[poi-icons] all icons registered");
    } else {
      const missing = iconStatus.filter(([, ok]) => !ok).map(([id]) => id);
      console.warn("[poi-icons] missing icons:", missing);
    }
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
          "icon-size": [
            "match",
            ["get", "fame"],
            1, 0.6,
            2, 1.0,
            3, 1.6,
            0.7
          ],
          "icon-allow-overlap": true,
          "text-allow-overlap": true,
          "text-field": "",
          "text-size": 12,
          "text-offset": [0, 1.1],
          "text-anchor": "top"
        },
        paint: {
          "icon-color": [
            "match",
            ["get", "category"],
            "built_archaeological", "#C67C3E",
            "historic_cities", "#2F6F8E",
            "cultural_landscapes", "#3A8F5B",
            "engineering_industry", "#6B6F76",
            "art_symbolic", "#7A4DA8",
            "#111111"
          ],
          "icon-halo-color": "rgba(255,255,255,0.85)",
          "icon-halo-width": 1.2,
          "text-halo-width": 0,
          "text-color": "#ffffff",
          "icon-opacity": 1,
          "text-opacity": 1
        },
        minzoom: 0
      });
      updatePoiFilters();
      fetch("data/poi.geojson")
        .then((r) => r.json())
        .then((data) => {
          poiGeojson = data;
          heritageCoords.clear();
          const counts = {};
          (data.features || []).forEach((f) => {
            const cat = f.properties && f.properties.category;
            if (!cat) return;
            counts[cat] = (counts[cat] || 0) + 1;
            const name = f.properties && f.properties.name ? f.properties.name : "";
            const coords = f && f.geometry && Array.isArray(f.geometry.coordinates)
              ? f.geometry.coordinates
              : null;
            if (name && coords && coords.length >= 2) {
              heritageCoords.set(name, coords);
            }
          });
          console.log("[poi-icons] category counts:", counts);
        })
        .catch((err) => {
          console.warn("Kon POI categorie counts niet laden.", err);
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
      const iso2 = f.properties["ISO3166-1-Alpha-2"];
      if (iso2 && iso2 !== "-99") {
        iso3ToIso2.set(iso3, iso2);
      }
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
      if (centroid && centroid.geometry && Array.isArray(centroid.geometry.coordinates)) {
        countryCentroids.set(iso3, centroid.geometry.coordinates);
      }
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

  applyMountainsVisibility();
  updateMountainLabelMode();
  applyPoiVisibility();
  applyInfoControlsVisibility();

  // Tiny markers terug als visuele hint
  showQuizHome();
});

initFameFilterControls();
if (creditsPanelEl) {
  creditsPanelEl.addEventListener("toggle", () => {
    if (creditsPanelEl.open) loadCredits();
  });
}

function hideStartScreen() {
  if (startScreenEl) startScreenEl.classList.add("hidden");
}

function showStartScreen() {
  if (startScreenEl) startScreenEl.classList.remove("hidden");
  hideCreditsScreen();
  hideQuizScreen();
  activeQuizCategory = null;
  applyMountainsVisibility();
  updateMountainLabelMode();
  applyPoiVisibility();
  applyInfoControlsVisibility();
}

function showQuizScreen(type) {
  if (!quizScreenEl) return;
  quizScreenEl.classList.remove("hidden");
  document.body.classList.add("quiz-screen-active");
  activeQuizCategory = type;
  if (quizScreenTitleEl) {
    quizScreenTitleEl.textContent = type === "nature" ? "Nature Quizzes" : "Culture Quizzes";
  }
  if (quizScreenCultureEl) {
    quizScreenCultureEl.classList.toggle("hidden", type === "nature");
  }
  if (quizScreenNatureEl) {
    quizScreenNatureEl.classList.toggle("hidden", type !== "nature");
  }
  applyMountainsVisibility();
  updateMountainLabelMode();
  applyPoiVisibility();
  applyInfoControlsVisibility();
}

function hideQuizScreen() {
  if (quizScreenEl) quizScreenEl.classList.add("hidden");
  document.body.classList.remove("quiz-screen-active");
}

function showCreditsScreen() {
  if (creditsScreenEl) creditsScreenEl.classList.remove("hidden");
  loadCredits();
}

function hideCreditsScreen() {
  if (creditsScreenEl) creditsScreenEl.classList.add("hidden");
}

if (startCultureBtn) {
  startCultureBtn.addEventListener("click", () => {
    hideStartScreen();
    hideCreditsScreen();
    if (cultureControlsEl) cultureControlsEl.open = true;
    if (natureControlsEl) natureControlsEl.open = false;
    showQuizScreen("culture");
  });
}

if (startNatureBtn) {
  startNatureBtn.addEventListener("click", () => {
    hideStartScreen();
    hideCreditsScreen();
    if (natureControlsEl) natureControlsEl.open = true;
    if (cultureControlsEl) cultureControlsEl.open = false;
    showQuizScreen("nature");
  });
}

if (startCreditsBtn) {
  startCreditsBtn.addEventListener("click", () => {
    hideStartScreen();
    showCreditsScreen();
  });
}

if (creditsBackBtn) {
  creditsBackBtn.addEventListener("click", () => {
    showStartScreen();
  });
}

if (quizBackBtn) {
  quizBackBtn.addEventListener("click", () => {
    showStartScreen();
  });
}

map.on("click", "my-countries-fill", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  if (!isQuizInProgress()) return;
  suppressGenericCountryClick = true;
  const clickFeatures = map.queryRenderedFeatures(e.point, { layers: COUNTRY_CLICK_LAYERS });
  const preferred = pickPreferredCountryFeature(clickFeatures) || feature;
  if (preferred) handleFeatureClick(preferred);
  setTimeout(() => {
    suppressGenericCountryClick = false;
  }, 0);
});

map.on("click", "my-countries-line", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  if (!isQuizInProgress()) return;
  suppressGenericCountryClick = true;
  const clickFeatures = map.queryRenderedFeatures(e.point, { layers: COUNTRY_CLICK_LAYERS });
  const preferred = pickPreferredCountryFeature(clickFeatures) || feature;
  if (preferred) handleFeatureClick(preferred);
  setTimeout(() => {
    suppressGenericCountryClick = false;
  }, 0);
});

map.on("click", (e) => {
  if (!isQuizInProgress()) return;
  if (suppressGenericCountryClick) return;
  const features = map.queryRenderedFeatures(e.point, { layers: COUNTRY_CLICK_LAYERS });
  if (!features || !features.length) return;
  const feature = pickPreferredCountryFeature(features);
  if (!feature) return;
  handleFeatureClick(feature);
});

map.on("click", (e) => {
  // Klik op water reset feedback
  if (!isQuizInProgress()) return;
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
    } else if (quizStage === "mountain") {
      if (currentMountainTarget) {
        setQuizText(`Find mountain range: ${currentMountainTarget}`, "");
      } else {
        setQuizText("Find: –", "");
      }
    } else if (quizStage === "heritage") {
      if (currentHeritageTarget) {
        const levelLabel = FAME_LABELS[heritageLevel] || "Heritage";
        setQuizText(`Find ${levelLabel}: ${currentHeritageTarget}`, "");
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
  if (!isQuizInProgress()) return;
  suppressGenericCountryClick = true;
  handleFeatureClick(feature);
  setTimeout(() => {
    suppressGenericCountryClick = false;
  }, 0);
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

map.on("click", "poi-icons", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  if (!activeQuiz) {
    updateInfoForPoi(feature);
    loadWikiPreviewForPoi(feature);
    return;
  }
  if (quizStage !== "heritage") return;
  if (!currentHeritageTarget) return;
  const props = feature.properties || {};
  const name = props.name || "";
  if (!name) return;
  if (name === currentHeritageTarget) {
    guessedHeritage.add(name);
    setQuizText(`Correct: ${name}`, "Picking next heritage site…");
    incrementStreak();
    showQuizToast("Correct!", "success");
    updateInfoForPoi(feature);
    loadWikiPreviewForPoi(feature);
    updateProgress();
    pickNextHeritageTarget();
  } else {
    const levelLabel = FAME_LABELS[heritageLevel] || "Heritage";
    setQuizText(`Find ${levelLabel}: ${currentHeritageTarget}`, `That was ${name}.`);
    resetStreak();
    showQuizToast("Wrong site.", "error");
    const targetCoords = heritageCoords.get(currentHeritageTarget);
    if (targetCoords) pulseAtCoords(targetCoords);
  }
});

map.on("click", "poi-mountains", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  const name = feature.properties && feature.properties.name ? feature.properties.name : "";
  if (!name) return;
  if (!activeQuiz) {
    showQuizPlaceInfo({ pill: "Mountain range", title: name });
    return;
  }
  if (quizStage !== "mountain") return;
  if (!currentMountainTarget) return;
  if (name === currentMountainTarget) {
    setMountainState(name, { guessed: true });
    guessedMountains.add(name);
    setQuizText(`Correct: ${name}`, "Picking next mountain range…");
    incrementStreak();
    showQuizToast("Correct!", "success");
    showQuizPlaceInfo({ pill: "Mountain range", title: name });
    resetCompass();
    updateProgress();
    pickNextMountainTarget();
  } else {
    provideMountainHint(name);
    setQuizText(`Find mountain range: ${currentMountainTarget}`, `That was ${name}.`);
    resetStreak();
    showQuizToast("Wrong mountain range.", "error");
    const targetCoords = mountainCoords.get(currentMountainTarget);
    if (targetCoords) pulseAtCoords(targetCoords);
  }
});

// Reset knop
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    showStartScreen();
  });
}

if (startContinentsBtn) {
  startContinentsBtn.addEventListener("click", () => {
    hideQuizScreen();
    startContinentQuiz();
  });
}

if (startCountriesBtn) {
  startCountriesBtn.addEventListener("click", () => {
    hideQuizScreen();
    openContinentPicker();
  });
}

if (startCapitalsBtn) {
  startCapitalsBtn.addEventListener("click", () => {
    hideQuizScreen();
    openContinentPicker("capital");
  });
}

if (startCurrenciesBtn) {
  startCurrenciesBtn.addEventListener("click", () => {
    hideQuizScreen();
    openContinentPicker("currency");
  });
}

if (startHeritageBtn) {
  startHeritageBtn.addEventListener("click", () => {
    hideQuizScreen();
    openHeritagePicker();
  });
}

if (startMountainsBtn) {
  startMountainsBtn.addEventListener("click", () => {
    hideQuizScreen();
    startMountainQuiz();
  });
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

if (heritageConfirmBtn) {
  heritageConfirmBtn.addEventListener("click", () => {
    if (!heritageCategoryChoice) {
      setQuizText("Find: –", "Kies eerst een categorie.");
      return;
    }
    startHeritageQuizWithCategory(heritageCategoryChoice);
  });
}

if (heritageCancelBtn) {
  heritageCancelBtn.addEventListener("click", () => {
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
    setQuizInfoPlaceholder("Currencies");
    pickNextCurrencyTarget();
  });
}
