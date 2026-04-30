/**
 * Photo Relevance Audit Fix Script
 * Removes bad/wrong photos and adds correct replacements from Pexels.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fetch } from 'undici';

const API_KEY = 'dfW5gSS00CrmUgPQraZC6rwcrybajthYnuiwzKPQtNV9XjE1NBEpTLVm';
const CATALOGUE_PATH = 'scripts/photo-catalogue.json';
const PHOTO_BASE = 'public/photos/';

let catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8'));

// Track all used Pexels IDs
const usedIds = new Set(
  catalogue
    .map(p => {
      const fromUrl = p.source?.url?.match(/photo\/(\d+)/)?.[1];
      const fromSrc = p.src?.match(/-(\d+)\.jpg$/)?.[1];
      return fromUrl || fromSrc;
    })
    .filter(Boolean)
);

console.log(`Loaded ${catalogue.length} photos, ${usedIds.size} existing Pexels IDs`);

// IDs already removed from disk (from previous partial run)
const REMOVE_IDS = new Set([
  '3085835','4963850','6312345','8423456','9963116',
  '7089012','9200123','11311234','13422345','15533456',
  '5089012','7200123','9311234','11422345','13533456',
  '5200123','7311234','9422345','11533456','13644567',
  '3201234','5312345','7423456','11645678','13756789',
  '4423456','8645678','10756789','17089012','19200123',
  '7345678','9456789','11567890','15789012','17890123',
  '4897623','10345678','16678901','18789012','20890123',
  '13089012','19422345','21533456','5787634','6787634',
  '4756789','6867890','8978901','13200123','15311234',
  '4312345','6423456','8534567','10645678','12756789',
  '7534567','9645678','11756789','13867890','18089012',
  '338515','1128418',
  '3609844','28911832','28911831','5721954','7833065',
  '34175387','18947583','12678203',
  '16517633','29106375',
  '10050027','10050028',
  '3398049','3398050','340428','13517785',
  '13262831','13262832',
  '34652724','5630916',
  '29570475',
  '34688461','13519733',
  '7019958',
  '5334300',
  '11932455',
  '32675234',
  '11247205','10163045','29072782','33516844',
  '36114859',
  '32604665','32604664','27130648',
  '27978161',
  '20741181','22618185','36277562',
  '17853892','17853910','17853891','13222849','14061226',
  '25026862','5601709','6558453',
  '6216092','6216085','6216086','6176173','11105458',
  '30621326','17010860','33402114',
  '35684347','19264990',
  '18883514','5910198','37148691','679072','9954520',
  '19944901',
  '28898473','30619583',
  '12627670',
  '34457978','34492170',
  '5840898','27024356','27024359',
  '27074971','23963002','19567427','27037558',
  '5877697',
  '15267870','11019952',
  '15267850',
  '16035584',
]);

// Danish cities to reject from search results (if photo alt mentions these, it's probably a wrong city)
const DK_CITIES = new Set([
  'aalborg','aarhus','billund','blaavand','blåvand','brande','christiansfeld',
  'copenhagen','ejby','esbjerg','fredericia','grenaa','grena','grená',
  'haderslev','herning','hirtshals','hobro','holstebro','horsens','hvide sande',
  'kolding','lemvig','middelfart','odense','randers','ribe','silkeborg','skagen',
  'skive','thorsminde','tønder','tonder','vejle','viborg','vojens','abenrå',
  'sonderborg','sønderborg','helsingør','helsingor','roskilde','frederiksberg',
  'ringkobing','ringkøbing','mariager','skanderborg','ikast','silkeborg',
]);

// City-specific blocklists: if any of these words appear in alt text, reject for target city
const CITY_BLOCKLIST = {
  'Viborg': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','tonder','tønder','silkeborg','grenaa','skagen','hirtshals','hvide sande'],
  'Haderslev': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','grenaa','skagen','vejle','holstebro'],
  'Vojens': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','haderslev'],
  'Christiansfeld': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','haderslev'],
  'Herning': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','haderslev','holstebro'],
  'Holstebro': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','haderslev','herning'],
  'Skive': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','haderslev'],
  'Hobro': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','haderslev'],
  'Hvide Sande': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg'],
  'Thorsminde': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg'],
  'Brande': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg'],
  'Blåvand': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','skagen','hirtshals'],
  'Copenhagen': ['ribe','esbjerg','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg'],
  'Ribe': ['esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg','vejle','berlin','korea','turkey'],
  'Billund': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg'],
  'Tønder': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg'],
  'Esbjerg': ['ribe','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','silkeborg'],
  'Fredericia': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','viborg','silkeborg'],
  'Kolding': ['ribe','esbjerg','copenhagen','aarhus','horsens','odense','randers','aalborg','fredericia','viborg','silkeborg'],
  'Silkeborg': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','kongens lyngby','haderslev'],
  'Aalborg': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','fredericia','viborg','silkeborg'],
  'Odense': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','randers','aalborg','fredericia','viborg','silkeborg'],
  'Grenaa': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','sønderborg','sonderborg','helsingør'],
  'Middelfart': ['ribe','esbjerg','copenhagen','aarhus','horsens','kolding','odense','randers','aalborg','fredericia','viborg','helsingør'],
  // Romania
  'Ploiești': ['sinaia','peles','buşteni','busteni','bran','brasov','bucegi','pelişor'],
  'Câmpina': ['sinaia','peles','buşteni','busteni','bran','brasov','bucegi','moieciu'],
  'Brăila': ['delta','pelican','mahmudia'],
  'Făgăraș': ['balea','transfagarasan','fagaras mountains','muntii fagaras'],
  'Pitești': ['curtea de arges','curtea de argeş'],
  'Covasna': ['rimetea','toplita','toplița'],
  // Hungary
  'Kecskemét': ['puszta','hortobagy','hortobágy','puskas'],
  'Gyula': ['hortobagy','hortobágy','puskas','puszta'],
  // Slovakia
  'Harmanec': ['cicmany','čičmany'],
  'Osturňa': ['podbiel','ruzomberok','ružomberok'],
  'Malá Franková': ['podbiel'],
  // Greece
  'Abdera': ['kavala','xanthi','thessaloniki'],
  'Nafplio': ['kavala'],
};

function isPhotoOkForCity(city, altText) {
  if (!altText) return true; // No alt text = accept (might be valid)
  const alt = altText.toLowerCase();
  
  // Check specific blocklist for this city
  const blocked = CITY_BLOCKLIST[city];
  if (blocked) {
    for (const badWord of blocked) {
      if (alt.includes(badWord)) {
        return false;
      }
    }
  }
  
  // General: reject if it mentions it's clearly a person
  const personWords = ['portrait','selfie','woman','man ','girl ','boy ','person ','people ','family','couple','child','baby','tourist','model','face '];
  for (const w of personWords) {
    if (alt.includes(w)) return false;
  }
  
  return true;
}

// ============================================================
// City addition config
// ============================================================
const ADDITIONS = [
  // DENMARK
  { city:'Viborg', country:'Denmark', folder:'trips/2022-08-denmark', slug:'viborg', queries:['Viborg Cathedral Denmark twin towers','Viborg Denmark church lake'], need:5, captionPfx:'Viborg' },
  { city:'Haderslev', country:'Denmark', folder:'trips/2020-02-denmark', slug:'haderslev', queries:['Haderslev Denmark cathedral lake half-timbered','Haderslev Denmark'], need:5, captionPfx:'Haderslev' },
  { city:'Vojens', country:'Denmark', folder:'trips/2020-02-denmark', slug:'vojens', queries:['Vojens Denmark town church Jutland','South Jutland Denmark village'], need:5, captionPfx:'Vojens' },
  { city:'Christiansfeld', country:'Denmark', folder:'trips/2020-02-denmark', slug:'christiansfeld', queries:['Christiansfeld Denmark Moravian church','Christiansfeld UNESCO Denmark heritage'], need:5, captionPfx:'Christiansfeld Moravian Settlement' },
  { city:'Herning', country:'Denmark', folder:'trips/2022-08-denmark', slug:'herning', queries:['Herning Denmark HEART museum','Herning Denmark city centre'], need:5, captionPfx:'Herning' },
  { city:'Holstebro', country:'Denmark', folder:'trips/2022-08-denmark', slug:'holstebro', queries:['Holstebro Denmark town art museum','Holstebro Jutland Denmark'], need:5, captionPfx:'Holstebro' },
  { city:'Skive', country:'Denmark', folder:'trips/2022-08-denmark', slug:'skive', queries:['Skive Denmark Limfjord town','Skive fjord Denmark'], need:5, captionPfx:'Skive · Limfjord' },
  { city:'Hobro', country:'Denmark', folder:'trips/2022-08-denmark', slug:'hobro', queries:['Hobro Denmark town Mariager fjord','Hobro Denmark church'], need:5, captionPfx:'Hobro' },
  { city:'Hvide Sande', country:'Denmark', folder:'trips/2022-08-denmark', slug:'hvide-sande', queries:['Hvide Sande Denmark harbour North Sea','Hvide Sande fishing boats'], need:5, captionPfx:'Hvide Sande Harbour' },
  { city:'Thorsminde', country:'Denmark', folder:'trips/2022-08-denmark', slug:'thorsminde', queries:['Thorsminde Denmark fishing village North Sea','Thorsminde harbour Denmark'], need:5, captionPfx:'Thorsminde' },
  { city:'Brande', country:'Denmark', folder:'trips/2022-08-denmark', slug:'brande', queries:['Brande Denmark Jutland town','Brande church Denmark'], need:5, captionPfx:'Brande · Denmark' },
  { city:'Blåvand', country:'Denmark', folder:'trips/2020-02-denmark', slug:'blaavand', queries:['Blåvand lighthouse Denmark North Sea','Blåvand beach dunes Denmark'], need:5, captionPfx:'Blåvand Lighthouse' },
  { city:'Copenhagen', country:'Denmark', folder:'trips/2022-10-denmark', slug:'copenhagen', queries:['Copenhagen Tivoli gardens Denmark','Copenhagen Denmark landmark buildings'], need:2, captionPfx:'Copenhagen' },
  { city:'Ribe', country:'Denmark', folder:'trips/2020-02-denmark', slug:'ribe', queries:['Ribe Denmark medieval cathedral oldest city','Ribe Viking museum Denmark'], need:5, captionPfx:'Ribe Cathedral' },
  { city:'Billund', country:'Denmark', folder:'trips/2022-08-denmark', slug:'billund', queries:['Billund Denmark Legoland colorful','Billund Denmark'], need:3, captionPfx:'Billund' },
  { city:'Tønder', country:'Denmark', folder:'trips/2020-02-denmark', slug:'tonder', queries:['Tønder Denmark historical half-timbered','Tønder church Denmark'], need:2, captionPfx:'Tønder' },
  { city:'Esbjerg', country:'Denmark', folder:'trips/2020-02-denmark', slug:'esbjerg', queries:['Esbjerg Denmark harbour port city','Esbjerg Denmark'], need:2, captionPfx:'Esbjerg' },
  { city:'Fredericia', country:'Denmark', folder:'trips/2020-02-denmark', slug:'fredericia', queries:['Fredericia Denmark garrison town ramparts','Fredericia Denmark town hall'], need:4, captionPfx:'Fredericia' },
  { city:'Kolding', country:'Denmark', folder:'trips/2020-02-denmark', slug:'kolding', queries:['Koldinghus castle Kolding Denmark','Kolding Denmark harbour castle'], need:2, captionPfx:'Koldinghus Castle · Kolding' },
  { city:'Silkeborg', country:'Denmark', folder:'trips/2022-10-denmark', slug:'silkeborg', queries:['Silkeborg Denmark lake river forest','Silkeborg museum Denmark'], need:2, captionPfx:'Silkeborg Lakes' },
  { city:'Aalborg', country:'Denmark', folder:'trips/2022-08-denmark', slug:'aalborg', queries:['Aalborg Denmark waterfront cathedral','Aalborg Denmark historic'], need:1, captionPfx:'Aalborg' },
  { city:'Odense', country:'Denmark', folder:'trips/2022-10-denmark', slug:'odense', queries:['Odense Denmark Hans Christian Andersen house museum','Odense Denmark river canal'], need:2, captionPfx:'Odense' },
  { city:'Grenaa', country:'Denmark', folder:'trips/2022-10-denmark', slug:'grenaa', queries:['Grenaa Denmark harbour fishing','Grenaa harbour Jutland'], need:1, captionPfx:'Grenaa Harbour' },
  { city:'Middelfart', country:'Denmark', folder:'trips/2022-10-denmark', slug:'middelfart', queries:['Middelfart Denmark Little Belt bridge','Middelfart coastal town Denmark'], need:1, captionPfx:'Middelfart · Little Belt' },
  // ALBANIA
  { city:'Berat', country:'Albania', folder:'trips/2024-09-albania-saranda', slug:'berat', queries:['Berat Albania UNESCO old town Ottoman houses','Berat citadel Albania'], need:1, captionPfx:'Berat Old Town' },
  // GREECE
  { city:'Athens', country:'Greece', folder:'trips/2023-07-greece-athens-halkidiki', slug:'athens', queries:['Athens Acropolis Parthenon Greece sunset aerial','Acropolis Athens landmark ancient'], need:2, captionPfx:'Acropolis · Athens' },
  { city:'Abdera', country:'Greece', folder:'trips/2022-07-greece', slug:'abdera', queries:['Abdera ancient ruins Greece Thrace coastal','Abdira Greece ruins Xanthi coastline'], need:4, captionPfx:'Abdera Ancient Site' },
  { city:'Nafplio', country:'Greece', folder:'trips/2022-07-greece', slug:'nafplio', queries:['Nafplio Palamidi fortress old town Greece','Nafplio Bourtzi castle harbour Greece'], need:1, captionPfx:'Nafplio Old Town' },
  // FRANCE
  { city:'Sedan', country:'France', folder:'trips/2019-07-france-sedan', slug:'sedan', queries:['Sedan castle medieval fortress France','Sedan Ardennes France château fort'], need:3, captionPfx:'Sedan Medieval Castle' },
  // GERMANY
  { city:'Munster', country:'Germany', folder:'trips/2022-10-germany', slug:'munster', queries:['Münster Germany Prinzipalmarkt Dom cathedral','Münster Germany historic city centre'], need:1, captionPfx:'Münster' },
  { city:'Landsberg am Lech', country:'Germany', folder:'trips/2026-03-balkans-roadtrip', slug:'landsberg-am-lech', queries:['Landsberg am Lech Bavaria Germany Bayertor','Landsberg Lech Bavaria old town river'], need:1, captionPfx:'Landsberg am Lech' },
  // ROMANIA
  { city:'Ploiești', country:'Romania', folder:'trips/2024-06-romania-wallachia', slug:'ploiesti', queries:['Ploiesti Romania city architecture','Ploiești Romania clock museum hall'], need:5, captionPfx:'Ploiești' },
  { city:'Câmpina', country:'Romania', folder:'trips/2024-06-romania-wallachia', slug:'campina', queries:['Campina Romania Hasdeu castle Prahova','Câmpina Romania Prahova valley city'], need:5, captionPfx:'Câmpina · Prahova Valley' },
  { city:'Brăila', country:'Romania', folder:'trips/2024-06-romania-black-sea', slug:'braila', queries:['Braila Romania city Danube river port','Brăila Romania historic architecture'], need:5, captionPfx:'Brăila · Danube, Romania' },
  { city:'Pitești', country:'Romania', folder:'trips/2024-06-romania-wallachia', slug:'pitesti', queries:['Pitesti Romania city centre Arges','Pitești Romania architecture'], need:3, captionPfx:'Pitești · Romania' },
  { city:'Covasna', country:'Romania', folder:'trips/2019-01-romania', slug:'covasna', queries:['Covasna Romania Transylvania spa mineral springs','Covasna county Romania forest'], need:2, captionPfx:'Covasna · Transylvania' },
  { city:'Făgăraș', country:'Romania', folder:'trips/2024-06-romania-transylvania', slug:'fagaras', queries:['Fagaras fortress citadel Romania town castle','Făgăraș citadel Romania Transylvania'], need:5, captionPfx:'Făgăraș Fortress' },
  { city:'Sfântu Gheorghe', country:'Romania', folder:'trips/2019-01-romania', slug:'sfantu-gheorghe', queries:['Sfantu Gheorghe Romania Covasna architecture church','Sfântu Gheorghe Szekler Romania'], need:1, captionPfx:'Sfântu Gheorghe' },
  // HUNGARY
  { city:'Kecskemét', country:'Hungary', folder:'trips/2026-03-balkans-roadtrip', slug:'kecskemet', queries:['Kecskemét city hall Art Nouveau Hungary ornate','Kecskemét Cifrapalota Hungary architecture'], need:4, captionPfx:'Kecskemét City Hall · Hungary' },
  { city:'Keszthely', country:'Hungary', folder:'trips/2024-08-hungary-roadtrip', slug:'keszthely', queries:['Keszthely Festetics Palace Lake Balaton Hungary','Keszthely town Hungary Balaton'], need:1, captionPfx:'Keszthely · Lake Balaton' },
  { city:'Gyula', country:'Hungary', folder:'trips/2024-08-hungary-roadtrip', slug:'gyula', queries:['Gyula castle Hungary thermal baths fortress','Gyula Hungary medieval fortress castle'], need:4, captionPfx:'Gyula Castle · Hungary' },
  // SLOVAKIA
  { city:'Harmanec', country:'Slovakia', folder:'trips/2025-04-czechia-poland-slovakia-austria', slug:'harmanec', queries:['Harmanec Slovakia cave limestone valley mountain','Harmanec cave Slovakia'], need:1, captionPfx:'Harmanec' },
  { city:'Osturňa', country:'Slovakia', folder:'trips/2025-04-czechia-poland-slovakia-austria', slug:'osturna', queries:['Osturna Slovakia traditional wooden village Tatra','Osturňa old village Slovakia folk architecture'], need:2, captionPfx:'Osturňa Village' },
  { city:'Malá Franková', country:'Slovakia', folder:'trips/2025-04-czechia-poland-slovakia-austria', slug:'mala-frankova', queries:['Malá Franková Slovakia village Tatra foothills','Mala Frankova wooden houses Slovakia'], need:1, captionPfx:'Malá Franková' },
  // UK
  { city:'London', country:'United Kingdom', folder:'trips/2023-07-uk-tour', slug:'london', queries:['London Tower Bridge Thames landmark aerial','London Big Ben Westminster landmark'], need:1, captionPfx:'London Landmark' },
];

// ============================================================
// API helpers
// ============================================================
async function pexelsSearch(query, perPage = 25) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels search ${res.status}: ${query}`);
  const data = await res.json();
  return data.photos || [];
}

async function downloadAndProcess(pexelsId, destPath) {
  const imgUrl = `https://images.pexels.com/photos/${pexelsId}/pexels-photo-${pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=1920`;
  const res = await fetch(imgUrl);
  if (!res.ok) throw new Error(`Download ${res.status} for ID ${pexelsId}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(destPath);
}

function toSlug(str) {
  return (str || '').toLowerCase()
    .replace(/[åäàáâã]/g,'a').replace(/[æ]/g,'ae')
    .replace(/[øöòóôõ]/g,'o').replace(/[ùúûü]/g,'u')
    .replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
    .replace(/[ñ]/g,'n').replace(/[çć]/g,'c')
    .replace(/[ş]/g,'s').replace(/[ğ]/g,'g').replace(/[ł]/g,'l')
    .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i')
    .replace(/ș/g,'s').replace(/ț/g,'t').replace(/ä/g,'a')
    .replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

// ============================================================
// STEP 1: Remove bad photos from catalogue (files already deleted)
// ============================================================
console.log('\n=== STEP 1: Removing bad photos from catalogue ===');
const beforeCount = catalogue.length;
catalogue = catalogue.filter(p => {
  const idFromUrl = p.source?.url?.match(/photo\/(\d+)/)?.[1];
  const idFromSrc = p.src?.match(/-(\d+)\.jpg$/)?.[1];
  const id = idFromUrl || idFromSrc;
  if (id && REMOVE_IDS.has(id)) {
    usedIds.delete(id);
    return false;
  }
  return true;
});
console.log(`Removed ${beforeCount - catalogue.length} catalogue entries`);

// ============================================================
// STEP 2: Merge Calimanesti → Călimănești
// ============================================================
console.log('\n=== STEP 2: Merging Calimanesti → Călimănești ===');
let mergeCount = 0;
catalogue = catalogue.map(p => {
  if (p.place?.city === 'Calimanesti') {
    mergeCount++;
    return {
      ...p,
      place: { ...p.place, city: 'Călimănești', display: 'Călimănești, Romania' },
      caption: p.caption ? p.caption.replace(/Calimanesti/g, 'Călimănești') : p.caption,
    };
  }
  return p;
});
console.log(`Merged ${mergeCount} entries`);

// Save after step 2 in case of later interruption
fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(catalogue, null, 2), 'utf8');
console.log('Intermediate save done');

// ============================================================
// STEP 3: Fix Denmark null city (GPS → Aarhus area)
// ============================================================
console.log('\n=== STEP 3: Fix Denmark null city ===');
catalogue = catalogue.map(p => {
  if (p.src === 'trips/2022-10-denmark/IMG_20221015_165451.jpg' && p.place?.city === null) {
    console.log('  Assigning Aarhus to GPS 56.27856N, 10.47494E (eastern Jutland)');
    return {
      ...p,
      place: { city: 'Aarhus', country: 'Denmark', display: 'Aarhus, Denmark' },
      caption: 'Aarhus area, Denmark · October 2022',
    };
  }
  return p;
});

// ============================================================
// STEP 4: Add replacement photos
// ============================================================
console.log('\n=== STEP 4: Adding replacement photos ===');

for (const cfg of ADDITIONS) {
  const currentCount = catalogue.filter(p =>
    p.place?.city === cfg.city && p.place?.country === cfg.country
  ).length;

  const toAdd = cfg.need;
  console.log(`\n  ${cfg.city} (${cfg.country}): currently ${currentCount}, adding ${toAdd}`);

  const folderAbs = path.join(PHOTO_BASE, cfg.folder);
  if (!fs.existsSync(folderAbs)) {
    fs.mkdirSync(folderAbs, { recursive: true });
  }

  let added = 0;
  const candidatePhotos = [];

  // Search with each query until we have enough candidates
  for (const q of cfg.queries) {
    if (candidatePhotos.length >= toAdd * 3) break; // have plenty of candidates
    try {
      const photos = await pexelsSearch(q, 25);
      for (const p of photos) {
        if (!usedIds.has(String(p.id)) && !candidatePhotos.find(c => c.id === p.id)) {
          candidatePhotos.push(p);
        }
      }
    } catch (e) {
      console.error(`  Search error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // Filter candidates for quality
  const goodPhotos = candidatePhotos.filter(p => isPhotoOkForCity(cfg.city, p.alt));
  console.log(`  Candidates: ${candidatePhotos.length} total, ${goodPhotos.length} after quality filter`);

  for (const photo of goodPhotos) {
    if (added >= toAdd) break;
    const photoId = String(photo.id);
    if (usedIds.has(photoId)) continue;

    const descSlug = toSlug(photo.alt || `${cfg.slug}-photo`).substring(0, 50);
    const filename = `pexels-${cfg.slug}-${descSlug}-${photoId}.jpg`;
    const destPath = path.join(folderAbs, filename);
    const srcRelative = `${cfg.folder}/${filename}`;

    try {
      await downloadAndProcess(photoId, destPath);

      catalogue.push({
        src: srcRelative,
        takenAt: null,
        hasGps: false,
        place: {
          city: cfg.city,
          country: cfg.country,
          display: `${cfg.city}, ${cfg.country}`,
        },
        source: {
          type: 'stock',
          provider: 'Pexels',
          url: `https://www.pexels.com/photo/${photoId}/`,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          license: 'Pexels License',
          licenseUrl: 'https://www.pexels.com/license/',
        },
        caption: `${cfg.captionPfx} · ${cfg.city}, ${cfg.country}`,
      });

      usedIds.add(photoId);
      added++;
      console.log(`    ✓ [${added}/${toAdd}] ${filename}`);
    } catch (e) {
      console.error(`    ✗ ${photoId}: ${e.message}`);
    }
  }

  if (added < toAdd) {
    console.warn(`  ⚠ Only got ${added}/${toAdd} for ${cfg.city}`);
  }
}

// ============================================================
// STEP 5: Save final catalogue
// ============================================================
console.log('\n=== STEP 5: Saving catalogue ===');
fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(catalogue, null, 2), 'utf8');
console.log(`Saved ${catalogue.length} photos`);

// ============================================================
// VERIFICATION
// ============================================================
console.log('\n=== VERIFICATION ===');
const byCityCountry = {};
catalogue.forEach(p => {
  if (p.place?.city) {
    const k = `${p.place.country}|${p.place.city}`;
    byCityCountry[k] = (byCityCountry[k] || 0) + 1;
  }
});
const under5 = Object.entries(byCityCountry).filter(([, v]) => v < 5);
if (under5.length) {
  console.log('UNDER-5 cities remaining:', under5.map(([k, v]) => `${k}:${v}`).join(', '));
} else {
  console.log('✓ All cities >= 5 photos');
}
const nullCities = catalogue.filter(p => p.place && !p.place.city);
if (nullCities.length) {
  console.log(`Null city entries remaining: ${nullCities.length}`);
  nullCities.forEach(p => console.log('  ', p.src));
} else {
  console.log('✓ No null-city entries');
}
console.log(`Total cities: ${Object.keys(byCityCountry).length}`);
console.log(`Total photos: ${catalogue.length}`);
