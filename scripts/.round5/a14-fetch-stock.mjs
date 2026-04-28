// Agent A14 — Stock photo download + sharp re-encode pipeline.
// Downloads from Pexels CDN, resizes to long-edge ≤2000px, re-encodes
// progressive JPEG q=85, strips embedded metadata.
//
// Per-trip target counts in TARGETS array. Each pick has:
//   tripFolder, photoId, slug (for filename), photographer, photographerUrl, providerPageUrl, description, place
//
// Output structure expected: <repoRoot>/public/photos/<tripFolder>/<filename>
// And appends entries to scripts/photo-catalogue.json with shape per AGENTS.md spec.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

// Helper to slug usernames into filename-safe tokens.
const k = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// All picks. `slug` is the location-kebab portion; final filename =
// pexels-<slug>-<id>.jpg
const PICKS = [
  // ---------- 2018-04 SWEDEN — Malmö (+4) ----------
  {
    tripFolder: "2018-04-sweden",
    id: 7019069,
    slug: "malmo-turning-torso",
    photographer: "Nikolai Kolosov",
    photographerUrl: "https://www.pexels.com/@nikolai-kolosov/",
    pageUrl:
      "https://www.pexels.com/photo/turning-torso-building-in-malmo-sweden-photographed-from-across-the-canal-7019069/",
    description:
      "Turning Torso skyscraper standing above coastal Malmö under a clear blue sky, photographed from across the canal.",
    place: { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
  },
  {
    tripFolder: "2018-04-sweden",
    id: 17225672,
    slug: "malmo-turning-torso-fog",
    photographer: "Ira",
    photographerUrl: "https://www.pexels.com/@ira-2300811/",
    pageUrl:
      "https://www.pexels.com/photo/apartments-in-front-of-the-fog-shrouded-turning-torso-skyscraper-17225672/",
    description:
      "Foggy view of Malmö's Turning Torso skyscraper framed by residential apartment buildings in mist.",
    place: { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
  },
  {
    tripFolder: "2018-04-sweden",
    id: 13071531,
    slug: "malmo-turning-torso-sunset",
    photographer: "Patrik Stoltz",
    photographerUrl: "https://www.pexels.com/@pipo/",
    pageUrl: "https://www.pexels.com/photo/city-skyline-across-body-of-water-13071531/",
    description:
      "Reflection of the Turning Torso skyscraper on calm water at sunset in Malmö, Sweden.",
    place: { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
  },
  {
    tripFolder: "2018-04-sweden",
    id: 19475590,
    slug: "malmo-kungsparken-windmill",
    photographer: "Roda Agnas",
    photographerUrl: "https://www.pexels.com/@roda-agnas-1581723/",
    pageUrl: "https://www.pexels.com/photo/an-old-windmill-in-kungsparken-in-malmo-sweden-19475590/",
    description:
      "Historic windmill in Kungsparken, Malmö, surrounded by lush greenery under a clear summer sky.",
    place: { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
  },

  // ---------- 2019-07 BELGIUM — Brussels (+1) + Ghent (+1) ----------
  {
    tripFolder: "2019-07-belgium",
    id: 20595735,
    slug: "brussels-grand-place-statue",
    photographer: "Wolf Art",
    photographerUrl: "https://www.pexels.com/@wolfart/",
    pageUrl: "https://www.pexels.com/photo/golden-statue-at-grand-place-in-brussels-20595735/",
    description:
      "Ornate golden statue adorning a historic façade at Grand Place, Brussels.",
    place: { city: "Brussels", country: "Belgium", display: "Brussels, Belgium" },
  },
  {
    tripFolder: "2019-07-belgium",
    id: 30427221,
    slug: "ghent-canal-twilight",
    photographer: "Dylan Chan",
    photographerUrl: "https://www.pexels.com/@dylan-chan-2880813/",
    pageUrl:
      "https://www.pexels.com/photo/iconic-medieval-architecture-along-the-waterside-in-ghent-30427221/",
    description: "Medieval buildings illuminated at twilight along a reflective canal in Ghent.",
    place: { city: "Ghent", country: "Belgium", display: "Ghent, Belgium" },
  },

  // ---------- 2019-07 LUXEMBOURG (+4) ----------
  {
    tripFolder: "2019-07-luxembourg",
    id: 30217826,
    slug: "luxembourg-gothic-revival",
    photographer: "Büşra Karabulut",
    photographerUrl: "https://www.pexels.com/@busra-karabulut-2046162766/",
    pageUrl: "https://www.pexels.com/photo/gothic-revival-architecture-in-luxembourg-city-30217826/",
    description:
      "Gothic Revival architecture with ornate stonework and spires against the sky in Luxembourg City.",
    place: { city: "Luxembourg", country: "Luxembourg", display: "Luxembourg, Luxembourg" },
  },
  {
    tripFolder: "2019-07-luxembourg",
    id: 20054718,
    slug: "luxembourg-bar-night",
    photographer: "Ad Thiry",
    photographerUrl: "https://www.pexels.com/@adthiry/",
    pageUrl: "https://www.pexels.com/photo/bar-by-the-street-in-luxembourg-at-night-20054718/",
    description:
      "Nighttime street scene with a cozy bar and warm lighting in Luxembourg City's old town.",
    place: { city: "Luxembourg", country: "Luxembourg", display: "Luxembourg, Luxembourg" },
  },
  {
    tripFolder: "2019-07-luxembourg",
    id: 19909061,
    slug: "luxembourg-adolphe-bridge-autumn",
    photographer: "Ad Thiry",
    photographerUrl: "https://www.pexels.com/@adthiry/",
    pageUrl: "https://www.pexels.com/photo/adolphe-bridge-in-luxembourg-19909061/",
    description: "Adolphe Bridge framed by autumn foliage in Luxembourg City.",
    place: { city: "Luxembourg", country: "Luxembourg", display: "Luxembourg, Luxembourg" },
  },
  {
    tripFolder: "2019-07-luxembourg",
    id: 16376181,
    slug: "luxembourg-philharmonie",
    photographer: "Ruben Da Costa",
    photographerUrl: "https://www.pexels.com/@rubendcf/",
    pageUrl: "https://www.pexels.com/photo/building-of-luxembourg-philharmonie-16376181/",
    description:
      "Contemporary Luxembourg Philharmonie concert hall with geometric glass façade.",
    place: { city: "Luxembourg", country: "Luxembourg", display: "Luxembourg, Luxembourg" },
  },

  // ---------- 2020-02 DENMARK — Horsens (+4) ----------
  {
    tripFolder: "2020-02-denmark",
    id: 13274625,
    slug: "horsens-aerial-rooftops",
    photographer: "KAO MHG",
    photographerUrl: "https://www.pexels.com/@kaomhg/",
    pageUrl: "https://www.pexels.com/photo/aerial-photography-of-city-buildings-13274625/",
    description: "Aerial view of Horsens, Denmark featuring residential rooftops and streets.",
    place: { city: "Horsens", country: "Denmark", display: "Horsens, Denmark" },
  },
  {
    tripFolder: "2020-02-denmark",
    id: 13274632,
    slug: "horsens-aerial-cityscape",
    photographer: "KAO MHG",
    photographerUrl: "https://www.pexels.com/@kaomhg/",
    pageUrl: "https://www.pexels.com/photo/aerial-photography-of-city-buildings-13274632/",
    description: "Aerial view of Horsens showing modern architecture and urban streets.",
    place: { city: "Horsens", country: "Denmark", display: "Horsens, Denmark" },
  },
  {
    tripFolder: "2020-02-denmark",
    id: 13519043,
    slug: "horsens-aerial-architecture",
    photographer: "KAO MHG",
    photographerUrl: "https://www.pexels.com/@kaomhg/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-buildings-13519043/",
    description: "Aerial view of Horsens, Denmark featuring urban architecture and cityscape.",
    place: { city: "Horsens", country: "Denmark", display: "Horsens, Denmark" },
  },
  {
    tripFolder: "2020-02-denmark",
    id: 14547046,
    slug: "horsens-park-pathway",
    photographer: "Igor Meghega",
    photographerUrl: "https://www.pexels.com/@igor-meghega-315695093/",
    pageUrl: "https://www.pexels.com/photo/lush-green-park-with-pathway-14547046/",
    description:
      "Park in Horsens with a pathway leading toward a historic building, framed by greenery.",
    place: { city: "Horsens", country: "Denmark", display: "Horsens, Denmark" },
  },

  // ---------- 2022-07 GREECE — Kavala (+4) ----------
  {
    tripFolder: "2022-07-greece",
    id: 34030677,
    slug: "kavala-castle-waterfront",
    photographer: "Tetiana Hutsu",
    photographerUrl: "https://www.pexels.com/@tetiana-hutsu-2151030711/",
    pageUrl: "https://www.pexels.com/photo/picturesque-kavala-castle-waterfront-34030677/",
    description:
      "Daytime view of Kavala with the historic castle and colourful waterfront overlooking the Aegean.",
    place: { city: "Kavala", country: "Greece", display: "Kavala, Greece" },
  },
  {
    tripFolder: "2022-07-greece",
    id: 36114859,
    slug: "kavala-stone-arch",
    photographer: "Barkalı",
    photographerUrl: "https://www.pexels.com/@barkali-340353352/",
    pageUrl: "https://www.pexels.com/photo/kavala-stone-arch-view-36114859/",
    description: "Kavala harbor framed by a historic stone archway with moored boats.",
    place: { city: "Kavala", country: "Greece", display: "Kavala, Greece" },
  },
  {
    tripFolder: "2022-07-greece",
    id: 29072782,
    slug: "kavala-harbor-twilight",
    photographer: "Sevgi LALE",
    photographerUrl: "https://www.pexels.com/@sevgiilale/",
    pageUrl: "https://www.pexels.com/photo/kavala-harbor-twilight-29072782/",
    description: "Twilight view of Kavala harbor with boats and surrounding mountains.",
    place: { city: "Kavala", country: "Greece", display: "Kavala, Greece" },
  },
  {
    tripFolder: "2022-07-greece",
    id: 35837532,
    slug: "kavala-rooftops-sunset",
    photographer: "Lydia Griva",
    photographerUrl: "https://www.pexels.com/@iris/",
    pageUrl: "https://www.pexels.com/photo/sunset-coastal-city-kavala-greece-35837532/",
    description:
      "Sunset over the coastal city of Kavala with terracotta rooftops and tranquil sea.",
    place: { city: "Kavala", country: "Greece", display: "Kavala, Greece" },
  },

  // ---------- 2022-08 DENMARK — Billund + Horsens (+2) ----------
  {
    tripFolder: "2022-08-denmark",
    id: 11554593,
    slug: "billund-airport-airliner",
    photographer: "Fatih Turan",
    photographerUrl: "https://www.pexels.com/@fatih-turan-63325184/",
    pageUrl: "https://www.pexels.com/photo/airplane-billund-airport-11554593/",
    description: "Airliner approaching Billund Airport, Denmark under cloudy skies.",
    place: {
      city: "Billund Municipality",
      country: "Denmark",
      display: "Billund Municipality, Denmark",
    },
  },
  {
    tripFolder: "2022-08-denmark",
    id: 13519728,
    slug: "horsens-aerial-summer",
    photographer: "KAO MHG",
    photographerUrl: "https://www.pexels.com/@kaomhg/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-town-near-body-of-water-13519728/",
    description:
      "Aerial view of Horsens, Denmark in summer showing buildings, streets and waterways.",
    place: { city: "Horsens", country: "Denmark", display: "Horsens, Denmark" },
  },

  // ---------- 2022-08 ROMANIA — Săcele / Brașov region (+4) ----------
  {
    tripFolder: "2022-08-romania",
    id: 15511267,
    slug: "brasov-tampa-cable-car",
    photographer: "Radubradu",
    photographerUrl: "https://www.pexels.com/@radubradu-395822838/",
    pageUrl:
      "https://www.pexels.com/photo/view-of-the-tampa-cable-car-and-the-city-of-brasov-romania-15511267/",
    description: "Aerial view from the Tâmpa Cable Car over Brașov's old town and surrounding hills.",
    place: { city: "Brașov", country: "Romania", display: "Brașov, Romania" },
  },
  {
    tripFolder: "2022-08-romania",
    id: 34069343,
    slug: "brasov-council-square-tower",
    photographer: "Râmbeț Ioana",
    photographerUrl: "https://www.pexels.com/@rambe-ioana-211953981/",
    pageUrl: "https://www.pexels.com/photo/historic-square-clock-tower-brasov-34069343/",
    description:
      "Overhead view of Brașov's historic central square and clock tower among forested hills.",
    place: { city: "Brașov", country: "Romania", display: "Brașov, Romania" },
  },
  {
    tripFolder: "2022-08-romania",
    id: 9315381,
    slug: "brasov-mountain-panorama",
    photographer: "Ana-Maria Antonenco",
    photographerUrl: "https://www.pexels.com/@ana-maria-antonenco-78158389/",
    pageUrl: "https://www.pexels.com/photo/cityscape-with-mountain-backdrop-9315381/",
    description:
      "Panoramic cityscape of Brașov with a forested mountain backdrop under clear skies.",
    place: { city: "Brașov", country: "Romania", display: "Brașov, Romania" },
  },
  {
    tripFolder: "2022-08-romania",
    id: 36957142,
    slug: "brasov-cobblestone-street",
    photographer: "Alexandra H. Maria",
    photographerUrl: "https://www.pexels.com/@alexandra-h-maria-51314627/",
    pageUrl: "https://www.pexels.com/photo/cobblestone-street-historic-architecture-brasov-36957142/",
    description: "Historic cobblestone street with charming architecture in Brașov, Romania.",
    place: { city: "Brașov", country: "Romania", display: "Brașov, Romania" },
  },

  // ---------- 2022-10 DENMARK — Randers area (+4) ----------
  {
    tripFolder: "2022-10-denmark",
    id: 6526779,
    slug: "randers-haslund-church-winter",
    photographer: "Mark Hansen",
    photographerUrl: "https://www.pexels.com/@mark-hansen-12409788/",
    pageUrl: "https://www.pexels.com/photo/haslund-church-in-winter-6526779/",
    description: "Snowy winter landscape of Haslund Church in Randers, Denmark.",
    place: { city: "Randers", country: "Denmark", display: "Randers, Denmark" },
  },
  {
    tripFolder: "2022-10-denmark",
    id: 4512516,
    slug: "randers-wind-turbines",
    photographer: "Peter Holmboe",
    photographerUrl: "https://www.pexels.com/@holmboe/",
    pageUrl:
      "https://www.pexels.com/photo/white-wind-turbines-under-blue-sky-and-white-clouds-4512516/",
    description: "White wind turbines against vibrant blue sky and white clouds in Randers, Denmark.",
    place: { city: "Randers", country: "Denmark", display: "Randers, Denmark" },
  },
  {
    tripFolder: "2022-10-denmark",
    id: 15796451,
    slug: "aarhus-cathedral-harbor",
    photographer: "Deyaar Rumi",
    photographerUrl: "https://www.pexels.com/@deyaar-rumi-427064673/",
    pageUrl: "https://www.pexels.com/photo/aarhus-cathedral-harbor-15796451/",
    description: "Aarhus Cathedral tower against a cloudy sky with harbor view in East Jutland.",
    place: { city: "Aarhus", country: "Denmark", display: "Aarhus, Denmark" },
  },
  {
    tripFolder: "2022-10-denmark",
    id: 32136937,
    slug: "aarhus-half-timbered-street",
    photographer: "Jakob Andersson",
    photographerUrl: "https://www.pexels.com/@jakobandersson/",
    pageUrl: "https://www.pexels.com/photo/aarhus-historic-architecture-32136937/",
    description: "Charming European street with traditional half-timbered architecture in Aarhus.",
    place: { city: "Aarhus", country: "Denmark", display: "Aarhus, Denmark" },
  },

  // ---------- 2022-10 GERMANY — Hamburg (+3) ----------
  {
    tripFolder: "2022-10-germany",
    id: 7133327,
    slug: "hamburg-wasserschloss-bw",
    photographer: "Niklas Jeromin",
    photographerUrl: "https://www.pexels.com/@njeromin/",
    pageUrl: "https://www.pexels.com/photo/the-wasserschloss-in-speicherstadt-hamburg-7133327/",
    description:
      "Black-and-white photograph of the Wasserschloss water castle in Hamburg's Speicherstadt district.",
    place: { city: "Hamburg", country: "Germany", display: "Hamburg, Germany" },
  },
  {
    tripFolder: "2022-10-germany",
    id: 26443234,
    slug: "hamburg-elbphilharmonie-brick",
    photographer: "Dario Rawert",
    photographerUrl: "https://www.pexels.com/@dario-rawert-724203352/",
    pageUrl: "https://www.pexels.com/photo/elbphilharmonie-in-hamburg-in-germany-26443234/",
    description:
      "Modern Elbphilharmonie towering above historic brick architecture in Hamburg's HafenCity.",
    place: { city: "Hamburg", country: "Germany", display: "Hamburg, Germany" },
  },
  {
    tripFolder: "2022-10-germany",
    id: 30195965,
    slug: "hamburg-speicherstadt-canal",
    photographer: "Jan Reichelt",
    photographerUrl: "https://www.pexels.com/@jan-reichelt-911302335/",
    pageUrl: "https://www.pexels.com/photo/historic-red-brick-warehouses-30195965/",
    description: "Historic red brick warehouses lining the canal in Hamburg's Speicherstadt district.",
    place: { city: "Hamburg", country: "Germany", display: "Hamburg, Germany" },
  },

  // ---------- 2022-12 ROMANIA — Bucharest (+4) ----------
  {
    tripFolder: "2022-12-romania",
    id: 28898468,
    slug: "bucharest-palace-parliament",
    photographer: "Uiliam Nörnberg",
    photographerUrl: "https://www.pexels.com/@uiliamnornberg/",
    pageUrl: "https://www.pexels.com/photo/palace-of-the-parliament-in-bucharest-romania-28898468/",
    description:
      "Iconic neoclassical Palace of the Parliament in Bucharest under clear blue skies.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
  {
    tripFolder: "2022-12-romania",
    id: 31829727,
    slug: "bucharest-arcul-de-triumf-night",
    photographer: "Barış Kılınç",
    photographerUrl: "https://www.pexels.com/@baris-kilinc-124682051/",
    pageUrl: "https://www.pexels.com/photo/arcul-de-triumf-bucharest-night-31829727/",
    description: "Nighttime shot of Arcul de Triumf in Bucharest with light trails from passing cars.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
  {
    tripFolder: "2022-12-romania",
    id: 16715136,
    slug: "bucharest-military-circle-corner",
    photographer: "nurs raw",
    photographerUrl: "https://www.pexels.com/@nurs-raw-42373260/",
    pageUrl: "https://www.pexels.com/photo/military-circle-palace-bucharest-16715136/",
    description:
      "Historic ornate corner tower of the National Military Circle Palace in Bucharest.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
  {
    tripFolder: "2022-12-romania",
    id: 28898464,
    slug: "bucharest-quiet-street",
    photographer: "Uiliam Nörnberg",
    photographerUrl: "https://www.pexels.com/@uiliamnornberg/",
    pageUrl: "https://www.pexels.com/photo/charming-street-scene-in-bucharest-romania-28898464/",
    description: "Elegant architecture and quiet street scene in Bucharest's old town.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },

  // ---------- 2023-04 ITALY — Milan (+1) ----------
  {
    tripFolder: "2023-04-italy",
    id: 29655807,
    slug: "milan-galleria-vittorio",
    photographer: "Haim Charbit",
    photographerUrl: "https://www.pexels.com/@haim-charbit-46102840/",
    pageUrl: "https://www.pexels.com/photo/galleria-vittorio-emanuele-ii-in-milan-italy-29655807/",
    description: "Interior of the Galleria Vittorio Emanuele II in Milan with shoppers.",
    place: { city: "Milan", country: "Italy", display: "Milan, Italy" },
  },

  // ---------- 2023-07 TURKEY — Istanbul (+1) ----------
  {
    tripFolder: "2023-07-turkey",
    id: 29069777,
    slug: "istanbul-galata-tower-street",
    photographer: "Rahime Gül",
    photographerUrl: "https://www.pexels.com/@rahimegul/",
    pageUrl: "https://www.pexels.com/photo/street-view-of-galata-tower-in-istanbul-29069777/",
    description: "Bustling street with a view of the historic Galata Tower in Istanbul.",
    place: { city: "Istanbul", country: "Turkey", display: "Istanbul, Turkey" },
  },

  // ---------- 2023-08 ROMANIA — Sinaia / Săcele region (+3) ----------
  {
    tripFolder: "2023-08-romania",
    id: 18703684,
    slug: "sinaia-peles-castle-autumn",
    photographer: "Swiss Atlas",
    photographerUrl: "https://www.pexels.com/@swiss-atlas-485481359/",
    pageUrl: "https://www.pexels.com/photo/peles-castle-autumn-18703684/",
    description: "Peleș Castle surrounded by autumn forest in Sinaia, Romania.",
    place: { city: "Sinaia", country: "Romania", display: "Sinaia, Romania" },
  },
  {
    tripFolder: "2023-08-romania",
    id: 5651718,
    slug: "sinaia-peles-castle-summer",
    photographer: "Mika",
    photographerUrl: "https://www.pexels.com/@mika-1818106/",
    pageUrl: "https://www.pexels.com/photo/historical-castle-building-architecture-5651718/",
    description: "Neo-Renaissance Peleș Castle in Sinaia under bright blue sky and summer forest.",
    place: { city: "Sinaia", country: "Romania", display: "Sinaia, Romania" },
  },
  {
    tripFolder: "2023-08-romania",
    id: 35380540,
    slug: "brasov-black-church-snow",
    photographer: "Valeria Drozdova",
    photographerUrl: "https://www.pexels.com/@valeria-drozdova-2148646707/",
    pageUrl: "https://www.pexels.com/photo/black-church-snow-winter-35380540/",
    description: "Brașov's Black Church under a winter sky with Gothic spires emerging from snow.",
    place: { city: "Brașov", country: "Romania", display: "Brașov, Romania" },
  },

  // ---------- 2024-09 ALBANIA — Saranda + Gjirokastra (+3) ----------
  {
    tripFolder: "2024-09-albania-saranda",
    id: 6863718,
    slug: "saranda-night-lights",
    photographer: "Andrew Schwark",
    photographerUrl: "https://www.pexels.com/@andrew-schwark-540305/",
    pageUrl: "https://www.pexels.com/photo/saranda-city-in-albania-night-lights-view-6863718/",
    description: "Illuminated Sarandë waterfront at night with reflections on calm waters.",
    place: { city: "Saranda", country: "Albania", display: "Saranda, Albania" },
  },
  {
    tripFolder: "2024-09-albania-saranda",
    id: 33067851,
    slug: "saranda-lekursi-castle",
    photographer: "Arlind D",
    photographerUrl: "https://www.pexels.com/@arlindphotography/",
    pageUrl: "https://www.pexels.com/photo/lekursi-castle-saranda-evening-33067851/",
    description: "Evening view of Sarandë's waterfront and Lekursi Castle on the Albanian coast.",
    place: { city: "Saranda", country: "Albania", display: "Saranda, Albania" },
  },
  {
    tripFolder: "2024-09-albania-saranda",
    id: 11932455,
    slug: "gjirokastra-fortress-flag",
    photographer: "Minsu B",
    photographerUrl: "https://www.pexels.com/@minsubreitenstein/",
    pageUrl: "https://www.pexels.com/photo/albanian-flag-flying-above-ruins-of-fortress-11932455/",
    description: "Albanian flag waving above Gjirokastra fortress amid lush hillside terrain.",
    place: { city: "Gjirokastra", country: "Albania", display: "Gjirokastra, Albania" },
  },

  // ---------- 2025-02 FINLAND — Helsinki (+3) ----------
  {
    tripFolder: "2025-02-finland",
    id: 8751413,
    slug: "helsinki-winter-aerial",
    photographer: "Kseniia Bezz",
    photographerUrl: "https://www.pexels.com/@bezzaponnaya/",
    pageUrl: "https://www.pexels.com/photo/captivating-aerial-view-of-helsinki-cityscape-during-winter-8751413/",
    description: "Aerial winter view of Helsinki's old town with snow-covered rooftops.",
    place: { city: "Helsinki", country: "Finland", display: "Helsinki, Finland" },
  },
  {
    tripFolder: "2025-02-finland",
    id: 2311602,
    slug: "helsinki-cathedral-dusk",
    photographer: "Tapio Haaja",
    photographerUrl: "https://www.pexels.com/@tapio-haaja-1214336/",
    pageUrl: "https://www.pexels.com/photo/photo-of-cathedral-near-buildings-and-river-2311602/",
    description: "Helsinki Cathedral illuminated at dusk with reflections on the waterfront.",
    place: { city: "Helsinki", country: "Finland", display: "Helsinki, Finland" },
  },
  {
    tripFolder: "2025-02-finland",
    id: 37079862,
    slug: "helsinki-tram-sunrise",
    photographer: "Mingyang LIU",
    photographerUrl: "https://www.pexels.com/@mingyang-liu-301813241/",
    pageUrl: "https://www.pexels.com/photo/historic-tram-helsinki-37079862/",
    description: "A historic tram on a Helsinki street at sunrise, with classic architecture.",
    place: { city: "Helsinki", country: "Finland", display: "Helsinki, Finland" },
  },

  // ---------- 2025-03 ROMANIA — Bucharest (+4) ----------
  {
    tripFolder: "2025-03-romania",
    id: 16103344,
    slug: "bucharest-carturesti-carusel",
    photographer: "Czapp Árpád",
    photographerUrl: "https://www.pexels.com/@czapp-arpad-3647289/",
    pageUrl: "https://www.pexels.com/photo/carturesti-carusel-in-bucharest-romania-16103344/",
    description: "Multi-level Cărturești Carusel bookstore interior with spiral staircase and columns.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
  {
    tripFolder: "2025-03-romania",
    id: 17066979,
    slug: "bucharest-parliament-cloudy",
    photographer: "Roman Muntean",
    photographerUrl: "https://www.pexels.com/@roman-muntean-369190311/",
    pageUrl: "https://www.pexels.com/photo/historical-landmark-bucharest-cloud-17066979/",
    description: "Neoclassical Palace of the Parliament façade under dramatic cloudy skies.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
  {
    tripFolder: "2025-03-romania",
    id: 30210641,
    slug: "bucharest-triumphal-arch-night",
    photographer: "Angelos Lamprakopoulos",
    photographerUrl: "https://www.pexels.com/@angelos-lamprakopoulos-3670919/",
    pageUrl: "https://www.pexels.com/photo/triumphal-arch-bucharest-night-30210641/",
    description: "Bucharest's Triumphal Arch illuminated at night against a dark sky.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
  {
    tripFolder: "2025-03-romania",
    id: 28898466,
    slug: "bucharest-charming-street",
    photographer: "Uiliam Nörnberg",
    photographerUrl: "https://www.pexels.com/@uiliamnornberg/",
    pageUrl: "https://www.pexels.com/photo/charming-street-view-in-bucharest-romania-28898466/",
    description: "Vibrant Bucharest street scene with historic European architecture and outdoor cafes.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
];

function targetPath(pick) {
  const file = `pexels-${pick.slug}-${pick.id}.jpg`;
  return {
    file,
    rel: `trips/${pick.tripFolder}/${file}`,
    abs: join(repoRoot, "public", "photos", "trips", pick.tripFolder, file),
  };
}

async function downloadImage(pick) {
  const url = `https://images.pexels.com/photos/${pick.id}/pexels-photo-${pick.id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) {
    throw new Error(`Suspiciously small response (${buf.length} bytes) for ${url}`);
  }
  return buf;
}

async function processOne(pick) {
  const { file, rel, abs } = targetPath(pick);
  mkdirSync(dirname(abs), { recursive: true });

  if (existsSync(abs)) {
    console.log(`  [skip exists] ${rel}`);
    return { pick, rel, abs, file, skipped: true };
  }

  const raw = await downloadImage(pick);
  // sharp re-encode: long edge ≤2000, progressive JPEG q=85, strip metadata.
  const out = await sharp(raw)
    .rotate() // honour EXIF rotation, then strip
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(abs, out);
  console.log(`  [ok] ${rel} (${(out.length / 1024).toFixed(0)} KB)`);
  return { pick, rel, abs, file, bytes: out.length };
}

const results = [];
const failures = [];

for (const pick of PICKS) {
  try {
    const r = await processOne(pick);
    results.push(r);
  } catch (err) {
    console.error(`  [FAIL] ${pick.tripFolder}/${pick.slug}-${pick.id}: ${err.message}`);
    failures.push({ pick, error: err.message });
  }
}

console.log(`\nDone. ${results.length} processed, ${failures.length} failures.`);

// ---------- Append to photo-catalogue.json ----------
const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  const src = r.rel;
  if (existingSrc.has(src)) continue;
  newEntries.push({
    src,
    takenAt: null,
    hasGps: false,
    place: r.pick.place,
    source: {
      type: "stock",
      provider: "Pexels",
      url: r.pick.pageUrl,
      photographer: r.pick.photographer,
      photographerUrl: r.pick.photographerUrl,
      license: PEXELS_LICENSE,
      licenseUrl: PEXELS_LICENSE_URL,
    },
  });
}

const merged = [...catalogue, ...newEntries];
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${newEntries.length} catalogue entries.`);

// ---------- Write attribution doc ----------
const attribPath = join(repoRoot, "docs", "photo-attributions.md");
const attribLines = [
  "# Stock photo attributions",
  "",
  "Reuse-allowed stock photographs sourced for trip-detail galleries.",
  "All entries are licensed under the Pexels License (https://www.pexels.com/license/),",
  "which permits free commercial + non-commercial use; attribution is appreciated but",
  "not required. The portfolio nevertheless preserves attribution in",
  "`scripts/photo-catalogue.json` (`source` block) and in this document so that the",
  "lightbox / detail UI can surface photographer credit once that work lands.",
  "",
  "_Generated by `scripts/.round5/a14-fetch-stock.mjs` on " +
    new Date().toISOString().slice(0, 10) +
    "._",
  "",
  "| File | City | Photographer | Provider | Source URL |",
  "| --- | --- | --- | --- | --- |",
];
const sortedResults = [...results].sort((a, b) => a.rel.localeCompare(b.rel));
for (const r of sortedResults) {
  attribLines.push(
    `| \`public/photos/${r.rel}\` | ${r.pick.place.display} | [${r.pick.photographer}](${r.pick.photographerUrl}) | Pexels | [link](${r.pick.pageUrl}) |`,
  );
}
attribLines.push("");
attribLines.push("## License terms");
attribLines.push("");
attribLines.push("- **Pexels License** — https://www.pexels.com/license/");
attribLines.push("  - Free for commercial and non-commercial use.");
attribLines.push("  - Attribution appreciated but not required.");
attribLines.push("  - May not be sold without significant modification.");
attribLines.push("  - May not be used to depict identifiable people in a bad light.");
attribLines.push("");
writeFileSync(attribPath, attribLines.join("\n"), "utf8");
console.log(`Wrote ${attribPath}.`);

// ---------- Persist results manifest for follow-on summary ----------
const manifestPath = join(__dirname, "a14-results.json");
writeFileSync(
  manifestPath,
  JSON.stringify({ results, failures }, null, 2),
  "utf8",
);
console.log(`Wrote ${manifestPath}.`);
