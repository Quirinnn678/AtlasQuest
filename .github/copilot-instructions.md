# Copilot Instructions for World Map Quiz App

## Architecture Overview
This is a single-page geography quiz web app built with vanilla JavaScript and MapLibre GL JS. The app loads a GeoJSON file of world countries and implements interactive quizzes for continents, countries, and capitals. Key components:
- **Map Rendering**: MapLibre map in `#map` div, styled with continent colors and country highlights
- **Quiz Logic**: State-managed quiz stages (continent/country/capital) with progress tracking
- **Info Panel**: Displays selected country details from curated facts
- **True Size Panel**: Equal-area mini-map using d3-geo projection for area comparison

## Key Files and Patterns
- **`js/app.js`**: Main application logic; uses Maps for ISO3 lookups (`iso3ToName`, `iso3ToRegion`); handles MapLibre feature states for highlighting
- **`data/countries.geojson`**: Natural Earth dataset with country polygons; properties include ISO codes and names
- **`js/facts.js`**: Placeholder for curated country facts; extend `curatedCountryFacts` object with ISO3 keys
- **Styling**: CSS uses absolute positioning for overlays; MapLibre layers defined in JS with expressions like `["match", ["get", "CONTINENT"], ...]`

## Development Workflow
- **No build process**: Open `index.html` directly in browser; serve locally if CORS issues arise with GeoJSON
- **Debugging**: Use browser dev tools; MapLibre layers inspectable via map.getStyle()
- **Adding Facts**: Update `curatedCountryFacts` in `facts.js` with arrays of strings; display via `info-facts` list
- **Map Interactions**: Click events on countries trigger `setFeatureStateAll(iso3, {selected: true})` for highlighting

## Conventions
- **Language**: Dutch UI text and comments; English for technical code
- **State Management**: Global variables for quiz state (e.g., `guessedContinents`, `currentTargetContinent`); no framework
- **Disputed Territories**: Special handling with `HATCHED_NAMES` set and `LIGHT_GREEN_CHILDREN` for styling
- **Small Countries**: Filtered by area threshold (`SMALL_COUNTRY_AREA`); persistent mini-map display for tiny nations
- **External Libraries**: Loaded via CDN (MapLibre, Turf.js, d3-geo); avoid bundling

## Integration Points
- **MapLibre API**: Use `map.addSource()`, `map.addLayer()`, `map.setFeatureState()` for dynamic styling
- **Turf.js**: For centroid calculation (`turf.centroid(feature)`) and bbox operations
- **d3-geo**: Equal-area projection in true-size canvas; update canvas on country selection
- **GeoJSON Processing**: Load via fetch; build lookup maps on init for fast ISO3 access

## Common Tasks
- **Add New Quiz Type**: Extend `quizStage` logic in `startQuiz()` functions; add UI elements to `quiz-panel`
- **Update Country Data**: Modify `countries.geojson`; rebuild lookup maps in `loadCountries()`
- **Style Changes**: Edit MapLibre layer paint properties; use expressions for conditional styling based on feature properties</content>
<parameter name="filePath">/Users/quirinwijgers/Desktop/Facts about our world/Facts about our world/App Infrastructuur MapLibre/.github/copilot-instructions.md