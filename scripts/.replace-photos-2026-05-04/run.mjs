#!/usr/bin/env node
// One-shot script — replaces 14 specific photos across 7 city albums
// with fresh Pexels stock. Removes the targeted catalogue entries
// (and their files), downloads + optimises new Pexels picks, appends
// catalogue entries, and rewrites docs/photo-attributions.md.
//
// Usage: PEXELS_API_KEY=... node scripts/.replace-photos-2026-05-04/run.mjs
//
// Idempotency: re-running after success is a no-op for entries already
// present in the catalogue under the new src. Safe to abort mid-run.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CATALOGUE_PATH = path.join(ROOT, 'scripts/photo-catalogue.json');
const PHOTOS_DIR = path.join(ROOT, 'public/photos');
const ATTRIB_DOC = path.join(ROOT, 'docs/photo-attributions.md');

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error('PEXELS_API_KEY env var required');
  process.exit(1);
}

// city → metadata for new Pexels lookups
const CITY_META = {
  Gyula:                { slug: 'gyula',           folder: 'trips/2024-08-hungary-roadtrip', country: 'Hungary', gps: { lat: 46.6486, lon: 21.2828  }, takenAt: '2024-08-15T12:00:00Z', month: 'August 2024' },
  Haifa:                { slug: 'haifa',           folder: 'trips/2018-03-israel',          country: 'Israel',  gps: { lat: 32.794,  lon: 34.9896  }, takenAt: '2018-03-15T12:00:00Z', month: 'March 2018'  },
  Azuga:                { slug: 'azuga',           folder: 'trips/2023-08-romania',         country: 'Romania', gps: { lat: 45.51238, lon: 25.57258 }, takenAt: '2023-08-27T12:00:00Z', month: 'August 2023' },
  'Bușteni':            { slug: 'busteni',         folder: 'trips/2023-08-romania',         country: 'Romania', gps: { lat: 45.38387, lon: 25.5428  }, takenAt: '2023-08-25T12:00:00Z', month: 'August 2023' },
  Avrig:                { slug: 'avrig',           folder: 'trips/2023-08-romania',         country: 'Romania', gps: { lat: 45.67459, lon: 24.46111 }, takenAt: '2023-08-28T12:00:00Z', month: 'August 2023' },
  'Sfântu Gheorghe':    { slug: 'sfantu-gheorghe', folder: 'trips/2019-01-romania',         country: 'Romania', gps: { lat: 45.8636,  lon: 25.7889  }, takenAt: '2019-01-12T12:00:00Z', month: 'January 2019'},
  Turda:                { slug: 'turda',           folder: 'trips/2023-08-romania',         country: 'Romania', gps: { lat: 46.58761, lon: 23.78716 }, takenAt: '2023-08-29T12:00:00Z', month: 'August 2023' },
};

// Target removals — the exact `src` values to drop from the catalogue
// and delete from disk. Order = display order = the "Nth" the user
// referenced.
// `altBlock`: substrings that disqualify a Pexels result whose `alt`
// or `url` claims a different town/landmark. Pexels search is loose
// — a query for "Sfantu Gheorghe" returns Sibiu shots, "Busteni"
// returns Peles Castle (in Sinaia, not Bușteni), etc. Without the
// blocklist the gallery would mislabel real landmarks of other towns
// as belonging to the album city.
//
// `altRequire`: at least one of these substrings must be present in
// alt+url (lowercased). Used for cities where Pexels has so much
// noise that we'd rather take fewer hits but on-topic.
const REPLACEMENTS = [
  {
    city: 'Gyula',
    remove: ['trips/2024-08-hungary-roadtrip/pexels-gyula-a-historic-riverside-castle-stands-prominently-aga-30831684.jpg'],
    // Pexels has zero on-location Gyula photos. Existing 4 catalogue
    // entries are themselves regional fallbacks (Sümeg-castle,
    // Szechenyi-bath-Budapest…) — accept the same pattern: pick a
    // generic Hungarian rural/lowland scene that doesn't claim a
    // specific famous landmark elsewhere.
    queries: ['Hungarian countryside lowland', 'Hungarian village summer', 'Hungary rural landscape', 'Hungary Great Plain puszta', 'Hungary historic small town'],
    altBlock: ['budapest', 'szechenyi', 'balaton', 'szeged', 'eger', 'pecs', 'debrecen', 'sumeg', 'sümeg', 'visegrad', 'esztergom', 'tokaj', 'szentendre', 'sopron', 'gyor', 'miskolc', 'kecskemet', 'hortobagy', 'matthias church', 'fisherman', 'parliament'],
  },
  {
    city: 'Haifa',
    remove: ['trips/2018-03-israel/pexels-haifa-bahai-port-aerial-17291340.jpg'],
    // Existing album already has 2 Bahai-Gardens shots; user wanted
    // variety, not another Bahai frame. Block 'bahai' too.
    queries: ['Haifa downtown', 'Haifa Carmel mountain', 'Haifa Stella Maris monastery', 'Haifa German Colony Templar', 'Haifa port industrial'],
    altBlock: ['tel aviv', 'jerusalem', 'galilee', 'eilat', 'rosh hanikra', 'petah tikva', 'jaffa', 'acre', 'akko', 'bahai', 'baha\'i', "baha'i"],
    altRequire: ['haifa'],
  },
  // Azuga 7-10. Azuga is a small ski-resort town below Bucegi.
  // Generic Carpathian / pine-forest / snowy-mountain stock works
  // here — visitors don't expect a specific landmark.
  {
    city: 'Azuga',
    remove: [
      'trips/2023-08-romania/IMG20230827134002.jpg',
      'trips/2023-08-romania/IMG20230827135911.jpg',
      'trips/2023-08-romania/IMG20230827142353.jpg',
      'trips/2023-08-romania/IMG20230827193647.jpg',
    ],
    queries: ['Bucegi mountains Romania', 'Carpathian forest Romania snow', 'Romania mountain village', 'Romanian alpine landscape', 'Prahova valley Romania'],
    altBlock: ['predeal', 'parang', 'sinaia', 'peles', 'brasov city', 'bucharest', 'cluj', 'transfagarasan', 'sibiu', 'austria', 'germany', 'switzerland', 'turkey', 'rize'],
  },
  // Bușteni positions 4, 6, 8. Same regional approach — visitors
  // expect Bucegi / Carpathian imagery. Castle queries kept turning
  // up Peles (Sinaia) and Bran, both wrong towns.
  {
    city: 'Bușteni',
    remove: [
      'trips/2022-08-romania/pexels-busteni-breathtaking-landscape-of-the-carpathian-mountains-8496599.jpg',
      'trips/2023-08-romania/IMG20230825101826.jpg',
      'trips/2023-08-romania/pexels-busteni-bucegi-mountain-panorama-19755730.jpg',
    ],
    queries: ['Bucegi mountains Romania', 'Caraiman cross Bucegi', 'Sphinx Bucegi Romania', 'Romanian Carpathian peaks', 'Romanian alpine meadow'],
    altBlock: ['peles', 'sinaia', 'pelesh', 'predeal', 'brasov city', 'bran castle', 'dracula', 'sibiu', 'austria', 'germany', 'switzerland', 'turkey', 'rize', 'schloss', 'hernstein', 'norway', 'alps'],
  },
  // Avrig pos 3 + pos 4. Avrig sits at the foot of the Făgăraș
  // mountains in Sibiu county. Use Făgăraș-massif imagery.
  {
    city: 'Avrig',
    remove: [
      'trips/2023-08-romania/IMG20230828230757.jpg',
      'trips/2023-08-romania/IMG20230828231350.jpg',
    ],
    queries: ['Fagaras mountains Romania', 'Transfagarasan road Romania', 'Romania alpine lake', 'Olt river valley Romania'],
    altBlock: ['iasi', 'iași', 'lasi', 'sibiu', 'brasov city', 'cluj', 'bucharest', 'palace of culture', 'austria', 'germany', 'switzerland', 'norway', 'alps', 'dolomites'],
  },
  // Sfântu Gheorghe pos 3 (own) + pos 5 (close-up church stock).
  // Region: Covasna county, Eastern Carpathians, Szekely heritage.
  {
    city: 'Sfântu Gheorghe',
    remove: [
      'trips/2019-01-romania/IMG_20190112_154250.jpg',
      'trips/2019-01-romania/pexels-sfantu-gheorghe-close-up-view-of-an-orthodox-church-with-intricate-35425590.jpg',
    ],
    queries: ['Eastern Carpathians Romania snow', 'Romania winter village snow', 'Romania snowy church', 'Transylvania snow landscape'],
    altBlock: ['sibiu', 'brasov city', 'cluj', 'bucharest', 'iasi', 'sighisoara', 'dracula', 'cisnadioara', 'cisnădioara', 'austria', 'germany', 'switzerland', 'norway', 'alps', 'iceland', 'finland'],
  },
  // Turda pos 2.
  {
    city: 'Turda',
    remove: ['trips/2023-08-romania/IMG20230829134925.jpg'],
    queries: ['Salina Turda salt mine Romania', 'Cheile Turzii gorge Romania', 'Turda gorge Romania'],
    altBlock: ['sibiu', 'brasov city', 'bucharest', 'cluj-napoca old town', 'austria'],
  },
];

// ---------------------------------------------------------------- helpers

async function pexelsSearch(query) {
  const u = new URL('https://api.pexels.com/v1/search');
  u.searchParams.set('query', query);
  u.searchParams.set('per_page', '20');
  u.searchParams.set('orientation', 'landscape');
  const res = await fetch(u, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`Pexels search failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.photos ?? [];
}

function deriveDescriptor(alt, citySlug) {
  // Pexels alt text tends to be a sentence; turn it into a short
  // hyphenated descriptor (~5-6 words), strip the city slug if
  // duplicated, and keep ASCII only.
  const base = (alt ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w && w !== citySlug)
    .slice(0, 6)
    .join('-');
  return base || 'view';
}

function captionFor(descriptor, city, country, month) {
  const human = descriptor
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `${human} · ${city}, ${country} · ${month}`;
}

async function downloadAndOptimise(photo, destAbs) {
  const url = photo.src?.large2x ?? photo.src?.original;
  if (!url) throw new Error(`no usable src for photo ${photo.id}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .withMetadata({ exif: {} })
    .toFile(destAbs);
}

async function rmIfExists(p) {
  try { await fs.rm(p); console.log('  - removed file:', path.relative(ROOT, p)); }
  catch (e) { if (e.code !== 'ENOENT') throw e; console.log('  - file already gone:', path.relative(ROOT, p)); }
}

// ---------------------------------------------------------------- main

async function main() {
  const raw = await fs.readFile(CATALOGUE_PATH, 'utf-8');
  const items = JSON.parse(raw);
  const usedIds = new Set();
  for (const it of items) {
    const m = it.source?.url?.match(/(\d+)\/?$/);
    if (m) usedIds.add(m[1]);
  }

  // Walk in order; for each plan, remove the listed entries then add N new picks.
  const additions = []; // { entry, destAbs }
  const removals = []; // src strings
  const attribTouches = new Set(); // city slugs that need attribution doc refresh

  for (const plan of REPLACEMENTS) {
    const meta = CITY_META[plan.city];
    if (!meta) throw new Error(`no CITY_META for ${plan.city}`);
    const removeCount = plan.remove.length;
    console.log(`\n[${plan.city}] need ${removeCount} replacement${removeCount === 1 ? '' : 's'}`);

    // Pull candidates from each query in turn until we have enough fresh
    // photos. We filter on alt + url (the page slug often reveals the
    // real location even when alt is generic), and optionally require
    // at least one allowlisted substring for cities where Pexels noise
    // is so high that we'd rather take fewer matches but on-topic.
    const picked = [];
    const block = (plan.altBlock ?? []).map((s) => s.toLowerCase());
    const require_ = (plan.altRequire ?? []).map((s) => s.toLowerCase());
    for (const q of plan.queries) {
      if (picked.length >= removeCount) break;
      console.log(`  · search: "${q}"`);
      const photos = await pexelsSearch(q);
      for (const p of photos) {
        if (picked.length >= removeCount) break;
        const idStr = String(p.id);
        if (usedIds.has(idStr)) continue;
        const haystack = `${p.alt ?? ''} ${p.url ?? ''}`.toLowerCase();
        const blocked = block.find((b) => haystack.includes(b));
        if (blocked) {
          console.log(`    × skip ${idStr} — has "${blocked}": ${p.url}`);
          continue;
        }
        if (require_.length > 0 && !require_.some((r) => haystack.includes(r))) {
          console.log(`    × skip ${idStr} — none of [${require_.join(',')}] in ${p.url}`);
          continue;
        }
        usedIds.add(idStr);
        picked.push(p);
      }
    }
    if (picked.length < removeCount) {
      throw new Error(`Only found ${picked.length} fresh Pexels photos for ${plan.city}; need ${removeCount}`);
    }

    // For each removal, queue the file delete + catalogue removal, and
    // mint a new entry. Use the same folder as the entry being replaced
    // so the trip slug groupings stay coherent.
    for (let i = 0; i < removeCount; i++) {
      const oldSrc = plan.remove[i];
      const oldFolder = oldSrc.split('/').slice(0, 2).join('/');
      const photo = picked[i];
      const descriptor = deriveDescriptor(photo.alt, meta.slug);
      const filename = `pexels-${meta.slug}-${descriptor}-${photo.id}.jpg`;
      const newSrc = `${oldFolder}/${filename}`;
      const destAbs = path.join(PHOTOS_DIR, newSrc);
      removals.push(oldSrc);
      additions.push({
        entry: {
          src: newSrc,
          takenAt: meta.takenAt,
          hasGps: true,
          cameraModel: 'Pexels stock',
          gps: meta.gps,
          place: { city: plan.city, country: meta.country, display: `${plan.city}, ${meta.country}` },
          stock: true,
          source: {
            type: 'stock',
            provider: 'Pexels',
            url: photo.url,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            license: 'Pexels License',
            licenseUrl: 'https://www.pexels.com/license/',
          },
          caption: captionFor(descriptor, plan.city, meta.country, meta.month),
        },
        destAbs,
        oldSrc,
      });
      attribTouches.add(meta.slug);
      console.log(`  ↺ ${oldSrc}\n   → ${newSrc}\n     ${photo.photographer} · ${photo.url}`);
    }
  }

  // Download new photos to disk first; if any fail we want to bail
  // before mutating the catalogue.
  console.log('\n--- downloading + optimising', additions.length, 'photos ---');
  for (const a of additions) {
    await fs.mkdir(path.dirname(a.destAbs), { recursive: true });
    await downloadAndOptimise(await pexelsGetById(a.entry.source.url), a.destAbs);
    console.log('  ✓', path.relative(ROOT, a.destAbs));
  }

  // Mutate catalogue
  const removedSet = new Set(removals);
  const next = items.filter((it) => !removedSet.has(it.src));
  for (const a of additions) next.push(a.entry);
  await fs.writeFile(CATALOGUE_PATH, JSON.stringify(next, null, 2) + '\n', 'utf-8');
  console.log('\ncatalogue: -', removals.length, '+', additions.length, '=', next.length, 'entries');

  // Delete old files
  for (const a of additions) {
    await rmIfExists(path.join(PHOTOS_DIR, a.oldSrc));
  }

  // Rewrite attribution doc from catalogue (alphabetical by file path)
  await rebuildAttributionsDoc(next);
  console.log('\nattributions doc rewritten');
}

// Helper: re-fetch the photo body via the canonical Pexels page URL we
// stored. Pexels API photo objects have `src.large2x` directly though,
// so this is just a re-fetch convenience using the photo ID parsed out
// of the `url` field.
async function pexelsGetById(pexelsPageUrl) {
  const m = pexelsPageUrl.match(/(\d+)\/?$/);
  if (!m) throw new Error(`cannot parse photo id from ${pexelsPageUrl}`);
  const id = m[1];
  const res = await fetch(`https://api.pexels.com/v1/photos/${id}`, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`pexels GET ${id} failed: ${res.status}`);
  return res.json();
}

async function rebuildAttributionsDoc(items) {
  const stocks = items
    .filter((it) => it.source?.type === 'stock')
    .sort((a, b) => a.src.localeCompare(b.src));
  const lines = [
    '# Stock photo attributions',
    '',
    'Reuse-allowed stock photographs sourced for trip-detail galleries.',
    'All entries are licensed under the [Pexels License](https://www.pexels.com/license/),',
    'which permits free commercial + non-commercial use; attribution is appreciated but',
    'not required. The portfolio nevertheless preserves attribution in',
    '`scripts/photo-catalogue.json` (`source` block) and in this document so that the',
    'lightbox / detail UI can surface photographer credit once that work lands.',
    '',
    `_Regenerated by \`scripts/.replace-photos-2026-05-04/run.mjs\` on ${new Date().toISOString().slice(0, 10)}._`,
    '',
    '| File | City | Photographer | Provider | Source URL |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const it of stocks) {
    const display = it.place?.display ?? '';
    const ph = it.source.photographer ?? '';
    const phUrl = it.source.photographerUrl ?? '';
    const url = it.source.url ?? '';
    const provider = it.source.provider ?? '';
    lines.push(
      `| \`public/photos/${it.src}\` | ${display} | [${ph}](${phUrl}) | ${provider} | [link](${url}) |`,
    );
  }
  await fs.writeFile(ATTRIB_DOC, lines.join('\n') + '\n', 'utf-8');
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
