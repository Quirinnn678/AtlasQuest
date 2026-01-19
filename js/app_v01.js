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
const FALLBACK_COLORS = [
  "#1d4ed8",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
  "#22c55e"
];

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
    if (lon >= -170 && lon <= -30 && lat >= -5) return "North America";
    if (lon >= -90 && lon <= -30 && lat < -5) return "South America";
    if (lon >= -25 && lon <= 60 && lat >= 35) return "Europe";
    if (lon >= -25 && lon <= 55 && lat >= -35 && lat < 35) return "Africa";
    if ((lon >= 110 || lon <= -110) && lat >= -50 && lat <= 30) return "Oceania";
    return "Asia";
  } catch (e) {
    return null;
  }
}

function deriveRegion(feature) {
  const props = feature.properties || {};
  const raw = canonicalRegion(props.region || props.subregion || props.CONTINENT || props.CONTINENT_CODE);
  if (raw && raw !== "Americas") return raw;
  const guessed = guessRegionFromCentroid(feature);
  if (!guessed) return "Other";
  if (raw === "Americas") {
    // split Americas met dezelfde centroidregel
    return guessed === "North America" || guessed === "South America" ? guessed : "North America";
  }
  return guessed;
}

function setQuizText(text, feedback) {
  if (quizTargetEl) quizTargetEl.textContent = text || "Target: –";
  if (quizFeedbackEl) quizFeedbackEl.textContent = feedback || "";
}

function updateProgress() {
  if (!progressPill) return;
  const total = continentList.length;
  const guessed = guessedContinents.size;
  if (!total) {
    progressPill.textContent = "Guessed: 0 / ? (loading…)";
    return;
  }
  const percent = ((guessed / total) * 100).toFixed(1);
  progressPill.textContent = `Guessed: ${guessed} / ${total} (${percent}%)`;
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

// ---- Kaart ----
const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {},
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#dbeafe" } }
    ]
  },
  center: DEFAULT_VIEW.center,
  zoom: DEFAULT_VIEW.zoom
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

map.on("load", async () => {
  map.addSource("my-countries", {
    type: "geojson",
    data: "data/countries.geojson",
    promoteId: "ISO3166-1-Alpha-3"
  });

  const geojson = await fetch("data/countries.geojson").then((r) => r.json());
  countriesGeojson = geojson;

  // Bepaal continenten en kleur per feature
  const continentSet = new Set();
  (geojson.features || []).forEach((f, idx) => {
    const region = canonicalRegion(deriveRegion(f));
    continentSet.add(region);
    const regionIdx = continentList.indexOf(region);
    const baseColor =
      CONTINENT_COLORS.get(region) ||
      FALLBACK_COLORS[(idx % FALLBACK_COLORS.length)];
    f.properties.region = region;
    f.properties.regionColor = baseColor;
  });

  // Maak stabiele lijst (7 continenten)
  continentList = Array.from(continentSet).filter((c) => c && c !== "Other").sort();

  const src = map.getSource("my-countries");
  if (src) src.setData(geojson);

  // Lagen
  map.addLayer({
    id: "my-countries-fill",
    type: "fill",
    source: "my-countries",
    paint: {
      "fill-color": [
        "coalesce",
        ["get", "regionColor"],
        ["match",
          ["get", "region"],
          "Africa", CONTINENT_COLORS.get("Africa"),
          "Asia", CONTINENT_COLORS.get("Asia"),
          "Europe", CONTINENT_COLORS.get("Europe"),
          "North America", CONTINENT_COLORS.get("North America"),
          "South America", CONTINENT_COLORS.get("South America"),
          "Oceania", CONTINENT_COLORS.get("Oceania"),
          "Antarctica", CONTINENT_COLORS.get("Antarctica"),
          /* default */ "#cbd5e1"
        ]
      ],
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "guessed"], false], 1.0,
        0.5
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

  pickNextContinent();
  updateProgress();
});

map.on("click", "my-countries-fill", (e) => {
  const feature = e.features && e.features[0];
  if (!feature) return;
  const region = canonicalRegion(feature.properties.region);
  if (!currentTargetContinent) return;

  if (region === currentTargetContinent) {
    guessedContinents.add(region);
    // Markeer alle features in dit continent
    if (countriesGeojson) {
      (countriesGeojson.features || []).forEach((f) => {
        if (canonicalRegion(f.properties.region) === region) {
          map.setFeatureState({ source: "my-countries", id: f.properties["ISO3166-1-Alpha-3"] }, { guessed: true });
        }
      });
    }
    setQuizText(`Correct: ${region}`, "Pick next continent…");
    updateProgress();
    pickNextContinent();
  } else {
    setQuizText(`Target continent: ${currentTargetContinent}`, `That was ${region}.`);
  }
});

map.on("click", (e) => {
  // Klik op water reset feedback
  const feats = map.queryRenderedFeatures(e.point, { layers: ["my-countries-fill"] });
  if (!feats || !feats.length) {
    setQuizText(`Target continent: ${currentTargetContinent || "–"}`, "");
  }
});

// Reset knop
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    guessedContinents.clear();
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
