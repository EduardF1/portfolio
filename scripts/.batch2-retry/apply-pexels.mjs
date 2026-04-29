// Batch 2 retry — Germany / Greece / Hungary / Poland thin-city backfill.
// Lifts each listed city to >=5 photos via Pexels stock fill.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

// Trip mid-points used as fallback `takenAt` for stock entries (per existing convention).
const TRIP_MID = {
  "2022-10-germany": "2022-10-21T12:00:00Z",
  "2022-07-greece": "2022-07-20T12:00:00Z",
  "2023-07-greece-athens-halkidiki": "2023-07-06T12:00:00Z",
  "2024-08-hungary-roadtrip": "2024-08-15T12:00:00Z",
  "2026-03-balkans-roadtrip": "2026-03-15T12:00:00Z",
  "2025-04-czechia-poland-slovakia-austria": "2025-04-15T12:00:00Z",
};

const PLACES = {
  munster: { gps: { lat: 52.98687, lon: 10.10924 }, place: { city: "Munster", country: "Germany", display: "Munster, Germany" } },
  dachau: { gps: { lat: 48.25557, lon: 11.43862 }, place: { city: "Dachau", country: "Germany", display: "Dachau, Germany" } },
  landsberg: { gps: { lat: 48.05159, lon: 10.87511 }, place: { city: "Landsberg am Lech", country: "Germany", display: "Landsberg am Lech, Germany" } },
  kassel: { gps: { lat: 51.31407, lon: 9.4883 }, place: { city: "Kassel", country: "Germany", display: "Kassel, Germany" } },
  neaFokea: { place: { city: "Nea Fokea", country: "Greece", display: "Nea Fokea, Greece" } },
  keramoti: { gps: { lat: 40.85767, lon: 24.70224 }, place: { city: "Keramoti", country: "Greece", display: "Keramoti, Greece" } },
  athens: { gps: { lat: 37.97457, lon: 23.99225 }, place: { city: "Athens", country: "Greece", display: "Athens, Greece" } },
  thassos: { gps: { lat: 40.67472, lon: 24.76 }, place: { city: "Thassos", country: "Greece", display: "Thassos, Greece" } },
  nafplio: { gps: { lat: 37.567, lon: 22.8043 }, place: { city: "Nafplio", country: "Greece", display: "Nafplio, Greece" } },
  abdera: { gps: { lat: 40.93732, lon: 24.95646 }, place: { city: "Abdera", country: "Greece", display: "Abdera, Greece" } },
  budapest: { gps: { lat: 47.4979, lon: 19.0402 }, place: { city: "Budapest", country: "Hungary", display: "Budapest, Hungary" } },
  gyula: { gps: { lat: 46.6486, lon: 21.2828 }, place: { city: "Gyula", country: "Hungary", display: "Gyula, Hungary" } },
  kecskemet: { gps: { lat: 46.90705, lon: 19.68729 }, place: { city: "Kecskemét", country: "Hungary", display: "Kecskemét, Hungary" } },
  oswiecim: { gps: { lat: 50.0344, lon: 19.2098 }, place: { city: "Oświęcim", country: "Poland", display: "Oświęcim, Poland" } },
  zakopane: { gps: { lat: 49.2992, lon: 19.9496 }, place: { city: "Zakopane", country: "Poland", display: "Zakopane, Poland" } },
  murzasichle: { gps: { lat: 49.30832, lon: 20.0444 }, place: { city: "Murzasichle", country: "Poland", display: "Murzasichle, Poland" } },
  brzegi: { gps: { lat: 49.25113, lon: 20.09979 }, place: { city: "Brzegi", country: "Poland", display: "Brzegi, Poland" } },
  brzezinka: { gps: { lat: 50.03452, lon: 19.18303 }, place: { city: "Brzezinka", country: "Poland", display: "Brzezinka, Poland" } },
  katowice: { gps: { lat: 50.2601, lon: 19.02161 }, place: { city: "Katowice", country: "Poland", display: "Katowice, Poland" } },
};

// Each pick = one Pexels photo to import.
// pageUrl format: https://www.pexels.com/photo/<descriptive-slug>-<id>/
const PICKS = [
  // ---- Germany ----
  // Munster (Lower Saxony) — town sits inside Lüneburg Heath; use heath landscape.
  {
    tripFolder: "2022-10-germany", id: 27978161, slug: "lueneburg-heath-lavender-field",
    photographer: "deuspix", photographerUrl: "https://www.pexels.com/@deuspix/",
    pageUrl: "https://www.pexels.com/photo/vibrant-lavender-field-in-lueneburg-heath-during-daytime-27978161/",
    placeKey: "munster",
  },
  // Dachau — town and memorial.
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 32808850, slug: "dachau-historic-brick-building-bw",
    photographer: "Nicola Ravi", photographerUrl: "https://www.pexels.com/@nicolaravi/",
    pageUrl: "https://www.pexels.com/photo/black-and-white-photo-of-a-historic-brick-building-in-dachau-bavaria-32808850/",
    placeKey: "dachau",
  },
  // Landsberg am Lech — riverside Bavarian town with historic gates.
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 29673694, slug: "landsberg-am-lech-winter-river",
    photographer: "Sabine Freiberger", photographerUrl: "https://www.pexels.com/@sabine-freiberger-2147687567/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-landsberg-am-lech-in-winter-29673694/",
    placeKey: "landsberg",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 32834506, slug: "landsberg-am-lech-colorful-houses-river",
    photographer: "inkinterrupted", photographerUrl: "https://www.pexels.com/@inkinterrupted/",
    pageUrl: "https://www.pexels.com/photo/colorful-bavarian-architecture-in-landsberg-am-lech-32834506/",
    placeKey: "landsberg",
  },
  // Existing Landsberg 2 are own; Pexels Landsberg-specific shots = 2 (29673694 + 32834506).
  // For 3rd-5th, use upper-Lech-river / Bavarian-Alps photos along same river basin.
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 20741181, slug: "fuessen-lech-river-alpine",
    photographer: "Wolfgang Weiser", photographerUrl: "https://www.pexels.com/@wolfgang-weiser-467045605/",
    pageUrl: "https://www.pexels.com/photo/landscape-fuessen-germany-river-bridge-alpine-20741181/",
    placeKey: "landsberg",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 22618185, slug: "fuessen-lech-river-church",
    photographer: "Wolfgang Weiser", photographerUrl: "https://www.pexels.com/@wolfgang-weiser-467045605/",
    pageUrl: "https://www.pexels.com/photo/town-view-fuessen-germany-historic-church-river-22618185/",
    placeKey: "landsberg",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 36277562, slug: "munich-karlstor-bavarian-gate",
    photographer: "Memory Lane", photographerUrl: "https://www.pexels.com/@memory-lane-2157293172/",
    pageUrl: "https://www.pexels.com/photo/historic-karlstor-gate-munich-architectural-charm-36277562/",
    placeKey: "landsberg",
  },

  // Kassel — Bergpark Wilhelmshöhe / Hercules.
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 27579628, slug: "kassel-hercules-monument",
    photographer: "Kemal Berkay Doğan", photographerUrl: "https://www.pexels.com/@kemal-berkay-dogan/",
    pageUrl: "https://www.pexels.com/photo/iconic-hercules-monument-bergpark-wilhelmshohe-kassel-27579628/",
    placeKey: "kassel",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 27579632, slug: "kassel-bergpark-wilhelmshoehe",
    photographer: "Kemal Berkay Doğan", photographerUrl: "https://www.pexels.com/@kemal-berkay-dogan/",
    pageUrl: "https://www.pexels.com/photo/beautiful-bergpark-wilhelmshohe-in-kassel-a-unesco-world-heritage-site-27579632/",
    placeKey: "kassel",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 27579634, slug: "kassel-wilhelmshoehe-palace-cityscape",
    photographer: "Kemal Berkay Doğan", photographerUrl: "https://www.pexels.com/@kemal-berkay-dogan/",
    pageUrl: "https://www.pexels.com/photo/captivating-view-of-wilhelmshohe-palace-with-kassel-cityscape-27579634/",
    placeKey: "kassel",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 33593210, slug: "kassel-bergpark-panorama",
    photographer: "arlindphotography", photographerUrl: "https://www.pexels.com/@arlindphotography/",
    pageUrl: "https://www.pexels.com/photo/panoramic-view-from-bergpark-wilhelmshohe-overlooking-kassel-33593210/",
    placeKey: "kassel",
  },

  // ---- Greece ----
  // Nea Fokea — Halkidiki coast.
  {
    tripFolder: "2023-07-greece-athens-halkidiki", id: 28435910, slug: "halkidiki-kalamitsi-sunrise",
    photographer: "Yassen Kounchev", photographerUrl: "https://www.pexels.com/@yassen-kounchev-889850329/",
    pageUrl: "https://www.pexels.com/photo/kalamitsi-beach-halkidiki-sunrise-28435910/",
    placeKey: "neaFokea",
  },
  // Keramoti — port to Thassos.
  {
    tripFolder: "2022-07-greece", id: 19203217, slug: "keramoti-rippled-sea",
    photographer: "didsss", photographerUrl: "https://www.pexels.com/@didsss/",
    pageUrl: "https://www.pexels.com/photo/serene-rippled-ocean-texture-keramoti-greece-19203217/",
    placeKey: "keramoti",
  },
  // Athens — Acropolis / Plaka.
  {
    tripFolder: "2023-07-greece-athens-halkidiki", id: 6924329, slug: "athens-erechtheion-caryatids",
    photographer: "Mohammed Zar", photographerUrl: "https://www.pexels.com/@mohammed-zar-3861716/",
    pageUrl: "https://www.pexels.com/photo/erechtheion-temple-with-caryatids-in-acropolis-athens-6924329/",
    placeKey: "athens",
  },
  {
    tripFolder: "2023-07-greece-athens-halkidiki", id: 28601862, slug: "athens-parthenon-unesco",
    photographer: "Efrem Efre", photographerUrl: "https://www.pexels.com/@efrem-efre-2786187/",
    pageUrl: "https://www.pexels.com/photo/stunning-view-of-the-parthenon-a-unesco-world-heritage-site-28601862/",
    placeKey: "athens",
  },
  {
    tripFolder: "2023-07-greece-athens-halkidiki", id: 27695784, slug: "athens-plaka-quaint-street",
    photographer: "Zikos", photographerUrl: "https://www.pexels.com/@zikos/",
    pageUrl: "https://www.pexels.com/photo/quaint-street-in-athens-plaka-neighborhood-27695784/",
    placeKey: "athens",
  },
  // Thassos — already 2; need 3 more.
  {
    tripFolder: "2022-07-greece", id: 28498153, slug: "thassos-golden-beach-aqua",
    photographer: "Artiom Petrachi", photographerUrl: "https://www.pexels.com/@artiom-petrachi-1825232739/",
    pageUrl: "https://www.pexels.com/photo/pristine-aqua-beach-golden-beach-thassos-28498153/",
    placeKey: "thassos",
  },
  {
    tripFolder: "2022-07-greece", id: 10505163, slug: "thassos-chrisi-ammoudia",
    photographer: "Igor Ermurachi", photographerUrl: "https://www.pexels.com/@igor-ermurachi-56590/",
    pageUrl: "https://www.pexels.com/photo/chrisi-ammoudia-beach-greece-turquoise-waters-10505163/",
    placeKey: "thassos",
  },
  {
    tripFolder: "2022-07-greece", id: 33023678, slug: "thassos-rocky-shore-blue",
    photographer: "Daciana Cristina Visan", photographerUrl: "https://www.pexels.com/@daciana-cristina-visan-2149801141/",
    pageUrl: "https://www.pexels.com/photo/idyllic-beach-scene-in-thassos-greece-33023678/",
    placeKey: "thassos",
  },
  // Nafplio — already 1; need 4 more.
  {
    tripFolder: "2022-07-greece", id: 32138690, slug: "nafplio-bourtzi-castle-harbor",
    photographer: "Adrien Olichon", photographerUrl: "https://www.pexels.com/@adrien-olichon-1257089/",
    pageUrl: "https://www.pexels.com/photo/breathtaking-view-of-nafplio-harbor-with-bourtzi-castle-32138690/",
    placeKey: "nafplio",
  },
  {
    tripFolder: "2022-07-greece", id: 18835693, slug: "nafplio-palamidi-arched-window",
    photographer: "Tatiana Lapa", photographerUrl: "https://www.pexels.com/@tatiana-lapa-114875724/",
    pageUrl: "https://www.pexels.com/photo/nafplio-from-arched-window-of-palamidi-fortress-18835693/",
    placeKey: "nafplio",
  },
  {
    tripFolder: "2022-07-greece", id: 17098083, slug: "nafplio-stone-archway-coast",
    photographer: "Alexandros Milidakis", photographerUrl: "https://www.pexels.com/@alexandros-milidakis-559640413/",
    pageUrl: "https://www.pexels.com/photo/captivating-view-of-nafplio-town-and-coast-17098083/",
    placeKey: "nafplio",
  },
  {
    tripFolder: "2022-07-greece", id: 10400151, slug: "nafplio-aerial-coastal-town",
    photographer: "Alexandros Papadopoulos", photographerUrl: "https://www.pexels.com/@alexandros-papadopoulos-144473958/",
    pageUrl: "https://www.pexels.com/photo/scenic-aerial-view-of-nafplio-10400151/",
    placeKey: "nafplio",
  },
  // Abdera — Pexels has no Abdera-specific shots; use neighboring Thracian coast / Kavala (port nearest Ancient Abdera).
  {
    tripFolder: "2022-07-greece", id: 10163045, slug: "kavala-aqueduct-sunset",
    photographer: "Marina Gr", photographerUrl: "https://www.pexels.com/@marina-gr-109305987/",
    pageUrl: "https://www.pexels.com/photo/historic-stone-aqueduct-and-town-buildings-at-sunset-10163045/",
    placeKey: "abdera",
  },
  {
    tripFolder: "2022-07-greece", id: 11247205, slug: "kavala-aerial-coastline",
    photographer: "Marina Gr", photographerUrl: "https://www.pexels.com/@marina-gr-109305987/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-kavalas-urban-landscape-11247205/",
    placeKey: "abdera",
  },
  {
    tripFolder: "2022-07-greece", id: 33516844, slug: "xanthi-mountaintop-view",
    photographer: "kryonoglou", photographerUrl: "https://www.pexels.com/@kryonoglou/",
    pageUrl: "https://www.pexels.com/photo/elevated-view-of-xanthi-city-from-a-mountaintop-33516844/",
    placeKey: "abdera",
  },
  {
    tripFolder: "2022-07-greece", id: 29072782, slug: "kavala-harbor-cityscape-dusk",
    photographer: "sevgiilale", photographerUrl: "https://www.pexels.com/@sevgiilale/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-kavala-harbor-and-cityscape-at-dusk-29072782/",
    placeKey: "abdera",
  },

  // ---- Hungary ----
  // Budapest — already 4; need 1 more.
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 36556205, slug: "budapest-parliament-illuminated",
    photographer: "Balazs Nemes", photographerUrl: "https://www.pexels.com/@balazs-nemes-36556205/",
    pageUrl: "https://www.pexels.com/photo/illuminated-hungarian-parliament-building-at-night-36556205/",
    placeKey: "budapest",
  },
  // Gyula — Pexels has no further Gyula-specific shots; use Hungarian-puszta scenery
  // (consistent with existing Gyula stand-ins of grey cattle pasture).
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 27037558, slug: "gyula-puszta-csikos-horsemen",
    photographer: "Stokeron", photographerUrl: "https://www.pexels.com/@stokeron/",
    pageUrl: "https://www.pexels.com/photo/hungarian-horsemen-traditional-blue-clothing-rural-27037558/",
    placeKey: "gyula",
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 19567427, slug: "gyula-hortobagy-haystacks-summer",
    photographer: "Zsolt Erdelyi", photographerUrl: "https://www.pexels.com/@zsolt-erdelyi-852628585/",
    pageUrl: "https://www.pexels.com/photo/haystacks-hortobagy-hungary-countryside-19567427/",
    placeKey: "gyula",
  },

  // Kecskemét — Pexels has no Cifrapalota / town-square shots; use Great-Plain scenery
  // (Kecskemét is the seat of Bács-Kiskun county on the Hungarian Great Plain).
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 27024356, slug: "kecskemet-puszta-cattle-grazing",
    photographer: "Stokeron", photographerUrl: "https://www.pexels.com/@stokeron/",
    pageUrl: "https://www.pexels.com/photo/cattle-with-horns-grazing-sunlit-rural-pasture-27024356/",
    placeKey: "kecskemet",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 27024359, slug: "kecskemet-puszta-donkeys-pond",
    photographer: "Stokeron", photographerUrl: "https://www.pexels.com/@stokeron/",
    pageUrl: "https://www.pexels.com/photo/donkeys-grazing-rural-farm-landscape-27024359/",
    placeKey: "kecskemet",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 13456593, slug: "kecskemet-great-plain-aerial-fields",
    photographer: "Barnabas Davoti", photographerUrl: "https://www.pexels.com/@barnabas-davoti-31615494/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-green-fields-farmland-13456593/",
    placeKey: "kecskemet",
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 5840898, slug: "kecskemet-hungarian-grey-pair",
    photographer: "Karola G", photographerUrl: "https://www.pexels.com/@karola-g/",
    pageUrl: "https://www.pexels.com/photo/two-hungarian-grey-cattle-green-pasture-5840898/",
    placeKey: "kecskemet",
  },

  // ---- Poland ----
  // Oświęcim — already 4; need 1 more.
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 13081553, slug: "oswiecim-auschwitz-entrance-warning",
    photographer: "Rene Terp", photographerUrl: "https://www.pexels.com/@reneterp/",
    pageUrl: "https://www.pexels.com/photo/entrance-to-auschwitz-concentration-camp-13081553/",
    placeKey: "oswiecim",
  },
  // Zakopane — already 4; need 1 more.
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 9181193, slug: "zakopane-tatra-wildflowers",
    photographer: "Karol Zielinski", photographerUrl: "https://www.pexels.com/@karol-zielinski-92378908/",
    pageUrl: "https://www.pexels.com/photo/tatra-mountains-with-wildflowers-9181193/",
    placeKey: "zakopane",
  },
  // Murzasichle — already 3; need 2 more.
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 11029916, slug: "murzasichle-morskie-oko-tatra-reflection",
    photographer: "Maryia Plashchynskaya", photographerUrl: "https://www.pexels.com/@maryiaplashchynskaya/",
    pageUrl: "https://www.pexels.com/photo/dramatic-tatra-mountains-morskie-oko-11029916/",
    placeKey: "murzasichle",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 11029904, slug: "murzasichle-tatra-forest-snow-peaks",
    photographer: "Maryia Plashchynskaya", photographerUrl: "https://www.pexels.com/@maryiaplashchynskaya/",
    pageUrl: "https://www.pexels.com/photo/tatra-mountains-lush-forests-snowy-peaks-11029904/",
    placeKey: "murzasichle",
  },
  // Brzegi — already 3; need 2 more. Tatra valley.
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 21837391, slug: "brzegi-tatra-village-fields",
    photographer: "Valeriy Pelts", photographerUrl: "https://www.pexels.com/@valeriy-pelts-939887181/",
    pageUrl: "https://www.pexels.com/photo/picturesque-village-houses-amidst-fields-mountains-poland-21837391/",
    placeKey: "brzegi",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 19550182, slug: "brzegi-bukowina-autumn-mountains",
    photographer: "Dariusz Staniszewski", photographerUrl: "https://www.pexels.com/@dariusz-staniszewski-1425290/",
    pageUrl: "https://www.pexels.com/photo/vibrant-autumn-foliage-bukowina-tatrzanska-19550182/",
    placeKey: "brzegi",
  },
  // Brzezinka — already 3; need 2 more. (Polish name for Birkenau — same Auschwitz-Birkenau site.)
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 35743059, slug: "brzezinka-auschwitz-birkenau-tracks",
    photographer: "Lumina Voyager", photographerUrl: "https://www.pexels.com/@lumina-voyager-147015704/",
    pageUrl: "https://www.pexels.com/photo/railroad-tracks-leading-to-auschwitz-birkenau-35743059/",
    placeKey: "brzezinka",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 22816214, slug: "brzezinka-birkenau-wagon-watchtower",
    photographer: "Algrey", photographerUrl: "https://www.pexels.com/@algrey/",
    pageUrl: "https://www.pexels.com/photo/wooden-train-wagon-watchtowers-auschwitz-birkenau-22816214/",
    placeKey: "brzezinka",
  },
  // Katowice — already 1; need 4 more.
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 30696550, slug: "katowice-spodek-arena-event",
    photographer: "Filip Hajdoci", photographerUrl: "https://www.pexels.com/@filip-hajdoci-355268404/",
    pageUrl: "https://www.pexels.com/photo/spodek-arena-katowice-esports-event-30696550/",
    placeKey: "katowice",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 37144894, slug: "katowice-spodek-puddle-reflection",
    photographer: "Dawid Zawila", photographerUrl: "https://www.pexels.com/@dawid-zawila-2151273316/",
    pageUrl: "https://www.pexels.com/photo/spodek-arena-katowice-puddle-reflection-37144894/",
    placeKey: "katowice",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 20685089, slug: "katowice-silesian-museum-mine-shaft",
    photographer: "Bruno Krajski", photographerUrl: "https://www.pexels.com/@bruno-krajski-518872760/",
    pageUrl: "https://www.pexels.com/photo/silesian-museum-historic-mine-shaft-tower-20685089/",
    placeKey: "katowice",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 35358052, slug: "katowice-train-station-night",
    photographer: "Algrey", photographerUrl: "https://www.pexels.com/@algrey/",
    pageUrl: "https://www.pexels.com/photo/moody-night-view-platform-katowice-train-station-35358052/",
    placeKey: "katowice",
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
  const url = `https://images.pexels.com/photos/${pick.id}/pexels-photo-${pick.id}.jpeg?auto=compress&cs=tinysrgb&w=1920`;
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
    const sz = statSync(abs).size;
    return { pick, rel, abs, file, bytes: sz, skipped: true };
  }

  const raw = await downloadImage(pick);
  const out = await sharp(raw)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(abs, out);
  console.log(`  [ok] ${rel} (${(out.length / 1024).toFixed(0)} KB)`);
  return { pick, rel, abs, file, bytes: out.length };
}

const results = [];
for (const pick of PICKS) {
  try {
    results.push(await processOne(pick));
  } catch (err) {
    console.error(`  [fail] ${pick.slug} (${pick.id}): ${err.message}`);
    results.push({ pick, error: err.message });
  }
}

const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  if (r.error) continue;
  if (existingSrc.has(r.rel)) continue;
  const placeData = PLACES[r.pick.placeKey];
  const takenAt = TRIP_MID[r.pick.tripFolder] || null;
  const entry = {
    src: r.rel,
    takenAt,
    hasGps: false,
    place: placeData.place,
    source: {
      type: "stock",
      provider: "Pexels",
      url: r.pick.pageUrl,
      photographer: r.pick.photographer,
      photographerUrl: r.pick.photographerUrl,
      license: PEXELS_LICENSE,
      licenseUrl: PEXELS_LICENSE_URL,
    },
  };
  if (placeData.gps) entry.gps = placeData.gps;
  newEntries.push(entry);
}

const merged = [...catalogue, ...newEntries];
merged.sort((a, b) => (a.takenAt || "").localeCompare(b.takenAt || ""));
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${newEntries.length} catalogue entries.`);

// Update photo-attributions.md (insert before "## License terms").
const attribPath = join(repoRoot, "docs", "photo-attributions.md");
const attribRaw = readFileSync(attribPath, "utf8");
const lines = attribRaw.split("\n");
const licenseHeaderIdx = lines.findIndex((l) => l.startsWith("## License terms"));
let lastRowIdx = licenseHeaderIdx - 1;
while (lastRowIdx > 0 && !lines[lastRowIdx].startsWith("|")) lastRowIdx--;

const newRows = [];
for (const r of results) {
  if (r.error) continue;
  if (existingSrc.has(r.rel)) continue;
  newRows.push(
    `| \`public/photos/${r.rel}\` | ${PLACES[r.pick.placeKey].place.display} | [${r.pick.photographer}](${r.pick.photographerUrl}) | Pexels | [link](${r.pick.pageUrl}) |`,
  );
}

let totalIdx = lines.length - 1;
while (totalIdx >= 0 && !lines[totalIdx].startsWith("Total stock photos:")) totalIdx--;

const updatedLines = [
  ...lines.slice(0, lastRowIdx + 1),
  ...newRows,
  ...lines.slice(lastRowIdx + 1, totalIdx === -1 ? lines.length : totalIdx),
];
if (totalIdx !== -1) {
  // Recount stock by scanning catalogue post-merge.
  const newTotal = merged.filter((e) => e.source?.type === "stock").length;
  updatedLines.push(`Total stock photos: ${newTotal}`);
  updatedLines.push("");
}

writeFileSync(attribPath, updatedLines.join("\n"), "utf8");
console.log(`Appended ${newRows.length} attribution rows.`);

const summary = {
  imported: newEntries.length,
  failed: results.filter((r) => r.error).length,
  skipped: results.filter((r) => r.skipped).length,
  byCity: {},
};
for (const r of results) {
  if (r.error) continue;
  const city = PLACES[r.pick.placeKey].place.city;
  summary.byCity[city] = (summary.byCity[city] || 0) + 1;
}
writeFileSync(
  join(__dirname, "apply-pexels-results.json"),
  JSON.stringify({ summary, results }, null, 2),
  "utf8",
);
console.log("\nSummary:", JSON.stringify(summary, null, 2));
