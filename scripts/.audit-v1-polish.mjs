// Pre-deploy audit for v1 content polish
// (qa/v1-polish-consistency)

import fs from "node:fs";
import path from "node:path";

const cat = JSON.parse(fs.readFileSync("scripts/photo-catalogue.json", "utf8"));
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const da = JSON.parse(fs.readFileSync("messages/da.json", "utf8"));

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + "." + k : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}
const enFlat = flatten(en);
const daFlat = flatten(da);
const enKeys = new Set(Object.keys(enFlat));
const daKeys = new Set(Object.keys(daFlat));

// ---- A. Per-city counts ----
const cityCounts = new Map();
for (const item of cat) {
  if (!item.place || !item.place.city || !item.place.country) continue;
  const key = item.place.country + "|" + item.place.city;
  cityCounts.set(key, (cityCounts.get(key) || 0) + 1);
}
const undersizedCities = [...cityCounts.entries()]
  .filter(([, n]) => n < 5)
  .map(([k, n]) => ({ key: k, count: n }))
  .sort((a, b) => a.count - b.count || a.key.localeCompare(b.key));

// ---- Replicate clusterTrips (gap=5d, country split) ----
const MAX_GAP_DAYS = 5;
function pad2(n) {
  return n.toString().padStart(2, "0");
}
function slugifyCountry(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
const usable = [];
for (const e of cat) {
  if (!e.takenAt) continue;
  if (!e.hasGps || !e.gps) continue;
  if (!e.place || !e.place.country) continue;
  usable.push({
    src: e.src,
    takenAt: e.takenAt,
    city: e.place.city,
    country: e.place.country,
  });
}
usable.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
const clusters = [];
const dayMs = 86400000;
for (const photo of usable) {
  const last = clusters[clusters.length - 1];
  const gap = last
    ? (Date.parse(photo.takenAt) -
        Date.parse(last.photos[last.photos.length - 1].takenAt)) /
      dayMs
    : 0;
  if (!last || last.country !== photo.country || gap > MAX_GAP_DAYS) {
    clusters.push({ country: photo.country, photos: [photo] });
  } else {
    last.photos.push(photo);
  }
}
const drafts = clusters.map((c) => {
  const startD = new Date(c.photos[0].takenAt);
  const baseSlug =
    slugifyCountry(c.country) +
    "-" +
    startD.getUTCFullYear() +
    "-" +
    pad2(startD.getUTCMonth() + 1);
  return { baseSlug, country: c.country, photos: c.photos };
});
drafts.sort((a, b) =>
  a.photos[0].takenAt.localeCompare(b.photos[0].takenAt),
);
const occurrences = new Map();
const trips = drafts.map((d) => {
  const prev = occurrences.get(d.baseSlug) || 0;
  occurrences.set(d.baseSlug, prev + 1);
  const slug = prev === 0 ? d.baseSlug : d.baseSlug + "-" + (prev + 1);
  return { slug, country: d.country, photos: d.photos };
});

// ---- B. Per-trip city sub-section counts ----
const tripCityCounts = []; // { slug, citySections: [{ city, count, sparse }] }
for (const t of trips) {
  const map = new Map();
  for (const p of t.photos) {
    if (!p.city) continue;
    map.set(p.city, (map.get(p.city) || 0) + 1);
  }
  const sections = [...map.entries()].map(([city, count]) => ({
    city,
    count,
    sparse: count < 3,
  }));
  tripCityCounts.push({
    slug: t.slug,
    country: t.country,
    photoCount: t.photos.length,
    sections,
  });
}
const sparseSections = tripCityCounts
  .flatMap((tr) =>
    tr.sections
      .filter((s) => s.sparse)
      .map((s) => ({ slug: tr.slug, city: s.city, count: s.count })),
  )
  .sort((a, b) => a.count - b.count || a.slug.localeCompare(b.slug));

// ---- C. City order consistency (per-trip vs country card derivation) ----
// Replicate deriveCitiesByCountry (photoCount desc, alphabetical tie-break).
const countryAgg = new Map();
for (const item of cat) {
  const country = item.place && item.place.country;
  if (!country) continue;
  let agg = countryAgg.get(country);
  if (!agg) {
    agg = { country, cities: new Map(), photoCount: 0 };
    countryAgg.set(country, agg);
  }
  agg.photoCount += 1;
  const city = item.place && item.place.city;
  if (!city) continue;
  let cb = agg.cities.get(city);
  if (!cb) {
    cb = { name: city, photoCount: 0 };
    agg.cities.set(city, cb);
  }
  cb.photoCount += 1;
}
const countryCardOrder = new Map(); // country -> [city,...]
for (const agg of countryAgg.values()) {
  const ordered = [...agg.cities.values()]
    .sort((a, b) => {
      if (b.photoCount !== a.photoCount) return b.photoCount - a.photoCount;
      return a.name.localeCompare(b.name);
    })
    .map((c) => c.name);
  countryCardOrder.set(agg.country, ordered);
}
// For every trip, the per-trip page sorts its cities by the country
// card order (with leftovers alphabetised at the end). This is by
// construction; but we still verify that every city present in a trip
// is present in the country's card order.
const orderIssues = [];
for (const tr of tripCityCounts) {
  const order = countryCardOrder.get(tr.country) || [];
  for (const s of tr.sections) {
    if (!order.includes(s.city)) {
      orderIssues.push({
        slug: tr.slug,
        country: tr.country,
        missingFromCard: s.city,
      });
    }
  }
}

// ---- F. i18n parity & resolution ----
function walkSrc(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walkSrc(p, files);
    else if (/\.(ts|tsx|js|jsx)$/.test(f) && !/\.test\.(ts|tsx)$/.test(f))
      files.push(p);
  }
  return files;
}
const srcFiles = walkSrc("src");
const missing = new Set();
// Track all distinct namespaces a binding is bound to in a file (since
// the same binding `t` may be re-bound to different namespaces in
// nested function components), plus whether it was ever bound to root.
const NS_RE = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:get|use)Translations\(\s*(?:["']([^"']+)["'])?\s*\)/g;
function check(full) {
  const hasSubKeys = [...enKeys].some((k) => k.startsWith(full + "."));
  const okEn = enKeys.has(full) || hasSubKeys;
  const hasSubKeysDa = [...daKeys].some((k) => k.startsWith(full + "."));
  const okDa = daKeys.has(full) || hasSubKeysDa;
  return { okEn, okDa };
}
for (const file of srcFiles) {
  const code = fs.readFileSync(file, "utf8");
  const nsMap = {}; // binding -> Set of namespaces (empty string = root)
  let m;
  while ((m = NS_RE.exec(code)) !== null) {
    const b = m[1];
    const ns = m[2] || "";
    if (!nsMap[b]) nsMap[b] = new Set();
    nsMap[b].add(ns);
  }
  for (const [binding, namespaces] of Object.entries(nsMap)) {
    const callRe = new RegExp(
      "\\b" +
        binding +
        '(?:\\.(?:raw|rich))?\\(\\s*["\']([^"\']+)["\']',
      "g",
    );
    while ((m = callRe.exec(code)) !== null) {
      const key = m[1];
      // The key resolves if ANY of the bindings' namespaces accept it
      // (root: prefix is empty, so use just `key`; otherwise `ns.key`).
      let okEnAny = false;
      let okDaAny = false;
      let firstFull = "";
      for (const ns of namespaces) {
        const full = ns ? ns + "." + key : key;
        if (!firstFull) firstFull = full;
        const r = check(full);
        if (r.okEn) okEnAny = true;
        if (r.okDa) okDaAny = true;
      }
      if (!okEnAny)
        missing.add(`EN:${firstFull}::${path.relative(".", file).replace(/\\/g, "/")}`);
      if (!okDaAny)
        missing.add(`DA:${firstFull}::${path.relative(".", file).replace(/\\/g, "/")}`);
    }
  }
}
const missingArr = [...missing].sort();
const enOnly = [...enKeys].filter((k) => !daKeys.has(k));
const daOnly = [...daKeys].filter((k) => !enKeys.has(k));

// ---- Summary ----
const out = {
  cityCount: {
    total: cityCounts.size,
    undersized: undersizedCities,
  },
  trips: tripCityCounts,
  sparseSections,
  orderIssues,
  i18n: {
    enKeys: enKeys.size,
    daKeys: daKeys.size,
    enOnly,
    daOnly,
    missing: missingArr,
  },
};
fs.writeFileSync(".audit-v1-polish.json", JSON.stringify(out, null, 2));
console.log("CITIES <5:", undersizedCities.length, "/", cityCounts.size);
console.log("TRIPS:", trips.length);
console.log("SPARSE CITY SECTIONS (<3):", sparseSections.length);
console.log("ORDER ISSUES:", orderIssues.length);
console.log(
  "I18N PARITY: en=",
  enKeys.size,
  "da=",
  daKeys.size,
  "enOnly=",
  enOnly.length,
  "daOnly=",
  daOnly.length,
);
console.log("MISSING I18N KEY USAGES:", missingArr.length);
