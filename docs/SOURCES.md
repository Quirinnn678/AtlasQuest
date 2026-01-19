# Sources

Dataset/Bron | Provider | Gebruik (welke lagen/velden) | Licentie | Attributietekst | URL | Access date
---|---|---|---|---|---|---
REST Countries API | REST Countries | `js/app.js` fetch voor regio's, capitals, currencies, UN/independent-lijsten | MIT (API); data sources vary (license onzeker) | Source: REST Countries | https://restcountries.com/ | 2026-01-09
Wikidata EntityData API | Wikidata | `js/app.js` resolve QID → Wikipedia sitelink | CC0 1.0 | Data from Wikidata (CC0 1.0). | https://www.wikidata.org/ | 2026-01-09
Wikidata SPARQL (offline extract) | Wikidata | Bron voor `data/poi.geojson`, `data/unesco_*.geojson`, `data/unesco_*.csv` | CC0 1.0 | Data from Wikidata (CC0 1.0). | https://query.wikidata.org/ | 2026-01-09
Wikipedia / MediaWiki API | Wikipedia/Wikimedia | `js/app.js` previews (extract, thumbnail, page URL) voor POI-kliks | CC BY-SA 3.0 / GFDL (tekst), afbeeldingen variëren | Text and images from Wikipedia/Wikimedia; individual image licenses apply. | https://www.wikipedia.org/ | 2026-01-09
MapLibre demo glyphs | MapLibre | `js/app.js` glyphs voor font rendering (`demotiles.maplibre.org`) | Onbekend (verifiëren) | MapLibre demo tiles (glyphs). | https://demotiles.maplibre.org/ | 2026-01-09
countries.geojson | Natural Earth | `js/app.js` source `my-countries` (landpolygonen) | Public Domain | Country boundaries: Natural Earth, Admin 0 – Countries (1:10m) (derived/modified). | https://www.naturalearthdata.com/ | 2026-01-09
mountains.geojson | Unknown | `js/app.js` source `mountains` (mountain ranges POI) | Onbekend (verifiëren) | Source unknown (needs verification). | Unknown | 2026-01-09
lakes.geojson | Unknown | Bestand aanwezig, niet in code geladen | Onbekend (verifiëren) | Source unknown (needs verification). | Unknown | 2026-01-09
poi.geojson | Derived from Wikidata + manual categorization | `js/app.js` source `poi` (UNESCO POI + categories) | CC0 1.0 (Wikidata); categorization custom | Data from Wikidata (CC0 1.0). | https://www.wikidata.org/ | 2026-01-09

## Libraries

Library | Version | License | Source
---|---|---|---
MapLibre GL JS | 4.4.0 | BSD-3-Clause | https://unpkg.com/maplibre-gl@4.4.0/dist/maplibre-gl.js
Turf.js | 6.x | MIT | https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js
d3-geo | 1.12.1 | ISC | https://unpkg.com/d3-geo@1.12.1
